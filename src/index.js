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
    compiler.plugin('compilation', function(compilation) {
      debug('compilation');
      const contextElements = compiler.__aureliaContextElements;
      let paths = [];
      try {
        paths = Object.getOwnPropertyNames(contextElements);
      } catch (e) {
        console.error('No context elements');
      }

      compilation.plugin('normal-module-loader', function(loaderContext, module) {
        // this is where all the modules are loaded
        // one by one, no dependencies are created yet
        if (typeof module.resource == 'string' && /\.(js|ts)x?$/i.test(module.resource)) {
          let moduleId;
          if (module.resource.startsWith(options.src)) {
            moduleId = path.relative(options.src, module.resource);
          }
          if (!moduleId && typeof module.userRequest == 'string') {
            moduleId = paths.find(originPath => contextElements[originPath].source === module.userRequest);
            if (moduleId) {
              moduleId = path.normalize(moduleId);
            }
          }
          if (!moduleId && typeof module.rawRequest == 'string' && !module.rawRequest.startsWith('.')) {
            // requested module:
            let index = paths.indexOf(module.rawRequest);
            if (index >= 0) {
              moduleId = module.rawRequest;
            }
          }
          if (moduleId) {
            const originLoader = path.join(__dirname, 'origin-loader.js') + '?' + JSON.stringify({ moduleId });
            module.loaders.unshift(originLoader);
          }
        }
      });
    });
  }
}

module.exports = AureliaWebpackPlugin;
