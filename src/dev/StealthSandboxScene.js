import Phaser from 'phaser';
import Player from '../objects/Player.js';
import { assetUrl } from '../systems/assetUrl.js';
import StealthStage from '../systems/stealth/StealthStage.js';

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

export default class StealthSandboxScene extends Phaser.Scene {
  constructor() {
    super('StealthSandboxScene');
  }

  preload() {
    // The art is loaded by BootScene.
    // Always fetch the config fresh, so edits apply on refresh (or F2) with no code change.
    this.cache.json.remove('stealth_config');
    this.load.json('stealth_config', `${assetUrl('assets/data/stealth_config.json')}&t=${Date.now()}`);
  }

  create() {
    this.config = this.cache.json.get('stealth_config');

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

    this.stage = new StealthStage(this, this.player, {
      map: MAP, config: this.config, cover: COVER, guardRoute: GUARD_ROUTE, camera: CAMERA,
    });
    this.stage.engine.on('spotted', (e) => console.log(`[stealth] spotted by ${e.sourceId}`)); // eslint-disable-line no-console

    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true);
    this.stage.installDebug();
  }

  update(_time, delta) {
    this.player.update();
    this.player.setDepth(this.player.y);
    this.stage.update(Math.min(delta, MAX_DT_MS));
  }
}
