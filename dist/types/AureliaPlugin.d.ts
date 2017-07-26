import { Convention } from "./ConventionDependenciesPlugin";
export declare type Polyfills = "es2015" | "es2016" | "esnext" | "none";
export interface Options {
    includeAll: false | string;
    aureliaApp?: string;
    aureliaConfig: string | string[];
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
    addEntry(options: Webpack.Options, modules: string | string[]): void;
}
