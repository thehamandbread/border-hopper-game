export const FIRE_TEXTURE = 'fire';
export const SMOKE_TEXTURE = 'smoke';
export const FIRE_ANIM = 'fire-burn';
export const SMOKE_ANIM = 'smoke-drift';

/** Registers the looping fire (3 frames) and smoke (2 frames) animations. Safe to call more than once. */
export function createFireAnimations(anims) {
  if (anims.exists(FIRE_ANIM)) return;
  anims.create({
    key: FIRE_ANIM,
    frames: anims.generateFrameNumbers(FIRE_TEXTURE, { start: 0, end: 2 }),
    frameRate: 8,
    repeat: -1,
  });
  anims.create({
    key: SMOKE_ANIM,
    frames: anims.generateFrameNumbers(SMOKE_TEXTURE, { start: 0, end: 1 }),
    frameRate: 3,
    repeat: -1,
  });
}
