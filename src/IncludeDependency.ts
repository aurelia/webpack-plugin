import { dependencyImports } from "./PreserveExportsPlugin";
import { preserveModuleName } from "./PreserveModuleNamePlugin";
import * as webpack from 'webpack';
import { DependencyOptions, ReferencedExport } from "./interfaces";
import { ClassSerializer } from "./ClassSerializer";

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
    // when there's no specific exports are targetted,
    // passing an empty array means preserving all
    return [{ name: this.options?.exports ?? [], canMangle: false }]
  }

  get [preserveModuleName]() {
    return true;
  }

  get [dependencyImports]() {
    return this.options?.exports;
  }

  serialize(context: any) {
    const { write } = context;
    write(this.options);
    super.serialize(context);
  }

  deserialize(context: any) {
    const { read } = context;
    this.options = read();
    super.deserialize(context);
  }
};

webpack.util.serialization.register(IncludeDependency, "IncludeDependency", "IncludeDependency", new ClassSerializer(IncludeDependency));

export type NullDependencyTemplate = typeof webpack.dependencies.NullDependency.Template;
export const Template: NullDependencyTemplate = webpack.dependencies.NullDependency.Template;