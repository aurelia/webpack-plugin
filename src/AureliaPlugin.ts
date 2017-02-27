import { DefinePlugin, DllReferencePlugin, DllPlugin } from "webpack";
import { AureliaDependenciesPlugin } from "./AureliaDependenciesPlugin";
import { ConventionDependenciesPlugin, Convention } from "./ConventionDependenciesPlugin";
import { DistPlugin } from "./DistPlugin";
import { GlobDependenciesPlugin } from "./GlobDependenciesPlugin";
import { HtmlDependenciesPlugin } from "./HtmlDependenciesPlugin";
import { ModuleDependenciesPlugin, ModuleDependenciesPluginOptions } from "./ModuleDependenciesPlugin";
import { PreserveExportsPlugin } from "./PreserveExportsPlugin";
import { PreserveModuleNamePlugin } from "./PreserveModuleNamePlugin";
import { SubFolderPlugin } from "./SubFolderPlugin";

export type Polyfills = "es2015" | "es2016" | "esnext" | "none";

export interface Options {
  includeAll: false | string;
  
  aureliaApp?: string;
  aureliaConfig: string | string[];
  pal?: string;
  dist: string;
  entry?: string | string[];
  features: {
    svg?: boolean;
    unparser?: boolean;
    polyfills?: Polyfills;
  },
  noHtmlLoader: boolean;
  noModulePathResolve: boolean;
  noWebpackLoader: boolean;
  moduleMethods: string[];
  viewsFor: string;
  viewsExtensions: string | Convention | (string|Convention)[];
}

// See comments inside the module to understand why this is used
const emptyEntryModule = "aurelia-webpack-plugin/dist/aurelia-entry";

export class AureliaPlugin {
  options: Options;

  constructor(options: Partial<Options> = {}) {
    this.options = Object.assign({
      includeAll: <false>false,

      aureliaApp: "main",
      aureliaConfig: ["standard", "developmentLogging"],
      dist: "native-modules",
      features: { },
      moduleMethods: [],
      noHtmlLoader: false,
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
    },
    options);

    this.options.features = Object.assign({
      svg: true,
      unparser: true,
      polyfills: <"es2015">"es2015",
    }, options.features);
  }

  apply(compiler: Webpack.Compiler) {
    const opts = this.options;
    const features = opts.features;
    let needsEmptyEntry = false;

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

    // Uses DefinePlugin to cut out optional features
    const defines: any = {
      AURELIA_WEBPACK_2_0: "true"
    };
    if (!features.svg) defines.FEATURE_NO_SVG = "true";
    if (!features.unparser) defines.FEATURE_NO_UNPARSER = "true";
    definePolyfills(defines, features.polyfills!);

    // Add some dependencies that are not documented with PLATFORM.moduleName
    // because they are determined at build-time.
    const dependencies: ModuleDependenciesPluginOptions = {
      // PAL for target
      "aurelia-bootstrapper": "pal" in opts ? opts.pal : getPAL(compiler.options.target),
      // `aurelia-framework` exposes configuration helpers like `.standardConfiguration()`,
      // that load plugins, but we can't know if they are actually used or not.
      // User indicates what he uses at build time in `aureliaConfig` option.
      // Custom config is performed in use code and can use `.moduleName()` like normal.
      "aurelia-framework": getConfigModules(opts.aureliaConfig),
    };
    let globalDependencies: (string|DependencyOptionsEx)[] = [];

    if (opts.dist) {
      // This plugin enables easy switching to a different module distribution (default for Aurelia is dist/commonjs).
      let resolve = compiler.options.resolve;
      let plugins = resolve.plugins || (resolve.plugins = []);
      plugins.push(new DistPlugin(opts.dist));
    }

    if (!opts.noModulePathResolve) {
      // This plugin enables sub-path in modules that are not at the root (e.g. in a /dist folder),
      // for example aurelia-chart/pie might resolve to aurelia-chart/dist/commonjs/pie
      let resolve = compiler.options.resolve;
      let plugins = resolve.plugins || (resolve.plugins = []);
      plugins.push(new SubFolderPlugin());
    }

    if (opts.includeAll) {
      // Grab everything approach
      compiler.apply(
        // This plugin ensures that everything in /src is included in the bundle.
        // This prevents splitting in several chunks but is super easy to use and setup,
        // no change in existing code or PLATFORM.nameModule() calls are required.
        new GlobDependenciesPlugin({ [emptyEntryModule]: opts.includeAll + "/**" })
      );
      needsEmptyEntry = true;
    }
    else if (opts.aureliaApp) {
      // Add aurelia-app entry point. 
      // When using includeAll, we assume it's already included
      globalDependencies.push({ name: opts.aureliaApp, exports: ["configure"] });
    }

    let dllPlugin = compiler.options.plugins.some(p => p instanceof DllPlugin);
    let dllRefPlugins = compiler.options.plugins.filter(p => p instanceof DllReferencePlugin);
    if (!dllPlugin && dllRefPlugins.length > 0) {
      // Creates delegated entries for all Aurelia modules in DLLs.
      // This is required for aurelia-loader-webpack to find them.
      let aureliaModules = dllRefPlugins.map(plugin => {
        let content = plugin["options"].manifest.content;
        return Object.keys(content)
                     .map(k => content[k].meta["aurelia-id"])
                     .filter(id => !!id) as string[];
      });
      globalDependencies = globalDependencies.concat(...aureliaModules);
    }

    if (!dllPlugin && !opts.noWebpackLoader) {
      // Setup aurelia-loader-webpack as the module loader
      // Note that code inside aurelia-loader-webpack performs PLATFORM.Loader = WebpackLoader;
      this.addEntry(compiler.options, "aurelia-loader-webpack");      
    }

    if (!opts.noHtmlLoader) {
      // Ensure that we trace HTML dependencies (always required because of 3rd party libs)
      let module = compiler.options.module;
      let rules = module.rules || (module.rules = []);
      // Note that this loader will be in last place, which is important 
      // because it will process the file first, before any other loader.
      rules.push({ test: /\.html?$/i, use: "aurelia-webpack-plugin/html-requires-loader" });
    }

    if (globalDependencies.length > 0) {
      dependencies[emptyEntryModule] = globalDependencies;
      needsEmptyEntry = true;
    }

    if (needsEmptyEntry) {
      this.addEntry(compiler.options, emptyEntryModule);
    }

    compiler.apply(
      // Aurelia libs contain a few global defines to cut out unused features
      new DefinePlugin(defines),
      // Adds some dependencies that are not documented by `PLATFORM.moduleName`      
      new ModuleDependenciesPlugin(dependencies),
      // This plugin traces dependencies in code that are wrapped in PLATFORM.moduleName() calls
      new AureliaDependenciesPlugin(...opts.moduleMethods),
      // This plugin adds dependencies traced by html-requires-loader
      // Note: the config extension point for this one is html-requires-loader.attributes.
      new HtmlDependenciesPlugin(),
      // This plugin looks for companion files by swapping extensions,
      // e.g. the view of a ViewModel. @useView and co. should use PLATFORM.moduleName().
      // We use it always even with `includeAll` because libs often don't `@useView` (they should).
      new ConventionDependenciesPlugin(opts.viewsFor, opts.viewsExtensions),
      // This plugin preserves module names for dynamic loading by aurelia-loader
      new PreserveModuleNamePlugin(dllPlugin),
      // This plugin supports preserving specific exports names when dynamically loading modules
      // with aurelia-loader, while still enabling tree shaking all other exports.
      new PreserveExportsPlugin(),
    );
  }

  addEntry(options: Webpack.Options, module: string) {
    let webpackEntry = options.entry;
    let entries = [module];
    if (typeof webpackEntry == "object" && !Array.isArray(webpackEntry)) {
      // There are multiple entries defined in the config
      // Unless there was a particular configuration, we modify the first one
      // (note that JS enumerates props in the same order they were declared)
      // Modifying the first one only plays nice with the common pattern
      // `entry: { main, vendor }` some people use.
      let ks = this.options.entry || Object.keys(webpackEntry)[0];
      if (!Array.isArray(ks)) ks = [ks];
      ks.forEach(k => webpackEntry[k] = entries.concat(webpackEntry[k]));
    }
    else
      options.entry = entries.concat(webpackEntry);
  }
};

function getPAL(target: string) {
  switch (target) {
    case "web": return "aurelia-pal-browser";
    case "webworker": return "aurelia-pal-worker";
    default: return "aurelia-pal-nodejs";
  }
}

const configModules: { [config: string]: DependencyOptionsEx } = {};
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
configModules["developmentLogging"].exports!.push("ConsoleAppender");

function getConfigModules(config: string | string[]) {  
  if (!config) return undefined;
  if (!Array.isArray(config)) config = [config];

  // Expand "standard"
  let i = config.indexOf("standard");
  if (i >= 0) config.splice(i, 1, "basic", "history", "router");
  // Expand "basic"
  i = config.indexOf("basic");
  if (i >= 0) config.splice(i, 1, "defaultBindingLanguage", "defaultResources", "eventAggregator");

  return config.map(c => configModules[c]);
}

function definePolyfills(defines: any, polyfills: Polyfills) {
  if (polyfills === "es2015") return;
  defines.FEATURE_NO_ES2015 = "true";
  if (polyfills === "es2016") return;
  defines.FEATURE_NO_ES2016 = "true";
  if (polyfills === "esnext") return;
  defines.FEATURE_NO_ESNEXT = "true";
  // "none" or invalid option.
}
