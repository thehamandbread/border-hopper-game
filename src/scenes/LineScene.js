import CarriedCase from '../objects/CarriedCase.js';
import { gameState } from '../systems/GameState.js';
import PortScene from './PortScene.js';
import StoryScene from './StoryScene.js';

const OFFICER_FRAMES = { day: { looks: 0, types: 1 }, night: { looks: 2, types: 3 } }; // booth_officer.png
const ARRIVE_DELAY_MS = 900;

/**
 * Mission 2, Scene 3: the line and the booth (port_map.json's mission2 section, dialogue m2_line and
 * m2_booth, cutscenes/m2_crossing.json). The same port as Mission 1 (PortScene), a longer line that has
 * already settled; no dog, no envelope. Mateo carries the case; a woman follows him into line. Getting
 * in line saves the clock (a refused entry restarts here with the clock put back). Walk-over triggers
 * play the narration in order; at the stop he waits in line (lineWaitSeconds, the clock running), the
 * line moves, and he walks up to the booth. The clock picks the officer: before the cutoff the day
 * officer, from it the night officer (his booth starts higher; m2_booth). The officer, once picked, is
 * kept for the mission's retries. Through: the yard (next build); sent over: secondary inspection.
 *
 * data: { retry: true } after a refused entry; { atBooth: true } starts at the booth (checkpoints).
 */
export default class LineScene extends PortScene {
  constructor() {
    super('LineScene');
  }

  create(data = {}) {
    const port = this.cache.json.get('port_map');
    const m2 = port.mission2;
    const map = { ...port, queue: m2.queue, props: m2.props, triggers: m2.triggers };
    this.buildStory(map);
    this.boothResult = null;
    this.nextTrigger = 0;
    this.waiting = false;
    this.createAwning(map);
    this.createBooth(map);
    this.createQueue(map);
    // The line has settled: everyone stands where it stops.
    for (const q of m2.queue) this.queue[q.id].x = this.tileFeet(...q.tile).x;
    for (const p of m2.props) this.props[p.id].x = this.tileFeet(...p.tile).x;
    this.createBehind(m2.behind);
    this.carried = new CarriedCase(this, this.player);
    this.carried.carrying = true;
    this.player.setSprintMultiplier(this.cache.json.get('stealth_config').player.sprintMultiplier); // up the lane too

    const clock = gameState.clock;
    if (data.retry) clock.restoreLineStart();
    else clock.saveLineStart();
    this.setOfficer(this.officerType());
    if (data.atBooth) {
      this.playCrossing({ skipTo: 'booth' });
      return;
    }
    this.setLock('arriving', true);
    this.time.delayedCall(ARRIVE_DELAY_MS, () => {
      this.setLock('arriving', false);
      this.startDialogue('m2_line', 'arrive');
    });
  }

  /** The woman who gets in line behind Mateo: she follows him up the lane and stands a tile back. */
  createBehind(b) {
    const at = this.tileFeet(...b.startTile);
    this.behind = this.add.sprite(at.x, at.y, 'queue_npcs', b.frame).setOrigin(0.5, 1).setDepth(at.y);
    Object.assign(this.behind, { walk: b.walk, facing: 'right', frameOffset: b.frame - 8, gap: b.gapPx });
  }

  followBehind() {
    const b = this.behind;
    const target = this.player.x - b.gap;
    if (target > b.x + 1) {
      b.x = Math.min(target, b.x + 1.2);
      b.play(`${b.walk}-right`, true);
    } else if (b.anims.isPlaying) {
      b.anims.stop();
      b.setFrame(b.frameOffset + 8);
    }
  }

  /** The officer on shift: picked by the clock at the booth, then kept for the mission's retries. */
  officerType() {
    return gameState.getAnswer('m2_officer') ?? gameState.clock.officerAt();
  }

  setOfficer(type) {
    this.officerKind = type;
    this.officer.setFrame(OFFICER_FRAMES[type].types);
  }

  /** The line's walk-over triggers, in order; 'stop' is the wait in line. */
  checkTriggers() {
    if (this.locks.size || this.waiting) return;
    const t = this.mapData.triggers[this.nextTrigger];
    if (!t || this.player.x < t.xPx) return;
    this.nextTrigger += 1;
    if (t.node === 'stop') this.waitInLine();
    else this.startDialogue('m2_line', t.node);
  }

  /** Mateo stands in line for lineWaitSeconds, the clock running; then the line moves. */
  waitInLine() {
    this.waiting = true;
    this.setLock('line', true);
    this.player.facing = 'right';
    this.clockAlways = true;
    const seconds = gameState.clock.config.lineWaitSeconds ?? 5;
    this.time.delayedCall(seconds * 1000, () => {
      this.clockAlways = false;
      this.setLock('line', false);
      this.playCrossing();
    });
  }

  async playCrossing(options = {}) {
    // The officer is whoever is on shift now (the first time in this mission).
    const type = this.officerType();
    gameState.mission.boothReachedAt = gameState.clock.format(); // dev panel: when he got to the booth
    gameState.setAnswer('m2_officer', type);
    gameState.setFlag('night_officer', type === 'night');
    this.setOfficer(type);
    const things = { officer: this.officer, behind: this.behind, bagWoman: this.behind, ...this.queue, ...this.props };
    await this.playCutscene('m2_crossing', { things, dialogueNodes: { m2_line: 'clock' }, ...options });
    if (this.boothResult === 'pass') this.throughTheGate();
    else if (this.boothResult === 'secondary') this.toSecondary();
  }

  onStoryEvent(name) {
    const f = OFFICER_FRAMES[this.officerKind];
    if (name === 'officer_looks') this.officer.setFrame(f.looks);
    else if (name === 'officer_types') this.officer.setFrame(f.types);
    else super.onStoryEvent(name);
  }

  /** Through the gate: the yard is the next build (a dev stub until then). */
  async throughTheGate() {
    this.ground.putTileAt(19, ...this.mapData.gate);
    await this.playCutscene({ steps: [{ type: 'moveActor', actor: 'player', path: [[28, 5], [31, 5]], speed: 50 }] });
    this.goToScene(this.scene.manager.keys.YardScene ? 'YardScene' : 'YardStubScene', { fade: true });
  }

  /** "The door on your left": secondary inspection, Mission 2's. */
  async toSecondary() {
    const [dx, dy] = this.mapData.door;
    await this.playCutscene({ steps: [{ type: 'moveActor', actor: 'player', path: [[dx, 5], [dx, dy + 1]], speed: 50 }] });
    this.goToScene(this.scene.manager.keys.CaseSecondaryScene ? 'CaseSecondaryScene' : 'YardStubScene', { fade: true });
  }

  update(time, delta) {
    StoryScene.prototype.update.call(this, time, delta); // not PortScene's (its dog and Mission 1's line)
    this.carried.update();
    if (!this.cutscene) {
      const stop = this.mapData.mission2.stopXPx;
      if (this.player.x > stop) this.player.body.reset(stop, this.player.y);
      this.checkTriggers();
    }
    this.followBehind();
  }
}
