import Phaser from 'phaser';
import { pixelText } from '../systems/pixelText.js';

// Dev-only (never shipped: registered by DevMenu.js, which only loads in dev builds). Where Mission 2's
// crossing leads (both pass paths) until the yard is built. Any key opens the checkpoint menu.
export default class YardStubScene extends Phaser.Scene {
  constructor() {
    super('YardStubScene');
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000');
    const t = pixelText(this, 0, 0, 'The Yard (next build)');
    t.setPosition(Math.round((cam.width - t.width) / 2), Math.round((cam.height - t.height) / 2));
    this.time.delayedCall(600, () => {
      this.input.keyboard.once('keydown', () => this.game.devTools?.setOpen(true));
    });
  }
}
