import Phaser from 'phaser';
import { FIRE_ANIM, FIRE_TEXTURE, SMOKE_ANIM, SMOKE_TEXTURE } from '../objects/FireEffects.js';

// Sprite caps for low-end Chromebooks. The layout in restaurant_map.json burns at most
// 90 area tiles + 19 safe-path tiles + 2 spill tiles + 3 flare sprites = 114 fire sprites, under FIRE_CAP.
const FIRE_CAP = 120;
const SMOKE_CAP = 24;
const DEADLY_INSET = 3; // px: the deadly area is 3 px inside the tile, 1 px inside the blocker, so standing
// against fire that blocked Mateo during the call does not kill him the moment the call ends
const BLOCKER_INSET = 2;
const SMOKE_DEPTH = 1400; // above the world, below markers (1500) and the HUD
const FLARE_EMBER_ALPHA = 0.25; // a flare tile between bursts: faint embers as a warning, not deadly

/** Small seeded PRNG (mulberry32): the same seed always gives the same spread. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (x, y) => `${x},${y}`;

/**
 * Deterministic kitchen fire, configured by the map's "fire" block.
 *
 * Fire time (from ignite()): after startDelayMs, one tile of the burn area catches every spreadMs,
 * nearest to the stove first (seeded jitter), then the dining-room spill tiles. The safe path never
 * catches during the spread. Escape time (from startEscape(), i.e. the end of the call): flare tiles
 * on the path burn for flareOnMs out of every flarePeriodMs, and after closeAfterMs the whole path
 * catches, one tile every closeStepMs, so the kitchen becomes impassable.
 *
 * snapshot()/restore() put the fire back exactly as it was when the escape started.
 */
export default class FireSystem {
  constructor(scene, config, { tileSize = 16, origin, isOccupied }) {
    this.isOccupied = isOccupied; // (tileX, tileY) => true if the player is standing on that tile
    this.scene = scene;
    this.config = config;
    this.ts = tileSize;
    this.origin = origin; // the stove tile: where the fire starts
    this.pathSet = new Set(config.safePath.map(([x, y]) => key(x, y)));
    this.order = this.buildOrder();
    this.burning = new Map(); // "x,y" -> fire sprite
    this.smoke = [];
    this.flares = config.flares.map((f) => ({ ...f, x: f.tile[0], y: f.tile[1], sprite: null, on: false }));
    // Invisible static bodies over burning tiles. The scene collides with these during the call,
    // when fire blocks Mateo instead of hurting him.
    this.blockers = scene.physics.add.staticGroup();
    this.reset();
  }

  /** Burn order: every burn-area tile except the stove and the safe path, nearest the stove first. */
  buildOrder() {
    const { x1, y1, x2, y2 } = this.config.burnArea;
    const rng = mulberry32(this.config.seed);
    const tiles = [];
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (x === this.origin.x && y === this.origin.y) continue;
        if (this.pathSet.has(key(x, y))) continue;
        const d = Phaser.Math.Distance.Between(x, y, this.origin.x, this.origin.y);
        tiles.push({ x, y, score: d + rng() * 1.5 });
      }
    }
    tiles.sort((a, b) => a.score - b.score);
    return [...tiles, ...this.config.spill.map(([x, y]) => ({ x, y }))];
  }

  reset() {
    this.active = false;
    this.fireTime = 0;
    this.spreadIndex = 0;
    this.escaping = false;
    this.escapeTime = 0;
    this.closeIndex = 0;
  }

  /** stove_ignite: the spread starts. */
  ignite() {
    this.active = true;
  }

  /** The call ended: flares and the closing timer start. */
  startEscape() {
    this.escaping = true;
    this.escapeTime = 0;
  }

  /** True once the whole safe path is burning. */
  get closed() {
    return this.closeIndex >= this.config.safePath.length;
  }

  update(delta) {
    if (!this.active) return;
    this.fireTime += delta;
    const c = this.config;
    while (
      this.spreadIndex < this.order.length &&
      this.fireTime >= c.startDelayMs + this.spreadIndex * c.spreadMs
    ) {
      const t = this.order[this.spreadIndex];
      // During the call, a tile doesn't catch while Mateo stands on it (it waits until he steps off),
      // so he can't get trapped inside the fire before it becomes deadly.
      if (!this.escaping && this.isOccupied?.(t.x, t.y)) break;
      this.spreadIndex++;
      this.burn(t.x, t.y);
    }
    if (!this.escaping) return;
    this.escapeTime += delta;
    this.updateFlares();
    while (this.closeIndex < c.safePath.length && this.escapeTime >= c.closeAfterMs + this.closeIndex * c.closeStepMs) {
      const [x, y] = c.safePath[this.closeIndex++];
      this.burn(x, y);
    }
  }

  updateFlares() {
    const { flarePeriodMs, flareOnMs } = this.config;
    for (const f of this.flares) {
      if (this.burning.has(key(f.x, f.y))) {
        f.on = false; // the path has closed over it
        f.sprite?.setVisible(false);
        continue;
      }
      const t = (this.escapeTime + flarePeriodMs - f.phaseMs) % flarePeriodMs;
      f.on = t < flareOnMs;
      if (!f.sprite) {
        f.sprite = this.makeFire(f.x, f.y);
        if (!f.sprite) continue;
      }
      f.sprite.setVisible(true).setAlpha(f.on ? 1 : FLARE_EMBER_ALPHA);
    }
  }

  makeFire(x, y) {
    if (this.fireSpriteCount() >= FIRE_CAP) return null;
    const s = this.scene.add.sprite(x * this.ts + this.ts / 2, y * this.ts + this.ts / 2, FIRE_TEXTURE, 0);
    s.setDepth((y + 1) * this.ts); // depth-sort with Mateo by feet y
    // Offset each tile's animation start so the fire doesn't flicker in lockstep.
    s.play({ key: FIRE_ANIM, startFrame: (x + y) % 3 });
    return s;
  }

  fireSpriteCount() {
    return this.burning.size + this.flares.filter((f) => f.sprite).length;
  }

  burn(x, y) {
    const k = key(x, y);
    if (this.burning.has(k)) return;
    const sprite = this.makeFire(x, y);
    this.burning.set(k, sprite);
    const ts = this.ts;
    const zone = this.scene.add.zone(x * ts + ts / 2, y * ts + ts / 2, ts - BLOCKER_INSET * 2, ts - BLOCKER_INSET * 2);
    this.scene.physics.add.existing(zone, true);
    this.blockers.add(zone);
    this.addSmoke(x, y - 1);
  }

  /** Smoke drifts over the tile above a new fire, up to SMOKE_CAP puffs. */
  addSmoke(x, y) {
    if (this.smoke.length >= SMOKE_CAP || y < 0) return;
    const s = this.scene.add.sprite(x * this.ts + this.ts / 2, y * this.ts + this.ts / 2, SMOKE_TEXTURE, 0);
    s.setDepth(SMOKE_DEPTH).setAlpha(0.8);
    s.play({ key: SMOKE_ANIM, startFrame: (x + y) % 2 });
    // Slow whole-pixel drift up and back, staggered by tile so it doesn't pulse in unison.
    this.scene.tweens.add({
      targets: s,
      y: s.y - 3,
      alpha: 0.55,
      duration: 1600,
      delay: ((x * 7 + y * 3) % 8) * 150,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        s.y = Math.round(s.y);
      },
    });
    this.smoke.push(s);
  }

  /** True if the rectangle (the player's feet box) overlaps a burning tile or an active flare. */
  isDeadly(rect) {
    const ts = this.ts;
    const x0 = Math.floor(rect.x / ts);
    const x1 = Math.floor((rect.x + rect.width) / ts);
    const y0 = Math.floor(rect.y / ts);
    const y1 = Math.floor((rect.y + rect.height) / ts);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const hot = this.burning.has(key(tx, ty)) || this.flares.some((f) => f.on && f.x === tx && f.y === ty);
        if (!hot) continue;
        const fire = new Phaser.Geom.Rectangle(
          tx * ts + DEADLY_INSET,
          ty * ts + DEADLY_INSET,
          ts - DEADLY_INSET * 2,
          ts - DEADLY_INSET * 2,
        );
        if (Phaser.Geom.Intersects.RectangleToRectangle(rect, fire)) return true;
      }
    }
    return false;
  }

  snapshot() {
    return { fireTime: this.fireTime, spreadIndex: this.spreadIndex };
  }

  /** Back to the moment the escape started: same burning tiles, flares and closing timer restarted. */
  restore(snap) {
    for (const s of this.burning.values()) s?.destroy();
    this.burning.clear();
    this.blockers.clear(true, true);
    for (const s of this.smoke) {
      this.scene.tweens.killTweensOf(s);
      s.destroy();
    }
    this.smoke = [];
    for (const f of this.flares) {
      f.sprite?.destroy();
      f.sprite = null;
      f.on = false;
    }
    this.active = true;
    this.fireTime = snap.fireTime;
    this.spreadIndex = snap.spreadIndex;
    for (let i = 0; i < snap.spreadIndex; i++) this.burn(this.order[i].x, this.order[i].y);
    this.closeIndex = 0;
    this.startEscape();
  }

  get counts() {
    return { fire: this.fireSpriteCount(), smoke: this.smoke.length };
  }
}
