import Phaser from 'phaser';
import { pixelText } from '../systems/pixelText.js';

const HINT_MS = 3000;   // how long each hint stays up (the prologue's hints use the same)
const GAP_MS = 250;     // between one hint and the next
const ABOVE_HEAD = 30;  // px above Mateo's feet: just over his head and the interaction prompt
const DEPTH = 3000;
const BACK = { color: 0x16121c, alpha: 0.75, padX: 3, padY: 2 }; // keeps it readable over busy walls

/**
 * Short hints above Mateo's head (the prologue's near-player messages), one at a time: a hint that
 * arrives while another is showing waits its turn, in order of arrival.
 */
export default class HintQueue {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.queue = [];
    this.current = null;
    this.timer = null;
    this.back = scene.add.graphics().setDepth(DEPTH - 1).setVisible(false);
  }

  /** True while a hint is showing. */
  get showing() {
    return this.current !== null;
  }

  show(text) {
    this.queue.push(text);
    if (!this.current && !this.timer) this.next();
  }

  next() {
    this.timer = null;
    const text = this.queue.shift();
    if (text === undefined) return;
    this.current = pixelText(this.scene, 0, 0, text).setOrigin(0.5, 1).setDepth(DEPTH);
    this.position();
    this.scene.time.delayedCall(HINT_MS, () => {
      this.current?.destroy();
      this.current = null;
      this.back.setVisible(false);
      this.timer = this.scene.time.delayedCall(GAP_MS, () => this.next());
    });
  }

  /** Keeps the hint over Mateo and on screen (call every frame). */
  position() {
    const msg = this.current;
    if (!msg) return;
    const cam = this.scene.cameras.main;
    const half = msg.width / 2;
    const x = Phaser.Math.Clamp(this.player.x, cam.scrollX + half + 4, cam.scrollX + cam.width - half - 4);
    const y = Math.max(cam.scrollY + msg.height + 2, this.player.y - ABOVE_HEAD);
    msg.setPosition(Math.round(x), Math.round(y));
    const { padX, padY } = BACK;
    this.back.clear().fillStyle(BACK.color, BACK.alpha)
      .fillRect(msg.x - Math.ceil(msg.width / 2) - padX, msg.y - msg.height - padY, Math.ceil(msg.width) + padX * 2, msg.height + padY * 2 - 1)
      .setVisible(true);
  }

  update() {
    this.position();
  }
}
