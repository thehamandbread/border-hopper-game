// Pure-logic test of Mission 1's end-of-mission summary (src/systems/missionSummary.js), run with
//   npm run test:summary      (or: node tools/test_summary.mjs)
// No dependencies and no Phaser. Mission logs come from playing the real conversations (m1_booth,
// m1_secondary) through DialogueRunner and the real alley (AlleyEncounter on the alley map), so the
// entries are exactly what a run writes. Exits 1 on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AlleyEncounter from '../src/systems/AlleyEncounter.js';
import DialogueRunner from '../src/systems/DialogueRunner.js';
import GameState from '../src/systems/GameState.js';
import { buildMissionSummary, resolveAnswer, signed, summaryDialogues } from '../src/systems/missionSummary.js';
import { resolveDialogue } from '../src/systems/dialogueData.js';
import SightGrid from '../src/systems/stealth/SightGrid.js';
import StealthEngine from '../src/systems/stealth/StealthEngine.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (path) => JSON.parse(readFileSync(join(ROOT, 'public/assets/data', path), 'utf8'));
const DIALOGUE = Object.fromEntries(['m1_booth', 'm1_secondary'].map((id) => [id, json(`dialogue/${id}.json`)]));
const DIALOGUES = { booth: DIALOGUE.m1_booth, secondary: DIALOGUE.m1_secondary };
const TIMEOUT = Symbol('timeout');
const FRAME_MS = 1000 / 60;

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
function test(name, fn) {
  const before = failures;
  fn();
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} ${name}`);
}

/** Plays a conversation, advancing lines and resuming waits, picking options by text (TIMEOUT runs the timer out). */
function play(id, state, picks) {
  const runner = new DialogueRunner(DIALOGUE[id], state);
  let pending = null;
  runner.on('line', () => (pending = 'line'));
  runner.on('choice', () => (pending = 'choice'));
  runner.on('waiting', () => (pending = 'wait'));
  runner.start();
  const queue = [...picks];
  while (!runner.ended) {
    const what = pending;
    pending = null;
    if (what === 'line') runner.advance();
    else if (what === 'wait') runner.resume();
    else if (what === 'choice') {
      const want = queue.shift();
      if (want === TIMEOUT) {
        runner.timeout();
        continue;
      }
      const i = runner.options.findIndex((o) => o.text === want);
      check(`${id}: "${String(want)}" offered`, i !== -1, JSON.stringify(runner.options.map((o) => o.text)));
      if (i === -1) return;
      runner.choose(i);
    } else {
      check(`${id}: keeps going`, false, 'stalled');
      return;
    }
  }
  eq(`${id}: every pick used`, queue.length, 0);
}

function newState() {
  const s = new GameState();
  s.setEncounterConfig(json('encounter_config.json'));
  s.giveItem('envelope');
  return s;
}

/** The alley on the real map: returns helpers to get spotted by the guard (and answer) or the camera. */
function alley(state) {
  const map = json('alley_map.json');
  const grid = SightGrid.fromMap(map);
  for (const c of map.cover) grid.addSolid(c.x, c.y, c.w, c.h);
  const engine = new StealthEngine(json('stealth_config.json'), grid);
  engine.addGuard({ id: 'guard', route: map.guardRoute.map(([x, y]) => ({ x: x * 16 + 8, y: y * 16 + 8 })) });
  engine.addCamera({ id: 'camera', x: map.camera.tileX * 16 + 8, y: (map.camera.tileY + 2) * 16 + 0.5, mountDeg: map.camera.mountDeg });
  const enc = new AlleyEncounter({ state, engine });
  enc.begin();
  const guard = engine.get('guard');
  const camera = engine.get('camera');
  const ahead = (src, d) => ({ x: src.x + Math.cos((src.facingDeg * Math.PI) / 180) * d, y: src.y + Math.sin((src.facingDeg * Math.PI) / 180) * d, moving: false });
  return {
    /** Spotted by the guard; the conversation answers `pick`'s option id (its events run in order). */
    guardSpots(answerId) {
      let node = null;
      enc.once('confront', (n) => (node = n));
      for (let i = 0; i < 600 && !node; i++) enc.update(FRAME_MS, ahead(guard, 24));
      const runner = enc.attach(new DialogueRunner(json('dialogue/m1_alley.json'), state));
      const option = json('dialogue/m1_alley.json').nodes.guard.options.find((o) => o.id === answerId);
      runner.emit('choice-made', option, 0); // the answer, as the box would report it
      enc.handleEvent(option.next === 'pass' || option.next === 'clinic_line' ? 'guard_pass' : 'guard_fail');
    },
    cameraSpots() {
      const before = state.mission.log.length;
      for (let i = 0; i < 900 && state.mission.log.length === before; i++) enc.update(FRAME_MS, ahead(camera, 40));
    },
    restart: () => enc.restart(),
  };
}

const summaryOf = (s) => buildMissionSummary(s.mission.log, DIALOGUES);

test('(a) a clean run: 0 spotted, Heat 0, no answers', () => {
  const s = newState();
  play('m1_booth', s, ['Visiting family.', 'My tía.', 'Fourth Street.', 'A letter for my tía.']);
  alley(s); // through the alley unseen: nothing logged
  const sum = summaryOf(s);
  eq('summary', sum, { timesSpotted: 0, heatChange: 0, suspiciousAnswers: { booth: [], secondary: [] }, unresolved: [] });
  eq('Heat shows as "0"', signed(sum.heatChange), '0');
});

/** The messy run: refused once, through on the second try with no answer in time, caught in the alley. */
function messyRun() {
  const s = newState();
  // Attempt 1: booth -> secondary -> refused (Heat +2).
  play('m1_booth', s, ['I have to drop something off.', 'A letter for a friend.', "I don't know."]);
  play('m1_secondary', s, ['Just a guy I know.', "I don't know."]);
  // Attempt 2 (card flagged, booth starts at 1): the booth again, with no answer in time.
  play('m1_booth', s, ['Visiting family.', 'My tía.', 'Fourth Street.', TIMEOUT]);
  // The alley: the guard ("Just walking.": Heat +1), the alley restarts, the camera (Heat +1).
  const a = alley(s);
  a.guardSpots('just_walking');
  a.restart();
  a.cameraSpots();
  return s;
}

test('(b) a messy run: spotted count, Heat total, the answers in order', () => {
  const s = messyRun();
  eq('reached attempt 2', s.mission.attempt, 2);
  const sum = summaryOf(s);
  eq('times spotted (guard and camera, both alley attempts)', sum.timesSpotted, 2);
  eq('Heat: refused +2, guard fail +1, camera +1', sum.heatChange, 4);
  eq('Heat shown', signed(sum.heatChange), '+4');
  eq('booth answers, in order, both attempts', sum.suspiciousAnswers.booth, ['I have to drop something off.', "I don't know.", "Mateo doesn't answer."]);
  eq('secondary answers', sum.suspiciousAnswers.secondary, ['Just a guy I know.', "I don't know."]);
  eq('nothing unresolved', sum.unresolved, []);
});

test('(c) the timeout outcome appears as its own line', () => {
  const s = newState();
  play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', TIMEOUT]);
  eq('booth', summaryOf(s).suspiciousAnswers.booth, ["Mateo doesn't answer."]);
  const t = s.mission.log.find((e) => e.answer_id === 'timeout');
  eq('logged as the timer outcome', [t?.question_id, t?.delta > 0], ['jacket', true]);
});

test('(d) answers resolve to the exact script text', () => {
  // Plain options, the cover-matched key answers (variants), options whose suspicion comes from a variant.
  eq('booth: purpose', resolveAnswer(DIALOGUES.booth, 'purpose', 'dropoff'), 'I have to drop something off.');
  eq('booth: "It\'s… a checkup."', resolveAnswer(DIALOGUES.booth, 'kind', 'checkup'), 'It\'s… a checkup.');
  eq('booth: key answer (cash)', resolveAnswer(DIALOGUES.booth, 'jacket', 'cash'), 'Cash. For the shoes.');
  eq('booth: key answer (tía)', resolveAnswer(DIALOGUES.booth, 'jacket', 'tia_letter'), 'A letter for my tía.');
  eq('booth: key answer (prescription)', resolveAnswer(DIALOGUES.booth, 'jacket', 'prescription'), 'The prescription.');
  eq('secondary: "Rosa… Ibarra."', resolveAnswer(DIALOGUES.secondary, 'tia_name', 'rosa_ibarra'), 'Rosa… Ibarra.');
  eq('secondary: address mismatch', resolveAnswer(DIALOGUES.secondary, 'address', 'downtown'), 'Near downtown.');
  eq('secondary: (Say nothing.)', resolveAnswer(DIALOGUES.secondary, 'doctor', 'silent'), '(Say nothing.)');
  eq('unknown answer', resolveAnswer(DIALOGUES.booth, 'purpose', 'nope'), null);
  // A suspicion entry with no answer behind it (the blank pages exposing a lie) is skipped and listed.
  const s = newState();
  play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Cash. For the shoes.']);
  s.addSuspicion('booth', 4);
  play('m1_secondary', s, ['The outlets on the highway.', 'Around sixty dollars.', "It's for my tía. She makes cards."]);
  const sum = summaryOf(s);
  check('exposure line not listed as an answer', !sum.suspiciousAnswers.secondary.some((t) => t.includes('blank pages')));
  eq('exposure listed as unresolved', sum.unresolved.filter((u) => u.startsWith('secondary:exposed')).length, 1);
});

test('(e) no suspicion values in the output', () => {
  const s = messyRun();
  const sum = summaryOf(s);
  eq('only these keys', Object.keys(sum).sort(), ['heatChange', 'suspiciousAnswers', 'timesSpotted', 'unresolved']);
  eq('answer groups', Object.keys(sum.suspiciousAnswers), ['booth', 'secondary']);
  const all = [...sum.suspiciousAnswers.booth, ...sum.suspiciousAnswers.secondary, ...sum.unresolved];
  check('answers and ids are strings', all.every((t) => typeof t === 'string'));
  check('no "delta" or suspicion fields anywhere', !/delta|"suspicion"/.test(JSON.stringify(sum)));
  check('the only numbers are the count and the Heat', JSON.stringify(sum).match(/:\s*-?\d/g)?.length === 2);
});

test('Mission 2: the case answers resolve, through the dialogues that extend Mission 1\'s', () => {
  const raw = (id) => json(`dialogue/${id}.json`);
  const dialogues = summaryDialogues(raw);
  const s = newState();
  s.setClockConfig(json('clock_config.json'));
  s.startMission(2);
  s.setFlag('night_officer', true);
  const runner = new DialogueRunner(resolveDialogue(raw('m2_booth'), raw), s);
  let pending = null;
  runner.on('line', () => (pending = 'line'));
  runner.on('choice', () => (pending = 'choice'));
  runner.on('waiting', () => (pending = 'wait'));
  runner.start();
  const picks = ['Shopping.', 'Some stuff for work.', 'Clothes.'];
  while (!runner.ended) {
    const what = pending;
    pending = null;
    if (what === 'line') runner.advance();
    else if (what === 'wait') runner.resume();
    else if (what === 'choice') runner.choose(runner.options.findIndex((o) => o.text === picks[0]) + (picks.shift(), 0));
    else break;
  }
  const sum = buildMissionSummary(s.mission.log, dialogues);
  eq('booth answers', sum.suspiciousAnswers.booth, ['Some stuff for work.', 'Clothes.']);
  eq('the night officer\'s start is not an answer', sum.unresolved, []);
  eq('Mission 2 secondary answers too', [
    resolveAnswer(dialogues.secondary[1], 'whose', 'mine'),
    resolveAnswer(dialogues.secondary[1], 'case_who', 'warehouse'),
    resolveAnswer(dialogues.booth[1], 'case', 'timeout'),
  ], ['Mine.', 'A guy at a warehouse.', "Mateo doesn't answer."]);
});

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
