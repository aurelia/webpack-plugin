import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
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
    apply(compiler: Webpack.Compiler): void;
    parser(compilation: Webpack.Compilation, parser: Webpack.Parser, addDependency: AddDependency): void;
}
