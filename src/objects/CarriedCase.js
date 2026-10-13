// Where the case hangs from Mateo's hand, by facing (offsets from his feet, px). Side views hold it at
// his side; facing down it's in front of his legs; facing up it's mostly hidden behind him.
const HAND = { down: [5, -6], up: [-5, -7], right: [4, -6], left: [-4, -6] };
const FRAME = 0; // case_props.png: the case carried by its handle

/**
 * The gray case in Mateo's hand (Mission 2): a small sprite that follows the player each frame, drawn
 * just in front of him (behind him when he faces up). Call update() every frame.
 */
export default class CarriedCase {
  constructor(scene, player) {
    this.player = player;
    this.sprite = scene.add.sprite(player.x, player.y, 'case_props', FRAME).setOrigin(0.5, 1).setVisible(false);
  }

  setVisible(on) {
    this.sprite.setVisible(on);
    return this;
  }

  update() {
    const p = this.player;
    const [dx, dy] = HAND[p.facing] ?? HAND.down;
    this.sprite.setVisible(p.visible && this.carrying);
    this.sprite.setPosition(Math.round(p.x + dx), Math.round(p.y + dy));
    this.sprite.setDepth(p.depth + (p.facing === 'up' ? -1 : 1));
  }

  set carrying(on) {
    this._carrying = on;
    this.sprite.setVisible(on && this.player.visible);
  }

  get carrying() {
    return this._carrying === true;
  }
}
