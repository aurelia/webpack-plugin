"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistPlugin = void 0;
class DistPlugin {
    constructor(dist) {
        this.rawDist = dist;
        this.dist = `/dist/${dist}/`;
    }
    apply(resolver) {
        if (!this.rawDist)
            return;
        resolver.getHook("before-described-resolve")
            .tapAsync("Aurelia:Dist", (request, resolveContext, cb) => {
            var _a, _b;
            // If the request contains /dist/xxx/, try /dist/{dist}/ first
            let rewritten = (_b = (_a = request.request) === null || _a === void 0 ? void 0 : _a.replace(/\/dist\/[^/]+\//i, this.dist)) !== null && _b !== void 0 ? _b : '';
            if (rewritten !== request.request) {
                let newRequest = Object.assign({}, request, { request: rewritten });
                resolver.doResolve(resolver.getHook("described-resolve"), newRequest, "try alternate " + this.dist, {}, cb);
            }
            else
                cb(); // Path does not contain /dist/xxx/, continue normally
        });
    }
}
exports.DistPlugin = DistPlugin;
;
