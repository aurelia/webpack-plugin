"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseIncludePlugin = void 0;
const IncludeDependency_1 = require("./IncludeDependency");
const webpack = require("webpack");
const TAP_NAME = "Aurelia:BaseInclude";
const NullDependency = webpack.dependencies.NullDependency;
class BaseIncludePlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(TAP_NAME, (compilation, data) => {
            const normalModuleFactory = data.normalModuleFactory;
            compilation.dependencyFactories.set(IncludeDependency_1.IncludeDependency, normalModuleFactory);
            compilation.dependencyTemplates.set(IncludeDependency_1.IncludeDependency, new NullDependency.Template());
            const handler = (parser) => {
                const addDependency = (request) => {
                    let options = typeof request === 'object' ? request : undefined;
                    let name = options ? options.name : request;
                    parser.state.current.addDependency(new IncludeDependency_1.IncludeDependency(name, options));
                };
                this.parser(compilation, parser, addDependency);
            };
            normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, handler);
            normalModuleFactory.hooks.parser.for("javascript/dynamic").tap(TAP_NAME, handler);
            normalModuleFactory.hooks.parser.for("javascript/esm").tap(TAP_NAME, handler);
        });
    }
    parser(compilation, parser, add) {
        /* Meant to be overriden */
    }
}
exports.BaseIncludePlugin = BaseIncludePlugin;
