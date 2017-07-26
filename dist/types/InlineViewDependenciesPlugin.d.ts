import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
export declare class InlineViewDependenciesPlugin extends BaseIncludePlugin {
    parser(compilation: Webpack.Compilation, parser: Webpack.Parser, add: AddDependency): void;
}
