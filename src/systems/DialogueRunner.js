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
 *   { type: 'event',  name, data?, next }      emitted for the scene, then the runner continues
 *   { type: 'end' }
 * Effects: { meter, add } | { flag, add } | { answer, set }
 * speed: typing speed multiplier. pauseAfter: ms held after the line is typed, before the advance
 * indicator. Inside text, {p:600} holds the typewriter 600 ms at that point (never displayed).
 *
 * Events: 'start' (data), 'line' (line or narration node), 'choice' (node), 'choice-made' (option, index),
 *         'event' (name, data), 'end' (data).
 */
export default class DialogueRunner extends Phaser.Events.EventEmitter {
  constructor(data, state) {
    super();
    this.data = data;
    this.state = state;
    this.current = null; // the line or choice node waiting for the presenter
    this.ended = false;
  }

  get presenter() {
    return this.data.presenter;
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
          this.emit('event', node.name, node.data);
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
