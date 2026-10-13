import { configValue, resolveVariant, test } from './conditions.js';
import Emitter from './Emitter.js';

/**
 * Dialogue logic only; it never draws. A presenter (dialogue box now, phone later) listens to the
 * events and calls advance() / choose() / timeout(). No Phaser here: tools/test_encounter.mjs runs it in node.
 *
 * Conversation JSON:
 *   { id, presenter: 'box', lockMovement: true, start: 'n01', nodes: { n01: node, ... } }
 * Nodes:
 *   { type: 'line',      speaker, text, next, speed?, pauseAfter? }
 *   { type: 'narration', text, next, speed?, pauseAfter? }  no speaker; muted and typed at 0.7x
 *   { type: 'choice', options: [{ id?, text, effects?, next, if?, variants? }], timer? }
 *   { type: 'branch', cases: [{ if, next }], else }  goes to the first case whose condition holds
 *   { type: 'event',  name, data?, next, wait? }  emitted for the scene, then the runner continues;
 *        with "wait": true it pauses there until the scene calls resume() (e.g. after a text is read)
 *   { type: 'end' }
 * Any node may also have:
 *   effects   applied when the runner reaches it (e.g. Heat +1 at an outcome)
 *   if        a condition (conditions.js); when it doesn't hold, the node is passed over (to "next")
 *   requires  a condition naming an earlier answer this question compares against, with "skip": the
 *             node to go to instead when it doesn't hold. Skips are logged (GameState.logSkip).
 * Lines and options may have "variants": [{ if, text, ... }]; the first that holds overrides those
 * fields (conditions.js resolveVariant). Options whose "if" doesn't hold aren't offered.
 * Timed choices: "timer": { ms, effects, next } (ms may be "@configPath"). The presenter shows the time
 * running out and calls timeout() when it does: the timer's effects apply (the "no answer" outcome)
 * and the conversation goes to its "next".
 * Effects: see GameState.applyEffects. Choice and timeout effects are logged with the choice node's id
 * as the question and the option's id (or "timeout") as the answer.
 * speed: typing speed multiplier. pauseAfter: ms held after the line is typed, before the advance
 * indicator. Inside text, {p:600} holds the typewriter 600 ms at that point (never displayed).
 *
 * Events: 'start' (data), 'line' (line or narration node), 'choice' (node, with only the options on offer),
 *         'choice-made' (option, index), 'timeout' (node), 'skip' (node id), 'event' (name, data, node),
 *         'waiting' (node) when a wait event pauses it, 'end' (data).
 */
export default class DialogueRunner extends Emitter {
  /** scene: values for { "scene": name } conditions (an object, or a function returning one). */
  constructor(data, state, { scene = {} } = {}) {
    super();
    this.data = data;
    this.state = state;
    this.sceneValues = scene;
    this.current = null; // the line or choice node waiting for the presenter
    this.currentId = null;
    this.options = []; // the current choice's options on offer, variants resolved
    this.waitingNode = null; // the wait event it is paused at, until resume()
    this.ended = false;
  }

  get presenter() {
    return this.data.presenter;
  }

  /** True while paused at a wait event. */
  get waiting() {
    return this.waitingNode !== null;
  }

  get scene() {
    return typeof this.sceneValues === 'function' ? this.sceneValues() : this.sceneValues;
  }

  /** Continue after a wait event. */
  resume() {
    const node = this.waitingNode;
    if (!node) return;
    this.waitingNode = null;
    this.goto(node.next);
  }

  get lockMovement() {
    return this.data.lockMovement === true;
  }

  /** Starts at the conversation's first node, or at `nodeId` to begin partway through. */
  start(nodeId) {
    this.emit('start', this.data);
    this.goto(nodeId ?? this.data.start);
  }

  /** Move past the current line. */
  advance() {
    if (this.current?.type === 'line' || this.current?.type === 'narration') this.goto(this.current.next);
  }

  /** Pick option `index` of the options on offer. */
  choose(index) {
    const option = this.current?.type === 'choice' ? this.options[index] : null;
    if (!option) return;
    const question = this.currentId;
    this.current = null;
    this.state.applyEffects(option.effects, { question, answer: option.id ?? String(index + 1) });
    this.emit('choice-made', option, index);
    this.goto(option.next);
  }

  /** The current timed choice ran out: its "no answer" outcome. */
  timeout() {
    const node = this.current;
    if (node?.type !== 'choice' || !node.timer) return;
    this.current = null;
    this.state.applyEffects(node.timer.effects, { question: this.currentId, answer: 'timeout' });
    this.emit('timeout', node);
    this.goto(node.timer.next);
  }

  /** ms of the current choice's timer (0 if it isn't timed). */
  timerMs(node = this.current) {
    return node?.timer ? configValue(node.timer.ms, this.state.encounterConfig) : 0;
  }

  goto(id) {
    let nodeId = id;
    for (;;) {
      const node = this.data.nodes[nodeId];
      if (!node) throw new Error(`Dialogue "${this.data.id}": missing node "${nodeId}"`);
      const scene = this.scene;
      if (node.requires !== undefined && !test(node.requires, this.state, scene)) {
        this.state.logSkip(nodeId);
        this.emit('skip', nodeId);
        nodeId = node.skip;
        continue;
      }
      if (node.if !== undefined && !test(node.if, this.state, scene)) {
        nodeId = node.next;
        continue;
      }
      if (node.effects) this.state.applyEffects(node.effects, { question: nodeId });
      this.currentId = nodeId;
      switch (node.type) {
        case 'line':
        case 'narration':
          this.current = resolveVariant(node, this.state, scene);
          this.emit('line', this.current);
          return;
        case 'choice':
          this.current = node;
          this.options = node.options
            .filter((o) => test(o.if, this.state, scene))
            .map((o) => resolveVariant(o, this.state, scene));
          this.emit('choice', { ...node, id: nodeId, options: this.options });
          return;
        case 'branch':
          nodeId = node.cases.find((c) => test(c.if, this.state, scene))?.next ?? node.else;
          break;
        case 'event':
          if (node.wait) {
            this.current = null;
            this.waitingNode = node; // set first: a handler may resume() straight away
            this.emit('waiting', node);
            this.emit('event', node.name, node.data, node);
            return;
          }
          this.emit('event', node.name, node.data, node);
          nodeId = node.next;
          break;
        case 'end':
          this.current = null;
          this.ended = true;
          this.emit('end', this.data);
          return;
        default:
          throw new Error(`Dialogue "${this.data.id}": unknown node type "${node.type}"`);
      }
    }
  }
}
