import * as webpack from 'webpack';
declare interface Loader {
    _module: webpack.NormalModule;
    cacheable?(): void;
    async(): (...args: unknown[]) => unknown;
}
declare function loader(this: Loader, content: string): string;
declare namespace loader {
    const htmlSymbol: symbol;
    let attributes: {
        require: string[];
        compose: string[];
        "router-view": string[];
    };
    function modules(html: string): string[];
}
export = loader;
