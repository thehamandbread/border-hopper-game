import Phaser from 'phaser';
import Player from '../objects/Player.js';
import { createWalkAnimations, standingFrame } from '../objects/walkAnims.js';
import { assetUrl } from '../systems/assetUrl.js';
import SightGrid from '../systems/stealth/SightGrid.js';
import StealthEngine from '../systems/stealth/StealthEngine.js';
import StealthRenderer from '../systems/stealth/StealthRenderer.js';

// Dev-only (never shipped: registered by DevMenu.js, which only loads in dev builds). Checkpoint
// "stealth_sandbox": a 28x9 test alley for the stealth engine. A guard patrols the middle, a wall
// camera near the right end sweeps the last stretch, and four pieces of cover (two dumpsters, a
// pallet stack, a parked car) block movement and sight. Numbers come from stealth_config.json, which
// is reloaded on every start (refresh the page or F2 after editing it). window.__stealthDebug is a
// read-only view of the engine for browser tests; the F1 panel shows the same.

const TS = 16;
// alley_tiles.png indexes (tools/art/README.md)
const A = { asphalt: 0, gutter: 2, drain: 3, stains: 4, bu: 5, bl: 6, bpu: 7, bpl: 8, cu: 9, cl: 10, vent: 11, box: 12,
  roof: 13, far: 14, pdt: 15, pdb: 16, ldt: 17, ldb: 18 };
const ROWS = [
  // roof, the back walls (two tiles tall), five rows of alley, the far roofs
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  'bbbbpbbbbbbbbccccvcccPcccbbL',
  'BBBBqBBBBBBBBCCCCCCxCQCCCBBl',
  'aaaaaasaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaasaaaaa',
  'gggggggdgggggggggggggdgggggg',
  'aaaaaaaaaaasaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFF',
];
const KEY = { R: A.roof, b: A.bu, B: A.bl, p: A.bpu, q: A.bpl, c: A.cu, C: A.cl, v: A.vent, x: A.box, P: A.pdt, Q: A.pdb,
  L: A.ldt, l: A.ldb, a: A.asphalt, s: A.stains, g: A.gutter, d: A.drain, F: A.far };
const BLOCKING = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MAP = {
  tileWidth: TS, tileHeight: TS, width: 28, height: 9,
  tileset: { key: 'alley_tiles', blocking: BLOCKING, blocksSight: BLOCKING },
  tiles: ROWS.map((r) => [...r].map((c) => KEY[c])),
};
const START = { tileX: 1, tileY: 5 };
const GUARD_ROUTE = [[7, 5], [18, 5]];          // tile centres, the middle of the alley
const CAMERA = { tileX: 23, tileY: 1, mountDeg: 90 };   // on the phone store's wall, looking down the alley
// Cover: texture, frame, footprint (tiles), and how far below the footprint's bottom edge the image's
// bottom sits (images are drawn with origin (0.5, 1), like the characters).
const COVER = [
  { key: 'dumpster', frame: 0, x: 5, y: 3, w: 2, h: 1, dy: 3 },
  { key: 'pallets', x: 10, y: 6, w: 1, h: 1, dy: 3 },
  { key: 'parked_car', x: 14, y: 7, w: 3, h: 1, dy: 1 },
  { key: 'dumpster', frame: 1, x: 20, y: 6, w: 2, h: 1, dy: 3 },
];
const MAX_DT_MS = 100;

const dirOf = (deg) => {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 315 || d < 45) return 'right';
  if (d < 135) return 'down';
  if (d < 225) return 'left';
  return 'up';
};

export default class StealthSandboxScene extends Phaser.Scene {
  constructor() {
    super('StealthSandboxScene');
  }

  preload() {
    const tile = { frameWidth: 16, frameHeight: 16 };
    this.load.image('alley_tiles', assetUrl('assets/images/alley_tiles.png'));
    this.load.spritesheet('dumpster', assetUrl('assets/images/dumpster.png'), { frameWidth: 32, frameHeight: 32 });
    this.load.image('pallets', assetUrl('assets/images/pallets.png'));
    this.load.image('parked_car', assetUrl('assets/images/parked_car.png'));
    this.load.spritesheet('wall_camera', assetUrl('assets/images/wall_camera.png'), tile);
    this.load.spritesheet('stealth_icons', assetUrl('assets/images/stealth_icons.png'), { frameWidth: 10, frameHeight: 10 });
    this.load.spritesheet('guard_walk', assetUrl('assets/images/guard_walk.png'), { frameWidth: 16, frameHeight: 32 });
    // Always fetch the config fresh, so edits apply on refresh (or F2) with no code change.
    this.cache.json.remove('stealth_config');
    this.load.json('stealth_config', `${assetUrl('assets/data/stealth_config.json')}&t=${Date.now()}`);
  }

  create() {
    this.config = this.cache.json.get('stealth_config');
    createWalkAnimations(this.anims, 'guard_walk', 'guard-walk', 6);

    const map = this.add.tilemap(undefined, TS, TS, MAP.width, MAP.height, MAP.tiles);
    const tileset = map.addTilesetImage('alley_tiles', 'alley_tiles', TS, TS);
    this.ground = map.createLayer(0, tileset, 0, 0);
    this.ground.setCollision(BLOCKING);
    const mapW = MAP.width * TS;
    const mapH = MAP.height * TS;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    this.player = new Player(this, START.tileX * TS + TS / 2, (START.tileY + 1) * TS);
    this.player.facing = 'right';
    this.player.setSprintMultiplier(this.config.player.sprintMultiplier);
    this.physics.add.collider(this.player, this.ground);

    this.grid = SightGrid.fromMap(MAP);
    for (const c of COVER) {
      this.grid.addSolid(c.x, c.y, c.w, c.h);
      const cx = (c.x + c.w / 2) * TS;
      const bottom = (c.y + c.h) * TS;
      this.add.image(cx, bottom + c.dy, c.key, c.frame).setOrigin(0.5, 1).setDepth(bottom);
      const zone = this.add.zone(cx, bottom - (c.h * TS) / 2, c.w * TS, c.h * TS);
      this.physics.add.existing(zone, true);
      this.physics.add.collider(this.player, zone);
    }

    this.engine = new StealthEngine(this.config, this.grid);
    const centre = ([x, y]) => ({ x: x * TS + TS / 2, y: y * TS + TS / 2 });
    this.guardSource = this.engine.addGuard({ id: 'guard', route: GUARD_ROUTE.map(centre) });
    // The camera casts from the floor just below its wall; its cone is drawn from the lens.
    const camX = CAMERA.tileX * TS + TS / 2;
    const floorY = (CAMERA.tileY + 2) * TS + 0.5;
    this.cameraSource = this.engine.addCamera({ id: 'camera', x: camX, y: floorY, mountDeg: CAMERA.mountDeg });
    this.cameraSprite = this.add.sprite(CAMERA.tileX * TS, CAMERA.tileY * TS, 'wall_camera', 1).setOrigin(0, 0).setDepth(2);

    this.guard = this.add.sprite(0, 0, 'guard_walk', 0).setOrigin(0.5, 1);
    this.guardLast = { x: this.guardSource.x, y: this.guardSource.y };
    this.renderer = new StealthRenderer(this, this.engine, {
      anchors: {
        guard: { icon: (out) => this.atGuardHead(out) },
        camera: { icon: (out) => ((out.x = camX), (out.y = CAMERA.tileY * TS + 2), out), apex: { x: camX, y: CAMERA.tileY * TS + 10 } },
      },
    });

    this.spottedLog = [];
    this.engine.on('spotted', (e) => {
      this.spottedLog.push({ ...e, t: Math.round(this.time.now) });
      console.log(`[stealth] spotted by ${e.sourceId}`); // eslint-disable-line no-console
    });

    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true);

    this.perf = { stealthMs: 0, frameMs: 0 };
    this.installDebug();
    this.events.once('shutdown', () => {
      if (window.__stealthDebug?.scene === this) delete window.__stealthDebug;
    });
    this.syncGuard(0);
  }

  /** Where the "?" sits over the guard: just above his head. */
  atGuardHead(out) {
    out.x = Math.round(this.guard.x);
    out.y = Math.round(this.guard.y) - 28;
    return out;
  }

  /** window.__stealthDebug: read-only (getters returning fresh copies) for Playwright and the F1 panel. */
  installDebug() {
    const scene = this;
    const debug = {
      get scene() { return scene; },
      get sources() { return scene.engine.snapshot().sources; },
      get player() {
        const c = scene.player.body.center;
        return { x: c.x, y: c.y, feetY: scene.player.y, sprinting: scene.player.sprinting, speed: scene.player.body.speed };
      },
      get config() { return structuredClone(scene.config); },
      get spotted() { return scene.spottedLog.map((e) => ({ ...e })); },
      get perf() { return { ...scene.perf, fps: scene.game.loop.actualFps }; },
    };
    Object.freeze(debug);
    window.__stealthDebug = debug;
  }

  /** The guard sprite follows the engine's guard: walks while moving, stands (idle frames) otherwise. */
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
  }

  update(_time, delta) {
    const start = performance.now();
    const dt = Math.min(delta, MAX_DT_MS);
    this.player.update();
    this.player.setDepth(this.player.y);
    const c = this.player.body.center;
    const moving = this.player.body.speed > 0;
    this.engine.update(dt, { x: c.x, y: c.y, moving, sprinting: this.player.sprinting });
    this.syncGuard(dt);
    this.cameraSprite.setFrame(this.cameraSource.sweepDeg < -15 ? 2 : this.cameraSource.sweepDeg > 15 ? 0 : 1);
    this.renderer.update(this.player);
    const ms = performance.now() - start;
    this.perf.stealthMs = this.perf.stealthMs * 0.95 + ms * 0.05;
    this.perf.frameMs = this.perf.frameMs * 0.95 + delta * 0.05;
  }
}
