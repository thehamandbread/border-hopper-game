import Phaser from 'phaser';

/**
 * Tile-based interactables. The nearest enabled one within `range` px of the player's
 * feet collision box shows a prompt above it; pressing the interact key runs its handler.
 */
export default class InteractionSystem {
  constructor(scene, player, { tileSize = 16, range = 22, key = 'E' } = {}) {
    this.scene = scene;
    this.player = player;
    this.tileSize = tileSize;
    this.range = range;
    this.items = [];
    this.current = null;
    this.promptHidden = false; // set true while a message covers the prompt's spot
    this.key = scene.input.keyboard.addKey(key);
    this.keyLabel = key;
    this.prompt = scene.add
      .text(0, 0, key, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(1000)
      .setVisible(false);
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

  update() {
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
    this.prompt
      .setText(`${this.keyLabel}: ${best.prompt}`)
      .setPosition(Math.round((best.tileX + 0.5) * ts), best.tileY * ts - 2)
      .setVisible(!this.promptHidden);

    if (Phaser.Input.Keyboard.JustDown(this.key)) best.handler(best);
  }
}
