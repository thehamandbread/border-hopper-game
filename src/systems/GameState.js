import Phaser from 'phaser';

const METERS = ['loyalty', 'heat', 'conscience'];

/**
 * In-memory game state (no saving yet).
 *  - meters:  loyalty, heat, conscience (start at 0)
 *  - flags:   named values, e.g. tomi_involved (a count), ruiz_secret (true); read as 0 until set.
 *             Carried items are flags too: has_<item> (e.g. has_envelope), see giveItem().
 *  - answers: named remembered strings, e.g. prologue_want (read as null until set)
 *  - uses:    control-use counts for control hints (reset with everything else)
 * Emits 'change' ({ kind, name, value }) whenever anything is modified.
 */
export default class GameState extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.meters = Object.fromEntries(METERS.map((m) => [m, 0]));
    this.flags = {};
    this.answers = {};
    this.uses = {}; // how often the player has used a control (for control hints), e.g. advance, choose
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

  changeMeter(name, amount) {
    this.setMeter(name, this.getMeter(name) + amount);
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

  /**
   * Applies dialogue effects:
   *   { meter: 'loyalty', add: 1 } | { flag: 'tomi_involved', add: 1 } | { flag: 'ruiz_secret', set: true }
   *   | { answer: 'prologue_want', set: 'family' }
   */
  applyEffects(effects = []) {
    for (const e of effects) {
      if (e.meter !== undefined) this.changeMeter(e.meter, e.add);
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
