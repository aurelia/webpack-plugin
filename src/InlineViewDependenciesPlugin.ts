// This plugins tries to detect @inlineView('<template>...</template>') and process its dependencies
// like HtmlDependenciesPlugin does.
/// <reference path="./webpack.submodules.d.ts" />
import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import BasicEvaluatedExpression = require("webpack/lib/javascript/BasicEvaluatedExpression");
// import JavaScriptParser = require('webpack/lib/javascript/JavaScriptParser');
import htmlLoader = require("./html-requires-loader");
import * as webpack from 'webpack';
import * as estree from 'estree';

const TAP_NAME = "Aurelia:InlineViewDependencies";
// const JavaScriptParser = webpack.javascript.JavascriptParser;

export class InlineViewDependenciesPlugin extends BaseIncludePlugin {
  parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, add: AddDependency) { 
    // The parser will only apply "call inlineView" on free variables.
    // So we must first trick it into thinking inlineView is an unbound identifier
    // in the various situations where it is not.

    // This covers native ES module, for example:
    //    import { inlineView } from "aurelia-framework";
    //    inlineView("<template>");
    parser.hooks.evaluateIdentifier.for('javascript/auto').tap(TAP_NAME, (expr) => {
      if ((expr as estree.Identifier).name === "inlineView") {
        return new BasicEvaluatedExpression().setIdentifier("inlineView").setRange(expr.range!);
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
      if (expr.type === 'MemberExpression' && (expr.property as estree.Identifier).name === "inlineView") {
        return new BasicEvaluatedExpression().setIdentifier("inlineView").setRange(expr.range!);
      }
      return undefined;
    });

    parser.hooks.call.for('javascript/auto').tap(TAP_NAME, $expr => {
      const expr = $expr as estree.CallExpression;
      if (expr.arguments.length !== 1) 
        return;

      let arg1 = expr.arguments[0] as estree.Expression;
      let param1 = parser.evaluateExpression(arg1);
      if (!param1?.isString()) {
        return;
      }

      let modules;
      try { 
        modules = htmlLoader.modules(param1.string!); 
      }
      catch (e) {
        return;
      }
      modules.forEach(add);
    });
  }
}
