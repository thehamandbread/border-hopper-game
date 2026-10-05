import StoryScene from './StoryScene.js';

// Sprite positions (feet, bottom centre), in px. Tile positions are in apartment_map.json.
const ASLEEP = { x: 256, y: 34 };   // Mateo on the couch (mateo_extra frame 0)
const SEAT = { x: 72, y: 128 };     // Mateo at the table, back to us (mateo_extra frame 1, over the chair_back tile)
const HALLWAY = { x: 296, y: 16 };  // Tomi steps out of the hallway doorway
const PLATE = { x: 72, y: 102 };
const BOTTLE = { x: 70, y: 94 };
const ABUELA_AT_STOVE = [3, 2];
const TABLE_SIDE_ROW = 8;           // Mateo walks round to stand behind his chair before he sits
const WAKE_MS = 1200;
const PROPS_TEXTURE = 'apartment_props';
const FRAME = { MATEO_ASLEEP: 0, MATEO_SITTING: 1, PLATE: 1, BOTTLE: 0, ABUELA_UP: 4, TOMI_ONE_SHOE: 16 };

/**
 * Mission 1, Scene 1: the morning after, at home. Mateo wakes on the couch and can walk the apartment
 * (photo, fridge, backpack and jacket are examinable). Abuela is at the stove. Sitting down at the
 * table plays the breakfast cutscene (cutscenes/m1_home.json, dialogue m1_home). Afterwards the front
 * door leads to the tire shop, via a "Calle Morelos" card.
 *
 * data (checkpoints): { awake: true } skips waking up.
 */
export default class ApartmentScene extends StoryScene {
  constructor() {
    super('ApartmentScene');
  }

  create(data = {}) {
    const mapData = this.cache.json.get('apartment_map');
    this.buildStory(mapData);
    this.breakfastStarted = false;
    this.breakfastDone = false;
    this.createPeople();
    this.createProps(mapData);
    this.registerTable(mapData);
    this.registerFrontDoor(mapData);
    if (data.awake) this.asleep.setVisible(false);
    else this.wakeUp();
  }

  createPeople() {
    const at = this.tileFeet(...ABUELA_AT_STOVE);
    this.abuela = this.add.sprite(at.x, at.y, 'abuela_walk', FRAME.ABUELA_UP).setOrigin(0.5, 1).setDepth(at.y);
    Object.assign(this.abuela, { walk: 'abuela-walk', facing: 'up' });
    this.tomi = this.add.sprite(HALLWAY.x, HALLWAY.y, 'tomi_walk', FRAME.TOMI_ONE_SHOE).setOrigin(0.5, 1).setVisible(false);
    Object.assign(this.tomi, { walk: 'tomi-oneshoe', facing: 'down', frameOffset: FRAME.TOMI_ONE_SHOE });
    this.asleep = this.add.sprite(ASLEEP.x, ASLEEP.y, 'mateo_extra', FRAME.MATEO_ASLEEP).setOrigin(0.5, 1).setDepth(ASLEEP.y);
    this.mateoSit = this.add.sprite(SEAT.x, SEAT.y, 'mateo_extra', FRAME.MATEO_SITTING).setOrigin(0.5, 1).setDepth(SEAT.y).setVisible(false);
  }

  /** Plate and bottle (hidden until set down); backpack and jacket, examinable while they're there. */
  createProps(mapData) {
    const prop = (x, y, frame) => this.add.sprite(x, y, PROPS_TEXTURE, frame).setOrigin(0.5, 1).setDepth(y);
    this.plate = prop(PLATE.x, PLATE.y, FRAME.PLATE).setVisible(false);
    this.bottle = prop(BOTTLE.x, BOTTLE.y, FRAME.BOTTLE).setVisible(false);
    this.props = {};
    for (const [id, p] of Object.entries(mapData.props)) {
      const at = this.tileFeet(...p.tile);
      const sprite = prop(at.x, at.y, p.frame);
      this.props[id] = sprite;
      this.registerExaminable({ tileX: p.tile[0], tileY: p.tile[1], text: p.text, enabled: () => sprite.visible });
      if (p.solid) {
        sprite.blocker = this.add.zone(at.x, at.y - 4, 10, 6);
        this.physics.add.existing(sprite.blocker, true);
        this.physics.add.collider(this.player, sprite.blocker);
      }
    }
  }

  /** Mateo asleep on the couch; after the fade-in he gets up and the player has control. */
  wakeUp() {
    this.player.setVisible(false);
    this.setLock('waking', true);
    this.time.delayedCall(800 + WAKE_MS, () => {
      this.asleep.setVisible(false);
      this.player.setVisible(true);
      this.setLock('waking', false);
    });
  }

  registerTable(mapData) {
    for (const [tileX, tileY] of mapData.table) {
      this.interactions.register({
        tileX,
        tileY,
        prompt: 'Sit down',
        enabled: () => !this.breakfastStarted,
        handler: () => this.startBreakfast(),
      });
    }
  }

  registerFrontDoor(mapData) {
    const [tileX, tileY] = mapData.frontDoor;
    this.interactions.register({
      tileX,
      tileY,
      prompt: 'Leave',
      enabled: () => this.breakfastDone, // not offered before breakfast
      handler: () => this.goToScene('TireShopScene', { card: 'Calle Morelos' }),
    });
  }

  /** Mateo walks round behind his chair, then the breakfast cutscene plays. options: CutsceneRunner options. */
  async startBreakfast(options = {}) {
    this.breakfastStarted = true;
    const side = this.player.x < SEAT.x ? 3 : 5; // he's beside the table, left or right of it
    const prepend = options.skipTo
      ? []
      : [{ type: 'moveActor', actor: 'player', path: [[side, TABLE_SIDE_ROW], [4, TABLE_SIDE_ROW]], speed: 70 }];
    const things = {
      abuela: this.abuela,
      tomi: this.tomi,
      mateoSit: this.mateoSit,
      plate: this.plate,
      bottle: this.bottle,
      backpack: this.props.backpack,
      jacket: this.props.jacket,
    };
    await this.playCutscene('m1_home', { prepend, things, ...options });
    this.breakfastDone = true;
    this.player.facing = 'left'; // toward Abuela, who just gave him the tortilla
    this.props.backpack.blocker?.destroy();
  }
}
