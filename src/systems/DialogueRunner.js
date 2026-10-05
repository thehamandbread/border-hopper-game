import Phaser from 'phaser';

/**
 * Dialogue logic only; it never draws. A presenter (dialogue box now, phone later) listens to the
 * events and calls advance() / choose().
 *
 * Conversation JSON:
 *   { id, presenter: 'box', lockMovement: true, start: 'n01', nodes: { n01: node, ... } }
 * Nodes:
 *   { type: 'line',      speaker, text, next, speed?, pauseAfter? }
 *   { type: 'narration', text, next, speed?, pauseAfter? }  no speaker; muted and typed at 0.7x
 *   { type: 'choice', options: [{ text, effects?, next }] }
 *   { type: 'event',  name, data?, next, wait? }  emitted for the scene, then the runner continues;
 *        with "wait": true it pauses there until the scene calls resume() (e.g. after a text is read)
 *   { type: 'end' }
 * Effects: { meter, add } | { flag, add } | { flag, set } | { answer, set }
 * speed: typing speed multiplier. pauseAfter: ms held after the line is typed, before the advance
 * indicator. Inside text, {p:600} holds the typewriter 600 ms at that point (never displayed).
 *
 * Events: 'start' (data), 'line' (line or narration node), 'choice' (node), 'choice-made' (option, index),
 *         'event' (name, data, node), 'waiting' (node) when a wait event pauses it, 'end' (data).
 */
export default class DialogueRunner extends Phaser.Events.EventEmitter {
  constructor(data, state) {
    super();
    this.data = data;
    this.state = state;
    this.current = null; // the line or choice node waiting for the presenter
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

  /** Pick option `index` of the current choice. */
  choose(index) {
    const node = this.current;
    const option = node?.type === 'choice' ? node.options[index] : null;
    if (!option) return;
    this.current = null;
    this.state.applyEffects(option.effects);
    this.emit('choice-made', option, index);
    this.goto(option.next);
  }

  goto(id) {
    let nodeId = id;
    for (;;) {
      const node = this.data.nodes[nodeId];
      if (!node) throw new Error(`Dialogue "${this.data.id}": missing node "${nodeId}"`);
      switch (node.type) {
        case 'line':
        case 'narration':
          this.current = node;
          this.emit('line', node);
          return;
        case 'choice':
          this.current = node;
          this.emit('choice', node);
          return;
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
