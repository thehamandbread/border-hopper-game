import Phaser from 'phaser';
import { assetUrl } from '../systems/assetUrl.js';
import { FONT_KEY } from '../systems/pixelText.js';
import { createWalkAnimations } from '../objects/walkAnims.js';
import { createFireAnimations } from '../objects/FireEffects.js';
import { createKitchenDoorAnimations } from '../objects/KitchenDoor.js';
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
    this.load.bitmapFont(
      FONT_KEY,
      assetUrl('assets/fonts/pixel_operator_8.png'),
      assetUrl('assets/fonts/pixel_operator_8.xml'),
    );
    this.load.image('restaurant_tiles', assetUrl('assets/images/restaurant_tiles.png'));
    this.load.json('restaurant_map', assetUrl('assets/data/restaurant_map.json'));
    this.load.spritesheet('kitchen_door', assetUrl('assets/images/kitchen_door.png'), {
      frameWidth: 32,
      frameHeight: 16,
    });
    this.load.spritesheet('task_marker', assetUrl('assets/images/task_marker.png'), {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.json('dialogue_tomi_call', assetUrl('assets/data/dialogue/tomi_call.json'));
    this.load.json('dialogue_curb', assetUrl('assets/data/dialogue/curb.json'));
    this.load.spritesheet('phone_ledge', assetUrl('assets/images/phone_ledge.png'), {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('fire', assetUrl('assets/images/fire.png'), { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('smoke', assetUrl('assets/images/smoke.png'), { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('phone_icon', assetUrl('assets/images/phone_icon.png'), { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet('aurelio_walk', assetUrl('assets/images/aurelio_walk.png'), { frameWidth: 16, frameHeight: 32 });
    this.load.image('phone_ui', assetUrl('assets/images/phone_ui.png'));
    this.load.audio('phone_ring', assetUrl('assets/audio/phone_ring.wav'));
    this.load.audio('smoke_alarm', assetUrl('assets/audio/smoke_alarm.wav'));
    this.load.image('curb_tiles', assetUrl('assets/images/curb_tiles.png'));
    this.load.image('streetlight', assetUrl('assets/images/streetlight.png'));
    this.load.image('light_pool', assetUrl('assets/images/light_pool.png'));
    this.load.spritesheet('sedan', assetUrl('assets/images/sedan.png'), { frameWidth: 48, frameHeight: 24 });
    this.load.spritesheet('sitting', assetUrl('assets/images/sitting.png'), { frameWidth: 16, frameHeight: 32 });
    this.load.json('curb_map', assetUrl('assets/data/curb_map.json'));
    this.load.json('cutscene_curb', assetUrl('assets/data/cutscenes/curb.json'));
    this.load.json('closing_tasks', assetUrl('assets/data/closing_tasks.json'));
  }

  create() {
    createPlayerAnimations(this.anims);
    createKitchenDoorAnimations(this.anims);
    createFireAnimations(this.anims);
    createWalkAnimations(this.anims, 'aurelio_walk', 'aurelio-walk', 5); // slower, steadier than Mateo (8 fps)
    // Dev-only: ?scene=movement-test starts the movement test scene instead.
    const devMovementTest =
      import.meta.env.DEV && new URLSearchParams(window.location.search).get('scene') === 'movement-test';
    // Dev-only: ?scene=curb (or ?cutscene=curb) starts the curb scene directly.
    const params = new URLSearchParams(window.location.search);
    const devCurb = import.meta.env.DEV && (params.get('scene') === 'curb' || params.get('cutscene') === 'curb');
    let start = 'RestaurantScene';
    if (devMovementTest) start = 'MovementTestScene';
    else if (devCurb) start = 'CurbScene';
    this.scene.start(start);
  }
}
