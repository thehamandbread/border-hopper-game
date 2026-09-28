import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Game setup OK', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
