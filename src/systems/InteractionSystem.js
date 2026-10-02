import Phaser from 'phaser';
import { pixelText } from './pixelText.js';

// Prompt bottom edge, px above the player's feet: just over the top of Mateo's head.
const HEAD_GAP = 28;

/**
 * Tile-based interactables. The nearest enabled one within `range` px of the player's
 * feet collision box shows a prompt above the player's head; pressing the interact key runs its handler.
 */
export default class InteractionSystem {
  constructor(scene, player, { tileSize = 16, range = 22, key = 'E' } = {}) {
    this.scene = scene;
    this.player = player;
    this.tileSize = tileSize;
    this.range = range;
    this.items = [];
    this.current = null;
    this.enabled = true;
    this.key = scene.input.keyboard.addKey(key);
    this.keyLabel = key;
    this.prompt = pixelText(scene, 0, 0, key).setOrigin(0, 1).setDepth(1000).setVisible(false);
  }

  /**
   * @param {object} def
   * @param {number} def.tileX
   * @param {number} def.tileY
   * @param {string} def.prompt   short action text shown next to the key
   * @param {(item) => void} def.handler
   * @param {() => boolean} [def.enabled]  hide the prompt and ignore E while this returns false
   * @returns the registered item (pass to unregister)
   */
  register({ tileX, tileY, prompt, handler, enabled }) {
    const item = { tileX, tileY, prompt, handler, enabled };
    this.items.push(item);
    return item;
  }

  unregister(item) {
    this.items = this.items.filter((i) => i !== item);
    if (this.current === item) this.current = null;
  }

  /** Turn interaction off (e.g. during dialogue): hides the prompt and swallows E presses. */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.current = null;
      this.prompt.setVisible(false);
    }
    Phaser.Input.Keyboard.JustDown(this.key);
  }

  update() {
    if (!this.enabled) {
      Phaser.Input.Keyboard.JustDown(this.key); // E does nothing while disabled
      return;
    }
    const feet = this.player.body.center; // centre of the feet collision box
    const ts = this.tileSize;
    let best = null;
    let bestDist = this.range;
    for (const item of this.items) {
      if (item.enabled && !item.enabled()) continue;
      const d = Phaser.Math.Distance.Between(feet.x, feet.y, (item.tileX + 0.5) * ts, (item.tileY + 0.5) * ts);
      if (d <= bestDist) {
        best = item;
        bestDist = d;
      }
    }
    this.current = best;

    if (!best) {
      this.prompt.setVisible(false);
      return;
    }
    this.prompt.setText(`${this.keyLabel}: ${best.prompt}`).setVisible(true);
    // Centred above the player's head (head top is ~26 px above the feet), on whole pixels.
    const cam = this.scene.cameras.main;
    const x = Phaser.Math.Clamp(
      Math.round(this.player.x - this.prompt.width / 2),
      cam.scrollX + 2,
      cam.scrollX + cam.width - this.prompt.width - 2,
    );
    const y = Math.max(Math.round(this.player.y) - HEAD_GAP, cam.scrollY + this.prompt.height + 2);
    this.prompt.setPosition(x, y);

    if (Phaser.Input.Keyboard.JustDown(this.key)) best.handler(best);
  }
}
