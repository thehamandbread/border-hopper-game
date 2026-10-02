import Phaser from 'phaser';
import { pixelText, textWidth, wrapText } from '../systems/pixelText.js';

export const PHONE_ICON_TEXTURE = 'phone_icon';
export const PHONE_UI_TEXTURE = 'phone_ui'; // the large texting phone
const ICON_W = 16;
const ICON_H = 24;
const MARGIN = 6;
export const PHONE_DEPTH = 3500; // above world text and the HUD, below the dialogue box (4000)

const BUZZ_MS = 40;     // shake step
const BUZZ_STEPS = 10;  // steps of shaking per buzz
const REST_STEPS = 15;  // still steps between buzzes
const CALL_DOT_MS = 400;

// Expanded texting phone (phone_ui.png is 112x150; its screen area is x 6, y 16, w 100, h 118).
const BIG_W = 112;
const BIG_H = 150;
const BIG_SCREEN = { x: 6, y: 16, w: 100, h: 118 };
const SLIDE_MS = 260;
const TEXT_DEPTH = PHONE_DEPTH + 60;
const MSG_WRAP = 84;

/**
 * The corner phone: a small icon fixed to the camera in the bottom-right. States:
 *   idle    - dark screen
 *   ringing - lit screen, vibration shake, and the caller's name beside the icon
 *   call    - lit screen with a pulsing green "on call" dot (the call itself plays in speech bubbles)
 *
 * Texting: receiveText() stores a message, buzzes and shows an unread badge. Q opens the expanded
 * phone (it slides up from the corner) showing the thread; Q closes it. Emits 'opened' and 'closed'
 * so the scene can hold Mateo still while it's open (the world keeps going).
 */
export default class PhoneUI extends Phaser.Events.EventEmitter {
  constructor(scene, { canOpen = () => true } = {}) {
    super();
    this.scene = scene;
    this.canOpen = canOpen;
    this.messages = []; // { from, text }
    this.unread = 0;
    this.expanded = false;
    const cam = scene.cameras.main;
    this.x = cam.width - ICON_W - MARGIN;
    this.y = cam.height - ICON_H - MARGIN;
    this.state = 'idle';
    this.shakeX = 0;
    this.step = 0;

    this.icon = scene.add.sprite(this.x, this.y, PHONE_ICON_TEXTURE, 0).setOrigin(0, 0);
    this.label = pixelText(scene, 0, 0, '', { color: 0xf0d080 });
    this.dot = scene.add.rectangle(this.x + ICON_W - 4, this.y + 1, 3, 3, 0x40e070).setOrigin(0, 0);
    this.badge = scene.add.rectangle(this.x - 1, this.y - 1, 5, 5, 0xff3a30).setOrigin(0, 0).setVisible(false);
    this.parts = [this.icon, this.label, this.dot, this.badge];
    for (const p of this.parts) p.setScrollFactor(0).setDepth(PHONE_DEPTH);
    this.badge.setDepth(PHONE_DEPTH + 1);
    this.qKey = scene.input.keyboard.addKey('Q');
    this.big = [];

    this.buzzTimer = scene.time.addEvent({ delay: BUZZ_MS, loop: true, callback: () => this.buzz() });
    this.dotTimer = scene.time.addEvent({
      delay: CALL_DOT_MS,
      loop: true,
      callback: () => this.dot.setAlpha(this.dot.alpha === 1 ? 0.3 : 1),
    });
    this.setIdle();
  }

  /** Screen point a speech bubble's tail should point at (the icon's upper-left). */
  get iconAnchor() {
    return { x: this.x + 2 + this.shakeX, y: this.y + 4 };
  }

  setIdle() {
    this.state = 'idle';
    this.icon.setFrame(0);
    this.label.setText('');
    this.dot.setVisible(false);
    this.setShake(0);
  }

  ring(caller) {
    this.state = 'ringing';
    this.icon.setFrame(1);
    this.label.setText(caller);
    this.dot.setVisible(false);
    this.step = 0;
    this.layout();
  }

  startCall() {
    this.state = 'call';
    this.icon.setFrame(1);
    this.label.setText('');
    this.dot.setVisible(true).setAlpha(1);
    this.setShake(0);
  }

  endCall() {
    this.setIdle();
  }

  // ---- texting ----

  /** A text arrives: buzz, and show the unread badge until the phone is opened. */
  receiveText(msg) {
    this.messages.push(msg);
    this.unread += 1;
    this.badge.setVisible(true);
    this.buzzOnce();
  }

  buzzOnce() {
    let n = 0;
    this.scene.time.addEvent({
      delay: BUZZ_MS,
      repeat: BUZZ_STEPS - 1,
      callback: () => this.setShake(++n >= BUZZ_STEPS ? 0 : n % 2 ? 1 : -1),
    });
  }

  update() {
    if (!Phaser.Input.Keyboard.JustDown(this.qKey)) return;
    if (this.expanded) this.close();
    else if (this.state === 'idle' && this.canOpen()) this.open();
  }

  open() {
    if (this.expanded) return;
    this.expanded = true;
    this.unread = 0;
    this.badge.setVisible(false);
    this.buildThread();
    this.slide(1, 0);
    this.emit('opened');
  }

  close() {
    if (!this.expanded) return;
    this.expanded = false;
    this.slide(0, 1, () => {
      for (const o of this.big) o.destroy();
      this.big = [];
    });
    this.emit('closed');
  }

  /** Builds the expanded phone: sender name, message bubbles, and the "Q: close" hint. */
  buildThread() {
    for (const o of this.big) o.destroy();
    const cam = this.scene.cameras.main;
    const bx = cam.width - BIG_W - 8;
    const by = cam.height - BIG_H - 4;
    const sx = bx + BIG_SCREEN.x;
    const sy = by + BIG_SCREEN.y;
    const add = (o, depth = TEXT_DEPTH) => {
      o.setScrollFactor(0).setDepth(depth);
      o.baseY = o.y;
      this.big.push(o);
      return o;
    };
    add(this.scene.add.image(bx, by, PHONE_UI_TEXTURE).setOrigin(0, 0), TEXT_DEPTH - 1);
    const from = this.messages.length ? this.messages[this.messages.length - 1].from : 'Messages';
    // Sender name, wrapped to the screen width (e.g. "Unknown number" needs two lines).
    const fromText = wrapText(this.scene, from, BIG_SCREEN.w - 8);
    const fromLines = fromText.split('\n').length;
    add(pixelText(this.scene, sx + 4, sy + 3, fromText, { color: 0xf0d080 }));
    const ruleY = sy + 3 + fromLines * 10;
    add(this.scene.add.rectangle(sx + 4, ruleY, BIG_SCREEN.w - 8, 1, 0x2c3448).setOrigin(0, 0));
    let y = ruleY + 5;
    if (!this.messages.length) add(pixelText(this.scene, sx + 4, y, 'No messages.', { color: 0x8890a0 }));
    for (const m of this.messages) {
      const wrapped = wrapText(this.scene, m.text, MSG_WRAP);
      const lines = wrapped.split('\n');
      const w = Math.ceil(Math.max(...lines.map((l) => textWidth(this.scene, l)))) + 8;
      const h = lines.length * 10 + 5;
      const g = this.scene.add.graphics();
      g.fillStyle(0x2a3448).fillRoundedRect(sx + 4, y, w, h, 3);
      add(g);
      g.baseY = 0;
      g.offsetOnly = true;
      add(pixelText(this.scene, sx + 8, y + 3, wrapped));
      y += h + 4;
    }
    const hint = pixelText(this.scene, 0, sy + BIG_SCREEN.h - 11, 'Q: close', { color: 0x8890a0 });
    hint.setX(Math.round(sx + (BIG_SCREEN.w - textWidth(this.scene, 'Q: close')) / 2));
    add(hint);
  }

  /** Slide the expanded phone between hidden (1) and shown (0). */
  slide(from, to, onComplete) {
    const off = BIG_H + 10;
    this.scene.tweens.addCounter({
      from,
      to,
      duration: SLIDE_MS,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const dy = Math.round(tw.getValue() * off);
        for (const o of this.big) o.y = (o.offsetOnly ? 0 : o.baseY) + dy;
      },
      onComplete,
    });
  }

  layout() {
    const lw = textWidth(this.scene, this.label.text);
    this.label.setPosition(Math.round(this.x - lw - 4) + this.shakeX, this.y + 8);
    this.icon.setPosition(this.x + this.shakeX, this.y);
    this.dot.setPosition(this.x + ICON_W - 4 + this.shakeX, this.y + 1);
    this.badge.setPosition(this.x - 1 + this.shakeX, this.y - 1);
  }

  setShake(dx) {
    this.shakeX = dx;
    this.layout();
  }

  /** Vibration: alternate 1 px left/right in short bursts while ringing. */
  buzz() {
    if (this.state !== 'ringing') return;
    this.step = (this.step + 1) % (BUZZ_STEPS + REST_STEPS);
    const dx = this.step < BUZZ_STEPS ? (this.step % 2 ? 1 : -1) : 0;
    if (dx !== this.shakeX) this.setShake(dx);
  }
}
