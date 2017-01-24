import ModuleDependency = require("webpack/lib/dependencies/ModuleDependency");
import NullDependency = require("webpack/lib/dependencies/NullDependency");
export declare class IncludeDependency extends ModuleDependency {
    private options;
    constructor(request: string, options?: DependencyOptions);
    readonly type: string;
    getReference(): {
        module: Webpack.Module | null;
        importedNames: boolean | string[];
    } | null;
}
export declare type NullDependencyTemplate = typeof NullDependency.Template;
export declare const Template: NullDependencyTemplate;
