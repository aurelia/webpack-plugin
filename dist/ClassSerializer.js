"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassSerializer = void 0;
class ClassSerializer {
    constructor(ctor) {
        this.ctor = ctor;
    }
    serialize(obj, context) {
        obj.serialize(context);
    }
    deserialize(context) {
        const obj = new this.ctor();
        obj.deserialize(context);
        return obj;
    }
}
exports.ClassSerializer = ClassSerializer;
