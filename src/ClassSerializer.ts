export class ClassSerializer<T extends ISerializable> {
  constructor(private ctor: { new(...params: any[]): T }) {
  }

  serialize(obj: T, context: any) {
    obj.serialize(context);
  }

  deserialize(context: any) {
    const obj = new this.ctor();
    obj.deserialize(context);
    return obj;
  }
}

interface ISerializable {
  serialize(context: any): void;
  deserialize(context: any): void
}