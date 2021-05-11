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

// @ts-ignore
declare module "html-loader/lib/attributesParser" {
  function parse(content: string, cb: (tag: string, attr: string) => boolean): { value: string }[];

  export = parse;
}
