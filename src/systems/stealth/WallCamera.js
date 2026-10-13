/**
 * A wall camera (logic only; plain JS): it sweeps continuously between sweep.fromDeg and sweep.toDeg
 * relative to its mount direction, secondsOneWay each way, reversing with no pause. It starts at
 * fromDeg, so it reaches toDeg at secondsOneWay and fromDeg again at twice that. It can't hear.
 */
export default class WallCamera {
  /** x, y: the lens position (px); mountDeg: the direction it points at the middle of its sweep. */
  constructor({ id, x, y, mountDeg, cfg, tileSize }) {
    this.id = id;
    this.type = 'camera';
    this.hears = false;
    this.x = x;
    this.y = y;
    this.mountDeg = mountDeg;
    this.from = cfg.sweep.fromDeg;
    this.to = cfg.sweep.toDeg;
    this.oneWay = cfg.sweep.secondsOneWay;
    this.respotCooldown = cfg.respotCooldownSeconds ?? 0; // seconds after a spot before it can report again
    this.cone = { widthDeg: cfg.cone.widthDeg, length: cfg.cone.lengthTiles * tileSize };
    this.restart();
  }

  restart() {
    this.t = 0;
    this.state = 'sweep';
    this.facingDeg = this.mountDeg + this.from;
  }

  /** The sweep offset from the mount direction (degrees). */
  get sweepDeg() {
    return this.facingDeg - this.mountDeg;
  }

  update(dt) {
    this.t = (this.t + dt) % (2 * this.oneWay);
    const phase = this.t <= this.oneWay ? this.t / this.oneWay : 2 - this.t / this.oneWay;
    this.facingDeg = this.mountDeg + this.from + (this.to - this.from) * phase;
  }
}
