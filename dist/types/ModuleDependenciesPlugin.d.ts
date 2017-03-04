import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
export interface ModuleDependenciesPluginOptions {
    [module: string]: undefined | string | DependencyOptionsEx | (undefined | string | DependencyOptionsEx)[];
}
export declare class ModuleDependenciesPlugin extends BaseIncludePlugin {
    root: string;
    hash: {
        [name: string]: (string | DependencyOptionsEx)[];
    };
    modules: {
        [module: string]: (string | DependencyOptionsEx)[];
    };
    /**
     * Each hash member is a module name, for which additional module names (or options) are added as dependencies.
     */
    constructor(hash: ModuleDependenciesPluginOptions);
    apply(compiler: Webpack.Compiler): void;
    parser(compilation: Webpack.Compilation, parser: Webpack.Parser, addDependency: AddDependency): void;
}
