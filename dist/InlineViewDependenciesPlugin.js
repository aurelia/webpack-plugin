"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineViewDependenciesPlugin = void 0;
// This plugins tries to detect @inlineView('<template>...</template>') and process its dependencies
// like HtmlDependenciesPlugin does.
const BaseIncludePlugin_1 = require("./BaseIncludePlugin");
const htmlLoader = require("./html-requires-loader");
const BasicEvaluatedExpression = require("webpack/lib/javascript/BasicEvaluatedExpression");
const TAP_NAME = "Aurelia:InlineViewDependencies";
// const JavaScriptParser = webpack.javascript.JavascriptParser;
class InlineViewDependenciesPlugin extends BaseIncludePlugin_1.BaseIncludePlugin {
    parser(compilation, parser, add) {
        // The parser will only apply "call inlineView" on free variables.
        // So we must first trick it into thinking inlineView is an unbound identifier
        // in the various situations where it is not.
        // This covers native ES module, for example:
        //    import { inlineView } from "aurelia-framework";
        //    inlineView("<template>");
        parser.hooks.evaluateIdentifier.for('javascript/auto').tap(TAP_NAME, (expr) => {
            if (expr.name === "inlineView") {
                return new BasicEvaluatedExpression().setIdentifier("inlineView").setRange(expr.range);
            }
            return undefined;
        });
        // This covers commonjs modules, for example:
        //    const _aurelia = require("aurelia-framework");
        //    _aurelia.inlineView("<template>");
        // Or (note: no renaming supported):
        //    const inlineView = require("aurelia-framework").inlineView;
        //    inlineView("<template>");
        parser.hooks.evaluate.for('javascript/auto').tap(TAP_NAME, expr => {
            // PLATFORM.moduleName
            // -> MemberExpression [object: Identifier(PLATFORM)] [property: Identifier(moduleName)]
            if (expr.type === 'MemberExpression' && expr.property.name === "inlineView") {
                return new BasicEvaluatedExpression().setIdentifier("inlineView").setRange(expr.range);
            }
            return undefined;
        });
        parser.hooks.call.for('javascript/auto').tap(TAP_NAME, $expr => {
            const expr = $expr;
            if (expr.arguments.length !== 1)
                return;
            let arg1 = expr.arguments[0];
            let param1 = parser.evaluateExpression(arg1);
            if (!(param1 === null || param1 === void 0 ? void 0 : param1.isString())) {
                return;
            }
            let modules;
            try {
                modules = htmlLoader.modules(param1.string);
            }
            catch (e) {
                return;
            }
            modules.forEach(add);
        });
    }
}
exports.InlineViewDependenciesPlugin = InlineViewDependenciesPlugin;
