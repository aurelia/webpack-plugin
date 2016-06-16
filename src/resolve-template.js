var path = require('upath');
var fileSystem = require('fs');
var readdir = require('recursive-readdir');
var assign = Object.assign || require('object.assign');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var pathSep = '/';

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

  // resolve all requirements of .html templates
  assign(dependencies, await autoresolveTemplates(options.src, nodeModules, options.lazy, options.bundle));

  if (baseVendorPkg) {
    // load resources of all 'dependencies' defined in package.json:
    if (baseVendorPkg.dependencies) {
      for (let moduleName of Object.getOwnPropertyNames(baseVendorPkg.dependencies)) {
        if (modulesProcessed.indexOf(moduleName) === -1) {
          modulesProcessed.push(moduleName);
          const vendorPath = path.resolve(options.root, 'node_modules', moduleName);
          const vendorPkgPath = path.resolve(vendorPath, 'package.json');
          const vendorPkg = JSON.parse(fileSystem.readFileSync(vendorPkgPath, 'utf8'));
          if (vendorPkg.browser || vendorPkg.main) {
            // only load the dependencies that have either main or browser fields defined
            assign(dependencies, await getDependency(moduleName, options.root, options.root, [nodeModules], null, packageJson, options.lazy, options.bundle, undefined, undefined, true));
          }
        }
      }
    }
    
    // try to load any resources explicitly defined in package.json:
    // this is done last so that bundle overrides will take over
    if (baseVendorPkg.aurelia && baseVendorPkg.aurelia.build && baseVendorPkg.aurelia.build.resources) {
      for (let resource of baseVendorPkg.aurelia.build.resources) {
        let fromPaths = resource instanceof Object ? [resource.path] : [resource];
        if (fromPaths[0] instanceof Array) {
          fromPaths = fromPaths[0];
        }
        for (let fromPath of fromPaths) {
          let moduleName = fromPath.split(pathSep)[0];
          if (modulesProcessed.indexOf(moduleName) === -1) {
            modulesProcessed.push(moduleName);
            let rootAlias = resource.root ? path.resolve(options.root, 'node_modules', moduleName, resource.root) : undefined;
            if (!rootAlias && baseVendorPkg.aurelia.build.moduleRootOverride && baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]) {
              rootAlias = path.resolve(options.root, 'node_modules', moduleName, baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]);
            }
            assign(dependencies, await getDependency(fromPath, options.src, options.src, [nodeModules], null, packageJson, options.lazy || resource.lazy, options.bundle || resource.bundle, rootAlias));
          }
        }
      }
    }
  }
  
  return dependencies;
}

async function autoresolveTemplates(srcPath, nodeModules, isLazy, bundleName) {
  const dependencies = {};
  const templates = await getFilesRecursively(srcPath, '.html');
  
  for (let htmlFilePath of templates) {
    assign(dependencies, await resolveTemplate(htmlFilePath, srcPath, [nodeModules], undefined, isLazy, bundleName));
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
 * @param  {array[]} nodeModulesList
 * @param  {string} fromWithinModule
 */
async function resolveTemplate(htmlFilePath, srcPath, nodeModulesList, fromWithinModule, isParentLazy, bundleName, rootAlias) {
  const dependencies = {};
  const html = fileSystem.readFileSync(htmlFilePath);
  const $ = cheerio.load(html);
  const relativeParent = path.dirname(htmlFilePath);
  const resources = [];
  
  // e.g. <require from="./file">
  // e.g. <require from="bootstrap" lazy bundle="vendor">
  const requireTags = $('require');
  requireTags.each(index => {
    const fromPath = requireTags[index].attribs.from;
    const isLazy = requireTags[index].attribs.hasOwnProperty('lazy');
    const bundle = requireTags[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fromPath, lazy: isLazy, bundle });
  });
  
  // e.g. <compose view-model="file">
  const viewModelRequests = $('[view-model]');
  viewModelRequests.each(index => {
    const fromPath = viewModelRequests[index].attribs['view-model'];
    const isLazy = viewModelRequests[index].attribs.hasOwnProperty('lazy');
    const bundle = viewModelRequests[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fromPath, lazy: isLazy, bundle });
  });
  
  // e.g. <compose view="file.html">
  const viewRequests = $('[view]');
  viewRequests.each(index => {
    const fromPath = viewRequests[index].attribs.view;
    const isLazy = viewRequests[index].attribs.hasOwnProperty('lazy');
    const bundle = viewRequests[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fromPath, lazy: isLazy, bundle });
  });
  
  // for (let fromPath of fromPaths) {
  for (let resource of resources) {
    assign(dependencies, await getDependency(resource.path, relativeParent, srcPath, nodeModulesList, fromWithinModule, htmlFilePath, isParentLazy || resource.lazy, bundleName || resource.bundle, rootAlias));
  }
  return dependencies;
}

function getPath(input, lazy, bundle) {
  const extension = path.extname(input);
  let output = '';
  // for .css files force the request to the css loader (https://github.com/aurelia/webpack-plugin/issues/11#issuecomment-212578861)
  if (extension == ".css")
    output += `!!css!`;
  if (lazy || bundle)
    output += `bundle?`;
  if (lazy)
    output += `lazy`;
  if (lazy && bundle)
    output += `&`;
  if (bundle)
    output += `name=${bundle}`;
  if (lazy || bundle)
    output += `!`;
  return `${output}${input}`
}

function getPathWithoutExtension(input) {
  return path.trimExt(input);
}

/**
 * @param  {string} fromPath
 * @param  {string} relativeParent
 * @param  {string} srcPath
 * @param  {Array<string>} nodeModulesList
 * @param  {string|void} fromWithinModule
 * @param  {string|void} requestedBy (used for debugging only)
 * @param  {boolean|void} isLazy
 * @param  {string|void} bundleName
 */
async function getDependency(fromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isLazy, bundleName, rootAlias, triedToCorrectPath, doNotAdd) {
  const dependencies = {};
  const requestedByRelativeToSrc = path.relative(srcPath, requestedBy);
  
  let split = requestedByRelativeToSrc.split(pathSep);
  if (split[0] == 'node_modules') {
    // handle edge case when adding htmlCounterpart
    nodeModulesList = nodeModulesList.concat([path.join(srcPath, 'node_modules')]);
    srcPath = path.join(srcPath, split[0], split[1]);
    fromWithinModule = split[1];
  }
  
  async function addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath) {
    if (/*filesProcessed.indexOf(webpackRequireString) == -1 && */webpackRequireString.indexOf('..') == -1) {
      dependencies[webpackRequireString] = webpackPath;
      console.log((fromWithinModule ? '<' + fromWithinModule + '> ' + '[' + path.basename(requestedBy) : '[' + requestedByRelativeToSrc) + '] required "' + webpackRequireString + '" from "' + webpackPath.replace(optionsGlobal.root + pathSep, '') + '".')
      filesProcessed.push(webpackRequireString);
    }
    
    if (htmlCounterpart) {
      let htmlWebpackRequireString = './' + getPathWithoutExtension(webpackRequireString) + '.html';
      
      dependencies[htmlWebpackRequireString] = getPath(htmlCounterpart, isLazy, bundleName);
      console.log((fromWithinModule ? '<' + fromWithinModule + '> ' + '[' + path.basename(requestedBy) : '[' + requestedByRelativeToSrc) + '] required "' + htmlWebpackRequireString + '" from "' + htmlCounterpart.replace(optionsGlobal.root + pathSep, '') + '".');

      // TODO: tracking for recursive processing with last module precedence //
      // if (filesProcessed.indexOf(htmlWebpackRequireString) >= 0) return;
      filesProcessed.push(htmlWebpackRequireString);

      assign(dependencies, await resolveTemplate(htmlCounterpart, modulePath || srcPath, nodeModulesList, moduleName || fromWithinModule, isLazy, bundleName, rootAlias));
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
    webpackPath = getPath(fullPath, isLazy, bundleName);
    
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
        
        webpackPath = getPath(moduleName, isLazy, bundleName);
        webpackRequireString = './' + fromPath;
        
      } else if (stats.isFile()) {
        // require the file directly
        moduleName = fromPath.split(pathSep)[0];
        modulePath = path.resolve(nodeModulesList[nodeModulesIndex], moduleName);
        
        webpackPath = getPath(fullPath, isLazy, bundleName);
        webpackRequireString = './' + fromPath;
      }
      
      if (moduleName && modulePath) {
        const packageJson = path.resolve(modulePath, 'package.json');
        let vendorPkg;
        try { vendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8')) } catch (_) {}
        if (vendorPkg) {
          const mainDir = vendorPkg.main ? path.resolve(modulePath, path.dirname(vendorPkg.main)) : null;

          if (!rootAlias) {
            if (vendorPkg.aurelia && vendorPkg.aurelia.build && vendorPkg.aurelia.build.root){
              rootAlias = path.resolve(modulePath, vendorPkg.aurelia.build.root);
            } else if (baseVendorPkg && baseVendorPkg.aurelia && baseVendorPkg.aurelia.build && baseVendorPkg.aurelia.build.moduleRootOverride && baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]) {
              rootAlias = path.resolve(srcPath, baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]);
            } else {
              rootAlias = mainDir;
            }

            if (rootAlias === modulePath)
              rootAlias = null;
          }
          
          if (!doNotAdd)
            await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath);
          
          if (rootAlias && stats.isFile()) {
            webpackRequireString = './' + moduleName + '/' + path.relative(rootAlias, fullPath);
            await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
            
            if (extension == '.js' || extension == '.ts') {
              webpackRequireString = './' + moduleName + '/' + path.relative(rootAlias, getPathWithoutExtension(fullPath));
              await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);
            }
          }
          
          if (modulesProcessed.indexOf(modulePath) == -1) {
            modulesProcessed.push(modulePath);
            
            // try to also load any files and templates defined in package.json:
            try {
              // check if there are nested 'node_modules' under the package's directory
              const ownPath = path.resolve(modulePath, 'node_modules');
              fileSystem.statSync(ownPath);
              packagesOwnNodeModules = ownPath;
            } catch (_) {}
            
            if (vendorPkg.aurelia && vendorPkg.aurelia.build && vendorPkg.aurelia.build.resources) {
              for (let resource of vendorPkg.aurelia.build.resources) {
                let resourcePath = resource instanceof Object ? resource.path : resource;
                let useRootAlias = rootAlias;
                // least important: package's global override
                if (vendorPkg.aurelia.build.moduleRootOverride && vendorPkg.aurelia.build.moduleRootOverride[moduleName]) {
                  useRootAlias = path.resolve(modulePath, vendorPkg.aurelia.build.moduleRootOverride[moduleName]);
                }
                // second least important: package resource's override
                if (resource.root) {
                  useRootAlias = path.resolve(modulePath, resource.root);
                }
                // most important: parent-most package's override
                if (baseVendorPkg && baseVendorPkg.aurelia && baseVendorPkg.aurelia.build.moduleRootOverride && baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]) {
                  useRootAlias = path.resolve(modulePath, baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]);
                }
                if (useRootAlias === modulePath) {
                  useRootAlias = null;
                }
                
                assign(dependencies, await getDependency(resourcePath, modulePath, modulePath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName, packageJson, isLazy || resource.lazy, bundleName || resource.bundle, useRootAlias));
              }
            }
          }
        }
      } else {
        if (!doNotAdd)
          await addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath);
      }
    }
  }
  
  if (!webpackPath) {
    const pathParts = fromPath.split(pathSep);
    if (!pathIsLocal && pathParts.length > 1 && rootAlias && rootAlias !== srcPath) {
      // the path provided was without root, 
      // lets try to correct it and re-run
      
      const moduleName = pathParts.shift();
      let relativeRootAlias = path.relative(srcPath, rootAlias);
      let relativeRootSplit = relativeRootAlias.split(pathSep);
      if (relativeRootSplit[0] == '..') {
        // when importing local resources from package.json
        // the paths are relative to /src
        // thus relative-root will be '../node_modules/...'
        relativeRootSplit.shift();  
      }
      while (relativeRootSplit[0] == 'node_modules') {
        relativeRootSplit.shift(); // 'node_modules'
        relativeRootSplit.shift(); // assert === moduleName
      }
      relativeRootAlias = relativeRootSplit.join('/');
      
      const rootedFromPath = path.join(moduleName, relativeRootAlias, pathParts.join(pathSep));
      if (rootedFromPath !== fromPath && !triedToCorrectPath) {
        return await getDependency(rootedFromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isLazy, bundleName, rootAlias, true);
      }
    }
    console.error('[' + (fromWithinModule ? '<' + fromWithinModule + '>' : path.relative(srcPath, requestedBy)) + '] wants to require "' + fromPath + '", which does not exist.');
  } else {
    if (extension == ".html") {
      // if we were referred to .html, get dependencies recursively:
      assign(dependencies, await resolveTemplate(fullPath, modulePath || srcPath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName || fromWithinModule, isLazy, bundleName, rootAlias));
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
