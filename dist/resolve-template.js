'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var processAll = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(options) {
    var dependencies, nodeModules, packageJson, _iterator, _isArray, _i, _ref, moduleName, vendorPath, vendorPkgPath, vendorPkg, _iterator2, _isArray2, _i2, _ref2, resource, fromPaths, _iterator3, _isArray3, _i3, _ref3, fromPath, _moduleName, rootAlias;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            filesProcessed = [];
            modulesProcessed = [];
            optionsGlobal = options;
            dependencies = {};
            nodeModules = path.join(options.root, 'node_modules');
            packageJson = path.join(options.root, 'package.json');
            _context.t0 = dependencies;
            _context.next = 9;
            return autoresolveTemplates(options.src, nodeModules, options.lazy, options.bundle);

          case 9:
            _context.t1 = _context.sent;
            assign(_context.t0, _context.t1);


            if (!baseVendorPkg) {
              try {
                baseVendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8'));
              } catch (_) {}
            }

            if (!baseVendorPkg) {
              _context.next = 76;
              break;
            }

            if (!baseVendorPkg.dependencies) {
              _context.next = 37;
              break;
            }

            _iterator = (0, _getOwnPropertyNames2.default)(baseVendorPkg.dependencies), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);

          case 15:
            if (!_isArray) {
              _context.next = 21;
              break;
            }

            if (!(_i >= _iterator.length)) {
              _context.next = 18;
              break;
            }

            return _context.abrupt('break', 37);

          case 18:
            _ref = _iterator[_i++];
            _context.next = 25;
            break;

          case 21:
            _i = _iterator.next();

            if (!_i.done) {
              _context.next = 24;
              break;
            }

            return _context.abrupt('break', 37);

          case 24:
            _ref = _i.value;

          case 25:
            moduleName = _ref;
            vendorPath = path.resolve(options.root, 'node_modules', moduleName);
            vendorPkgPath = path.resolve(vendorPath, 'package.json');
            vendorPkg = JSON.parse(fileSystem.readFileSync(vendorPkgPath, 'utf8'));

            if (!(vendorPkg.browser || vendorPkg.main)) {
              _context.next = 35;
              break;
            }

            _context.t2 = dependencies;
            _context.next = 33;
            return getDependency(moduleName, options.root, options.root, [nodeModules], null, packageJson, options.lazy, options.bundle, undefined, undefined, true);

          case 33:
            _context.t3 = _context.sent;
            assign(_context.t2, _context.t3);

          case 35:
            _context.next = 15;
            break;

          case 37:
            if (!(baseVendorPkg.aurelia && baseVendorPkg.aurelia.build && baseVendorPkg.aurelia.build.resources)) {
              _context.next = 76;
              break;
            }

            _iterator2 = baseVendorPkg.aurelia.build.resources, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);

          case 39:
            if (!_isArray2) {
              _context.next = 45;
              break;
            }

            if (!(_i2 >= _iterator2.length)) {
              _context.next = 42;
              break;
            }

            return _context.abrupt('break', 76);

          case 42:
            _ref2 = _iterator2[_i2++];
            _context.next = 49;
            break;

          case 45:
            _i2 = _iterator2.next();

            if (!_i2.done) {
              _context.next = 48;
              break;
            }

            return _context.abrupt('break', 76);

          case 48:
            _ref2 = _i2.value;

          case 49:
            resource = _ref2;
            fromPaths = resource instanceof Object ? [resource.path] : [resource];

            if (fromPaths[0] instanceof Array) {
              fromPaths = fromPaths[0];
            }
            _iterator3 = fromPaths, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : (0, _getIterator3.default)(_iterator3);

          case 53:
            if (!_isArray3) {
              _context.next = 59;
              break;
            }

            if (!(_i3 >= _iterator3.length)) {
              _context.next = 56;
              break;
            }

            return _context.abrupt('break', 74);

          case 56:
            _ref3 = _iterator3[_i3++];
            _context.next = 63;
            break;

          case 59:
            _i3 = _iterator3.next();

            if (!_i3.done) {
              _context.next = 62;
              break;
            }

            return _context.abrupt('break', 74);

          case 62:
            _ref3 = _i3.value;

          case 63:
            fromPath = _ref3;
            _moduleName = fromPath.split(path.sep)[0];
            rootAlias = resource.root ? path.resolve(options.root, 'node_modules', _moduleName, resource.root) : undefined;

            if (!rootAlias && baseVendorPkg.aurelia.build.moduleRootOverride && baseVendorPkg.aurelia.build.moduleRootOverride[_moduleName]) {
              rootAlias = path.resolve(options.root, 'node_modules', _moduleName, baseVendorPkg.aurelia.build.moduleRootOverride[_moduleName]);
            }
            _context.t4 = dependencies;
            _context.next = 70;
            return getDependency(fromPath, options.src, options.src, [nodeModules], null, packageJson, options.lazy || resource.lazy, options.bundle || resource.bundle, rootAlias);

          case 70:
            _context.t5 = _context.sent;
            assign(_context.t4, _context.t5);

          case 72:
            _context.next = 53;
            break;

          case 74:
            _context.next = 39;
            break;

          case 76:
            return _context.abrupt('return', dependencies);

          case 77:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function processAll(_x) {
    return ref.apply(this, arguments);
  };
}();

var autoresolveTemplates = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(srcPath, nodeModules, isLazy, bundleName) {
    var dependencies, templates, _iterator4, _isArray4, _i4, _ref4, htmlFilePath;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            dependencies = {};
            _context2.next = 3;
            return getFilesRecursively(srcPath, '.html');

          case 3:
            templates = _context2.sent;
            _iterator4 = templates, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : (0, _getIterator3.default)(_iterator4);

          case 5:
            if (!_isArray4) {
              _context2.next = 11;
              break;
            }

            if (!(_i4 >= _iterator4.length)) {
              _context2.next = 8;
              break;
            }

            return _context2.abrupt('break', 23);

          case 8:
            _ref4 = _iterator4[_i4++];
            _context2.next = 15;
            break;

          case 11:
            _i4 = _iterator4.next();

            if (!_i4.done) {
              _context2.next = 14;
              break;
            }

            return _context2.abrupt('break', 23);

          case 14:
            _ref4 = _i4.value;

          case 15:
            htmlFilePath = _ref4;
            _context2.t0 = dependencies;
            _context2.next = 19;
            return resolveTemplate(htmlFilePath, srcPath, [nodeModules], undefined, isLazy, bundleName);

          case 19:
            _context2.t1 = _context2.sent;
            assign(_context2.t0, _context2.t1);

          case 21:
            _context2.next = 5;
            break;

          case 23:
            return _context2.abrupt('return', dependencies);

          case 24:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function autoresolveTemplates(_x2, _x3, _x4, _x5) {
    return ref.apply(this, arguments);
  };
}();

var resolveTemplate = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(htmlFilePath, srcPath, nodeModulesList, fromWithinModule, isParentLazy, bundleName, rootAlias) {
    var dependencies, html, $, relativeParent, resources, requireTags, viewModelRequests, viewRequests, _iterator5, _isArray5, _i5, _ref5, resource;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            dependencies = {};
            html = fileSystem.readFileSync(htmlFilePath);
            $ = cheerio.load(html);
            relativeParent = path.dirname(htmlFilePath);
            resources = [];
            requireTags = $('require');

            requireTags.each(function (index) {
              var fromPath = requireTags[index].attribs.from;
              var isLazy = requireTags[index].attribs.hasOwnProperty('lazy');
              var bundle = requireTags[index].attribs.bundle;
              if (fromPath) resources.push({ path: fromPath, lazy: isLazy, bundle: bundle });
            });

            viewModelRequests = $('[view-model]');

            viewModelRequests.each(function (index) {
              var fromPath = viewModelRequests[index].attribs['view-model'];
              var isLazy = viewModelRequests[index].attribs.hasOwnProperty('lazy');
              var bundle = viewModelRequests[index].attribs.bundle;
              if (fromPath) resources.push({ path: fromPath, lazy: isLazy, bundle: bundle });
            });

            viewRequests = $('[view]');

            viewRequests.each(function (index) {
              var fromPath = viewRequests[index].attribs.view;
              var isLazy = viewRequests[index].attribs.hasOwnProperty('lazy');
              var bundle = viewRequests[index].attribs.bundle;
              if (fromPath) resources.push({ path: fromPath, lazy: isLazy, bundle: bundle });
            });

            _iterator5 = resources, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : (0, _getIterator3.default)(_iterator5);

          case 12:
            if (!_isArray5) {
              _context3.next = 18;
              break;
            }

            if (!(_i5 >= _iterator5.length)) {
              _context3.next = 15;
              break;
            }

            return _context3.abrupt('break', 30);

          case 15:
            _ref5 = _iterator5[_i5++];
            _context3.next = 22;
            break;

          case 18:
            _i5 = _iterator5.next();

            if (!_i5.done) {
              _context3.next = 21;
              break;
            }

            return _context3.abrupt('break', 30);

          case 21:
            _ref5 = _i5.value;

          case 22:
            resource = _ref5;
            _context3.t0 = dependencies;
            _context3.next = 26;
            return getDependency(resource.path, relativeParent, srcPath, nodeModulesList, fromWithinModule, htmlFilePath, isParentLazy || resource.lazy, bundleName || resource.bundle, rootAlias);

          case 26:
            _context3.t1 = _context3.sent;
            assign(_context3.t0, _context3.t1);

          case 28:
            _context3.next = 12;
            break;

          case 30:
            return _context3.abrupt('return', dependencies);

          case 31:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return function resolveTemplate(_x6, _x7, _x8, _x9, _x10, _x11, _x12) {
    return ref.apply(this, arguments);
  };
}();

var getDependency = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(fromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isLazy, bundleName, rootAlias, triedToCorrectPath, doNotAdd) {
    var addDependency = function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath) {
        var htmlWebpackRequireString;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (webpackRequireString.indexOf('..') == -1) {
                  dependencies[webpackRequireString] = webpackPath;
                  console.log((fromWithinModule ? '<' + fromWithinModule + '> ' + '[' + path.basename(requestedBy) : '[' + requestedByRelativeToSrc) + '] required "' + webpackRequireString + '" from "' + webpackPath.replace(optionsGlobal.root + path.sep, '') + '".');
                  filesProcessed.push(webpackRequireString);
                }

                if (!htmlCounterpart) {
                  _context4.next = 11;
                  break;
                }

                htmlWebpackRequireString = './' + getPathWithoutExtension(webpackRequireString) + '.html';


                dependencies[htmlWebpackRequireString] = getPath(htmlCounterpart, isLazy, bundleName);
                console.log((fromWithinModule ? '<' + fromWithinModule + '> ' + '[' + path.basename(requestedBy) : '[' + requestedByRelativeToSrc) + '] required "' + htmlWebpackRequireString + '" from "' + htmlCounterpart.replace(optionsGlobal.root + path.sep, '') + '".');

                filesProcessed.push(htmlWebpackRequireString);

                _context4.t0 = dependencies;
                _context4.next = 9;
                return resolveTemplate(htmlCounterpart, modulePath || srcPath, nodeModulesList, moduleName || fromWithinModule, isLazy, bundleName, rootAlias);

              case 9:
                _context4.t1 = _context4.sent;
                assign(_context4.t0, _context4.t1);

              case 11:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));
      return function addDependency(_x24, _x25, _x26, _x27, _x28, _x29) {
        return ref.apply(this, arguments);
      };
    }();

    var dependencies, requestedByRelativeToSrc, split, webpackPath, webpackRequireString, fullPathOrig, fullPath, fullPathNoExt, extOrig, pathIsLocal, htmlCounterpart, stats, extension, moduleName, modulePath, packagesOwnNodeModules, nodeModulesIndex, nodeModules, packageJson, vendorPkg, mainDir, ownPath, _iterator6, _isArray6, _i6, _ref6, resource, resourcePath, useRootAlias, pathParts, _moduleName2, relativeRootAlias, relativeRootSplit, rootedFromPath;

    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            dependencies = {};
            requestedByRelativeToSrc = path.relative(srcPath, requestedBy);
            split = requestedByRelativeToSrc.split(path.sep);

            if (split[0] == 'node_modules') {
              nodeModulesList = nodeModulesList.concat([path.join(srcPath, 'node_modules')]);
              srcPath = path.join(srcPath, split[0], split[1]);
              fromWithinModule = split[1];
            }

            webpackPath = void 0;
            webpackRequireString = void 0;
            fullPathOrig = path.join(relativeParent, fromPath);
            fullPath = fullPathOrig;
            fullPathNoExt = getPathWithoutExtension(fullPath);
            extOrig = path.extname(fullPath);
            pathIsLocal = fromPath.startsWith('./') || fromPath.startsWith('../');
            htmlCounterpart = void 0;
            stats = void 0;
            extension = void 0;
            moduleName = void 0;
            modulePath = void 0;
            packagesOwnNodeModules = void 0;


            try {
              stats = fileSystem.statSync(fullPath);
            } catch (_) {}

            if (!stats) try {
              stats = fileSystem.statSync(fullPath = fullPathOrig + '.js');
            } catch (_) {}

            if (!stats) try {
              stats = fileSystem.statSync(fullPath = fullPathOrig + '.ts');
            } catch (_) {}

            if (extOrig != '.html') {
              try {
                fileSystem.statSync(fullPathNoExt + '.html');
                htmlCounterpart = fullPathNoExt + '.html';
              } catch (_) {}
            }

            if (!(stats && stats.isFile())) {
              _context5.next = 43;
              break;
            }

            extension = path.extname(fullPath);

            webpackPath = getPath(fullPath, isLazy, bundleName);

            if (fromWithinModule) {
              _context5.next = 34;
              break;
            }

            webpackRequireString = './' + (pathIsLocal ? path.relative(srcPath, path.join(relativeParent, fromPath)) : fromPath);
            _context5.next = 28;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);

          case 28:
            if (!rootAlias) {
              _context5.next = 32;
              break;
            }

            webpackRequireString = './' + (pathIsLocal ? path.relative(rootAlias, path.join(relativeParent, fromPath)) : fromPath);
            _context5.next = 32;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);

          case 32:
            _context5.next = 41;
            break;

          case 34:

            webpackRequireString = './' + fromWithinModule + '/' + path.relative(srcPath, path.join(relativeParent, fromPath));
            _context5.next = 37;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);

          case 37:
            if (!rootAlias) {
              _context5.next = 41;
              break;
            }

            webpackRequireString = './' + fromWithinModule + '/' + path.relative(rootAlias, path.join(relativeParent, fromPath));
            _context5.next = 41;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);

          case 41:
            _context5.next = 97;
            break;

          case 43:
            if (pathIsLocal) {
              _context5.next = 97;
              break;
            }

            stats = undefined;
            nodeModulesIndex = nodeModulesList.length;

            while (!stats && nodeModulesIndex--) {
              nodeModules = nodeModulesList[nodeModulesIndex];

              fullPathOrig = path.join(nodeModules, fromPath);
              fullPath = fullPathOrig;
              fullPathNoExt = getPathWithoutExtension(fullPath);

              try {
                stats = fileSystem.statSync(fullPath);
              } catch (_) {}

              if (!stats) try {
                stats = fileSystem.statSync(fullPath = fullPathOrig + '.js');
              } catch (_) {}

              if (extOrig != '.html') {
                try {
                  fileSystem.statSync(fullPathNoExt + '.html');
                  htmlCounterpart = fullPathNoExt + '.html';
                } catch (_) {}
              }
            }

            if (!stats) {
              _context5.next = 97;
              break;
            }

            extension = path.extname(fullPath);

            if (stats.isDirectory() && path.basename(path.dirname(fullPath)) === 'node_modules') {
              moduleName = path.basename(fullPath);
              modulePath = fullPath;

              webpackPath = getPath(moduleName, isLazy, bundleName);
              webpackRequireString = './' + fromPath;
            } else if (stats.isFile()) {
              moduleName = fromPath.split('/')[0];
              modulePath = path.resolve(nodeModulesList[nodeModulesIndex], moduleName);

              webpackPath = getPath(fullPath, isLazy, bundleName);
              webpackRequireString = './' + fromPath;
            }

            if (doNotAdd) {
              _context5.next = 53;
              break;
            }

            _context5.next = 53;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias, moduleName, modulePath);

          case 53:
            if (!(moduleName && modulePath)) {
              _context5.next = 97;
              break;
            }

            packageJson = path.resolve(modulePath, 'package.json');
            vendorPkg = void 0;

            try {
              vendorPkg = JSON.parse(fileSystem.readFileSync(packageJson, 'utf8'));
            } catch (_) {}

            if (!vendorPkg) {
              _context5.next = 97;
              break;
            }

            mainDir = vendorPkg.main ? path.resolve(modulePath, path.dirname(vendorPkg.main)) : null;


            if (!rootAlias) {
              rootAlias = vendorPkg.aurelia && vendorPkg.aurelia.root && path.resolve(modulePath, vendorPkg.aurelia.root) || mainDir;

              if (rootAlias === modulePath) rootAlias = null;
            }

            if (!(rootAlias && stats.isFile())) {
              _context5.next = 68;
              break;
            }

            webpackRequireString = './' + moduleName + '/' + path.relative(rootAlias, fullPath);
            _context5.next = 64;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);

          case 64:
            if (!(extension == '.js' || extension == '.ts')) {
              _context5.next = 68;
              break;
            }

            webpackRequireString = './' + moduleName + '/' + path.relative(rootAlias, getPathWithoutExtension(fullPath));
            _context5.next = 68;
            return addDependency(webpackRequireString, webpackPath, htmlCounterpart, rootAlias);

          case 68:
            if (!(modulesProcessed.indexOf(modulePath) == -1)) {
              _context5.next = 97;
              break;
            }

            try {
              ownPath = path.resolve(modulePath, 'node_modules');

              fileSystem.statSync(ownPath);
              packagesOwnNodeModules = ownPath;
            } catch (_) {}

            if (!(vendorPkg.aurelia && vendorPkg.aurelia.build && vendorPkg.aurelia.build.resources)) {
              _context5.next = 96;
              break;
            }

            _iterator6 = vendorPkg.aurelia.build.resources, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : (0, _getIterator3.default)(_iterator6);

          case 72:
            if (!_isArray6) {
              _context5.next = 78;
              break;
            }

            if (!(_i6 >= _iterator6.length)) {
              _context5.next = 75;
              break;
            }

            return _context5.abrupt('break', 96);

          case 75:
            _ref6 = _iterator6[_i6++];
            _context5.next = 82;
            break;

          case 78:
            _i6 = _iterator6.next();

            if (!_i6.done) {
              _context5.next = 81;
              break;
            }

            return _context5.abrupt('break', 96);

          case 81:
            _ref6 = _i6.value;

          case 82:
            resource = _ref6;
            resourcePath = resource instanceof Object ? resource.path : resource;
            useRootAlias = rootAlias;

            if (vendorPkg.aurelia.build.moduleRootOverride && vendorPkg.aurelia.build.moduleRootOverride[moduleName]) {
              useRootAlias = path.resolve(modulePath, vendorPkg.aurelia.build.moduleRootOverride[moduleName]);
            }

            if (resource.root) {
              useRootAlias = path.resolve(modulePath, resource.root);
            }

            if (baseVendorPkg && baseVendorPkg.aurelia && baseVendorPkg.aurelia.build.moduleRootOverride && baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]) {
              useRootAlias = path.resolve(modulePath, baseVendorPkg.aurelia.build.moduleRootOverride[moduleName]);
            }
            if (useRootAlias === modulePath) {
              useRootAlias = null;
            }

            _context5.t0 = dependencies;
            _context5.next = 92;
            return getDependency(resourcePath, modulePath, modulePath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName, packageJson, isLazy || resource.lazy, bundleName || resource.bundle, useRootAlias);

          case 92:
            _context5.t1 = _context5.sent;
            assign(_context5.t0, _context5.t1);

          case 94:
            _context5.next = 72;
            break;

          case 96:
            modulesProcessed.push(modulePath);

          case 97:
            if (webpackPath) {
              _context5.next = 114;
              break;
            }

            pathParts = fromPath.split('/');

            if (!(!pathIsLocal && pathParts.length > 1 && rootAlias && rootAlias !== srcPath)) {
              _context5.next = 111;
              break;
            }

            _moduleName2 = pathParts.shift();
            relativeRootAlias = path.relative(srcPath, rootAlias);
            relativeRootSplit = relativeRootAlias.split(path.sep);

            if (relativeRootSplit[0] == '..') {
              relativeRootSplit.shift();
            }
            while (relativeRootSplit[0] == 'node_modules') {
              relativeRootSplit.shift();
              relativeRootSplit.shift();
            }
            relativeRootAlias = relativeRootSplit.join('/');

            rootedFromPath = path.join(_moduleName2, relativeRootAlias, pathParts.join(path.sep));

            if (!(rootedFromPath !== fromPath && !triedToCorrectPath)) {
              _context5.next = 111;
              break;
            }

            _context5.next = 110;
            return getDependency(rootedFromPath, relativeParent, srcPath, nodeModulesList, fromWithinModule, requestedBy, isLazy, bundleName, rootAlias, true);

          case 110:
            return _context5.abrupt('return', _context5.sent);

          case 111:
            console.error('[' + (fromWithinModule ? '<' + fromWithinModule + '>' : path.relative(srcPath, requestedBy)) + '] wants to require "' + fromPath + '", which does not exist.');
            _context5.next = 120;
            break;

          case 114:
            if (!(extension == ".html")) {
              _context5.next = 120;
              break;
            }

            _context5.t2 = dependencies;
            _context5.next = 118;
            return resolveTemplate(fullPath, modulePath || srcPath, packagesOwnNodeModules ? nodeModulesList.concat(packagesOwnNodeModules) : nodeModulesList, moduleName || fromWithinModule, isLazy, bundleName, rootAlias);

          case 118:
            _context5.t3 = _context5.sent;
            assign(_context5.t2, _context5.t3);

          case 120:
            return _context5.abrupt('return', dependencies);

          case 121:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));
  return function getDependency(_x13, _x14, _x15, _x16, _x17, _x18, _x19, _x20, _x21, _x22, _x23) {
    return ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fileSystem = require('fs');
var readdir = require('recursive-readdir');
var assign = _assign2.default || require('object.assign');
var Promise = require('bluebird');
var cheerio = require('cheerio');

var filesProcessed = [];
var modulesProcessed = [];

var optionsGlobal = {};
var baseVendorPkg = void 0;

function getFilesRecursively(targetDir, extension) {
  return new Promise(function (resolve, reject) {
    return readdir(targetDir, [function (file, stats) {
      return path.extname(file) !== extension && !stats.isDirectory();
    }], function (error, files) {
      return error ? reject(error) : resolve(files);
    });
  });
}

function getPath(input, lazy, bundle) {
  var extension = path.extname(input);
  var output = '';

  if (extension == ".css") output += '!!css!';
  if (lazy || bundle) output += 'bundle?';
  if (lazy) output += 'lazy';
  if (lazy && bundle) output += '&';
  if (bundle) output += 'name=' + bundle;
  if (lazy || bundle) output += '!';
  return '' + output + input;
}

function getPathWithoutExtension(input) {
  return path.join(path.parse(input).dir, path.parse(input).name);
}

module.exports = {
  getFilesRecursively: getFilesRecursively,
  processAll: processAll,
  autoresolveTemplates: autoresolveTemplates,
  resolveTemplate: resolveTemplate,
  getDependency: getDependency
};