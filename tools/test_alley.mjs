// Pure-logic test of Mission 1's alley (src/systems/AlleyEncounter.js, dialogue m1_alley), run with
//   npm run test:alley      (or: node tools/test_alley.mjs)
// No dependencies and no Phaser: it builds the real alley (alley_map.json, stealth_config.json) in a
// StealthEngine, makes the guard or the camera spot Mateo, plays the guard conversation through
// DialogueRunner picking options by their text, and checks the options, outcomes, Heat, flags and the
// mission log. Exits 1 on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AlleyEncounter from '../src/systems/AlleyEncounter.js';
import DialogueRunner from '../src/systems/DialogueRunner.js';
import GameState from '../src/systems/GameState.js';
import SightGrid from '../src/systems/stealth/SightGrid.js';
import StealthEngine from '../src/systems/stealth/StealthEngine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (path) => JSON.parse(readFileSync(join(ROOT, 'public/assets/data', path), 'utf8'));
const CONFIG = json('stealth_config.json');
const MAP = json('alley_map.json');
const DIALOGUE = json('dialogue/m1_alley.json');
const TS = 16;
const FRAME_MS = 1000 / 60;
const FAR = { x: -1000, y: -1000, moving: false };

let failures = 0;
let checks = 0;
function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? `: ${detail}` : ''}`);
  }
}
const eq = (label, actual, expected) =>
  check(label, JSON.stringify(actual) === JSON.stringify(expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

async function test(name, fn) {
  const before = failures;
  await fn();
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} ${name}`);
}

/** A fresh alley: GameState with the booth answers given, the engine as the scene builds it. */
function alley(answers = {}) {
  const state = new GameState();
  for (const [k, v] of Object.entries(answers)) state.setAnswer(k, v);
  const grid = SightGrid.fromMap(MAP);
  for (const c of MAP.cover) grid.addSolid(c.x, c.y, c.w, c.h);
  const engine = new StealthEngine(CONFIG, grid);
  const centre = ([x, y]) => ({ x: x * TS + TS / 2, y: y * TS + TS / 2 });
  engine.addGuard({ id: 'guard', route: MAP.guardRoute.map(centre) });
  const c = MAP.camera;
  engine.addCamera({ id: 'camera', x: c.tileX * TS + TS / 2, y: (c.tileY + 2) * TS + 0.5, mountDeg: c.mountDeg });
  const enc = new AlleyEncounter({ state, engine });
  enc.begin();
  return { state, engine, enc, guard: engine.get('guard'), camera: engine.get('camera') };
}

/** Mateo standing right in front of the guard (a tile and a half ahead, where he's looking). */
function inFrontOfGuard(guard) {
  const a = (guard.facingDeg * Math.PI) / 180;
  return { x: guard.x + Math.cos(a) * 24, y: guard.y + Math.sin(a) * 24, moving: false };
}

/** Runs frames until the guard spots Mateo standing in front of him; returns the start node it asked for. */
function spotByGuard(a) {
  let node = null;
  a.enc.once('confront', (n) => (node = n));
  const target = inFrontOfGuard(a.guard);
  for (let i = 0; i < 600 && !node; i++) a.enc.update(FRAME_MS, target);
  return { node, target };
}

/**
 * Plays the guard conversation from `startNode`: advances lines, lets the guard walk over (stepping
 * the encounter until he arrives), and picks `pick` (option text) at the choice. Returns what was
 * shown: lines, the options offered, and whether a choice came up.
 */
async function converse(a, startNode, pick, target) {
  const runner = a.enc.attach(new DialogueRunner(DIALOGUE, a.state));
  const shown = { lines: [], options: null };
  let pending = null;
  runner.on('line', (n) => {
    shown.lines.push(n.text);
    pending = 'line';
  });
  runner.on('choice', (n) => {
    shown.options = n.options.map((o) => o.text);
    pending = 'choice';
  });
  runner.on('event', (name, _data, node) => {
    const done = a.enc.handleEvent(name);
    if (node.wait) {
      pending = 'wait';
      Promise.resolve(done).then(() => runner.resume());
    }
  });
  runner.start(startNode);
  for (let n = 0; !runner.ended && n < 200; n++) {
    const what = pending;
    pending = null;
    if (what === 'line') runner.advance();
    else if (what === 'choice') {
      const i = runner.options.findIndex((o) => o.text === pick);
      check(`"${pick}" offered`, i !== -1, JSON.stringify(shown.options));
      if (i === -1) break;
      runner.choose(i);
    } else if (what === 'wait') {
      for (let i = 0; i < 5000 && a.enc.mode === 'approach'; i++) a.enc.update(FRAME_MS, target); // he walks over
      await new Promise((r) => setTimeout(r, 0)); // the arrival resumes the conversation
    } else break;
  }
  check('conversation ended', runner.ended);
  return shown;
}

const ALWAYS = ['Just walking.', '(Say nothing.)'];
const OPTION = {
  fourth: 'My tía lives on Fourth. I\'m cutting through.',
  downtown: 'Visiting my tía. I got turned around.',
  clinic: 'I\'m looking for a clinic. I think I\'m lost.',
  bus: 'Shortcut to the bus stop.',
  laundromat: 'I\'m dropping something at the laundromat.',
};

await test('(a) the options follow the cover story and detail; always-offered last', async () => {
  const cases = [
    [{ cover_story: 'family', cover_detail: 'tia', booth_address: 'fourth_street' }, [OPTION.fourth]],
    [{ cover_story: 'family', cover_detail: 'tia', booth_address: 'downtown' }, [OPTION.downtown]],
    [{ cover_story: 'family', cover_detail: 'tia' }, [OPTION.fourth]],          // "I'd have to check my phone.": no address
    [{ cover_story: 'family', cover_detail: 'friend' }, [OPTION.fourth]],       // "A friend.": no address asked
    [{ cover_story: 'doctor', cover_detail: 'dentist' }, [OPTION.clinic]],
    [{ cover_story: 'doctor', cover_detail: 'prescription' }, [OPTION.clinic]],
    [{ cover_story: 'shopping', cover_detail: 'shoes' }, [OPTION.bus]],
    [{ cover_story: 'dropoff', cover_detail: 'letter' }, [OPTION.laundromat]],
    [{}, []],                                                                    // nothing on record
  ];
  for (const [answers, matched] of cases) {
    const a = alley(answers);
    const { node, target } = spotByGuard(a);
    eq(`spotted: start node (${JSON.stringify(answers)})`, node, 'hey');
    const shown = await converse(a, node, ALWAYS[0], target);
    eq(`options for ${JSON.stringify(answers)}`, shown.options, [...matched, ...ALWAYS]);
    check('he opens with the script line', shown.lines.includes('Hey. What are you doing back here?'));
  }
});

await test('(b) the clinic option plays "Clinic\'s two blocks that way." first, then passes', async () => {
  const a = alley({ cover_story: 'doctor', cover_detail: 'checkup' });
  const { node, target } = spotByGuard(a);
  const shown = await converse(a, node, OPTION.clinic, target);
  const i = shown.lines.indexOf("Clinic's two blocks that way.");
  check('the clinic line', i !== -1);
  check('then the pass line', i !== -1 && shown.lines[i + 1] === 'Use the street next time.', JSON.stringify(shown.lines));
  eq('passed_guard', a.state.getFlag('passed_guard'), true);
  eq('no Heat', a.state.getMeter('heat'), 0);
  eq('stealth resumes', a.enc.mode, 'stealth');
  eq('detection back to 0', a.guard.detection, 0);
  eq('he heads back to his route', a.guard.state, 'returning');
  // He doesn't see Mateo while he's walking back, and patrols (and watches) again once there.
  for (let i = 0; i < 60 * 10 && a.guard.state !== 'patrol'; i++) a.enc.update(FRAME_MS, target);
  eq('back on his route', a.guard.state, 'patrol');
  a.enc.update(FRAME_MS, FAR);
  eq('he watches again', a.guard.blind, false);
  // The other passing options pass too.
  for (const [answers, pick] of [
    [{ cover_story: 'family', booth_address: 'fourth_street' }, OPTION.fourth],
    [{ cover_story: 'family', booth_address: 'downtown' }, OPTION.downtown],
    [{ cover_story: 'shopping' }, OPTION.bus],
  ]) {
    const b = alley(answers);
    const s = spotByGuard(b);
    const shown2 = await converse(b, s.node, pick, s.target);
    check(`"${pick}" passes`, b.state.getFlag('passed_guard') === true && shown2.lines.includes('Use the street next time.'));
    check(`"${pick}": no clinic line`, !shown2.lines.includes("Clinic's two blocks that way."));
  }
});

await test('(c) the drop-off option fails ("They\'re closed.")', async () => {
  const a = alley({ cover_story: 'dropoff', cover_detail: 'letter' });
  let failed = false;
  a.enc.on('fail', () => (failed = true));
  const { node, target } = spotByGuard(a);
  const shown = await converse(a, node, OPTION.laundromat, target);
  const i = shown.lines.indexOf("They're closed.");
  check('"They\'re closed."', i !== -1);
  check('then the fail line', shown.lines[i + 1] === 'Out. Come on.', JSON.stringify(shown.lines));
  check('the fail path', failed && a.enc.mode === 'escort');
  eq('passed_guard stays false', a.state.getFlag('passed_guard'), false);
});

await test('(d) a fail adds Heat +1; the restart resets passed_guard and the alley', async () => {
  for (const pick of ALWAYS) {
    const a = alley({ cover_story: 'family', booth_address: 'fourth_street' });
    a.state.setFlag('card_flagged', true); // other flags are kept
    const { node, target } = spotByGuard(a);
    await converse(a, node, pick, target);
    eq(`"${pick}": Heat +1`, a.state.getMeter('heat'), 1);
    eq('escort', a.enc.mode, 'escort');
    for (let i = 0; i < 600; i++) a.enc.update(FRAME_MS, target);
    check('he walks Mateo to the left end', a.guard.x < 3 * TS, `guard at x ${a.guard.x}`);
    a.state.setFlag('alley_camera_heat', true);
    a.enc.restart();
    eq('attempt 2', a.state.getFlag('alley_attempt'), 2);
    eq('passed_guard reset', a.state.getFlag('passed_guard'), false);
    eq('camera heat reset', a.state.getFlag('alley_camera_heat'), false);
    eq('detection reset', [a.guard.detection, a.camera.detection], [0, 0]);
    eq('guard back at the start of his route', [a.guard.x, a.guard.state], [MAP.guardRoute[0][0] * TS + 8, 'patrol']);
    eq('Heat kept', a.state.getMeter('heat'), 1);
    eq('cover story kept', a.state.getAnswer('cover_story'), 'family');
    eq('other flags kept', a.state.getFlag('card_flagged'), true);
  }
});

await test('(e) spotted again after passing: no choice, the fail line, the fail path', async () => {
  const a = alley({ cover_story: 'shopping', cover_detail: 'shoes' });
  let s = spotByGuard(a);
  await converse(a, s.node, OPTION.bus, s.target);
  eq('passed', a.state.getFlag('passed_guard'), true);
  for (let i = 0; i < 60 * 10 && a.guard.state !== 'patrol'; i++) a.enc.update(FRAME_MS, FAR);
  s = spotByGuard(a);
  eq('start node', s.node, 'again');
  const shown = await converse(a, s.node, null, s.target);
  eq('no choice', shown.options, null);
  eq('only the fail line and its narration', shown.lines, ['Out. Come on.', "He walks Mateo to the end of the alley and waits there until he's gone."]);
  eq('Heat +1', a.state.getMeter('heat'), 1);
  eq('escort', a.enc.mode, 'escort');
  const heat = a.state.mission.log.filter((e) => e.type === 'heat');
  eq('logged as spotted again', heat.at(-1)?.answer_id, 'spotted_again');
});

/** Mateo standing where the camera is looking right now. */
function inCameraView(cam) {
  const a = (cam.facingDeg * Math.PI) / 180;
  return { x: cam.x + Math.cos(a) * 40, y: cam.y + Math.sin(a) * 40, moving: false };
}

await test('(f) the camera: Heat once per attempt, the guard investigates, the re-spot cooldown', async () => {
  const a = alley({ cover_story: 'family' });
  const spots = [];
  a.engine.on('spotted', (e) => spots.push({ ...e, t: a.t }));
  a.t = 0;
  const step = (target) => {
    a.enc.update(FRAME_MS, target);
    a.t += FRAME_MS / 1000;
  };
  // Stand still in the camera's cone until it spots him.
  let target = inCameraView(a.camera);
  for (let i = 0; i < 600 && !spots.length; i++) {
    target = inCameraView(a.camera); // keep up with its sweep
    step(target);
  }
  eq('the camera spotted him', spots.map((s) => s.sourceId), ['camera']);
  eq('Heat +1', a.state.getMeter('heat'), 1);
  eq('camera heat flag', a.state.getFlag('alley_camera_heat'), true);
  eq('no confrontation', a.enc.mode, 'stealth');
  eq('the guard goes to look', a.guard.state, 'investigate');
  const spotPos = { ...spots[0].targetPos };
  const firstPath = a.guard.path.at(-1);
  check('to the spot', firstPath && Math.hypot(firstPath.x - spotPos.x, firstPath.y - spotPos.y) < TS, JSON.stringify(firstPath));
  // Keep standing in view (out of the guard's way): no second report within the cooldown.
  const hide = { x: 26 * TS + 8, y: 4 * TS + 8, moving: false }; // behind the blue dumpster: never seen
  const t0 = a.t;
  while (a.t - t0 < CONFIG.camera.respotCooldownSeconds - 0.2) step(inCameraView(a.camera));
  eq('no re-spot during the cooldown', spots.length, 1);
  // Hide until his detection is back to 0, then get spotted again after the cooldown: no more Heat,
  // and the guard (still investigating, or not) isn't sent again while he's investigating.
  for (let i = 0; i < 200; i++) step(hide);
  const investigatingBefore = a.guard.state === 'investigate';
  const pathBefore = a.guard.path.slice();
  for (let i = 0; i < 600 && spots.length < 2; i++) step(inCameraView(a.camera));
  eq('re-spotted after the cooldown', spots.length, 2);
  check('the cooldown held between spots', spots[1].t - spots[0].t >= CONFIG.camera.respotCooldownSeconds);
  eq('no more Heat this attempt', a.state.getMeter('heat'), 1);
  if (investigatingBefore) eq('not re-sent while investigating', a.guard.path.at(-1), pathBefore.at(-1));
  // The guard finishes, goes back to his route.
  for (let i = 0; i < 60 * 30 && a.guard.state !== 'patrol'; i++) step(hide);
  eq('he returns to his route', a.guard.state, 'patrol');
  // A new attempt: Heat again on the first camera spot.
  a.enc.restart();
  spots.length = 0;
  for (let i = 0; i < 600 && !spots.length; i++) step(inCameraView(a.camera));
  eq('next attempt: Heat again', a.state.getMeter('heat'), 2);
});

await test('(g) the mission log: spots, Heat, and the guard answer', async () => {
  const a = alley({ cover_story: 'dropoff', cover_detail: 'letter' });
  const { node, target } = spotByGuard(a);
  await converse(a, node, OPTION.laundromat, target);
  a.enc.restart();
  for (let i = 0; i < 600 && a.state.getMeter('heat') < 2; i++) a.enc.update(FRAME_MS, inCameraView(a.camera));
  const log = a.state.mission.log.map((e) => ({ ...e }));
  eq('entries', log, [
    { encounter: 'alley', type: 'spotted', source: 'guard' },
    { encounter: 'alley', question_id: 'guard', answer_id: 'laundromat' },
    { type: 'heat', encounter: 'alley', question_id: 'guard', answer_id: 'laundromat', delta: 1 },
    { encounter: 'alley', type: 'spotted', source: 'camera' },
    { type: 'heat', encounter: 'alley', question_id: 'camera', answer_id: 'spotted', delta: 1 },
  ]);
});

await test('the camera can be passed: a spot behind the blue dumpster it never sees', async () => {
  const a = alley({});
  const hide = { x: 25 * TS + 8, y: 4 * TS + 8, moving: false };
  let max = 0;
  for (let i = 0; i < 60 * 24; i++) {
    a.engine.update(FRAME_MS, hide);
    max = Math.max(max, a.camera.detection);
  }
  eq('never seen there over two full sweeps', max, 0);
});

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
