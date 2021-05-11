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
import { Resolver } from 'enhanced-resolve';
import * as webpack from 'webpack';
// import { dirname } from "path";
// import { ResolveContext } from './interfaces';

export class DistPlugin {
  private dist: string;

  get pluginName() { return 'DistPlugin'; }

  constructor(dist: string) {
    this.dist = `/dist/${dist}/`;
  }

  // TODO: verify the following code against commented apply method below
  // ===========================================
  //
  apply(compiler: webpack.Compiler) {
    let resolver: Resolver;
    compiler.resolverFactory.hooks.resolver.for('normal').tap('DistPlugin', r => {
      resolver = r as Resolver;
    });
    compiler.hooks.normalModuleFactory.tap('DistPlugin', moduleFactory => {
      moduleFactory.hooks.resolve.tapAsync('DistPlugin', (resolveData, callback) => {
        // If the request contains /dist/xxx/, try /dist/{dist}/xxx first
        let rewritten = resolveData.request.replace(/\/dist\/[^/]+\//i, this.dist);
        if (rewritten !== resolveData.request) {
          // resolver.resolve({}, dirname(rewritten), rewritten, {} as ResolveContext, (err, result) => {
          //   if (result) {
          //     callback(null, result);
          //   } else {
          //     callback();
          //   }
          // });
          resolver.doResolve(
            /* hooks to resolver (?) */resolver.hooks.result,
            /* request (?) */{ ...resolveData, request: rewritten },
            /* message (?) */ 'DistPlugin try resolve',
            /* resolve context (?) */{},
            (err: any, result: any) => {
              if (result) {
                callback(null, result);
              } else {
                callback();
              }
            }
          );
        } else {
          callback();
        }
        // try {
        //   compiler.inputFileSystem.stat(rewritten, (err, result) => {
        //     if (!err) {
        //       resolveData.request = rewritten;
        //     }
        //     callback();
        //   });
        // } catch {
        //   callback();
        // }
      });
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
