/**
 * A patrolling guard (logic only; plain JS). States:
 *   patrol     walking to the current route point (turning first to face the way he walks)
 *   pause      standing at a route end for patrol.pauseSeconds, then he turns and walks back
 *   investigate  walking to a position he was told to check, then standing there investigate.pauseSeconds
 *   returning  walking back to the nearest point of his route, then patrol resumes
 * While he hears a noise (listenTo), he stops where he is and turns toward it; when it stops he carries
 * on with what he was doing. Positions are px; speed is px per second; angles are degrees (0 right,
 * 90 down).
 */
import { angleDiff, angleTo } from './vision.js';

export default class Guard {
  /**
   * route: [{x, y}, {x, y}] (px). cfg: the config's "guard" section. tileSize: px per tile.
   * grid: a SightGrid, for walking around cover when investigating.
   */
  constructor({ id, route, cfg, tileSize, grid }) {
    this.id = id;
    this.type = 'guard';
    this.hears = true;
    this.route = route.map((p) => ({ x: p.x, y: p.y }));
    this.grid = grid;
    this.speed = cfg.walkSpeedTilesPerSec * tileSize;
    this.turnRate = cfg.patrol.turnRateDegPerSec;
    this.pauseSeconds = cfg.patrol.pauseSeconds;
    this.investigatePause = cfg.investigate.pauseSeconds;
    this.cone = { widthDeg: cfg.cone.widthDeg, length: cfg.cone.lengthTiles * tileSize };
    this.restart();
  }

  /** Back to the first route point, facing the second, patrolling. */
  restart() {
    const [a, b] = this.route;
    this.x = a.x;
    this.y = a.y;
    this.facingDeg = angleTo(a.x, a.y, b.x, b.y);
    this.targetIndex = 1;
    this.state = 'patrol';
    this.timer = 0;
    this.path = [this.route[1]];
    this.lookingAt = null;
    this.arrivedAt = false; // investigate: true once he's standing at the spot
  }

  /** Sends him to look at a position (px). */
  investigate(pos) {
    this.state = 'investigate';
    this.arrivedAt = false;
    this.path = this.grid ? this.grid.findPath(this.x, this.y, pos.x, pos.y) : [{ x: pos.x, y: pos.y }];
    if (!this.path.length) this.path = [{ x: pos.x, y: pos.y }];
  }

  /** A noise at this position (px) this frame, or null. */
  listenTo(pos) {
    this.lookingAt = pos;
  }

  update(dt) {
    if (this.lookingAt) {
      this.turnToward(angleTo(this.x, this.y, this.lookingAt.x, this.lookingAt.y), dt);
      return;
    }
    switch (this.state) {
      case 'patrol':
        if (this.walk(dt)) {
          this.state = 'pause';
          this.timer = this.pauseSeconds;
        }
        break;
      case 'pause':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.targetIndex = 1 - this.targetIndex;
          this.path = [this.route[this.targetIndex]];
          this.state = 'patrol';
        }
        break;
      case 'investigate':
        if (!this.arrivedAt) {
          if (this.walk(dt)) {
            this.arrivedAt = true;
            this.timer = this.investigatePause;
          }
        } else {
          this.timer -= dt;
          if (this.timer <= 0) this.returnToRoute();
        }
        break;
      case 'returning':
        if (this.walk(dt)) {
          this.path = [this.route[this.targetIndex]];
          this.state = 'patrol';
        }
        break;
      default:
        break;
    }
  }

  returnToRoute() {
    const p = this.nearestRoutePoint();
    this.state = 'returning';
    this.path = this.grid ? this.grid.findPath(this.x, this.y, p.x, p.y) : [p];
    if (!this.path.length) this.path = [p];
  }

  /** The closest point to him on the route's segment. */
  nearestRoutePoint() {
    const [a, b] = this.route;
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len2 = vx * vx + vy * vy;
    const t = len2 ? Math.min(1, Math.max(0, ((this.x - a.x) * vx + (this.y - a.y) * vy) / len2)) : 0;
    return { x: a.x + vx * t, y: a.y + vy * t };
  }

  /**
   * Follows this.path: turns to face the next waypoint (standing still while turning), then walks.
   * Returns true when the last waypoint is reached.
   */
  walk(dt) {
    let time = dt;
    while (time > 1e-9 && this.path.length) {
      const p = this.path[0];
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 1e-6) {
        this.x = p.x;
        this.y = p.y;
        this.path.shift();
        continue;
      }
      const heading = angleTo(this.x, this.y, p.x, p.y);
      const turn = Math.abs(angleDiff(heading, this.facingDeg));
      if (turn > 1e-6) {
        const used = Math.min(time, turn / this.turnRate);
        this.turnToward(heading, used);
        time -= used;
        continue;
      }
      const step = this.speed * time;
      if (step >= d - 1e-9) {
        this.x = p.x;
        this.y = p.y;
        time -= d / this.speed;
        this.path.shift();
      } else {
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
        time = 0;
      }
    }
    return this.path.length === 0;
  }

  turnToward(deg, dt) {
    const diff = angleDiff(deg, this.facingDeg);
    const max = this.turnRate * dt;
    this.facingDeg = Math.abs(diff) <= max ? deg : this.facingDeg + Math.sign(diff) * max;
    this.facingDeg = angleDiff(this.facingDeg, 0);
  }
}
