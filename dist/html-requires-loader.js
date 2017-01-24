"use strict";
const parse = require("html-loader/lib/attributesParser");
const _htmlSymbol = Symbol("HTML dependencies");
function loader(content) {
    this.cacheable && this.cacheable();
    this._module[_htmlSymbol] =
        parse(content, (tag, attr) => {
            const attrs = loader.attributes[tag];
            return attrs && attrs.includes(attr);
        })
            .map(attr => attr.value);
    return content;
}
(function (loader) {
    loader.htmlSymbol = _htmlSymbol;
    loader.attributes = {
        "require": ["from"],
        "compose": ["view", "view-model"],
    };
})(loader || (loader = {}));
module.exports = loader;
