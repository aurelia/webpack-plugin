interface DependencyOptions {
    chunk?: string;
    exports?: string[];
}
declare type DependencyOptionsEx = DependencyOptions & {
    name: string;
};
