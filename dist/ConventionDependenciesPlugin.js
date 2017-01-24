"use strict";
const BaseIncludePlugin_1 = require("./BaseIncludePlugin");
const minimatch = require("minimatch");
const path = require("path");
class ConventionDependenciesPlugin extends BaseIncludePlugin_1.BaseIncludePlugin {
    /**
     * glob: a pattern that filters which files are affected
     */
    constructor(glob, conventions = [".html", ".htm"]) {
        super();
        this.glob = glob;
        if (!Array.isArray(conventions))
            conventions = [conventions];
        this.conventions = conventions.map(c => typeof c === "string" ?
            swapExtension.bind(null, c) :
            c);
    }
    parser(compilation, parser, addDependency) {
        const root = path.resolve();
        parser.plugin("program", () => {
            const { resource: file, rawRequest } = parser.state.current;
            if (!file)
                return;
            // We don't want to bring in dependencies of the async! loader
            if (/^async[!?]/.test(rawRequest))
                return;
            if (!minimatch(path.relative(root, file), this.glob))
                return;
            for (let c of this.conventions) {
                try {
                    const probe = c(file);
                    compilation.inputFileSystem.statSync(probe); // Check if file exists
                    addDependency(probe);
                }
                catch (ex) { }
            }
        });
    }
}
exports.ConventionDependenciesPlugin = ConventionDependenciesPlugin;
;
function swapExtension(newExtension, file) {
    return file.replace(/\.[^\\/.]*$/, "") + newExtension;
}
