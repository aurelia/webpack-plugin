import { AureliaDependenciesPlugin } from "./AureliaDependenciesPlugin";
import { ConventionDependenciesPlugin, Convention } from "./ConventionDependenciesPlugin";
import { DistPlugin } from "./DistPlugin";
import { GlobDependenciesPlugin } from "./GlobDependenciesPlugin";
import { HtmlDependenciesPlugin } from "./HtmlDependenciesPlugin";
import { ModuleDependenciesPlugin } from "./ModuleDependenciesPlugin";
import { PreserveExportsPlugin } from "./PreserveExportsPlugin";
import { PreserveModuleNamePlugin } from "./PreserveModuleNamePlugin";
import { SubFolderPlugin } from "./SubFolderPlugin";

export interface Options {
  includeAll: boolean;
  
  aureliaApp?: string;
  aureliaConfig: string | string[];
  pal?: string;
  dist: string;
  noHtmlLoader: boolean;
  noModulePathResolve: boolean;
  moduleMethods: string[];
  viewsFor: string;
  viewsExtensions: string | Convention | (string|Convention)[];
}

export class AureliaPlugin {
  options: Options;

  constructor(options: Partial<Options> = {}) {
    this.options = Object.assign({
      includeAll: false,  // or folder, e.g. "src"

      aureliaApp: "main",
      aureliaConfig: ["standard", "developmentLogging"],
      dist: "native-modules",
      moduleMethods: [],
      noHtmlLoader: false,
      noModulePathResolve: false,
      viewsFor: "src/**/*.{ts,js}",
      viewsExtensions: ".html",
    },
    options);
  }

  apply(compiler: Webpack.Compiler) {
    const opts = this.options;

    // Make sure the loaders are easy to load at the root like `aurelia-webpack-plugin/html-resource-loader`
    let resolveLoader = compiler.options.resolveLoader;
    let alias = resolveLoader.alias || (resolveLoader.alias = {});
    alias["aurelia-webpack-plugin"] = "aurelia-webpack-plugin/dist";
    // Our async! loader is in fact just bundle-loader!.
    alias["async"] = "bundle-loader";

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
      let entry = getEntry(compiler.options.entry);
      compiler.apply(
        // This plugin ensures that everything in /src is included in the bundle.
        // This prevents splitting in several chunks but is super easy to use and setup,
        // no change in existing code or PLATFORM.nameModule() calls are required.
        new GlobDependenciesPlugin({ [entry]: opts.includeAll + "/**" })
      );
      // We don't use aureliaApp as we assume it's included in the folder above
      opts.aureliaApp = undefined;
    }
    else {
      // Traced dependencies approach
      compiler.apply(
        // This plugin looks for companion files by swapping extensions,
        // e.g. the view of a ViewModel. @useView and co. should use PLATFORM.moduleName().
        new ConventionDependenciesPlugin(opts.viewsFor, opts.viewsExtensions),
        // This plugin adds dependencies traced by html-requires-loader
        // Note: the config extension point for this one is html-requires-loader.attributes.
        new HtmlDependenciesPlugin()
      );

      if (!opts.noHtmlLoader) {
        // Ensure that we trace HTML dependencies
        let module = compiler.options.module;
        let rules = module.rules || (module.rules = []);
        // Note that this loader will be in last place, which is important 
        // because it will process the file first, before any other loader.
        rules.push({ test: /\.html?$/i, use: "aurelia-webpack-plugin/html-requires-loader" });
      }
    }

    // Common plugins
    compiler.apply(
      // Adds some dependencies that are not documented by `PLATFORM.moduleName`
      new ModuleDependenciesPlugin({
        "aurelia-bootstrapper": [
          opts.aureliaApp,    // entry point
          "pal" in opts ?     // PAL for target
              opts.pal : 
              getPAL(compiler.options.target) 
        ],
        // `aurelia-framework` exposes configuration helpers like `.standardConfiguration()`,
        // that load plugins, but we can't know if they are actually used or not.
        // User indicates what he uses at build time in `aureliaConfig` option.
        // Custom config is performed in use code and can use `.moduleName()` like normal.
        "aurelia-framework": getConfigModules(opts.aureliaConfig),
      }),
      // This plugin traces dependencies in code that are wrapped in PLATFORM.moduleName() calls
      new AureliaDependenciesPlugin(...opts.moduleMethods),
      // This plugin preserves module names for dynamic loading by aurelia-loader
      new PreserveModuleNamePlugin(),
      // This plugin supports preserving specific exports names when dynamically loading modules
      // with aurelia-loader, while still enabling tree shaking all other exports.
      new PreserveExportsPlugin()
    );
  }
};

function getEntry(entry: string | Object | (string|Object)[]) {
  // Fix: ideally we would require `entry` to be a string
  //      but in practice, using webpack-dev-server might shift one (or two --hot) extra entries.
  if (typeof entry === "object")
    entry = entry[Object.getOwnPropertyNames(entry)[0]];
  if (Array.isArray(entry))
    entry = entry[entry.length - 1];
  if (typeof entry !== "string")
    throw new Error("includeAll option only works with a single entry point.")
  return entry;
}

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
configModules['developmentLogging'].exports!.push("ConsoleAppender");

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
