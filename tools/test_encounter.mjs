// Pure-logic test of the Mission 1 encounter data (the line, the booth, secondary inspection), run with
//   node tools/test_encounter.mjs
// No dependencies and no Phaser: it drives DialogueRunner and GameState directly, picking options by
// their text, and checks suspicion, outcomes, the mission log, skips and flags. Exits 1 on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import DialogueRunner from '../src/systems/DialogueRunner.js';
import GameState from '../src/systems/GameState.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (path) => JSON.parse(readFileSync(join(ROOT, 'public/assets/data', path), 'utf8'));
const CONFIG = json('encounter_config.json');
const DIALOGUE = Object.fromEntries(['m1_line', 'm1_booth', 'm1_secondary'].map((id) => [id, json(`dialogue/${id}.json`)]));
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
const eq = (label, actual, expected) => check(label, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

/** A fresh state as after the tire shop: carrying the envelope, first attempt. */
function newState({ opened = false } = {}) {
  const state = new GameState();
  state.setEncounterConfig(CONFIG);
  state.giveItem('envelope');
  if (opened) state.setFlag('envelope_opened', true);
  return state;
}

/**
 * Plays a conversation: advances every line, resumes every wait event, and at each choice picks the
 * option whose text is the next entry in `picks` (TIMEOUT lets a timed choice run out). Returns what
 * was shown: lines (text), choices (the texts offered at each), events (names), skips (node ids).
 */
function play(id, state, picks = [], startNode) {
  const runner = new DialogueRunner(DIALOGUE[id], state);
  const shown = { lines: [], choices: [], events: [], skips: [] };
  let pending = null;
  runner.on('line', (node) => {
    shown.lines.push(node.text);
    pending = 'line';
  });
  runner.on('choice', (node) => {
    shown.choices.push(node.options.map((o) => o.text));
    pending = 'choice';
  });
  runner.on('waiting', () => (pending = 'wait'));
  runner.on('event', (name) => shown.events.push(name));
  runner.on('skip', (nodeId) => shown.skips.push(nodeId));
  runner.start(startNode);
  const queue = [...picks];
  while (!runner.ended) {
    const what = pending;
    pending = null;
    if (what === 'line') runner.advance();
    else if (what === 'wait') runner.resume();
    else if (what === 'choice') {
      const want = queue.shift();
      if (want === TIMEOUT) {
        check(`${id}: timed choice has a timer`, runner.timerMs() > 0);
        runner.timeout();
        continue;
      }
      const index = runner.options.findIndex((o) => o.text === want);
      if (index === -1) {
        check(`${id}: "${want}" offered`, false, `offered ${JSON.stringify(shown.choices.at(-1))}`);
        return shown;
      }
      runner.choose(index);
    } else {
      check(`${id}: conversation keeps going`, false, 'stalled');
      return shown;
    }
  }
  check(`${id}: every pick used`, queue.length === 0, `left over ${JSON.stringify(queue)}`);
  return shown;
}

const suspicionLog = (state, encounter) => state.mission.log.filter((e) => e.type === 'suspicion' && e.encounter === encounter);
const sum = (entries) => entries.reduce((t, e) => t + e.delta, 0);

function test(name, fn) {
  const before = failures;
  fn();
  console.log(`${failures === before ? 'ok  ' : 'FAIL'} ${name}`);
}

// ---- the booth ----

test('(a) Shopping > shoes > "Cash. For the shoes." => 0, "Have a good day."', () => {
  const s = newState();
  const shown = play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Cash. For the shoes.']);
  eq('booth suspicion', s.getSuspicion('booth'), 0);
  check('outcome line', shown.lines.includes('Have a good day.'));
  check('passes', shown.events.includes('booth_pass'));
  check('"Just paper." not offered (envelope unopened)', !shown.choices.at(-1).includes('Just paper.'));
  check('glances at the jacket (suspicion under 2)', shown.lines.includes("He glances at the front of Mateo's jacket."));
  check('no tell on attempt 1', !shown.lines.includes('He stops typing.'));
  eq('key answer', s.getAnswer('key_answer'), 'cash');
  eq('cover story', s.getAnswer('cover_story'), 'shopping');
  eq('cover detail', s.getAnswer('cover_detail'), 'shoes');
});

test('(b) Drop something off > business papers > "I don\'t know." => 6 => secondary', () => {
  const s = newState();
  const shown = play('m1_booth', s, ['I have to drop something off.', 'Some papers for a business.', "I don't know."]);
  eq('booth suspicion', s.getSuspicion('booth'), 6);
  check('outcome line', shown.lines.includes('Step over there, please. The door on your left.'));
  check('to secondary', shown.events.includes('booth_secondary'));
  check('stops typing before the key question (suspicion 2+)', shown.lines.includes('He stops typing.'));
  eq('log entries', JSON.stringify(suspicionLog(s, 'booth').map((e) => [e.question_id, e.answer_id, e.delta])),
    JSON.stringify([['purpose', 'dropoff', 2], ['drop_what', 'business_papers', 2], ['jacket', 'dont_know', 2]]));
});

test('(c) Visiting family > tía > "I\'d have to check my phone." > "Paperwork." => 4 => secondary', () => {
  const s = newState();
  const shown = play('m1_booth', s, ['Visiting family.', 'My tía.', "I'd have to check my phone.", 'Paperwork.']);
  eq('booth suspicion', s.getSuspicion('booth'), 4);
  check('to secondary', shown.events.includes('booth_secondary'));
  eq('no address remembered', s.getAnswer('booth_address'), null);
});

test('(d) key question timeout => +2, "Mateo doesn\'t answer."', () => {
  const s = newState();
  const shown = play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', TIMEOUT]);
  eq('booth suspicion', s.getSuspicion('booth'), 2);
  check('no-answer narration', shown.lines.includes("Mateo doesn't answer."));
  eq('key answer', s.getAnswer('key_answer'), 'none');
  const last = suspicionLog(s, 'booth').at(-1);
  eq('logged as a timeout', `${last.question_id}/${last.answer_id}/${last.delta}`, 'jacket/timeout/2');
  check('held passport (2-3)', shown.lines.includes('Go ahead.') && shown.events.includes('booth_pass'));
  eq('timer is 6 s', new DialogueRunner(DIALOGUE.m1_booth, s).timerMs(DIALOGUE.m1_booth.nodes.jacket), 6000);
});

test('(e) opened envelope, "Just paper." => +0', () => {
  const s = newState({ opened: true });
  const shown = play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Just paper.']);
  eq('booth suspicion', s.getSuspicion('booth'), 0);
  check('"Just paper." offered first', shown.choices.at(-1)[0] === 'Just paper.');
  eq('four options', shown.choices.at(-1).length, 4);
  check('passes', shown.lines.includes('Have a good day.'));
});

test('cover-matched key answers follow the cover story', () => {
  const cases = [
    [['Visiting family.', 'My tía.', 'Fourth Street.'], 'A letter for my tía.'],
    [['A doctor\'s appointment.', 'The dentist.', 'Eleven thirty.'], 'My medical papers.'],
    [['A doctor\'s appointment.', 'Picking up a prescription for my grandmother.'], 'The prescription.'],
    [['I have to drop something off.', 'A letter for a friend.'], "The letter I'm dropping off."],
  ];
  for (const [picks, answer] of cases) {
    const s = newState();
    const shown = play('m1_booth', s, [...picks, answer]);
    check(`"${answer}" offered`, shown.choices.at(-1).includes(answer));
  }
});

test('flagged card: booth suspicion starts at the config value; attempt tells', () => {
  const s = newState();
  s.setFlag('card_flagged', true);
  s.applyEffects([{ attempt: 1 }]);
  const shown = play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Cash. For the shoes.']);
  eq('booth suspicion', s.getSuspicion('booth'), CONFIG.encounters.booth.flaggedStart);
  check('attempt 2 tell before the follow-ups', shown.lines.indexOf('He stops typing.') < shown.lines.indexOf('What are you buying?'));
  s.applyEffects([{ attempt: 1 }]);
  const third = play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Cash. For the shoes.']);
  check('attempt 3 tell', third.lines.includes('He looks at the passport photo, then at Mateo.'));
});

// ---- secondary inspection ----

/** Booth then secondary, in one state. */
function crossing(boothPicks, secondaryPicks, opts) {
  const s = newState(opts);
  play('m1_booth', s, boothPicks);
  const shown = play('m1_secondary', s, secondaryPicks);
  return { s, shown };
}
const B_PATH = ['I have to drop something off.', 'Some papers for a business.', "I don't know."];
const C_PATH = ['Visiting family.', 'My tía.', "I'd have to check my phone.", 'Paperwork.'];

test('(f) secondary after (b): "Who\'s the friend?" is skipped (no "A letter for a friend." at the booth)', () => {
  // The prompt's path (f) answers "Just a guy I know." after (b), but the skip rule (also in the prompt)
  // drops that question when the booth answer wasn't "A letter for a friend.". The skip rule wins here;
  // the refusal path is tested below with the letter.
  const { s, shown } = crossing(B_PATH, ["I don't know."]);
  check('friend question skipped', shown.skips.includes('friend_q') && !shown.lines.includes("Who's the friend?"));
  eq('skip logged', JSON.stringify(s.mission.skips), JSON.stringify([{ encounter: 'secondary', question_id: 'friend_q' }]));
  eq('secondary suspicion', s.getSuspicion('secondary'), 2);
  check('passes', shown.events.includes('secondary_pass'));
});

test('(f) refusal: "Just a guy I know." (+2), "I don\'t know." (+2) => 4 => refused', () => {
  const { s, shown } = crossing(['I have to drop something off.', 'A letter for a friend.', "I don't know."],
    ['Just a guy I know.', "I don't know."]);
  eq('booth suspicion (sent to secondary)', s.getSuspicion('booth'), 4);
  eq('secondary suspicion', s.getSuspicion('secondary'), 4);
  check('refusal line', shown.lines.includes("We're denying your entry today. Someone will walk you back."));
  check('refused', shown.events.includes('refused'));
  eq('heat', s.getMeter('heat'), 2);
  eq('card flagged', s.getFlag('card_flagged'), true);
  eq('attempt', s.mission.attempt, 2);
  eq('booth answers cleared', ['cover_story', 'cover_detail', 'booth_address', 'booth_time', 'key_answer'].map((a) => s.getAnswer(a)).join(), ',,,,');
  eq('envelope still carried', s.hasItem('envelope'), true);
  eq('envelope_inspected', s.getFlag('envelope_inspected'), true);
  eq('envelope_opened not set by Carr', s.getFlag('envelope_opened'), 0);
  const heat = s.mission.log.filter((e) => e.type === 'heat');
  eq('heat logged', JSON.stringify(heat.map((e) => [e.encounter, e.question_id, e.delta])), JSON.stringify([['secondary', 'refused', 2]]));
  // Mission restarts from the line with the card flagged: the booth starts suspicious, attempt-2 tells show.
  const again = play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Cash. For the shoes.']);
  eq('restart: booth starts at the flagged value', suspicionLog(s, 'booth').length > 0 && s.getSuspicion('booth'), 1);
  check('restart: attempt-2 tell', again.lines.includes('He stops typing.'));
});

test('(g) secondary after (c): "Rosa." 0; address skipped; "It\'s for my tía. She makes cards." 0 => pass', () => {
  const { s, shown } = crossing(C_PATH, ['Rosa.', "It's for my tía. She makes cards."]);
  check('address question skipped', shown.skips.includes('address_q') && !shown.lines.includes('And where does she live?'));
  eq('secondary suspicion', s.getSuspicion('secondary'), 0);
  check('pass line', shown.lines.includes('You can go.'));
  eq('heat +1', s.getMeter('heat'), 1);
  check('no exposure (Paperwork. was not a cover lie)', !shown.lines.includes('She looks at the blank pages, then at him.'));
  check('waiting room pause as written', shown.lines.includes('Mateo sits. The clock says 11:12.{p:1500}'));
});

test('exposure: booth said "Cash. For the shoes." => +2 and the cash line', () => {
  const s = newState();
  play('m1_booth', s, ['Shopping.', 'Shoes for my brother.', 'Cash. For the shoes.']);
  s.addSuspicion('booth', 4); // as if sent to secondary anyway
  const shown = play('m1_secondary', s, ['The outlets on the highway.', 'Around sixty dollars.', "It's for my tía. She makes cards."]);
  check('exposure line', shown.lines.includes('You told the officer outside this was cash.'));
  eq('secondary suspicion (exposed +2, cards +2 off-story)', s.getSuspicion('secondary'), 4);
});

test('opened envelope: torn signature line; "Just paper." is no lie', () => {
  const { s, shown } = crossing(['Visiting family.', 'My tía.', 'Near downtown.', 'Just paper.'],
    ['Rosa.', 'Fourth Street.', 'I don\'t know.'], { opened: true });
  check('torn signature', shown.lines.includes('She turns the bag over. The signature on the flap is already torn.'));
  check('gives the other address: writes it down', shown.lines.includes('She writes something down.'));
  eq('secondary suspicion', s.getSuspicion('secondary'), 4);
});

test('"A guy at a tire shop." sets told_officer_tireshop and loyalty -1 once across attempts', () => {
  const s = newState();
  for (let i = 0; i < 2; i++) {
    play('m1_booth', s, ['Visiting family.', 'My tía.', 'Fourth Street.', 'A letter for my tía.']);
    s.addSuspicion('booth', 4);
    play('m1_secondary', s, ['Rosa.', 'Fourth Street.', 'Somebody asked me to bring it.', 'A guy at a tire shop.']);
  }
  eq('told_officer_tireshop', s.getFlag('told_officer_tireshop'), true);
  eq('loyalty', s.getMeter('loyalty'), -1);
});

test('time and price questions are skipped without a booth answer to compare', () => {
  const doc = crossing(['A doctor\'s appointment.', 'It\'s… a checkup.', 'Paperwork.'], ['(Say nothing.)', 'I don\'t know.']);
  check('time skipped (no time given)', doc.shown.skips.includes('time_q'));
  const shop = crossing(['Shopping.', 'Some stuff for work.', 'I don\'t know.'], ['The outlets on the highway.', 'I don\'t know.']);
  check('shoe price skipped (not the shoes)', shop.shown.skips.includes('price_q'));
  const dentist = crossing(['A doctor\'s appointment.', 'The dentist.', 'Sometime this afternoon.', TIMEOUT],
    ['I have it in my phone.', 'Eleven thirty.', 'I don\'t know.']);
  eq('different time +2', dentist.s.getSuspicion('secondary'), 1 + 2 + 2);
});

test('secondary tells by attempt', () => {
  const s = newState();
  s.applyEffects([{ attempt: 1 }]);
  play('m1_booth', s, C_PATH);
  const two = play('m1_secondary', s, ['Rosa.', "It's for my tía. She makes cards."]);
  check('attempt 2: she stops writing', two.lines.includes('She stops writing.'));
  s.applyEffects([{ attempt: 1 }]);
  play('m1_booth', s, C_PATH);
  const three = play('m1_secondary', s, ['Rosa.', "It's for my tía. She makes cards."]);
  check('attempt 3: she sets the pen down', three.lines.includes('She sets the pen down.'));
});

// ---- the line ----

test('the line: the envelope choice, and leaving it out once opened', () => {
  const s = newState();
  const first = play('m1_line', s, ['Open the envelope.'], 'stop');
  check('opening narration', first.lines.includes('Inside: three sheets of paper, folded once. All of them blank.'));
  eq('envelope_opened', s.getFlag('envelope_opened'), true);
  const retry = play('m1_line', s, [], 'stop');
  eq('no choice on a retry once opened', retry.choices.length, 0);
  check('no opening narration on the retry', !retry.lines.some((l) => l.startsWith('He turns away')));
  check('the line moves', retry.lines.at(-1) === 'The line moves.');
  const t = newState();
  play('m1_line', t, ['Leave it.'], 'stop');
  const again = play('m1_line', t, ['Leave it.'], 'stop');
  eq('offered again if left unopened', again.choices.length, 1);
});

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
