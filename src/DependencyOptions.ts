interface DependencyOptions {
  chunk?: string;
  exports?: string[];
}

type DependencyOptionsEx = DependencyOptions & { name: string };
