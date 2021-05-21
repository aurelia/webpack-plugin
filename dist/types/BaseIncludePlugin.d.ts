import * as webpack from 'webpack';
import { DependencyOptionsEx } from "./interfaces";
export declare type AddDependency = (request: string | DependencyOptionsEx) => void;
export declare class BaseIncludePlugin {
    apply(compiler: webpack.Compiler): void;
    parser(compilation: webpack.Compilation, parser: webpack.javascript.JavascriptParser, add: AddDependency): void;
}
