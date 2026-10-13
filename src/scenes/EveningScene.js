import CutsceneRunner from '../systems/CutsceneRunner.js';
import ApartmentScene from './ApartmentScene.js';

// Sprite positions (feet, bottom centre), in px. The table is tiles (4, 5)-(4, 6) of apartment_map.json.
const ABUELA_SEAT = { x: 72, y: 83 };   // at the table, facing down (abuela_walk frame 16), as at breakfast
const TOMI_COUCH = { x: 256, y: 37 };   // on the couch, tiles (15, 1)-(16, 1)
const BASKET = { x: 68, y: 92 };        // the mending, on Abuela's side of the table
const NOTICES = { x: 69, y: 99 };       // Mateo's side
const ENVELOPE = { x: 77, y: 100 };
const FRIDGE = [5, 1];                  // the lower fridge tile, with the notices on it
const DOOR = { tileX: 16, tileY: 10 };  // the front door: Mateo comes in here
const FRAME = { ABUELA_SITTING: 16, TOMI_ON_COUCH: 32, BASKET: 4, ENVELOPE: 5, NOTICES: 6 };
const TILE = { FRIDGE_BARE: 24 };
const OVERLAY_DEPTH = 900;              // the evening overlay sits over the room and everyone in it...
const LIGHT_DEPTH = 950;                // ...and the lamp and its light over that
const START_DELAY_MS = 600;

/**
 * Mission 1, Scene 5: Evening, back at the apartment (the home scene's map and people: ApartmentScene).
 * Scripted: Mateo is locked throughout and there's nothing to examine. The room is dimmed by one overlay
 * with the lamp's light above it. cutscenes/m1_evening.json plays dialogue m1_evening and stages its
 * beats (Mateo comes in, takes the notices off the fridge, sits, puts the envelope down; Tomi counts
 * on option 2; Mateo stands, the envelope stays). Then a fade to the end-of-mission summary.
 */
export default class EveningScene extends ApartmentScene {
  constructor() {
    super('EveningScene');
  }

  create() {
    const mapData = this.cache.json.get('apartment_map');
    this.buildStory({ ...mapData, examinables: [], start: { ...DOOR, facing: 'up' } });
    this.setLock('evening', true);
    this.player.setVisible(false);
    this.createPeople();
    this.asleep.setVisible(false);
    this.abuela.setFrame(FRAME.ABUELA_SITTING).setPosition(ABUELA_SEAT.x, ABUELA_SEAT.y).setDepth(ABUELA_SEAT.y);
    this.tomiSit = this.add.sprite(TOMI_COUCH.x, TOMI_COUCH.y, 'tomi_walk', FRAME.TOMI_ON_COUCH).setOrigin(0.5, 1).setDepth(TOMI_COUCH.y);
    const prop = ({ x, y }, frame) => this.add.sprite(x, y, 'apartment_props', frame).setOrigin(0.5, 1).setDepth(y);
    prop(BASKET, FRAME.BASKET);
    this.notices = prop(NOTICES, FRAME.NOTICES).setVisible(false);
    this.envelope = prop(ENVELOPE, FRAME.ENVELOPE).setVisible(false).setDepth(ENVELOPE.y + 1);
    this.play();
  }

  async play() {
    const data = await CutsceneRunner.load(this, 'm1_evening');
    this.addEvening(data.evening);
    await new Promise((resolve) => this.time.delayedCall(START_DELAY_MS, resolve));
    const things = {
      abuela: this.abuela, tomi: this.tomi, tomiSit: this.tomiSit, mateoSit: this.mateoSit,
      notices: this.notices, envelope: this.envelope,
    };
    await this.playCutscene(data, { things });
    this.goToScene('SummaryScene', { fade: true });
  }

  /** Evening: one dim overlay over the room, the lamp and its pool of light above it. */
  addEvening({ overlay, lamp, lightPool }) {
    const cam = this.cameras.main;
    this.add.rectangle(0, 0, cam.width, cam.height, parseInt(overlay.color, 16), overlay.alpha)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(OVERLAY_DEPTH);
    this.add.image(lightPool[0], lightPool[1], 'light_pool').setDepth(LIGHT_DEPTH);
    this.add.image(lamp[0], lamp[1], 'lamp').setOrigin(0.5, 1).setDepth(LIGHT_DEPTH + 1);
  }

  onStoryEvent(name) {
    if (name === 'notices_off') this.ground.putTileAt(TILE.FRIDGE_BARE, ...FRIDGE);
  }
}
