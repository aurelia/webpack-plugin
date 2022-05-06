"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AureliaDependenciesPlugin = void 0;
const IncludeDependency_1 = require("./IncludeDependency");
const ClassSerializer_1 = require("./ClassSerializer");
const webpack = require("webpack");
const PreserveExportsPlugin_1 = require("./PreserveExportsPlugin");
const BasicEvaluatedExpression = require("webpack/lib/javascript/BasicEvaluatedExpression");
const TAP_NAME = "Aurelia:Dependencies";
class AureliaDependency extends IncludeDependency_1.IncludeDependency {
    constructor(request, range, options) {
        super(request, options);
        this.range = range;
    }
    get type() {
        return `${super.type}/AureliaDependency`;
    }
    get [PreserveExportsPlugin_1.dependencyImports]() {
        return webpack.Dependency.EXPORTS_OBJECT_REFERENCED;
    }
}
webpack.util.serialization.register(AureliaDependency, "AureliaDependency", "AureliaDependency", new ClassSerializer_1.ClassSerializer(AureliaDependency));
class Template {
    apply(dep, source) {
        source.replace(dep.range[0], dep.range[1] - 1, "'" + dep.request.replace(/^async(?:\?[^!]*)?!/, "") + "'");
    }
    ;
}
class ParserPlugin {
    constructor(methods) {
        this.methods = methods;
    }
    apply(parser) {
        function addDependency(module, range, options) {
            let dep = new AureliaDependency(module, range, options);
            parser.state.current.addDependency(dep);
            return true;
        }
        // The parser will only apply "call PLATFORM.moduleName" on free variables.
        // So we must first trick it into thinking PLATFORM.moduleName is an unbound identifier
        // in the various situations where it is not.
        const hooks = parser.hooks;
        hooks.evaluate.for('MemberExpression').tap(TAP_NAME, (expr) => {
            if (expr.property.type === 'Identifier'
                && expr.property.name === 'moduleName'
                // PLATFORM.moduleName(...)
                && (expr.object.type === 'Identifier' && expr.object.name === 'PLATFORM'
                    // _aureliaPal.PLATFORM.moduleName(...)
                    // require('aurelia-pal').PLATFORM.moduleName(...)
                    // import('aurelia-pal').then(pal => pal.PLATFORM.moduleName(...))
                    // import('aurelia-pal').then({ PLATFORM } => PLATFORM.moduleName(...))
                    || expr.object.type === 'MemberExpression'
                        && expr.object.property.type === 'Identifier'
                        && expr.object.property.name === 'PLATFORM')) {
                return new BasicEvaluatedExpression()
                    .setIdentifier('PLATFORM.moduleName', undefined, () => [])
                    .setRange(expr.range);
            }
            return undefined;
        });
        for (let method of this.methods) {
            hooks.call.for(method).tap(TAP_NAME, (expr) => {
                if (expr.arguments.length === 0 || expr.arguments.length > 2) {
                    return;
                }
                let [arg1, arg2] = expr.arguments;
                let param1 = parser.evaluateExpression(arg1);
                if (!param1.isString())
                    return;
                if (expr.arguments.length === 1) {
                    // Normal module dependency
                    // PLATFORM.moduleName('some-module')
                    return addDependency(param1.string, expr.range);
                }
                let options;
                let param2 = parser.evaluateExpression(arg2);
                if (param2.isString()) {
                    // Async module dependency
                    // PLATFORM.moduleName('some-module', 'chunk name');
                    options = { chunk: param2.string };
                }
                else if (arg2.type === "ObjectExpression") {
                    // Module dependency with extended options
                    // PLATFORM.moduleName('some-module', { option: value });
                    options = {};
                    for (let prop of arg2.properties) {
                        if (prop.type !== 'Property' || prop.key.type !== "Identifier")
                            continue;
                        let value = parser.evaluateExpression(prop.value);
                        switch (prop.key.name) {
                            case "chunk":
                                if (value.isString())
                                    options.chunk = value.string;
                                break;
                            case "exports":
                                if (value.isArray() && value.items.every(v => v.isString()))
                                    options.exports = value.items.map(v => v.string);
                                break;
                        }
                    }
                }
                else {
                    // Unknown PLATFORM.moduleName() signature
                    return;
                }
                return addDependency(param1.string, expr.range, options);
            });
        }
    }
}
class AureliaDependenciesPlugin {
    constructor(...methods) {
        // Always include PLATFORM.moduleName as it's what used in libs.
        if (!methods.includes("PLATFORM.moduleName")) {
            methods.push("PLATFORM.moduleName");
        }
        this.parserPlugin = new ParserPlugin(methods);
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(TAP_NAME, (compilation, params) => {
            const normalModuleFactory = params.normalModuleFactory;
            compilation.dependencyFactories.set(AureliaDependency, normalModuleFactory);
            compilation.dependencyTemplates.set(AureliaDependency, new Template());
            const handler = (parser) => {
                this.parserPlugin.apply(parser);
            };
            normalModuleFactory.hooks.parser.for("javascript/dynamic").tap(TAP_NAME, handler);
            normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, handler);
            normalModuleFactory.hooks.parser.for("javascript/esm").tap(TAP_NAME, handler);
        });
    }
}
exports.AureliaDependenciesPlugin = AureliaDependenciesPlugin;
