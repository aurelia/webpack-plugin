// This plugins tries to detect @inlineView('<template>...</template>') and process its dependencies
// like HtmlDependenciesPlugin does.
import { AddDependency, BaseIncludePlugin } from './BaseIncludePlugin';

import BasicEvaluatedExpression = require("webpack/lib/javascript/BasicEvaluatedExpression");
import htmlLoader = require("./html-requires-loader");

const TAP_NAME = "Aurelia:InlineViewDependencies";

export class InlineViewDependenciesPlugin extends BaseIncludePlugin {
  parser(compilation: Webpack.Compilation, parser: Webpack.Parser, add: AddDependency) { 
    // The parser will only apply "call inlineView" on free variables.
    // So we must first trick it into thinking inlineView is an unbound identifier
    // in the various situations where it is not.

    // This covers native ES module, for example:
    //    import { inlineView } from "aurelia-framework";
    //    inlineView("<template>");
    parser.hooks.evaluateIdentifier.tap("imported var", TAP_NAME, (expr: Webpack.IdentifierExpression) => {
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
    parser.hooks.evaluate.tap("MemberExpression", TAP_NAME, expr => {
      if (expr.property.name === "inlineView") {
        return new BasicEvaluatedExpression().setIdentifier("inlineView").setRange(expr.range);
      }
      return undefined;
    });

    parser.hooks.call.tap("inlineView", TAP_NAME, expr => {
      if (expr.arguments.length !== 1) 
        return;
      
      let arg1 = expr.arguments[0];
      let param1 = parser.evaluateExpression(arg1);
      if (!param1.isString()) return;
      
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
