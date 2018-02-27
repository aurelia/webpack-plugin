"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IncludeDependency_1 = require("./IncludeDependency");
const BasicEvaluatedExpression = require("webpack/lib/BasicEvaluatedExpression");
const TAP_NAME = "Aurelia:Dependencies";
class AureliaDependency extends IncludeDependency_1.IncludeDependency {
    constructor(request, range, options) {
        super(request, options);
        this.range = range;
    }
}
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
        // This covers native ES module, for example:
        //    import { PLATFORM } from "aurelia-pal";
        //    PLATFORM.moduleName("id");
        hooks.evaluateIdentifier.tap("imported var.moduleName", TAP_NAME, (expr) => {
            if (expr.property.name === "moduleName" &&
                expr.object.name === "PLATFORM" &&
                expr.object.type === "Identifier") {
                return new BasicEvaluatedExpression().setIdentifier("PLATFORM.moduleName").setRange(expr.range);
            }
            return undefined;
        });
        // This covers commonjs modules, for example:
        //    const _aureliaPal = require("aurelia-pal");
        //    _aureliaPal.PLATFORM.moduleName("id");    
        // Or (note: no renaming supported):
        //    const PLATFORM = require("aurelia-pal").PLATFORM;
        //    PLATFORM.moduleName("id");
        hooks.evaluate.tap("MemberExpression", TAP_NAME, expr => {
            if (expr.property.name === "moduleName" &&
                (expr.object.type === "MemberExpression" && expr.object.property.name === "PLATFORM" ||
                    expr.object.type === "Identifier" && expr.object.name === "PLATFORM")) {
                return new BasicEvaluatedExpression().setIdentifier("PLATFORM.moduleName").setRange(expr.range);
            }
            return undefined;
        });
        for (let method of this.methods) {
            hooks.call.tap(method, TAP_NAME, (expr) => {
                if (expr.arguments.length === 0 || expr.arguments.length > 2)
                    return;
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
                        if (prop.key.type !== "Identifier")
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
        if (!methods.includes("PLATFORM.moduleName"))
            methods.push("PLATFORM.moduleName");
        this.parserPlugin = new ParserPlugin(methods);
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(TAP_NAME, (compilation, params) => {
            const normalModuleFactory = params.normalModuleFactory;
            compilation.dependencyFactories.set(AureliaDependency, normalModuleFactory);
            compilation.dependencyTemplates.set(AureliaDependency, new Template());
            normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, parser => {
                this.parserPlugin.apply(parser);
            });
        });
    }
}
exports.AureliaDependenciesPlugin = AureliaDependenciesPlugin;
;
