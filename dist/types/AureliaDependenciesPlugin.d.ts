import * as webpack from 'webpack';
export declare class AureliaDependenciesPlugin {
    private parserPlugin;
    constructor(...methods: string[]);
    apply(compiler: webpack.Compiler): void;
}
