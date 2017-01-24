export const dependencyImports = Symbol();
const moduleExports = Symbol();
const nativeIsUsed = Symbol();

function getModuleExports(module: Webpack.Module) {
  let set = module[moduleExports];
  if (!set) {
    module[moduleExports] = set = new Set();
    module[nativeIsUsed] = module.isUsed;
    module.isUsed = function (this: Webpack.Module, name) {
    return this[moduleExports].has(name) ?
      name :
      module[nativeIsUsed](name);
    };
  }
  return set;
}

export class PreserveExportsPlugin {
  apply(compiler: Webpack.Compiler) {
    compiler.plugin("compilation", compilation => {
      compilation.plugin("finish-modules", modules => {        
        for (let module of modules) {
          for (let reason of module.reasons) {
            let dep = reason.dependency;
            let imports = dep[dependencyImports];
            if (!imports) continue;            
            let set = getModuleExports(module);
            for (let e of imports)
              set.add(e);
          }
        }
      });
    });
  }
};
