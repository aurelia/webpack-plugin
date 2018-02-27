"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyImports = Symbol();
const moduleExports = Symbol();
const nativeIsUsed = Symbol();
const TAP_NAME = "Aurelia:PreserveExports";
function getModuleExports(module) {
    let set = module[moduleExports];
    if (!set) {
        module[moduleExports] = set = new Set();
        module[nativeIsUsed] = module.isUsed;
        module.isUsed = function (name) {
            return this[moduleExports].has(name) ?
                name :
                module[nativeIsUsed](name);
        };
    }
    return set;
}
class PreserveExportsPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(TAP_NAME, compilation => {
            compilation.hooks.finishModules.tap(TAP_NAME, modules => {
                for (let module of modules) {
                    for (let reason of module.reasons) {
                        let dep = reason.dependency;
                        let imports = dep[exports.dependencyImports];
                        if (!imports)
                            continue;
                        let set = getModuleExports(module);
                        for (let e of imports)
                            set.add(e);
                    }
                }
            });
        });
    }
}
exports.PreserveExportsPlugin = PreserveExportsPlugin;
;
