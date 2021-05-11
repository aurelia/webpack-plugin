declare namespace Tapable {
  interface Hook {
  }

  export class SyncHook<A = never, B = never> implements Hook {
    tap(options: string, fn: (a: A, b: B) => void): void;
  }

  export class AsyncHook<A = never, B = never> implements Hook {
    tap(options: string, fn: (a: A, b: B) => void): void;
    tapAsync(options: string, fn: (cb: Function) => void): void;
    tapAsync(options: string, fn: (a: A, cb: Function) => void): void;
    tapAsync(options: string, fn: (a: A, b: B, cb: Function) => void): void;
    tapPromise(options: string, fn: (a: A, b: B) => Promise<any>): void;
  }

  export class SyncHook1<T, A> {
    tap(arg: T, options: string, fn: (a: A) => void): void;
  }
}

declare namespace Webpack {
  // export class Dependency {
  //   module: Module | null;
  //   getReference(): { module: Module | null, importedNames: boolean | string[] } | null;
  //   static compare(a: Dependency, b: Dependency): number;
  // }

  // export class DependenciesBlock {
  //   dependencies: Dependency[];
    
  //   addDependency(dependency: Dependency): void;
  // }

  // export class Module extends DependenciesBlock {
  //   id: string;
  //   buildMeta: object|null;
  //   rawRequest: string;
  //   reasons: Reason[];
  //   resource: string;
    
  //   isUsed(_export: string): boolean | string;    
  // }

  // export interface Reason {
  //   module: Module;
  //   dependency: Dependency;
  // }

  // export type Expression =
  //   MemberExpression | 
  //   IdentifierExpression |
  //   CallExpression |
  //   ObjectExpression;

  // export class MemberExpression {
  //   range: [number, number];
  //   // Those types are not correct, but that's enough to compile this project
  //   property: IdentifierExpression;
  //   object: { name: string; type: string; } & MemberExpression;
  //   type: "MemberExpression";
  // }

  // export class IdentifierExpression {
  //   range: [number, number];
  //   name: string;
  //   type: "IdentifierExpression";
  // }

  // export class CallExpression {
  //   range: [number, number];
  //   arguments: Expression[];
  //   type: "CallExpression";
  // }

  // export class ObjectExpression {
  //   range: [number, number];
  //   type: "ObjectExpression";
  //   properties: {
  //     key: {
  //       type: string;
  //       name: string;
  //     };
  //     value: Expression;
  //   }[];
  // }

  // export class Parser {
  //   state: {
  //     current: Module;
  //     module: Module;
  //   }
  //   hooks: {
  //     program: Tapable.SyncHook;
  //     evaluate: Tapable.SyncHook1<"MemberExpression", Webpack.MemberExpression>;
  //     evaluateIdentifier: Tapable.SyncHook1<string, Webpack.Expression>;
  //     call: Tapable.SyncHook1<string, Webpack.CallExpression>;
  //   }
  //   evaluateExpression(expr: Expression): EvaluatedExpression;
  // }

  // export class EvaluatedExpression {
  //   isString(): boolean;
  //   isArray(): boolean;
  //   string?: string;
  //   items?: EvaluatedExpression[];
  // }

  // export class Compiler {
  //   options: Options;
  //   hooks: {
  //     compilation: Tapable.SyncHook<Compilation, CompilationParameters>;
  //     beforeCompile: Tapable.AsyncHook<object>;
  //   }
  //   resolverFactory: {
  //     get(type: "normal", context: object): Resolver;
  //   }
  // }

  interface Options {
    entry: string | string[] | { [name: string]: string | string[] };
    target: string;
    module: {
      rules?: { test?: RegExp; use: string | string[] }[];
      loaders?: { test?: RegExp; use: string | string[] }[]; // same as rules, supported for backward compat with 1.x
    };
    resolve: {
      alias: { [key: string]: string };
      modules: string[];
      extensions: string[];
      plugins: Object[];
      symlinks: boolean;
    }; 
    resolveLoader: {
      alias?: { [key: string]: string };      
      symlinks: boolean;
    };
    plugins: object[];
  }

  // export class Compilation {
  //   options: Options;
  //   inputFileSystem: FileSystem;
  //   hooks: {
  //     beforeModuleIds: Tapable.SyncHook<Module[]>;
  //     finishModules: Tapable.SyncHook<Module[]>;
  //   }

  //   dependencyFactories: { set(d: any, f: ModuleFactory): void; };
  //   dependencyTemplates: { set(d: any, f: any): void; };
  // }

  // export class CompilationParameters {
  //   normalModuleFactory: ModuleFactory;  
  // }

  // export class ModuleFactory {
  //   hooks: {
  //     parser: {
  //       for(type: "javascript/auto"): Tapable.SyncHook<Parser>;
  //     } 
  //   }
  // }

  // type ResolverCallback = (request: ResolveRequest, cb: (err?: any, result?: any) => void) => void;

  // export class Resolver {    
  //   fileSystem: FileSystem;
  //   hooks: {
  //     resolve: Tapable.AsyncHook<ResolveRequest, object>;
  //     resolveStep: Tapable.SyncHook<string, ResolveRequest>;
  //   }
  //   getHook(name: "after-resolve"): Tapable.AsyncHook<ResolveRequest, object>;
  //   getHook(name: "before-described-resolve"): Tapable.AsyncHook<ResolveRequest, object>;
  //   getHook(name: "described-resolve"): Tapable.AsyncHook<ResolveRequest, object>;

  //   doResolve(step: Tapable.Hook, request: ResolveRequest, message: string, resolveContext: object, cb: (err?: any, result?: any) => void): void;
  //   resolve(context: string|null, path: string, request: string, resolveContext: object, cb: (err: any, result: string) => void): void;
  // }

  // export class ResolveRequest {
  //   path: string;
  //   request: string;
  //   context: any;
  // }

  // export interface FileSystem {
  //   readdirSync(path: string): string[];
  //   statSync(fname: string): { 
  //     isDirectory(): boolean; 
  //     isFile(): boolean;
  //   };
  // }

  // export interface Loader {
  //   _module: Module;
  //   cacheable?(): void;
  // }
}

// import 'webpack';
// declare module "webpack" {

//   export class Module extends DependenciesBlock {
//     id: string;
//     buildMeta: object|null;
//     rawRequest: string;
//     reasons: Reason[];
//     resource: string;

//     isUsed(_export: string): boolean | string;
//   }

//   export class DefinePlugin {
//     constructor(hash: any);
//     apply(compiler: Webpack.Compiler): void;
//   }

//   export class DllPlugin {
//   }

//   export class DllReferencePlugin {
//   }
// }

// @ts-ignore
// declare module "webpack/lib/Dependency" {
//   const Dependency: typeof Webpack.Dependency;
//   export = Dependency;
// }

// // @ts-ignore
// declare module "webpack/lib/dependencies/NullDependency" {
//   class NullDependencyTemplate {
//   }

//   class NullDependency extends Webpack.Dependency {
//     static Template: typeof NullDependencyTemplate;
//   }

//   export = NullDependency;
// }

// // @ts-ignore
// declare module "webpack/lib/dependencies/ModuleDependency" {
//   class ModuleDependency extends Webpack.Dependency {
//     constructor(request: string);
//     request: string;
//   }

//   export = ModuleDependency;
// }

// @ts-ignore
// declare module "webpack/lib/javascript/JavaScriptParser" {
  
//   export class Parser {
//     state: {
//       current: Module;
//       module: Module;
//     }
//     hooks: {
//       program: Tapable.SyncHook;
//       evaluate: Tapable.SyncHook1<"MemberExpression", Webpack.MemberExpression>;
//       evaluateIdentifier: Tapable.SyncHook1<string, Webpack.Expression>;
//       call: Tapable.SyncHook1<string, Webpack.CallExpression>;
//     }
//     evaluateExpression(expr: Expression): EvaluatedExpression;
//   }
// }

// @ts-ignore
declare module "html-loader/lib/attributesParser" {
  function parse(content: string, cb: (tag: string, attr: string) => boolean): { value: string }[];

  export = parse;
}
