import { pixelText, textWidth, wrapText } from '../systems/pixelText.js';

const MAX_W = 160;   // text wraps at this width
const PAD_X = 5;
const PAD_Y = 4;
const LINE_H = 10;
const TAIL = 6;      // tail length in px
const RADIUS = 4;
const EDGE = 2;      // keep this far from the screen edges
export const BUBBLE_DEPTH = 3600; // above the phone icon, below the dialogue box
const COLORS = { fill: 0xf4f0e4, line: 0x181214, text: 0x201820, pick: 0x2050a0, other: 0x80788a };

/**
 * A rounded, outlined speech bubble with a tail, in screen space (fixed to the camera), clamped
 * fully on screen. It shows either a line of text (revealed a character at a time by the caller)
 * or a choice list. The tail points at an anchor that can move (call update() every frame).
 */
export default class SpeechBubble {
  constructor(scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(BUBBLE_DEPTH);
    this.body = this.make('', COLORS.text);
    this.marker = this.make('>', COLORS.pick);
    this.indicator = scene.add.graphics().setScrollFactor(0).setDepth(BUBBLE_DEPTH + 1);
    this.indicator.fillStyle(COLORS.line).fillTriangle(0, 0, 5, 0, 2.5, 3);
    this.hintText = this.make('', COLORS.other); // small control hints, set by the presenter
    this.options = [];
    this.anchorFn = null;
    this.visible = false;
    this.hide();
  }

  make(text, color) {
    return pixelText(this.scene, 0, 0, text, { color })
      .setDropShadow(0, 0, 0, 0)
      .setScrollFactor(0)
      .setDepth(BUBBLE_DEPTH + 1);
  }

  /** Text bubble sized for the full line; reveal(n) shows the first n characters. */
  showText(text, anchorFn) {
    this.clearOptions();
    this.anchorFn = anchorFn;
    this.full = wrapText(this.scene, text, MAX_W);
    const lines = this.full.split('\n');
    this.contentW = Math.max(...lines.map((l) => textWidth(this.scene, l)));
    this.contentH = lines.length * LINE_H;
    this.body.setText('');
    this.marker.setVisible(false);
    this.setIndicator(false);
    this.show();
  }

  reveal(n) {
    this.body.setText(this.full.slice(0, n));
  }

  showChoices(options, anchorFn) {
    this.clearOptions();
    this.anchorFn = anchorFn;
    this.body.setText('');
    this.setIndicator(false);
    let h = 0;
    let w = 0;
    for (const [i, opt] of options.entries()) {
      const wrapped = wrapText(this.scene, `${i + 1}. ${opt.text}`, MAX_W - 8);
      const t = this.make(wrapped, COLORS.other);
      const lines = wrapped.split('\n');
      this.options.push({ text: t, dy: h });
      w = Math.max(w, ...lines.map((l) => textWidth(this.scene, l)) );
      h += lines.length * LINE_H + 2;
    }
    this.contentW = w + 8;
    this.contentH = h - 2;
    this.marker.setVisible(true);
    this.setSelected(0);
    this.show();
  }

  setSelected(i) {
    this.selected = i;
    this.options.forEach(({ text }, j) => text.setTint(j === i ? COLORS.pick : COLORS.other));
    this.layout();
  }

  /** Small grey hint text under the content (e.g. control hints); '' for none. */
  setHint(text) {
    this.hintText.setText(text);
    this.layout();
  }

  setIndicator(on) {
    this.indicatorOn = on;
    this.indicator.setVisible(on && this.visible);
  }

  clearOptions() {
    for (const { text } of this.options) text.destroy();
    this.options = [];
  }

  show() {
    this.visible = true;
    this.gfx.setVisible(true);
    this.body.setVisible(true);
    this.hintText.setVisible(true);
    this.layout();
  }

  hide() {
    this.visible = false;
    this.clearOptions();
    for (const o of [this.gfx, this.body, this.marker, this.indicator, this.hintText]) o.setVisible(false);
  }

  /** Follow the anchor (e.g. Mateo walking). */
  update() {
    if (this.visible) this.layout();
  }

  layout() {
    if (!this.visible || !this.anchorFn) return;
    const cam = this.scene.cameras.main;
    const a = this.anchorFn();
    const hintW = this.hintText.text ? textWidth(this.scene, this.hintText.text) : 0;
    const hintH = this.hintText.text ? LINE_H + 1 : 0;
    const w = Math.ceil(Math.max(this.contentW, hintW)) + PAD_X * 2 + (this.indicatorSpace() ? 6 : 0);
    const h = this.contentH + hintH + PAD_Y * 2;
    // Prefer centred above the anchor; clamp fully on screen.
    let bx = Math.round(a.x - w / 2);
    let by = Math.round(a.y - TAIL - h);
    bx = Math.max(EDGE, Math.min(cam.width - EDGE - w, bx));
    by = Math.max(EDGE, Math.min(cam.height - EDGE - h - TAIL, by));

    const g = this.gfx.clear();
    // Tail: base on the bottom edge under the anchor, tip at the anchor (clamped to stay short).
    const tx = Math.max(bx + RADIUS + 3, Math.min(bx + w - RADIUS - 3, Math.round(a.x)));
    const tipX = Math.max(tx - 8, Math.min(tx + 8, Math.round(a.x)));
    const tipY = by + h + TAIL;
    g.fillStyle(COLORS.fill).fillRoundedRect(bx, by, w, h, RADIUS);
    g.lineStyle(1, COLORS.line).strokeRoundedRect(bx + 0.5, by + 0.5, w - 1, h - 1, RADIUS);
    g.fillStyle(COLORS.fill).fillTriangle(tx - 3, by + h - 1, tx + 3, by + h - 1, tipX, tipY);
    g.lineStyle(1, COLORS.line).lineBetween(tx - 3.5, by + h - 0.5, tipX, tipY).lineBetween(tx + 3.5, by + h - 0.5, tipX, tipY);

    const cx = bx + PAD_X;
    const cy = by + PAD_Y;
    this.body.setPosition(cx, cy);
    for (const { text, dy } of this.options) text.setPosition(cx + 8, cy + dy);
    if (this.options.length) this.marker.setPosition(cx, cy + this.options[this.selected].dy);
    this.hintText.setPosition(cx, cy + this.contentH + 1);
    this.indicator.setPosition(bx + w - PAD_X - 5, by + h - PAD_Y - 3);
    this.indicator.setVisible(this.indicatorOn && this.visible);
    this.bounds = { x: bx, y: by, w, h };
  }

  indicatorSpace() {
    return this.options.length === 0;
  }
}
