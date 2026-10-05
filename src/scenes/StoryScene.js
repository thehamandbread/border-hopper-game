import Phaser from 'phaser';
import DialogueBox from '../objects/DialogueBox.js';
import PhoneUI from '../objects/PhoneUI.js';
import Player from '../objects/Player.js';
import { fadeInFromBlack, showCard } from '../systems/cards.js';
import CutsceneRunner from '../systems/CutsceneRunner.js';
import DialogueRunner from '../systems/DialogueRunner.js';
import { gameState } from '../systems/GameState.js';
import InteractionSystem from '../systems/InteractionSystem.js';

const TEXT_OPEN_DELAY_MS = 700; // a text during a conversation: the phone buzzes, then opens by itself
const FADE_IN_MS = 800;

/**
 * Base class for story scenes (Mission 1 on). buildStory(mapData) makes the tile room, Mateo, E
 * interactions, the dialogue box and the phone. Shared story tools:
 *  - examinables: E on an object shows its narration line in the box, movement locked
 *    (map "examinables", or registerExaminable())
 *  - conversations: startDialogue(id). Box conversations lock movement. The wait event "text_message"
 *    ({ from, text }) delivers a text: the phone buzzes and opens by itself, Q or Space closes it, then
 *    the conversation continues. Other story events go to the subclass's onStoryEvent(name, data);
 *    if that returns a promise, a wait event resumes when it settles.
 *  - cutscenes: playCutscene(id) (CutsceneRunner, input locked throughout)
 *  - cards: goToScene(key, { card }) fades to a location card, then starts the next scene
 *
 * Map JSON: { tileWidth, tileHeight, width, height, tileset: { key, blocking: [indexes] },
 *             start: { tileX, tileY, facing? }, tiles: [[...]], examinables?: [{ tileX, tileY, text }] }
 */
export default class StoryScene extends Phaser.Scene {
  buildStory(mapData, { fadeIn = true } = {}) {
    this.mapData = mapData;
    const { tileWidth, tileHeight, width, height } = mapData;
    const map = this.add.tilemap(undefined, tileWidth, tileHeight, width, height, mapData.tiles);
    const tileset = map.addTilesetImage(mapData.tileset.key, mapData.tileset.key, tileWidth, tileHeight);
    this.ground = map.createLayer(0, tileset, 0, 0);
    this.ground.setCollision(mapData.tileset.blocking);
    const mapW = width * tileWidth;
    const mapH = height * tileHeight;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    const { tileX, tileY, facing = 'down' } = mapData.start;
    this.player = new Player(this, tileX * tileWidth + tileWidth / 2, (tileY + 1) * tileHeight);
    this.player.facing = facing;
    this.player.setLocked(false);
    this.physics.add.collider(this.player, this.ground);

    const cam = this.cameras.main;
    if (mapW <= cam.width && mapH <= cam.height) {
      cam.setScroll(Math.round((mapW - cam.width) / 2), Math.round((mapH - cam.height) / 2));
    } else {
      cam.setBounds(0, 0, mapW, mapH);
      cam.startFollow(this.player, true);
    }

    this.locks = new Set(); // reasons Mateo can't move or interact right now (dialogue, cutscene, phone...)
    this.interactions = new InteractionSystem(this, this.player, { tileSize: tileWidth });
    this.dialogueBox = new DialogueBox(this);
    this.dialogueRunner = null;
    this.phone = new PhoneUI(this, { canOpen: () => this.locks.size === 0 });
    this.phone.on('opened', () => this.setLock('phone', true));
    this.phone.on('closed', () => this.setLock('phone', false));
    for (const e of mapData.examinables ?? []) this.registerExaminable(e);
    this.events.once('shutdown', () => this.sound.stopAll());
    if (fadeIn) {
      this.setLock('fade', true);
      fadeInFromBlack(this, FADE_IN_MS).then(() => this.setLock('fade', false));
    }
  }

  /** Mateo stands still and E does nothing while any lock is on. */
  setLock(reason, on) {
    if (on) this.locks.add(reason);
    else this.locks.delete(reason);
    const locked = this.locks.size > 0;
    if (locked !== this.player.locked) this.player.setLocked(locked);
    this.interactions.setEnabled(!locked);
  }

  /** Feet position (bottom centre) of a tile. */
  tileFeet(tileX, tileY) {
    const { tileWidth, tileHeight } = this.mapData;
    return { x: tileX * tileWidth + tileWidth / 2, y: (tileY + 1) * tileHeight };
  }

  // ---- examinables ----

  registerExaminable({ tileX, tileY, text, prompt = 'Look', enabled }) {
    return this.interactions.register({ tileX, tileY, prompt, enabled, handler: () => this.examine(text) });
  }

  /** Shows one narration line in the box. */
  examine(text) {
    return this.startDialogue({
      id: 'examine',
      presenter: 'box',
      lockMovement: true,
      start: 'n1',
      nodes: { n1: { type: 'narration', text, next: 'end' }, end: { type: 'end' } },
    });
  }

  // ---- conversations, texts, cutscenes ----

  /**
   * Starts a conversation: an id from public/assets/data/dialogue/ (loaded by BootScene) or the data.
   * routeEvents: false when a cutscene runs it (the cutscene routes its story events).
   */
  startDialogue(idOrData, startNode, { routeEvents = true } = {}) {
    const data = typeof idOrData === 'string' ? this.cache.json.get(`dialogue_${idOrData}`) : idOrData;
    if (!data) throw new Error(`Unknown dialogue "${idOrData}"`);
    const runner = new DialogueRunner(data, gameState);
    this.dialogueRunner = runner;
    if (runner.lockMovement) this.setLock('dialogue', true);
    runner.on('end', () => {
      if (this.dialogueRunner === runner) this.dialogueRunner = null;
      if (runner.lockMovement) this.setLock('dialogue', false);
    });
    if (routeEvents) runner.on('event', (name, payload, node) => this.handleStoryEvent(name, payload, runner, node));
    if (import.meta.env.DEV && data.id !== 'examine') {
      runner.on('event', (name) => console.log('[dialogue] event', name));
      runner.on('choice-made', (option, i) => console.log('[dialogue] choice', i + 1, option.text));
      runner.on('end', () => console.log('[dialogue] end', data.id));
    }
    this.dialogueBox.present(runner);
    runner.start(startNode);
    return runner;
  }

  /** Story events from conversations: texts are handled here, everything else by onStoryEvent. */
  handleStoryEvent(name, payload, runner, node) {
    const done = name === 'text_message' ? this.deliverText(payload) : this.onStoryEvent(name, payload);
    if (node?.wait) Promise.resolve(done).then(() => runner.resume());
  }

  /** Subclasses: handle a story event. Return a promise to hold a wait event until it settles. */
  onStoryEvent() {}

  /** A text arrives: the phone buzzes and then opens by itself. Resolves when it's closed (Q or Space). */
  deliverText(msg) {
    return new Promise((resolve) => {
      this.phone.receiveText(msg);
      this.time.delayedCall(TEXT_OPEN_DELAY_MS, () => {
        this.phone.once('closed', () => resolve());
        this.phone.open({ spaceCloses: true });
      });
    });
  }

  /** Loads and plays cutscenes/<id>.json; options go to CutsceneRunner (e.g. skipTo). */
  async playCutscene(id, options = {}) {
    const data = await CutsceneRunner.load(this, id);
    const cutscene = new CutsceneRunner(this, data, {
      lockInput: (locked) => this.setLock('cutscene', locked),
      startDialogue: (dialogueId, node) => this.startDialogue(dialogueId, node, { routeEvents: false }),
      onStoryEvent: (name, payload, runner, node) => this.handleStoryEvent(name, payload, runner, node),
      ...options,
    });
    this.cutscene = cutscene;
    await cutscene.play();
    return cutscene;
  }

  /** Fades to a location card, then starts the next scene (GameState carries over). */
  async goToScene(key, { card, data } = {}) {
    this.setLock('leaving', true);
    if (card) await showCard(this, card);
    this.scene.start(key, data);
  }

  update() {
    this.dialogueBox.update();
    this.phone.update();
    this.player.update();
    this.player.setDepth(this.player.y);
    this.interactions.update();
  }
}
