import StoryScene from './StoryScene.js';

// Indexes in apartment_tiles.png (see tools/art/README.md).
const T = { LINO: 0, WALL: 3, SIDE_L: 5, SIDE_R: 6, TL: 7, TR: 8, BL: 9, BR: 10 };

/** Mission 1, Scene 1: the home. (Placeholder room until the apartment map is built.) */
export default class ApartmentScene extends StoryScene {
  constructor() {
    super('ApartmentScene');
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
        else row.push(x === 0 ? T.SIDE_L : x === w - 1 ? T.SIDE_R : T.LINO);
      }
      tiles.push(row);
    }
    this.buildStory({
      tileWidth: 16,
      tileHeight: 16,
      width: w,
      height: h,
      tileset: { key: 'apartment_tiles', blocking: [3, 4, 5, 6, 7, 8, 9, 10] },
      start: { tileX: 9, tileY: 5 },
      tiles,
    });
  }
}
