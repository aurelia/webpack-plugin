import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as webpack from 'webpack';
import { DependencyOptionsEx } from "./interfaces";
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
    apply(compiler: webpack.Compiler): void;
    parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, addDependency: AddDependency): void;
}
