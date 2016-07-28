'use strict';
const path = require('upath');
const fileSystem = require('fs');
const readdir = require('recursive-readdir');
const assign = Object.assign || require('object.assign');
const Promise = require('bluebird');
const cheerio = require('cheerio');
const execa = require('execa');
const debug = require('debug')('webpack-plugin');
const debugDetail = require('debug')('webpack-plugin/details');

/**
 * this global var is reset every run in case of circular dependencies between files
 */
let modulesProcessed = [];
let baseVendorPkg;
let moduleRootOverride = {};
let modulePaths = [];
let moduleNames = [];

function installedRootModulePaths(moduleDir, ensurePackageJson = true) {
  let rootModules = fileSystem.readdirSync(moduleDir)
    .filter(dir => !(/^\./.test(dir)));
  
  let scoped = rootModules
    .filter(dir => dir.indexOf('@') === 0);
  
  rootModules = rootModules
    .filter(dir => dir.indexOf('@') !== 0)
    .map(dir => path.resolve(moduleDir, dir));
  
  scoped.forEach(dir => {
    rootModules = rootModules.concat(installedRootModulePaths(path.resolve(moduleDir, dir), false));
  });
  
  if (ensurePackageJson) {
    // ensure package.json exists:
    rootModules = rootModules
      .filter(dir => {
        let stats;
        try { stats = fileSystem.statSync(path.join(dir, 'package.json')) } catch (_) {}
        return stats && stats.isFile();
      });
  }
  
  return rootModules;
}

function installedLocalModulePaths(options) {
  return execa('npm', ['ls', '--parseable'], { cwd: options.root })
    .then(res => installedRootModulePaths(path.join(options.root, 'node_modules')).concat(res.stdout.split('\n').filter((line, i) => i !== 0 && !!line)))
    .catch(res => installedRootModulePaths(path.join(options.root, 'node_modules')).concat(res.stdout.split('\n').filter((line, i) => i !== 0 && !!line)));
}

function getFilesRecursively(targetDir, extension) {
  return new Promise((resolve, reject) => 
    readdir(targetDir, [(file, stats) => 
      path.extname(file) !== extension && !stats.isDirectory()
    ], (error, files) => error ? reject(error) : resolve(files.map(file => path.normalize(file)))));
}

/**
 * Static dependency analyzer + build resources resolver.
 * Recursively adds dependencies declared in the package and in all of its .html templates.
 * @param {{ root: string, src: string }} options
 * 
 * @description It returns a Promise of an Object with a list of dependencies, where the keys are the require names and values are Objects containing:
 *
 * ```js
 * {
 *   path, // required path/resource (full src-relative string)
 *   source, // path to the target file
 *   bundle, // name of the bundle specified (optional)
 *   lazy, // whether the user asked for lazy loading
 *   moduleName, // name of the module (if path required from under an external module)
 *   modulePath, // path of the module (like above)
 * }
 * ```
 */
export async function processAll(options) {
  modulesProcessed = [];
  const dependencies = {};
  const nodeModules = path.join(options.root, 'node_modules');
  const packageJson = path.join(options.root, 'package.json');

  debugDetail(`starting resolution: ${options.root}`);

  if (modulePaths.length === 0) {
    modulePaths = (await installedLocalModulePaths(options))
      .map(line => path.normalize(line));
    moduleNames = modulePaths
      .map(line => {
        const split = line.split('/node_modules/');
        return split[split.length - 1];
      });
  }

  debugDetail(moduleNames);
  debugDetail(modulePaths);

  try {
    baseVendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8'));
    moduleRootOverride = baseVendorPkg && baseVendorPkg.aurelia && baseVendorPkg.aurelia.build && baseVendorPkg.aurelia.build.moduleRootOverride || {};
  } catch (_) {}

  getResourcesOfPackage(dependencies, options.root, path.relative(options.root, options.src));
  await autoresolveTemplates(dependencies, options.root, options.src);
  return dependencies;
}

function ensurePathHasExtension(fullPath) {
  let stats;
  let fullPathTest = fullPath;

  debugDetail(`testing file for existence: ${fullPath}`);

  try { stats = fileSystem.statSync(fullPathTest) } catch (_) {}
  
  if (!stats || stats.isDirectory())
    try { stats = fileSystem.statSync(fullPathTest = fullPath + '.js') } catch (_) {}
  
  if (!stats || stats.isDirectory())
    try { stats = fileSystem.statSync(fullPathTest = fullPath + '.ts') } catch (_) {}
  
  if (stats && stats.isFile()) {
    return fullPathTest;
  }
  return null;
}

function getPackageJson(packagePath) {
  let packageJson = null;
  if (!packageJson) {
    try { packageJson = JSON.parse(fileSystem.readFileSync(path.join(packagePath, 'package.json'), 'utf8')) } catch (_) {}
  }
  return packageJson;
}

function getPackageAureliaResources(packageJson) {
  return packageJson && packageJson.aurelia && packageJson.aurelia.build && packageJson.aurelia.build.resources || [];
}

function getPackageMainDir(packagePath) {
  const packageJson = getPackageJson(packagePath);
  if (!packageJson) {
    console.error('Unable to read the file: ' + packagePath);
    return null;
  }
  const packageMain = packageJson.aurelia && packageJson.aurelia.main && packageJson.aurelia.main['native-modules'] || packageJson.main || packageJson.browser;
  return packageMain ? path.dirname(path.join(packagePath, packageMain)) : null;
}

function pathIsLocal(pathToCheck) {
  return pathToCheck.indexOf('.') === 0;
}

function getRealPathUniversal(fromPath, packagePath, relativeToDir) {
  let realPath = getRealPath(fromPath, packagePath, relativeToDir);
  if (!realPath && !pathIsLocal(fromPath))
    realPath = getRealModulePath(fromPath);
  return realPath;
}

function getRealModulePath(fromPath) {
  // fallback to module:
  let fullPath;
  let fromPathSplit = fromPath.split('/');
  let moduleName = fromPathSplit.shift();
  let modulePathIndex = moduleNames.indexOf(moduleName);
  
  if (modulePathIndex === -1 && fromPathSplit.length > 0) {
    // the module might be scoped, let's see:
    moduleName += `/${fromPathSplit.shift()}`;
    modulePathIndex = moduleNames.indexOf(moduleName);
  }
  
  let modulePath;
  if (modulePathIndex !== -1) {
    modulePath = modulePaths[modulePathIndex];
    if (fromPathSplit.length === 0) {
      // simple external module require
      // TODO: can it be a module name or must it be a filepath?
      return { path: fromPath, source: moduleName, moduleName, modulePath };
    } else {
      // trim the module name from 'fromPath'
      fromPath = fromPathSplit.join('/');
      if (moduleRootOverride[moduleName]) {
        // inject root override (alias path) between module name and path
        fullPath = path.join(modulePath, moduleRootOverride[moduleName], fromPath);
      } else {
        fullPath = path.join(modulePath, fromPath);
      }
      fullPath = ensurePathHasExtension(fullPath);
      if (!fullPath) {
        const fullMainRelativeRootDir = getPackageMainDir(modulePath);
        if (fullMainRelativeRootDir) {
          fullPath = path.join(fullMainRelativeRootDir, fromPath);
          fullPath = ensurePathHasExtension(fullPath);
        }
      }
    }
  }
  return fullPath && modulePath ? { path: fromPath, source: fullPath, moduleName, modulePath } : undefined;
}

function getRealPath(fromPath, packagePath, relativeToDir) {
  const fullPath = path.join(relativeToDir ? path.joinSafe(packagePath, relativeToDir) : packagePath, fromPath);
  const pathWithExt = ensurePathHasExtension(fullPath);
  return pathWithExt ? { path: fromPath, source: pathWithExt } : undefined;
}

function extractBundleResourceData(resource) {
  const out = {};
  if (resource.hasOwnProperty('bundle')) {
    out.bundle = resource.bundle;
  }
  if (resource.hasOwnProperty('lazy')) {
    out.lazy = resource.lazy;
  }
  return out;
}

function processFromPath(resources, fromPath, resource, packagePath, relativeToDir, overrideBlock) {
  // vanilla:
  if (resources[fromPath]) return;

  let realPath = getRealPathUniversal(fromPath, packagePath, relativeToDir);
  let initialRealPath = realPath;
  // debug(`Trying to import from: ${path.basename(packagePath)} / ${relativeToDir} / ${fromPath}`);
  if (realPath) {
    debug(`<${path.basename(packagePath)}> ${fromPath} => ${path.relative(packagePath, realPath.source)}`);
    resources[fromPath] = Object.assign({}, resource, realPath, overrideBlock || {});

    let localSrcPath = realPath.modulePath || path.join(packagePath, relativeToDir);
    let localRelativeToDir = relativeToDir;

    if (realPath.modulePath) {
      // recursively add resources
      // TODO: async?
      getResourcesOfPackage(resources, realPath.modulePath, undefined, overrideBlock || extractBundleResourceData(resource), realPath.moduleName);

      if (moduleRootOverride[realPath.moduleName]) {
        localRelativeToDir = moduleRootOverride[realPath.moduleName];
        localSrcPath = path.join(realPath.modulePath, localRelativeToDir);
      }
    }

    // is the initially resolved file an HTML file?
    if (path.changeExt(realPath.source, 'html') !== realPath.source) {
      // .html:
      let fromPathHtml = path.addExt(fromPath, 'html');
      if (!resources[fromPathHtml]) {
        realPath = getRealPathUniversal(fromPathHtml, packagePath, relativeToDir);
        if (realPath) {
          debug(`<${path.basename(packagePath)}> ${realPath.path} => ${path.relative(packagePath, realPath.source)}`);
          resources[fromPathHtml] = Object.assign({}, resource, realPath, overrideBlock || {});
        }
      }
    }
    
    if (realPath) {
      // requested path was a html that needs analyzing for its own deps:
      let htmlResources = resolveTemplateResources(realPath.source, localSrcPath, realPath.moduleName);
      for (let htmlResource of htmlResources) {
        processFromPath(resources, htmlResource.path, htmlResource, packagePath, localRelativeToDir, overrideBlock || extractBundleResourceData(htmlResource))
      }
    }

    // if (path.changeExt(initialRealPath.source, 'js') !== initialRealPath.source && path.changeExt(initialRealPath.source, 'ts') !== initialRealPath.source) {
    
    // .js:
    let fromPathJs = path.addExt(fromPath, 'js');
    realPath = getRealPathUniversal(fromPathJs, packagePath, relativeToDir);
    if (realPath) {
      debug(`<${path.basename(packagePath)}> ${realPath.path} => ${path.relative(packagePath, realPath.source)}`);
      resources[fromPathJs] = Object.assign({}, resource, realPath, overrideBlock || {});
    }
    // .ts:
    let fromPathTs = path.addExt(fromPath, 'ts');
    realPath = getRealPathUniversal(fromPathTs, packagePath, relativeToDir);
    if (realPath) {
      debug(`<${path.basename(packagePath)}> ${realPath.path} => ${path.relative(packagePath, realPath.source)}`);
      resources[fromPathTs] = Object.assign({}, resource, realPath, overrideBlock || {});
    }
    // .css:
    let fromPathCss = path.addExt(fromPath, 'css');
    realPath = getRealPathUniversal(fromPathCss, packagePath, relativeToDir);
    if (realPath) {
      debug(`<${path.basename(packagePath)}> ${realPath.path} => ${path.relative(packagePath, realPath.source)}`);
      resources[fromPathCss] = Object.assign({}, resource, realPath, overrideBlock || {});
    }

    // }
  } else {
    console.error('Unable to resolve', fromPath);
  }
}

function getResourcesOfPackage(resources = {}, packagePath = undefined, relativeToDir = '', overrideBlock = undefined, externalModule = undefined) {
  if (modulesProcessed.indexOf(packagePath) !== -1) {
    return;
  }
  modulesProcessed.push(packagePath);

  let packageJson;
  if (!packageJson) {
    try { packageJson = JSON.parse(fileSystem.readFileSync(path.join(packagePath, 'package.json'), 'utf8')) } catch (_) {}
  }

  if (packageJson) {
    // try to load any resources explicitly defined in package.json:
    // this is done last so that bundle overrides will take over
    if (packageJson.aurelia && packageJson.aurelia.build && packageJson.aurelia.build.resources) {
      for (let resource of packageJson.aurelia.build.resources) {
        resource = resource instanceof Object && !Array.isArray(resource) ? resource : { path: resource };
        let fromPaths = Array.isArray(resource.path) ? resource.path : [resource.path];
        for (let fromPath of fromPaths) {
          debug(`<${externalModule || path.basename(packagePath)}> [resolving] '${fromPath}'`);
          
          if (externalModule) {
            if (fromPath.indexOf('.') !== 0) // origin unsure, could be external //
              fromPath = fixRelativeFromPath(fromPath, undefined, undefined, externalModule);
            else // we know it will be local from within the module
              fromPath = path.join(externalModule, fromPath);
          }
            
          processFromPath(resources, fromPath, resource, packagePath, relativeToDir, overrideBlock);
        }
      }
    }

    // recursively load resources of all 'dependencies' defined in package.json:
    if (packageJson.dependencies) {
      for (let moduleName of Object.getOwnPropertyNames(packageJson.dependencies)) {
        const modulePathIndex = moduleNames.indexOf(moduleName);
        if (modulePathIndex !== -1) {
          const modulePath = modulePaths[modulePathIndex];
          getResourcesOfPackage(resources, modulePath, undefined, undefined /* might add defaults from plugin config */, moduleName);
        }
      }

      if (!externalModule) {
        // iterate again, now to add modules themselves if not yet added:
        for (let moduleName of Object.getOwnPropertyNames(packageJson.dependencies)) {
          const modulePathIndex = moduleNames.indexOf(moduleName);
          if (modulePathIndex !== -1) {
            const modulePath = modulePaths[modulePathIndex];
            // add the module itself
            if (!resources[moduleName] && getPackageMainDir(modulePath)) {
              resources[moduleName] = { path: moduleName, source: moduleName, moduleName, modulePath };
            }
          }
        }
      }
    }
  }
}

async function autoresolveTemplates(resources, packagePath, srcPath) {
  const templates = await getFilesRecursively(srcPath, '.html');
  const srcRelativeToRoot = path.relative(packagePath, srcPath);

  for (let htmlFilePath of templates) {
    let templateResources = resolveTemplateResources(htmlFilePath, srcPath);
    for (let resource of templateResources) {
      processFromPath(resources, resource.path, resource, packagePath, srcRelativeToRoot);
    }
  }
}

function fixRelativeFromPath(fromPath, realSrcPath, realParentPath, externalModule) {
  let fromPathSplit = fromPath.split('/');
  if (moduleNames.indexOf(fromPathSplit[0]) !== -1 || (fromPathSplit.length > 1 && moduleNames.indexOf(path.join(fromPathSplit[0], fromPathSplit[1])) !== -1)) {
    // already a module reference, non-relative, leave as-is:
    return fromPath;
  } else {
    // if starts with './' then relative to the template, else relative to '/src'
    if (fromPath.indexOf('.') == 0) {
      // debugDetail(`fixing relative path: ${fromPath} | relative dir: ${path.relative(realSrcPath, realParentPath)}`)
      fromPath = path.joinSafe('./', path.relative(realSrcPath, realParentPath), fromPath);
    }
    return externalModule ? path.join(externalModule, fromPath) : fromPath;
  }
}

const templateStringRegex = /\${.+}/;

/**
 * Generates key-value dependency pairs of:
 * - <require from="paths">
 * - view-model="file"
 * - view="file.html"
 * 
 * @param  {string} htmlFilePath
 */
function resolveTemplateResources(htmlFilePath, srcPath, externalModule) {
  const html = fileSystem.readFileSync(htmlFilePath);
  const $ = cheerio.load(html);
  const relativeParent = path.dirname(htmlFilePath);
  const resources = [];
  
  // e.g. <require from="./file">
  // e.g. <require from="bootstrap" lazy bundle="vendor">
  const requireTags = $('require');
  requireTags.each(index => {
    const fromPath = requireTags[index].attribs.from;
    if (templateStringRegex.test(fromPath)) return;
    const isLazy = requireTags[index].attribs.hasOwnProperty('lazy');
    const bundle = requireTags[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fixRelativeFromPath(fromPath, srcPath, relativeParent, externalModule), lazy: isLazy, bundle });
  });
  
  // e.g. <compose view-model="file">
  const viewModelRequests = $('[view-model]');
  viewModelRequests.each(index => {
    const fromPath = viewModelRequests[index].attribs['view-model'];
    if (templateStringRegex.test(fromPath)) return;
    const isLazy = viewModelRequests[index].attribs.hasOwnProperty('lazy');
    const bundle = viewModelRequests[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fixRelativeFromPath(fromPath, srcPath, relativeParent, externalModule), lazy: isLazy, bundle });
  });
  
  // e.g. <compose view="file.html">
  const viewRequests = $('[view]');
  viewRequests.each(index => {
    const fromPath = viewRequests[index].attribs.view;
    if (templateStringRegex.test(fromPath)) return;
    const isLazy = viewRequests[index].attribs.hasOwnProperty('lazy');
    const bundle = viewRequests[index].attribs.bundle;
    if (fromPath)
      resources.push({ path: fixRelativeFromPath(fromPath, srcPath, relativeParent, externalModule), lazy: isLazy, bundle });
  });
  
  return resources;
}
