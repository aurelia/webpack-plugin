import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
export declare type Convention = (filename: string) => string;
export declare class ConventionDependenciesPlugin extends BaseIncludePlugin {
    private glob;
    conventions: Convention[];
    /**
     * glob: a pattern that filters which files are affected
     */
    constructor(glob: string, conventions?: string | Convention | (string | Convention)[]);
    parser(compilation: Webpack.Compilation, parser: Webpack.Parser, addDependency: AddDependency): void;
}
