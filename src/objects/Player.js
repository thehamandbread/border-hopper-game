import Phaser from 'phaser';

// Walk speed in pixels per second. Tune here.
export const PLAYER_SPEED = 70;

const WALK_FPS = 8;
const FRAME_W = 16;
const FRAME_H = 32;
const FRAMES_PER_DIR = 4;
// Sprite sheet rows, in order.
const DIRECTIONS = ['down', 'up', 'right', 'left'];
// Collision box at Mateo's feet.
const BODY_W = 10;
const BODY_H = 6;

export const PLAYER_TEXTURE = 'mateo_walk';

/** Registers the four walk animations (global, safe to call once). */
export function createPlayerAnimations(anims) {
  DIRECTIONS.forEach((dir, row) => {
    anims.create({
      key: `walk-${dir}`,
      frames: anims.generateFrameNumbers(PLAYER_TEXTURE, {
        start: row * FRAMES_PER_DIR,
        end: row * FRAMES_PER_DIR + FRAMES_PER_DIR - 1,
      }),
      frameRate: WALK_FPS,
      repeat: -1,
    });
  });
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  /** x, y is the position of Mateo's feet (bottom-center of the sprite). */
  constructor(scene, x, y) {
    super(scene, x, y, PLAYER_TEXTURE, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.body.setSize(BODY_W, BODY_H);
    this.body.setOffset((FRAME_W - BODY_W) / 2, FRAME_H - BODY_H);
    this.setCollideWorldBounds(true);

    this.facing = 'down';
    this.keys = scene.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      upArrow: 'UP',
      downArrow: 'DOWN',
      leftArrow: 'LEFT',
      rightArrow: 'RIGHT',
    });
  }

  update() {
    const k = this.keys;
    const dx = (k.right.isDown || k.rightArrow.isDown ? 1 : 0) - (k.left.isDown || k.leftArrow.isDown ? 1 : 0);
    const dy = (k.down.isDown || k.downArrow.isDown ? 1 : 0) - (k.up.isDown || k.upArrow.isDown ? 1 : 0);

    if (dx === 0 && dy === 0) {
      this.setVelocity(0, 0);
      this.anims.stop();
      this.setFrame(DIRECTIONS.indexOf(this.facing) * FRAMES_PER_DIR);
      return;
    }

    // Horizontal wins when moving diagonally.
    if (dx !== 0) {
      this.facing = dx > 0 ? 'right' : 'left';
    } else {
      this.facing = dy > 0 ? 'down' : 'up';
    }

    // Normalize so diagonals aren't faster.
    this.body.velocity.set(dx, dy).normalize().scale(PLAYER_SPEED);
    this.anims.play(`walk-${this.facing}`, true);
  }
}
