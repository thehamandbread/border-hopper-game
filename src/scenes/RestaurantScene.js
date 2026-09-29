import Phaser from 'phaser';
import Player from '../objects/Player.js';
import TaskListHud from '../objects/TaskListHud.js';
import InteractionSystem from '../systems/InteractionSystem.js';
import TaskList from '../systems/TaskList.js';

// Indexes in restaurant_tiles.png (see tools/art/README.md).
const TILE = {
  FRONT_DOOR: 13,
  BACK_DOOR: 14,
  BACK_ROOM_DOOR: 15,
  TABLE_DIRTY: 5,
  TABLE_CLEAN: 6,
  STOVE_OFF: 8,
  STOVE_ON: 9,
  TRASH_FULL: 10,
  TRASH_EMPTY: 11,
};
const TRASH_BAG = 'trash bag';
const TEXT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '8px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
};

export default class RestaurantScene extends Phaser.Scene {
  constructor() {
    super('RestaurantScene');
  }

  create() {
    const mapData = this.cache.json.get('restaurant_map');
    const { tileWidth, tileHeight, width, height } = mapData;

    const map = this.add.tilemap(undefined, tileWidth, tileHeight, width, height, mapData.tiles);
    const tileset = map.addTilesetImage(mapData.tileset.key, mapData.tileset.key, tileWidth, tileHeight);
    this.ground = map.createLayer(0, tileset, 0, 0);
    this.ground.setCollision(mapData.tileset.blocking);

    const mapW = width * tileWidth;
    const mapH = height * tileHeight;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    const { tileX, tileY } = mapData.start;
    this.player = new Player(this, tileX * tileWidth + tileWidth / 2, (tileY + 1) * tileHeight);
    this.physics.add.collider(this.player, this.ground);

    // The map is smaller than the 480x270 view: centre it. Larger maps would follow the player.
    const cam = this.cameras.main;
    if (mapW <= cam.width && mapH <= cam.height) {
      cam.setScroll((mapW - cam.width) / 2, (mapH - cam.height) / 2);
    } else {
      cam.setBounds(0, 0, mapW, mapH);
      cam.startFollow(this.player, true);
    }

    this.tasks = TaskList.fromCache(this, 'closing_tasks');
    this.hud = new TaskListHud(this, this.tasks, this.player);
    this.interactions = new InteractionSystem(this, this.player, { tileSize: tileWidth });
    this.message = null;

    this.registerInteractables(mapData);
    this.tasks.on('all-complete', () => this.showCenterMessage('Shift complete.', 2000));
  }

  registerInteractables(mapData) {
    mapData.tiles.forEach((row, y) => {
      row.forEach((index, x) => {
        switch (index) {
          case TILE.TABLE_DIRTY: {
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Wipe table',
              handler: () => {
                this.ground.putTileAt(TILE.TABLE_CLEAN, x, y);
                this.interactions.unregister(item);
                this.tasks.progress('wipe_tables');
              },
            });
            break;
          }
          case TILE.TRASH_FULL: {
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Grab trash bag',
              enabled: () => !this.player.carrying,
              handler: () => {
                this.ground.putTileAt(TILE.TRASH_EMPTY, x, y);
                this.interactions.unregister(item);
                this.player.setCarrying(TRASH_BAG);
              },
            });
            break;
          }
          case TILE.BACK_DOOR:
            this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Take out trash',
              enabled: () => this.player.carrying === TRASH_BAG,
              handler: () => {
                this.player.setCarrying(null);
                this.tasks.complete('take_out_trash');
              },
            });
            break;
          case TILE.STOVE_ON: {
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Turn off stove',
              handler: () => {
                this.ground.putTileAt(TILE.STOVE_OFF, x, y);
                this.interactions.unregister(item);
                this.tasks.complete('turn_off_stove');
              },
            });
            break;
          }
          case TILE.BACK_ROOM_DOOR:
            this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Try door',
              handler: () => this.showNearPlayerMessage('The back room. Always locked.', 2000),
            });
            break;
          case TILE.FRONT_DOOR:
            this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Leave',
              enabled: () => !this.tasks.isComplete(),
              handler: () => this.showNearPlayerMessage("Not until the shift's done.", 2000),
            });
            break;
          default:
        }
      });
    });
  }

  /** Short message above the player's head, replacing any current one. */
  showNearPlayerMessage(text, ms) {
    this.clearMessage();
    const cam = this.cameras.main;
    const msg = this.add.text(0, 0, text, TEXT_STYLE).setOrigin(0.5, 1).setDepth(3000);
    // Keep it fully on screen.
    const half = msg.width / 2;
    const x = Phaser.Math.Clamp(this.player.x, cam.scrollX + half + 4, cam.scrollX + cam.width - half - 4);
    const y = Math.max(this.player.y - 36, cam.scrollY + msg.height + 4);
    msg.setPosition(Math.round(x), Math.round(y));
    this.setMessage(msg, ms);
  }

  /** Message centred on the screen (fixed to the camera). */
  showCenterMessage(text, ms) {
    this.clearMessage();
    const cam = this.cameras.main;
    const msg = this.add
      .text(cam.width / 2, cam.height / 2, text, { ...TEXT_STYLE, fontSize: '16px', strokeThickness: 4 })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(3000);
    this.setMessage(msg, ms);
  }

  setMessage(msg, ms) {
    this.message = msg;
    this.interactions.promptHidden = true;
    this.time.delayedCall(ms, () => {
      if (this.message === msg) this.clearMessage();
    });
  }

  clearMessage() {
    if (this.message) this.message.destroy();
    this.message = null;
    this.interactions.promptHidden = false;
  }

  update() {
    this.player.update();
    this.interactions.update();
  }
}
