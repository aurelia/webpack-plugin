import { ObjectDeserializerContext, ObjectSerializerContext } from "./webpack";

export class ClassSerializer<T extends ISerializable> {
  constructor(private ctor: { new(...params: any[]): T }) {
  }

  serialize(obj: T, context: ObjectSerializerContext) {
    obj.serialize(context);
  }

  deserialize(context: ObjectDeserializerContext) {
    const obj = new this.ctor();
    obj.deserialize(context);
    return obj;
  }
}

interface ISerializable {
  serialize(context: ObjectSerializerContext): void;
  deserialize(context: ObjectDeserializerContext): void
}