"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = exports.IncludeDependency = void 0;
const PreserveExportsPlugin_1 = require("./PreserveExportsPlugin");
const PreserveModuleNamePlugin_1 = require("./PreserveModuleNamePlugin");
const webpack = require("webpack");
const ClassSerializer_1 = require("./ClassSerializer");
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
        var _a, _b;
        // when there's no specific exports are targetted,
        // passing an empty array means preserving all
        return [{ name: (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.exports) !== null && _b !== void 0 ? _b : [], canMangle: false }];
    }
    get [PreserveModuleNamePlugin_1.preserveModuleName]() {
        return true;
    }
    get [PreserveExportsPlugin_1.dependencyImports]() {
        var _a;
        return (_a = this.options) === null || _a === void 0 ? void 0 : _a.exports;
    }
    serialize(context) {
        context.write(this.options);
        super.serialize(context);
    }
    deserialize(context) {
        this.options = context.read();
        super.deserialize(context);
    }
}
exports.IncludeDependency = IncludeDependency;
;
webpack.util.serialization.register(IncludeDependency, "IncludeDependency", "IncludeDependency", new ClassSerializer_1.ClassSerializer(IncludeDependency));
exports.Template = webpack.dependencies.NullDependency.Template;
