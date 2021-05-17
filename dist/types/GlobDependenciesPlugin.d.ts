import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as webpack from 'webpack';
declare module "minimatch" {
    interface IMinimatch {
        match(fname: string, partial: boolean): boolean;
    }
}
export declare class GlobDependenciesPlugin extends BaseIncludePlugin {
    private root;
    private hash;
    private modules;
    /**
     * Each hash member is a module name, for which globbed value(s) will be added as dependencies
     **/
    constructor(hash: {
        [module: string]: string | string[];
    });
    apply(compiler: webpack.Compiler): void;
    parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, addDependency: AddDependency): void;
}
