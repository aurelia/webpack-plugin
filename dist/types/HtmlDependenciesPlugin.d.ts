import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
export declare class HtmlDependenciesPlugin extends BaseIncludePlugin {
    parser(compilation: Webpack.Compilation, parser: Webpack.Parser, addDependency: AddDependency): void;
}
