import { pixelText } from './pixelText.js';

const CARD_DEPTH = 9000; // over everything, including the dialogue box and the phone

/**
 * Title and location cards between scenes: fades the screen to black, shows a small centred line,
 * holds it, then resolves with the screen still black (the next scene fades itself in).
 *   await showCard(this, 'Calle Morelos');
 *   this.scene.start('TireShopScene');
 * size: 8 for place names, 16 for titles. fromBlack: the screen is already black (skip the fade).
 */
export function showCard(scene, text, { size = 8, holdMs = 2000, fadeMs = 600, fromBlack = false } = {}) {
  const cam = scene.cameras.main;
  const black = scene.add
    .rectangle(0, 0, cam.width, cam.height, 0x000000)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(CARD_DEPTH)
    .setAlpha(fromBlack ? 1 : 0);
  return new Promise((resolve) => {
    const show = () => {
      const t = pixelText(scene, 0, 0, text, { size }).setScrollFactor(0).setDepth(CARD_DEPTH + 1);
      t.setPosition(Math.round((cam.width - t.width) / 2), Math.round((cam.height - t.height) / 2));
      scene.time.delayedCall(holdMs, () => {
        t.destroy();
        resolve();
      });
    };
    if (fromBlack) show();
    else scene.tweens.add({ targets: black, alpha: 1, duration: fadeMs, onComplete: show });
  });
}

/** Fades in from black (call at the start of a scene that follows a card). Resolves when clear. */
export function fadeInFromBlack(scene, ms = 800) {
  const cam = scene.cameras.main;
  const black = scene.add
    .rectangle(0, 0, cam.width, cam.height, 0x000000)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(CARD_DEPTH);
  return new Promise((resolve) => {
    scene.tweens.add({
      targets: black,
      alpha: 0,
      duration: ms,
      onComplete: () => {
        black.destroy();
        resolve();
      },
    });
  });
}
