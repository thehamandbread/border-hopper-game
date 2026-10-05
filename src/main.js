import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MovementTestScene from './scenes/MovementTestScene.js';
import { gameState } from './systems/GameState.js';
import RestaurantScene from './scenes/RestaurantScene.js';
import CurbScene from './scenes/CurbScene.js';
import ApartmentScene from './scenes/ApartmentScene.js';
import TireShopScene from './scenes/TireShopScene.js';

const config = {
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
  scene: [BootScene, MovementTestScene, RestaurantScene, CurbScene, ApartmentScene, TireShopScene],
};

if (import.meta.env.DEV) {
  // Dev tools (checkpoint menu, state panel) load only in dev builds; production never includes them.
  import('./dev/DevMenu.js').then(({ installDevTools }) => {
    const game = new Phaser.Game(config);
    installDevTools(game);
    // Handles for browser tests.
    window.__game = game;
    window.__gameState = gameState;
  });
} else {
  new Phaser.Game(config); // eslint-disable-line no-new
}
