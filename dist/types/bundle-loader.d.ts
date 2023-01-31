declare function loader(): void;
declare namespace loader {
    var pitch: (this: import("webpack").WebpackPluginInstance, remainingRequest: any) => string;
}
export = loader;
