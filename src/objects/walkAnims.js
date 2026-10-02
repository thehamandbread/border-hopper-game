// Walk animations for any character sheet in the mateo_walk.png layout:
// 16x32 frames, rows down, up, right, left, 4 frames each.
export const WALK_DIRECTIONS = ['down', 'up', 'right', 'left'];
export const WALK_FRAMES_PER_DIR = 4;

/** Registers `${prefix}-down` etc. for `texture`. Safe to call more than once. */
export function createWalkAnimations(anims, texture, prefix, fps) {
  WALK_DIRECTIONS.forEach((dir, row) => {
    const key = `${prefix}-${dir}`;
    if (anims.exists(key)) return;
    anims.create({
      key,
      frames: anims.generateFrameNumbers(texture, {
        start: row * WALK_FRAMES_PER_DIR,
        end: row * WALK_FRAMES_PER_DIR + WALK_FRAMES_PER_DIR - 1,
      }),
      frameRate: fps,
      repeat: -1,
    });
  });
}

/** Standing frame for a direction. */
export function standingFrame(dir) {
  return WALK_DIRECTIONS.indexOf(dir) * WALK_FRAMES_PER_DIR;
}
