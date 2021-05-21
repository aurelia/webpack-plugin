import * as Webpack from "webpack";
export declare const preserveModuleName: unique symbol;
export declare class PreserveModuleNamePlugin {
    private isDll;
    constructor(isDll?: boolean);
    apply(compiler: Webpack.Compiler): void;
}
