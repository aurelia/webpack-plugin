import { IncludeDependency } from "./IncludeDependency";
import * as webpack from 'webpack';
import { DependencyOptionsEx } from "./interfaces";
import { createLogger } from "./logger";

const TAP_NAME = "Aurelia:BaseInclude";
const NullDependency = webpack.dependencies.NullDependency;

export type AddDependency = (request: string | DependencyOptionsEx) => void;

export class BaseIncludePlugin {
  protected logger = createLogger(this.constructor.name);

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(TAP_NAME, (compilation, data) => {
      const normalModuleFactory = data.normalModuleFactory;
      compilation.dependencyFactories.set(IncludeDependency, normalModuleFactory);
      compilation.dependencyTemplates.set(IncludeDependency, new NullDependency.Template());

      const handler = (parser: webpack.javascript.JavascriptParser) => {
        const addDependency = (request: string | DependencyOptionsEx) => {
          let options = typeof request === 'object' ? request : undefined;
          let name = options ? options.name : (request as string);
          console.log('\n');
          this.logger.log('Adding dependency for:\n\t', parser.state.current.resource, '\n\t', JSON.stringify({ name, options }));

          parser.state.current.addDependency(new IncludeDependency(name, options));
        }
        
        this.parser(compilation, parser, addDependency);
      };
      normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, handler);
      normalModuleFactory.hooks.parser.for("javascript/dynamic").tap(TAP_NAME, handler);
      normalModuleFactory.hooks.parser.for("javascript/esm").tap(TAP_NAME, handler);
    });
  }

  parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, add: AddDependency) { 
    /* Meant to be overriden */ 
  }
}
