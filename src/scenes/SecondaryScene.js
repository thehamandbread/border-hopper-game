import StoryScene from './StoryScene.js';

const FRAME = { WORKER: 0, FOLDER: 1, MATEO_SEATED: 2, MATEO_AT_DESK: 3, CARR_WRITING: 16, DOOR_OPEN: 14 };
const PROP = { ENVELOPE: 0, PAGES: 1, DOCUMENTS: 2 };
const DESK_X = 24 * 16;           // the desk spans columns 23-24 (secondary_map.json)
const CARR_DESK_Y = 2 * 16 + 2;   // her waist-up frame's bottom row is the desk's far edge
const MATEO_DESK_Y = 4 * 16 + 6;  // his chair in front of the desk

/**
 * Mission 1, Scene 3b: secondary inspection (secondary_map.json, dialogue m1_secondary,
 * cutscenes/m1_secondary.json). The waiting room, then Officer Carr's office: her follow-ups compare
 * against the booth answers (questions with nothing to compare are skipped), the envelope, and the
 * outcome. Under the refusal threshold: on to Three Hills. At or over it: refused
 * entry; the data has already raised Heat, flagged the card, counted the attempt and cleared the
 * booth answers, and the mission restarts from the line.
 */
export default class SecondaryScene extends StoryScene {
  constructor() {
    super('SecondaryScene');
  }

  create() {
    const map = this.cache.json.get('secondary_map');
    this.buildStory(map);
    this.result = null;
    const seat = (key, frame, [tx, ty]) => {
      const at = this.tileFeet(tx, ty);
      return this.add.sprite(at.x, at.y, key, frame).setOrigin(0.5, 1).setDepth(at.y);
    };
    seat('waiting_people', FRAME.WORKER, map.seats.worker);
    seat('waiting_people', FRAME.FOLDER, map.seats.folder);
    this.mateoSeat = seat('waiting_people', FRAME.MATEO_SEATED, map.seats.mateo).setVisible(false);
    this.mateoDesk = this.add.sprite(DESK_X, MATEO_DESK_Y, 'waiting_people', FRAME.MATEO_AT_DESK)
      .setOrigin(0.5, 1).setDepth(MATEO_DESK_Y).setVisible(false);
    this.carrDesk = this.add.sprite(DESK_X, CARR_DESK_Y, 'carr_walk', FRAME.CARR_WRITING)
      .setOrigin(0.5, 1).setDepth(CARR_DESK_Y).setVisible(false);
    const door = this.tileFeet(...map.officeDoor);
    this.carr = this.add.sprite(door.x, door.y, 'carr_walk', 0).setOrigin(0.5, 1).setVisible(false);
    Object.assign(this.carr, { walk: 'carr-walk', facing: 'down' });
    // On the desk, in front of her (shown once they're in the office).
    const prop = (frame, x) => this.add.sprite(x, CARR_DESK_Y + 9, 'secondary_props', frame).setOrigin(0.5, 1)
      .setDepth(CARR_DESK_Y + 20).setVisible(false);
    this.props = {
      envelope: prop(PROP.ENVELOPE, DESK_X + 8),
      pages: prop(PROP.PAGES, DESK_X + 6),
      documents: prop(PROP.DOCUMENTS, DESK_X - 9),
    };
    this.inspect();
  }

  async inspect() {
    const things = {
      carr: this.carr, carrDesk: this.carrDesk, mateoSeat: this.mateoSeat, mateoDesk: this.mateoDesk, ...this.props,
    };
    await this.playCutscene('m1_secondary', { things });
    if (this.result === 'refused') this.goToScene('PortScene', { fade: true });
    else this.goToScene('ThreeHillsScene', { fade: true });
  }

  onStoryEvent(name) {
    if (name === 'door_open') this.ground.putTileAt(FRAME.DOOR_OPEN, ...this.mapData.officeDoor);
    else if (name === 'office') {
      this.props.envelope.setVisible(true);
      this.props.documents.setVisible(true);
    } else if (name === 'secondary_pass') this.result = 'pass';
    else if (name === 'refused') this.result = 'refused';
  }
}
