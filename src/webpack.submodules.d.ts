declare module "webpack/lib/javascript/BasicEvaluatedExpression" {
  import * as webpack from 'webpack';

  interface BasicEvaluatedExpression extends BasicEvaluatedExpressionType {}
  class BasicEvaluatedExpression {}

  type BasicEvaluatedExpressionType = NonNullable<
    ReturnType<Parameters<ReturnType<webpack.javascript.JavascriptParser['hooks']['evaluateIdentifier']['for']>['tap']>[1]>
  >;

  export = BasicEvaluatedExpression;
}

// declare module "loader-utils" {
//   export function getOptions(obj: object): Record<string, any>;
// }

declare module "webpack/lib/javascript/JavaScriptParser" {
  // import { Module } from 'webpack';
  // import BasicEvaluatedExpression = require('webpack/lib/javascript/BasicEvaluatedExpression');
  // import { MemberExpression, Expression, CallExpression } from 'estree';

  // class Parser {
  //   state: {
  //     current: Module;
  //     module: Module;
  //   }
  //   hooks: {
  //     program: Tapable.SyncHook;
  //     evaluate: Tapable.SyncHook1<"MemberExpression", MemberExpression>;
  //     evaluateIdentifier: Tapable.SyncHook1<string, Expression>;
  //     call: Tapable.SyncHook1<string, CallExpression>;
  //   }
  //   // evaluateExpression(expr: Expression): EvaluatedExpression;
  //   evaluateExpression(expr: Expression): BasicEvaluatedExpression;
  // }

  // export = Parser;
}
