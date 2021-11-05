"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AureliaPlugin = void 0;
const webpack_1 = require("webpack");
const AureliaDependenciesPlugin_1 = require("./AureliaDependenciesPlugin");
const ConventionDependenciesPlugin_1 = require("./ConventionDependenciesPlugin");
const DistPlugin_1 = require("./DistPlugin");
const GlobDependenciesPlugin_1 = require("./GlobDependenciesPlugin");
const HtmlDependenciesPlugin_1 = require("./HtmlDependenciesPlugin");
const InlineViewDependenciesPlugin_1 = require("./InlineViewDependenciesPlugin");
const ModuleDependenciesPlugin_1 = require("./ModuleDependenciesPlugin");
const PreserveExportsPlugin_1 = require("./PreserveExportsPlugin");
const PreserveModuleNamePlugin_1 = require("./PreserveModuleNamePlugin");
const SubFolderPlugin_1 = require("./SubFolderPlugin");
const Webpack = require("webpack");
// See comments inside the module to understand why this is used
const emptyEntryModule = "aurelia-webpack-plugin/runtime/empty-entry";
class AureliaPlugin {
    constructor(options = {}) {
        const opts = this.options = Object.assign({
            includeAll: false,
            aureliaConfig: ["standard", "developmentLogging"],
            dist: "native-modules",
            features: {},
            moduleMethods: [],
            noHtmlLoader: false,
            // Undocumented safety switch
            noInlineView: false,
            noModulePathResolve: false,
            noWebpackLoader: false,
            // Ideally we would like _not_ to process conventions in node_modules,
            // because they should be using @useView and not rely in convention in
            // the first place. Unfortunately at this point many libs do use conventions
            // so it's just more helpful for users to process them.
            // As unlikely as it may seem, a common offender here is tslib, which has
            // matching (yet unrelated) html files in its distribution. So I am making
            // a quick exception for that.
            viewsFor: "**/!(tslib)*.{ts,js}",
            viewsExtensions: ".html",
        }, options);
        if (opts.entry) {
            opts.entry = Array.isArray(opts.entry) ? opts.entry : [opts.entry];
        }
        opts.features = Object.assign({
            ie: true,
            svg: true,
            unparser: true,
            polyfills: "es2015",
        }, options.features);
    }
    apply(compiler) {
        const opts = this.options;
        const features = opts.features;
        let needsEmptyEntry = false;
        let dllPlugin = compiler.options.plugins.some(p => p instanceof webpack_1.DllPlugin);
        let dllRefPlugins = compiler.options.plugins.filter(p => p instanceof webpack_1.DllReferencePlugin);
        // Make sure the loaders are easy to load at the root like `aurelia-webpack-plugin/html-resource-loader`
        let resolveLoader = compiler.options.resolveLoader;
        let alias = resolveLoader.alias || (resolveLoader.alias = {});
        alias["aurelia-webpack-plugin"] = "aurelia-webpack-plugin/dist";
        // Our async! loader is in fact just bundle-loader!.
        alias["async"] = "bundle-loader";
        // For my own sanity when working on this plugin with `yarn link`,
        // make sure neither webpack nor Node resolve symlinks.
        if ("NODE_PRESERVE_SYMLINKS" in process.env) {
            resolveLoader.symlinks = false;
            compiler.options.resolve.symlinks = false;
        }
        // If we aren't building a DLL, "main" is the default entry point
        // Note that the 'in' check is because someone may explicitly set aureliaApp to undefined
        if (!dllPlugin && !("aureliaApp" in opts)) {
            opts.aureliaApp = "main";
        }
        // Uses DefinePlugin to cut out optional features
        const defines = {
            AURELIA_WEBPACK_2_0: "true"
        };
        if (!features.ie)
            defines.FEATURE_NO_IE = "true";
        if (!features.svg)
            defines.FEATURE_NO_SVG = "true";
        if (!features.unparser)
            defines.FEATURE_NO_UNPARSER = "true";
        definePolyfills(defines, features.polyfills);
        // Add some dependencies that are not documented with PLATFORM.moduleName
        // because they are determined at build-time.
        const dependencies = {
            // PAL for target
            "aurelia-bootstrapper": "pal" in opts ? opts.pal : { name: getPAL(compiler.options.target), exports: ['initialize'] },
            // `aurelia-framework` exposes configuration helpers like `.standardConfiguration()`,
            // that load plugins, but we can't know if they are actually used or not.
            // User indicates what he uses at build time in `aureliaConfig` option.
            // Custom config is performed in use code and can use `.moduleName()` like normal.
            "aurelia-framework": getConfigModules(opts.aureliaConfig),
        };
        let globalDependencies = [];
        if (opts.dist) {
            // This plugin enables easy switching to a different module distribution (default for Aurelia is dist/commonjs).
            let resolve = compiler.options.resolve;
            let plugins = resolve.plugins || (resolve.plugins = []);
            plugins.push(new DistPlugin_1.DistPlugin(opts.dist));
        }
        if (!opts.noModulePathResolve) {
            // This plugin enables sub-path in modules that are not at the root (e.g. in a /dist folder),
            // for example aurelia-chart/pie might resolve to aurelia-chart/dist/commonjs/pie
            let resolve = compiler.options.resolve;
            let plugins = resolve.plugins || (resolve.plugins = []);
            plugins.push(new SubFolderPlugin_1.SubFolderPlugin());
        }
        if (opts.includeAll) {
            // Grab everything approach
            // This plugin ensures that everything in /src is included in the bundle.
            // This prevents splitting in several chunks but is super easy to use and setup,
            // no change in existing code or PLATFORM.nameModule() calls are required.
            new GlobDependenciesPlugin_1.GlobDependenciesPlugin({ [emptyEntryModule]: opts.includeAll + "/**" }).apply(compiler);
            needsEmptyEntry = true;
        }
        else if (opts.aureliaApp) {
            // Add aurelia-app entry point.
            // When using includeAll, we assume it's already included
            globalDependencies.push({ name: opts.aureliaApp, exports: ["configure"] });
        }
        if (!dllPlugin && dllRefPlugins.length > 0) {
            // Creates delegated entries for all Aurelia modules in DLLs.
            // This is required for aurelia-loader-webpack to find them.
            let aureliaModules = dllRefPlugins.map(plugin => {
                let content = plugin["options"].manifest.content;
                return Object.keys(content)
                    .map(k => content[k].buildMeta["aurelia-id"])
                    .filter(id => !!id);
            });
            globalDependencies = globalDependencies.concat(...aureliaModules);
        }
        if (!dllPlugin && !opts.noWebpackLoader) {
            // Setup aurelia-loader-webpack as the module loader
            this.addEntry(compiler.options, ["aurelia-webpack-plugin/runtime/pal-loader-entry"]);
        }
        if (!opts.noHtmlLoader) {
            // Ensure that we trace HTML dependencies (always required because of 3rd party libs)
            // Note that this loader will be in last place, which is important
            // because it will process the file first, before any other loader.
            compiler.options.module.rules.push({ test: /\.html?$/i, use: "aurelia-webpack-plugin/html-requires-loader" });
        }
        if (!opts.noInlineView) {
            new InlineViewDependenciesPlugin_1.InlineViewDependenciesPlugin().apply(compiler);
        }
        if (globalDependencies.length > 0) {
            dependencies[emptyEntryModule] = globalDependencies;
            needsEmptyEntry = true;
        }
        if (needsEmptyEntry) {
            this.addEntry(compiler.options, emptyEntryModule);
        }
        compiler.hooks.compilation.tap('AureliaPlugin', (compilation, params) => {
            compilation.hooks.runtimeRequirementInTree
                .for(Webpack.RuntimeGlobals.require)
                .tap('AureliaPlugin', (chunk) => {
                compilation.addRuntimeModule(chunk, new AureliaExposeWebpackInternal());
            });
        });
        // Aurelia libs contain a few global defines to cut out unused features
        new webpack_1.DefinePlugin(defines).apply(compiler);
        // Adds some dependencies that are not documented by `PLATFORM.moduleName`
        new ModuleDependenciesPlugin_1.ModuleDependenciesPlugin(dependencies).apply(compiler);
        // This plugin traces dependencies in code that are wrapped in PLATFORM.moduleName() calls
        new AureliaDependenciesPlugin_1.AureliaDependenciesPlugin(...opts.moduleMethods).apply(compiler);
        // This plugin adds dependencies traced by html-requires-loader
        // Note: the config extension point for this one is html-requires-loader.attributes.
        new HtmlDependenciesPlugin_1.HtmlDependenciesPlugin().apply(compiler);
        // This plugin looks for companion files by swapping extensions,
        // e.g. the view of a ViewModel. @useView and co. should use PLATFORM.moduleName().
        // We use it always even with `includeAll` because libs often don't `@useView` (they should).
        new ConventionDependenciesPlugin_1.ConventionDependenciesPlugin(opts.viewsFor, opts.viewsExtensions).apply(compiler);
        // This plugin preserves module names for dynamic loading by aurelia-loader
        new PreserveModuleNamePlugin_1.PreserveModuleNamePlugin(dllPlugin).apply(compiler);
        // This plugin supports preserving specific exports names when dynamically loading modules
        // with aurelia-loader, while still enabling tree shaking all other exports.
        new PreserveExportsPlugin_1.PreserveExportsPlugin().apply(compiler);
    }
    addEntry(options, modules) {
        var _a, _b;
        let webpackEntry = options.entry;
        let entries = Array.isArray(modules) ? modules : [modules];
        // todo:
        // probably cant do much here?
        if (typeof webpackEntry === 'function') {
            return;
        }
        // If entry point unspecified in plugin options; use the first webpack entry point
        const pluginEntry = (_a = this.options.entry) !== null && _a !== void 0 ? _a : [Object.keys(webpackEntry)[0]];
        // Ensure array
        const pluginEntries = Array.isArray(pluginEntry) ? pluginEntry : [pluginEntry];
        // Add runtime to each entry
        for (const k of pluginEntries) {
            // Verify that plugin options entry points are defined in webpack entry points
            if (!(k in webpackEntry)) {
                throw new Error('entry key "' + k + '" is not defined in Webpack build, cannot apply runtime.');
            }
            let entry = webpackEntry[k];
            (_b = entry.import) === null || _b === void 0 ? void 0 : _b.unshift(...entries);
        }
    }
}
exports.AureliaPlugin = AureliaPlugin;
;
function getPAL(target) {
    if (target instanceof Array) {
        if (target.includes('web') || target.includes('es5')) {
            return 'aurelia-pal-browser';
        }
        // not really sure what to pick from an array
        target = target[0];
    }
    if (target === false) {
        throw new Error('Invalid target to build for AureliaPlugin.');
    }
    switch (target) {
        case undefined:
        case "es5":
        case "web":
            return "aurelia-pal-browser";
        case "webworker": return "aurelia-pal-worker";
        case "electron-renderer": return "aurelia-pal-browser";
        default: return "aurelia-pal-nodejs";
    }
}
const configModules = {};
let configModuleNames = {
    "defaultBindingLanguage": "aurelia-templating-binding",
    "router": "aurelia-templating-router",
    "history": "aurelia-history-browser",
    "defaultResources": "aurelia-templating-resources",
    "eventAggregator": "aurelia-event-aggregator",
    "developmentLogging": "aurelia-logging-console",
};
// "configure" is the only method used by .plugin()
for (let c in configModuleNames)
    configModules[c] = { name: configModuleNames[c], exports: ["configure"] };
// developmentLogging has a pre-task that uses ConsoleAppender
configModules["developmentLogging"].exports.push("ConsoleAppender");
function getConfigModules(config) {
    if (!config)
        return undefined;
    if (!Array.isArray(config))
        config = [config];
    // Expand "standard"
    let i = config.indexOf("standard");
    if (i >= 0)
        config.splice(i, 1, "basic", "history", "router");
    // Expand "basic"
    i = config.indexOf("basic");
    if (i >= 0)
        config.splice(i, 1, "defaultBindingLanguage", "defaultResources", "eventAggregator");
    return config.map(c => configModules[c]);
}
function definePolyfills(defines, polyfills) {
    if (polyfills === "es2015")
        return;
    defines.FEATURE_NO_ES2015 = "true";
    if (polyfills === "es2016")
        return;
    defines.FEATURE_NO_ES2016 = "true";
    if (polyfills === "esnext")
        return;
    defines.FEATURE_NO_ESNEXT = "true";
    // "none" or invalid option.
}
class AureliaExposeWebpackInternal extends Webpack.RuntimeModule {
    constructor() {
        super("Aurelia expose webpack internal");
    }
    /**
     * @returns {string} runtime code
     */
    generate() {
        return Webpack.Template.asString([
            "if (typeof __webpack_modules__ !== 'undefined') {",
            "__webpack_require__.m = __webpack_require__.m || __webpack_modules__;",
            "__webpack_require__.c = __webpack_require__.c || __webpack_module_cache__;",
            "}",
        ]);
    }
}
