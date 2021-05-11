import { IncludeDependency } from "./IncludeDependency";
import * as webpack from 'webpack';

const TAP_NAME = "Aurelia:BaseInclude";
const NullDependency = webpack.dependencies.NullDependency;

export type AddDependency = (request: string | DependencyOptionsEx) => void;

export class BaseIncludePlugin {
  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(TAP_NAME, (compilation, data) => {
      const normalModuleFactory = data.normalModuleFactory;
      compilation.dependencyFactories.set(IncludeDependency, normalModuleFactory);
      compilation.dependencyTemplates.set(IncludeDependency, new NullDependency.Template());

      normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, parser => {
        function addDependency(request: string | DependencyOptionsEx) {
          let options = typeof request === 'object' ? request : undefined;
          let name = options ? options.name : (request as string);
          parser.state.current.addDependency(new IncludeDependency(name, options));
        }
        
        this.parser(compilation, parser, addDependency);
      });
    });
  }

  parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, add: AddDependency) { 
    /* Meant to be overriden */ 
  }
}
