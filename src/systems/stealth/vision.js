/**
 * Vision cones. A source is anything with { x, y, facingDeg, cone: { widthDeg, length } } (length in
 * px). Angles are in degrees, screen space: 0 is right, 90 is down. Plain JS (no Phaser).
 */
import { SIGHT } from './SightGrid.js';

const RAD = Math.PI / 180;

/** a - b, wrapped into (-180, 180]. */
export function angleDiff(a, b) {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export function angleTo(x0, y0, x1, y1) {
  return Math.atan2(y1 - y0, x1 - x0) / RAD;
}

/**
 * The cone's visible area as a polygon: the source point, then `rays` points across the cone from
 * one edge to the other, each where its ray meets a blocker or the cone's length. Writes into `out`
 * (an array of {x, y}, reused between frames so drawing allocates nothing) and returns it.
 */
export function castCone(source, grid, rays = 24, out = []) {
  const { widthDeg, length } = source.cone;
  const n = Math.max(2, rays);
  while (out.length < n + 1) out.push({ x: 0, y: 0 });
  out.length = n + 1;
  out[0].x = source.x;
  out[0].y = source.y;
  const start = source.facingDeg - widthDeg / 2;
  const step = widthDeg / (n - 1);
  for (let i = 0; i < n; i++) {
    const a = (start + step * i) * RAD;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = grid.rayDistance(source.x, source.y, dx, dy, length, SIGHT);
    out[i + 1].x = source.x + dx * d;
    out[i + 1].y = source.y + dy * d;
  }
  return out;
}

/** In range, inside the cone's angle, and nothing blocking the line to the target point. */
export function canSee(source, target, grid) {
  const d = Math.hypot(target.x - source.x, target.y - source.y);
  if (d > source.cone.length) return false;
  if (d < 1e-6) return true;
  if (Math.abs(angleDiff(angleTo(source.x, source.y, target.x, target.y), source.facingDeg)) > source.cone.widthDeg / 2) {
    return false;
  }
  return grid.lineClear(source.x, source.y, target.x, target.y, SIGHT);
}
