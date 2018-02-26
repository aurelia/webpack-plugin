import { IncludeDependency } from "./IncludeDependency";
import NullDependency = require("webpack/lib/dependencies/NullDependency");

const TAP_NAME = "Aurelia:BaseInclude";

export type AddDependency = (request: string | DependencyOptionsEx) => void;

export class BaseIncludePlugin {
  apply(compiler: Webpack.Compiler) {
    compiler.hooks.compilation.tap(TAP_NAME, (compilation, data) => {
      const normalModuleFactory = data.normalModuleFactory;
      compilation.dependencyFactories.set(IncludeDependency, normalModuleFactory);
      compilation.dependencyTemplates.set(IncludeDependency, new NullDependency.Template());

      normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, parser => {
        function addDependency(request: string | DependencyOptionsEx) {
          let options = typeof request === 'object' ? request : undefined;
          let name = options ? options.name : (<string>request);
          parser.state.current.addDependency(new IncludeDependency(name, options));
        }
        
        this.parser(compilation, parser, addDependency);
      });
    });
  }

  parser(compilation: Webpack.Compilation, parser: Webpack.Parser, add: AddDependency) { 
    /* Meant to be overriden */ 
  }  
}
