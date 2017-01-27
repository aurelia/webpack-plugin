import path = require("path");
export const preserveModuleName = Symbol();

// This plugins preserves the module names of IncludeDependency and 
// AureliaDependency so that they can be dynamically requested by 
// aurelia-loader.
// All other dependencies are handled by webpack itself and don't
// need special treatment.
export class PreserveModuleNamePlugin {
  apply(compiler: Webpack.Compiler) {
    compiler.plugin("compilation", compilation => {
      compilation.plugin("before-module-ids", modules => {
        let { modules: roots, extensions, alias } = compilation.options.resolve;
        roots = roots.map(x => path.resolve(x));
        const normalizers = extensions.map(x => new RegExp(x.replace(/\./g, "\\.") + "$", "i"));

        for (let module of getPreservedModules(modules)) {
          let relative = fixNodeModule(module, modules) || 
                         makeModuleRelative(roots, module.resource) ||
                         aliasRelative(alias, module.resource);
          
          // TODO: we should probably report an error if we can't figure out a name for an Aurelia dependency.
          if (!relative) continue;
          
          // Remove default extensions 
          normalizers.forEach(n => relative = relative!.replace(n, ""));
          
          // Keep "async!" in front of code splits proxies, they are used by aurelia-loader
          if (/^async[?!]/.test(module.rawRequest)) 
            relative = "async!" + relative;
                  
          module.id = relative.replace(/\\/g, "/");
        }
      })
    });
  }
};

function getPreservedModules(modules: Webpack.Module[]) {
  return new Set(
    modules.filter(m => m.reasons.some(r => r.dependency[preserveModuleName]))
  );
}

function aliasRelative(aliases: {[key: string]: string } | null, resource: string) {
  // We consider that aliases point to local folder modules.
  // For example: `"my-lib": "../my-lib/src"`.
  // Basically we try to make the resource relative to the alias target,
  // and if it works we build the id from the alias name.
  // So file `../my-lib/src/index.js` becomes `my-lib/index.js`.
  // Note that this only works with aliases pointing to folders, not files.
  // To have a "default" file in the folder, the following construct works:
  // alias: { "mod$": "src/index.js", "mod": "src" }
  if (!aliases) return null;
  for (let name in aliases) {
    let root = path.resolve(aliases[name]);
    let relative = path.relative(root, resource);
    if (relative.startsWith("..")) continue;
    name = name.replace(/\$$/, ""); // A trailing $ indicates an exact match in webpack
    return relative ? name + "/" + relative : name;
  }
  return null;
}

function makeModuleRelative(roots: string[], resource: string) {
  for (let root of roots) {
    let relative = path.relative(root, resource);
    if (!relative.startsWith("..")) return relative;
  }
  return null;
}

function fixNodeModule(module: Webpack.Module, allModules: Webpack.Module[]) {
  if (!/\bnode_modules\b/i.test(module.resource)) return null;
  // The problem with node_modules is that often the root of the module is not /node_modules/my-lib
  // Webpack is going to look for `main` in `project.json` to find where the main file actually is.
  // And this can of course be configured differently with `resolve.alias`, `resolve.mainFields` & co.
  
  // Our best hope is that the file was not required as a relative path, then we can just preserve that.
  if (!module.rawRequest.startsWith(".")) return module.rawRequest;

  // Otherwise we need to build the relative path from the module root, which as explained above is hard to find.
  // Ideally we could use webpack resolvers, but they are currently async-only, which can't be used in before-modules-id
  // See https://github.com/webpack/webpack/issues/1634
  // Instead, we'll look for the root library module, because it should have been requested somehow and work from there.
  // Note that the negative lookahead (?!.*node_modules) ensures that we only match the last node_modules/ folder in the path,
  // in case the package was located in a sub-node_modules (which can occur in special circumstances).
  let name = /\bnode_modules[\\/](?!.*\bnode_modules\b)([^\\/]*)/i.exec(module.resource)![1];
  let entry = allModules.find(m => m.rawRequest === name);
  if (!entry) throw new Error("PreserveModuleNamePlugin: Unable to find root of module " + name);
  return name + "/" + path.relative(path.dirname(entry.resource), module.resource);
}
