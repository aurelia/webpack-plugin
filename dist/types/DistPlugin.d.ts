export declare class DistPlugin {
    private dist;
    constructor(dist: string);
    apply(resolver: Webpack.Resolver): void;
}
