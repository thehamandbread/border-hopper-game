import { gameState } from '../systems/GameState.js';
import StealthStage from '../systems/stealth/StealthStage.js';
import StoryScene from './StoryScene.js';

const MAX_DT_MS = 100;
const NOTICE_DEPTH = 1;  // over the door tile, under everything standing in front of it

/**
 * Mission 1, Scene 4: the alley behind the laundromat (alley_map.json), the first stealth section. A
 * guard patrols the middle (solid for Mateo), a wall camera on the phone store's back wall sweeps the
 * last stretch before the laundromat's back door, and the cover blocks sight and movement
 * (StealthStage, numbers from stealth_config.json). Shift sprints here. The phone store's door is
 * examinable (the printed notice). Stealth hints show once each, one at a time. E at the back door
 * ends the section (Walt is the next build).
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

    const [dx, dy] = map.backDoor;
    this.interactions.register({ tileX: dx, tileY: dy, prompt: 'Knock', handler: () => this.reachDoor() });
  }

  debugState() {
    return { hints: Object.keys(this.mapData.hints).filter((id) => this.hintShown(id)) };
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

  /** The back door: Walt is the next build. */
  reachDoor() {
    this.leaving = true;
    this.goToScene('ThreeHillsStubScene', { fade: true, data: { label: 'Walt (next build)' } });
  }

  update(_time, delta) {
    super.update();
    const frozen = this.locks.size > 0 || this.leaving;
    this.stage.update(Math.min(delta, MAX_DT_MS), { frozen });
    if (!frozen) this.checkHints();
  }
}
