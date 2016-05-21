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
  const dependencies = {};
  const nodeModules = path.join(options.root, 'node_modules');
  try {
    // try to load any resources explicitly defined in package.json:
    const packageJson = path.join(options.root, 'package.json');
    const vendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8'));
    if (vendorPkg.aurelia && vendorPkg.aurelia.resources) {
      for (let resource of vendorPkg.aurelia.resources) {
        let fromPath = resource instanceof Object ? resource.path : resource;
        assign(dependencies, await getDependency(fromPath, options.root, options.root, [nodeModules], null, packageJson, options.async || resource.async, options.bundle || resource.bundle));
      }
    }
  } catch (_) {}
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
async function resolveTemplate(htmlFilePath, srcPath, nodeModulesList, fromWithinModule, isParentAsync, bundleName) {
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
    assign(dependencies, await getDependency(resource.path, relativeParent, srcPath, nodeModulesList, fromWithinModule, htmlFilePath, isParentAsync || resource.async, bundleName || resource.bundle));
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
async function getDependency(fromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isAsync, bundleName) {
  const dependencies = {};
  let key;
  let value;
  let fullPathOrig = path.join(relativeParent, fromPath);
  let fullPath = fullPathOrig;
  let fullPathNoExt = path.join(path.parse(fullPath).dir, path.parse(fullPath).name);
  let extOrig = path.extname(fullPath)
  const pathIsLocal = fromPath.startsWith('./');
  let htmlCounterpart;
  let stats;
  
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
    if (filesProcessed.indexOf(fullPath) >= 0) return dependencies;
    filesProcessed.push(fullPath);
    
    // load relative file
    key = getPath(fullPath, isAsync, bundleName);
    
    if (!fromWithinModule) {
      // if user used './somepath' then traverse from local directory; else 'somepath', he meant /src/somepath
      value = './' + (pathIsLocal ? path.relative(srcPath, path.join(relativeParent, fromPath)) : fromPath);
    } else {
      // resolves to: 'some-module/some-file'
      value = './' + fromWithinModule + '/' + path.relative(srcPath, path.join(relativeParent, fromPath));
      
      const extension = path.extname(fullPath);
      if (extension == ".html") {
        // if we were referred to .html, get dependencies recursively:
        assign(dependencies, await resolveTemplate(fullPath, srcPath, nodeModulesList, fromWithinModule, isAsync, bundleName));
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
      fullPathNoExt = path.join(path.parse(fullPath).dir, path.parse(fullPath).name);
      
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
      if (filesProcessed.indexOf(fullPath) >= 0) return dependencies;
      filesProcessed.push(fullPath);
      
      let moduleName;
      let modulePath;
      
      // check if parent is a node_module directory
      if (stats.isDirectory() && path.basename(path.dirname(fullPath)) === 'node_modules') {
        // we're requiring a package (webpack will handle resolving main)
        key = getPath(path.basename(fullPath), isAsync, bundleName);
        
        value = './' + fromPath;
        modulePath = fullPath;
        
      } else if (stats.isFile()) {
        // require the file directly
        key = getPath(fullPath, isAsync, bundleName);
        
        value = './' + fromPath;
        
        moduleName = fromPath.split('/')[0];
        modulePath = path.resolve(nodeModulesList[nodeModulesIndex], moduleName);

        const extension = path.extname(fullPath);        
        if (extension == ".html") {
          // if we were referred to .html, get dependencies recursively:
          assign(dependencies, await resolveTemplate(fullPath, srcPath, nodeModulesList, fromWithinModule, isAsync, bundleName));
        }
      }
      
      if (moduleName) {
        try {
          // try to also load any files and templates defined in package.json:
          const packageJson = path.resolve(modulePath, 'package.json');
          const vendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8'));
          
          let packagesOwnNodeModules;
          try {
            // check if there are nested 'node_modules' under the package's directory
            let ownPath = path.resolve(modulePath, 'node_modules');
            fileSystem.statSync(ownPath);
            packagesOwnNodeModules = ownPath;
          } catch (_) {}
          
          if (vendorPkg.aurelia && vendorPkg.aurelia.resources) {
            for (let resource of vendorPkg.aurelia.resources) {
              let resourcePath = resource instanceof Object ? resource.path : resource;
              assign(dependencies, await getDependency(resourcePath, modulePath, modulePath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName, packageJson, isAsync || resource.async, bundleName || resource.bundle));
            }
          }
        } catch (_) {}
      }
    }
  }
  
  
  if (!key) {
    console.error('[' + (fromWithinModule ? '<' + fromWithinModule + '>' : path.relative(srcPath, requestedBy)) + '] wants to require "' + fromPath + '", which does not exist.')
  } else {
    dependencies[key] = value;
    console.log('[' + (fromWithinModule ? '<' + fromWithinModule + '>' : path.relative(srcPath, requestedBy)) + '] loaded "' + key + '" as "' + value + '".')
    if (htmlCounterpart) {
      dependencies[htmlCounterpart] = './' + path.join(path.parse(value).dir, path.parse(value).name) + '.html';
      console.log('[' + (fromWithinModule ? '<' + fromWithinModule + '>' : path.relative(srcPath, requestedBy)) + '] loaded "' + htmlCounterpart + '" as "' + dependencies[htmlCounterpart] + '".')
      assign(dependencies, await resolveTemplate(htmlCounterpart, srcPath, nodeModulesList, fromWithinModule, isAsync, bundleName));
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
