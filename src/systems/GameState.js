import { test } from './conditions.js';
import Emitter from './Emitter.js';

const METERS = ['loyalty', 'heat', 'conscience'];

/**
 * In-memory game state (no saving yet).
 *  - meters:  loyalty, heat, conscience (start at 0)
 *  - flags:   named values, e.g. tomi_involved (a count), ruiz_secret (true); read as 0 until set.
 *             Carried items are flags too: has_<item> (e.g. has_envelope), see giveItem().
 *  - answers: named remembered strings, e.g. prologue_want (read as null until set)
 *  - uses:    control-use counts for control hints (reset with everything else)
 *  - mission: the current mission's encounter state:
 *      attempt     1, 2, 3... (refused entry restarts the mission and raises it)
 *      encounter   the encounter running now (e.g. 'booth', 'secondary'), or null
 *      suspicion   a hidden count per encounter, e.g. { booth: 2, secondary: 0 }; never shown to the player
 *      log         every suspicion and Heat change: { type, encounter, question_id, answer_id, delta },
 *                  and other events (logEvent), e.g. { type: 'spotted', encounter: 'alley', source }
 *                  (for the end-of-mission summary)
 *      skips       questions skipped for lack of an earlier answer: { encounter, question_id } (dev panel)
 *  - encounterConfig: public/assets/data/encounter_config.json (thresholds and start values); kept on reset
 * Emits 'change' ({ kind, name, value }) whenever anything is modified.
 * No Phaser here: tools/test_encounter.mjs runs it in node.
 */
export default class GameState extends Emitter {
  constructor() {
    super();
    this.encounterConfig = {};
    this.reset();
  }

  reset() {
    this.meters = Object.fromEntries(METERS.map((m) => [m, 0]));
    this.flags = {};
    this.answers = {};
    this.uses = {}; // how often the player has used a control (for control hints), e.g. advance, choose
    this.done = new Set(); // keys of "once" effects already applied
    this.startMission();
  }

  /**
   * A new mission: attempt 1, no encounter, and an empty log. Called when a mission begins (Mission 1:
   * its title card). Restarts inside a mission (refused entry, the alley) keep it all.
   */
  startMission() {
    this.mission = { attempt: 1, encounter: null, suspicion: {}, log: [], skips: [] };
    this.emit('change', { kind: 'mission', name: 'start', value: 1 });
  }

  setEncounterConfig(config) {
    this.encounterConfig = config;
  }

  /** Counts one use of a control (e.g. 'advance', 'choose'). */
  countUse(name) {
    this.uses[name] = (this.uses[name] ?? 0) + 1;
  }

  getUses(name) {
    return this.uses[name] ?? 0;
  }

  getMeter(name) {
    this.assertMeter(name);
    return this.meters[name];
  }

  setMeter(name, value) {
    this.assertMeter(name);
    this.meters[name] = value;
    this.emit('change', { kind: 'meter', name, value });
  }

  /** ctx: { question, answer } of the dialogue that caused it; Heat changes go in the mission log. */
  changeMeter(name, amount, ctx = {}) {
    this.setMeter(name, this.getMeter(name) + amount);
    if (name === 'heat') this.logChange('heat', this.mission.encounter, amount, ctx);
  }

  getFlag(name) {
    return this.flags[name] ?? 0;
  }

  setFlag(name, value) {
    this.flags[name] = value;
    this.emit('change', { kind: 'flag', name, value });
  }

  addFlag(name, amount = 1) {
    this.setFlag(name, this.getFlag(name) + amount);
  }

  /** Mateo now carries `item` (sets the flag has_<item>). */
  giveItem(item) {
    this.setFlag(`has_${item}`, true);
  }

  takeItem(item) {
    this.setFlag(`has_${item}`, false);
  }

  hasItem(item) {
    return this.getFlag(`has_${item}`) === true;
  }

  getAnswer(name) {
    return this.answers[name] ?? null;
  }

  setAnswer(name, value) {
    this.answers[name] = value;
    this.emit('change', { kind: 'answer', name, value });
  }

  /** Forget remembered answers (e.g. the booth answers when the mission restarts from the line). */
  clearAnswers(names) {
    for (const name of names) delete this.answers[name];
    this.emit('change', { kind: 'answer', name: names.join(','), value: null });
  }

  // ---- encounters ----

  /**
   * Starts an encounter's suspicion count at its configured start value: "flaggedStart" instead of
   * "start" while the border crossing card is flagged (flag card_flagged).
   */
  startEncounter(name) {
    const cfg = this.encounterConfig.encounters?.[name];
    if (!cfg) throw new Error(`No encounter "${name}" in encounter_config.json`);
    const flagged = this.getFlag('card_flagged') === true && cfg.flaggedStart !== undefined;
    this.mission.encounter = name;
    this.mission.suspicion[name] = flagged ? cfg.flaggedStart : cfg.start;
    this.emit('change', { kind: 'suspicion', name, value: this.mission.suspicion[name] });
  }

  getSuspicion(name) {
    return this.mission.suspicion[name] ?? 0;
  }

  addSuspicion(name, delta, ctx = {}) {
    this.mission.suspicion[name] = this.getSuspicion(name) + delta;
    this.logChange('suspicion', name, delta, ctx);
    this.emit('change', { kind: 'suspicion', name, value: this.mission.suspicion[name] });
  }

  logChange(type, encounter, delta, { question = null, answer = null } = {}) {
    if (!delta) return;
    this.mission.log.push({ type, encounter: encounter ?? null, question_id: question, answer_id: answer, delta });
  }

  /** Any other entry for the mission log (e.g. being spotted, or an answer that changed nothing). */
  logEvent(entry) {
    this.mission.log.push({ ...entry });
    this.emit('change', { kind: 'log', name: entry.type, value: entry });
  }

  logSkip(question) {
    this.mission.skips.push({ encounter: this.mission.encounter, question_id: question });
    this.emit('change', { kind: 'skip', name: question, value: true });
  }

  /**
   * Applies dialogue effects, in order:
   *   { meter: 'loyalty', add: 1 } | { flag: 'tomi_involved', add: 1 } | { flag: 'ruiz_secret', set: true }
   *   | { answer: 'prologue_want', set: 'family' } | { clearAnswers: ['cover_story', ...] }
   *   | { suspicion: 'booth', add: 2 } (hidden) | { startEncounter: 'booth' } | { attempt: 1 } (adds)
   * Any effect may have "if" (a condition, see conditions.js) and "once" (a key: applied the first time
   * only, across mission restarts). ctx: { question, answer } ids for the mission log.
   */
  applyEffects(effects = [], ctx = {}) {
    for (const e of effects) {
      if (e.if !== undefined && !test(e.if, this)) continue;
      if (e.once !== undefined) {
        if (this.done.has(e.once)) continue;
        this.done.add(e.once);
      }
      if (e.meter !== undefined) this.changeMeter(e.meter, e.add, ctx);
      else if (e.suspicion !== undefined) this.addSuspicion(e.suspicion, e.add, ctx);
      else if (e.startEncounter !== undefined) this.startEncounter(e.startEncounter);
      else if (e.attempt !== undefined) {
        this.mission.attempt += e.attempt;
        this.emit('change', { kind: 'mission', name: 'attempt', value: this.mission.attempt });
      } else if (e.clearAnswers !== undefined) this.clearAnswers(e.clearAnswers);
      else if (e.flag !== undefined && e.set !== undefined) this.setFlag(e.flag, e.set);
      else if (e.flag !== undefined) this.addFlag(e.flag, e.add);
      else if (e.answer !== undefined) this.setAnswer(e.answer, e.set);
      else throw new Error(`Unknown effect: ${JSON.stringify(e)}`);
    }
  }

  assertMeter(name) {
    if (!METERS.includes(name)) throw new Error(`Unknown meter "${name}"`);
  }
}

/** The one shared game state. */
export const gameState = new GameState();
