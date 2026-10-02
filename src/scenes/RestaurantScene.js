import Phaser from 'phaser';
import DialogueBox from '../objects/DialogueBox.js';
import { FIRE_ANIM, FIRE_TEXTURE } from '../objects/FireEffects.js';
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
import FireSystem from '../systems/FireSystem.js';
import CutsceneRunner from '../systems/CutsceneRunner.js';

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
const PHONE_LEDGE_TEXTURE = 'phone_ledge';
const HINT_MS = 3000;
const TOO_LATE_RANGE = 22; // px from the stove, same reach as interacting
const FADE_MS = 500;
const EXIT_FADE_MS = 800;
const CLOSED_FAIL_DELAY_MS = 1500; // after the path closes, if Mateo is still inside
const BURNED_CARD_MS = 1500;
// Phone call flow: 'idle' -> 'ringing' (after the last table) -> 'call' -> 'done'
// Stove: 'on' (task) -> 'locked' (phone rang; can't be reached in time) -> 'burning' (stove_ignite)

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
    // Q opens the texting phone when nothing else is going on; Mateo stands still while it's open.
    this.phone = new PhoneUI(this, { canOpen: () => !this.dialogueRunner && !this.fading });
    this.phone.on('opened', () => this.player.setLocked(true));
    this.phone.on('closed', () => {
      if (!this.fading) this.player.setLocked(false);
    });
    this.phonePresenter = new PhonePresenter(this, this.phone, this.player);
    this.dialogueRunner = null;
    this.phoneState = 'idle';
    this.stoveState = 'on';
    this.createKitchenDoor(mapData);
    this.createObjects(mapData);
    this.registerInteractables(mapData);
    this.tasks.on('task-complete', (task) => {
      if (task.id === 'wipe_tables') this.startRinging();
    });
    this.events.once('shutdown', () => this.sound.stopAll());
    this.fire = new FireSystem(this, mapData.fire, {
      tileSize: tileWidth,
      origin: this.stoveTile,
      isOccupied: (tx, ty) => {
        const b = this.player.body;
        const r = new Phaser.Geom.Rectangle(tx * tileWidth, ty * tileHeight, tileWidth, tileHeight);
        return Phaser.Geom.Intersects.RectangleToRectangle(r, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height));
      },
    });
    // During the call, fire blocks Mateo like a wall ("It's too hot."). It only becomes deadly when the call ends.
    this.physics.add.collider(this.player, this.fire.blockers, () => this.tooHot(), () => !this.escaping);
    this.restarts = 0;
    this.escaping = false;
    this.escaped = false;
    this.fading = false;
    this.closedFailScheduled = false;

    // Dev-only test hook: ?dialogue=tomi_call or ?dialogue=curb starts that conversation.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('dialogue');
      if (id) this.startDialogue(id);
      const cutscene = params.get('cutscene');
      if (cutscene) this.playCutscene(cutscene);
    }
  }

  /** Loads and plays public/assets/data/cutscenes/<id>.json here, with player input locked throughout. */
  async playCutscene(id) {
    const data = await CutsceneRunner.load(this, id);
    const cutscene = new CutsceneRunner(this, data, {
      lockInput: (locked) => {
        this.player.setLocked(locked);
        this.interactions.setEnabled(!locked);
      },
      startDialogue: (dialogueId) => this.startDialogue(dialogueId),
      onEnd: () => {
        if (import.meta.env.DEV) console.log('[cutscene] end', id);
      },
    });
    await cutscene.play();
    return cutscene;
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

    runner.on('event', (name, payload) => this.onStoryEvent(name, payload));

    if (import.meta.env.DEV) {
      runner.on('event', (name, payload) => console.log('[dialogue] event', name, payload ?? ''));
      runner.on('choice-made', (option, i) => console.log('[dialogue] choice', i + 1, option.text));
      runner.on('end', () => console.log('[dialogue] end', data.id));
      gameState.on('change', (c) => console.log('[state]', c.kind, c.name, '=', c.value));
    }

    presenter.present(runner);
    runner.start();
    return runner;
  }

  /** Cafe doors fill the 2-tile gap that starts just right of the left counter end cap. */
  createKitchenDoor(mapData) {
    const { tileWidth, tileHeight } = mapData;
    mapData.tiles.forEach((row, y) => {
      const x = row.indexOf(TILE.COUNTER_END_LEFT);
      if (x !== -1) this.kitchenDoor = new KitchenDoor(this, (x + 1) * tileWidth, y * tileHeight, this.player);
    });
  }

  /** Non-tile objects listed in the map data (currently just the phone ledge). */
  createObjects(mapData) {
    const ts = mapData.tileWidth;
    for (const obj of mapData.objects ?? []) {
      if (obj.type !== 'phone_ledge') continue;
      this.phoneTile = { x: obj.tileX, y: obj.tileY };
      this.phoneLedge = this.add.sprite(obj.tileX * ts, obj.tileY * ts, PHONE_LEDGE_TEXTURE, 0).setOrigin(0, 0).setDepth(1);
      this.interactions.register({
        tileX: obj.tileX,
        tileY: obj.tileY,
        prompt: 'Answer',
        enabled: () => this.phoneState === 'ringing',
        handler: () => this.answerPhone(),
      });
    }
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
            this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Get out',
              enabled: () => this.escaping && !this.fading,
              handler: () => this.exitRestaurant(),
            });
            break;
          case TILE.STOVE_ON: {
            this.stoveTile = { x, y };
            this.stoveMarker = this.markers.add({ taskId: 'turn_off_stove', tileX: x, tileY: y });
            const item = this.interactions.register({
              tileX: x,
              tileY: y,
              prompt: 'Turn off stove',
              // Once the phone rings the stove can't be turned off any more (see stoveState).
              enabled: () => this.stoveState === 'on',
              handler: () => {
                if (!this.canDo('turn_off_stove')) return;
                this.ground.putTileAt(TILE.STOVE_OFF, x, y);
                this.interactions.unregister(item);
                this.markers.remove(this.stoveMarker);
                this.stoveState = 'off';
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
              handler: () => this.showNearPlayerMessage('Lupe locks the front at closing. Staff use the back.', 2500),
            });
            break;
          default:
        }
      });
    });
  }

  // ---- Tomi's call and the fire ----

  /** The last table is wiped: the phone on the ledge rings. */
  startRinging() {
    if (this.phoneState !== 'idle' || !this.phoneTile) return;
    this.phoneState = 'ringing';
    this.stoveState = 'locked';
    this.phoneLedge.setFrame(1);
    this.ringSound = this.sound.add('phone_ring', { loop: true });
    this.ringSound.play();
    this.phone.ring(this.cache.json.get('dialogue_tomi_call').caller);
    this.phoneMarker = this.markers.add({ taskId: null, tileX: this.phoneTile.x, tileY: this.phoneTile.y });
    this.markers.setHidden(this.stoveMarker, true);
    this.showNearPlayerMessage("Your phone's ringing.", HINT_MS);
  }

  answerPhone() {
    if (this.phoneState !== 'ringing') return;
    this.phoneState = 'call';
    this.ringSound?.stop();
    this.phoneLedge.setFrame(0);
    this.markers.remove(this.phoneMarker);
    this.startDialogue('tomi_call');
    this.showNearPlayerMessage('You can walk during calls, but slower.', HINT_MS);
  }

  /** Named events from dialogue data. Unknown names are ignored (other scenes handle them). */
  onStoryEvent(name) {
    if (name === 'stove_ignite') this.igniteStove();
    else if (name === 'smoke_alarm') this.startAlarm();
    else if (name === 'call_ends') this.onCallEnded();
  }

  igniteStove() {
    if (this.stoveState === 'burning' || !this.stoveTile) return;
    this.stoveState = 'burning';
    const { x, y } = this.stoveTile;
    this.ground.putTileAt(TILE.STOVE_ON, x, y);
    this.markers.remove(this.stoveMarker);
    this.stoveFire = this.add.sprite(x * 16 + 8, y * 16 + 8, FIRE_TEXTURE, 0).setDepth((y + 1) * 16);
    this.stoveFire.play(FIRE_ANIM);
    this.tooLateShown = false;
    this.fire.ignite();
  }

  startAlarm() {
    if (this.alarmSound) return;
    this.alarmSound = this.sound.add('smoke_alarm', { loop: true });
    this.alarmSound.play();
    // Red alarm light on the kitchen's back wall: an 8x8 lamp with a soft glow, flashing.
    const cx = 17 * 16 + 8; // clear of the checklist in the top-left
    const cy = 7;
    this.add.graphics().setDepth(1).fillStyle(0x2a2226).fillRect(cx - 5, cy - 5, 10, 10);
    this.alarmGlow = this.add.graphics().setDepth(2);
    this.alarmGlow.fillStyle(0xff4030, 0.18).fillCircle(cx, cy, 13);
    this.alarmGlow.fillStyle(0xff5038, 0.3).fillCircle(cx, cy, 9);
    this.alarmLamp = this.add.graphics().setDepth(3);
    const lamp = (on) => {
      this.alarmLamp.clear();
      this.alarmLamp.fillStyle(on ? 0xff3a28 : 0x5a1410).fillRect(cx - 4, cy - 4, 8, 8);
      if (on) this.alarmLamp.fillStyle(0xffc0a0).fillRect(cx - 3, cy - 3, 3, 2);
      this.alarmGlow.setVisible(on);
    };
    lamp(true);
    let on = true;
    this.time.addEvent({ delay: 300, loop: true, callback: () => lamp((on = !on)) });
  }

  /** The call is over: the escape begins. Restarts come back to exactly this moment. */
  onCallEnded() {
    if (this.escaping) return;
    this.phoneState = 'done';
    this.startAlarm();
    this.escaping = true;
    this.fire.startEscape();
    this.escapeSnapshot = this.fire.snapshot();
    // Guidance: the stove task has failed, a new task points at the back door.
    this.tasks.fail('turn_off_stove');
    this.tasks.addTask({ id: 'get_out', label: 'Get out the back door' });
    if (this.backDoorTile) this.markers.add({ taskId: 'get_out', tileX: this.backDoorTile.x, tileY: this.backDoorTile.y });
    this.showNearPlayerMessage("The front's locked. Use the back.", HINT_MS);
  }

  /** Before the call ends, fire just blocks. */
  tooHot() {
    if (this.message?.text !== "It's too hot.") this.showNearPlayerMessage("It's too hot.", 1500);
  }

  /** Where Mateo stands after a restart: in front of the phone ledge. */
  get restartSpot() {
    const t = this.phoneTile;
    return { x: t.x * 16 + 8, y: t.y * 16 - 4 };
  }

  /**
   * Touched fire during the escape (or stayed until the kitchen closed): red flash, shake, Mateo
   * flashes red, fade to black, "You got burned.", then back to the end of the call.
   */
  failEscape() {
    if (this.fading || this.escaped || !this.escaping) return;
    this.fading = true;
    this.player.setLocked(true);
    this.interactions.setEnabled(false);
    this.clearMessage();
    const cam = this.cameras.main;
    cam.flash(250, 255, 60, 40);
    cam.shake(250, 0.006);
    let flashes = 0;
    this.time.addEvent({
      delay: 90,
      repeat: 5,
      callback: () => (flashes++ % 2 ? this.player.clearTint() : this.player.setTint(0xff4030)),
    });
    this.time.delayedCall(600, () => {
      this.player.clearTint();
      cam.fadeOut(FADE_MS, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.showBurnedCard());
    });
  }

  showBurnedCard() {
    const cam = this.cameras.main;
    const black = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(6000);
    const card = pixelText(this, 0, 0, 'You got burned.', { size: 16 }).setScrollFactor(0).setDepth(6001);
    card.setPosition(Math.round((cam.width - card.width) / 2), Math.round((cam.height - card.height) / 2));
    cam.resetFX();
    this.time.delayedCall(BURNED_CARD_MS, () => {
      this.fire.restore(this.escapeSnapshot);
      this.closedFailTimer?.remove();
      this.closedFailScheduled = false;
      const spot = this.restartSpot;
      this.player.setPosition(spot.x, spot.y);
      this.player.facing = 'up';
      this.player.setLocked(true); // refreshes the standing frame for the new facing
      black.destroy();
      card.destroy();
      this.restarts += 1;
      cam.fadeIn(FADE_MS, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
        this.fading = false;
        this.player.setLocked(false);
        this.interactions.setEnabled(true);
        if (this.restarts === 1) this.showNearPlayerMessage('Move when the flames die down.', HINT_MS);
      });
    });
  }

  /** "E: Get out" at the back door: fade out and show the placeholder for the next part. */
  exitRestaurant() {
    if (this.fading) return;
    this.escaped = true;
    this.fading = true;
    this.tasks.complete('get_out');
    this.player.setLocked(true);
    this.interactions.setEnabled(false);
    this.clearMessage();
    const cam = this.cameras.main;
    cam.fadeOut(EXIT_FADE_MS, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.sound.stopAll();
      // On to the curb: it opens on black with "Later that night."
      this.scene.start('CurbScene');
    });
  }

  /** Fire is deadly only during the escape (before that it blocks; see the collider in create()). */
  checkFire() {
    if (this.fading || this.escaped || !this.escaping) return;
    const b = this.player.body;
    if (this.fire.isDeadly(new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
      this.failEscape();
      return;
    }
    if (this.escaping && this.fire.closed && !this.closedFailScheduled) {
      this.closedFailScheduled = true;
      this.closedFailTimer = this.time.delayedCall(CLOSED_FAIL_DELAY_MS, () => this.failEscape());
    }
  }

  /** Walking up to the burning stove: it's too late to turn it off. */
  checkTooLate() {
    if (this.stoveState !== 'burning') return;
    const feet = this.player.body.center;
    const d = Phaser.Math.Distance.Between(feet.x, feet.y, this.stoveTile.x * 16 + 8, this.stoveTile.y * 16 + 8);
    if (d <= TOO_LATE_RANGE && !this.tooLateShown) {
      this.tooLateShown = true;
      this.showNearPlayerMessage('Too late.', 1500);
    } else if (d > TOO_LATE_RANGE + 10) {
      this.tooLateShown = false;
    }
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
    const msg = pixelText(this, 0, 0, text).setOrigin(0, 1).setDepth(3000);
    msg.followsPlayer = true;
    this.setMessage(msg, ms);
    this.positionMessage();
  }

  /** Keeps a near-player message next to Mateo (called every frame, so it follows him). */
  positionMessage() {
    const msg = this.message;
    if (!msg?.followsPlayer) return;
    const cam = this.cameras.main;
    // Keep it fully on screen.
    const half = msg.width / 2;
    const x = Phaser.Math.Clamp(this.player.x, cam.scrollX + half + 4, cam.scrollX + cam.width - half - 4);
    // Default spot is just above the head-height prompt. If the prompt is showing, stay clear of it.
    const prompt = this.interactions.prompt;
    let y = this.player.y - 36;
    if (prompt.visible) y = Math.min(y, prompt.y - prompt.height - 2);
    if (this.phonePresenter.mateoBubble) {
      // Mateo's speech bubble is above his head: go below his feet, under the prompt if one shows.
      y = this.player.y + 4 + msg.height + (prompt.visible ? prompt.height + 2 : 0);
    } else if (y - msg.height < cam.scrollY + 2) {
      y = this.player.y + 4 + msg.height; // no room above (near the top wall): go below the feet
    }
    msg.setPosition(Math.round(x - half), Math.round(y));
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

  update(time, delta) {
    if (!this.fading) this.fire.update(delta);
    this.dialogueBox.update();
    this.phonePresenter.update();
    this.phone.update();
    this.player.update();
    this.player.setDepth(this.player.y); // depth-sort by feet y
    this.kitchenDoor?.update();
    this.checkTooLate();
    this.checkFire();
    this.markers.update(this.player);
    this.interactions.update();
    this.positionMessage();
  }
}
