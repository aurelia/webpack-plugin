// @ts-ignore
declare module "html-loader/lib/attributesParser" {
  function parse(content: string, cb: (tag: string, attr: string) => boolean): { value: string }[];

  export = parse;
}

export interface ObjectDeserializerContext {
	read: () => any;
}
export interface ObjectSerializer {
	serialize: (arg0: any, arg1: ObjectSerializerContext) => void;
	deserialize: (arg0: ObjectDeserializerContext) => any;
}
export interface ObjectSerializerContext {
	write: (arg0?: any) => void;
}
