import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import { htmlSymbol } from "./html-requires-loader";
import * as webpack from 'webpack';

export class HtmlDependenciesPlugin extends BaseIncludePlugin {
  parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, addDependency: AddDependency) {
    parser.hooks.program.tap("Aurelia:HtmlDependencies", () => {
      const deps = parser.state.current[htmlSymbol];
      if (deps) {
        deps.forEach(addDependency);
      }
    });
  }
};
