import * as webpack from 'webpack';
import { Attribute, DocumentFragment, Element, parseFragment } from 'parse5';

declare interface Loader {
  _module: webpack.NormalModule;
  cacheable?(): void;
  async(): (...args: unknown[]) => unknown;
}

const _htmlSymbol = Symbol("HTML dependencies");

function loader(this: Loader, content: string) {
  this.cacheable && this.cacheable();
  this._module[_htmlSymbol] = loader.modules(content);

  return content;
}

namespace loader {
  export const htmlSymbol = _htmlSymbol;

  export let attributes = {
    "require": [ "from" ],
    "compose": [ "view", "view-model" ],
    "router-view": [ "layout-view", "layout-view-model" ],
  };

  function traverse(tree: DocumentFragment | Element, cb: (tag: string, attr: Attribute) => void) {
    tree.childNodes && tree.childNodes.forEach((n: any) => {
      const ne = n as Element;
      ne.attrs && ne.attrs.forEach(attr => {
        cb(ne.tagName, attr);
      });
      if (ne.childNodes) traverse(ne, cb);
      // For <template> tag
      if (n.content && n.content.childNodes) traverse(n.content as DocumentFragment, cb);
    });
  }

  function parse(html: string, cb: (tag: string, attr: Attribute) => boolean): Attribute[] {
    const tree = parseFragment(html);
    const attrs: Attribute[] = [];
    traverse(tree, (tag, attr) => {
      if (cb(tag, attr)) {
        attrs.push(attr)
      }
    });
    return attrs;
  }


  export function modules(html: string) {
    return parse(html, (tag, attr) => {
      const attrs = loader.attributes[tag];
      return attrs && attrs.includes(attr.name);
    })
    // Ignore values that contain interpolated values
    .filter(attr => !/(^|[^\\])\$\{/.test(attr.value))
    .map(attr => attr.value);
  }
}

export = loader;
