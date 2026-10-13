import ApartmentScene from './ApartmentScene.js';

// Props (feet, bottom centre, px): apartment_props.png frames. The table is tiles (4, 5)-(4, 6).
const PROPS = [
  { frame: 0, x: 74, y: 94 },     // Abuela's pill bottle, on the table
  { frame: 9, x: 70, y: 108 },    // the mending basket with Tomi's old shoes
  { frame: 7, x: 312, y: 160 },   // Tomi's new shoes, by the door (two tiles along, clear of its prompt)
  { frame: 8, x: 258, y: 30 },    // the shoe box, on the couch
];

/**
 * Mission 2, Scene 1: the morning, at home (the apartment: ApartmentScene's map; nobody else home).
 * Mateo walks it freely; the shoes, the fridge, the table and the basket are examinable (the map's
 * mission2 data). Walking up to the front door brings the text (dialogue m2_morning); after that, E at
 * the door leaves for the warehouse.
 */
export default class MorningScene extends ApartmentScene {
  constructor() {
    super('MorningScene');
  }

  create() {
    const mapData = this.cache.json.get('apartment_map');
    const m2 = mapData.mission2;
    this.buildStory({ ...mapData, examinables: m2.examinables });
    for (const p of PROPS) this.add.sprite(p.x, p.y, 'apartment_props', p.frame).setOrigin(0.5, 1).setDepth(p.y - 1);
    this.textRead = false;
    this.textStarted = false;
    this.leaving = false;
    this.doorTrigger = m2.doorTrigger;
    const [tileX, tileY] = mapData.frontDoor;
    this.interactions.register({
      tileX, tileY, prompt: 'Leave', enabled: () => this.textRead, handler: () => this.leave(),
    });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.goToScene('WarehouseScene', { fade: true });
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.textStarted || this.locks.size) return;
    const [tx, ty] = this.doorTrigger;
    const c = this.player.body.center;
    if (Math.floor(c.x / 16) === tx && Math.floor(c.y / 16) === ty) {
      this.textStarted = true;
      const runner = this.startDialogue('m2_morning');
      runner.on('end', () => (this.textRead = true));
    }
  }
}
