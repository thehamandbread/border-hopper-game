import Phaser from 'phaser';
import { gameState } from '../systems/GameState.js';
import { pixelText } from '../systems/pixelText.js';

/**
 * Placeholder for Mission 1, Scene 4 (Three Hills), where the crossing's pass paths end until it's
 * built. A line of text on black; any key opens the checkpoint menu (dev) or starts the game over.
 * data: { label } replaces the text (e.g. for another part that isn't built yet).
 */
export default class ThreeHillsStubScene extends Phaser.Scene {
  constructor() {
    super('ThreeHillsStubScene');
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000');
    const t = pixelText(this, 0, 0, 'Three Hills (next build)');
    t.setPosition(Math.round((cam.width - t.width) / 2), Math.round((cam.height - t.height) / 2));
    this.time.delayedCall(600, () => {
      this.input.keyboard.once('keydown', () => {
        if (import.meta.env.DEV && this.game.devTools) {
          this.game.devTools.setOpen(true);
        } else {
          gameState.reset();
          this.scene.start('RestaurantScene');
        }
      });
    });
  }
}
