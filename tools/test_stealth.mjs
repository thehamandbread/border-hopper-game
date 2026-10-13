// Pure-logic test of the stealth engine (src/systems/stealth/), run with
//   npm run test:stealth      (or: node tools/test_stealth.mjs)
// No dependencies and no Phaser: it builds small grids, steps the engine at 60 frames a second with
// the real config (public/assets/data/stealth_config.json), and checks detection, sight, noise, the
// camera sweep and the guard's patrol. Exits 1 on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import SightGrid from '../src/systems/stealth/SightGrid.js';
import StealthEngine from '../src/systems/stealth/StealthEngine.js';
import { castCone, canSee } from '../src/systems/stealth/vision.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'public/assets/data/stealth_config.json'), 'utf8'));
const TS = 16;
const FRAME_MS = 1000 / 60;
const FRAME_S = FRAME_MS / 1000;

let failures = 0;
let checks = 0;
function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? `: ${detail}` : ''}`);
  }
}
const near = (label, actual, expected, tol) =>
  check(label, Math.abs(actual - expected) <= tol, `expected ${expected} ±${tol}, got ${actual}`);

function test(name, fn) {
  const before = failures;
  fn();
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} ${name}`);
}

/** An open grid (w x h tiles) with optional solid cells [[x, y], ...]. */
function grid(w = 30, h = 15, solids = []) {
  const g = new SightGrid(w, h, TS);
  for (const [x, y] of solids) g.addSolid(x, y);
  return g;
}

/** A fixed watcher: a camera that never turns (no sweep), so only detection is under test. */
function fixedEngine(g, { x = 2 * TS + 8, y = 7 * TS + 8, facing = 0, type = 'camera' } = {}) {
  const cfg = structuredClone(CONFIG);
  cfg.camera.sweep = { fromDeg: 0, toDeg: 0, secondsOneWay: 1 };
  cfg.camera.respotCooldownSeconds = 0; // the re-spot cooldown is checked in tools/test_alley.mjs
  const e = new StealthEngine(cfg, g);
  if (type === 'camera') e.addCamera({ id: 'cam', x, y, mountDeg: facing });
  return e;
}

/** Seconds until the source's detection reaches 1 (or limit). */
function timeToFill(e, id, target, limit = 10) {
  let frames = 0;
  while (e.get(id).detection < 1 && frames * FRAME_S < limit) {
    e.update(FRAME_MS, target);
    frames++;
  }
  return frames * FRAME_S;
}

// A stationary guard: a 2-point route with both points the same spot, facing given direction.
function standingGuard(e, x, y, facing = 0) {
  const g = e.addGuard({ id: 'guard', route: [{ x, y }, { x: x + 1e-3, y }] });
  g.restart();
  g.facingDeg = facing;
  g.state = 'pause';
  g.timer = 1e9;
  return g;
}

// ---- (a) fill times ----
test('(a) fill time: 2.0 s at far range, 0.6 s at near range (within 1 frame)', () => {
  const len = CONFIG.camera.cone.lengthTiles * TS;
  let e = fixedEngine(grid());
  const src = e.get('cam');
  near('far fill time', timeToFill(e, 'cam', { x: src.x + len, y: src.y, moving: false }), CONFIG.detection.fillSecondsFar, FRAME_S);
  e = fixedEngine(grid());
  near('near fill time', timeToFill(e, 'cam', { x: src.x, y: src.y, moving: false }), CONFIG.detection.fillSecondsNear, FRAME_S);
  e = fixedEngine(grid());
  const half = timeToFill(e, 'cam', { x: src.x + len / 2, y: src.y, moving: false });
  near('half range is halfway', half, (CONFIG.detection.fillSecondsFar + CONFIG.detection.fillSecondsNear) / 2, FRAME_S);
});

// ---- (b) decay ----
test('(b) decay from 1 to 0 takes 1.5 s', () => {
  const e = fixedEngine(grid());
  const src = e.get('cam');
  timeToFill(e, 'cam', { x: src.x + 3 * TS, y: src.y, moving: false });
  check('full', src.detection === 1);
  let frames = 0;
  const behind = { x: src.x - 3 * TS, y: src.y, moving: false };
  while (src.detection > 0 && frames < 1000) {
    e.update(FRAME_MS, behind);
    frames++;
  }
  near('decay time', frames * FRAME_S, CONFIG.detection.decaySeconds, FRAME_S);
});

// ---- (c) blockers ----
test('(c) a blocker tile between source and target prevents fill', () => {
  const g = grid(30, 15, [[5, 7]]);
  const e = fixedEngine(g);
  const src = e.get('cam');
  const target = { x: src.x + 5 * TS, y: src.y, moving: false };
  check('canSee is false', !canSee(src, target, g));
  for (let i = 0; i < 300; i++) e.update(FRAME_MS, target);
  check('no fill behind cover', src.detection === 0, `detection ${src.detection}`);
  const cone = castCone(src, g, CONFIG.rays);
  const mid = cone[1 + Math.floor(CONFIG.rays / 2)];
  check('the cone stops at the blocker', mid.x <= 5 * TS + 1e-6, `middle ray ends at x ${mid.x}`);
  check('the cone has rays + 1 points', cone.length === CONFIG.rays + 1);
});

// ---- (d) outside the cone angle ----
test('(d) a target outside the cone angle prevents fill', () => {
  const e = fixedEngine(grid());
  const src = e.get('cam');
  const halfWidth = CONFIG.camera.cone.widthDeg / 2;
  const a = ((halfWidth + 5) * Math.PI) / 180;
  const target = { x: src.x + Math.cos(a) * 3 * TS, y: src.y + Math.sin(a) * 3 * TS, moving: false };
  for (let i = 0; i < 300; i++) e.update(FRAME_MS, target);
  check('no fill outside the angle', src.detection === 0, `detection ${src.detection}`);
  const inside = ((halfWidth - 5) * Math.PI) / 180;
  e.update(FRAME_MS, { x: src.x + Math.cos(inside) * 3 * TS, y: src.y + Math.sin(inside) * 3 * TS, moving: false });
  check('fills just inside the angle', src.detection > 0);
});

// ---- (e) noise ----
test('(e) sprinting inside the noise ring fills at the near rate without line of sight; walking does not', () => {
  const ring = CONFIG.noise.sprintRingTiles * TS;
  const make = () => {
    const e = new StealthEngine(CONFIG, grid(30, 15, [[8, 7]]));
    const gd = standingGuard(e, 6 * TS + 8, 7 * TS + 8, 0);   // facing right, a wall right in front
    return { e, gd };
  };
  let { e, gd } = make();
  const behind = { x: gd.x - (ring - 4), y: gd.y, moving: true, sprinting: true };
  check('target is behind him (no line of sight)', !canSee(gd, behind, e.grid));
  const t = timeToFill(e, 'guard', behind);
  near('sprint fill time', t, CONFIG.detection.fillSecondsNear, FRAME_S);
  for (let i = 0; i < 60; i++) e.update(FRAME_MS, behind);   // a full turn takes 1 s at 180 deg/s
  check('he turned toward the noise', Math.abs(Math.abs(gd.facingDeg) - 180) < 1, `facing ${gd.facingDeg}`);
  ({ e, gd } = make());
  const walking = { ...behind, sprinting: false };
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, walking);
  check('walking makes no noise', gd.detection === 0, `detection ${gd.detection}`);
  check('walking: he did not turn', Math.abs(gd.facingDeg) < 1e-6, `facing ${gd.facingDeg}`);
  ({ e, gd } = make());
  const outside = { x: gd.x - (ring + 4), y: gd.y, moving: true, sprinting: true };
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, outside);
  check('sprinting outside the ring is not heard', gd.detection === 0);
  ({ e, gd } = make());
  const still = { ...behind, moving: false };
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, still);
  check('shift held while standing still is silent', gd.detection === 0);
});

// ---- (f) camera sweep ----
test('(f) the camera reaches +45 at 6 s and -45 at 12 s', () => {
  const e = new StealthEngine(CONFIG, grid());
  const cam = e.addCamera({ id: 'cam', x: 100, y: 20, mountDeg: 90 });
  const far = { x: -1000, y: -1000, moving: false };
  near('starts at fromDeg', cam.sweepDeg, CONFIG.camera.sweep.fromDeg, 1e-9);
  const { secondsOneWay, toDeg, fromDeg } = CONFIG.camera.sweep;
  let max = -Infinity;
  for (let i = 0; i < Math.round((secondsOneWay * 1000) / FRAME_MS); i++) {
    e.update(FRAME_MS, far);
    max = Math.max(max, cam.sweepDeg);
  }
  near(`at ${secondsOneWay} s`, cam.sweepDeg, toDeg, 1e-6);
  near('never past toDeg', max, toDeg, 1e-6);
  for (let i = 0; i < Math.round((secondsOneWay * 1000) / FRAME_MS); i++) e.update(FRAME_MS, far);
  near(`at ${secondsOneWay * 2} s`, cam.sweepDeg, fromDeg, 1e-6);
  e.update(3000, far);
  near('reversed again: halfway up at 15 s', cam.sweepDeg, (fromDeg + toDeg) / 2, 1e-6);
});

// ---- (g) patrol ----
test('(g) the guard walks to the route end, pauses 2 s, turns, and walks back', () => {
  const e = new StealthEngine(CONFIG, grid());
  const a = { x: 4 * TS + 8, y: 7 * TS + 8 };
  const b = { x: 12 * TS + 8, y: 7 * TS + 8 };
  const gd = e.addGuard({ id: 'guard', route: [a, b] });
  const far = { x: -1000, y: -1000, moving: false };
  const speed = CONFIG.guard.walkSpeedTilesPerSec * TS;
  check('starts facing the route end', Math.abs(gd.facingDeg) < 1e-6);
  let t = 0;
  let lastX = gd.x;
  let monotonic = true;
  while (gd.state === 'patrol' && t < 30) {
    e.update(FRAME_MS, far);
    t += FRAME_S;
    if (gd.x < lastX) monotonic = false;
    lastX = gd.x;
  }
  check('walks steadily toward the end', monotonic);
  near('arrives on time', t, (b.x - a.x) / speed, FRAME_S);
  check('at the route end', gd.x === b.x && gd.y === b.y);
  let paused = 0;
  while (gd.state === 'pause') {
    e.update(FRAME_MS, far);
    paused += FRAME_S;
    check('faces the way he walked while paused', gd.state !== 'pause' || Math.abs(gd.facingDeg) < 1e-6);
  }
  near('pauses 2 s', paused, CONFIG.guard.patrol.pauseSeconds, FRAME_S);
  let turning = 0;
  while (gd.x === b.x && turning < 5) {
    e.update(FRAME_MS, far);
    turning += FRAME_S;
  }
  near('turns at 180 deg/s (1 s for a full turn)', turning, 180 / CONFIG.guard.patrol.turnRateDegPerSec, 2 * FRAME_S);
  check('faces back the way he came', Math.abs(Math.abs(gd.facingDeg) - 180) < 1e-6, `facing ${gd.facingDeg}`);
  for (let i = 0; i < 30; i++) e.update(FRAME_MS, far);
  check('walks back', gd.x < b.x && gd.state === 'patrol');
});

// ---- (h) spotted ----
test('(h) "spotted" fires once at full, and not again until reset', () => {
  const e = fixedEngine(grid());
  const src = e.get('cam');
  const events = [];
  e.on('spotted', (ev) => events.push(ev));
  const inView = { x: src.x + 2 * TS, y: src.y, moving: false };
  for (let i = 0; i < 600; i++) e.update(FRAME_MS, inView);
  check('fired once', events.length === 1, `fired ${events.length}`);
  check('payload', events[0]?.sourceId === 'cam' && events[0]?.sourceType === 'camera' && events[0]?.targetPos.x === inView.x);
  check('alert state', src.alert === 'spotted');
  // Step out briefly (not all the way to 0) and back in: no second event.
  for (let i = 0; i < 30; i++) e.update(FRAME_MS, { x: src.x - 3 * TS, y: src.y, moving: false });
  check('still latched while above 0', src.spotted && src.detection > 0);
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, inView);
  check('no second event above 0', events.length === 1);
  e.reset();
  check('reset clears', src.detection === 0 && !src.spotted && src.alert === 'none');
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, inView);
  check('fires again after reset', events.length === 2);
  // Drained all the way to 0 also re-arms it.
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, { x: src.x - 3 * TS, y: src.y, moving: false });
  check('drained to 0', src.detection === 0 && !src.spotted);
  for (let i = 0; i < 120; i++) e.update(FRAME_MS, inView);
  check('fires again after draining to 0', events.length === 3);
});

// ---- (i) investigate ----
test('(i) investigate(position) sends the guard there, then back to the route', () => {
  // A dumpster-sized block between him and the spot: he walks around it.
  const g = grid(30, 15, [[8, 8], [9, 8], [8, 9], [9, 9]]);
  const e = new StealthEngine(CONFIG, g);
  const a = { x: 4 * TS + 8, y: 6 * TS + 8 };
  const b = { x: 16 * TS + 8, y: 6 * TS + 8 };
  const gd = e.addGuard({ id: 'guard', route: [a, b] });
  const far = { x: -1000, y: -1000, moving: false };
  for (let i = 0; i < 60; i++) e.update(FRAME_MS, far);
  const spot = { x: 9 * TS + 8, y: 11 * TS + 8 };
  gd.investigate(spot);
  let t = 0;
  let throughWall = false;
  while (!(gd.state === 'investigate' && gd.arrivedAt) && t < 30) {
    e.update(FRAME_MS, far);
    t += FRAME_S;
    if (g.blocks(Math.floor(gd.x / TS), Math.floor(gd.y / TS), 2)) throughWall = true;
  }
  check('reaches the spot', Math.hypot(gd.x - spot.x, gd.y - spot.y) < 1e-6, `at ${gd.x}, ${gd.y}`);
  check('walks around cover, not through it', !throughWall);
  let looked = 0;
  while (gd.state === 'investigate') {
    e.update(FRAME_MS, far);
    looked += FRAME_S;
  }
  near('stands there for investigate.pauseSeconds', looked, CONFIG.guard.investigate.pauseSeconds, FRAME_S);
  check('then returns', gd.state === 'returning');
  while (gd.state === 'returning' && t < 60) {
    e.update(FRAME_MS, far);
    t += FRAME_S;
  }
  check('back on his route', Math.abs(gd.y - a.y) < 1e-6 && gd.x >= a.x && gd.x <= b.x, `at ${gd.x}, ${gd.y}`);
  check('patrolling again', gd.state === 'patrol');
  let reached = false;
  for (let i = 0; i < 60 * 20 && !reached; i++) {
    e.update(FRAME_MS, far);
    reached = gd.state === 'pause';
  }
  check('resumes the route to its end', reached && (gd.x === a.x || gd.x === b.x));
});

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
