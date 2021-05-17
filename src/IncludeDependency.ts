import { dependencyImports } from "./PreserveExportsPlugin";
import { preserveModuleName } from "./PreserveModuleNamePlugin";
import * as webpack from 'webpack';
import { DependencyOptions, ReferencedExport } from "./interfaces";

export class IncludeDependency extends webpack.dependencies.ModuleDependency {
  protected options?: DependencyOptions;

  constructor(request: string, options?: DependencyOptions) {
    let chunk = options && options.chunk;
    super(chunk ? `async?lazy&name=${chunk}!${request}` : request);
    this.options = options;
  }

  // @ts-expect-error
  get type() {
    return IncludeDependency.name;
  }

  getReferencedExports(moduleGraph: webpack.ModuleGraph): (string[] | ReferencedExport)[] {
    return this.options?.exports
      ? [{ name: this.options.exports, canMangle: false }]
      : webpack.Dependency.NO_EXPORTS_REFERENCED;
  }

  get [preserveModuleName]() {
    return true;
  }

  get [dependencyImports]() {
    return this.options?.exports;
  }
};

export type NullDependencyTemplate = typeof webpack.dependencies.NullDependency.Template;
export const Template: NullDependencyTemplate = webpack.dependencies.NullDependency.Template;
