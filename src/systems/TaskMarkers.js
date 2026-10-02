import Phaser from 'phaser';

const MARKER_TEXTURE = 'task_marker';
const MARKER_DEPTH = 1500; // above game objects and prompts, below the HUD (2000)
const FADED_ALPHA = 0.35; // while the player's sprite overlaps the marker
const PULSE_MS = 250;      // bright 250 ms, dim 250 ms: a 2 Hz pulse
// The marker is as tall as a tile, so seating its bottom 15 px into the object's tile keeps the whole
// "!" on that object (a shallower overlap would cover a chair or wall on the tile above).
const SEAT = 15;

/**
 * Pulsing "!" markers over objects with unfinished tasks. Task logic stays in the scene:
 * it calls add() / move() / remove(). A marker is also removed automatically when its taskId
 * completes (TaskList 'task-complete'). Disabled instances ignore every call.
 */
export default class TaskMarkers {
  constructor(scene, taskList, { enabled = true, tileSize = 16 } = {}) {
    this.scene = scene;
    this.enabled = enabled;
    this.tileSize = tileSize;
    this.markers = new Set();
    this.taskList = taskList;
    this.dim = false;
    if (!enabled) return;

    taskList.on('task-complete', (task) => {
      for (const m of [...this.markers]) if (m.taskId === task.id) this.remove(m);
      this.refreshVisibility();
    });
    this.timer = scene.time.addEvent({ delay: PULSE_MS, loop: true, callback: () => this.pulse() });
    scene.events.once('shutdown', () => this.destroy());
  }

  /** Marker attached to the top of a tile. Returns a handle, or null if disabled. */
  add({ taskId, tileX, tileY }) {
    if (!this.enabled) return null;
    const sprite = this.scene.add.sprite(0, 0, MARKER_TEXTURE, this.dim ? 1 : 0).setDepth(MARKER_DEPTH);
    const marker = { taskId, sprite, tileX, tileY };
    this.markers.add(marker);
    this.place(marker);
    sprite.setVisible(this.taskList.isCurrent(taskId));
    return marker;
  }

  move(marker, tileX, tileY) {
    if (!marker || !this.markers.has(marker)) return;
    marker.tileX = tileX;
    marker.tileY = tileY;
    this.place(marker);
  }

  remove(marker) {
    if (!marker || !this.markers.delete(marker)) return;
    marker.sprite.destroy();
  }

  /** Sits on its own object: the sprite fills the object's tile (bobbing up 1 px). */
  place(marker) {
    const ts = this.tileSize;
    marker.base = marker.tileY * ts + SEAT;
    marker.sprite.setOrigin(0.5, 1).setPosition(marker.tileX * ts + ts / 2, marker.base - (this.dim ? 1 : 0));
  }

  /** Call every frame: markers fade while the given sprite (the player) stands over them. */
  update(sprite) {
    if (!this.enabled) return;
    const body = sprite.getBounds();
    for (const m of this.markers) {
      const covered = Phaser.Geom.Intersects.RectangleToRectangle(body, m.sprite.getBounds());
      m.sprite.setAlpha(covered ? FADED_ALPHA : 1);
    }
  }

  /** Only markers for the current task are visible. */
  refreshVisibility() {
    for (const m of this.markers) m.sprite.setVisible(this.taskList.isCurrent(m.taskId));
  }

  pulse() {
    this.dim = !this.dim;
    for (const m of this.markers) {
      m.sprite.setFrame(this.dim ? 1 : 0);
      m.sprite.y = m.base - (this.dim ? 1 : 0); // 1 px bob, whole pixels so it stays crisp
    }
  }

  destroy() {
    this.timer?.remove();
    for (const m of this.markers) m.sprite.destroy();
    this.markers.clear();
  }
}
