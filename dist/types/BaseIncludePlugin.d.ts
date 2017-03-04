export declare type AddDependency = (request: string, options?: DependencyOptions) => void;
export declare class BaseIncludePlugin {
    apply(compiler: Webpack.Compiler): void;
    parser(compilation: Webpack.Compilation, parser: Webpack.Parser, add: AddDependency): void;
}
