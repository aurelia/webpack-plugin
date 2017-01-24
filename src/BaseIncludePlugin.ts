import { IncludeDependency } from "./IncludeDependency";
import NullDependency = require("webpack/lib/dependencies/NullDependency");

export type AddDependency = (request: string, options?: DependencyOptions) => void;

export class BaseIncludePlugin {
  apply(compiler: Webpack.Compiler) {
    compiler.plugin("compilation", (compilation, data) => {
      const normalModuleFactory = data.normalModuleFactory;
      compilation.dependencyFactories.set(IncludeDependency, normalModuleFactory);
      compilation.dependencyTemplates.set(IncludeDependency, new NullDependency.Template());

      normalModuleFactory.plugin("parser", parser => {
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
