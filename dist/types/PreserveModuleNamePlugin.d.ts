export declare const preserveModuleName: symbol;
export declare class PreserveModuleNamePlugin {
    private isDll;
    constructor(isDll?: boolean);
    apply(compiler: Webpack.Compiler): void;
}
