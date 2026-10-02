import Phaser from 'phaser';
import { pixelText, textWidth, wrapText } from '../systems/pixelText.js';

// Layout, in screen pixels (everything is fixed to the camera).
const BOX = { x: 6, y: 196, w: 468, h: 68 };
const TEXT_X = BOX.x + 8;
const TEXT_Y = BOX.y + 9;
const TEXT_W = BOX.w - 16 - 10; // leaves room for the "more" indicator
const LINE_H = 10;
const TAG_H = 13;
const CHARS_PER_SECOND = 40;
const DEPTH = 4000;

const COLORS = { fill: 0x16121c, border: 0xe8d8b0, name: 0xf0d080, text: 0xffffff, pick: 0xffe08a, other: 0xb8b0c0 };

/**
 * Dialogue box presenter: a box along the bottom with a speaker tag, typewriter text, a blinking
 * "more" indicator, and a choice list.
 *
 * Controls: Space completes a line, then advances. Choices: W/S or up/down to highlight, Space to
 * confirm, 1-3 to pick directly. One key press is one action (holding Space does not repeat).
 * E does nothing here.
 */
export default class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.runner = null;
    this.fullText = '';
    this.shown = 0;
    this.typing = false;
    this.options = [];
    this.optionTexts = [];
    this.selected = 0;

    const kb = scene.input.keyboard;
    this.keys = {
      space: kb.addKey('SPACE'),
      up: kb.addKey('UP'),
      down: kb.addKey('DOWN'),
      w: kb.addKey('W'),
      s: kb.addKey('S'),
      n1: kb.addKey('ONE'),
      n2: kb.addKey('TWO'),
      n3: kb.addKey('THREE'),
    };

    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.drawBox();
    this.tagGfx = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.tagText = this.make(0, 0, '', COLORS.name);
    this.body = this.make(TEXT_X, TEXT_Y, '', COLORS.text);
    this.marker = this.make(TEXT_X, TEXT_Y, '>', COLORS.pick);
    this.indicator = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 1);
    this.indicator.fillStyle(COLORS.border).fillTriangle(0, 0, 6, 0, 3, 3);
    this.indicator.setPosition(BOX.x + BOX.w - 14, BOX.y + BOX.h - 12);

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
    this.blinkOn = true;
    this.indicatorWanted = false;
    this.setVisible(false);
  }

  make(x, y, text, color) {
    return pixelText(this.scene, x, y, text, { color }).setScrollFactor(0).setDepth(DEPTH + 1);
  }

  drawBox() {
    this.gfx.fillStyle(COLORS.fill, 1).fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
    this.gfx.lineStyle(1, COLORS.border).strokeRect(BOX.x + 0.5, BOX.y + 0.5, BOX.w - 1, BOX.h - 1);
  }

  setVisible(v) {
    this.visible = v;
    for (const o of [this.gfx, this.tagGfx, this.tagText, this.body, this.marker, this.indicator]) o.setVisible(v);
    if (!v) {
      this.indicatorWanted = false;
      this.clearOptions();
      this.marker.setVisible(false);
    }
  }

  get active() {
    return this.runner !== null;
  }

  /** Show a conversation. The runner drives it; call runner.start() afterwards. */
  present(runner) {
    this.runner = runner;
    this.drain();
    this.setVisible(true);
    this.marker.setVisible(false);
    runner.on('line', (node) => this.showLine(node));
    runner.on('choice', (node) => this.showChoice(node));
    runner.on('end', () => this.hide());
  }

  hide() {
    this.typeTimer.paused = true;
    this.typing = false;
    this.runner = null;
    this.setVisible(false);
    this.drain();
  }

  /** Throw away key presses that happened before/outside the dialogue so they can't act. */
  drain() {
    for (const k of Object.values(this.keys)) Phaser.Input.Keyboard.JustDown(k);
  }

  // ---- lines ----

  showLine(node) {
    this.clearOptions();
    this.marker.setVisible(false);
    this.setTag(node.speaker);
    this.fullText = wrapText(this.scene, node.text, TEXT_W);
    this.shown = 0;
    this.body.setText('').setPosition(TEXT_X, TEXT_Y);
    this.indicatorWanted = false;
    this.indicator.setVisible(false);
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
    this.shown = this.fullText.length;
    this.body.setText(this.fullText);
    this.indicatorWanted = true;
    this.blinkOn = true;
    this.indicator.setVisible(true);
  }

  setTag(name) {
    this.tagGfx.clear();
    this.tagText.setVisible(!!name);
    if (!name) return;
    const w = Math.ceil(textWidth(this.scene, name)) + 12;
    const x = BOX.x + 6;
    const y = BOX.y - TAG_H; // bottom edge shares the box's top border
    this.tagGfx.fillStyle(COLORS.fill, 1).fillRect(x, y, w, TAG_H);
    this.tagGfx.lineStyle(1, COLORS.border).strokeRect(x + 0.5, y + 0.5, w - 1, TAG_H - 1);
    this.tagText.setText(name).setPosition(x + 6, y + 2);
  }

  // ---- choices ----

  showChoice(node) {
    this.setTag('');
    this.body.setText('');
    this.typing = false;
    this.typeTimer.paused = true;
    this.indicatorWanted = false;
    this.indicator.setVisible(false);
    this.clearOptions();
    this.options = node.options;
    this.selected = 0;
    let y = TEXT_Y;
    node.options.forEach((opt, i) => {
      const wrapped = wrapText(this.scene, `${i + 1}. ${opt.text}`, TEXT_W - 12).split('\n').join('\n    ');
      const t = this.make(TEXT_X + 12, y, wrapped, COLORS.other);
      this.optionTexts.push({ text: t, y });
      y += (wrapped.split('\n').length) * LINE_H + 2;
    });
    this.refreshChoice();
  }

  refreshChoice() {
    this.optionTexts.forEach(({ text }, i) => text.setTint(i === this.selected ? COLORS.pick : COLORS.other));
    this.marker.setVisible(true).setPosition(TEXT_X, this.optionTexts[this.selected].y);
  }

  clearOptions() {
    for (const { text } of this.optionTexts) text.destroy();
    this.optionTexts = [];
    this.options = [];
  }

  pick(index) {
    if (index < 0 || index >= this.options.length) return;
    this.clearOptions();
    this.marker.setVisible(false);
    this.runner.choose(index);
  }

  // ---- input ----

  update() {
    if (!this.runner) return;
    const JD = Phaser.Input.Keyboard.JustDown;
    const k = this.keys;
    const space = JD(k.space);
    const up = JD(k.up) || JD(k.w);
    const down = JD(k.down) || JD(k.s);
    const n = [JD(k.n1), JD(k.n2), JD(k.n3)].indexOf(true);

    if (this.options.length) {
      if (up) this.selected = (this.selected + this.options.length - 1) % this.options.length;
      else if (down) this.selected = (this.selected + 1) % this.options.length;
      if (up || down) this.refreshChoice();
      if (n !== -1) this.pick(n);
      else if (space) this.pick(this.selected);
    } else if (space) {
      if (this.typing) this.finishTyping();
      else this.runner.advance();
    }
  }
}
