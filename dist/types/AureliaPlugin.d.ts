import { Convention } from "./ConventionDependenciesPlugin";
import * as Webpack from 'webpack';
export declare type Polyfills = "es2015" | "es2016" | "esnext" | "none";
export declare type AureliaModuleConfig = keyof typeof configModuleNames | 'standard' | 'basic';
export interface Options {
    /**
     * if a string is given, include everything inside that folder, recursively.
     */
    includeAll: false | string;
    aureliaApp?: string;
    /**
     * A single config or a list of configurations to ensure the AureliaPlugin can bundle appropriate modules for
     * the aurelia-loader to load at runtime.
     *
     * `aurelia-framework` exposes configuration helpers like `.standardConfiguration()` etc...,
     * that load plugins (`aurelia-templating-binding`, `aurelia-templating-resources`, `aurelia-templating-router` etc...),
     * but we can't know if they are actually used or not at build time.
     *
     * This config gives users the ability to indicate what are used at build time.
     * Custom config is performed in use code and can use `.moduleName()` like normal.
     */
    aureliaConfig: AureliaModuleConfig | AureliaModuleConfig[];
    /**
     * An application can use this config to specify what PAL module to use.
     *
     * Possible values are:
     * - aurelia-pal-browser
     * - aurelia-pal-worker
     * - aurelia-pal-nodejs
     *
     * By default, it'll be determined based on the webpack configuration.
     */
    pal?: string;
    /**
     * A dist folder to look for in *all* modules. Possible values for
     * the core Aurelia modules are:
     * - es2015
     * - commonjs
     * - amd
     * - native-modules
     *
     * Note: application may choose to have a different dist types for their modules, and not use the above modules.
     *
     * Note: In the future, multiple dist with fallback may be supported to help application specify the dist with as latest syntaxes as possible.
     */
    dist: string;
    entry?: string | string[];
    features: {
        ie?: boolean;
        svg?: boolean;
        unparser?: boolean;
        polyfills?: Polyfills;
    };
    noHtmlLoader: boolean;
    noInlineView: boolean;
    noModulePathResolve: boolean;
    noWebpackLoader: boolean;
    moduleMethods: string[];
    viewsFor: string;
    viewsExtensions: string | Convention | (string | Convention)[];
}
export declare class AureliaPlugin {
    options: Options;
    constructor(options?: Partial<Options>);
    apply(compiler: Webpack.Compiler): void;
    addEntry(options: Webpack.WebpackOptionsNormalized, modules: string | string[]): void;
}
declare let configModuleNames: {
    defaultBindingLanguage: string;
    router: string;
    history: string;
    defaultResources: string;
    eventAggregator: string;
    developmentLogging: string;
};
export {};
