"use strict";
const BaseIncludePlugin_1 = require("./BaseIncludePlugin");
const path = require("path");
class ModuleDependenciesPlugin extends BaseIncludePlugin_1.BaseIncludePlugin {
    /**
     * Each hash member is a module name, for which additional module names (or options) are added as dependencies.
     */
    constructor(hash) {
        super();
        this.root = path.resolve();
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
        this.hash = hash;
    }
    apply(compiler) {
        const hashKeys = Object.getOwnPropertyNames(this.hash);
        if (hashKeys.length === 0)
            return;
        compiler.plugin("before-compile", (params, cb) => {
            // Map the modules passed in ctor to actual resources (files) so that we can
            // recognize them no matter what the rawRequest was (loaders, relative paths, etc.)
            this.modules = {};
            const resolve = compiler.resolvers.normal.resolve.bind(compiler.resolvers.normal, null, this.root);
            let countdown = hashKeys.length;
            for (let module of hashKeys) {
                resolve(module, (err, resource) => {
                    this.modules[resource] = this.hash[module];
                    if (--countdown === 0)
                        cb();
                });
            }
        });
        super.apply(compiler);
    }
    parser(compilation, parser, addDependency) {
        parser.plugin("program", () => {
            const deps = this.modules[parser.state.module.resource];
            if (deps)
                deps.forEach(addDependency);
        });
    }
}
exports.ModuleDependenciesPlugin = ModuleDependenciesPlugin;
