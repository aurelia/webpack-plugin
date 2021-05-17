import { Convention } from "./ConventionDependenciesPlugin";
import * as Webpack from 'webpack';
export declare type Polyfills = "es2015" | "es2016" | "esnext" | "none";
export declare type AureliaModuleConfig = keyof typeof configModuleNames | 'standard' | 'basic';
export interface Options {
    /**
     * if true, include everything inside src folder
     */
    includeAll: false | string;
    aureliaApp?: string;
    aureliaConfig: AureliaModuleConfig | AureliaModuleConfig[];
    pal?: string;
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
