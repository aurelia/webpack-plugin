import { BaseIncludePlugin, AddDependency } from "./BaseIncludePlugin";
import minimatch = require("minimatch");
import path = require("path");

export type Convention = (filename: string) => string;

export class ConventionDependenciesPlugin extends BaseIncludePlugin {
  conventions: Convention[];

  /**
   * glob: a pattern that filters which files are affected
   */
  constructor(private glob: string, 
              conventions: string | Convention | (string | Convention)[] = [".html", ".htm"]) {
    super();
    if (!Array.isArray(conventions)) conventions = [conventions];
    this.conventions = conventions.map(c => typeof c === "string" ? 
                                            swapExtension.bind(null, c) : 
                                            c);
  }

  parser(compilation: Webpack.Compilation, parser: Webpack.Parser, addDependency: AddDependency) {
    const root = path.resolve();

    parser.plugin("program", () => {
      const { resource: file, rawRequest } = parser.state.current;
      if (!file) return;
      // We don't want to bring in dependencies of the async! loader
      if (/^async[!?]/.test(rawRequest)) return;
      if (!minimatch(path.relative(root, file), this.glob)) return;
      for (let c of this.conventions) {
        try {
          const probe = c(file);
          compilation.inputFileSystem.statSync(probe);  // Check if file exists
          addDependency(probe);
        } 
        catch (ex) { }
      }
    });
  }
};

function swapExtension(newExtension: string, file: string) {
  return file.replace(/\.[^\\/.]*$/, "") + newExtension;
}
