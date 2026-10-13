import { castCone } from './vision.js';

// Cone colours by alert state; the cone is a low-alpha fill on the ground.
const CONE_COLOR = { none: 0xf2e6b0, suspicious: 0xf4c442, spotted: 0xe2483a };
const CONE_ALPHA = 0.2;
const CONE_DEPTH = 1;              // above the floor (tile layer, depth 0), below props and characters (depth = feet y)
const ICON_DEPTH = 10000;          // over everything in the world
const ICON = 10;                   // stealth_icons.png frame size
const FRAME = { EMPTY: 0, FILLED: 1, BANG: 2 };
const NOISE_COLOR = 0xe8e4d8;
const NOISE_ALPHA = 0.35;

/**
 * Draws a StealthEngine in a Phaser scene:
 *  - each source's vision cone: one Graphics per source, the castCone polygon refilled each frame;
 *    when there are more sources than render.maxConesPerFrame, they take turns being redrawn;
 *  - the "?" over each watcher: stealth_icons.png frame 0, with frame 1 on top cropped to the bottom
 *    `detection` part of its height; "!" (frame 2) once spotted;
 *  - Mateo's noise ring, only while he's sprinting.
 * anchors: { [sourceId]: { icon: (out) => out, apex?: { x, y } } }: icon writes where the icon sits
 * (its bottom centre) into out and returns it; apex, optionally, is where the cone is drawn from (e.g.
 * a wall camera's lens, which sits in the wall above the floor point the engine casts from).
 */
export default class StealthRenderer {
  constructor(scene, engine, { anchors = {}, iconTexture = 'stealth_icons' } = {}) {
    this.scene = scene;
    this.engine = engine;
    this.rays = engine.config.rays ?? 24;
    this.maxPerFrame = engine.config.render?.maxConesPerFrame ?? 2;
    this.next = 0;
    this.views = engine.sources.map((source) => {
      const a = anchors[source.id] ?? {};
      const gfx = scene.add.graphics().setDepth(CONE_DEPTH);
      const empty = scene.add.image(0, 0, iconTexture, FRAME.EMPTY).setOrigin(0.5, 1).setDepth(ICON_DEPTH).setVisible(false);
      const filled = scene.add.image(0, 0, iconTexture, FRAME.FILLED).setOrigin(0.5, 1).setDepth(ICON_DEPTH + 1).setVisible(false);
      return { source, gfx, empty, filled, points: [], icon: a.icon, pos: { x: 0, y: 0 }, apex: a.apex, bang: false };
    });
    this.noise = scene.add.graphics().setDepth(CONE_DEPTH);
    this.noiseRadius = engine.sprintRing;
  }

  /** player: the Player sprite (sprinting, body.center). */
  update(player) {
    const n = this.views.length;
    const count = Math.min(n, this.maxPerFrame);
    for (let i = 0; i < count; i++) this.drawCone(this.views[(this.next + i) % n]);
    this.next = n ? (this.next + count) % n : 0;
    for (const v of this.views) this.drawIcon(v);

    this.noise.clear();
    if (player.sprinting && this.noiseRadius > 0) {
      const c = player.body.center;
      this.noise.lineStyle(1, NOISE_COLOR, NOISE_ALPHA);
      this.noise.strokeCircle(c.x, c.y, this.noiseRadius);
    }
  }

  drawCone(v) {
    const pts = castCone(v.source, this.engine.grid, this.rays, v.points);
    if (v.apex) {
      pts[0].x = v.apex.x;
      pts[0].y = v.apex.y;
    }
    v.gfx.clear();
    v.gfx.fillStyle(CONE_COLOR[v.source.alert] ?? CONE_COLOR.none, CONE_ALPHA);
    v.gfx.fillPoints(pts, true);
  }

  drawIcon(v) {
    const { detection, alert } = v.source;
    const show = detection > 0 || alert === 'spotted';
    v.empty.setVisible(show);
    v.filled.setVisible(show);
    if (!show || !v.icon) return;
    const p = v.icon(v.pos);
    v.empty.setPosition(p.x, p.y);
    v.filled.setPosition(p.x, p.y);
    if (alert === 'spotted') {
      v.empty.setVisible(false);
      if (!v.bang) v.filled.setFrame(FRAME.BANG).setCrop();
      v.bang = true;
      return;
    }
    if (v.bang) v.filled.setFrame(FRAME.FILLED);
    v.bang = false;
    // Fill from the bottom up: show the bottom `h` rows of the filled "?" over the empty one.
    const h = Math.round(detection * ICON);
    v.filled.setCrop(0, ICON - h, ICON, h);
  }

  destroy() {
    for (const v of this.views) {
      v.gfx.destroy();
      v.empty.destroy();
      v.filled.destroy();
    }
    this.noise.destroy();
  }
}
