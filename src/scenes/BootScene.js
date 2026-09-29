import Phaser from 'phaser';
import { assetUrl } from '../systems/assetUrl.js';
import { PLAYER_TEXTURE, createPlayerAnimations } from '../objects/Player.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.spritesheet(PLAYER_TEXTURE, assetUrl('assets/images/mateo_walk.png'), {
      frameWidth: 16,
      frameHeight: 32,
    });
    this.load.image('border_tiles', assetUrl('assets/images/border_tiles.png'));
    this.load.json('movement_test_map', assetUrl('assets/data/movement_test_map.json'));
    this.load.image('restaurant_tiles', assetUrl('assets/images/restaurant_tiles.png'));
    this.load.json('restaurant_map', assetUrl('assets/data/restaurant_map.json'));
    this.load.json('closing_tasks', assetUrl('assets/data/closing_tasks.json'));
  }

  create() {
    createPlayerAnimations(this.anims);
    // Dev-only: ?scene=movement-test starts the movement test scene instead.
    const devMovementTest =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get('scene') === 'movement-test';
    this.scene.start(devMovementTest ? 'MovementTestScene' : 'RestaurantScene');
  }
}
