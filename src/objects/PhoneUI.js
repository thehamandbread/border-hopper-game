import { pixelText, textWidth } from '../systems/pixelText.js';

export const PHONE_UI_TEXTURE = 'phone_ui';
// phone_ui.png is 112x150; its screen area (see tools/art/README.md) is x 6, y 16, w 100, h 118.
const W = 112;
const H = 150;
const SCREEN = { x: 6, y: 16, w: 100, h: 118 };
const MARGIN = 4;
export const PHONE_DEPTH = 3500; // above world text and the HUD, below the dialogue box (4000)

const BUZZ_MS = 40;     // shake step
const BUZZ_STEPS = 10;  // steps of shaking per buzz
const REST_STEPS = 15;  // still steps between buzzes

/**
 * The corner phone, fixed to the camera in the bottom-right. States:
 *   idle    - dark screen
 *   ringing - caller name, "calling...", and a vibration shake
 *   call    - caller name as a header; a presenter draws the call inside contentArea
 */
export default class PhoneUI {
  constructor(scene) {
    this.scene = scene;
    this.x = scene.cameras.main.width - W - MARGIN;
    this.y = scene.cameras.main.height - H - MARGIN;
    this.state = 'idle';
    this.shakeX = 0;
    this.step = 0;

    this.image = scene.add.image(this.x, this.y, PHONE_UI_TEXTURE).setOrigin(0, 0);
    this.callerBig = pixelText(scene, 0, 0, '', { size: 16 });
    this.sub = pixelText(scene, 0, 0, '', { color: 0xa0a8b8 });
    this.header = pixelText(scene, 0, 0, '', { color: 0xf0d080 });
    this.rule = scene.add.graphics();
    this.parts = [this.image, this.callerBig, this.sub, this.header, this.rule];
    for (const p of this.parts) p.setScrollFactor(0).setDepth(PHONE_DEPTH);

    this.buzzTimer = scene.time.addEvent({ delay: BUZZ_MS, loop: true, callback: () => this.buzz() });
    this.setIdle();
  }

  /** Screen area in screen pixels. */
  get screen() {
    return { x: this.x + SCREEN.x, y: this.y + SCREEN.y, w: SCREEN.w, h: SCREEN.h };
  }

  /** Where a presenter draws call content during a call: below the header. */
  get contentArea() {
    const s = this.screen;
    return { x: s.x + 4, y: s.y + 17, w: s.w - 8, h: s.h - 21 };
  }

  setIdle() {
    this.state = 'idle';
    this.callerBig.setText('');
    this.sub.setText('');
    this.header.setText('');
    this.rule.clear();
    this.setShake(0);
  }

  ring(caller) {
    this.state = 'ringing';
    this.caller = caller;
    this.header.setText('');
    this.rule.clear();
    this.callerBig.setText(caller);
    this.sub.setText('calling...');
    this.step = 0;
    this.layout();
  }

  startCall(caller) {
    this.state = 'call';
    this.caller = caller;
    this.callerBig.setText('');
    this.sub.setText('');
    this.header.setText(caller);
    this.setShake(0);
    this.layout();
  }

  endCall() {
    this.setIdle();
  }

  layout() {
    const s = this.screen;
    const cx = (t, size = 8) => Math.round(s.x + (s.w - textWidth(this.scene, t.text, size)) / 2) + this.shakeX;
    this.callerBig.setPosition(cx(this.callerBig, 16), s.y + 34);
    this.sub.setPosition(cx(this.sub), s.y + 56);
    this.header.setPosition(cx(this.header), s.y + 4);
    this.rule.clear();
    if (this.state === 'call') {
      this.rule.fillStyle(0x2c3448).fillRect(s.x + 4, s.y + 14, s.w - 8, 1);
    }
    this.image.setPosition(this.x + this.shakeX, this.y);
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
