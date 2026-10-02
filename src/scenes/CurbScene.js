import Phaser from 'phaser';
import DialogueBox from '../objects/DialogueBox.js';
import { SMOKE_ANIM, SMOKE_TEXTURE } from '../objects/FireEffects.js';
import PhoneUI from '../objects/PhoneUI.js';
import CutsceneRunner from '../systems/CutsceneRunner.js';
import DialogueRunner from '../systems/DialogueRunner.js';
import { gameState } from '../systems/GameState.js';
import { pixelText } from '../systems/pixelText.js';

const NIGHT_DEPTH = 900;      // over the street, the actors and the car
const LIGHT_DEPTH = 950;      // the streetlight's pool glows above the night overlay
const SMOKE_DEPTH = 905;      // faint wisps just above the overlay
const TRUCK_GLOW_W = 60;
const END_PAUSE_MS = 800;
const END_FADE_MS = 1200;
const MATEO_SEAT = { x: 200, y: 146 }; // matches the "mateo" actor in cutscenes/curb.json

/**
 * The curb outside the burned restaurant, at night. Builds the street, the night look (a dark blue
 * overlay with the streetlight's pool above it), smoke wisps, then plays cutscenes/curb.json:
 * "Later that night.", the last fire truck leaving, Don Aurelio's sedan, and the curb conversation.
 */
export default class CurbScene extends Phaser.Scene {
  constructor() {
    super('CurbScene');
  }

  create() {
    const mapData = this.cache.json.get('curb_map');
    const { tileWidth, tileHeight, width, height } = mapData;
    const map = this.add.tilemap(undefined, tileWidth, tileHeight, width, height, mapData.tiles);
    const tileset = map.addTilesetImage(mapData.tileset.key, mapData.tileset.key, tileWidth, tileHeight);
    map.createLayer(0, tileset, 0, 0);

    const cam = this.cameras.main;
    const mapW = width * tileWidth;
    const mapH = height * tileHeight;
    cam.setScroll((mapW - cam.width) / 2, (mapH - cam.height) / 2);

    const { decor, night } = mapData;
    this.add.image(decor.streetlight[0], decor.streetlight[1], 'streetlight').setOrigin(0.5, 1).setDepth(decor.streetlight[1]);
    this.add
      .rectangle(0, 0, cam.width, cam.height, parseInt(night.color, 16), night.alpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(NIGHT_DEPTH);
    this.add.image(decor.lightPool[0], decor.lightPool[1], 'light_pool').setDepth(LIGHT_DEPTH);
    this.addSmoke(decor.smoke);
    this.makeTruckGlowTexture();

    this.dialogueBox = new DialogueBox(this);
    this.phone = new PhoneUI(this, { canOpen: () => !this.dialogueBox.active && !this.ending });
    this.textRead = false;
    this.phone.on('opened', () => {
      if (this.phone.messages.length) this.textRead = true;
      this.hint?.destroy();
    });
    this.phone.on('closed', () => {
      if (this.textRead) this.endPrologue();
    });
    this.events.once('shutdown', () => this.sound.stopAll());
    this.playCurb();
  }

  /** Smoke wisps rising slowly from the storefront and fading, staggered so they don't move together. */
  addSmoke(points) {
    points.forEach(([x, y], i) => {
      const s = this.add.sprite(x, y, SMOKE_TEXTURE, i % 2).setDepth(SMOKE_DEPTH).setAlpha(0);
      s.play({ key: SMOKE_ANIM, startFrame: i % 2 });
      this.tweens.add({
        targets: s,
        y: y - 14,
        alpha: { from: 0.55, to: 0 },
        duration: 4200,
        delay: i * 900,
        repeat: -1,
        onRepeat: () => {
          s.y = y;
        },
        onUpdate: () => {
          s.y = Math.round(s.y);
        },
      });
    });
  }

  /** Red glow at the right edge of the screen: the last fire truck leaving (a few banded columns). */
  makeTruckGlowTexture() {
    if (this.textures.exists('truck_glow')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const h = this.cameras.main.height;
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0xff2a1a, 0.08 + i * 0.07).fillRect((TRUCK_GLOW_W / 6) * i, 0, TRUCK_GLOW_W / 6, h);
    }
    g.generateTexture('truck_glow', TRUCK_GLOW_W, h);
    g.destroy();
  }

  async playCurb() {
    const data = await CutsceneRunner.load(this, 'curb');
    // The glow is fixed to the screen's right edge.
    const cutscene = new CutsceneRunner(this, data, {
      startDialogue: (id) => this.startDialogue(id),
      onStoryEvent: (name, payload) => this.onStoryEvent(name, payload),
    });
    cutscene.get('truckGlow').setScrollFactor(0).setAlpha(0.8);
    await cutscene.play();
  }

  /** Story events the scene handles itself (the cutscene file handles the rest). */
  onStoryEvent(name, payload) {
    if (name === 'first_text') {
      this.phone.receiveText(payload);
      // Hint above Mateo's head (above the night overlay), until he opens the phone.
      this.hint = pixelText(this, 0, 0, 'You got a text. Press Q to read.').setOrigin(0, 1).setDepth(2000);
      this.hint.setPosition(Math.round(MATEO_SEAT.x - this.hint.width / 2), MATEO_SEAT.y - 36);
    }
  }

  /** After the first text is read and the phone closed: fade out to the end card. Any key starts over. */
  endPrologue() {
    if (this.ending) return;
    this.ending = true;
    this.time.delayedCall(END_PAUSE_MS, () => {
      const cam = this.cameras.main;
      const black = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(7000).setAlpha(0);
      this.tweens.add({
        targets: black,
        alpha: 1,
        duration: END_FADE_MS,
        onComplete: () => {
          const title = pixelText(this, 0, 0, 'END OF PROLOGUE', { size: 16 }).setScrollFactor(0).setDepth(7001);
          title.setPosition(Math.round((cam.width - title.width) / 2), Math.round(cam.height / 2 - 14));
          const sub = pixelText(this, 0, 0, 'More coming soon.', { color: 0xb8b0c0 }).setScrollFactor(0).setDepth(7001);
          sub.setPosition(Math.round((cam.width - sub.width) / 2), Math.round(cam.height / 2 + 8));
          this.input.keyboard.once('keydown', () => {
            gameState.reset();
            this.scene.start('RestaurantScene');
          });
        },
      });
    });
  }

  startDialogue(id) {
    const data = this.cache.json.get(`dialogue_${id}`);
    const runner = new DialogueRunner(data, gameState);
    if (import.meta.env.DEV) {
      runner.on('event', (name) => console.log('[dialogue] event', name));
      runner.on('choice-made', (option, i) => console.log('[dialogue] choice', i + 1, option.text));
    }
    this.dialogueBox.present(runner);
    runner.start();
    return runner;
  }

  update() {
    this.dialogueBox.update();
    this.phone.update();
  }
}
