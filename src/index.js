const path = require('upath');
const ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');
const resolveTemplates = require('./build-resources');
const debug = require('debug')('webpack-plugin');

function handleError(error) {
  console.error('Error processing templates', error.message);
  console.error('-----------------------');
  console.error(error);
  console.error('-----------------------');
}

class AureliaWebpackPlugin {
  constructor(options = {}) {
    options.root = options.root ? path.normalizeSafe(options.root) : path.dirname(module.parent.filename);
    options.src = options.src ? path.normalizeSafe(options.src) : path.resolve(options.root, 'src');
    options.nameExternalModules = options.nameExternalModules == undefined || options.nameExternalModules == true;
    options.nameLocalModules = options.nameLocalModules == undefined || options.nameLocalModules == true;
    options.resourceRegExp = options.resourceRegExp || /aurelia-loader-context/;
    options.customViewLoaders = Object.assign({
      '.css': ['css'],
      '.scss': ['css', 'sass'],
      '.less': ['css', 'less'],
      '.styl': ['css', 'stylus'],
    }, options.customViewLoaders || {});

    if (options.includeSubModules || options.contextMap) {
      console.error('WARNING: You are passing a depracated option "includeSubModules" / "contextMap" to aurelia-webpack-plugin.');
      console.error('         Please migrate your config to use aurelia.build.resources inside of your package.json.');
      console.error('         For more information see: https://github.com/aurelia/skeleton-navigation/blob/master/skeleton-typescript-webpack/README.md#resource-and-bundling-configuration');
    }

    this.options = options;
  }

  getPath(resolvedResource) {
    let input = resolvedResource.source;
    let lazy = resolvedResource.lazy;
    let bundle = resolvedResource.bundle;

    const extension = path.extname(input);
    let output = '';

    // for .css files force the request to the appropriate css loader (https://github.com/aurelia/webpack-plugin/issues/11#issuecomment-212578861)
    if (this.options.customViewLoaders[extension]) {
      output += '!!' + this.options.customViewLoaders[extension].join('!') + '!';
    }

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

    return `${output}${input}`;
  }
  
  apply(compiler) {
    const options = this.options;
    const self = this;

    compiler.plugin('run', function(compiler, callback) {
      debug('run');
      resolveTemplates.processAll(options).then(contextElements => {
        compiler.__aureliaContextElements = contextElements;
        debug('finished run: got contextElements');
        callback();
      }, (e) => {
        handleError(e);
        return callback(error);
      });
    });

    compiler.plugin('watch-run', function(watching, callback) {
      resolveTemplates.processAll(options).then(contextElements => {
        watching.compiler.__aureliaContextElements = contextElements;
        debug('finished watch-run: got contextElements');
        callback();
      }, (e) => {
        handleError(e);
        return callback(error);
      });
    });

    compiler.plugin('context-module-factory', function (cmf) {
      var contextElements = compiler.__aureliaContextElements;
      debug('context-module-factory');
      
      cmf.plugin('before-resolve', (result, callback) => {
        if (!result) return callback();
        if (self.options.resourceRegExp.test(result.request)) {
          result.request = self.options.src;
        }
        return callback(null, result);
      });

      cmf.plugin('after-resolve', (result, callback) => {
        if (!result) return callback();

        const resourcePath = path.normalizeSafe(result.resource);
        if (self.options.src.indexOf(resourcePath, self.options.src.length - resourcePath.length) !== -1) {
          const resolveDependencies = result.resolveDependencies;
          
          // substitute resolveDependencies method with an enhanced version:
          result.resolveDependencies = (fs, resource, recursive, regExp, callback) =>
            resolveDependencies(fs, resource, recursive, regExp, (error, dependencies) => {
              if (error) return callback(error);
              
              // 1. remove duplicates
              // 2. remove .ts/.js files
              const originalDependencies = dependencies.slice();
              dependencies = [];
              for (let dependency of originalDependencies) {
                if (dependencies.findIndex(cDependency => cDependency.userRequest === dependency.userRequest) === -1
                    && !dependency.userRequest.endsWith('.ts') && !dependency.userRequest.endsWith('.js'))
                  dependencies.push(dependency);
              }

              for (let requireRequestPath of Object.keys(contextElements).reverse()) {
                try {
                  const resource = contextElements[requireRequestPath];
                  // ensure we have './' at the beginning of the request path
                  requireRequestPath = path.joinSafe('./', requireRequestPath);
                  let newDependency = new ContextElementDependency(self.getPath(resource), requireRequestPath);
                  if (resource.hasOwnProperty('optional'))
                    newDependency.optional = !!resource.optional;
                  else
                    newDependency.optional = true;
                  let previouslyAdded = dependencies.findIndex(dependency => dependency.userRequest === requireRequestPath);
                  if (previouslyAdded > -1) {
                    dependencies[previouslyAdded] = newDependency;
                  } else {
                    dependencies.push(newDependency);
                  }
                } catch (e) {
                  handleError(e);
                }
                // TODO: optional filtering of context (things we don't want to require)
              }
              
              return callback(null, dependencies);
            });
        }
        return callback(null, result);
      });
    });

    /**
     * used to inject Aurelia's Origin to all build resources
     */
    compiler.plugin('compilation', function (compilation) {
      debug('compilation');
      const contextElements = compiler.__aureliaContextElements;
      let paths = [];
      try {
        paths = Object.getOwnPropertyNames(contextElements);
      } catch (e) {
        console.error('No context elements');
      }

      function customWebpackRequire(moduleId) {
        // Check if module is in cache
        if(installedModules[moduleId])
          return installedModules[moduleId].exports;

        // Create a new module (and put it into the cache)
        var module = installedModules[moduleId] = {
          i: moduleId,
          l: false,
          exports: {}
        };

        // Try adding .js / .ts
        if (!modules[moduleId] && typeof moduleId === 'string') {
          var newModuleId;
          if (modules[newModuleId = moduleId + '.js'] || modules[newModuleId = moduleId + '.ts']) {
            moduleId = newModuleId;
            // alias also installedModules:
            installedModules[moduleId] = module;
          }
        }

        // Execute the module function
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        // Flag the module as loaded
        module.l = true;

        // Return the exports of the module
        return module.exports;
      }

      compilation.mainTemplate.plugin('require', function(source, chunk, hash) {
        let newSourceArray = customWebpackRequire.toString().split('\n');
        newSourceArray.pop(); // remove header 'function... {'
        newSourceArray.shift(); // remove footer '}'
        return newSourceArray.join('\n');
      });

      compilation.plugin('before-module-ids', function (modules) {
        modules.forEach((module) => {
          if (module.id !== null) {
            return;
          }

          if (typeof module.resource == 'string') {
            let moduleId;
            
            if (options.nameLocalModules) {
              if (module.resource.startsWith(options.src)) {
                // paths inside SRC
                let relativeToSrc = path.relative(options.src, module.resource);
                moduleId = relativeToSrc;
              }
            }
            if (options.nameExternalModules) {
              if (!moduleId && typeof module.userRequest == 'string') {
                // paths resolved as build resources
                let matchingModuleIds = paths
                  .filter(originPath => contextElements[originPath].source === module.userRequest)
                  .map(originPath => path.normalize(originPath));

                if (matchingModuleIds.length) {
                  matchingModuleIds.sort((a, b) => b.length - a.length);
                  moduleId = matchingModuleIds[0];
                }
              }
              if (!moduleId && typeof module.rawRequest == 'string' && module.rawRequest.indexOf('.') !== 0) {
                // requested modules from node_modules:
                let index = paths.indexOf(module.rawRequest);
                if (index >= 0) {
                  moduleId = module.rawRequest;
                }
              }
            }
            if (moduleId && !modules.find(m => m.id === moduleId)) {
              module.id = moduleId;
            }
          }
        });
      });
    });
  }
}

module.exports = AureliaWebpackPlugin;
