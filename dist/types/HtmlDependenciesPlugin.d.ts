import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import * as Webpack from 'webpack';
export declare class HtmlDependenciesPlugin extends BaseIncludePlugin {
    parser(compilation: Webpack.Compilation, parser: Webpack.javascript.JavascriptParser, addDependency: AddDependency): void;
}
