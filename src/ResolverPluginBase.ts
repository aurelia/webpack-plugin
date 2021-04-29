import * as webpack from 'webpack';
import { IResolverPlugin, Resolver } from "./interfaces";

export abstract class ResolverPluginBase implements webpack.WebpackPluginInstance, IResolverPlugin {

  abstract readonly pluginName: string;

  apply(compiler: webpack.Compiler) {
    //There are three types of built-in resolvers available on the compiler class:
    // normal: Resolves a module via an absolute or relative path.
    // context: Resolves a module within a given context.
    // loader: Resolves a webpack loader.
    compiler.resolverFactory.hooks.resolver.for('normal').tap(this.pluginName, (resolver) => {
      this.useResolver(resolver);
    });
  }

  useResolver(resolver: Resolver): void {
    // meant to be overridden
  }
}
