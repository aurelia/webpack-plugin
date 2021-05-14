import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as path from "path";
import * as webpack from 'webpack';
import { DependencyOptionsEx } from "./interfaces";
import { createLogger } from "./logger";

const TAP_NAME = "Aurelia:ModuleDependencies";

export interface ModuleDependenciesPluginOptions { 
  [module: string]: 
    undefined | 
    string | 
    DependencyOptionsEx | 
    (undefined|string|DependencyOptionsEx)[] 
};

export class ModuleDependenciesPlugin extends BaseIncludePlugin {
  root = path.resolve();
  hash: { [name: string]: (string | DependencyOptionsEx)[] };
  // modules: { [module: string]: (string | DependencyOptionsEx)[] }; // Same has hash but with module names resolved to actual resources
  modules: { [module: string]: { module: string; resource: string; deps: (string | DependencyOptionsEx)[] } }

  /**
   * Each hash member is a module name, for which additional module names (or options) are added as dependencies.
   */
  constructor(hash: ModuleDependenciesPluginOptions) {
    super();
    for (let module in hash) {
      let deps = hash[module];
      if (!Array.isArray(deps)) 
        deps = [deps];
      // For convenience we accept null or undefined entries in the input array.
      // This is for example used by AureliaPlugin to pass the aurelia-app module, 
      // which could be undefined.
      deps = deps.filter(x => !!x);
      if (deps.length === 0)
        delete hash[module];
      else
        hash[module] = deps;
    }
    this.hash = hash as { [name: string]: (string | DependencyOptionsEx)[] };
  }

  apply(compiler: webpack.Compiler) {
    const hashKeys = Object.getOwnPropertyNames(this.hash);
    if (hashKeys.length === 0) return;

    compiler.hooks.beforeCompile.tapPromise(TAP_NAME, () => {
      // Map the modules passed in ctor to actual resources (files) so that we can
      // recognize them no matter what the rawRequest was (loaders, relative paths, etc.)
      this.modules = { };
      const resolver = compiler.resolverFactory.get("normal");
      return Promise
        .all(
          hashKeys.map(module => new Promise<void>(resolve => {
            resolver.resolve({}, this.root, module, {}, (err, resource) => {
              if (err) {
                console.log('error resolving', module);
                console.log(err.message);
                resolve();
                return;
              }
              this.modules[resource as string] = {
                module: module,
                deps: this.hash[module],
                resource: resource as string
              };
              resolve();
            });
          })
        ))
        .then(() => {});
    });

    super.apply(compiler);
  }

  parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, addDependency: AddDependency) {
    parser.hooks.program.tap(TAP_NAME, () => {
      // We try to match the resource, or the initial module request.
      const { module, deps, resource } = this.modules[parser.state.module.resource] || {};
      if (deps) {
        console.log('\n')
        this.logger.log('Adding deps for:\n\t', parser.state.module.resource, '\n\t', JSON.stringify(deps));
        deps.forEach(addDependency);
      }
    });
  }
}
