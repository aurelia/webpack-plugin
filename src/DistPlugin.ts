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
import { createLogger } from './logger';
import * as path from 'path';

// @ts-nocheck

const logger = createLogger('DistPlugin');
// var path = require('path');
var assign = Object.assign;
var forEachBail = require('enhanced-resolve/lib/forEachBail');
var basename = require('enhanced-resolve/lib/getPaths').basename;

// export class DistPlugin {
//   optionsToUse: any;
//   constructor(options: any) {
//     var optionsToUse = (typeof options === 'boolean') ? { honorIndex: options } : (options || {});
//     var mainFields = optionsToUse.honorPackage,
//         exclude = optionsToUse.exclude,
//         include = optionsToUse.include;
//     optionsToUse.mainFields = mainFields !== false && !Array.isArray(mainFields) ? ["main"] : mainFields;
//     // make exclude array if not
//     optionsToUse.exclude = exclude && !Array.isArray(exclude) ? [exclude] : exclude;
//     // make include array if not
//     optionsToUse.include = include && !Array.isArray(include) ? [include] : include;
//     this.optionsToUse = optionsToUse;
//     // return {
//     //   apply: doApply.bind(this, optionsToUse)
//     // };
//   }

//   apply(resolver: Resolver) {
//     doApply.call(this, this.optionsToUse, resolver);
//   }
// };

// function stringIncludes(string: string | string[], maybeString: any) {
//   // String.includes throws if the argument is not a string
//   return typeof maybeString === 'string' ? string.includes(maybeString) : false;
// }

// function doApply(this: DistPlugin, options: { ignoreFn: (arg0: any) => any; exclude: any[]; include: any[]; mainFields: any[]; honorIndex: any; transformFn: (arg0: any, arg1: any, arg2: any) => any; }, resolver: { ensureHook: (arg0: string) => any; getHook: (arg0: string) => { (): any; new(): any; tapAsync: { (arg0: string, arg1: (request: any, resolveContext: any, callback: any) => any): void; new(): any; }; }; join: (arg0: any, arg1: any) => any; doResolve: (arg0: any, arg1: any, arg2: string, arg3: any, arg4: any) => void; }) {
//   // file type taken from: https://github.com/webpack/enhanced-resolve/blob/v4.0.0/test/plugins.js
//   var target = resolver.ensureHook("undescribed-raw-file");
  
//   resolver.getHook("before-existing-directory")
//     .tapAsync("DirectoryNamedWebpackPlugin", (request: { path: any; relativePath: any; }, resolveContext: any, callback: () => any) => {
//       if (options.ignoreFn && options.ignoreFn(request)) {
//         return callback();
//       }
  
//       var dirPath = request.path;
//       var dirName = basename(dirPath);
//       var attempts = [];
  
//       // return if path matches with excludes
//       if (options.exclude && options.exclude.some(function(exclude: any) {
//         return dirPath.search(exclude) >= 0 || stringIncludes(dirPath, exclude);
//       })) {
//         return callback();
//       }
  
//       // return if path doesn't match with includes
//       if (options.include && !options.include.some(function(include: any) {
//         return dirPath.search(include) >= 0 || stringIncludes(dirPath, include);
//       })) {
//         return callback();
//       }
  
//       if (options.mainFields) {
//         try {
//           var pkg = require(path.resolve(dirPath, "package.json"));
//           options.mainFields.forEach(function(field: string | number) {
//             pkg[field] && attempts.push(pkg[field]);
//           });
//         } catch (e) {
//           // No problem, this is optional.
//         }
//       }
  
//       if (options.honorIndex) {
//         attempts.push('index');
//       }
  
//       if (options.transformFn) {
//         var transformResult = options.transformFn(dirName, dirPath, request);
  
//         if (!Array.isArray(transformResult)) {
//           transformResult = [transformResult];
//         }
  
//         transformResult = transformResult.filter(function (attemptName: string | any[]) {
//           return typeof attemptName === 'string' && attemptName.length > 0;
//         });
  
//         attempts = attempts.concat(transformResult);
//       } else {
//         attempts.push(dirName);
//       }
  
//       forEachBail(
//         attempts,
  
//         function (fileName: any, innerCallback: any) {
//           // approach taken from: https://github.com/webpack/enhanced-resolve/blob/v4.0.0/lib/CloneBasenamePlugin.js
//           var filePath = resolver.join(dirPath, fileName);  
//           var obj = assign({}, request, {
//             path: filePath,
//             relativePath: request.relativePath && resolver.join(request.relativePath, fileName)
//           });
//           resolver.doResolve(target, obj, "using path: " + filePath, resolveContext, innerCallback);
//         },
        
//         callback
//       );
//     });
// }

export class DistPlugin {
  private rawDist: string;
  private dist: string;

  constructor(dist: string) {
    this.rawDist = dist;
    this.dist = `/dist/${dist}`;
  }

  apply(resolver: Resolver) {
    if (!this.rawDist) return;

    let set = new Set<string>();
    let dist = this.dist;
    let HookNames = {
      beforeResolve: "before-resolve",
      resolve: "resolve",
      normalResolve: "normal-resolve",
      internalResolve: "internal-resolve",
    } as const;
    let sourceHookName = HookNames.resolve;
    let targetHookName = HookNames.internalResolve;
    let tapName = "Aurelia:DistPlugin";
    // resolver.getHook(hookName)
    //         .tapAsync(tapName, resolveHandlerPlain);
    // resolver.getHook(hookName)
    //         .tapAsync(tapName, resolveHandlerResolve);
    resolver.ensureHook(sourceHookName)
            .tapAsync(tapName, resolveHandlerDoResolve);
            // .tapAsync({ name: tapName, stage: -99 }, resolveHandlerDoResolve);

    function determineRewrittenPath(filePath: string, resolveContext: ResolveContext) {
      // let innerRequest = request.path as string;
      let innerRequest = filePath;
      innerRequest = path.normalize(innerRequest);
      // If the request contains /dist/xxx/, try /dist/{dist}/ first
      let rewrittenPath = path.normalize(innerRequest.replace(/[\/\\]dist[\/\\][^/\\]+[\/\\]?/i, dist)).replace(/[\/\\]$/, '');
      let shouldLog = !set.has(innerRequest);
      if (shouldLog && innerRequest !== rewrittenPath) {
        set.add(innerRequest);
        // logger.log('\n\tRequest', innerRequest, '\n\tRewritten:', rewrittenPath);
      }
      return { rewrittenPath, shouldLog };
    }
    function resolveHandlerDoResolve(request: ResolveRequest, resolveContext: ResolveContext, cb: (err?: any, result?: any) => void) {
      let $request = { ...request };
      let innerRequest = $request.request;
      if (!innerRequest) {
        // never happens
        logger.log('no path', $request.request);
        return cb();
      }
      let userRequest = $request.request;
      // let { rewrittenPath, shouldLog } = determineRewrittenPath($request, resolveContext);
      let { rewrittenPath, shouldLog } = determineRewrittenPath(innerRequest, resolveContext);
      logger.log('\n\tRequest', innerRequest, '\n\tRewritten:', rewrittenPath, '\n\t[request.request]:', request.request);
      // Path does not contain /dist/xxx/, continue normally
      // if (rewrittenPath === innerRequest) {
      //   return cb();
      // }

      let newRequest: Partial<ResolveRequest> = { path: $request.path, request: rewrittenPath, fullySpecified: false };
      let tobeNotifiedHook = resolver.ensureHook(targetHookName);
      resolver.doResolve(tobeNotifiedHook, newRequest, "try alternate dist: " + dist + " with index file", resolveContext, (err: any, result: any) => {
        if (err) return cb();
        if (typeof result.path !== 'string') {
          debugger;
          throw new Error('????');
        }
        // let { rewrittenPath, shouldLog } = determineRewrittenPath($request.path as string, resolveContext);
        let { rewrittenPath, shouldLog } = determineRewrittenPath(result.path, resolveContext);
        if (rewrittenPath === result.path) {
          return cb(null, result);
        }
        if (shouldLog)
          logger.log('\n\tdoResolve (1): for', JSON.stringify(newRequest), '\n\terr:', !!err, 'result:', !!result, '\n');
        // if (result) return cb(null, { ...result });
        // if (!userRequest) {
        //   return cb();
        // }
        // newRequest = { path: rewrittenPath, request: userRequest, fullySpecified: true };
        newRequest = { path: $request.path, request: rewrittenPath, fullySpecified: false };
        resolver.doResolve(tobeNotifiedHook, newRequest, "try alternate dist with non index file", resolveContext, (err: any, result: any) => {
          if (err) return cb();
          if (typeof result.path !== 'string') {
            debugger;
            throw new Error('????');
          }
          // let { rewrittenPath, shouldLog } = determineRewrittenPath($request.path as string, resolveContext);
          if (shouldLog)
            logger.log('\n\tdoResolve (2): for', JSON.stringify(newRequest), '\n\terr:', !!err, 'result:', !!result, '\n');
          if (result) {
            return cb(null, result);
          }
          return cb();
        });
      });
    };
    function resolveHandlerPlain(request: ResolveRequest, resolveContext: ResolveContext, cb: (err?: any, result?: any) => void) {
      let innerRequest = request.path;
      if (!innerRequest) return cb();
      let { rewrittenPath } = determineRewrittenPath(request.request ?? '', resolveContext);
      if (rewrittenPath !== innerRequest) {
        request.path = rewrittenPath;
      }
      return cb();
    }
    function resolveHandlerResolve(request: ResolveRequest, resolveContext: ResolveContext, cb: (err?: any, result?: any) => void) {
      let $request = { ...request };
      let innerRequest = $request.path;
      if (!innerRequest) return cb();
      let userRequest = $request.request;
      let { rewrittenPath, shouldLog } = determineRewrittenPath($request.request ?? '', resolveContext);
      // Path does not contain /dist/xxx/, continue normally
      if (rewrittenPath === innerRequest) return cb();

      let newRequest: Partial<ResolveRequest> = { ...$request, relativePath: undefined, path: rewrittenPath, request: 'index' };
      resolver.resolve({}, rewrittenPath, 'index', resolveContext, (err, filePath: string, $request) => {
        if (shouldLog)
          logger.log('\n\tdoResolve (1): for', rewrittenPath, '\n\terr:', !!err, 'result:', !!filePath, '\n');
        if (filePath) {
          debugger;
          return cb(null, $request);
        }
        if (!userRequest) {
          return cb();
        }
        newRequest = { ...$request, relativePath: undefined, path: rewrittenPath, request: userRequest };
        resolver.resolve({}, rewrittenPath, userRequest, resolveContext, (err: any, filePath: string, $request) => {
          if (shouldLog)
            logger.log('\n\tdoResolve (2): for', JSON.stringify(newRequest), '\n\terr:', !!err, 'result:', !!filePath, '\n');
          if (filePath) {
            debugger;
            return cb(null, $request);
          }
          return cb();
        });
      });
    }
  }
};
