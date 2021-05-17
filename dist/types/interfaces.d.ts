import { Resolver, ResolveContext, ResolveRequest, ResolveOptions } from 'enhanced-resolve';
import * as webpack from 'webpack';
declare type BasicEvaluatedExpressionType = NonNullable<ReturnType<Parameters<ReturnType<webpack.javascript.JavascriptParser['hooks']['evaluateIdentifier']['for']>['tap']>[1]>>;
export declare type BasicEvaluatedExpression = new () => BasicEvaluatedExpressionType;
export { Resolver, ResolveContext, ResolveRequest, ResolveOptions };
declare module 'enhanced-resolve' {
    interface ResolveContext {
        name: string;
        path: string;
        request: string;
        query: string;
        fragment: string;
        directory: string;
        module: 'module' | '';
    }
}
export interface IResolverPlugin {
    applyResolver(resolver: Resolver): void;
}
export interface ReferencedExport {
    /**
     * name of the referenced export
     */
    name: string[];
    /**
     * when false, referenced export can not be mangled, defaults to true
     */
    canMangle?: boolean;
}
