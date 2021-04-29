// This plugin tries to convert a request containing `/dist/xxx/` to the configured distribution if it exists.
// For example new DistPlugin('native-modules') will turn 
//    ./dist/commonjs/aurelia-framework.js 
// into 
//    ./dist/native-modules/aurelia-framework.js
// This is very similar to configuring 
//    resolve.alias = { './dist/commonjs': './dist/native-modules' }
// except it applies no matter the original dist subfolder and it falls back to the original path
// if the alternate distribution does not exist.
// The alias configuration above will fail the build if a third party lib also uses ./dist/commonjs
// but does not include a ./dist/native-modules
import * as webpack from 'webpack';
import { Resolver } from './interfaces';
import { ResolverPluginBase } from './ResolverPluginBase';

export class DistPlugin extends ResolverPluginBase {
  private dist: string;

  get pluginName() { return 'DistPlugin'; }

  constructor(dist: string) {
    super();
    this.dist = `/dist/${dist}/`;
  }

  // apply(compiler: webpack.Compiler) {
  //   compiler.hooks.compilation.tap('DistPlugin', (compilation, data) => {
  //     const normalModuleFactory = data.normalModuleFactory;
  //     normalModuleFactory.hooks.beforeResolve.tap('DistPlugin', (resolveData) => {
  //       let { request } = resolveData;
  //       // If the request contains /dist/xxx/, try /dist/{dist}/ first
  //       let rewritten = request.replace(/\/dist\/[^/]+\//i, this.dist);
  //       if (rewritten !== request) {
  //         return {
  //           ...resolveData,
  //           request: rewritten
  //         };
  //       }

  //       return undefined;
  //     });
  //   });
  // };

  useResolver(resolver: Resolver) {
    if (!this.dist) {
      return;
    }
    resolver.getHook("before-described-resolve")
            .tapAsync("Aurelia:Dist", (request, resolveContext: object, cb: (err?: any, result?: any) => void) => {
      // If the request contains /dist/xxx/, try /dist/{dist}/ first
      let rewritten = request.request.replace(/\/dist\/[^/]+\//i, this.dist);
      if (rewritten !== request.request) {
        let newRequest = Object.assign({}, request, { request: rewritten });
        resolver.doResolve(resolver.getHook("described-resolve"), newRequest, "try alternate " + this.dist, {}, cb);
      }
      else
        cb(); // Path does not contain /dist/xxx/, continue normally
    });
  }

  // apply(resolver: webpack.Resolver) {
  //   if (!this.dist)
  //     return;
  //   resolver.getHook("before-described-resolve")
  //           .tapAsync("Aurelia:Dist", (request, resolveContext: object, cb: (err?: any, result?: any) => void) => {
  //     // If the request contains /dist/xxx/, try /dist/{dist}/ first
  //     let rewritten = request.request.replace(/\/dist\/[^/]+\//i, this.dist);
  //     if (rewritten !== request.request) {
  //       let newRequest = Object.assign({}, request, { request: rewritten });
  //       resolver.doResolve(resolver.getHook("described-resolve"), newRequest, "try alternate " + this.dist, {}, cb);
  //     }
  //     else
  //       cb(); // Path does not contain /dist/xxx/, continue normally
  //   });
  // }
};