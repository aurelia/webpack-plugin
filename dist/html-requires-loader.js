"use strict";
const parse5_1 = require("parse5");
const _htmlSymbol = Symbol("HTML dependencies");
function loader(content) {
    this.cacheable && this.cacheable();
    this._module[_htmlSymbol] = loader.modules(content);
    return content;
}
(function (loader) {
    loader.htmlSymbol = _htmlSymbol;
    loader.attributes = {
        "require": ["from"],
        "compose": ["view", "view-model"],
        "router-view": ["layout-view", "layout-view-model"],
    };
    function traverse(tree, cb) {
        tree.childNodes && tree.childNodes.forEach((n) => {
            const ne = n;
            ne.attrs && ne.attrs.forEach(attr => {
                cb(ne.tagName, attr);
            });
            if (ne.childNodes)
                traverse(ne, cb);
            // For <template> tag
            if (n.content && n.content.childNodes)
                traverse(n.content, cb);
        });
    }
    function parse(html, cb) {
        const tree = (0, parse5_1.parseFragment)(html);
        const attrs = [];
        traverse(tree, (tag, attr) => {
            if (cb(tag, attr)) {
                attrs.push(attr);
            }
        });
        return attrs;
    }
    function modules(html) {
        return parse(html, (tag, attr) => {
            const attrs = loader.attributes[tag];
            return attrs && attrs.includes(attr.name);
        })
            // Ignore values that contain interpolated values
            .filter(attr => !/(^|[^\\])\$\{/.test(attr.value))
            .map(attr => attr.value);
    }
    loader.modules = modules;
})(loader || (loader = {}));
module.exports = loader;
