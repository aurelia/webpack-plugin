declare function loader(this: Webpack.Loader, content: string): string;
declare namespace loader {
    const htmlSymbol: symbol;
    let attributes: {
        "require": string[];
        "compose": string[];
        "router-view": string[];
    };
    function modules(html: string): string[];
}
export = loader;
