/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Based on ContextReplacementPlugin by Tobias Koppers @sokra
*/
var path = require("path");
var fileSystem = require('fs');
var readdir = require('recursive-readdir');
var ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');
var assign = Object.assign || require('object.assign');

// Hub context is generated from node_modules folder instead of dependencies, due to possible
// circular dependencies
function getHubContextAndSubModuleMap(options) {
  return fileSystem.readdirSync(path.resolve(options.root, 'node_modules'))
    .filter(function(file) {
      return fileSystem.statSync(path.join(options.root, 'node_modules', file)).isDirectory();
    })
    .map(function (dep) {
      console.log(dep);
      return path.join(process.cwd(), 'node_modules', dep, 'package.json');
    })
    .reduce((prev, pkgJsonFile) => {
        var pkg = require(pkgJsonFile);
        var vendor = pkg.name;

        if ((vendor.startsWith('hub.') || vendor.startsWith('aurelia-')) && (pkg.browser || pkg.main)) {
            prev.contextMap[vendor] = `node_modules/${vendor}/${pkg.browser || pkg.main}`;
        }

        if (vendor.startsWith('hub.')) {
            prev.subModules.push({ moduleId: vendor, include: /.*/ });
        }

        return prev;
    }, { contextMap: {}, subModules: [] });
}

function AureliaWebpackPlugin(options) {
  options = options || {};
  options.root = options.root || path.dirname(module.parent.filename);
  options.src = options.src || path.resolve(options.root, 'src');
  options.resourceRegExp = options.resourceRegExp || /aurelia-loader-context/;
  options.includeSubModules = options.includeSubModules || []

  this.options = options;

  // Hub context and submodules
  var hubMappings = getHubContextAndSubModuleMap(options);
  assign(options.contextMap, hubMappings.contextMap);
  assign(options.includeSubModules, hubMappings.subModules);

  this.subModulesToInclude = [
    { moduleId: 'aurelia-templating-resources' },
    { moduleId: 'aurelia-templating-router'}
  ];

  for (var i = 0; i < options.includeSubModules.length; i++) {
    var includeSubModule = options.includeSubModules[i];

    var existingModuleIndex =
      this.subModulesToInclude.map(function(m) { return m.moduleId; }).indexOf(includeSubModule.moduleId);

    if (existingModuleIndex === -1) {
      this.subModulesToInclude.push(includeSubModule);
    } else {
      this.subModulesToInclude.splice(existingModuleIndex, 1, includeSubModule);
    }
  }

  this.createContextMap = function(fs, callback) {
    var contextMap = assign(getContextMap(this.options), this.options.contextMap);
    callback(null, contextMap);
  }.bind(this);
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
        result.resolveDependencies = createResolveDependenciesFromContextMap(self.createContextMap, result.resolveDependencies, self.subModulesToInclude);
      }
      return callback(null, result);
		});
	});
};

function createResolveDependenciesFromContextMap(createContextMap, originalResolveDependencies, subModulesToInclude) {
	return function resolveDependenciesFromContextMap(fs, resource, recursive, regExp, callback) {

    originalResolveDependencies(fs, resource, recursive, regExp, function (err, dependencies)  {
      if(err) return callback(err);

      createContextMap(fs, function(err, map) {
        if(err) return callback(err);

        var keys = Object.keys(map);
        var processed = 0;

        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          // Add main module as dependency
          dependencies.push(new ContextElementDependency(key, './' + key));

          // Check if we also need to include all submodules
          var moduleToIncludeSubModulesFor = subModulesToInclude.find(function(m) {
            return m.moduleId === key
          });
          if (moduleToIncludeSubModulesFor) {
            // Include all other modules as subdependencies when it is an aurelia module. This is required
            // because Aurelia submodules are not in the root of the NPM package and thus cannot be loaded
            // directly like import 'aurelia-templating-resources/compose'
            (function (module) {
              var mainDir = path.dirname(map[module.moduleId]);
              var mainFileName = path.basename(map[module.moduleId]);

              readdir(mainDir, function(err, files) {
                for (var j = 0; j < files.length; j++) {
                  var filePath = files[j];
                  var fileSubPath = filePath.substring(mainDir.length + 1).replace(/\\/g, '/');

                  var include = module.include || /[^\.]\.(js||html|css)$/;
                  var exclude = module.exclude || /[^\.]\.d\.ts$/

                  if (fileSubPath.indexOf(mainFileName) === -1 &&
                    (fileSubPath.match(include) && ! fileSubPath.match(exclude))) {
                    var extension = path.extname(fileSubPath);
                    if (extension === '.js' || extension === '.ts') {
                      var extensionLessSubModuleKey = module.moduleId + '/' + fileSubPath.substring(0, fileSubPath.length - extension.length);
                      dependencies.push(new ContextElementDependency(path.resolve(mainDir, fileSubPath), './' + extensionLessSubModuleKey));
                    }
                    var subModuleKey = module.moduleId + '/' + fileSubPath;
                    dependencies.push(new ContextElementDependency(path.resolve(mainDir, fileSubPath), './' + subModuleKey));
                  }
                }
                if (++processed == keys.length) {
                  callback(null, dependencies);
                }
              })
            })(moduleToIncludeSubModulesFor);
          } else {
            if (++processed == keys.length) {
              callback(null, dependencies);
            }
          }
        }
      });
    });
	}.bind(this);
};

module.exports = AureliaWebpackPlugin;
