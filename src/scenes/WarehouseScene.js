import CarriedCase from '../objects/CarriedCase.js';
import CutsceneRunner from '../systems/CutsceneRunner.js';
import { gameState } from '../systems/GameState.js';
import { pixelText } from '../systems/pixelText.js';
import StoryScene from './StoryScene.js';

const TILE = { DOOR_OPEN: 18, CABINET_OPEN: 24 };          // warehouse_tiles.png
const FRAME = { WORKER_DOWN: 0, RAFAEL_PHONE_BACK: 16, MATEO_SITTING: 2, CASE_ON_TABLE: 1, PHONE_DOWN: 3 };
const CLOCK_FACE = { x: 3, y: 3, w: 26, h: 10 };           // clock_plate.png's dark face
const CLOCK_DIGITS = 0xe05a48;                              // red digital digits
const START_TIME = '10:02';
const ARRIVE_DELAY_MS = 700;

/**
 * Mission 2, Scene 2: Distribuidora del Valle (warehouse_map.json, dialogue m2_warehouse, its staging in
 * cutscenes/m2_warehouse.json). Mateo walks in from the dock under his own control; the dock narration
 * plays as he arrives. Walking up to the worker by the snowflake door starts the conversation: the cold
 * room, Rafael on the phone, the wait on the crate, the case. The wall clock shows the game clock (the
 * plate, with bitmap digits): 10:02 until the scripted beats move it; at 10:41 Mateo has the case and
 * control, and the clock starts running. Walking back out of the dock leaves for the walk to the port.
 */
export default class WarehouseScene extends StoryScene {
  constructor() {
    super('WarehouseScene');
  }

  create() {
    const map = this.cache.json.get('warehouse_map');
    this.buildStory(map);
    this.talked = false;
    this.hasCase = false;
    this.leaving = false;
    gameState.clock.pause();
    gameState.clock.set(START_TIME);

    const sprite = ([x, y], key, frame) => this.add.sprite(x, y, key, frame).setOrigin(0.5, 1).setDepth(y);
    this.add.image(map.forklift[0], map.forklift[1], 'forklift').setOrigin(0.5, 1).setDepth(map.forklift[1]);
    this.addBlocker(map.forklift[0] - 12, map.forklift[1] - 10, 24, 8);
    this.worker = Object.assign(sprite(map.worker, 'warehouse_worker', FRAME.WORKER_DOWN), { walk: 'worker-walk', facing: 'down' });
    this.rafael = sprite(map.rafael, 'rafael_walk', FRAME.RAFAEL_PHONE_BACK);
    this.mateoSit = sprite(map.crateSeat, 'waiting_people', FRAME.MATEO_SITTING).setVisible(false);
    this.caseTable = sprite(map.caseOnTable, 'case_props', FRAME.CASE_ON_TABLE).setDepth(map.caseOnTable[1] + 2).setVisible(false);
    this.phone = sprite(map.phoneOnTable, 'case_props', FRAME.PHONE_DOWN).setDepth(map.phoneOnTable[1] + 2).setVisible(false);
    this.carried = new CarriedCase(this, this.player);
    this.createClock(map.clock);

    this.setLock('arriving', true);
    this.time.delayedCall(ARRIVE_DELAY_MS, () => {
      this.setLock('arriving', false);
      this.startDialogue('m2_warehouse', 'arrive');
    });
  }

  /** The wall clock: the blank plate, and the game clock's time on it in the bitmap font. */
  createClock([x, y]) {
    this.add.image(x, y, 'clock_plate').setOrigin(0, 0).setDepth(2);
    this.clockText = pixelText(this, 0, 0, '', { color: CLOCK_DIGITS }).setDepth(3);
    this.clockAt = { x: x + CLOCK_FACE.x + CLOCK_FACE.w / 2, y: y + CLOCK_FACE.y + CLOCK_FACE.h / 2 };
    this.updateClock();
  }

  updateClock() {
    const t = gameState.clock.format();
    if (this.clockText.text === t) return;
    this.clockText.setText(t);
    this.clockText.setPosition(Math.round(this.clockAt.x - this.clockText.width / 2), Math.round(this.clockAt.y - this.clockText.height / 2));
  }

  /** A solid, invisible rectangle (px) Mateo can't walk through. */
  addBlocker(x, y, w, h) {
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(zone, true);
    this.physics.add.collider(this.player, zone);
  }

  /** The worker's conversation, staged by the cutscene. Control comes back at 10:41, with the case. */
  async talk() {
    this.talked = true;
    const data = await CutsceneRunner.load(this, 'm2_warehouse');
    const things = {
      worker: this.worker, rafael: this.rafael, mateoSit: this.mateoSit, caseTable: this.caseTable, phone: this.phone,
    };
    await this.playCutscene(data, { things, dialogueNodes: { m2_warehouse: 'worker' } });
    this.player.facing = 'left';
    gameState.clock.start(); // from here the window is running
  }

  onStoryEvent(name, data) {
    const map = this.mapData;
    if (name === 'set_clock') gameState.clock.set(data.time);
    else if (name === 'door_opens') this.ground.putTileAt(TILE.DOOR_OPEN, ...map.door);
    else if (name === 'cabinet_open') this.ground.putTileAt(TILE.CABINET_OPEN, ...map.cabinet);
    else if (name === 'carry_case') {
      this.hasCase = true;
      gameState.giveItem('case');
      this.player.setCarrying('case');
      this.carried.carrying = true;
    }
  }

  /** Out of the dock with the case: on to the walk. */
  leave() {
    this.leaving = true;
    this.goToScene(this.nextScene(), { fade: true });
  }

  nextScene() {
    // The walk to the port; until it's built (dev), the stub.
    return this.scene.manager.keys.WalkScene ? 'WalkScene' : 'YardStubScene';
  }

  update(time, delta) {
    super.update(time, delta);
    this.updateClock();
    this.carried.update();
    if (this.locks.size || this.leaving) return;
    const p = this.player;
    if (!this.talked && p.x >= this.mapData.workerTriggerX) this.talk();
    else if (this.hasCase && p.x <= this.mapData.exitX) this.leave();
  }
}
