const CHARS_PER_SECOND = 40;
export const NARRATION_SPEED = 0.7; // narration types slower than speech unless the node sets "speed"
const PAUSE_MARKER = /\{p:(\d+)\}/g;

/** Typing speed multiplier for a line or narration node. */
export function lineSpeed(node) {
  return node.speed ?? (node.type === 'narration' ? NARRATION_SPEED : 1);
}

/**
 * Strips inline pause markers ({p:600} = hold 600 ms there) from a line's text. Each pause is kept
 * as the number of non-space characters before it, so it survives word wrapping.
 */
export function parsePauses(raw) {
  const pauses = [];
  let text = '';
  let last = 0;
  for (const m of raw.matchAll(PAUSE_MARKER)) {
    text += raw.slice(last, m.index);
    pauses.push({ after: text.replace(/\s/g, '').length, ms: Number(m[1]) });
    last = m.index + m[0].length;
  }
  return { text: text + raw.slice(last), pauses };
}

/** Index in `text` just after its `count`th non-space character (0 = the start). */
function indexAfter(text, count) {
  if (count === 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (!/\s/.test(text[i]) && ++seen === count) return i + 1;
  }
  return text.length;
}

/**
 * The typewriter shared by the dialogue presenters: reveals a (wrapped) line a character at a time
 * at 40 chars/s times the line's speed, holds at inline pauses, then holds `pauseAfter` ms before
 * calling onDone (when the presenter shows its advance indicator). complete() skips straight to done.
 */
export default class Typewriter {
  constructor(scene, { onReveal, onDone }) {
    this.scene = scene;
    this.onReveal = onReveal;
    this.onDone = onDone;
    this.text = '';
    this.shown = 0;
    this.pauses = [];
    this.busy = false; // typing, or holding at a pause; complete() ends it
    this.hold = null;
    this.timer = scene.time.addEvent({
      delay: 1000 / CHARS_PER_SECOND,
      loop: true,
      paused: true,
      callback: () => this.tick(),
    });
  }

  /** text: the already-wrapped line; pauses: from parsePauses(). */
  start(text, { pauses = [], speed = 1, pauseAfter = 0 } = {}) {
    this.stop();
    this.text = text;
    this.shown = 0;
    this.pauses = pauses.map((p) => ({ at: indexAfter(text, p.after), ms: p.ms }));
    this.pauseAfter = pauseAfter;
    this.timer.timeScale = speed;
    this.busy = true;
    this.onReveal(0);
    if (!this.pauseHere()) this.timer.paused = false;
  }

  tick() {
    this.shown += 1;
    while (this.text[this.shown - 1] === '\n' && this.shown < this.text.length) this.shown += 1;
    this.onReveal(this.shown);
    if (this.pauseHere()) this.timer.paused = true;
    else if (this.shown >= this.text.length) this.typed();
  }

  /** Starts a hold if an inline pause sits at the current position. */
  pauseHere() {
    const i = this.pauses.findIndex((p) => p.at === this.shown);
    if (i === -1) return false;
    const [{ ms }] = this.pauses.splice(i, 1);
    this.timer.paused = true;
    this.hold = this.scene.time.delayedCall(ms, () => {
      this.hold = null;
      if (this.shown >= this.text.length) this.typed();
      else this.timer.paused = false;
    });
    return true;
  }

  /** All characters are out; hold pauseAfter, then done. */
  typed() {
    this.timer.paused = true;
    if (this.pauseAfter > 0) this.hold = this.scene.time.delayedCall(this.pauseAfter, () => this.complete());
    else this.complete();
  }

  /** Shows the whole line at once and ends any pause. */
  complete() {
    this.stop();
    this.shown = this.text.length;
    this.onReveal(this.shown);
    this.onDone();
  }

  stop() {
    this.timer.paused = true;
    this.hold?.remove();
    this.hold = null;
    this.busy = false;
  }
}
