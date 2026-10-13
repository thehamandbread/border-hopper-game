import CarriedCase from '../objects/CarriedCase.js';
import { gameState } from '../systems/GameState.js';
import StoryScene from './StoryScene.js';

export const SPRINT_HINT = 'SHIFT: sprint.';      // docs/script/mission2.md, Scene 3
export const SPRINT_HINT_ONCE = 'mission:hint_sprint'; // once per mission (the warehouse may show it first)

/**
 * Mission 2, Scene 3: the walk from the warehouse to the port (street_map.json), carrying the case.
 * Player-controlled with Shift sprint (stealth_config.json's sprintMultiplier on the walk speed), no
 * examinables, no clock on the street; the game clock keeps running while Mateo walks. The first time
 * he moves, the sprint hint. Past endXPx: the line at the port.
 */
export default class WalkScene extends StoryScene {
  constructor() {
    super('WalkScene');
  }

  create() {
    const map = this.cache.json.get('street_map');
    this.buildStory(map);
    this.player.setSprintMultiplier(this.cache.json.get('stealth_config').player.sprintMultiplier);
    this.carried = new CarriedCase(this, this.player);
    this.carried.carrying = true;
    for (const p of map.props) {
      const at = this.tileFeet(...p.tile);
      this.add.sprite(at.x, at.y, 'street_props', p.frame).setOrigin(0.5, 1).setDepth(at.y - 4);
      const zone = this.add.zone(at.x, at.y - 8, 14, 10);
      this.physics.add.existing(zone, true);
      this.physics.add.collider(this.player, zone);
    }
    this.leaving = false;
    this.startedAt = gameState.clock.format(); // for the dev panel: when the walk began
  }

  update(time, delta) {
    super.update(time, delta);
    this.carried.update();
    if (this.leaving || this.locks.size) return;
    if (this.player.body.speed > 0 && !gameState.done.has(SPRINT_HINT_ONCE)) {
      gameState.done.add(SPRINT_HINT_ONCE);
      this.showHint(SPRINT_HINT);
    }
    if (this.player.x >= this.mapData.endXPx) {
      this.leaving = true;
      this.goToScene('LineScene', { fade: true });
    }
  }
}
