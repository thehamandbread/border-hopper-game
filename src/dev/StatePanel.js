import { gameState } from '../systems/GameState.js';
import { buildMissionSummary, summaryDialogues } from '../systems/missionSummary.js';

// Dev-only: F1 toggles a small live panel (top-right) with GameState's meters, flags, answers,
// control-hint use counts, and the mission's encounter state: attempt, the hidden suspicion counts,
// card_flagged and the envelope flags, the mission log (every suspicion and Heat change) and skipped
// questions. In the stealth sandbox it also shows each watcher's detection and state, sprint, frame
// times and the stealth config (from window.__stealthDebug). A DOM overlay, so it never touches game
// input or scenes.
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
    const entry = (e) => {
      if (e.type === 'spotted') return `  spot ${e.encounter} by ${e.source}`;
      if (e.delta === undefined) return `  ans  ${e.encounter ?? '-'} ${e.question_id ?? '-'}/${e.answer_id ?? '-'}`;
      return `  ${e.type === 'heat' ? 'heat' : 'susp'} ${e.encounter ?? '-'} ${e.question_id ?? '-'}/${e.answer_id ?? '-'} ${e.delta > 0 ? '+' : ''}${e.delta}`;
    };
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
      `  alley attempt: ${flag('alley_attempt')}   passed_guard: ${flag('passed_guard')}   camera heat applied: ${flag('alley_camera_heat')}`,
      ...this.clockLines(),
      'mission log', m.log.length ? m.log.map(entry).join('\n') : '  (none)',
      'skipped', m.skips.length ? m.skips.map((k) => `  ${k.encounter ?? '-'} ${k.question_id}`).join('\n') : '  (none)',
      `summary: answers with no text (skipped): ${this.unresolved().join(', ') || '(none)'}`,
      ...this.stealthLines(),
    ].join('\n');
  }

  /** The clock (Mission 2): time, officer, how the booth's count started, the warehouse answer. */
  clockLines() {
    const c = gameState.clock;
    const m = gameState.mission;
    const parts = m.startParts?.booth;
    const start = parts ? `${parts.base + parts.bonus} (card ${parts.flagged ? `+${parts.base}` : '0'}, officer +${parts.bonus})` : '-';
    return [
      `  mission: ${m.id ?? 1}   clock: ${c.format()} ${c.running ? 'running' : 'stopped'}   officer: ${c.officerAt()}   line start: ${c.lineStart === null ? '-' : c.format(c.lineStart)}`,
      `  booth start: ${start}   told_officer_warehouse: ${JSON.stringify(gameState.getFlag('told_officer_warehouse'))}`,
    ];
  }

  /** Log entries the summary couldn't turn into answer text (it skips them). */
  unresolved() {
    const cache = window.__game?.cache.json;
    if (!cache) return [];
    const dialogues = summaryDialogues((id) => cache.get(`dialogue_${id}`));
    return buildMissionSummary(gameState.mission.log, dialogues).unresolved;
  }

  stealthLines() {
    const dbg = window.__stealthDebug;
    if (!dbg) return [];
    const p = dbg.player;
    const perf = dbg.perf;
    const c = dbg.config;
    const src = (s) =>
      `  ${s.id.padEnd(6)} ${s.state.padEnd(11)} ? ${s.detection.toFixed(2)} ${s.alert}${s.inView ? ' in-view' : ''}${s.hearing ? ' hears' : ''}`;
    return [
      'stealth',
      ...dbg.sources.map(src),
      `  sprint: ${p.sprinting ? 'on' : 'off'}   speed: ${p.speed.toFixed(0)} px/s   spotted: ${dbg.spotted.length}`,
      `  frame ${perf.frameMs.toFixed(1)} ms (${perf.fps.toFixed(0)} fps)   stealth ${perf.stealthMs.toFixed(2)} ms`,
      'stealth config',
      `  guard cone ${c.guard.cone.widthDeg}deg x ${c.guard.cone.lengthTiles}t  walk ${c.guard.walkSpeedTilesPerSec}t/s  pause ${c.guard.patrol.pauseSeconds}s  turn ${c.guard.patrol.turnRateDegPerSec}deg/s`,
      `  camera cone ${c.camera.cone.widthDeg}deg x ${c.camera.cone.lengthTiles}t  sweep ${c.camera.sweep.fromDeg}..${c.camera.sweep.toDeg} in ${c.camera.sweep.secondsOneWay}s`,
      `  fill ${c.detection.fillSecondsNear}s near .. ${c.detection.fillSecondsFar}s far  decay ${c.detection.decaySeconds}s`,
      `  sprint x${c.player.sprintMultiplier}  ring ${c.noise.sprintRingTiles}t  walk noise ${c.noise.walkNoise}`,
    ];
  }
}
