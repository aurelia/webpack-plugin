import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as webpack from 'webpack';
export declare class HtmlDependenciesPlugin extends BaseIncludePlugin {
    parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, addDependency: AddDependency): void;
}
