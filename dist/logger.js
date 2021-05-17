"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
function createLogger(name) {
    return {
        log: (...args) => {
            console.log(`[${name}]`, ...args);
        }
    };
}
exports.createLogger = createLogger;
