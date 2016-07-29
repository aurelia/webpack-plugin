'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processAll = undefined;

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var processAll = exports.processAll = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(options) {
    var dependencies, nodeModules, packageJson;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            modulesProcessed = [];
            dependencies = {};
            nodeModules = path.join(options.root, 'node_modules');
            packageJson = path.join(options.root, 'package.json');


            debugDetail('starting resolution: ' + options.root);

            if (!(modulePaths.length === 0)) {
              _context.next = 11;
              break;
            }

            _context.next = 8;
            return installedLocalModulePaths(options);

          case 8:
            _context.t0 = function (line) {
              return path.normalize(line);
            };

            modulePaths = _context.sent.map(_context.t0);

            moduleNames = modulePaths.map(function (line) {
              var split = line.split('/node_modules/');
              return split[split.length - 1];
            });

          case 11:

            debugDetail(moduleNames);
            debugDetail(modulePaths);

            try {
              baseVendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8'));
              moduleRootOverride = baseVendorPkg && baseVendorPkg.aurelia && baseVendorPkg.aurelia.build && baseVendorPkg.aurelia.build.moduleRootOverride || {};
            } catch (_) {}

            getResourcesOfPackage(dependencies, options.root, path.relative(options.root, options.src));
            _context.next = 17;
            return autoresolveTemplates(dependencies, options.root, options.src);

          case 17:
            return _context.abrupt('return', dependencies);

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function processAll(_x2) {
    return ref.apply(this, arguments);
  };
}();

var autoresolveTemplates = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(resources, packagePath, srcPath) {
    var templates, srcRelativeToRoot, _iterator6, _isArray6, _i6, _ref6, htmlFilePath, templateResources, _iterator7, _isArray7, _i7, _ref7, resource;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return getFilesRecursively(srcPath, '.html');

          case 2:
            templates = _context2.sent;
            srcRelativeToRoot = path.relative(packagePath, srcPath);
            _iterator6 = templates, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : (0, _getIterator3.default)(_iterator6);

          case 5:
            if (!_isArray6) {
              _context2.next = 11;
              break;
            }

            if (!(_i6 >= _iterator6.length)) {
              _context2.next = 8;
              break;
            }

            return _context2.abrupt('break', 34);

          case 8:
            _ref6 = _iterator6[_i6++];
            _context2.next = 15;
            break;

          case 11:
            _i6 = _iterator6.next();

            if (!_i6.done) {
              _context2.next = 14;
              break;
            }

            return _context2.abrupt('break', 34);

          case 14:
            _ref6 = _i6.value;

          case 15:
            htmlFilePath = _ref6;
            templateResources = resolveTemplateResources(htmlFilePath, srcPath);
            _iterator7 = templateResources, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : (0, _getIterator3.default)(_iterator7);

          case 18:
            if (!_isArray7) {
              _context2.next = 24;
              break;
            }

            if (!(_i7 >= _iterator7.length)) {
              _context2.next = 21;
              break;
            }

            return _context2.abrupt('break', 32);

          case 21:
            _ref7 = _iterator7[_i7++];
            _context2.next = 28;
            break;

          case 24:
            _i7 = _iterator7.next();

            if (!_i7.done) {
              _context2.next = 27;
              break;
            }

            return _context2.abrupt('break', 32);

          case 27:
            _ref7 = _i7.value;

          case 28:
            resource = _ref7;

            processFromPath(resources, resource.path, resource, packagePath, srcRelativeToRoot);

          case 30:
            _context2.next = 18;
            break;

          case 32:
            _context2.next = 5;
            break;

          case 34:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function autoresolveTemplates(_x8, _x9, _x10) {
    return ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('upath');
var fileSystem = require('fs');
var readdir = require('recursive-readdir');
var assign = _assign2.default || require('object.assign');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var execa = require('execa');
var debug = require('debug')('webpack-plugin');
var debugDetail = require('debug')('webpack-plugin/details');

var modulesProcessed = [];
var baseVendorPkg = void 0;
var moduleRootOverride = {};
var modulePaths = [];
var moduleNames = [];

function installedRootModulePaths(moduleDir) {
  var ensurePackageJson = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

  var rootModules = fileSystem.readdirSync(moduleDir).filter(function (dir) {
    return !/^\./.test(dir);
  });

  var scoped = rootModules.filter(function (dir) {
    return dir.indexOf('@') === 0;
  });

  rootModules = rootModules.filter(function (dir) {
    return dir.indexOf('@') !== 0;
  }).map(function (dir) {
    return path.resolve(moduleDir, dir);
  });

  scoped.forEach(function (dir) {
    rootModules = rootModules.concat(installedRootModulePaths(path.resolve(moduleDir, dir), false));
  });

  if (ensurePackageJson) {
    rootModules = rootModules.filter(function (dir) {
      var stats = void 0;
      try {
        stats = fileSystem.statSync(path.join(dir, 'package.json'));
      } catch (_) {}
      return stats && stats.isFile();
    });
  }

  return rootModules;
}

function installedLocalModulePaths(options) {
  return execa('npm', ['ls', '--parseable'], { cwd: options.root }).then(function (res) {
    return installedRootModulePaths(path.join(options.root, 'node_modules')).concat(res.stdout.split('\n').filter(function (line, i) {
      return i !== 0 && !!line;
    }));
  }).catch(function (res) {
    return installedRootModulePaths(path.join(options.root, 'node_modules')).concat(res.stdout.split('\n').filter(function (line, i) {
      return i !== 0 && !!line;
    }));
  });
}

function getFilesRecursively(targetDir, extension) {
  return new Promise(function (resolve, reject) {
    return readdir(targetDir, [function (file, stats) {
      return path.extname(file) !== extension && !stats.isDirectory();
    }], function (error, files) {
      return error ? reject(error) : resolve(files.map(function (file) {
        return path.normalize(file);
      }));
    });
  });
}

function ensurePathHasExtension(fullPath) {
  var stats = void 0;
  var fullPathTest = fullPath;

  debugDetail('testing file for existence: ' + fullPath);

  try {
    stats = fileSystem.statSync(fullPathTest);
  } catch (_) {}

  if (!stats || stats.isDirectory()) try {
    stats = fileSystem.statSync(fullPathTest = fullPath + '.js');
  } catch (_) {}

  if (!stats || stats.isDirectory()) try {
    stats = fileSystem.statSync(fullPathTest = fullPath + '.ts');
  } catch (_) {}

  if (stats && stats.isFile()) {
    return fullPathTest;
  }
  return null;
}

function getPackageJson(packagePath) {
  var packageJson = null;
  if (!packageJson) {
    try {
      packageJson = JSON.parse(fileSystem.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    } catch (_) {}
  }
  return packageJson;
}

function getPackageAureliaResources(packageJson) {
  return packageJson && packageJson.aurelia && packageJson.aurelia.build && packageJson.aurelia.build.resources || [];
}

function getPackageMainDir(packagePath) {
  var packageJson = getPackageJson(packagePath);
  if (!packageJson) {
    console.error('Unable to read the file: ' + packagePath);
    return null;
  }
  var packageMain = packageJson.aurelia && packageJson.aurelia.main && packageJson.aurelia.main['native-modules'] || packageJson.main || packageJson.browser;
  return packageMain ? path.dirname(path.join(packagePath, packageMain)) : null;
}

function pathIsLocal(pathToCheck) {
  return pathToCheck.indexOf('.') === 0;
}

function getRealPathUniversal(fromPath, packagePath, relativeToDir) {
  var realPath = getRealPath(fromPath, packagePath, relativeToDir);
  if (!realPath && !pathIsLocal(fromPath)) realPath = getRealModulePath(fromPath);
  return realPath;
}

function getRealModulePath(fromPath) {
  var fullPath = void 0;
  var fromPathSplit = fromPath.split('/');
  var moduleName = fromPathSplit.shift();
  var modulePathIndex = moduleNames.indexOf(moduleName);

  if (modulePathIndex === -1 && fromPathSplit.length > 0) {
    moduleName += '/' + fromPathSplit.shift();
    modulePathIndex = moduleNames.indexOf(moduleName);
  }

  var modulePath = void 0;
  if (modulePathIndex !== -1) {
    modulePath = modulePaths[modulePathIndex];
    if (fromPathSplit.length === 0) {
      return { path: fromPath, source: moduleName, moduleName: moduleName, modulePath: modulePath };
    } else {
      fromPath = fromPathSplit.join('/');
      if (moduleRootOverride[moduleName]) {
        fullPath = path.join(modulePath, moduleRootOverride[moduleName], fromPath);
      } else {
        fullPath = path.join(modulePath, fromPath);
      }
      fullPath = ensurePathHasExtension(fullPath);
      if (!fullPath) {
        var fullMainRelativeRootDir = getPackageMainDir(modulePath);
        if (fullMainRelativeRootDir) {
          fullPath = path.join(fullMainRelativeRootDir, fromPath);
          fullPath = ensurePathHasExtension(fullPath);
        }
      }
    }
  }
  return fullPath && modulePath ? { path: fromPath, source: fullPath, moduleName: moduleName, modulePath: modulePath } : undefined;
}

function getRealPath(fromPath, packagePath, relativeToDir) {
  var fullPath = path.join(relativeToDir ? path.joinSafe(packagePath, relativeToDir) : packagePath, fromPath);
  var pathWithExt = ensurePathHasExtension(fullPath);
  return pathWithExt ? { path: fromPath, source: pathWithExt } : undefined;
}

function extractBundleResourceData(resource) {
  var out = {};
  if (resource.hasOwnProperty('bundle')) {
    out.bundle = resource.bundle;
  }
  if (resource.hasOwnProperty('lazy')) {
    out.lazy = resource.lazy;
  }
  return out;
}

function processFromPath(resources, fromPath, resource, packagePath, relativeToDir, overrideBlock) {
  if (resources[fromPath]) return;

  var realPath = getRealPathUniversal(fromPath, packagePath, relativeToDir);
  var initialRealPath = realPath;

  if (realPath) {
    debug('<' + path.basename(packagePath) + '> ' + fromPath + ' => ' + path.relative(packagePath, realPath.source));
    resources[fromPath] = (0, _assign2.default)({}, resource, realPath, overrideBlock || {});

    var localSrcPath = realPath.modulePath || path.join(packagePath, relativeToDir);
    var localRelativeToDir = relativeToDir;

    if (realPath.modulePath) {
      getResourcesOfPackage(resources, realPath.modulePath, undefined, overrideBlock || extractBundleResourceData(resource), realPath.moduleName);

      if (moduleRootOverride[realPath.moduleName]) {
        localRelativeToDir = moduleRootOverride[realPath.moduleName];
        localSrcPath = path.join(realPath.modulePath, localRelativeToDir);
      }
    }

    if (path.changeExt(realPath.source, 'html') !== realPath.source) {
      var fromPathHtml = path.addExt(fromPath, 'html');
      if (!resources[fromPathHtml]) {
        realPath = getRealPathUniversal(fromPathHtml, packagePath, relativeToDir);
        if (realPath) {
          debug('<' + path.basename(packagePath) + '> ' + realPath.path + ' => ' + path.relative(packagePath, realPath.source));
          resources[fromPathHtml] = (0, _assign2.default)({}, resource, realPath, overrideBlock || {});
        }
      }
    }

    if (realPath) {
      var htmlResources = resolveTemplateResources(realPath.source, localSrcPath, realPath.moduleName);
      for (var _iterator = htmlResources, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var htmlResource = _ref;

        processFromPath(resources, htmlResource.path, htmlResource, packagePath, localRelativeToDir, overrideBlock || extractBundleResourceData(htmlResource));
      }
    }

    var fromPathJs = path.addExt(fromPath, 'js');
    realPath = getRealPathUniversal(fromPathJs, packagePath, relativeToDir);
    if (realPath) {
      debug('<' + path.basename(packagePath) + '> ' + realPath.path + ' => ' + path.relative(packagePath, realPath.source));
      resources[fromPathJs] = (0, _assign2.default)({}, resource, realPath, overrideBlock || {});
    }

    var fromPathTs = path.addExt(fromPath, 'ts');
    realPath = getRealPathUniversal(fromPathTs, packagePath, relativeToDir);
    if (realPath) {
      debug('<' + path.basename(packagePath) + '> ' + realPath.path + ' => ' + path.relative(packagePath, realPath.source));
      resources[fromPathTs] = (0, _assign2.default)({}, resource, realPath, overrideBlock || {});
    }

    var fromPathCss = path.addExt(fromPath, 'css');
    realPath = getRealPathUniversal(fromPathCss, packagePath, relativeToDir);
    if (realPath) {
      debug('<' + path.basename(packagePath) + '> ' + realPath.path + ' => ' + path.relative(packagePath, realPath.source));
      resources[fromPathCss] = (0, _assign2.default)({}, resource, realPath, overrideBlock || {});
    }
  } else {
      console.error('Unable to resolve', fromPath);
    }
}

function getResourcesOfPackage() {
  var resources = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var packagePath = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
  var relativeToDir = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
  var overrideBlock = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];
  var externalModule = arguments.length <= 4 || arguments[4] === undefined ? undefined : arguments[4];

  if (modulesProcessed.indexOf(packagePath) !== -1) {
    return;
  }
  modulesProcessed.push(packagePath);

  var packageJson = void 0;
  if (!packageJson) {
    try {
      packageJson = JSON.parse(fileSystem.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
    } catch (_) {}
  }

  if (packageJson) {
    if (packageJson.aurelia && packageJson.aurelia.build && packageJson.aurelia.build.resources) {
      for (var _iterator2 = packageJson.aurelia.build.resources, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var resource = _ref2;

        resource = resource instanceof Object && !Array.isArray(resource) ? resource : { path: resource };
        var fromPaths = Array.isArray(resource.path) ? resource.path : [resource.path];
        for (var _iterator3 = fromPaths, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : (0, _getIterator3.default)(_iterator3);;) {
          var _ref3;

          if (_isArray3) {
            if (_i3 >= _iterator3.length) break;
            _ref3 = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) break;
            _ref3 = _i3.value;
          }

          var fromPath = _ref3;

          debug('<' + (externalModule || path.basename(packagePath)) + '> [resolving] \'' + fromPath + '\'');

          if (externalModule) {
            if (fromPath.indexOf('.') !== 0) fromPath = fixRelativeFromPath(fromPath, undefined, undefined, externalModule);else fromPath = path.join(externalModule, fromPath);
          }

          processFromPath(resources, fromPath, resource, packagePath, relativeToDir, overrideBlock);
        }
      }
    }

    if (packageJson.dependencies) {
      for (var _iterator4 = (0, _getOwnPropertyNames2.default)(packageJson.dependencies), _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : (0, _getIterator3.default)(_iterator4);;) {
        var _ref4;

        if (_isArray4) {
          if (_i4 >= _iterator4.length) break;
          _ref4 = _iterator4[_i4++];
        } else {
          _i4 = _iterator4.next();
          if (_i4.done) break;
          _ref4 = _i4.value;
        }

        var _moduleName = _ref4;

        var _modulePathIndex = moduleNames.indexOf(_moduleName);
        if (_modulePathIndex !== -1) {
          var _modulePath = modulePaths[_modulePathIndex];
          getResourcesOfPackage(resources, _modulePath, undefined, undefined, _moduleName);
        }
      }

      if (!externalModule) {
        for (var _iterator5 = (0, _getOwnPropertyNames2.default)(packageJson.dependencies), _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : (0, _getIterator3.default)(_iterator5);;) {
          var _ref5;

          if (_isArray5) {
            if (_i5 >= _iterator5.length) break;
            _ref5 = _iterator5[_i5++];
          } else {
            _i5 = _iterator5.next();
            if (_i5.done) break;
            _ref5 = _i5.value;
          }

          var moduleName = _ref5;

          var modulePathIndex = moduleNames.indexOf(moduleName);
          if (modulePathIndex !== -1) {
            var modulePath = modulePaths[modulePathIndex];

            if (!resources[moduleName] && getPackageMainDir(modulePath)) {
              resources[moduleName] = { path: moduleName, source: moduleName, moduleName: moduleName, modulePath: modulePath };
            }
          }
        }
      }
    }
  }
}

function fixRelativeFromPath(fromPath, realSrcPath, realParentPath, externalModule) {
  var fromPathSplit = fromPath.split('/');
  if (moduleNames.indexOf(fromPathSplit[0]) !== -1 || fromPathSplit.length > 1 && moduleNames.indexOf(path.join(fromPathSplit[0], fromPathSplit[1])) !== -1) {
    return fromPath;
  } else {
    if (fromPath.indexOf('.') == 0) {
      fromPath = path.joinSafe('./', path.relative(realSrcPath, realParentPath), fromPath);
    }
    return externalModule ? path.join(externalModule, fromPath) : fromPath;
  }
}

var templateStringRegex = /\${.+}/;

function resolveTemplateResources(htmlFilePath, srcPath, externalModule) {
  var html = fileSystem.readFileSync(htmlFilePath);
  var $ = cheerio.load(html);
  var relativeParent = path.dirname(htmlFilePath);
  var resources = [];

  var requireTags = $('require');
  requireTags.each(function (index) {
    var fromPath = requireTags[index].attribs.from;
    if (templateStringRegex.test(fromPath)) return;
    var isLazy = requireTags[index].attribs.hasOwnProperty('lazy');
    var bundle = requireTags[index].attribs.bundle;
    if (fromPath) resources.push({ path: fixRelativeFromPath(fromPath, srcPath, relativeParent, externalModule), lazy: isLazy, bundle: bundle });
  });

  var viewModelRequests = $('[view-model]');
  viewModelRequests.each(function (index) {
    var fromPath = viewModelRequests[index].attribs['view-model'];
    if (templateStringRegex.test(fromPath)) return;
    var isLazy = viewModelRequests[index].attribs.hasOwnProperty('lazy');
    var bundle = viewModelRequests[index].attribs.bundle;
    if (fromPath) resources.push({ path: fixRelativeFromPath(fromPath, srcPath, relativeParent, externalModule), lazy: isLazy, bundle: bundle });
  });

  var viewRequests = $('[view]');
  viewRequests.each(function (index) {
    var fromPath = viewRequests[index].attribs.view;
    if (templateStringRegex.test(fromPath)) return;
    var isLazy = viewRequests[index].attribs.hasOwnProperty('lazy');
    var bundle = viewRequests[index].attribs.bundle;
    if (fromPath) resources.push({ path: fixRelativeFromPath(fromPath, srcPath, relativeParent, externalModule), lazy: isLazy, bundle: bundle });
  });

  return resources;
}