var path = require('path');
var fileSystem = require('fs');
var readdir = require('recursive-readdir');
var assign = Object.assign || require('object.assign');
var Promise = require('bluebird');
var cheerio = require('cheerio');

/**
 * this global var is reset every run in case of circular dependencies between files
 */
let filesProcessed = [];
let modulesProcessed = [];
/**
 * this is used for displaying logs only
 */
let optionsGlobal = {};
let baseVendorPkg;

function getFilesRecursively(targetDir, extension) {
  return new Promise((resolve, reject) => 
    readdir(targetDir, [(file, stats) => 
      path.extname(file) !== extension && !stats.isDirectory()
    ], (error, files) => error ? reject(error) : resolve(files)));
}

/**
 * Recursively adds dependencies declared in the package and in all of its .html templates.
 * @param {{ root: string, src: string }} options
 */
async function processAll(options) {
  filesProcessed = [];
  modulesProcessed = [];
  optionsGlobal = options;
  const dependencies = {};
  const nodeModules = path.join(options.root, 'node_modules');
  const packageJson = path.join(options.root, 'package.json');
  
  if (!baseVendorPkg) {
    try { baseVendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8')) } catch (_) {}
  }

  if (baseVendorPkg) {
    // try to load any resources explicitly defined in package.json:
    if (baseVendorPkg.aurelia && baseVendorPkg.aurelia.resources) {
      for (let resource of baseVendorPkg.aurelia.resources) {
        let fromPath = resource instanceof Object ? resource.path : resource;
        let moduleName = fromPath.split(path.sep)[0];
        let rootAlias = resource.root ? path.resolve(options.root, 'node_modules', moduleName, resource.root) : undefined;
        if (!rootAlias && baseVendorPkg.aurelia.moduleRootOverride && baseVendorPkg.aurelia.moduleRootOverride[moduleName]) {
          rootAlias = path.resolve(options.root, 'node_modules', moduleName, baseVendorPkg.aurelia.moduleRootOverride[moduleName]);
        }
        assign(dependencies, await getDependency(fromPath, options.root, options.root, [nodeModules], null, packageJson, options.async || resource.async, options.bundle || resource.bundle, rootAlias));
      }
    }
    
    // load all 'dependencies' defined in package.json:
    if (baseVendorPkg.dependencies) {
      for (let moduleName of Object.getOwnPropertyNames(baseVendorPkg.dependencies)) {
        const vendorPath = path.resolve(options.root, 'node_modules', moduleName);
        const vendorPkgPath = path.resolve(vendorPath, 'package.json');
        const vendorPkg = JSON.parse(fileSystem.readFileSync(vendorPkgPath, 'utf8'));
        if (vendorPkg.browser || vendorPkg.main) {
          // only load the dependencies that have either main or browser fields defined
          assign(dependencies, await getDependency(moduleName, options.root, options.root, [nodeModules], null, packageJson, options.async, options.bundle));
        }
      }
    }
    // TASK: first try-load without root-alias, then with 
  }
  
  // resolve all requirements of .html templates
  assign(dependencies, await autoresolveTemplates(options.src, nodeModules, options.async, options.bundle));
  return dependencies;
}

async function autoresolveTemplates(srcPath, nodeModules, isAsync, bundleName) {
  const dependencies = {};
  const templates = await getFilesRecursively(srcPath, '.html');
  
  for (let htmlFilePath of templates) {
    assign(dependencies, await resolveTemplate(htmlFilePath, srcPath, [nodeModules], undefined, isAsync, bundleName));
  }
  return dependencies;
}

/**
 * Generates key-value dependency pairs of:
 * - <require from="paths">
 * - view-model="file"
 * - view="file.html"
 * - files requested by dependencies of those above
 * 
 * @param  {string} htmlFilePath
 * @param  {string} srcPath
 * @param  {Array<string>} nodeModulesList
 * @param  {string} fromWithinModule
 */
async function resolveTemplate(htmlFilePath, srcPath, nodeModulesList, fromWithinModule, isParentAsync, bundleName, rootAlias) {
  const dependencies = {};
  const html = fileSystem.readFileSync(htmlFilePath);
  const $ = cheerio.load(html);
  const relativeParent = path.dirname(htmlFilePath);
  const resources = [];
  
  // e.g. <require from="./file">
  // e.g. <require from="bootstrap" async bundle="vendor">
  const requireTags = $('require');
  requireTags.each(index => {
    const fromPath = requireTags[index].attribs.from;
    const isAsync = requireTags[index].attribs.hasOwnProperty('async');
    const bundle = requireTags[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fromPath, async: isAsync, bundle });
  });
  
  // e.g. <compose view-model="file">
  const viewModelRequests = $('[view-model]');
  viewModelRequests.each(index => {
    const fromPath = viewModelRequests[index].attribs['view-model'];
    const isAsync = viewModelRequests[index].attribs.hasOwnProperty('async');
    const bundle = viewModelRequests[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fromPath, async: isAsync, bundle });
  });
  
  // e.g. <compose view="file.html">
  const viewRequests = $('[view]');
  viewRequests.each(index => {
    const fromPath = viewRequests[index].attribs.view;
    const isAsync = viewRequests[index].attribs.hasOwnProperty('async');
    const bundle = viewRequests[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fromPath, async: isAsync, bundle });
  });
  
  // for (let fromPath of fromPaths) {
  for (let resource of resources) {
    assign(dependencies, await getDependency(resource.path, relativeParent, srcPath, nodeModulesList, fromWithinModule, htmlFilePath, isParentAsync || resource.async, bundleName || resource.bundle, rootAlias));
  }
  return dependencies;
}

function getPath(input, async, bundle) {
  const extension = path.extname(input);
  let output = '';
  // for .css files force the request to the raw loader (https://github.com/aurelia/webpack-plugin/issues/11#issuecomment-212578861)
  if (extension == ".css")
    output += `!!raw!`;
  if (async || bundle)
    output += `bundle?`;
  if (async)
    output += `lazy`;
  if (async && bundle)
    output += `&`;
  if (bundle)
    output += `name=${bundle}`;
  if (async || bundle)
    output += `!`;
  return `${output}${input}`
}

function getPathWithoutExtension(input) {
  return path.join(path.parse(input).dir, path.parse(input).name);
}

/**
 * @param  {string} fromPath
 * @param  {string} relativeParent
 * @param  {string} srcPath
 * @param  {Array<string>} nodeModulesList
 * @param  {string|void} fromWithinModule
 * @param  {string|void} requestedBy (used for debugging only)
 * @param  {boolean|void} isAsync
 * @param  {string|void} bundleName
 */
async function getDependency(fromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isAsync, bundleName, rootAlias, triedToCorrectPath) {
  const dependencies = {};
  const requestedByRelativeToSrc = path.relative(srcPath, requestedBy);
  
  let split = requestedByRelativeToSrc.split(path.sep);
  if (split[0] == 'node_modules') {
    // handle edge case when adding htmlCounterpart
    nodeModulesList = nodeModulesList.concat([path.join(srcPath, 'node_modules')]);
    srcPath = path.join(srcPath, split[0], split[1]);
    fromWithinModule = split[1];
  }
  
  async function addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath) {
    if (filesProcessed.indexOf(webpackRequireString) == -1 && webpackRequireString.indexOf('..') == -1) {
      dependencies[webpackRequireString] = webpackPath;
      console.log((fromWithinModule ? '<' + fromWithinModule + '> ' + '[' + path.basename(requestedBy) : '[' + requestedByRelativeToSrc) + '] required "' + webpackRequireString + '" from "' + webpackPath.replace(optionsGlobal.root + path.sep, '') + '".')
      filesProcessed.push(webpackRequireString);
    }
    
    if (htmlCounterpart) {
      let htmlWebpackRequireString = './' + getPathWithoutExtension(webpackRequireString) + '.html';
      if (filesProcessed.indexOf(htmlWebpackRequireString) >= 0) return;
      
      dependencies[htmlWebpackRequireString] = htmlCounterpart;
      console.log((fromWithinModule ? '<' + fromWithinModule + '> ' + '[' + path.basename(requestedBy) : '[' + requestedByRelativeToSrc) + '] required "' + htmlWebpackRequireString + '" from "' + htmlCounterpart.replace(optionsGlobal.root + path.sep, '') + '".');
      filesProcessed.push(htmlWebpackRequireString);

      assign(dependencies, await resolveTemplate(htmlCounterpart, modulePath || srcPath, nodeModulesList, moduleName || fromWithinModule, isAsync, bundleName, rootAlias));
    }
  }
  
  let webpackPath;
  let webpackRequireString;
  let fullPathOrig = path.join(relativeParent, fromPath);
  let fullPath = fullPathOrig;
  let fullPathNoExt = getPathWithoutExtension(fullPath);
  let extOrig = path.extname(fullPath)
  const pathIsLocal = fromPath.startsWith('./') || fromPath.startsWith('../');
  let htmlCounterpart;
  let stats;
  let extension;
  let moduleName;
  let modulePath;
  let packagesOwnNodeModules;
  
  try { stats = fileSystem.statSync(fullPath) } catch (_) {}
  
  if (!stats)
    try { stats = fileSystem.statSync(fullPath = fullPathOrig + '.js') } catch (_) {}
  
  if (!stats)
    try { stats = fileSystem.statSync(fullPath = fullPathOrig + '.ts') } catch (_) {}
  
  if (extOrig != '.html') {
    try {
      fileSystem.statSync(fullPathNoExt + '.html');
      htmlCounterpart = fullPathNoExt + '.html';
    } catch (_) {}
  }
  
  if (stats && stats.isFile()) {
    extension = path.extname(fullPath);
    
    // load relative file
    webpackPath = getPath(fullPath, isAsync, bundleName);
    
    if (!fromWithinModule) {
      // if user used './somepath' then traverse from local directory; else 'somepath', he meant /src/somepath
      
      webpackRequireString = './' + (pathIsLocal ? path.relative(srcPath, path.join(relativeParent, fromPath)) : fromPath);
      await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
      
      if (rootAlias) {
        webpackRequireString = './' + (pathIsLocal ? path.relative(rootAlias, path.join(relativeParent, fromPath)) : fromPath);
        await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
      }
      
    } else {
      // resolves to: 'some-module/some-file'
      
      webpackRequireString = './' + fromWithinModule + '/' + path.relative(srcPath, path.join(relativeParent, fromPath));      
      await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
      
      if (rootAlias) {
        webpackRequireString = './' + fromWithinModule + '/' + path.relative(rootAlias, path.join(relativeParent, fromPath));
        await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
      }
    }
  }
  else if (!pathIsLocal) {
    // at this point the local file doesn't exist and we know that it doesn't start with './'
    // it's a file under a package or a package itself, 
    // e.g.: <require from="bootstrap/file.css">
    
    stats = undefined;
    let nodeModulesIndex = nodeModulesList.length;
    while (!stats && nodeModulesIndex--) {
      let nodeModules = nodeModulesList[nodeModulesIndex]
      fullPathOrig = path.join(nodeModules, fromPath);
      fullPath = fullPathOrig;
      fullPathNoExt = getPathWithoutExtension(fullPath);
      
      try { stats = fileSystem.statSync(fullPath) } catch (_) {}
      
      if (!stats)
        try { stats = fileSystem.statSync(fullPath = fullPathOrig + '.js') } catch (_) {}
      
      if (extOrig != '.html') {
        try {
          fileSystem.statSync(fullPathNoExt + '.html');
          htmlCounterpart = fullPathNoExt + '.html';
        } catch (_) {}
      }
    }
    
    if (stats) {
      extension = path.extname(fullPath);
      
      // check if parent is a node_module directory
      if (stats.isDirectory() && path.basename(path.dirname(fullPath)) === 'node_modules') {
        // we're requiring a package (webpack will handle resolving main)
        moduleName = path.basename(fullPath);
        modulePath = fullPath;
        
        webpackPath = getPath(moduleName, isAsync, bundleName);
        webpackRequireString = './' + fromPath;
        
      } else if (stats.isFile()) {
        // require the file directly
        moduleName = fromPath.split('/')[0];
        modulePath = path.resolve(nodeModulesList[nodeModulesIndex], moduleName);
        
        webpackPath = getPath(fullPath, isAsync, bundleName);
        webpackRequireString = './' + fromPath;
      }
      
      await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath);
      
      if (moduleName && modulePath) {
        const packageJson = path.resolve(modulePath, 'package.json');
        let vendorPkg;
        try { vendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8')) } catch (_) {}
        if (vendorPkg) {
          const mainDir = vendorPkg.main ? path.resolve(modulePath, path.dirname(vendorPkg.main)) : null;
          
          if (!rootAlias) {
            rootAlias = (vendorPkg.aurelia && vendorPkg.aurelia.root && path.resolve(modulePath, vendorPkg.aurelia.root)) || mainDir;
            
            if (rootAlias === modulePath)
              rootAlias = null;
          }
          
          if (rootAlias && stats.isFile()) {
            webpackRequireString = './' + moduleName + '/' + path.relative(rootAlias, fullPath);
            await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
            
            if (extension == '.js' || extension == '.ts') {
              webpackRequireString = './' + moduleName + '/' + path.relative(rootAlias, getPathWithoutExtension(fullPath));
              await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
            }
          }
          
          if (modulesProcessed.indexOf(modulePath) == -1) {
            // try to also load any files and templates defined in package.json:
            try {
              // check if there are nested 'node_modules' under the package's directory
              const ownPath = path.resolve(modulePath, 'node_modules');
              fileSystem.statSync(ownPath);
              packagesOwnNodeModules = ownPath;
            } catch (_) {}
            
            if (vendorPkg.aurelia && vendorPkg.aurelia.resources) {
              for (let resource of vendorPkg.aurelia.resources) {
                let resourcePath = resource instanceof Object ? resource.path : resource;
                let useRootAlias = rootAlias;
                // least important: package's global override
                if (vendorPkg.aurelia.moduleRootOverride && vendorPkg.aurelia.moduleRootOverride[moduleName]) {
                  useRootAlias = path.resolve(modulePath, vendorPkg.aurelia.moduleRootOverride[moduleName]);
                }
                // second least important: package resource's override
                if (resource.root) {
                  useRootAlias = path.resolve(modulePath, resource.root);
                }
                // most important: parent-most package's override
                if (baseVendorPkg && baseVendorPkg.aurelia && baseVendorPkg.aurelia.moduleRootOverride && baseVendorPkg.aurelia.moduleRootOverride[moduleName]) {
                  useRootAlias = path.resolve(modulePath, baseVendorPkg.aurelia.moduleRootOverride[moduleName]);
                }
                if (useRootAlias === modulePath) {
                  useRootAlias = null;
                }
                
                assign(dependencies, await getDependency(resourcePath, modulePath, modulePath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName, packageJson, isAsync || resource.async, bundleName || resource.bundle, useRootAlias));
              }
            }
            modulesProcessed.push(modulePath);
          }
        }
      }
    }
  }
  
  if (!webpackPath) {
    const pathParts = fromPath.split('/');
    if (!pathIsLocal && pathParts.length > 1 && rootAlias && rootAlias !== srcPath) {
      // the path provided was without root, 
      // lets try to correct it and re-run
      
      const moduleName = pathParts.shift();
      let relativeRootAlias = path.relative(srcPath, rootAlias);
      let relativeRootSplit = relativeRootAlias.split(path.sep);
      while (relativeRootSplit[0] == 'node_modules') {
        relativeRootSplit.shift(); // 'node_modules'
        relativeRootSplit.shift(); // assert === moduleName
      }
      relativeRootAlias = relativeRootSplit.join('/');
      const rootedFromPath = path.join(moduleName, relativeRootAlias, pathParts.join(path.sep));
      if (rootedFromPath !== fromPath && !triedToCorrectPath) {
        return await getDependency(rootedFromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isAsync, bundleName, rootAlias, true);
      }
    }
    console.error('[' + (fromWithinModule ? '<' + fromWithinModule + '>' : path.relative(srcPath, requestedBy)) + '] wants to require "' + fromPath + '", which does not exist.');
  } else {
    if (extension == ".html") {
      // if we were referred to .html, get dependencies recursively:
      assign(dependencies, await resolveTemplate(fullPath, modulePath || srcPath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName || fromWithinModule, isAsync, bundleName, rootAlias));
    }
  }
  
  return dependencies;
}

module.exports = {
  getFilesRecursively,
  processAll,
  autoresolveTemplates,
  resolveTemplate,
  getDependency
}
