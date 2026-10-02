import DialogueInput from '../systems/DialogueInput.js';
import { ADVANCE_HINT, CHOICE_HINT, countAdvance, countChoice, showAdvanceHint, showChoiceHint } from '../systems/controlHints.js';
import SpeechBubble from './SpeechBubble.js';

const CHARS_PER_SECOND = 40;
const CALL_SPEED = 0.6; // Mateo walks at 60% speed for the whole call
const HEAD_ABOVE_FEET = 28; // bubble tail tip, px above Mateo's feet

/**
 * Dialogue presenter for phone calls, in speech bubbles. The caller's lines point at the corner
 * phone icon; Mateo's lines and choices sit above his head and follow him. One bubble at a time.
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
    this.typing = false;
    this.fullText = '';
    this.shown = 0;
    this.options = [];
    this.selected = 0;
    this.mateoBubble = false; // true while the bubble is above Mateo (prompts move below his feet)

    this.typeTimer = scene.time.addEvent({
      delay: 1000 / CHARS_PER_SECOND,
      loop: true,
      paused: true,
      callback: () => this.typeNext(),
    });
    this.blinkTimer = scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.blinkOn = !this.blinkOn;
        this.bubble.setIndicator(this.waiting && this.blinkOn);
      },
    });
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
    this.typing = false;
    this.waiting = false;
    this.typeTimer.paused = true;
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
    const fromCaller = node.speaker === this.caller;
    this.setMateoBubble(!fromCaller);
    this.fullText = node.text;
    this.bubble.showText(node.text, fromCaller ? this.callerAnchor : this.mateoAnchor);
    if (showAdvanceHint()) this.bubble.setHint(ADVANCE_HINT, { align: 'right', visible: false });
    this.fullText = this.bubble.full; // wrapped
    this.shown = 0;
    this.waiting = false;
    this.typing = true;
    this.typeTimer.paused = false;
  }

  typeNext() {
    if (!this.typing) return;
    this.shown += 1;
    while (this.fullText[this.shown - 1] === '\n' && this.shown < this.fullText.length) this.shown += 1;
    this.bubble.reveal(this.shown);
    if (this.shown >= this.fullText.length) this.finishTyping();
  }

  finishTyping() {
    this.typing = false;
    this.typeTimer.paused = true;
    this.bubble.reveal(this.fullText.length);
    this.waiting = true;
    this.blinkOn = true;
    this.bubble.setIndicator(true);
    if (showAdvanceHint()) this.bubble.setHintVisible(true);
  }

  // ---- choices ----

  showChoice(node) {
    this.typing = false;
    this.waiting = false;
    this.typeTimer.paused = true;
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
      if (this.typing) this.finishTyping();
      else {
        countAdvance();
        this.runner.advance();
      }
    }
  }
}
