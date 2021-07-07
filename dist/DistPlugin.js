"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistPlugin = void 0;
const path = require("path");
class DistPlugin {
    constructor(dist) {
        this.rawDist = dist;
        this.dist = `/dist/${dist}/`;
    }
    apply(resolver) {
        if (!this.rawDist)
            return;
        let dist = this.dist;
        let HookNames = {
            resolve: "resolve",
            internalResolve: "internal-resolve",
        };
        let sourceHookName = HookNames.resolve;
        let targetHookName = HookNames.internalResolve;
        let tapName = "Aurelia:DistPlugin";
        resolver.ensureHook(sourceHookName)
            .tapAsync(tapName, resolveHandlerDoResolve);
        function determineRewrittenPath(filePath, resolveContext) {
            filePath = filePath || "";
            let parts = filePath.split("?");
            let innerRequest = path.normalize(parts[0]);
            parts[0] = path.normalize(innerRequest.replace(/[\/\\]dist[\/\\][^/\\]+[\/\\]?/i, dist)).replace(/[\/\\]$/, '');
            let rewrittenPath = parts.join("?");
            return rewrittenPath;
        }
        // If the request contains /dist/xxx/, try /dist/{rawDist}/
        // ----
        // this involves two steps:
        // - first always resolve the request to find the absolute path
        // - 2nd tries to swap /dist/xxxx/ with /dist/{rawDist}/ if possible
        function resolveHandlerDoResolve(request, resolveContext, cb) {
            let $request = Object.assign({}, request);
            let innerRequest = $request.request;
            if (!innerRequest || /* shouldn't interfere relative paths */ innerRequest.startsWith('.'))
                return cb();
            let rewrittenPath = determineRewrittenPath(innerRequest, resolveContext);
            let newRequest = { path: $request.path, request: rewrittenPath, fullySpecified: false };
            let tobeNotifiedHook = resolver.ensureHook(targetHookName);
            resolver.doResolve(tobeNotifiedHook, newRequest, "try alternate dist: " + dist + " in only request", resolveContext, (err, result) => {
                if (err)
                    return cb();
                if (typeof (result === null || result === void 0 ? void 0 : result.path) !== 'string') {
                    return cb();
                }
                let rewrittenPath = determineRewrittenPath(result.path, resolveContext);
                if (rewrittenPath === result.path) {
                    return cb(null, result);
                }
                newRequest = { path: $request.path, request: rewrittenPath, fullySpecified: false };
                resolver.doResolve(tobeNotifiedHook, newRequest, "try alternate dist " + dist + " in full path", resolveContext, (err, result) => {
                    if (err)
                        return cb();
                    if (result)
                        return cb(null, result);
                    return cb();
                });
            });
        }
    }
}
exports.DistPlugin = DistPlugin;
;
