'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');
var resolveTemplates = require('./resolve-template');

var AureliaWebpackPlugin = function () {
  function AureliaWebpackPlugin() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    (0, _classCallCheck3.default)(this, AureliaWebpackPlugin);

    options.root = options.root || path.dirname(module.parent.filename);
    options.src = options.src || path.resolve(options.root, 'src');
    options.resourceRegExp = options.resourceRegExp || /aurelia-loader-context/;

    this.options = options;
  }

  AureliaWebpackPlugin.prototype.apply = function apply(compiler) {
    var _this = this;

    compiler.plugin('context-module-factory', function (cmf) {
      cmf.plugin('before-resolve', function (result, callback) {
        if (!result) return callback();
        if (_this.options.resourceRegExp.test(result.request)) {
          result.request = _this.options.src;
        }
        return callback(null, result);
      });
      cmf.plugin('after-resolve', function (result, callback) {
        if (!result) return callback();
        if (_this.options.src.indexOf(result.resource, _this.options.src.length - result.resource.length) !== -1) {
          (function () {
            var resolveDependencies = result.resolveDependencies;

            result.resolveDependencies = function (fs, resource, recursive, regExp, callback) {
              return resolveDependencies(fs, resource, recursive, regExp, function (error, dependencies) {
                if (error) return callback(error);

                var originalDependencies = dependencies.slice();
                dependencies = [];

                var _loop2 = function _loop2() {
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

                  var _ret3 = _loop2();

                  if (_ret3 === 'break') break;
                }

                resolveTemplates.processAll(_this.options).then(function (contextElements) {
                  var _loop = function _loop() {
                    if (_isArray2) {
                      if (_i2 >= _iterator2.length) return 'break';
                      _ref2 = _iterator2[_i2++];
                    } else {
                      _i2 = _iterator2.next();
                      if (_i2.done) return 'break';
                      _ref2 = _i2.value;
                    }

                    var requireRequestPath = _ref2;

                    var webpackRequestPath = contextElements[requireRequestPath];
                    var newDependency = new ContextElementDependency(webpackRequestPath, requireRequestPath);
                    newDependency.optional = true;
                    var previouslyAdded = dependencies.findIndex(function (dependency) {
                      return dependency.userRequest === requireRequestPath;
                    });
                    if (previouslyAdded > -1) {
                      dependencies[previouslyAdded] = newDependency;
                    } else {
                      dependencies.push(newDependency);
                    }
                  };

                  for (var _iterator2 = (0, _keys2.default)(contextElements).reverse(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
                    var _ref2;

                    var _ret2 = _loop();

                    if (_ret2 === 'break') break;
                  }

                  return callback(null, dependencies);
                }, function (error) {
                  console.error('Error processing templates', error.message);
                  return callback(error);
                });
              });
            };
          })();
        }
        return callback(null, result);
      });
    });
  };

  return AureliaWebpackPlugin;
}();

module.exports = AureliaWebpackPlugin;