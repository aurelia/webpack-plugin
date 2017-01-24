import { IncludeDependency } from "./IncludeDependency";
import BasicEvaluatedExpression = require("webpack/lib/BasicEvaluatedExpression");

class AureliaDependency extends IncludeDependency {
  constructor(request: string, 
              public range: [number, number], 
              options?: DependencyOptions) {
    super(request, options);
  }
}

class Template {
  apply(dep: AureliaDependency, source: Webpack.Source) {
    source.replace(dep.range[0], dep.range[1] - 1, "'" + dep.request.replace(/^async(?:\?[^!]*)?!/, "") + "'");
  };
}

class ParserPlugin {
  constructor(private methods: string[]) {
  }

  apply(parser: Webpack.Parser) {

    function addDependency(module: string, range: [number, number], options?: DependencyOptions) {
      let dep = new AureliaDependency(module, range, options);
      parser.state.current.addDependency(dep);
      return true;
    }

    // The parser will only apply "call PLATFORM.moduleName" on free variables.
    // So we must first trick it into thinking PLATFORM.moduleName is an unbound identifier
    // in the various situations where it is not.

    // This covers native ES module, for example:
    //    import { PLATFORM } from "aurelia-pal";
    //    PLATFORM.moduleName("id");
    parser.plugin("evaluate Identifier imported var.moduleName", (expr: Webpack.MemberExpression) => {
      if (expr.property.name === "moduleName" &&
          expr.object.name === "PLATFORM" &&
          expr.object.type === "Identifier") {
        return new BasicEvaluatedExpression().setIdentifier("PLATFORM.moduleName").setRange(expr.range);
      }
      return undefined;
    });

    // This covers commonjs modules, for example:
    //    const _aureliaPal = require("aurelia-pal");
    //    _aureliaPal.PLATFORM.moduleName("id");    
    parser.plugin("evaluate MemberExpression", (expr: Webpack.MemberExpression) => {
      if (expr.property.name === "moduleName" &&
          expr.object.property.name === "PLATFORM") {
        return new BasicEvaluatedExpression().setIdentifier("PLATFORM.moduleName").setRange(expr.range);
      }
      return undefined;
    });

    for (let method of this.methods) {
      parser.plugin("call " + method, (expr: Webpack.CallExpression) => {
        if (expr.arguments.length === 0 || expr.arguments.length > 2) 
          return;
        
        let [arg1, arg2] = expr.arguments;
        let param1 = parser.evaluateExpression(arg1);
        if (!param1.isString()) return;
        if (expr.arguments.length === 1) {
          // Normal module dependency
          // PLATFORM.moduleName('some-module')
          return addDependency(param1.string!, expr.range);
        }

        let chunk: string | undefined;
        let options: DependencyOptions | undefined;
        let param2 = parser.evaluateExpression(arg2);
        if (param2.isString()) {
          // Async module dependency
          // PLATFORM.moduleName('some-module', 'chunk name');
          chunk = param2.string;
        }
        else if (arg2.type === "ObjectExpression") {
          // Module dependency with extended options
          // PLATFORM.moduleName('some-module', { option: value });
          options = {};
          for (let prop of arg2.properties) {
            if (prop.key.type !== "Identifier") continue;
            let value = parser.evaluateExpression(prop.value);
            switch (prop.key.name) {
              case "chunk": 
                if (value.isString()) chunk = value.string;
                break;
              case "exports": 
                if (value.isArray() && value.items!.every(v => v.isString()))
                  options.exports = value.items!.map(v => v.string!);
                break;
            }
          }
        }
        else {
          // Unknown PLATFORM.moduleName() signature
          return;
        }        
        return addDependency(chunk ? `async?lazy&name=${chunk}!${param1.string}` : param1.string!, 
                             expr.range,
                             options);
      });
    }
  }
}

export class AureliaDependenciesPlugin {
  private parserPlugin: ParserPlugin;

  constructor(...methods: string[]) {
    // Always include PLATFORM.moduleName as it's what used in libs.
    if (!methods.includes("PLATFORM.moduleName"))
      methods.push("PLATFORM.moduleName");
    this.parserPlugin = new ParserPlugin(methods);
  }

  apply(compiler: Webpack.Compiler) {
    compiler.plugin("compilation", (compilation, params) => {
      const normalModuleFactory = params.normalModuleFactory;

      compilation.dependencyFactories.set(AureliaDependency, normalModuleFactory);
      compilation.dependencyTemplates.set(AureliaDependency, new Template());

      normalModuleFactory.plugin("parser", parser => {
        parser.apply(this.parserPlugin);
      });
    });
  }
};

