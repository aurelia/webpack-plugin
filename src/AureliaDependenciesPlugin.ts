import { IncludeDependency } from "./IncludeDependency";
import { ClassSerializer } from "./ClassSerializer";
import * as estree from 'estree';
import * as webpack from 'webpack';

import { BasicEvaluatedExpression as $BasicEvaluatedExpression, DependencyOptions } from './interfaces';
import { dependencyImports } from "./PreserveExportsPlugin";
const BasicEvaluatedExpression: $BasicEvaluatedExpression = require("webpack/lib/javascript/BasicEvaluatedExpression");
const TAP_NAME = "Aurelia:Dependencies";

class AureliaDependency extends IncludeDependency {
  constructor(public request: string,
    public range: [number, number],
    options?: DependencyOptions) {
    super(request, options);
  }

  get type() {
    return `${super.type}/AureliaDependency`;
  }

  get [dependencyImports]() {
    return webpack.Dependency.EXPORTS_OBJECT_REFERENCED as any;
  }

  serialize(context: any) {
    const { write } = context;
    write(this.range);
    super.serialize(context);
  }

  deserialize(context: any) {
    const { read } = context;
    this.range = read();
    super.deserialize(context);
  }
}

webpack.util.serialization.register(AureliaDependency, "AureliaDependency", null as any, new ClassSerializer(AureliaDependency));

class Template {
  apply(dep: AureliaDependency, source: webpack.sources.ReplaceSource) {
    source.replace(dep.range[0], dep.range[1] - 1, "'" + dep.request.replace(/^async(?:\?[^!]*)?!/, "") + "'");
  };
}

class ParserPlugin {
  constructor(private methods: string[]) {
  }

  apply(parser: webpack.javascript.JavascriptParser) {

    function addDependency(module: string, range: [number, number], options?: DependencyOptions) {
      let dep = new AureliaDependency(module, range, options);
      parser.state.current.addDependency(dep);
      return true;
    }

    // The parser will only apply "call PLATFORM.moduleName" on free variables.
    // So we must first trick it into thinking PLATFORM.moduleName is an unbound identifier
    // in the various situations where it is not.

    const hooks = parser.hooks;

    hooks.evaluate.for('MemberExpression').tap(TAP_NAME, (expr: estree.MemberExpression) => {
      if (expr.property.type === 'Identifier'
        && expr.property.name === 'moduleName'
        // PLATFORM.moduleName(...)
        && (expr.object.type === 'Identifier' && expr.object.name === 'PLATFORM'
          // _aureliaPal.PLATFORM.moduleName(...)
          // require('aurelia-pal').PLATFORM.moduleName(...)
          // import('aurelia-pal').then(pal => pal.PLATFORM.moduleName(...))
          // import('aurelia-pal').then({ PLATFORM } => PLATFORM.moduleName(...))
          || expr.object.type === 'MemberExpression'
          && expr.object.property.type === 'Identifier'
          && expr.object.property.name === 'PLATFORM'
        )
      ) {
        return new BasicEvaluatedExpression()
          .setIdentifier('PLATFORM.moduleName', undefined, () => [])
          .setRange(expr.range!);
      }
      return undefined;
    });

    for (let method of this.methods) {
      hooks.call.for(method).tap(TAP_NAME, (expr: estree.CallExpression) => {
        if (expr.arguments.length === 0 || expr.arguments.length > 2) {
          return;
        }

        let [arg1, arg2] = expr.arguments as estree.Expression[];
        let param1 = parser.evaluateExpression(arg1)!;
        if (!param1.isString())
          return;
        if (expr.arguments.length === 1) {
          // Normal module dependency
          // PLATFORM.moduleName('some-module')
          return addDependency(param1.string!, expr.range!);
        }

        let options: DependencyOptions | undefined;
        let param2 = parser.evaluateExpression(arg2)!;
        if (param2.isString()) {
          // Async module dependency
          // PLATFORM.moduleName('some-module', 'chunk name');
          options = { chunk: param2.string };
        }
        else if (arg2.type === "ObjectExpression") {
          // Module dependency with extended options
          // PLATFORM.moduleName('some-module', { option: value });
          options = {};
          for (let prop of arg2.properties) {
            if (prop.type !== 'Property' || prop.key.type !== "Identifier") continue;
            let value = parser.evaluateExpression(prop.value as estree.Literal)!;
            switch (prop.key.name) {
              case "chunk":
                if (value.isString())
                  options.chunk = value.string;
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
        return addDependency(param1.string!, expr.range!, options);
      });
    }
  }
}

export class AureliaDependenciesPlugin {
  private parserPlugin: ParserPlugin;

  constructor(...methods: string[]) {
    // Always include PLATFORM.moduleName as it's what used in libs.
    if (!methods.includes("PLATFORM.moduleName")) {
      methods.push("PLATFORM.moduleName");
    }
    this.parserPlugin = new ParserPlugin(methods);
  }

  apply(compiler: webpack.Compiler) {
    compiler.hooks.compilation.tap(TAP_NAME, (compilation, params) => {
      const normalModuleFactory = params.normalModuleFactory;

      compilation.dependencyFactories.set(AureliaDependency, normalModuleFactory);
      compilation.dependencyTemplates.set(AureliaDependency, new Template());

      const handler = (parser: webpack.javascript.JavascriptParser) => {
        this.parserPlugin.apply(parser);
      }

      normalModuleFactory.hooks.parser.for("javascript/dynamic").tap(TAP_NAME, handler);
      normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, handler);
      normalModuleFactory.hooks.parser.for("javascript/esm").tap(TAP_NAME, handler);
    });
  }
}
