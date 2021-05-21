"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = exports.IncludeDependency = void 0;
const PreserveExportsPlugin_1 = require("./PreserveExportsPlugin");
const PreserveModuleNamePlugin_1 = require("./PreserveModuleNamePlugin");
const webpack = require("webpack");
class IncludeDependency extends webpack.dependencies.ModuleDependency {
    constructor(request, options) {
        let chunk = options && options.chunk;
        super(chunk ? `async?lazy&name=${chunk}!${request}` : request);
        this.options = options;
    }
    // @ts-expect-error
    get type() {
        return IncludeDependency.name;
    }
    getReferencedExports(moduleGraph) {
        var _a;
        return ((_a = this.options) === null || _a === void 0 ? void 0 : _a.exports)
            ? [{ name: this.options.exports, canMangle: false }]
            : webpack.Dependency.NO_EXPORTS_REFERENCED;
    }
    get [PreserveModuleNamePlugin_1.preserveModuleName]() {
        return true;
    }
    get [PreserveExportsPlugin_1.dependencyImports]() {
        var _a;
        return (_a = this.options) === null || _a === void 0 ? void 0 : _a.exports;
    }
}
exports.IncludeDependency = IncludeDependency;
;
exports.Template = webpack.dependencies.NullDependency.Template;
