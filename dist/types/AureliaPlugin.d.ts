import { Convention } from "./ConventionDependenciesPlugin";
export declare type Polyfills = "es2015" | "es2016" | "esnext" | "none";
export interface Options {
    includeAll: boolean;
    aureliaApp?: string;
    aureliaConfig: string | string[];
    pal?: string;
    dist: string;
    features: {
        svg?: boolean;
        unparser?: boolean;
        polyfills?: Polyfills;
    };
    noHtmlLoader: boolean;
    noModulePathResolve: boolean;
    moduleMethods: string[];
    viewsFor: string;
    viewsExtensions: string | Convention | (string | Convention)[];
}
export declare class AureliaPlugin {
    options: Options;
    constructor(options?: Partial<Options>);
    apply(compiler: Webpack.Compiler): void;
}
