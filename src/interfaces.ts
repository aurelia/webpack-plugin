import { Resolver, ResolveContext, ResolveRequest, ResolveOptions } from 'enhanced-resolve';
// import * as webpack from 'webpack';

export { Resolver, ResolveContext, ResolveRequest, ResolveOptions };

declare module 'enhanced-resolve' {
  export interface ResolveContext {
    // from internal usages
    name: string;
    path: string;
    request: string;
    query: string;
    fragment: string;
    directory: string;
    module: 'module' | '';
  }
}

export interface IResolverPlugin {
  applyResolver(resolver: Resolver): void;
}
