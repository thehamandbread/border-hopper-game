/**
 * A small event emitter (on / once / off / emit). Dialogue logic and game state use it instead of
 * Phaser's, so they also run in plain node (tools/test_encounter.mjs).
 */
export default class Emitter {
  constructor() {
    this.listeners = new Map();
  }

  on(name, fn, context) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push({ fn, context, once: false });
    return this;
  }

  once(name, fn, context) {
    this.on(name, fn, context);
    this.listeners.get(name).at(-1).once = true;
    return this;
  }

  off(name, fn) {
    const list = this.listeners.get(name);
    if (list) this.listeners.set(name, fn ? list.filter((l) => l.fn !== fn) : []);
    return this;
  }

  emit(name, ...args) {
    const list = this.listeners.get(name);
    if (!list?.length) return false;
    for (const l of [...list]) {
      if (l.once) this.off(name, l.fn);
      l.fn.apply(l.context, args);
    }
    return true;
  }

  removeAllListeners(name) {
    if (name === undefined) this.listeners.clear();
    else this.listeners.delete(name);
    return this;
  }
}
