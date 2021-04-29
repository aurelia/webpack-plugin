// This plugin tries to redirect failing request that look like `module/something`
// into `module/path-to-main/something`.
// For example, supposing `aurelia-charts` resolves to `aurelia-charts/dist/index.js`,
// Then if `aurelia-charts/pie` fails, we'll try `aurelia-charts/dist/pie`.
import path = require("path");
import { Resolver, ResolveRequest, ResolveContext } from "./interfaces";
import { ResolverPluginBase } from "./ResolverPluginBase";

const subFolderTrial = Symbol();

export const resolveCache = {};

export class SubFolderPlugin extends ResolverPluginBase {
  get pluginName() { return 'SubFolderPlugin'; }

  useResolver(resolver: Resolver) {
    resolver
      .getHook("after-resolve")
      .tapAsync(
        "Aurelia:SubFolder",
        (request: ResolveRequest, resolveContext: ResolveContext, cb: (err?: any, result?: any) => void) => {
          // Only look for request not starting with a dot (module names)
          // and followed by a path (slash). Support @scoped/modules.
          let match = /^(?!\.)((?:@[^/]+\/)?[^/]+)(\/.*)$/i.exec(request.request ?? '');
          // Fix: it seems that under some error conditions `request.context` might end up being null.
          //      this is bad but to help users find relevant errors on the web, we don't want to crash 
          //      so instead we just skip the request.
          if (!match || !resolveContext || resolveContext[subFolderTrial]) {
            cb();
            return;
          }

          let [, module, rest] = match;
          // Try resolve just the module name to locate its actual root
          let rootRequest = Object.assign({}, request, { request: module });
          // Note: if anything doesn't work while probing or trying alternate paths, 
          //       we just ignore the error and pretend nothing happened (i.e. call cb())
          resolver.doResolve(
            /* resolve hooks to invoke */resolver.hooks.resolve,
            /* request */rootRequest,
            /* message */"module sub-folder: identify root",
            /* resolve context */{}, (err: Error, result: { relativePath: string }) => {
            if (!result ||
                !result.relativePath.startsWith('./')) {
              cb();
              return;
            }
            // It worked, let's try a relative folder from there
            let root = path.posix.dirname(result.relativePath);
            let newRequest = Object.assign({}, request, { request: root.replace(/^\./, module) + rest });
            newRequest[subFolderTrial] = true;
            // newRequest.context[subFolderTrial] = true;
            resolver.doResolve(
              resolver.hooks.resolve,
              newRequest,
              "try module sub-folder: " + root,
              {},
              (err: Error, result: { relativePath: string }) => {
              if (result)
                cb(null, result);
              else
                cb();
            });
          });
        }
      );
  }
  // apply(resolver: webpack.Resolver) {
  //   resolver.getHook("after-resolve")
  //           .tapAsync("Aurelia:SubFolder", (request: Webpack.ResolveRequest, resolveContext: object, cb: (err?: any, result?: any) => void) => {
  //     // Only look for request not starting with a dot (module names)
  //     // and followed by a path (slash). Support @scoped/modules.
  //     let match = /^(?!\.)((?:@[^/]+\/)?[^/]+)(\/.*)$/i.exec(request.request);
  //     // Fix: it seems that under some error conditions `request.context` might end up being null.
  //     //      this is bad but to help users find relevant errors on the web, we don't want to crash 
  //     //      so instead we just skip the request.
  //     if (!match || !request.context || request.context[subFolderTrial]) { cb(); return; }
  //     let [, module, rest] = match;
  //     // Try resolve just the module name to locate its actual root
  //     let rootRequest = Object.assign({}, request, { request: module });
  //     // Note: if anything doesn't work while probing or trying alternate paths, 
  //     //       we just ignore the error and pretend nothing happened (i.e. call cb())
  //     resolver.doResolve(resolver.hooks.resolve, rootRequest, "module sub-folder: identify root", {}, (err, result) => {
  //       if (!result ||
  //           !result.relativePath.startsWith('./')) {
  //         cb();
  //         return;
  //       }
  //       // It worked, let's try a relative folder from there
  //       let root = path.posix.dirname(result.relativePath);
  //       let newRequest = Object.assign({}, request, { request: root.replace(/^\./, module) + rest });
  //       newRequest.context[subFolderTrial] = true;
  //       resolver.doResolve(resolver.hooks.resolve, newRequest, "try module sub-folder: " + root, {}, (err, result) => {
  //         if (result) cb(null, result);
  //         else cb();
  //       });
  //     });
  //   });
  // }
}