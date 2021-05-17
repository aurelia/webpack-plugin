import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as webpack from 'webpack';
export declare type Convention = (filename: string) => string;
export declare class ConventionDependenciesPlugin extends BaseIncludePlugin {
    private glob;
    conventions: Convention[];
    /**
     * glob: a pattern that filters which files are affected
     */
    constructor(glob: string, conventions?: string | Convention | (string | Convention)[]);
    parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, addDependency: AddDependency): void;
}
