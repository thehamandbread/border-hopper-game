import DialogueInput from '../systems/DialogueInput.js';
import { ADVANCE_HINT, CHOICE_HINT, countAdvance, countChoice, showAdvanceHint, showChoiceHint } from '../systems/controlHints.js';
import { pixelText, textWidth, wrapText } from '../systems/pixelText.js';
import Typewriter, { lineSpeed, parsePauses } from '../systems/Typewriter.js';
import SpeechBubble, { BUBBLE_DEPTH } from './SpeechBubble.js';

const CALL_SPEED = 0.6; // Mateo walks at 60% speed for the whole call
const HEAD_ABOVE_FEET = 28; // bubble tail tip, px above Mateo's feet
const NARRATION = { y: 8, w: 160, color: 0x98a4bc }; // narrow enough to clear the task list (top left)

/**
 * Dialogue presenter for phone calls, in speech bubbles. The caller's lines point at the corner
 * phone icon; Mateo's lines and choices sit above his head and follow him. One bubble at a time.
 * Narration shows as a small line of muted text at the top centre of the screen, not in a bubble.
 * Same controls as DialogueBox. Mateo walks at 60% for the call; while a choice is showing he
 * stands still, so W/S and the arrows only move the highlight.
 */
export default class PhonePresenter {
  constructor(scene, phone, player) {
    this.scene = scene;
    this.phone = phone;
    this.player = player;
    this.runner = null;
    this.input = new DialogueInput(scene);
    this.bubble = new SpeechBubble(scene);
    this.options = [];
    this.selected = 0;
    this.mateoBubble = false; // true while the bubble is above Mateo (prompts move below his feet)

    this.narrating = false; // the current line is narration (top-centre text, no bubble)
    this.narration = pixelText(scene, 0, NARRATION.y, '', { color: NARRATION.color }).setScrollFactor(0).setDepth(BUBBLE_DEPTH + 1);
    this.narrationIndicator = scene.add.graphics().setScrollFactor(0).setDepth(BUBBLE_DEPTH + 1);
    this.narrationIndicator.fillStyle(NARRATION.color).fillTriangle(0, 0, 5, 0, 2.5, 3);
    this.hideNarration();

    this.typer = new Typewriter(scene, {
      onReveal: (n) => (this.narrating ? this.narration.setText(this.typer.text.slice(0, n)) : this.bubble.reveal(n)),
      onDone: () => this.finishTyping(),
    });
    this.blinkTimer = scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.blinkOn = !this.blinkOn;
        this.setIndicator(this.waiting && this.blinkOn);
      },
    });
  }

  setIndicator(on) {
    if (this.narrating) this.narrationIndicator.setVisible(on);
    else this.bubble.setIndicator(on);
  }

  hideNarration() {
    this.narrating = false;
    this.narration.setText('').setVisible(false);
    this.narrationIndicator.setVisible(false);
  }

  get active() {
    return this.runner !== null;
  }

  present(runner) {
    this.runner = runner;
    this.caller = runner.data.caller ?? '';
    this.input.drain();
    this.phone.startCall(this.caller);
    this.player.setSpeedScale(CALL_SPEED);
    runner.on('line', (node) => this.showLine(node));
    runner.on('choice', (node) => this.showChoice(node));
    runner.on('end', () => this.finish());
  }

  finish() {
    this.waiting = false;
    this.typer.stop();
    this.hideNarration();
    this.bubble.hide();
    this.setMateoBubble(false);
    this.runner = null;
    this.options = [];
    this.player.setLocked(false);
    this.player.setSpeedScale(1);
    this.phone.endCall();
  }

  callerAnchor = () => this.phone.iconAnchor;

  mateoAnchor = () => {
    const cam = this.scene.cameras.main;
    return { x: Math.round(this.player.x - cam.scrollX), y: Math.round(this.player.y - HEAD_ABOVE_FEET - cam.scrollY) };
  };

  setMateoBubble(on) {
    this.mateoBubble = on;
    this.scene.interactions?.setPromptBelowFeet(on);
  }

  // ---- lines ----

  showLine(node) {
    this.options = [];
    this.waiting = false;
    const { text, pauses } = parsePauses(node.text);
    const timing = { pauses, speed: lineSpeed(node), pauseAfter: node.pauseAfter };
    if (node.type === 'narration') {
      this.showNarration(text, timing);
      return;
    }
    this.hideNarration();
    const fromCaller = node.speaker === this.caller;
    this.setMateoBubble(!fromCaller);
    this.bubble.showText(text, fromCaller ? this.callerAnchor : this.mateoAnchor);
    if (showAdvanceHint()) this.bubble.setHint(ADVANCE_HINT, { align: 'right', visible: false });
    this.typer.start(this.bubble.full, timing); // bubble.full is the wrapped text
  }

  /** Narration: no bubble; a left-aligned block centred at the top of the screen. */
  showNarration(text, timing) {
    this.bubble.hide();
    this.setMateoBubble(false);
    this.narrating = true;
    const cam = this.scene.cameras.main;
    const wrapped = wrapText(this.scene, text, NARRATION.w);
    const lines = wrapped.split('\n');
    const x = Math.round((cam.width - Math.max(...lines.map((l) => textWidth(this.scene, l)))) / 2);
    this.narration.setPosition(x, NARRATION.y).setVisible(true);
    const last = lines[lines.length - 1];
    this.narrationIndicator.setPosition(Math.round(x + textWidth(this.scene, last) + 3), NARRATION.y + (lines.length - 1) * 10 + 3);
    this.narrationIndicator.setVisible(false);
    this.typer.start(wrapped, timing);
  }

  finishTyping() {
    this.waiting = true;
    this.blinkOn = true;
    this.setIndicator(true);
    if (!this.narrating && showAdvanceHint()) this.bubble.setHintVisible(true);
  }

  // ---- choices ----

  showChoice(node) {
    this.waiting = false;
    this.typer.stop();
    this.hideNarration();
    this.player.setLocked(true); // stand still while choosing
    this.setMateoBubble(true);
    this.options = node.options;
    this.selected = 0;
    this.bubble.showChoices(node.options, this.mateoAnchor);
    if (showChoiceHint()) this.bubble.setHint(CHOICE_HINT);
  }

  pick(index) {
    if (index < 0 || index >= this.options.length) return;
    countChoice();
    this.options = [];
    this.player.setLocked(false);
    this.runner.choose(index);
  }

  // ---- input ----

  update() {
    this.bubble.update();
    if (!this.runner) return;
    const { space, up, down, pick } = this.input.read();
    if (this.options.length) {
      const n = this.options.length;
      if (up) this.selected = (this.selected + n - 1) % n;
      else if (down) this.selected = (this.selected + 1) % n;
      if (up || down) this.bubble.setSelected(this.selected);
      if (pick !== -1) this.pick(pick);
      else if (space) this.pick(this.selected);
    } else if (space) {
      if (this.typer.busy) this.typer.complete();
      else {
        countAdvance();
        this.runner.advance();
      }
    }
  }
}
