import Phaser from 'phaser';

/**
 * Shared dialogue controls for every presenter: Space (complete / advance / confirm),
 * W/S or up/down (move the choice highlight), 1-3 (pick a choice directly).
 * Uses JustDown, so a held key is one action: browser key-repeat never re-triggers it.
 */
export default class DialogueInput {
  constructor(scene) {
    const kb = scene.input.keyboard;
    this.keys = {
      space: kb.addKey('SPACE'),
      up: kb.addKey('UP'),
      down: kb.addKey('DOWN'),
      w: kb.addKey('W'),
      s: kb.addKey('S'),
      n1: kb.addKey('ONE'),
      n2: kb.addKey('TWO'),
      n3: kb.addKey('THREE'),
    };
  }

  /** Throw away presses that happened before the dialogue, so they can't act on it. */
  drain() {
    for (const k of Object.values(this.keys)) Phaser.Input.Keyboard.JustDown(k);
  }

  /** This frame's actions: { space, up, down, pick } where pick is 0-2, or -1 for none. */
  read() {
    const JD = Phaser.Input.Keyboard.JustDown;
    const k = this.keys;
    return {
      space: JD(k.space),
      up: JD(k.up) || JD(k.w),
      down: JD(k.down) || JD(k.s),
      pick: [JD(k.n1), JD(k.n2), JD(k.n3)].indexOf(true),
    };
  }
}
