"use strict";
const BaseIncludePlugin_1 = require("./BaseIncludePlugin");
const html_requires_loader_1 = require("./html-requires-loader");
class HtmlDependenciesPlugin extends BaseIncludePlugin_1.BaseIncludePlugin {
    parser(compilation, parser, addDependency) {
        parser.plugin("program", () => {
            const deps = parser.state.current[html_requires_loader_1.htmlSymbol];
            if (!deps)
                return;
            deps.forEach(addDependency);
        });
    }
}
exports.HtmlDependenciesPlugin = HtmlDependenciesPlugin;
;
