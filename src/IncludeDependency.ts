import { dependencyImports } from "./PreserveExportsPlugin";
import { preserveModuleName } from "./PreserveModuleNamePlugin";
import ModuleDependency = require("webpack/lib/dependencies/ModuleDependency");
import NullDependency = require("webpack/lib/dependencies/NullDependency");

export class IncludeDependency extends ModuleDependency {  
  constructor(request: string, private options?: DependencyOptions) {
    super(request);
  }

  get type() {
    return "aurelia module";
  }

  getReference() {
    let importedNames = this.options && this.options.exports;
    return importedNames ? 
      { module: this.module, importedNames } :
      super.getReference();
  }

  get [preserveModuleName]() {
    return true;
  }

  get [dependencyImports]() {
    return this.options && this.options.exports;
  }
};

export type NullDependencyTemplate = typeof NullDependency.Template;
export const Template: NullDependencyTemplate = NullDependency.Template;
