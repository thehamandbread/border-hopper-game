import { gameState } from '../systems/GameState.js';

// Dev-only: F1 toggles a small live panel (top-right) with GameState's meters, flags, answers,
// control-hint use counts, and the mission's encounter state: attempt, the hidden suspicion counts,
// card_flagged and the envelope flags, the mission log (every suspicion and Heat change) and skipped
// questions. A DOM overlay, so it never touches game input or scenes.
export default class StatePanel {
  constructor() {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', top: '8px', right: '8px', zIndex: 1000, display: 'none',
      background: 'rgba(10, 10, 16, 0.88)', color: '#e8e4d8', border: '1px solid #e8d8b0',
      font: '12px/1.4 monospace', padding: '8px 10px', whiteSpace: 'pre', pointerEvents: 'none',
      maxHeight: 'calc(100vh - 16px)', overflow: 'hidden',
    });
    document.body.appendChild(this.el);
    gameState.on('change', () => this.render());
    this.timer = setInterval(() => this.visible && this.render(), 250); // picks up use counts and resets too
  }

  get visible() {
    return this.el.style.display !== 'none';
  }

  toggle() {
    this.el.style.display = this.visible ? 'none' : 'block';
    this.render();
  }

  render() {
    if (!this.visible) return;
    const fmt = (obj) => {
      const entries = Object.entries(obj);
      return entries.length ? entries.map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n') : '  (none)';
    };
    const m = gameState.mission;
    const flag = (name) => JSON.stringify(gameState.getFlag(name));
    const entry = (e) => `  ${e.type === 'heat' ? 'heat' : 'susp'} ${e.encounter ?? '-'} ${e.question_id ?? '-'}/${e.answer_id ?? '-'} ${e.delta > 0 ? '+' : ''}${e.delta}`;
    this.el.textContent = [
      'STATE (F1)',
      'meters', fmt(gameState.meters),
      'flags', fmt(gameState.flags),
      'answers', fmt(gameState.answers),
      'uses', fmt(gameState.uses),
      'mission',
      `  attempt: ${m.attempt}   encounter: ${m.encounter ?? '-'}`,
      `  suspicion booth: ${m.suspicion.booth ?? '-'}   secondary: ${m.suspicion.secondary ?? '-'}`,
      `  card_flagged: ${flag('card_flagged')}`,
      `  envelope_opened: ${flag('envelope_opened')}   envelope_inspected: ${flag('envelope_inspected')}`,
      'mission log', m.log.length ? m.log.map(entry).join('\n') : '  (none)',
      'skipped', m.skips.length ? m.skips.map((k) => `  ${k.encounter ?? '-'} ${k.question_id}`).join('\n') : '  (none)',
    ].join('\n');
  }
}
