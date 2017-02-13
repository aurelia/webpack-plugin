import { Convention } from "./ConventionDependenciesPlugin";
export interface Options {
    includeAll: boolean;
    aureliaApp?: string;
    aureliaConfig: string | string[];
    pal?: string;
    dist: string;
    features: {
        svg?: boolean;
        unparser?: boolean;
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
