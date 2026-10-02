import Phaser from 'phaser';
import DialogueBox from '../objects/DialogueBox.js';
import KitchenDoor from '../objects/KitchenDoor.js';
import PhonePresenter from '../objects/PhonePresenter.js';
import PhoneUI from '../objects/PhoneUI.js';
import Player from '../objects/Player.js';
import TaskListHud from '../objects/TaskListHud.js';
import { pixelText } from '../systems/pixelText.js';
import DialogueRunner from '../systems/DialogueRunner.js';
import { gameState } from '../systems/GameState.js';
import InteractionSystem from '../systems/InteractionSystem.js';
import TaskList from '../systems/TaskList.js';
import TaskMarkers from '../systems/TaskMarkers.js';

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
  COUNTER_END_LEFT: 22,
};
const TRASH_BAG = 'trash bag';

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
    this.markers = new TaskMarkers(this, this.tasks, { enabled: mapData.showTaskMarkers === true, tileSize: tileWidth });
    this.message = null;

    this.dialogueBox = new DialogueBox(this);
    this.phone = new PhoneUI(this);
    this.phonePresenter = new PhonePresenter(this, this.phone, this.player);
    this.dialogueRunner = null;
    this.createKitchenDoor(mapData);
    this.registerInteractables(mapData);
    this.tasks.on('all-complete', () => this.showCenterMessage('Shift complete.', 2000));

    // Dev-only test hook: ?dialogue=tomi_call or ?dialogue=curb starts that conversation.
    if (import.meta.env.DEV) {
      const id = new URLSearchParams(window.location.search).get('dialogue');
      if (id) this.startDialogue(id);
    }
  }

  /** Starts a conversation from public/assets/data/dialogue/<id>.json (loaded by BootScene). */
  startDialogue(id) {
    const data = this.cache.json.get(`dialogue_${id}`);
    if (!data) throw new Error(`Unknown dialogue "${id}"`);
    const presenters = { box: this.dialogueBox, phone: this.phonePresenter };
    const presenter = presenters[data.presenter];
    if (!presenter) throw new Error(`Dialogue "${id}": no "${data.presenter}" presenter yet`);

    const runner = new DialogueRunner(data, gameState);
    this.dialogueRunner = runner;
    // Box dialogue locks Mateo and the world; phone calls leave both running (the presenter slows him).
    if (runner.lockMovement) {
      this.player.setLocked(true);
      this.interactions.setEnabled(false);
    }
    runner.on('end', () => {
      this.dialogueRunner = null;
      if (runner.lockMovement) {
        this.player.setLocked(false);
        this.interactions.setEnabled(true);
      }
    });

    if (import.meta.env.DEV) {
      runner.on('event', (name, payload) => console.log('[dialogue] event', name, payload ?? ''));
      runner.on('choice-made', (option, i) => console.log('[dialogue] choice', i + 1, option.text));
      runner.on('end', () => console.log('[dialogue] end', data.id));
      gameState.on('change', (c) => console.log('[state]', c.kind, c.name, '=', c.value));
    }

    presenter.present(runner);
    runner.start();
  }

  /** Cafe doors fill the 2-tile gap that starts just right of the left counter end cap. */
  createKitchenDoor(mapData) {
    const { tileWidth, tileHeight } = mapData;
    mapData.tiles.forEach((row, y) => {
      const x = row.indexOf(TILE.COUNTER_END_LEFT);
      if (x !== -1) this.kitchenDoor = new KitchenDoor(this, (x + 1) * tileWidth, y * tileHeight, this.player);
    });
  }

  registerInteractables(mapData) {
    // The trash marker moves to the back door while Mateo carries the bag.
    this.backDoorTile = null;
    this.trashMarker = null;
    mapData.tiles.forEach((row, y) => {
      const x = row.indexOf(TILE.BACK_DOOR);
      if (x !== -1) this.backDoorTile = { x, y };
    });
    this.player.on('carrying-changed', (item) => {
      if (item && this.backDoorTile) this.markers.move(this.trashMarker, this.backDoorTile.x, this.backDoorTile.y);
    });

    mapData.tiles.forEach((row, y) => {
      row.forEach((index, x) => {
        switch (index) {
          case TILE.TABLE_DIRTY: {
            const marker = this.markers.add({ taskId: 'wipe_tables', tileX: x, tileY: y });
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Wipe table',
              handler: () => {
                if (!this.canDo('wipe_tables')) return;
                this.ground.putTileAt(TILE.TABLE_CLEAN, x, y);
                this.interactions.unregister(item);
                this.markers.remove(marker);
                this.tasks.progress('wipe_tables');
              },
            });
            break;
          }
          case TILE.TRASH_FULL: {
            this.trashMarker = this.markers.add({ taskId: 'take_out_trash', tileX: x, tileY: y });
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Grab trash bag',
              enabled: () => !this.player.carrying,
              handler: () => {
                if (!this.canDo('take_out_trash')) return;
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
            const marker = this.markers.add({ taskId: 'turn_off_stove', tileX: x, tileY: y });
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Turn off stove',
              handler: () => {
                if (!this.canDo('turn_off_stove')) return;
                this.ground.putTileAt(TILE.STOVE_OFF, x, y);
                this.interactions.unregister(item);
                this.markers.remove(marker);
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

  /** Tasks go in the order listed in closing_tasks.json. Out of order, show the task's notYet line. */
  canDo(taskId) {
    if (this.tasks.isCurrent(taskId)) return true;
    const notYet = this.tasks.get(taskId)?.notYet;
    if (notYet) this.showNearPlayerMessage(notYet, 2000);
    return false;
  }

  /** Short message above the player's head, replacing any current one. */
  showNearPlayerMessage(text, ms) {
    this.clearMessage();
    const cam = this.cameras.main;
    const msg = pixelText(this, 0, 0, text).setOrigin(0, 1).setDepth(3000);
    // Keep it fully on screen.
    const half = msg.width / 2;
    const x = Phaser.Math.Clamp(this.player.x, cam.scrollX + half + 4, cam.scrollX + cam.width - half - 4);
    // Default spot is just above the head-height prompt. If the prompt is showing, stay clear of it.
    const prompt = this.interactions.prompt;
    let y = this.player.y - 36;
    if (prompt.visible) y = Math.min(y, prompt.y - prompt.height - 2);
    if (y - msg.height < cam.scrollY + 2) {
      y = this.player.y + 4 + msg.height; // no room above (near the top wall): go below the feet
    }
    msg.setPosition(Math.round(x - half), Math.round(y));
    this.setMessage(msg, ms);
  }

  /** Message centred on the screen (fixed to the camera). */
  showCenterMessage(text, ms) {
    this.clearMessage();
    const cam = this.cameras.main;
    const msg = pixelText(this, 0, 0, text, { size: 16 }).setScrollFactor(0).setDepth(3000);
    msg.setPosition(Math.round((cam.width - msg.width) / 2), Math.round((cam.height - msg.height) / 2));
    this.setMessage(msg, ms);
  }

  setMessage(msg, ms) {
    this.message = msg;
    this.time.delayedCall(ms, () => {
      if (this.message === msg) this.clearMessage();
    });
  }

  clearMessage() {
    if (this.message) this.message.destroy();
    this.message = null;
  }

  update() {
    this.dialogueBox.update();
    this.phonePresenter.update();
    this.player.update();
    this.player.setDepth(this.player.y); // depth-sort by feet y
    this.kitchenDoor?.update();
    this.markers.update(this.player);
    this.interactions.update();
  }
}
