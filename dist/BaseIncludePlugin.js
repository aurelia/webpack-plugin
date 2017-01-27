"use strict";
const IncludeDependency_1 = require("./IncludeDependency");
const NullDependency = require("webpack/lib/dependencies/NullDependency");
class BaseIncludePlugin {
    apply(compiler) {
        compiler.plugin("compilation", (compilation, data) => {
            const normalModuleFactory = data.normalModuleFactory;
            compilation.dependencyFactories.set(IncludeDependency_1.IncludeDependency, normalModuleFactory);
            compilation.dependencyTemplates.set(IncludeDependency_1.IncludeDependency, new NullDependency.Template());
            normalModuleFactory.plugin("parser", parser => {
                function addDependency(request) {
                    let options = typeof request === 'object' ? request : undefined;
                    let name = options ? options.name : request;
                    parser.state.current.addDependency(new IncludeDependency_1.IncludeDependency(name, options));
                }
                this.parser(compilation, parser, addDependency);
            });
        });
    }
    parser(compilation, parser, add) {
        /* Meant to be overriden */
    }
}
exports.BaseIncludePlugin = BaseIncludePlugin;
