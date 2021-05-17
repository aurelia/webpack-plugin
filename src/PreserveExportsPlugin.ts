import * as webpack from 'webpack';

export const dependencyImports = Symbol();
const moduleExports = Symbol();
const nativeGetUsedName = Symbol();
const useAllExports = Symbol();

const TAP_NAME = "Aurelia:PreserveExports";

function getModuleExports(module: webpack.NormalModule, moduleGraph: webpack.ModuleGraph) {
  let exportsInfo = moduleGraph.getExportsInfo(module);
  let _set: Set<any> = exportsInfo[moduleExports];
  if (!_set) {
    exportsInfo[moduleExports] = _set = new Set();
    exportsInfo[nativeGetUsedName] = exportsInfo.getUsedName;
    exportsInfo.getUsedName = function(name, runtime) {
      return _set.has(name)
        ? name
        : this[nativeGetUsedName](name, runtime);
    };
  }
  return _set;
}

export class PreserveExportsPlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(TAP_NAME, compilation => {
      compilation.hooks.finishModules.tap(TAP_NAME, modules => {
        for (let module of modules as Iterable<webpack.NormalModule>) {
          for (const connection of compilation.moduleGraph.getIncomingConnections(module)) {
            let dep = connection.dependency;
            let imports = dep?.[dependencyImports];
            if (!imports) {
              continue;
            }

            let exportsInfo = compilation.moduleGraph.getExportsInfo(module);
            if (exportsInfo[useAllExports]) {
              return;
            }
            if (imports === webpack.Dependency.EXPORTS_OBJECT_REFERENCED) {
              exportsInfo[nativeGetUsedName] = exportsInfo.getUsedName;
              exportsInfo[useAllExports] = exportsInfo.getUsedName = function(name: string | string[], runtime) {
                return name;
              };
            } else {
              let set = getModuleExports(module, compilation.moduleGraph);
              for (let e of imports)
                set.add(e);
            }
          }
        }
      });
    });
  }
}
