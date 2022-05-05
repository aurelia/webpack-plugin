export declare class ClassSerializer<T extends ISerializable> {
    private ctor;
    constructor(ctor: {
        new (...params: any[]): T;
    });
    serialize(obj: T, context: any): void;
    deserialize(context: any): T;
}
interface ISerializable {
    serialize(context: any): void;
    deserialize(context: any): void;
}
export {};
