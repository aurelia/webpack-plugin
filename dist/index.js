'use strict';

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('upath');
var ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');
var resolveTemplates = require('./build-resources');
var debug = require('debug')('webpack-plugin');

function handleError(error) {
  console.error('Error processing templates', error.message);
  console.error('-----------------------');
  console.error(error);
  console.error('-----------------------');
}

var AureliaWebpackPlugin = function () {
  function AureliaWebpackPlugin() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    (0, _classCallCheck3.default)(this, AureliaWebpackPlugin);

    options.root = options.root ? path.normalizeSafe(options.root) : path.dirname(module.parent.filename);
    options.src = options.src ? path.normalizeSafe(options.src) : path.resolve(options.root, 'src');
    options.nameExternalModules = options.nameExternalModules == undefined || options.nameExternalModules == true;
    options.nameLocalModules = options.nameLocalModules == undefined || options.nameLocalModules == true;
    options.resourceRegExp = options.resourceRegExp || /aurelia-loader-context/;
    options.customViewLoaders = (0, _assign2.default)({
      '.css': ['css'],
      '.scss': ['css', 'sass'],
      '.less': ['css', 'less'],
      '.styl': ['css', 'stylus']
    }, options.customViewLoaders || {});

    if (options.includeSubModules || options.contextMap) {
      console.error('WARNING: You are passing a depracated option "includeSubModules" / "contextMap" to aurelia-webpack-plugin.');
      console.error('         Please migrate your config to use aurelia.build.resources inside of your package.json.');
      console.error('         For more information see: https://github.com/aurelia/skeleton-navigation/blob/master/skeleton-typescript-webpack/README.md#resource-and-bundling-configuration');
    }

    this.options = options;
  }

  AureliaWebpackPlugin.prototype.getPath = function getPath(resolvedResource) {
    var input = resolvedResource.source;
    var lazy = resolvedResource.lazy;
    var bundle = resolvedResource.bundle;

    var extension = path.extname(input);
    var output = '';

    if (this.options.customViewLoaders[extension]) {
      output += '!!' + this.options.customViewLoaders[extension].join('!') + '!';
    }

    if (lazy || bundle) output += 'bundle?';
    if (lazy) output += 'lazy';
    if (lazy && bundle) output += '&';
    if (bundle) output += 'name=' + bundle;
    if (lazy || bundle) output += '!';

    return '' + output + input;
  };

  AureliaWebpackPlugin.prototype.apply = function apply(compiler) {
    var options = this.options;
    var self = this;

    compiler.plugin('run', function (compiler, callback) {
      debug('run');
      resolveTemplates.processAll(options).then(function (contextElements) {
        compiler.__aureliaContextElements = contextElements;
        debug('finished run: got contextElements');
        callback();
      }, function (e) {
        handleError(e);
        return callback(error);
      });
    });

    compiler.plugin('watch-run', function (watching, callback) {
      resolveTemplates.processAll(options).then(function (contextElements) {
        watching.compiler.__aureliaContextElements = contextElements;
        debug('finished watch-run: got contextElements');
        callback();
      }, function (e) {
        handleError(e);
        return callback(error);
      });
    });

    compiler.plugin('context-module-factory', function (cmf) {
      var contextElements = compiler.__aureliaContextElements;
      debug('context-module-factory');

      cmf.plugin('before-resolve', function (result, callback) {
        if (!result) return callback();
        if (self.options.resourceRegExp.test(result.request)) {
          result.request = self.options.src;
        }
        return callback(null, result);
      });

      cmf.plugin('after-resolve', function (result, callback) {
        if (!result) return callback();

        var resourcePath = path.normalizeSafe(result.resource);
        if (self.options.src.indexOf(resourcePath, self.options.src.length - resourcePath.length) !== -1) {
          (function () {
            var resolveDependencies = result.resolveDependencies;

            result.resolveDependencies = function (fs, resource, recursive, regExp, callback) {
              return resolveDependencies(fs, resource, recursive, regExp, function (error, dependencies) {
                if (error) return callback(error);

                var originalDependencies = dependencies.slice();
                dependencies = [];

                var _loop = function _loop() {
                  if (_isArray) {
                    if (_i >= _iterator.length) return 'break';
                    _ref = _iterator[_i++];
                  } else {
                    _i = _iterator.next();
                    if (_i.done) return 'break';
                    _ref = _i.value;
                  }

                  var dependency = _ref;

                  if (dependencies.findIndex(function (cDependency) {
                    return cDependency.userRequest === dependency.userRequest;
                  }) === -1 && !dependency.userRequest.endsWith('.ts') && !dependency.userRequest.endsWith('.js')) dependencies.push(dependency);
                };

                for (var _iterator = originalDependencies, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
                  var _ref;

                  var _ret2 = _loop();

                  if (_ret2 === 'break') break;
                }

                var _loop2 = function _loop2() {
                  if (_isArray2) {
                    if (_i2 >= _iterator2.length) return 'break';
                    _ref2 = _iterator2[_i2++];
                  } else {
                    _i2 = _iterator2.next();
                    if (_i2.done) return 'break';
                    _ref2 = _i2.value;
                  }

                  var requireRequestPath = _ref2;

                  try {
                    var _resource = contextElements[requireRequestPath];

                    requireRequestPath = path.joinSafe('./', requireRequestPath);
                    var newDependency = new ContextElementDependency(self.getPath(_resource), requireRequestPath);
                    if (_resource.hasOwnProperty('optional')) newDependency.optional = !!_resource.optional;else newDependency.optional = true;
                    var previouslyAdded = dependencies.findIndex(function (dependency) {
                      return dependency.userRequest === requireRequestPath;
                    });
                    if (previouslyAdded > -1) {
                      dependencies[previouslyAdded] = newDependency;
                    } else {
                      dependencies.push(newDependency);
                    }
                  } catch (e) {
                    handleError(e);
                  }
                };

                for (var _iterator2 = (0, _keys2.default)(contextElements).reverse(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
                  var _ref2;

                  var _ret3 = _loop2();

                  if (_ret3 === 'break') break;
                }

                return callback(null, dependencies);
              });
            };
          })();
        }
        return callback(null, result);
      });
    });

    compiler.plugin('compilation', function (compilation) {
      debug('compilation');
      var contextElements = compiler.__aureliaContextElements;
      var paths = [];
      try {
        paths = (0, _getOwnPropertyNames2.default)(contextElements);
      } catch (e) {
        console.error('No context elements');
      }

      function customWebpackRequire(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;

        var module = installedModules[moduleId] = {
          i: moduleId,
          l: false,
          exports: {}
        };

        if (!modules[moduleId] && typeof moduleId === 'string') {
          var newModuleId;
          if (modules[newModuleId = moduleId + '.js'] || modules[newModuleId = moduleId + '.ts']) {
            moduleId = newModuleId;

            installedModules[moduleId] = module;
          }
        }

        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        module.l = true;

        return module.exports;
      }

      compilation.mainTemplate.plugin('require', function (source, chunk, hash) {
        var newSourceArray = customWebpackRequire.toString().split('\n');
        newSourceArray.pop();
        newSourceArray.shift();
        return newSourceArray.join('\n');
      });

      compilation.plugin('before-module-ids', function (modules) {
        modules.forEach(function (module) {
          if (module.id !== null) {
            return;
          }

          if (typeof module.resource == 'string') {
            (function () {
              var moduleId = void 0;

              if (options.nameLocalModules) {
                if (module.resource.startsWith(options.src)) {
                  var relativeToSrc = path.relative(options.src, module.resource);
                  moduleId = relativeToSrc;
                }
              }
              if (options.nameExternalModules) {
                if (!moduleId && typeof module.userRequest == 'string') {
                  var matchingModuleIds = paths.filter(function (originPath) {
                    return contextElements[originPath].source === module.userRequest;
                  }).map(function (originPath) {
                    return path.normalize(originPath);
                  });

                  if (matchingModuleIds.length) {
                    matchingModuleIds.sort(function (a, b) {
                      return b.length - a.length;
                    });
                    moduleId = matchingModuleIds[0];
                  }
                }
                if (!moduleId && typeof module.rawRequest == 'string' && module.rawRequest.indexOf('.') !== 0) {
                  var index = paths.indexOf(module.rawRequest);
                  if (index >= 0) {
                    moduleId = module.rawRequest;
                  }
                }
              }
              if (moduleId && !modules.find(function (m) {
                return m.id === moduleId;
              })) {
                module.id = moduleId;
              }
            })();
          }
        });
      });
    });
  };

  return AureliaWebpackPlugin;
}();

module.exports = AureliaWebpackPlugin;