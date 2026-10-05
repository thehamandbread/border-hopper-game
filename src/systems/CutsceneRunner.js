import Phaser from 'phaser';
import { assetUrl } from './assetUrl.js';
import { gameState } from './GameState.js';
import { pixelText } from './pixelText.js';
import { standingFrame } from '../objects/walkAnims.js';

const TILE = 16;
const OVERLAY_DEPTH = 6500; // the fade overlay sits over everything in the scene...
const TEXT_DEPTH = 6600;    // ...and title-card text over the fade

/** Feet position (bottom-centre) of a tile. */
const tileToFeet = ([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: (ty + 1) * TILE });

/**
 * Runs a data-driven cutscene from public/assets/data/cutscenes/<id>.json.
 *
 * File:
 *   {
 *     "actors":  { "<id>": { "texture", "frame"?, "tile": [x, y] | "pos": [x, y], "walk"?: "<anim prefix>",
 *                            "facing"?, "visible"? } },
 *     "objects": { "<id>": { "texture", "frame"?, "pos": [x, y], "origin"?: [ox, oy], "depth"?, "visible"? } },
 *     "steps":   [ step, ... ],
 *     "events":  { "<story event name>": [ step, ... ] },  // run when a dialogue step emits that event
 *     "startBlack": true,                                   // optional: begin faded out (e.g. after a title card)
 *     "actorDepthBase": 1000, "actorTint": "0xc8ccdc"       // optional: actors' depth offset and tint
 *   }
 * Any step may have a "label" (a name to start from; see the skipTo option).
 * Actors stand on their feet (origin bottom-centre) and are depth-sorted by feet y.
 *
 * Steps run in order; each finishes before the next starts, unless it has "parallel": true.
 *   wait        { ms }
 *   fade        { dir: "out" | "in", ms, color? }       full-screen overlay (title text can sit above it)
 *   showText    { text, ms, size? }                     centred title card
 *   moveActor   { actor, to: [tx, ty] | toPx: [x, y] | path: [[tx, ty], ...], speed (px/s), anim? }
 *   setFrame    { actor | object, frame, texture? }
 *   playAnim    { actor | object, anim }
 *   show        { actor | object, visible }
 *   moveObject  { object, toPx: [x, y], ms, ease? }
 *   tween       { actor | object, to: { alpha: 0, ... }, ms, ease?, yoyo?, repeat? }   any other property
 *   cameraPan   { toPx: [x, y], ms, ease? }
 *   playSound   { key, loop?, volume? }   stopSound { key }
 *   setFlag     { flag, value } | { flag, add }
 *   dialogue    { id }                                  runs the conversation; its story events run "events"
 *   notify      { name, data? }                         tells the scene a story event happened (onStoryEvent)
 *   end         {}
 *
 * Options: lockInput(bool), startDialogue(id, startNode?) -> DialogueRunner, onEnd(), onStoryEvent(name, data),
 * skipTo, preEvents, dialogueNodes (see the constructor), things: { id: sprite } the scene's own sprites to
 * use as actors and objects (set sprite.walk / sprite.facing on actors; sprite.frameOffset picks their
 * standing frames from later sheet rows, e.g. Tomi's one-shoe walk).
 */
export default class CutsceneRunner {
  constructor(
    scene,
    data,
    {
      lockInput = () => {},
      startDialogue,
      onEnd = () => {},
      onStoryEvent,
      skipTo,
      preEvents = [],
      dialogueNodes = {},
      things = {},
    } = {},
  ) {
    // Starting partway (e.g. for playtesting): steps before the one labelled `skipTo` are fast-forwarded
    // (applied instantly, waits and dialogue skipped), then the `preEvents` step lists are applied
    // instantly, then play continues from `skipTo`. `dialogueNodes` maps a conversation id to the node
    // its dialogue step starts at.
    this.skipTo = skipTo;
    this.preEvents = preEvents;
    this.dialogueNodes = dialogueNodes;
    this.instant = false;
    this.onStoryEvent = onStoryEvent; // also told about every story event (e.g. ones the scene handles itself)
    this.scene = scene;
    this.data = data;
    this.lockInput = lockInput;
    this.startDialogue = startDialogue;
    this.onEnd = onEnd;
    this.things = new Map(); // actors and objects by id
    this.sounds = new Map();
    this.ended = false;

    const cam = scene.cameras.main;
    this.overlay = scene.add
      .rectangle(0, 0, cam.width, cam.height, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(OVERLAY_DEPTH)
      .setAlpha(data.startBlack ? 1 : 0);
    this.createThings();
    for (const [id, sprite] of Object.entries(things)) this.things.set(id, sprite);
  }

  /** Loads a cutscene file (and any dialogue it uses) at runtime, then resolves with its data. */
  static load(scene, id) {
    const key = `cutscene_${id}`;
    const ready = () => scene.cache.json.get(key);
    return new Promise((resolve, reject) => {
      const loadDialogues = (data) => {
        const ids = CutsceneRunner.dialogueIds(data).filter((d) => !scene.cache.json.exists(`dialogue_${d}`));
        if (!ids.length) return resolve(data);
        for (const d of ids) scene.load.json(`dialogue_${d}`, assetUrl(`assets/data/dialogue/${d}.json`));
        scene.load.once('complete', () => resolve(data));
        scene.load.start();
      };
      if (ready()) return loadDialogues(ready());
      scene.load.json(key, assetUrl(`assets/data/cutscenes/${id}.json`));
      scene.load.once('complete', () => (ready() ? loadDialogues(ready()) : reject(new Error(`No cutscene "${id}"`))));
      scene.load.start();
    });
  }

  static dialogueIds(data) {
    const all = [...(data.steps ?? []), ...Object.values(data.events ?? {}).flat()];
    return [...new Set(all.filter((s) => s.type === 'dialogue').map((s) => s.id))];
  }

  createThings() {
    for (const [id, a] of Object.entries(this.data.actors ?? {})) {
      const p = a.tile ? tileToFeet(a.tile) : { x: a.pos[0], y: a.pos[1] };
      const s = this.scene.add.sprite(p.x, p.y, a.texture, a.frame ?? standingFrame(a.facing ?? 'down'));
      s.setOrigin(0.5, 1).setDepth(this.actorDepth(p.y)).setVisible(a.visible ?? true);
      if (this.data.actorTint) s.setTint(parseInt(this.data.actorTint, 16));
      s.walk = a.walk ?? null;
      s.facing = a.facing ?? 'down';
      s.isActor = true;
      this.things.set(id, s);
    }
    for (const [id, o] of Object.entries(this.data.objects ?? {})) {
      const [ox, oy] = o.origin ?? [0.5, 1];
      const s = this.scene.add.sprite(o.pos[0], o.pos[1], o.texture, o.frame ?? 0);
      s.setOrigin(ox, oy).setVisible(o.visible ?? true);
      s.fixedDepth = o.depth;
      s.setDepth(o.depth ?? o.pos[1]);
      this.things.set(id, s);
    }
  }

  /** Actors sort by feet y, offset by "actorDepthBase" (e.g. to draw them above a night overlay). */
  actorDepth(y) {
    return (this.data.actorDepthBase ?? 0) + y;
  }

  get(id) {
    const t = this.things.get(id);
    if (!t) throw new Error(`Cutscene: no actor/object "${id}"`);
    return t;
  }

  async play() {
    this.lockInput(true);
    let steps = this.data.steps ?? [];
    if (this.skipTo) {
      const at = steps.findIndex((s) => s.label === this.skipTo);
      const skipped = at === -1 ? steps : steps.slice(0, at);
      this.instant = true;
      await this.runSteps(skipped.filter((s) => s.type !== 'end'));
      for (const name of this.preEvents) await this.runSteps(this.data.events?.[name] ?? []);
      this.instant = false;
      steps = at === -1 ? [] : steps.slice(at);
    }
    await this.runSteps(steps);
    this.finish();
  }

  /** Applies a step's end state immediately (fast-forward). Waits, text, sounds and dialogue are skipped. */
  runInstant(step) {
    const cam = this.scene.cameras.main;
    switch (step.type) {
      case 'fade':
        this.overlay.setAlpha(step.dir === 'out' ? 1 : 0);
        break;
      case 'moveActor': {
        const a = this.get(step.actor);
        const pts = step.path ? step.path.map(tileToFeet) : [step.toPx ? { x: step.toPx[0], y: step.toPx[1] } : tileToFeet(step.to)];
        const last = pts[pts.length - 1];
        const prev = pts.length > 1 ? pts[pts.length - 2] : { x: a.x, y: a.y };
        const dx = last.x - prev.x;
        const dy = last.y - prev.y;
        if (dx || dy) a.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        a.setPosition(last.x, last.y).setDepth(this.actorDepth(last.y));
        if (a.walk) {
          a.anims.stop();
          a.setFrame((a.frameOffset ?? 0) + standingFrame(a.facing));
        }
        break;
      }
      case 'moveObject': {
        const o = this.get(step.object);
        o.setPosition(step.toPx[0], step.toPx[1]);
        if (o.fixedDepth === undefined) o.setDepth(o.y);
        break;
      }
      case 'tween':
        if (!step.yoyo) Object.assign(this.get(step.actor ?? step.object), step.to);
        break;
      case 'cameraPan':
        cam.centerOn(step.toPx[0], step.toPx[1]);
        break;
      case 'setFrame':
      case 'playAnim':
      case 'show':
      case 'setFlag':
      case 'notify':
        return this.runStep({ ...step, parallel: false });
      default: // wait, showText, playSound, stopSound, dialogue, end: nothing to apply
    }
    return Promise.resolve();
  }

  finish() {
    if (this.ended) return;
    this.ended = true;
    this.lockInput(false);
    this.onEnd();
  }

  async runSteps(steps) {
    const pending = [];
    for (const step of steps) {
      if (this.ended) break;
      if (step.type === 'end') {
        await Promise.all(pending);
        this.finish();
        return;
      }
      const p = this.runStep(step);
      if (step.parallel) pending.push(p);
      else await p;
    }
    await Promise.all(pending);
  }

  wait(ms) {
    return new Promise((resolve) => this.scene.time.delayedCall(ms, resolve));
  }

  tween(config) {
    return new Promise((resolve) => this.scene.tweens.add({ ...config, onComplete: resolve }));
  }

  runStep(step) {
    const scene = this.scene;
    if (this.instant && !step.__applying) return this.runInstant({ ...step, __applying: true });
    switch (step.type) {
      case 'wait':
        return this.wait(step.ms);
      case 'fade':
        return this.tween({
          targets: this.overlay,
          alpha: step.dir === 'out' ? 1 : 0,
          duration: step.ms,
          onStart: () => this.overlay.setFillStyle(step.color ?? 0x000000),
        });
      case 'showText':
        return this.showText(step);
      case 'moveActor':
        return this.moveActor(step);
      case 'setFrame': {
        const t = this.get(step.actor ?? step.object);
        t.anims.stop();
        if (step.texture) t.setTexture(step.texture, step.frame);
        else t.setFrame(step.frame);
        return Promise.resolve();
      }
      case 'playAnim':
        this.get(step.actor ?? step.object).play(step.anim);
        return Promise.resolve();
      case 'show':
        this.get(step.actor ?? step.object).setVisible(step.visible !== false);
        return Promise.resolve();
      case 'moveObject': {
        const o = this.get(step.object);
        return this.tween({
          targets: o,
          x: step.toPx[0],
          y: step.toPx[1],
          duration: step.ms,
          ease: step.ease ?? 'Linear',
          onUpdate: () => {
            o.x = Math.round(o.x);
            if (o.fixedDepth === undefined) o.setDepth(o.y);
          },
        });
      }
      case 'tween': {
        const t = this.get(step.actor ?? step.object);
        return this.tween({
          targets: t,
          ...step.to,
          duration: step.ms,
          ease: step.ease ?? 'Sine.easeInOut',
          yoyo: !!step.yoyo,
          repeat: step.repeat ?? 0,
        });
      }
      case 'cameraPan':
        return new Promise((resolve) => {
          scene.cameras.main.pan(step.toPx[0], step.toPx[1], step.ms, step.ease ?? 'Sine.easeInOut', true, (cam, progress) => {
            if (progress === 1) resolve();
          });
        });
      case 'playSound': {
        const snd = scene.sound.add(step.key, { loop: !!step.loop, volume: step.volume ?? 1 });
        snd.play();
        this.sounds.set(step.key, snd);
        return Promise.resolve();
      }
      case 'stopSound':
        this.sounds.get(step.key)?.stop();
        return Promise.resolve();
      case 'setFlag':
        if (step.add !== undefined) gameState.addFlag(step.flag, step.add);
        else gameState.setFlag(step.flag, step.value);
        return Promise.resolve();
      case 'dialogue':
        return this.dialogue(step.id);
      case 'notify':
        this.onStoryEvent?.(step.name, step.data);
        return Promise.resolve();
      default:
        return Promise.reject(new Error(`Cutscene: unknown step "${step.type}"`));
    }
  }

  async showText({ text, ms, size = 16 }) {
    const cam = this.scene.cameras.main;
    const t = pixelText(this.scene, 0, 0, text, { size }).setScrollFactor(0).setDepth(TEXT_DEPTH);
    t.setPosition(Math.round((cam.width - t.width) / 2), Math.round((cam.height - t.height) / 2));
    await this.wait(ms);
    t.destroy();
  }

  async moveActor(step) {
    const a = this.get(step.actor);
    const points = step.path
      ? step.path.map(tileToFeet)
      : [step.toPx ? { x: step.toPx[0], y: step.toPx[1] } : tileToFeet(step.to)];
    const speed = step.speed ?? 40;
    for (const p of points) {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) continue;
      a.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      if (a.walk && step.anim !== false) a.play(`${a.walk}-${a.facing}`, true);
      await this.tween({
        targets: a,
        x: p.x,
        y: p.y,
        duration: (dist / speed) * 1000,
        onUpdate: () => a.setDepth(this.actorDepth(a.y)),
      });
    }
    a.x = Math.round(a.x);
    a.y = Math.round(a.y);
    if (a.walk) {
      a.anims.stop();
      a.setFrame((a.frameOffset ?? 0) + standingFrame(a.facing));
    }
  }

  /** Runs a conversation. Each story event with a step list in "events" queues it (in order); other
   *  events go straight to onStoryEvent. A wait event (see DialogueRunner) with a step list resumes the
   *  conversation when its steps are done; one without is resumed by the scene (onStoryEvent gets the
   *  runner and node). The step finishes when the conversation has ended and every queued step list
   *  has finished. */
  dialogue(id) {
    return new Promise((resolve) => {
      const runner = this.startDialogue(id, this.dialogueNodes[id]);
      const events = this.data.events ?? {};
      // Event step lists run one after another, in the order the conversation emits them.
      let queue = Promise.resolve();
      runner.on('event', (name, payload, node) => {
        if (events[name]) {
          queue = queue.then(() => this.runSteps(events[name]));
          if (node?.wait) queue = queue.then(() => runner.resume());
        } else {
          this.onStoryEvent?.(name, payload, runner, node);
        }
      });
      runner.on('end', () => queue.then(resolve));
    });
  }

  destroy() {
    for (const t of this.things.values()) t.destroy();
    this.overlay.destroy();
  }
}
