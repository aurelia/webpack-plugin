var path = require('upath');
var ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');
var resolveTemplates = require('./build-resources');

function getPath(resolvedResource) {
  let input = resolvedResource.source;
  let lazy = resolvedResource.lazy;
  let bundle = resolvedResource.bundle;

  const extension = path.extname(input);
  let output = '';

  // for .css files force the request to the appropriate css loader (https://github.com/aurelia/webpack-plugin/issues/11#issuecomment-212578861)
  switch (extension) {
    case ".css":
      output += `!!css!`;
      break;
    case ".scss":
      output += `!!sass!`;
      break;
    case ".less":
      output += `!!less!`;
      break;
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

class AureliaWebpackPlugin {
  constructor(options = {}) {
    options.root = options.root ? path.normalizeSafe(options.root) : path.dirname(module.parent.filename);
    options.src = options.src ? path.normalizeSafe(options.src) : path.resolve(options.root, 'src');
    options.resourceRegExp = options.resourceRegExp || /aurelia-loader-context/;

    this.options = options;
  }
  
  apply(compiler) {
    compiler.plugin('context-module-factory', cmf => {
      cmf.plugin('before-resolve', (result, callback) => {
        if (!result) return callback();
        if (this.options.resourceRegExp.test(result.request)) {
          result.request = this.options.src;
        }
        return callback(null, result);
      });
      cmf.plugin('after-resolve', (result, callback) => {
        if (!result) return callback();
        const resourcePath = path.normalizeSafe(result.resource);
        if (this.options.src.indexOf(resourcePath, this.options.src.length - resourcePath.length) !== -1) {
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

              resolveTemplates.processAll(this.options).then(contextElements => {
                for (let requireRequestPath of Object.keys(contextElements).reverse()) {
                  let resource = contextElements[requireRequestPath];
                  let newDependency = new ContextElementDependency(getPath(resource), path.joinSafe('./', requireRequestPath));
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
                  // TODO: optional filtering of context (things we don't want to require)
                }
                
                return callback(null, dependencies);
              }, error => {
                console.error('Error processing templates', error.message);
                console.error('-----------------------');
                console.error(error);
                console.error('-----------------------');      
                return callback(error);
              });
            });
        }
        return callback(null, result);
      });
    });
  }
}

module.exports = AureliaWebpackPlugin;
