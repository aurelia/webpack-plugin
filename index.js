/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Based on ContextReplacementPlugin by Tobias Koppers @sokra
*/
var path = require("path");
var fileSystem = require('fs');
var ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');

function AureliaWebpackPlugin(options) {  
  options = options || {};
  options.root = options.root || path.dirname(module.parent.filename);
  options.src = options.src || path.resolve(options.root, 'src');
  options.resourceRegExp = options.resourceRegExp || /aurelia-loader-context/;
  
  this.options = options;
  
  if (options.contextMap) {
    this.createContextMap = function(fs, callback) {
      callback(null, this.options.contextMap);
    }.bind(this);
  } else {
    this.createContextMap = function(fs, callback) {
      var self = this;
      var contextMap = {};
          // No context map supplied, let's create a default map from all dependencies in package.json
      var pkg = JSON.parse(fileSystem.readFileSync(path.resolve(self.options.root, 'package.json')));
      var vendorPackages = Object.keys(pkg.dependencies);
      vendorPackages.forEach(function(moduleId) {
        // We're storing the complete path to the package entry file in the context map. This is not
        // required directly, but we need it to resolve aurelia's submodules.
        var vendorPath = path.resolve(self.options.root, 'node_modules', moduleId);
        var vendorPkgPath = path.resolve(vendorPath, 'package.json');
        var vendorPkg = JSON.parse(fileSystem.readFileSync(vendorPkgPath, 'utf8'));
        if (vendorPkg.browser || vendorPkg.main) {
          contextMap[moduleId] = path.resolve(vendorPath, vendorPkg.browser || vendorPkg.main);        
        }
      });
      callback(null, contextMap);
    }.bind(this);
  }
}

AureliaWebpackPlugin.prototype.apply = function(compiler) {
  var self = this;
  
	compiler.plugin("context-module-factory", function(cmf) {
    cmf.plugin("before-resolve", function(result, callback) {
      if (!result) return callback();
      if (self.options.resourceRegExp.test(result.request)) {
        if (typeof self.options.src !== "undefined") {
          result.request = self.options.src;
        }
      }
      return callback(null, result);
    });
    cmf.plugin("after-resolve", function(result, callback) {
      if (!result) return callback();
      if (self.options.src.indexOf(result.resource, self.options.src.length - result.resource.length) !== -1) {
        result.resolveDependencies = createResolveDependenciesFromContextMap(self.createContextMap, result.resolveDependencies);
      }
      return callback(null, result);
		});
	});
};

function createResolveDependenciesFromContextMap(createContextMap, originalResolveDependencies) {
	return function resolveDependenciesFromContextMap(fs, resource, recursive, regExp, callback) {
    
    originalResolveDependencies(fs, resource, recursive, regExp, function (err, dependencies)  {
      if(err) return callback(err);
      
      createContextMap(fs, function(err, map) {
        if(err) return callback(err);
        
        var keys = Object.keys(map);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          // Add main module as dependency
          dependencies.push(new ContextElementDependency(key, './' + key));
          // Also include all other modules as subdependencies when it is an aurelia module. This is required
          // because Aurelia submodules are not in the root of the NPM package and thus cannot be loaded 
          // directly like import 'aurelia-templating-resources/compose'
          if (key.substr(0, 8) === 'aurelia-') {
            var mainDir = path.dirname(map[key]);
            var mainFileName = path.basename(map[key]);
            var files = fileSystem.readdirSync(mainDir);
            for (var j = 0; j < files.length; j++) {
              var fileName = files[j];
              if (fileName.indexOf(mainFileName) === -1 && fileName.match(/[^\.]\.(js||html|css)$/)) {
                var subModuleKey = key + '/' + path.basename(fileName, path.extname(fileName));
                dependencies.push(new ContextElementDependency(path.resolve(mainDir, fileName), './' + subModuleKey));
              }               
            }
          }
        };        
        callback(null, dependencies);
      });      
    });
	}.bind(this);
};

module.exports = AureliaWebpackPlugin;