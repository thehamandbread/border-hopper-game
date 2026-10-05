import StoryScene from './StoryScene.js';

// Indexes in tireshop_tiles.png (see tools/art/README.md).
const T = { CONCRETE: 0, WALL: 2, SIDE_L: 3, SIDE_R: 4, TL: 5, TR: 6, BL: 7, BR: 8 };

/** Mission 1, Scene 2: the tire shop. (Placeholder room until the tire shop map is built.) */
export default class TireShopScene extends StoryScene {
  constructor() {
    super('TireShopScene');
  }

  create() {
    const w = 18;
    const h = 11;
    const tiles = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        if (y === 0) row.push(x === 0 ? T.TL : x === w - 1 ? T.TR : T.WALL);
        else if (y === h - 1) row.push(x === 0 ? T.BL : x === w - 1 ? T.BR : T.WALL);
        else row.push(x === 0 ? T.SIDE_L : x === w - 1 ? T.SIDE_R : T.CONCRETE);
      }
      tiles.push(row);
    }
    this.buildStory({
      tileWidth: 16,
      tileHeight: 16,
      width: w,
      height: h,
      tileset: { key: 'tireshop_tiles', blocking: [2, 3, 4, 5, 6, 7, 8] },
      start: { tileX: 9, tileY: 8, facing: 'up' },
      tiles,
    });
  }
}
