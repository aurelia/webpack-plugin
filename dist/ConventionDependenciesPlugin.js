"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseIncludePlugin_1 = require("./BaseIncludePlugin");
const PreserveModuleNamePlugin_1 = require("./PreserveModuleNamePlugin");
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
        parser.hooks.program.tap("Aurelia:ConventionDependencies", () => {
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
                    let relative = path.relative(path.dirname(file), probe);
                    if (!relative.startsWith("."))
                        relative = "./" + relative;
                    addDependency(relative);
                    // If the module has a conventional dependency, make sure we preserve its name as well.
                    // This solves the pattern where a VM is statically loaded, e.g. `import { ViewModel } from "x"`
                    // and then passed to Aurelia, e.g. with `aurelia-dialog`.
                    // At this point Aurelia must determine the origin of the module to be able to look for 
                    // a conventional view, and so the module name must be preserved although it's never loaded 
                    // by `aurelia-loader`. See also aurelia/metadata#51.
                    parser.state.current[PreserveModuleNamePlugin_1.preserveModuleName] = true;
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
