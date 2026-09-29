import Phaser from 'phaser';
import Player from '../objects/Player.js';

export default class MovementTestScene extends Phaser.Scene {
  constructor() {
    super('MovementTestScene');
  }

  create() {
    const mapData = this.cache.json.get('movement_test_map');
    const { tileWidth, tileHeight, width, height } = mapData;

    const map = this.add.tilemap(undefined, tileWidth, tileHeight, width, height, mapData.tiles);
    const tileset = map.addTilesetImage(mapData.tileset.key, mapData.tileset.key, tileWidth, tileHeight);
    const ground = map.createLayer(0, tileset, 0, 0);
    ground.setCollision(mapData.tileset.blocking);

    const mapW = width * tileWidth;
    const mapH = height * tileHeight;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    // Start tile -> feet position at the bottom-center of that tile.
    const { tileX, tileY } = mapData.start;
    this.player = new Player(this, tileX * tileWidth + tileWidth / 2, (tileY + 1) * tileHeight);
    this.physics.add.collider(this.player, ground);

    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true);
  }

  update() {
    this.player.update();
  }
}
