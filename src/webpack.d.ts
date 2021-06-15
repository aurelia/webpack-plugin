// @ts-ignore
declare module "html-loader/lib/attributesParser" {
  function parse(content: string, cb: (tag: string, attr: string) => boolean): { value: string }[];

  export = parse;
}
