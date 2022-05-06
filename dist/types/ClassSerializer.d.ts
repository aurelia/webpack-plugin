import { ObjectDeserializerContext, ObjectSerializerContext } from "./webpack";
export declare class ClassSerializer<T extends ISerializable> {
    private ctor;
    constructor(ctor: {
        new (...params: any[]): T;
    });
    serialize(obj: T, context: ObjectSerializerContext): void;
    deserialize(context: ObjectDeserializerContext): T;
}
interface ISerializable {
    serialize(context: ObjectSerializerContext): void;
    deserialize(context: ObjectDeserializerContext): void;
}
export {};
