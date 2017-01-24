"use strict";
exports.dependencyImports = Symbol();
const moduleExports = Symbol();
const nativeIsUsed = Symbol();
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
        compiler.plugin("compilation", compilation => {
            compilation.plugin("finish-modules", modules => {
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
