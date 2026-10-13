import AlleyEncounter from '../systems/AlleyEncounter.js';
import { gameState } from '../systems/GameState.js';
import StealthStage from '../systems/stealth/StealthStage.js';
import StoryScene from './StoryScene.js';

const MAX_DT_MS = 100;
const NOTICE_DEPTH = 1;  // over the door tile, under everything standing in front of it
const ESCORT_SPEED = 40; // px/s: Mateo walked out at the guard's pace
const GONE_HOLD_MS = 700; // the guard waits at the end of the alley, then the alley restarts
const TILE = { DOOR_TOP: 17, DOOR_BOTTOM: 18, DOOR_OPEN_TOP: 19, DOOR_OPEN_BOTTOM: 20 }; // alley_tiles.png
const WALT_DEPTH = 2;    // over the door tiles, behind Mateo standing in front of them

/**
 * Mission 1, Scene 4: the alley behind the laundromat (alley_map.json), the first stealth section. A
 * guard patrols the middle (solid for Mateo), a wall camera on the phone store's back wall sweeps the
 * last stretch before the laundromat's back door, and the cover blocks sight and movement
 * (StealthStage, numbers from stealth_config.json). Shift sprints here. The phone store's door is
 * examinable (the printed notice). Stealth hints show once each, one at a time. E at the back door
 * ends the stealth (nothing watches or moves any more, the cones go) and plays m1_walt: the door
 * opens, Walt, and the envelope (by envelope_opened).
 *
 * Being spotted (AlleyEncounter): by the guard, everything freezes, he walks over and the m1_alley
 * conversation runs (pass: back to stealth; fail: Heat +1, he walks Mateo to the left end and the
 * alley restarts); by the camera, Heat +1 once per attempt and the guard goes to look.
 */
export default class AlleyScene extends StoryScene {
  constructor() {
    super('AlleyScene');
  }

  create() {
    const map = this.cache.json.get('alley_map');
    this.buildStory(map);
    this.config = this.cache.json.get('stealth_config');
    this.player.setSprintMultiplier(this.config.player.sprintMultiplier);
    this.leaving = false;

    const [nx, ny] = map.phoneStoreDoor;
    this.add.image(nx * 16, ny * 16, 'notice').setOrigin(0, 0).setDepth(NOTICE_DEPTH);

    this.stage = new StealthStage(this, this.player, {
      map, config: this.config, cover: map.cover, guardRoute: map.guardRoute, camera: map.camera, guardSolid: true,
    });
    this.stage.installDebug({ alley: () => this.debugState() });

    this.encounter = new AlleyEncounter({ state: gameState, engine: this.stage.engine, step: (ms) => this.stage.stepEngine(ms) });
    this.encounter.begin();
    this.encounter.on('confront', (node) => this.confront(node));
    this.encounter.on('pass', () => this.setLock('encounter', false));
    this.encounter.on('fail', () => (this.failed = true));
    this.failed = false;
    this.stepEncounter = (ms) => this.encounter.update(ms, this.stage.target());

    const [dx, dy] = map.backDoor;
    this.atDoor = false;
    this.walt = this.add.image(dx * 16, (dy - 1) * 16, 'walt_door').setOrigin(0, 0).setDepth(WALT_DEPTH).setVisible(false);
    this.interactions.register({ tileX: dx, tileY: dy, prompt: 'Knock', enabled: () => !this.atDoor, handler: () => this.reachDoor() });
  }

  debugState() {
    return {
      hints: Object.keys(this.mapData.hints).filter((id) => this.hintShown(id)),
      mode: this.encounter.mode,
      attempt: gameState.getFlag('alley_attempt'),
      passedGuard: gameState.getFlag('passed_guard') === true,
      cameraHeat: gameState.getFlag('alley_camera_heat') === true,
      heat: gameState.getMeter('heat'),
      log: gameState.mission.log.filter((e) => e.encounter === 'alley').map((e) => ({ ...e })),
    };
  }

  // ---- spotted by the guard ----

  /** He's seen Mateo: freeze, and the conversation (it has him walk over first). */
  confront(node) {
    this.setLock('encounter', true);
    const runner = this.startDialogue('m1_alley', node);
    this.encounter.attach(runner);
    runner.on('end', () => {
      if (this.failed) this.walkedOut();
    });
  }

  onStoryEvent(name) {
    if (name === 'door_opens') return this.setDoorOpen(true);
    if (name === 'door_closes') return this.setDoorOpen(false);
    return this.encounter.handleEvent(name);
  }

  /** The back door: the open frame with Walt in the gap, or closed. */
  setDoorOpen(open) {
    const [x, y] = this.mapData.backDoor; // the door's bottom tile
    this.ground.putTileAt(open ? TILE.DOOR_OPEN_TOP : TILE.DOOR_TOP, x, y - 1);
    this.ground.putTileAt(open ? TILE.DOOR_OPEN_BOTTOM : TILE.DOOR_BOTTOM, x, y);
    this.walt.setVisible(open);
  }

  /** The fail path: he walks Mateo to the left end of the alley, waits, and the alley starts over. */
  async walkedOut() {
    const grid = this.stage.grid;
    const c = this.player.body.center;
    const row = Math.floor(c.y / 16);
    const found = grid.findPath(c.x, c.y, 8, row * 16 + 8).map((p) => [Math.floor(p.x / 16), Math.floor(p.y / 16)]);
    const path = found.length ? found : [[0, row]];
    await this.playCutscene({ steps: [{ type: 'moveActor', actor: 'player', path, speed: ESCORT_SPEED }] });
    this.setLock('leaving', true);
    this.time.delayedCall(GONE_HOLD_MS, () => this.goToScene('AlleyScene', { fade: true }));
  }

  // ---- hints: each shown once (kept across alley restarts) ----

  hintShown(id) {
    return gameState.getFlag(`hint_alley_${id}`) === true;
  }

  hintOnce(id) {
    if (this.hintShown(id)) return;
    gameState.setFlag(`hint_alley_${id}`, true);
    this.showHint(this.mapData.hints[id]);
  }

  checkHints() {
    this.hintOnce('cone'); // the cones are on screen from the start
    const p = this.player;
    if (p.body.speed > 0) this.hintOnce('sprint');
    if (this.stage.engine.sources.some((s) => s.detection > 0)) this.hintOnce('detection');
    const c = p.body.center;
    if (this.stage.distanceToCover(c.x, c.y) <= this.mapData.coverHintTiles * 16) this.hintOnce('cover');
  }

  /** E at the back door: the stealth is over (nothing moves or watches), and Walt. */
  reachDoor() {
    if (this.atDoor) return;
    this.atDoor = true;
    this.encounter.finish();
    this.stage.hide();
    this.setLock('walt', true);
    const runner = this.startDialogue('m1_walt');
    runner.on('end', () => this.leave());
  }

  leave() {
    this.goToScene('ThreeHillsStubScene', { fade: true, data: { label: 'Going home (next build)' } });
  }

  update(_time, delta) {
    super.update();
    // Stealth stops while anything else has Mateo (a look, the phone, a fade); the encounter's own
    // modes (the guard walking over, walking him out) keep running.
    const stealth = this.encounter.mode === 'stealth';
    const frozen = this.leaving || this.atDoor || (stealth && this.locks.size > 0);
    this.stage.update(Math.min(delta, MAX_DT_MS), {
      frozen,
      step: this.stepEncounter,
    });
    if (stealth && !frozen) this.checkHints();
  }
}
