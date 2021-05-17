"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreserveExportsPlugin = exports.dependencyImports = void 0;
const Webpack = require("webpack");
exports.dependencyImports = Symbol();
const moduleExports = Symbol();
const nativeGetUsedName = Symbol();
const useAllExports = Symbol();
const TAP_NAME = "Aurelia:PreserveExports";
function getModuleExports(module, moduleGraph) {
    let exportsInfo = moduleGraph.getExportsInfo(module);
    let set = exportsInfo[moduleExports];
    if (!set) {
        exportsInfo[moduleExports] = set = new Set();
        exportsInfo[nativeGetUsedName] = exportsInfo.getUsedName;
        exportsInfo.getUsedName = function (name, runtime) {
            return set.has(name)
                ? name
                : this[nativeGetUsedName](name, runtime);
        };
    }
    return set;
}
class PreserveExportsPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(TAP_NAME, compilation => {
            compilation.hooks.finishModules.tap(TAP_NAME, modules => {
                for (let module of modules) {
                    for (const connection of compilation.moduleGraph.getIncomingConnections(module)) {
                        let dep = connection.dependency;
                        let imports = dep === null || dep === void 0 ? void 0 : dep[exports.dependencyImports];
                        if (!imports) {
                            continue;
                        }
                        let exportsInfo = compilation.moduleGraph.getExportsInfo(module);
                        if (exportsInfo[useAllExports]) {
                            return;
                        }
                        if (imports === Webpack.Dependency.EXPORTS_OBJECT_REFERENCED) {
                            exportsInfo[nativeGetUsedName] = exportsInfo.getUsedName;
                            exportsInfo[useAllExports] = exportsInfo.getUsedName = function (name, runtime) {
                                return name;
                            };
                        }
                        else {
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
exports.PreserveExportsPlugin = PreserveExportsPlugin;
