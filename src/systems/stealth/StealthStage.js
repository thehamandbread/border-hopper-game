import { standingFrame } from '../../objects/walkAnims.js';
import SightGrid from './SightGrid.js';
import StealthEngine from './StealthEngine.js';
import StealthRenderer from './StealthRenderer.js';

const TS = 16;
const GUARD_BODY = { w: 10, h: 6 };      // like Mateo's feet box
const CAMERA_DEPTH = 2;                  // on the wall, over the wall tiles
const CAMERA_FRAME = { LEFT: 0, CENTER: 1, RIGHT: 2 };
const ICON_ABOVE_HEAD = 28;              // px above the guard's feet

const dirOf = (deg) => {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 315 || d < 45) return 'right';
  if (d < 135) return 'down';
  if (d < 225) return 'left';
  return 'up';
};

/**
 * Everything a stealth area needs in a Phaser scene, shared by the alley and the dev sandbox: the sight
 * grid (map tiles plus cover), the engine with one guard and one wall camera, the cover images and
 * their colliders, the guard's sprite (walking or standing, solid for Mateo when guardSolid), the
 * camera's sprite (aimed left, center or right), and the StealthRenderer.
 *
 * def: {
 *   map        map JSON (tileset.blocking / tileset.blocksSight, see SightGrid.fromMap)
 *   config     stealth_config.json
 *   cover      [{ key, frame?, x, y, w, h, dy }]: image key, footprint in tiles, and how far below the
 *              footprint's bottom edge the image's bottom sits (images use origin (0.5, 1))
 *   guardRoute [[tileX, tileY], [tileX, tileY]] (tile centres)
 *   camera     { tileX, tileY, mountDeg }: mounted on a wall's upper tile; it casts from the floor
 *              just below the two-tile wall, and its cone is drawn from the lens
 *   guardSolid true: Mateo can't walk through the guard
 * }
 * update(deltaMs, { frozen, step }) runs the engine (unless frozen), then syncs the sprites and redraws.
 */
export default class StealthStage {
  constructor(scene, player, def) {
    this.scene = scene;
    this.player = player;
    this.config = def.config;
    this.grid = SightGrid.fromMap(def.map);
    this.coverRects = [];
    for (const c of def.cover) this.addCover(c);

    this.engine = new StealthEngine(this.config, this.grid);
    const centre = ([x, y]) => ({ x: x * TS + TS / 2, y: y * TS + TS / 2 });
    this.guardSource = this.engine.addGuard({ id: 'guard', route: def.guardRoute.map(centre) });
    const cam = def.camera;
    const camX = cam.tileX * TS + TS / 2;
    this.cameraSource = this.engine.addCamera({ id: 'camera', x: camX, y: (cam.tileY + 2) * TS + 0.5, mountDeg: cam.mountDeg });
    this.cameraSprite = scene.add.sprite(cam.tileX * TS, cam.tileY * TS, 'wall_camera', CAMERA_FRAME.CENTER)
      .setOrigin(0, 0).setDepth(CAMERA_DEPTH);

    this.guard = scene.add.sprite(0, 0, 'guard_walk', 0).setOrigin(0.5, 1);
    this.guardLast = { x: this.guardSource.x, y: this.guardSource.y };
    if (def.guardSolid) {
      this.guardBody = scene.add.zone(0, 0, GUARD_BODY.w, GUARD_BODY.h);
      scene.physics.add.existing(this.guardBody);
      this.guardBody.body.setImmovable(true).setAllowGravity(false);
      this.guardBody.body.pushable = false;
      scene.physics.add.collider(player, this.guardBody);
    }

    this.renderer = new StealthRenderer(scene, this.engine, {
      anchors: {
        guard: { icon: (out) => this.atGuardHead(out) },
        camera: {
          icon: (out) => ((out.x = camX), (out.y = cam.tileY * TS + 2), out),
          apex: { x: camX, y: cam.tileY * TS + 10 },
        },
      },
    });
    this.spottedLog = [];
    this.engine.on('spotted', (e) => this.spottedLog.push({ ...e, t: Math.round(scene.time.now) }));
    this.perf = { stealthMs: 0, frameMs: 0 };
    this.syncGuard(0);
  }

  /** A cover piece: blocks sight (grid) and movement (a static body); the image stands on its footprint. */
  addCover(c) {
    this.grid.addSolid(c.x, c.y, c.w, c.h);
    const cx = (c.x + c.w / 2) * TS;
    const bottom = (c.y + c.h) * TS;
    this.scene.add.image(cx, bottom + c.dy, c.key, c.frame).setOrigin(0.5, 1).setDepth(bottom);
    const zone = this.scene.add.zone(cx, bottom - (c.h * TS) / 2, c.w * TS, c.h * TS);
    this.scene.physics.add.existing(zone, true);
    this.scene.physics.add.collider(this.player, zone);
    this.coverRects.push({ x: c.x * TS, y: c.y * TS, w: c.w * TS, h: c.h * TS });
  }

  /** Hides the cones, the "?" icons and the noise ring (e.g. once the stealth is over). */
  hide() {
    this.renderer.setVisible(false);
  }

  /** Distance (px) from a point to the nearest cover footprint. */
  distanceToCover(x, y) {
    let best = Infinity;
    for (const r of this.coverRects) {
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
      const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
      best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
  }

  guardOverlapsPlayer() {
    const g = this.guardSource;
    const b = this.player.body;
    return Math.abs(g.x - b.center.x) < (GUARD_BODY.w + b.width) / 2 && Math.abs(g.y - b.center.y) < (GUARD_BODY.h + b.height) / 2;
  }

  /** What the watchers look at: Mateo's body centre, and whether he's moving or sprinting. */
  target() {
    const c = this.player.body.center;
    return { x: c.x, y: c.y, moving: this.player.body.speed > 0, sprinting: this.player.sprinting };
  }

  atGuardHead(out) {
    out.x = Math.round(this.guard.x);
    out.y = Math.round(this.guard.y) - ICON_ABOVE_HEAD;
    return out;
  }

  /** The guard sprite (and body) follow the engine's guard: walking while he moves, standing otherwise. */
  syncGuard(dtMs) {
    const g = this.guardSource;
    const moved = Math.hypot(g.x - this.guardLast.x, g.y - this.guardLast.y);
    this.guardLast.x = g.x;
    this.guardLast.y = g.y;
    const dir = dirOf(g.facingDeg);
    this.guard.setPosition(g.x, g.y + 3).setDepth(g.y + 3);
    if (dtMs > 0 && moved > 1e-3) {
      this.guard.anims.play(`guard-walk-${dir}`, true);
    } else {
      this.guard.anims.stop();
      this.guard.setFrame(standingFrame(dir));
    }
    this.guardBody?.body.reset(g.x, g.y);
  }

  /** One engine step, with the solid guard kept out of Mateo. */
  stepEngine(deltaMs) {
    const g = this.guardSource;
    const x0 = g.x;
    const y0 = g.y;
    this.engine.update(deltaMs, this.target());
    // A solid guard can't walk into Mateo either: he stays put (facing where he was going) until
    // Mateo moves (the engine moves him, so the physics collider alone would let him pass through).
    if (this.guardBody && this.guardOverlapsPlayer()) {
      g.x = x0;
      g.y = y0;
    }
  }

  /** frozen: skip the step. step: replaces the engine step (e.g. a scene's encounter logic driving it). */
  update(deltaMs, { frozen = false, step } = {}) {
    const start = performance.now();
    if (!frozen) (step ?? ((ms) => this.stepEngine(ms)))(deltaMs);
    this.syncGuard(deltaMs);
    const f = ((this.cameraSource.facingDeg % 360) + 360) % 360;
    this.cameraSprite.setFrame(f < 75 || f > 285 ? CAMERA_FRAME.RIGHT : f > 105 ? CAMERA_FRAME.LEFT : CAMERA_FRAME.CENTER);
    this.renderer.update(this.player);
    const ms = performance.now() - start;
    this.perf.stealthMs = this.perf.stealthMs * 0.95 + ms * 0.05;
    this.perf.frameMs = this.perf.frameMs * 0.95 + deltaMs * 0.05;
  }

  /**
   * window.__stealthDebug (dev builds only): read-only getters returning fresh copies, for Playwright
   * and the F1 panel. extra: more getters (e.g. the alley's own state).
   */
  installDebug(extra = {}) {
    if (!import.meta.env.DEV) return;
    const stage = this;
    const debug = Object.create(null);
    Object.defineProperties(debug, {
      scene: { get: () => stage.scene },
      stage: { get: () => stage },
      sources: { get: () => stage.engine.snapshot().sources },
      player: {
        get: () => {
          const c = stage.player.body.center;
          return { x: c.x, y: c.y, feetY: stage.player.y, sprinting: stage.player.sprinting, speed: stage.player.body.speed };
        },
      },
      config: { get: () => structuredClone(stage.config) },
      spotted: { get: () => stage.spottedLog.map((e) => ({ ...e })) },
      perf: { get: () => ({ ...stage.perf, fps: stage.scene.game.loop.actualFps }) },
      ...Object.fromEntries(Object.entries(extra).map(([k, fn]) => [k, { get: fn }])),
    });
    Object.freeze(debug);
    window.__stealthDebug = debug;
    this.scene.events.once('shutdown', () => {
      if (window.__stealthDebug === debug) delete window.__stealthDebug;
    });
  }
}
