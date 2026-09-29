import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MovementTestScene from './scenes/MovementTestScene.js';
import RestaurantScene from './scenes/RestaurantScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 270,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MovementTestScene, RestaurantScene],
});

// Dev-only handle for browser tests.
if (import.meta.env.DEV) window.__game = game;
