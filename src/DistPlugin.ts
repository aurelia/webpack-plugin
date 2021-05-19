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
import { ResolveContext, Resolver, ResolveRequest } from './interfaces';
import * as path from 'path';

export class DistPlugin {
  private rawDist: string;
  private dist: string;

  constructor(dist: string) {
    this.rawDist = dist;
    this.dist = `/dist/${dist}/`;
  }

  apply(resolver: Resolver) {
    if (!this.rawDist) return;

    let dist = this.dist;
    let HookNames = {
      resolve: "resolve",
      internalResolve: "internal-resolve",
    } as const;
    let sourceHookName = HookNames.resolve;
    let targetHookName = HookNames.internalResolve;
    let tapName = "Aurelia:DistPlugin";
    resolver.ensureHook(sourceHookName)
            .tapAsync(tapName, resolveHandlerDoResolve);

    function determineRewrittenPath(filePath: string, resolveContext: ResolveContext) {
      let innerRequest = path.normalize(filePath);
      let rewrittenPath = path.normalize(innerRequest.replace(/[\/\\]dist[\/\\][^/\\]+[\/\\]?/i, dist)).replace(/[\/\\]$/, '');
      return rewrittenPath;
    }

    // If the request contains /dist/xxx/, try /dist/{rawDist}/
    // ----
    // this involves two steps:
    // - first always resolve the request to find the absolute path
    // - 2nd tries to swap /dist/xxxx/ with /dist/{rawDist}/ if possible
    function resolveHandlerDoResolve(request: ResolveRequest, resolveContext: ResolveContext, cb: (err?: any, result?: any) => void) {
      let $request = { ...request };
      let innerRequest = $request.request;
      if (!innerRequest) return cb();
      let rewrittenPath = determineRewrittenPath(innerRequest, resolveContext);

      let newRequest: Partial<ResolveRequest> = { path: $request.path, request: rewrittenPath, fullySpecified: false };
      let tobeNotifiedHook = resolver.ensureHook(targetHookName);
      resolver.doResolve(tobeNotifiedHook, newRequest, "try alternate dist: " + dist + " in only request", resolveContext, (err: any, result: any) => {
        if (err) return cb();
        if (typeof result?.path !== 'string') {
          return cb();
        }
        let rewrittenPath = determineRewrittenPath(result.path, resolveContext);
        if (rewrittenPath === result.path) {
          return cb(null, result);
        }
        newRequest = { path: $request.path, request: rewrittenPath, fullySpecified: false };
        resolver.doResolve(tobeNotifiedHook, newRequest, "try alternate dist " + dist + " in full path", resolveContext, (err: any, result: any) => {
          if (err) return cb();
          if (result) return cb(null, result);
          return cb();
        });
      });
    }
  }
};
