import { Resolver } from 'enhanced-resolve';
export declare class DistPlugin {
    private rawDist;
    private dist;
    constructor(dist: string);
    apply(resolver: Resolver): void;
}
