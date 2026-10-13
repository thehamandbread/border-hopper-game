import { gameState } from '../systems/GameState.js';
import { pixelText } from '../systems/pixelText.js';
import StoryScene from './StoryScene.js';

const SIGN_TEXT = 'CLOSED FOR REPAIRS'; // the cardboard sign's words (docs/script/mission1.md), shown as game text
const SIGN_READ_RANGE = 40;             // px from the sign: close enough to read it
const SIGN_DEPTH = 2500;

/**
 * Mission 1, Scene 4: Three Hills (threehills_map.json, dialogue m1_threehills). Mateo walks from the
 * port exit along the street (the food truck is examinable) to Fourth Street. Reaching the laundromat
 * plays the window narration; its front door is locked, and the first time the back-door text arrives
 * from Unknown number, with the hint. Until then the alley mouth is blocked (no text); after it,
 * walking into the mouth goes to the alley.
 */
export default class ThreeHillsScene extends StoryScene {
  constructor() {
    super('ThreeHillsScene');
  }

  create() {
    const map = this.cache.json.get('threehills_map');
    this.buildStory(map);
    this.fourthPlayed = false;
    this.leaving = false;
    const truck = map.foodTruck;
    this.add.image(truck.x, truck.y, 'food_truck').setOrigin(0, 1).setDepth(truck.y);

    const bench = map.bench;
    const benchFeet = this.tileFeet(bench.tileX, bench.tileY);
    this.add.image(bench.tileX * 16, benchFeet.y, 'bus_bench').setOrigin(0, 1).setDepth(benchFeet.y);
    this.addBlocker(bench.tileX * 16, bench.tileY * 16, bench.w * 16, 16);

    // The cardboard sign in the laundromat's window; its words show as text when Mateo is close.
    const sx = map.closedSign.tileX * 16 + 2;
    const sy = map.closedSign.tileY * 16 + 3;
    this.add.image(sx, sy, 'closed_sign').setOrigin(0, 0).setDepth(1);
    this.signAt = { x: sx + 6, y: sy + 5 };
    this.signLabel = pixelText(this, 0, 0, SIGN_TEXT, { color: 0x2a2018 }).setOrigin(0.5, 1).setDepth(SIGN_DEPTH + 1);
    this.signLabel.setPosition(Math.round(this.signAt.x), sy - 3);
    this.signBack = this.add.graphics().setDepth(SIGN_DEPTH);
    const pad = 3;
    const w = this.signLabel.width + pad * 2;
    const h = this.signLabel.height + pad * 2 - 1;
    this.signBack.fillStyle(0xbe9c6c, 1).fillRect(Math.round(this.signAt.x - w / 2), sy - 3 - h + pad - 1, w, h);
    this.signBack.lineStyle(1, 0x241a14).strokeRect(Math.round(this.signAt.x - w / 2) + 0.5, sy - 3 - h + pad - 0.5, w - 1, h - 1);
    this.showSign(false);

    const [dx, dy] = map.laundromatDoor;
    this.interactions.register({ tileX: dx, tileY: dy, prompt: 'Open', handler: () => this.startDialogue('m1_threehills', 'door') });

    // The alley mouth: blocked until the back-door text has arrived.
    const [ax, ay] = map.alleyMouth;
    this.alleyBlock = this.addBlocker(ax * 16, ay * 16, 16, 16);
    this.alleyMouth = { x0: ax * 16, x1: (ax + 1) * 16, y: (ay + 1) * 16 };
  }

  /** A solid, invisible rectangle (px) Mateo can't walk through. */
  addBlocker(x, y, w, h) {
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(zone, true);
    zone.collider = this.physics.add.collider(this.player, zone);
    return zone;
  }

  showSign(on) {
    this.signLabel.setVisible(on);
    this.signBack.setVisible(on);
  }

  update() {
    super.update();
    const p = this.player;
    this.showSign(!this.hints.showing && Math.hypot(p.x - this.signAt.x, p.y - 8 - this.signAt.y) < SIGN_READ_RANGE + 16);
    if (this.locks.size || this.leaving) return;
    if (!this.fourthPlayed && p.x >= this.mapData.fourthStreetX * 16) {
      this.fourthPlayed = true;
      this.startDialogue('m1_threehills', 'fourth');
      return;
    }
    const open = gameState.getFlag('m1_back_door_text') === true;
    if (open && this.alleyBlock.collider.active) {
      this.alleyBlock.collider.active = false;
      this.alleyBlock.body.enable = false;
    }
    const m = this.alleyMouth;
    if (open && p.x > m.x0 && p.x < m.x1 && p.y < m.y - 2) {
      this.leaving = true;
      this.goToScene('ThreeHillsStubScene', { fade: true, data: { label: 'The alley (next build)' } });
    }
  }
}
