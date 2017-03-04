import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import { htmlSymbol } from "./html-requires-loader";

export class HtmlDependenciesPlugin extends BaseIncludePlugin {
  parser(compilation: Webpack.Compilation, parser: Webpack.Parser, addDependency: AddDependency) {
    parser.plugin("program", () => {
      const deps = parser.state.current[htmlSymbol];
      if (!deps) return;
      deps.forEach(addDependency);
    });
  }
};
