import Emitter from './Emitter.js';
import { MOVE } from './stealth/SightGrid.js';
import { angleTo } from './stealth/vision.js';

const ARRIVE_PX = 18;     // close enough to talk: about a tile from Mateo
const ESCORT_TILE_X = 1;  // the guard walks Mateo to the alley's left end and stops a tile in

/**
 * Mission 1's alley: what happens when someone spots Mateo (plain JS, no Phaser; tools/test_alley.mjs
 * runs it in node). It owns a StealthEngine (one guard, one camera) and the alley's GameState:
 *   flags  alley_attempt (1, 2, ... each time the alley starts), passed_guard, alley_camera_heat
 *   mission.encounter 'alley'; mission log entries (see below)
 *
 * Modes: 'stealth' (the engine runs), 'talk' (frozen: the guard conversation is on), 'approach' (the
 * guard walks over to Mateo, in the middle of the conversation), 'escort' (after a fail: the guard
 * walks Mateo out; the scene then restarts the alley with restart()), 'done' (he's at the back door:
 * nothing moves, and spots are ignored and not logged).
 *
 * Spotted by the guard: every spot is logged ({ encounter: 'alley', type: 'spotted', source }); mode
 * 'talk' and 'confront' is emitted with the conversation's start node: 'hey', or 'again' once Mateo
 * has already talked his way past him (no second conversation). The conversation (dialogue m1_alley)
 * sends its events here (handleEvent): guard_approach (resolves when he's arrived), guard_pass,
 * guard_fail. attach(runner) logs the answer ({ encounter: 'alley', question_id: 'guard', answer_id }).
 *   pass: passed_guard = true, detection back to 0, he goes back to his route (seeing nothing until
 *         he's on it again), stealth resumes.
 *   fail: Heat +1, mode 'escort', 'fail' emitted.
 * Spotted by the camera: logged; Heat +1 the first time in this attempt (alley_camera_heat); the guard
 * goes to look at the spot unless he's already investigating. (The camera itself can't report again
 * within camera.respotCooldownSeconds.)
 */
export default class AlleyEncounter extends Emitter {
  constructor({ state, engine, step }) {
    super();
    this.state = state;
    this.engine = engine;
    this.grid = engine.grid;
    this.guard = engine.sources.find((s) => s.type === 'guard');
    this.camera = engine.sources.find((s) => s.type === 'camera');
    this.step = step ?? ((ms, target) => engine.update(ms, target)); // the scene's engine step (StealthStage)
    this.mode = 'stealth';
    this.lastAnswer = null;
    this.arrived = null;
    engine.on('spotted', (e) => this.onSpotted(e));
  }

  /** Starts an attempt at the alley (also after a fail): everything the alley tracks is reset. */
  begin() {
    const s = this.state;
    s.mission.encounter = 'alley';
    s.setFlag('alley_attempt', (s.getFlag('alley_attempt') || 0) + 1);
    s.setFlag('passed_guard', false);
    s.setFlag('alley_camera_heat', false);
    this.engine.reset({ positions: true });
    this.mode = 'stealth';
    this.lastAnswer = null;
    this.target = null;
  }

  restart() {
    this.begin();
  }

  get passedGuard() {
    return this.state.getFlag('passed_guard') === true;
  }

  /** dtMs and target (Mateo: { x, y, moving, sprinting }) as for StealthEngine.update. */
  update(dtMs, target) {
    this.lastTarget = target;
    if (this.mode === 'stealth') {
      this.step(dtMs, target);
      // After letting Mateo go, the guard sees nothing until he's back on his route.
      if (this.guard.blind && this.guard.state === 'patrol') this.guard.blind = false;
    } else if (this.mode === 'approach') {
      const done = this.guard.walk(dtMs / 1000);
      const t = this.target;
      if (done || Math.hypot(t.x - this.guard.x, t.y - this.guard.y) <= ARRIVE_PX) {
        this.guard.path = [];
        this.guard.facingDeg = angleTo(this.guard.x, this.guard.y, t.x, t.y);
        this.mode = 'talk';
        const arrived = this.arrived;
        this.arrived = null;
        arrived?.();
      }
    } else if (this.mode === 'escort') {
      this.guard.walk(dtMs / 1000);
    }
  }

  /** Mateo is at the back door: the alley is over. */
  finish() {
    this.mode = 'done';
  }

  onSpotted(e) {
    if (this.mode === 'done') return;
    this.state.logEvent({ encounter: 'alley', type: 'spotted', source: e.sourceType });
    if (e.sourceType === 'guard') {
      if (this.mode !== 'stealth') return;
      this.mode = 'talk';
      this.lastAnswer = null; // a new spot: no answer yet (none at all if he's already been let go)
      this.target = { x: e.targetPos.x, y: e.targetPos.y };
      this.guard.state = 'confront';
      this.emit('confront', this.passedGuard ? 'again' : 'hey');
    } else if (e.sourceType === 'camera') {
      if (this.state.getFlag('alley_camera_heat') !== true) {
        this.state.setFlag('alley_camera_heat', true);
        this.state.changeMeter('heat', 1, { question: 'camera', answer: 'spotted' });
      }
      if (this.mode === 'stealth' && this.guard.state !== 'investigate') this.guard.investigate(e.targetPos);
    }
  }

  /** Logs the guard conversation's answer. */
  attach(runner) {
    runner.on('choice-made', (option) => {
      this.lastAnswer = option.id;
      this.state.logEvent({ encounter: 'alley', question_id: 'guard', answer_id: option.id });
    });
    return runner;
  }

  /** Story events from the guard conversation. guard_approach returns a promise: he's arrived. */
  handleEvent(name) {
    if (name === 'guard_approach') return this.approach();
    if (name === 'guard_pass') this.pass();
    else if (name === 'guard_fail') this.fail();
    return undefined;
  }

  /** He walks (around cover) to a free tile next to Mateo, then turns to him. */
  approach() {
    const t = this.target ?? this.lastTarget;
    this.target = { x: t.x, y: t.y };
    const spot = this.besideMateo();
    this.guard.path = spot ? this.grid.findPath(this.guard.x, this.guard.y, spot.x, spot.y) : [];
    this.mode = 'approach';
    return new Promise((resolve) => {
      this.arrived = resolve;
    });
  }

  /** The free tile next to Mateo (8 around him) the guard can reach by the shortest walk. */
  besideMateo() {
    const ts = this.grid.tileSize;
    const cx = Math.floor(this.target.x / ts);
    const cy = Math.floor(this.target.y / ts);
    let best = null;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || this.grid.blocks(cx + dx, cy + dy, MOVE)) continue;
        const p = { x: (cx + dx) * ts + ts / 2, y: (cy + dy) * ts + ts / 2 };
        const path = this.grid.findPath(this.guard.x, this.guard.y, p.x, p.y);
        if (!path.length) continue;
        let len = 0;
        let from = this.guard;
        for (const q of path) {
          len += Math.hypot(q.x - from.x, q.y - from.y);
          from = q;
        }
        if (!best || len < best.len) best = { ...p, len };
      }
    }
    return best;
  }

  pass() {
    this.state.setFlag('passed_guard', true);
    this.engine.reset();
    this.guard.blind = true;
    this.guard.returnToRoute();
    this.mode = 'stealth';
    this.emit('pass');
  }

  fail() {
    this.state.changeMeter('heat', 1, { question: 'guard', answer: this.lastAnswer ?? 'spotted_again' });
    this.mode = 'escort';
    // He walks behind Mateo to the left end of the alley.
    const ts = this.grid.tileSize;
    const row = Math.floor(this.guard.y / ts);
    this.guard.path = this.grid.findPath(this.guard.x, this.guard.y, ESCORT_TILE_X * ts + ts / 2, row * ts + ts / 2);
    this.emit('fail');
  }
}
