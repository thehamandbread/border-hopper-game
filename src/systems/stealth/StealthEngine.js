/**
 * The stealth engine: guards and wall cameras watching one target (Mateo), on a SightGrid, with every
 * number from public/assets/data/stealth_config.json. Plain JS with no Phaser and no wall clock:
 * everything moves only in update(dtMs, target), so tools/test_stealth.mjs is deterministic.
 * Rendering is separate (StealthRenderer.js).
 *
 * Detection, per source, 0..1:
 *   - target in the cone with a clear line: rises at 1 / fillSeconds(distance), linear from
 *     detection.fillSecondsNear at distance 0 to detection.fillSecondsFar at the cone's length;
 *   - target sprinting inside the noise ring (noise.sprintRingTiles) of a source that hears (guards):
 *     rises at the near rate even without a line of sight (if noise.noiseFillsWithoutLineOfSight), and
 *     the guard stops and turns toward the target (if noise.guardTurnsToNoise); walking is silent;
 *   - otherwise: falls at 1 / detection.decaySeconds.
 * Reaching 1 emits 'spotted' { sourceId, sourceType, targetPos } once; it doesn't emit again until the
 * value has fallen back to 0 or reset() is called, nor (cameras) within camera.respotCooldownSeconds of
 * the last spot. A source with `blind` set sees and hears nothing (its value only falls).
 *
 * Each source exposes, for rendering and the dev panel: detection (the "?" fill, 0..1), alert ('none',
 * 'suspicious' or 'spotted'), inView, hearing, state, x, y, facingDeg, cone.
 */
import Emitter from '../Emitter.js';
import Guard from './Guard.js';
import WallCamera from './WallCamera.js';
import { canSee } from './vision.js';

export default class StealthEngine extends Emitter {
  constructor(config, grid) {
    super();
    this.config = config;
    this.grid = grid;
    this.tileSize = grid.tileSize;
    this.sources = [];
    const noise = config.noise;
    this.sprintRing = noise.sprintRingTiles * this.tileSize;
    this.walkRing = typeof noise.walkNoise === 'number' ? noise.walkNoise * this.tileSize : 0;
    this.target = { x: 0, y: 0, sprinting: false, moving: false };
  }

  addGuard({ id, route }) {
    const guard = new Guard({ id, route, cfg: this.config.guard, tileSize: this.tileSize, grid: this.grid });
    return this.addSource(guard);
  }

  addCamera({ id, x, y, mountDeg }) {
    const cam = new WallCamera({ id, x, y, mountDeg, cfg: this.config.camera, tileSize: this.tileSize });
    return this.addSource(cam);
  }

  addSource(source) {
    source.detection = 0;
    source.spotted = false;
    source.cooldown = 0;
    source.blind = false;
    source.alert = 'none';
    source.inView = false;
    source.hearing = false;
    this.sources.push(source);
    return source;
  }

  get(id) {
    return this.sources.find((s) => s.id === id);
  }

  /** Clears every detection value and spotted latch. With positions, guards and cameras restart too. */
  reset({ positions = false } = {}) {
    for (const s of this.sources) {
      s.detection = 0;
      s.spotted = false;
      s.cooldown = 0;
      s.blind = false;
      s.alert = 'none';
      s.inView = false;
      s.hearing = false;
      if (positions) s.restart();
    }
  }

  /** Fill time (seconds) at this distance for a cone of this length. */
  fillSeconds(distance, length) {
    const { fillSecondsNear: near, fillSecondsFar: far } = this.config.detection;
    const t = length > 0 ? Math.min(1, Math.max(0, distance / length)) : 1;
    return near + (far - near) * t;
  }

  /**
   * target: { x, y, sprinting, moving } in px (the point watchers look at: Mateo's body centre).
   * sprinting only counts while moving.
   */
  update(dtMs, target) {
    const dt = dtMs / 1000;
    const t = this.target;
    t.x = target.x;
    t.y = target.y;
    t.moving = target.moving ?? true;
    t.sprinting = !!target.sprinting && t.moving;
    const ring = t.sprinting ? this.sprintRing : t.moving ? this.walkRing : 0;
    const { decaySeconds, fillSecondsNear } = this.config.detection;
    const { noiseFillsWithoutLineOfSight, guardTurnsToNoise } = this.config.noise;

    for (const s of this.sources) {
      const distance = Math.hypot(t.x - s.x, t.y - s.y);
      s.hearing = !s.blind && s.hears && ring > 0 && distance <= ring;
      if (s.type === 'guard') s.listenTo(s.hearing && guardTurnsToNoise ? t : null);
      s.update(dt);

      const d = Math.hypot(t.x - s.x, t.y - s.y);
      s.inView = !s.blind && canSee(s, t, this.grid);
      let rate = 0;
      if (s.inView) rate = 1 / this.fillSeconds(d, s.cone.length);
      if (s.hearing && noiseFillsWithoutLineOfSight) rate = Math.max(rate, 1 / fillSecondsNear);
      s.detection = rate > 0 ? Math.min(1, s.detection + rate * dt) : Math.max(0, s.detection - dt / decaySeconds);

      s.cooldown = Math.max(0, s.cooldown - dt);
      if (s.detection >= 1 && !s.spotted && s.cooldown <= 0) {
        s.spotted = true;
        s.cooldown = s.respotCooldown ?? 0;
        this.emit('spotted', { sourceId: s.id, sourceType: s.type, targetPos: { x: t.x, y: t.y } });
      } else if (s.detection <= 0) {
        s.spotted = false;
      }
      s.alert = s.spotted ? 'spotted' : s.detection > 0 ? 'suspicious' : 'none';
    }
  }

  /** A plain snapshot for the dev panel and Playwright (window.__stealthDebug). */
  snapshot() {
    return {
      target: { ...this.target },
      sources: this.sources.map((s) => ({
        id: s.id,
        type: s.type,
        state: s.state,
        detection: s.detection,
        alert: s.alert,
        inView: s.inView,
        hearing: s.hearing,
        x: s.x,
        y: s.y,
        facingDeg: s.facingDeg,
      })),
    };
  }
}
