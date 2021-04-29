import { Resolver, ResolveContext, ResolveRequest, ResolveOptions } from 'enhanced-resolve';
// import * as webpack from 'webpack';

export { Resolver, ResolveContext, ResolveRequest, ResolveOptions };

export interface IResolverPlugin {
  useResolver(resolver: Resolver): void;
}
