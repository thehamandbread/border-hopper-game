/**
 * The stealth engine's view of a map: one cell per tile, each marked as blocking sight, blocking
 * movement, or both. Plain JS (no Phaser), so tools/test_stealth.mjs runs it in node.
 *
 * Built from a map JSON in the existing format: tileset.blocking lists the tile ids that block
 * movement (as every scene uses it); tileset.blocksSight lists the ids that block sight, and defaults
 * to the same list. Cover (dumpsters, pallets, cars) is added with addSolid: it blocks both.
 * Cells outside the map block both.
 */
export const SIGHT = 1;
export const MOVE = 2;

export default class SightGrid {
  constructor(width, height, tileSize = 16) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.cells = new Uint8Array(width * height);
  }

  static fromMap(map) {
    const grid = new SightGrid(map.width, map.height, map.tileWidth ?? 16);
    const moveIds = new Set(map.tileset?.blocking ?? []);
    const sightIds = new Set(map.tileset?.blocksSight ?? map.tileset?.blocking ?? []);
    map.tiles.forEach((row, y) =>
      row.forEach((id, x) => {
        if (moveIds.has(id)) grid.cells[y * grid.width + x] |= MOVE;
        if (sightIds.has(id)) grid.cells[y * grid.width + x] |= SIGHT;
      }),
    );
    return grid;
  }

  /** Marks a w x h block of cells (tile coordinates) as solid: blocks sight and movement. */
  addSolid(cx, cy, w = 1, h = 1) {
    for (let y = cy; y < cy + h; y++) for (let x = cx; x < cx + w; x++) this.set(x, y, SIGHT | MOVE);
  }

  set(cx, cy, mask) {
    if (cx >= 0 && cy >= 0 && cx < this.width && cy < this.height) this.cells[cy * this.width + cx] |= mask;
  }

  blocks(cx, cy, mask = SIGHT) {
    if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) return true;
    return (this.cells[cy * this.width + cx] & mask) !== 0;
  }

  /**
   * Distance (px) from (x, y) along the unit direction (dx, dy) to the first blocking cell edge, or
   * maxLen if nothing blocks before it. Grid DDA: steps cell by cell. The start cell never blocks
   * (a camera's mount sits in its wall).
   */
  rayDistance(x, y, dx, dy, maxLen, mask = SIGHT) {
    const ts = this.tileSize;
    let cx = Math.floor(x / ts);
    let cy = Math.floor(y / ts);
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const tDeltaX = adx > 1e-9 ? ts / adx : Infinity;
    const tDeltaY = ady > 1e-9 ? ts / ady : Infinity;
    let tMaxX = adx > 1e-9 ? (dx > 0 ? (cx + 1) * ts - x : x - cx * ts) / adx : Infinity;
    let tMaxY = ady > 1e-9 ? (dy > 0 ? (cy + 1) * ts - y : y - cy * ts) / ady : Infinity;
    for (;;) {
      let t;
      if (tMaxX < tMaxY) {
        t = tMaxX;
        tMaxX += tDeltaX;
        cx += stepX;
      } else {
        t = tMaxY;
        tMaxY += tDeltaY;
        cy += stepY;
      }
      if (t >= maxLen) return maxLen;
      if (this.blocks(cx, cy, mask)) return t;
    }
  }

  /** True if nothing blocks the straight line between two points (px). */
  lineClear(x0, y0, x1, y1, mask = SIGHT) {
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (d < 1e-6) return true;
    return this.rayDistance(x0, y0, (x1 - x0) / d, (y1 - y0) / d, d, mask) >= d;
  }

  /**
   * A walking path (px waypoints, ending at the goal) from one point to another around cells that
   * block movement: breadth-first over 4-connected cells, then shortened to the farthest waypoint in
   * a clear straight line. A blocked goal moves to the nearest open cell. Empty if there is no way.
   */
  findPath(x0, y0, x1, y1) {
    const ts = this.tileSize;
    const w = this.width;
    const start = this.cellAt(x0, y0);
    let goal = this.cellAt(x1, y1);
    let gx = x1;
    let gy = y1;
    if (this.blocks(goal % w, Math.floor(goal / w), MOVE)) {
      goal = this.nearestOpen(goal);
      if (goal < 0) return [];
      gx = (goal % w) * ts + ts / 2;
      gy = Math.floor(goal / w) * ts + ts / 2;
    }
    if (this.lineClear(x0, y0, gx, gy, MOVE)) return [{ x: gx, y: gy }];
    const prev = new Int32Array(this.cells.length).fill(-1);
    prev[start] = start;
    const queue = [start];
    for (let i = 0; i < queue.length && prev[goal] === -1; i++) {
      const c = queue[i];
      const cx = c % w;
      const cy = Math.floor(c / w);
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (this.blocks(nx, ny, MOVE)) continue;
        const n = ny * w + nx;
        if (prev[n] !== -1) continue;
        prev[n] = c;
        queue.push(n);
      }
    }
    if (prev[goal] === -1) return [];
    const cells = [];
    for (let c = goal; c !== start; c = prev[c]) cells.push(c);
    cells.reverse();
    const points = cells.map((c) => ({ x: (c % w) * ts + ts / 2, y: Math.floor(c / w) * ts + ts / 2 }));
    points[points.length - 1] = { x: gx, y: gy };
    // Shorten: from each point, jump to the farthest one still in a clear line.
    const path = [];
    let fromX = x0;
    let fromY = y0;
    let i = 0;
    while (i < points.length) {
      let j = points.length - 1;
      while (j > i && !this.lineClear(fromX, fromY, points[j].x, points[j].y, MOVE)) j--;
      path.push(points[j]);
      fromX = points[j].x;
      fromY = points[j].y;
      i = j + 1;
    }
    return path;
  }

  cellAt(x, y) {
    const cx = Math.min(this.width - 1, Math.max(0, Math.floor(x / this.tileSize)));
    const cy = Math.min(this.height - 1, Math.max(0, Math.floor(y / this.tileSize)));
    return cy * this.width + cx;
  }

  nearestOpen(cell) {
    const w = this.width;
    const cx = cell % w;
    const cy = Math.floor(cell / w);
    for (let r = 1; r < Math.max(w, this.height); r++) {
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) === r && !this.blocks(x, y, MOVE)) return y * w + x;
        }
      }
    }
    return -1;
  }
}
