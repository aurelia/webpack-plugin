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
"use strict";
class DistPlugin {
    constructor(dist) {
        this.dist = `/dist/${dist}/`;
    }
    apply(resolver) {
        if (!this.dist)
            return;
        resolver.plugin("before-described-resolve", (request, cb) => {
            // If the request contains /dist/xxx/, try /dist/{dist}/ first
            let rewritten = request.request.replace(/\/dist\/[^/]+\//i, this.dist);
            if (rewritten !== request.request) {
                let newRequest = Object.assign({}, request, { request: rewritten });
                resolver.doResolve("described-resolve", newRequest, "try alternate " + this.dist, cb);
            }
            else
                cb(); // Path does not contain /dist/xxx/, continue normally
        });
    }
}
exports.DistPlugin = DistPlugin;
;
