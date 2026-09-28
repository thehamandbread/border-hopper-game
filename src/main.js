import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
});
