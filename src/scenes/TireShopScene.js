import { showCardUntilKey } from '../systems/cards.js';
import { gameState } from '../systems/GameState.js';
import StoryScene from './StoryScene.js';

// Sprite positions (feet, bottom centre, in px). Tile positions are in tireshop_map.json.
const TRUCK = { x: 144, y: 56 };        // top-left of the pickup; drawn above Nando while he's under it
const TRUCK_DEPTH = 80;                 // the truck's bottom edge
const UNDER_TRUCK = { x: 168, y: 88 };  // Nando's legs and the creeper, sticking out from under the truck
const ROLLED_OUT = { x: 168, y: 112 };  // where he rolls out to and stands (cutscenes/m1_nando.json)
const RUIZ = { x: 80, y: 131 };         // waist-up behind the counter (the frame's bottom is the counter's edge)
const TALK_SPOT = [12, 6];              // where Mateo stands to talk to Nando (Nando rolls out to his left)
const FRAME = { RUIZ_WRITING: 16, NANDO_LEGS: 16, NANDO_RIGHT: 8 };
const ARRIVE_DELAY_MS = 900;

/**
 * Mission 1, Scene 2: Llantera Ruiz. Mateo walks in from the street. The arrival narration plays, then
 * he has control: the window sign is examinable, Sr. Ruiz is writing at the counter (talking to him
 * plays m1_ruiz, with the ruiz_secret choice), and after that the truck plays the Nando cutscene
 * (cutscenes/m1_nando.json), which gives him the envelope. Then the street exit ends the build so far
 * with a "MISSION 1 CONTINUES: THE CROSSING" card.
 *
 * data (checkpoints): { ruizDone: true } as if he'd already talked to Sr. Ruiz; { arrived: true } skips
 * the arrival narration.
 */
export default class TireShopScene extends StoryScene {
  constructor() {
    super('TireShopScene');
  }

  create(data = {}) {
    const mapData = this.cache.json.get('tireshop_map');
    this.buildStory(mapData);
    this.ruizDone = !!data.ruizDone;
    this.nandoStarted = false;
    this.nandoDone = false;
    this.createTruck();
    this.ruiz = this.add.sprite(RUIZ.x, RUIZ.y, 'ruiz_walk', FRAME.RUIZ_WRITING).setOrigin(0.5, 1).setDepth(RUIZ.y);
    this.ruiz.play('ruiz-writing');
    this.registerInteractables(mapData);
    if (!data.arrived && !data.ruizDone) {
      this.setLock('arriving', true);
      this.time.delayedCall(ARRIVE_DELAY_MS, () => {
        this.setLock('arriving', false);
        this.startDialogue('m1_shop_arrive');
      });
    }
  }

  /** The pickup, Nando under it on his creeper (legs showing), and Nando standing (hidden until he rolls out). */
  createTruck() {
    this.add.image(TRUCK.x, TRUCK.y, 'pickup_truck').setOrigin(0, 0).setDepth(TRUCK_DEPTH);
    const under = (key, frame, depth) =>
      Object.assign(this.add.sprite(UNDER_TRUCK.x, UNDER_TRUCK.y, key, frame).setOrigin(0.5, 1).setDepth(depth), { fixedDepth: depth });
    this.creeper = under('creeper', 0, TRUCK_DEPTH - 3);
    this.nandoLying = under('nando_walk', FRAME.NANDO_LEGS, TRUCK_DEPTH - 2);
    this.nando = this.add.sprite(ROLLED_OUT.x, ROLLED_OUT.y, 'nando_walk', FRAME.NANDO_RIGHT).setOrigin(0.5, 1).setVisible(false);
    Object.assign(this.nando, { walk: 'nando-walk', facing: 'right' });
    // Mateo can't walk through the truck or over Nando's legs.
    const blocker = this.add.zone(TRUCK.x + 24, TRUCK.y + 16, 46, 30);
    this.physics.add.existing(blocker, true);
    this.physics.add.collider(this.player, blocker);
  }

  registerInteractables(mapData) {
    for (const [tileX, tileY] of mapData.counter) {
      this.interactions.register({
        tileX, tileY, prompt: 'Talk', enabled: () => !this.ruizDone, handler: () => this.talkToRuiz(),
      });
    }
    // Before he's talked to Sr. Ruiz, the truck has no prompt.
    for (const [tileX, tileY] of mapData.truckTiles) {
      this.interactions.register({
        tileX, tileY, prompt: 'Talk', enabled: () => this.ruizDone && !this.nandoStarted, handler: () => this.talkToNando(),
      });
    }
    for (const [tileX, tileY] of mapData.street) {
      this.interactions.register({
        tileX, tileY, prompt: 'Leave', enabled: () => this.nandoDone, handler: () => this.leave(),
      });
    }
  }

  talkToRuiz() {
    const runner = this.startDialogue('m1_ruiz');
    runner.on('end', () => {
      this.ruizDone = true;
      this.ruiz.play('ruiz-writing');
    });
  }

  onStoryEvent(name) {
    if (name === 'ruiz_looks_up') {
      this.ruiz.anims.stop();
      this.ruiz.setFrame(FRAME.RUIZ_WRITING);
    }
  }

  async talkToNando() {
    this.nandoStarted = true;
    const col = Math.round((this.player.x - 8) / 16);
    const prepend = [{ type: 'moveActor', actor: 'player', path: [[col, TALK_SPOT[1]], TALK_SPOT], speed: 70 }];
    const things = { nando: this.nando, nandoLying: this.nandoLying, creeper: this.creeper };
    await this.playCutscene('m1_nando', { prepend, things });
    this.player.facing = 'left';
    this.nandoDone = true;
  }

  /** The end of what's built: a placeholder card. Any key opens the checkpoint menu (dev) or starts over. */
  async leave() {
    this.setLock('leaving', true);
    await showCardUntilKey(this, 'MISSION 1 CONTINUES: THE CROSSING');
    if (import.meta.env.DEV && this.game.devTools) {
      this.game.devTools.setOpen(true);
    } else {
      gameState.reset();
      this.scene.start('RestaurantScene');
    }
  }
}
