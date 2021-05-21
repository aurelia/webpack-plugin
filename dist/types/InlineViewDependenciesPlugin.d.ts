import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as webpack from 'webpack';
export declare class InlineViewDependenciesPlugin extends BaseIncludePlugin {
    parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, add: AddDependency): void;
}
