import { IncludeDependency } from "./IncludeDependency";
import * as estree from 'estree';
import * as webpack from 'webpack';

import { BasicEvaluatedExpression as $BasicEvaluatedExpression, DependencyOptions } from './interfaces';
import { createLogger } from "./logger";
const BasicEvaluatedExpression: $BasicEvaluatedExpression = require("webpack/lib/javascript/BasicEvaluatedExpression");
const TAP_NAME = "Aurelia:Dependencies";

export class AureliaDependenciesPlugin {
  private parserPlugin: ParserPlugin;

  constructor(...methods: string[]) {
    // Always include PLATFORM.moduleName as it's what used in libs.
    if (!methods.includes("PLATFORM_moduleName")) {
      methods.push("PLATFORM_moduleName");
    }
    this.parserPlugin = new ParserPlugin(methods);
  }

  apply(compiler: webpack.Compiler) {
    // compiler.hooks.beforeCompile.tap(TAP_NAME, params => {
    //   const normalModuleFactory = params.normalModuleFactory;

    //   normalModuleFactory.hooks.parser.for("javascript/auto").tap(TAP_NAME, parser => {
    //     this.parserPlugin.apply(parser);
    //   });
    // });
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

function isIdentifier(expr: estree.Expression | estree.Super, name: string): expr is estree.Identifier {
  return expr.type === 'Identifier' && expr.name === name;
}

class AureliaDependency extends IncludeDependency {
  constructor(request: string, 
              public range: [number, number], 
              options?: DependencyOptions) {
    super(request, options);
  }
}

class Template {
  apply(dep: AureliaDependency, source: webpack.sources.ReplaceSource) {
    source.replace(dep.range[0], dep.range[1] - 1, "'" + dep.request.replace(/^async(?:\?[^!]*)?!/, "") + "'");
  };
}

class ParserPlugin {
  logger = createLogger('ParserPlugin');

  constructor(private methods: string[]) {
  }

  apply(parser: webpack.javascript.JavascriptParser) {

    const addDependency = (module: string, range: [number, number], options?: DependencyOptions) => {
      let dep = new AureliaDependency(module, range, options);
      console.log('\n');
      this.logger.log('Adding dependencies', parser.state.current.resource, module, options?.exports ?? []);
      parser.state.current.addDependency(dep);
      return true;
    }

    // The parser will only apply "call PLATFORM.moduleName" on free variables.
    // So we must first trick it into thinking PLATFORM.moduleName is an unbound identifier
    // in the various situations where it is not.

    const hooks = parser.hooks;

    // This covers native ES module, for example:
    //    import { PLATFORM } from "aurelia-pal";
    //    PLATFORM.moduleName("id");
    hooks.evaluateIdentifier.for('PLATFORM.moduleName').tap(TAP_NAME, (expr) => {
      const evaluated = new BasicEvaluatedExpression()
        .setIdentifier("PLATFORM_moduleName")
        .setRange(expr.range!);
      if (parser.state.current.resource.includes('boostrapper')) {
        debugger
      }
      evaluated.getMembers = () => {
        return [];
      };
      return evaluated;
      // if (isIdentifier(expr.property, 'moduleName')
      //   && isIdentifier(expr.object, 'PLATFORM')
      // ) {
      //   debugger;
      // }
      return undefined;
    });
    hooks.call.for('PLATFORM_moduleName').tap(TAP_NAME, expr => {
      if (expr.type !== 'CallExpression'
        || expr.callee.type !== 'MemberExpression'
        || expr.callee.property.type !== 'Identifier'
        || expr.callee.property.name !== 'moduleName'
        || expr.callee.object.type !== 'Identifier'
        || expr.callee.object.name !== 'PLATFORM'
      ) {
        return undefined;
      }
      if (expr.arguments.length === 0 || expr.arguments.length > 2) {
        return;
      }
      parser.evaluateExpression
      let [arg1, arg2] = expr.arguments as estree.Expression[];
      let param1 = parser.evaluateExpression(arg1);
      if (expr.arguments.length === 1) {
        // Normal module dependency
        // PLATFORM.moduleName('some-module')
        addDependency(param1!.string!, expr.range!);
        return true;
      }
      return;
    });
    // hooks.call.for('PLATFORM.moduleName').tap(TAP_NAME, expr => {
    //   debugger;
    //   return false;
    // });
    // hooks.call.for('moduleName').tap(TAP_NAME, expr => {
    //   debugger;
    //   return false;
    // });

    // This covers commonjs modules, for example:
    //    const _aureliaPal = require("aurelia-pal");
    //    _aureliaPal.PLATFORM.moduleName("id");    
    // Or (note: no renaming supported):
    //    const PLATFORM = require("aurelia-pal").PLATFORM;
    //    PLATFORM.moduleName("id");
    // hooks.evaluate.for('javascript/auto').tap(TAP_NAME, (expr: estree.MemberExpression) => {
    //   if (expr.type === 'MemberExpression'
    //     && isIdentifier(expr.property, "moduleName")
    //     && (
    //       expr.object.type === "MemberExpression" && isIdentifier(expr.object.property, "PLATFORM")
    //       || expr.object.type === "Identifier" && expr.object.name === "PLATFORM"
    //     )
    //   ) {
    //     return new BasicEvaluatedExpression()
    //       .setIdentifier("PLATFORM.moduleName")
    //       .setRange(expr.range!);
    //   }
    //   return undefined;
    // });
    // hooks.evaluate.for('MemberExpression').tap(TAP_NAME, (expr: estree.MemberExpression) => {
    //   if (parser.state.current.resource.includes('bootstrapper') && expr.property['name'] === 'moduleName') {
    //     debugger;
    //     return new BasicEvaluatedExpression().setIdentifier('PLATFORM_moduleName').setRange(expr.range!);
    //   }
    //   return undefined;
    // })
    // hooks.callMemberChainOfCallMemberChain.for('PLATFORM').tap(TAP_NAME, (expr, props) => {
    //   debugger;
    // });
    // hooks.callMemberChainOfCallMemberChain.for('moduleName').tap(TAP_NAME, (expr, props) => {
    //   debugger;
    //   new BasicEvaluatedExpression().getMembers = () => [];
    // });
    
    hooks.evaluateCallExpressionMember.for('moduleName').tap(TAP_NAME, (expr) => {
      if (parser.state.current.resource.includes('bootstrapper')) {
        debugger;
      }
      return new BasicEvaluatedExpression().setExpression(expr);
    })
    
    hooks.evaluateCallExpressionMember.for('PLATFORM.moduleName').tap(TAP_NAME, (expr) => {
      if (parser.state.current.resource.includes('bootstrapper')) {
        debugger;
      }
      return new BasicEvaluatedExpression().setExpression(expr);
    })

    hooks.evaluate.for('CallExpression').tap(TAP_NAME, (expr: estree.CallExpression) => {
      const calleeee = expr.callee;
      if (
        calleeee.type === 'MemberExpression'
          && calleeee.object.type === 'Identifier' && calleeee.object.name === 'PLATFORM'
          && calleeee.property.type === 'Identifier' && calleeee.property.name === 'moduleName'
        || calleeee.type === 'Identifier'
          && calleeee.name === 'PLATFORM.moduleName'
      ) {
        console.log('calling PLATFORM.moduleName');
        console.log('arguments:', expr.arguments);
      }
      if (expr.type !== 'CallExpression'
        || !this.methods.includes((expr.callee as estree.Identifier).name)
      ) {
        return undefined;
      }
      if (expr.arguments.length === 0 || expr.arguments.length > 2) {
        return;
      }

      let [arg1, arg2] = expr.arguments as estree.Expression[];
      let param1 = parser.evaluateExpression(arg1);
      if (!param1?.isString())
        return;
      if (expr.arguments.length === 1) {
        // Normal module dependency
        // PLATFORM.moduleName('some-module')
        addDependency(param1.string!, expr.range!);
        return;
      }

      let options: DependencyOptions | undefined;
      let param2 = parser.evaluateExpression(arg2)!;
      if (param2?.isString()) {
        // Async module dependency
        // PLATFORM.moduleName('some-module', 'chunk name');
        options = { chunk: param2.string };
      }
      else if (arg2.type === "ObjectExpression") {
        // Module dependency with extended options
        // PLATFORM.moduleName('some-module', { option: value });
        options = {};
        // NOTE:
        // casting here is likely to be correct, as we can declare the following not supported:
        // PLATFORM.moduleName('some-module', { ...options })
        for (let prop of arg2.properties) {
          if (prop.type !== 'Property'
            || prop.method
            // theoretically, PLATFORM.moduleName('..', { ['chunk']: '' })
            // works, but ... not a lot of sense supporting it
            || prop.computed
            || prop.key.type !== "Identifier"
          )
            continue;

          let value = parser.evaluateExpression(prop.value as estree.Literal);
          switch (prop.key.name) {
            case "chunk":
              if (value?.isString()) 
                options.chunk = value.string;
              break;
            case "exports":
              if (value?.isArray() && value.items!.every(v => v.isString()))
                options.exports = value.items!.map(v => v.string!);
              break;
          }
        }
      }
      else {
        // Unknown PLATFORM.moduleName() signature
        return;
      }
      console.log('adjusted for', expr);
      debugger;
      addDependency(param1.string!, expr.range!, options);
      return;
    });
  }
}
