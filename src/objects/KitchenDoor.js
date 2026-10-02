import Phaser from 'phaser';

export const KITCHEN_DOOR_TEXTURE = 'kitchen_door';
const FRAME_MS = 60;
const OPEN = 'kitchen-door-open';
const CLOSE = 'kitchen-door-close';

/** Registers the open/close animations (global, safe to call more than once). */
export function createKitchenDoorAnimations(anims) {
  if (anims.exists(OPEN)) return;
  const frames = (order) => order.map((frame) => ({ key: KITCHEN_DOOR_TEXTURE, frame }));
  anims.create({ key: OPEN, frames: frames([0, 1, 2]), frameRate: 1000 / FRAME_MS, repeat: 0 });
  anims.create({ key: CLOSE, frames: frames([2, 1, 0]), frameRate: 1000 / FRAME_MS, repeat: 0 });
}

/**
 * Swinging cafe doors across a 2-tile doorway. Opens while the player's feet box is in the
 * doorway zone and closes when it leaves. Purely visual: it never blocks movement.
 */
export default class KitchenDoor extends Phaser.GameObjects.Sprite {
  /** x, y is the top-left of the doorway (the counter row, 2 tiles wide). */
  constructor(scene, x, y, player) {
    super(scene, x, y, KITCHEN_DOOR_TEXTURE, 0);
    scene.add.existing(this);
    this.setOrigin(0, 0);
    // Depth-sort by feet y: the player is in front once their feet pass the leaves' base line.
    this.setDepth(y + 12);
    this.player = player;
    this.zone = new Phaser.Geom.Rectangle(x, y + 2, 32, 12); // the doorway, inset 2 px so touching its edge does not count
    this.isOpen = false;
  }

  update() {
    const b = this.player.body;
    const inZone = Phaser.Geom.Intersects.RectangleToRectangle(this.zone, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height));
    if (inZone === this.isOpen) return;
    this.isOpen = inZone;
    // Continue from the current frame so a reversal mid-swing doesn't jump.
    const frame = Number(this.frame.name);
    if (inZone) this.play({ key: OPEN, startFrame: frame });
    else this.play({ key: CLOSE, startFrame: 2 - frame });
  }
}
