import DialogueInput from '../systems/DialogueInput.js';
import { pixelText, wrapText } from '../systems/pixelText.js';
import { PHONE_DEPTH } from './PhoneUI.js';

const CHARS_PER_SECOND = 40;
const LINE_H = 10;
const CALL_SPEED = 0.6; // Mateo walks at 60% speed for the whole call
const SPEAKER_COLORS = { MATEO: 0x8fd0f0 };
const DEFAULT_SPEAKER_COLOR = 0xf0d080;
const COLORS = { text: 0xffffff, pick: 0xffe08a, other: 0xb8b0c0, indicator: 0xe8d8b0 };

/**
 * Dialogue presenter that plays a conversation inside the corner phone's screen.
 * Same controls as DialogueBox. Movement is not locked: Mateo walks at 60% speed for the call.
 * While a choice is on screen, movement pauses so W/S and the arrows only move the highlight.
 */
export default class PhonePresenter {
  constructor(scene, phone, player) {
    this.scene = scene;
    this.phone = phone;
    this.player = player;
    this.runner = null;
    this.input = new DialogueInput(scene);
    this.typing = false;
    this.fullText = '';
    this.shown = 0;
    this.options = [];
    this.optionTexts = [];
    this.selected = 0;

    const depth = PHONE_DEPTH + 1;
    this.label = pixelText(scene, 0, 0, '').setScrollFactor(0).setDepth(depth);
    this.body = pixelText(scene, 0, 0, '', { color: COLORS.text }).setScrollFactor(0).setDepth(depth);
    this.marker = pixelText(scene, 0, 0, '>', { color: COLORS.pick }).setScrollFactor(0).setDepth(depth);
    this.indicator = scene.add.graphics().setScrollFactor(0).setDepth(depth);
    this.indicator.fillStyle(COLORS.indicator).fillTriangle(0, 0, 6, 0, 3, 3);
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
        this.indicator.setVisible(this.indicatorWanted && this.blinkOn);
      },
    });
    this.clear();
  }

  get active() {
    return this.runner !== null;
  }

  present(runner) {
    this.runner = runner;
    this.input.drain();
    this.phone.startCall(runner.data.caller ?? '');
    this.player.setSpeedScale(CALL_SPEED);
    const a = this.phone.contentArea;
    this.indicator.setPosition(a.x + a.w - 6, a.y + a.h - 4);
    runner.on('line', (node) => this.showLine(node));
    runner.on('choice', (node) => this.showChoice(node));
    runner.on('end', () => this.finish());
  }

  finish() {
    this.clear();
    this.runner = null;
    this.player.setLocked(false);
    this.player.setSpeedScale(1);
    this.phone.endCall();
  }

  clear() {
    this.typing = false;
    this.typeTimer.paused = true;
    this.indicatorWanted = false;
    this.indicator.setVisible(false);
    this.label.setText('');
    this.body.setText('');
    this.marker.setVisible(false);
    this.clearOptions();
  }

  // ---- lines ----

  showLine(node) {
    this.clear();
    const a = this.phone.contentArea;
    this.label
      .setText(node.speaker)
      .setTint(SPEAKER_COLORS[node.speaker] ?? DEFAULT_SPEAKER_COLOR)
      .setPosition(a.x, a.y);
    this.fullText = wrapText(this.scene, node.text, a.w);
    this.shown = 0;
    this.body.setPosition(a.x, a.y + LINE_H + 1);
    this.typing = true;
    this.typeTimer.paused = false;
  }

  typeNext() {
    if (!this.typing) return;
    this.shown += 1;
    while (this.fullText[this.shown - 1] === '\n' && this.shown < this.fullText.length) this.shown += 1;
    this.body.setText(this.fullText.slice(0, this.shown));
    if (this.shown >= this.fullText.length) this.finishTyping();
  }

  finishTyping() {
    this.typing = false;
    this.typeTimer.paused = true;
    this.body.setText(this.fullText);
    this.indicatorWanted = true;
    this.blinkOn = true;
    this.indicator.setVisible(true);
  }

  // ---- choices ----

  showChoice(node) {
    this.clear();
    // Pause walking while choosing, so W/S and the arrows only move the highlight.
    this.player.setLocked(true);
    const a = this.phone.contentArea;
    this.options = node.options;
    this.selected = 0;
    let y = a.y;
    node.options.forEach((opt, i) => {
      const wrapped = wrapText(this.scene, `${i + 1}. ${opt.text}`, a.w - 8);
      const t = pixelText(this.scene, a.x + 8, y, wrapped, { color: COLORS.other })
        .setScrollFactor(0)
        .setDepth(PHONE_DEPTH + 1);
      this.optionTexts.push({ text: t, y });
      y += wrapped.split('\n').length * LINE_H + 3;
    });
    this.refreshChoice();
  }

  refreshChoice() {
    this.optionTexts.forEach(({ text }, i) => text.setTint(i === this.selected ? COLORS.pick : COLORS.other));
    this.marker.setVisible(true).setPosition(this.phone.contentArea.x, this.optionTexts[this.selected].y);
  }

  clearOptions() {
    for (const { text } of this.optionTexts) text.destroy();
    this.optionTexts = [];
    this.options = [];
  }

  pick(index) {
    if (index < 0 || index >= this.options.length) return;
    this.clear();
    this.player.setLocked(false);
    this.runner.choose(index);
  }

  // ---- input ----

  update() {
    if (!this.runner) return;
    const { space, up, down, pick } = this.input.read();
    if (this.options.length) {
      if (up) this.selected = (this.selected + this.options.length - 1) % this.options.length;
      else if (down) this.selected = (this.selected + 1) % this.options.length;
      if (up || down) this.refreshChoice();
      if (pick !== -1) this.pick(pick);
      else if (space) this.pick(this.selected);
    } else if (space) {
      if (this.typing) this.finishTyping();
      else this.runner.advance();
    }
  }
}
