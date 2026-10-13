// Pure-logic test of Mission 2's crossing (the clock, the booth and secondary inspection), run with
//   npm run test:mission2      (or: node tools/test_mission2.mjs)
// No dependencies and no Phaser: it drives DialogueRunner and GameState with the real data (m2_booth and
// m2_secondary, which reuse Mission 1's by "extends") and the real configs, picking options by their text.
// Exits 1 on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDialogue } from '../src/systems/dialogueData.js';
import DialogueRunner from '../src/systems/DialogueRunner.js';
import GameClock, { parseTime } from '../src/systems/GameClock.js';
import GameState from '../src/systems/GameState.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (path) => JSON.parse(readFileSync(join(ROOT, 'public/assets/data', path), 'utf8'));
const raw = (id) => json(`dialogue/${id}.json`);
const DIALOGUE = Object.fromEntries(['m2_booth', 'm2_secondary'].map((id) => [id, resolveDialogue(raw(id), raw)]));
const CLOCK = json('clock_config.json');
const TIMEOUT = Symbol('timeout');

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

/** A Mission 2 state: the case carried; night: the clock says the night officer; flagged: card flagged, attempt 2. */
function newState({ night = false, flagged = false } = {}) {
  const s = new GameState();
  s.setEncounterConfig(json('encounter_config.json'));
  s.setClockConfig(CLOCK);
  s.startMission(2);
  s.giveItem('case');
  s.clock.set(night ? '11:03' : '10:56');
  s.setFlag('night_officer', s.clock.officerAt() === 'night');
  if (flagged) {
    s.setFlag('card_flagged', true);
    s.mission.attempt = 2;
  }
  return s;
}

/** Plays a conversation: lines advanced, waits resumed, options picked by text (TIMEOUT runs the timer out). */
function play(id, state, picks) {
  const runner = new DialogueRunner(DIALOGUE[id], state);
  const shown = { lines: [], events: [], choices: [] };
  let pending = null;
  runner.on('line', (n) => {
    shown.lines.push(n.text);
    pending = 'line';
  });
  runner.on('choice', (n) => {
    shown.choices.push(n.options.map((o) => o.text));
    pending = 'choice';
  });
  runner.on('waiting', () => (pending = 'wait'));
  runner.on('event', (name) => shown.events.push(name));
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
        check(`${id}: the key question is timed (6000 ms)`, runner.timerMs() === 6000, `timer ${runner.timerMs()}`);
        runner.timeout();
        continue;
      }
      const i = runner.options.findIndex((o) => o.text === want);
      check(`${id}: "${String(want)}" offered`, i !== -1, JSON.stringify(shown.choices.at(-1)));
      if (i === -1) return shown;
      runner.choose(i);
    } else {
      check(`${id}: keeps going`, false, 'stalled');
      return shown;
    }
  }
  eq(`${id}: every pick used`, queue.length, 0);
  return shown;
}

const SHOES = ['Shopping.', 'Shoes for my brother.'];

test('(a) day officer: Shopping > shoes > "It\'s heavy. I don\'t know." => 1 => "Have a good day."', () => {
  const s = newState();
  const shown = play('m2_booth', s, [...SHOES, "It's heavy. I don't know."]);
  eq('booth', s.getSuspicion('booth'), 1);
  check('day opening', shown.lines[0] === "The officer doesn't look up." && shown.lines[1] === 'Documents.', JSON.stringify(shown.lines.slice(0, 2)));
  check('no night opening', !shown.lines.includes('You were through here last week.'));
  check('the key question', shown.lines.includes('The officer looks at the case.') && shown.lines.includes("What's in the case?"));
  check('no jacket question', !shown.lines.includes("What's in your jacket?"));
  check('Have a good day.', shown.lines.at(-1) === 'Have a good day.' && shown.events.includes('booth_pass'));
  eq('key answer stored', [s.getAnswer('cover_story'), s.getAnswer('cover_detail'), s.getAnswer('key_answer')], ['shopping', 'shoes', 'heavy']);
  eq('key options (no cover-matched answer)', shown.choices.at(-1), ["It's heavy. I don't know.", 'Clothes.', 'A friend asked me to carry it.']);
});

test('(b) night officer, "Clothes." => 1 + 2 = 3 => held passport', () => {
  const s = newState({ night: true });
  const shown = play('m2_booth', s, [...SHOES, 'Clothes.']);
  eq('booth start parts', s.mission.startParts.booth, { base: 0, flagged: false, bonus: 1 });
  eq('booth', s.getSuspicion('booth'), 3);
  check('night opening', shown.lines[0] === "A different officer is at the booth. He looks at Mateo's passport, then at Mateo." && shown.lines[1] === 'You were through here last week.', JSON.stringify(shown.lines.slice(0, 2)));
  check('held', shown.lines.includes('He holds onto the passport a moment longer. Then he slides it back.') && shown.lines.at(-1) === 'Go ahead.');
  eq('the start bonus is not logged as an answer', s.mission.log.filter((e) => e.type === 'suspicion').map((e) => e.delta), [2]);
});

test('(c) night + card flagged, "A friend asked me to carry it." => 2 + 2 = 4 => secondary', () => {
  const s = newState({ night: true, flagged: true });
  const shown = play('m2_booth', s, [...SHOES, 'A friend asked me to carry it.']);
  eq('booth start parts', s.mission.startParts.booth, { base: 1, flagged: true, bonus: 1 });
  eq('booth', s.getSuspicion('booth'), 4);
  check('to secondary', shown.events.includes('booth_secondary') && shown.lines.at(-1) === 'Step over there, please. The door on your left.');
  check('attempt-2 tell during the follow-ups', shown.lines.includes('He stops typing.'));
});

test('(d) no answer in time => +2', () => {
  const s = newState();
  const shown = play('m2_booth', s, [...SHOES, TIMEOUT]);
  eq('booth', s.getSuspicion('booth'), 2);
  check('Mateo doesn\'t answer.', shown.lines.includes("Mateo doesn't answer."));
  eq('key answer', s.getAnswer('key_answer'), 'none');
  const t = s.mission.log.find((e) => e.answer_id === 'timeout');
  eq('logged as the case question timing out', [t?.question_id, t?.delta], ['case', 2]);
});

/** Through the booth to secondary, then secondary with these picks. */
function toSecondary(key, secondaryPicks, opts = { night: true, flagged: true }) {
  const s = newState(opts);
  play('m2_booth', s, [...SHOES, key]);
  const booth = s.getSuspicion('booth');
  const shown = play('m2_secondary', s, secondaryPicks);
  return { s, shown, booth };
}
const PLAIN_FOLLOWUPS = ['The outlets on the highway.', 'Around sixty dollars.'];

test('(e) night + flagged, "Clothes." => secondary; the exposure line plays and adds +2; not after "A friend asked me..."', () => {
  const clothes = toSecondary('Clothes.', [...PLAIN_FOLLOWUPS, "A friend's.", 'No.', "I don't know."]);
  eq('sent to secondary', clothes.booth, 4);
  check('the exposure line', clothes.shown.lines.includes('You told the officer outside this was clothes.'));
  const exposure = clothes.s.mission.log.find((e) => e.question_id === 'told_clothes');
  eq('it adds +2', exposure?.delta, 2);
  eq('secondary total (0 + 2 + 1 + 0 + 2)', clothes.s.getSuspicion('secondary'), 5);
  const friend = toSecondary('A friend asked me to carry it.', [...PLAIN_FOLLOWUPS, "A friend's.", 'No.', "I don't know."]);
  check('no exposure line', !friend.shown.lines.includes('You told the officer outside this was clothes.'));
  eq('secondary total (0 + 1 + 0 + 2)', friend.s.getSuspicion('secondary'), 3);
  check('Carr never opens the case', clothes.s.getFlag('envelope_inspected') === 0 && clothes.s.getFlag('envelope_opened') === 0);
  check('the case lines', clothes.shown.lines.includes('She has his passport, his card, and the gray case. She sets the case on the desk. Both padlocks are shut.')
    && clothes.shown.lines.includes('She lifts the case an inch and sets it down.'));
  check('no envelope lines', !clothes.shown.lines.some((l) => /envelope|blank pages|pages back/.test(l)), JSON.stringify(clothes.shown.lines.filter((l) => /envelope|pages/.test(l))));
});

test('(f) secondary after Shopping/shoes: 0, 0, +1, 0, +1, +1 => 3 => pass', () => {
  const { s, shown } = toSecondary("It's heavy. I don't know.",
    [...PLAIN_FOLLOWUPS, "A friend's.", 'No.', 'He asked me to bring it.', 'A friend of my family.'],
    { night: true, flagged: true });
  eq('secondary', s.getSuspicion('secondary'), 3);
  check('the follow-ups ran first', shown.lines.indexOf('Which store?') < shown.lines.indexOf('Whose is it?'));
  check('pass', shown.events.includes('secondary_pass') && shown.lines.at(-1) === 'You can go.');
  check('no envelope narration on the pass path', !shown.lines.some((l) => l.includes('pages back in the envelope')));
  eq('Heat +1', s.getMeter('heat'), 1);
});

test('(g) secondary: "Mine." +2, "It\'s at home." +2 => 4 => refused', () => {
  const { s, shown } = toSecondary("It's heavy. I don't know.",
    [...PLAIN_FOLLOWUPS, 'Mine.', "It's at home.", 'He asked me to bring it.', 'A friend of my family.']);
  eq('secondary (2 + 2 + 1 + 1)', s.getSuspicion('secondary'), 6);
  check('refused', shown.events.includes('refused') && shown.lines.includes("We're denying your entry today. Someone will walk you back."));
  eq('Heat +2, card flagged, attempt +1', [s.getMeter('heat'), s.getFlag('card_flagged'), s.mission.attempt], [2, true, 3]);
  eq('booth answers cleared', ['cover_story', 'cover_detail', 'key_answer'].map((a) => s.getAnswer(a)), [null, null, null]);
});

test('(h) "A guy at a warehouse." sets told_officer_warehouse and loyalty -1, once across two attempts', () => {
  const s = newState({ night: true, flagged: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    play('m2_booth', s, [...SHOES, 'Clothes.']);
    play('m2_secondary', s, [...PLAIN_FOLLOWUPS, 'Mine.', 'No.', 'He asked me to bring it.', 'A guy at a warehouse.']);
  }
  eq('told_officer_warehouse', s.getFlag('told_officer_warehouse'), true);
  eq('loyalty -1, once', s.getMeter('loyalty'), -1);
  eq('both attempts refused', s.mission.attempt, 4);
});

test('(i) the clock: day before 11:00, night from it; H:MM; refusal restores the line start and the officer', () => {
  const c = new GameClock(CLOCK);
  eq('starts at the config start', c.format(), '10:41');
  eq('10:59 day', c.officerAt('10:59'), 'day');
  eq('10:59.9 day', c.officerAt(parseTime('10:59') + 0.9), 'day');
  eq('11:00 night', c.officerAt('11:00'), 'night');
  eq('format pads the minutes', c.format(parseTime('9:05')), '9:05');
  eq('format drops seconds', c.format(parseTime('10:59') + 0.99), '10:59');
  c.update(60000);
  eq('stopped: it does not move', c.format(), '10:41');
  c.start();
  c.update(30000);
  eq('30 real seconds at 1 game minute a second', c.format(), '11:11');
  c.pause();
  c.set('10:57');
  c.saveLineStart();
  c.start();
  c.update(5000);
  eq('in line, the clock runs on', c.format(), '11:02');
  c.restoreLineStart();
  eq('restored to the line start', c.format(), '10:57');
  eq('the same officer as before', c.officerAt(), 'day');
  const s = newState();
  s.clock.set('10:58');
  s.startMission(2);
  eq('startMission resets the clock', s.clock.format(), CLOCK.startTime);
});

test('startMission(2) keeps card_flagged and game-wide once keys; resets the log and the attempt', () => {
  const s = newState();
  s.setFlag('card_flagged', true);
  s.applyEffects([{ meter: 'loyalty', add: -1, once: 'told_officer_tireshop' }, { flag: 'x', add: 1, once: 'mission:hint' }]);
  s.mission.attempt = 3;
  s.mission.log.push({ type: 'heat', delta: 1 });
  s.startMission(2);
  eq('attempt 1, empty log', [s.mission.attempt, s.mission.log.length, s.mission.id], [1, 0, 2]);
  eq('card_flagged kept', s.getFlag('card_flagged'), true);
  check('game-wide once key kept', s.done.has('told_officer_tireshop'));
  check('per-mission once key forgotten', !s.done.has('mission:hint'));
});

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
