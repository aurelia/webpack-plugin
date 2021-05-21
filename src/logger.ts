export function createLogger(name: string) {
  return {
    log: (...args: unknown[]) => {
      console.log(`[${name}]`, ...args);
    }
  }
}
