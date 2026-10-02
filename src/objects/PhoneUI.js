import { pixelText, textWidth } from '../systems/pixelText.js';

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

/**
 * The corner phone: a small icon fixed to the camera in the bottom-right. States:
 *   idle    - dark screen
 *   ringing - lit screen, vibration shake, and the caller's name beside the icon
 *   call    - lit screen with a pulsing green "on call" dot (the call itself plays in speech bubbles)
 */
export default class PhoneUI {
  constructor(scene) {
    this.scene = scene;
    const cam = scene.cameras.main;
    this.x = cam.width - ICON_W - MARGIN;
    this.y = cam.height - ICON_H - MARGIN;
    this.state = 'idle';
    this.shakeX = 0;
    this.step = 0;

    this.icon = scene.add.sprite(this.x, this.y, PHONE_ICON_TEXTURE, 0).setOrigin(0, 0);
    this.label = pixelText(scene, 0, 0, '', { color: 0xf0d080 });
    this.dot = scene.add.rectangle(this.x + ICON_W - 4, this.y + 1, 3, 3, 0x40e070).setOrigin(0, 0);
    this.parts = [this.icon, this.label, this.dot];
    for (const p of this.parts) p.setScrollFactor(0).setDepth(PHONE_DEPTH);

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

  layout() {
    const lw = textWidth(this.scene, this.label.text);
    this.label.setPosition(Math.round(this.x - lw - 4) + this.shakeX, this.y + 8);
    this.icon.setPosition(this.x + this.shakeX, this.y);
    this.dot.setPosition(this.x + ICON_W - 4 + this.shakeX, this.y + 1);
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
