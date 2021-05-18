import * as webpack from 'webpack';
import { AsyncSeriesBailHook } from 'tapable';

type BasicEvaluatedExpressionType = NonNullable<
  ReturnType<Parameters<ReturnType<webpack.javascript.JavascriptParser['hooks']['evaluateIdentifier']['for']>['tap']>[1]>
>;

export type BasicEvaluatedExpression = new () => BasicEvaluatedExpressionType;

export { Resolver, ResolveContext, ResolveRequest };

type SecondTemplateOfHook<T> = T extends AsyncSeriesBailHook<infer K, infer T, infer NotUsed> ? T : never;
type ResolveRequest = NonNullable<SecondTemplateOfHook<Resolver['hooks']['resolve']>> & {
  context: {
    compiler?: any;
    issuer: string;
    issuerLayer: string[] | null;
  }
}
type $Resolver = NonNullable<NonNullable<webpack.Configuration['resolve']>['resolver']>;
type Resolver = $Resolver & {
  hooks: $Resolver['hooks'] & {
    describedResolve: AsyncSeriesBailHook<ResolveRequest, ResolveContext>;
  }
}
type ResolveContext = Parameters<Resolver['resolve']>[3] & {
  // from internal usages
  name: string;
  path: string;
  request: string;
  query: string;
  fragment: string;
  directory: string;
  module: 'module' | '';
}

// resolver.ensureHook("resolve");
// resolver.ensureHook("internalResolve");
// resolver.ensureHook("newInteralResolve");
// resolver.ensureHook("parsedResolve");
// resolver.ensureHook("describedResolve");
// resolver.ensureHook("internal");
// resolver.ensureHook("rawModule");
// resolver.ensureHook("module");
// resolver.ensureHook("resolveAsModule");
// resolver.ensureHook("undescribedResolveInPackage");
// resolver.ensureHook("resolveInPackage");
// resolver.ensureHook("resolveInExistingDirectory");
// resolver.ensureHook("relative");
// resolver.ensureHook("describedRelative");
// resolver.ensureHook("directory");
// resolver.ensureHook("undescribedExistingDirectory");
// resolver.ensureHook("existingDirectory");
// resolver.ensureHook("undescribedRawFile");
// resolver.ensureHook("rawFile");
// resolver.ensureHook("file");
// resolver.ensureHook("finalFile");
// resolver.ensureHook("existingFile");
// resolver.ensureHook("resolved");

export interface IResolverPlugin {
  applyResolver(resolver: Resolver): void;
}

// note: from webpack.
// webpack doesn't export this type
// redeclare here instead
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

export interface DependencyOptions {
  chunk?: string;
  exports?: string[];
}

export type DependencyOptionsEx = DependencyOptions & { name: string };
