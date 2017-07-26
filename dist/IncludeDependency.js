"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PreserveExportsPlugin_1 = require("./PreserveExportsPlugin");
const PreserveModuleNamePlugin_1 = require("./PreserveModuleNamePlugin");
const ModuleDependency = require("webpack/lib/dependencies/ModuleDependency");
const NullDependency = require("webpack/lib/dependencies/NullDependency");
class IncludeDependency extends ModuleDependency {
    constructor(request, options) {
        let chunk = options && options.chunk;
        super(chunk ? `async?lazy&name=${chunk}!${request}` : request);
        this.options = options;
    }
    get type() {
        return "aurelia module";
    }
    getReference() {
        let importedNames = this.options && this.options.exports;
        return importedNames ?
            { module: this.module, importedNames } :
            super.getReference();
    }
    get [PreserveModuleNamePlugin_1.preserveModuleName]() {
        return true;
    }
    get [PreserveExportsPlugin_1.dependencyImports]() {
        return this.options && this.options.exports;
    }
}
exports.IncludeDependency = IncludeDependency;
;
exports.Template = NullDependency.Template;
