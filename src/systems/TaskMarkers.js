const MARKER_TEXTURE = 'task_marker';
const MARKER_DEPTH = 1500; // above game objects and prompts, below the HUD (2000)
const PULSE_MS = 250;      // bright 250 ms, dim 250 ms: a 2 Hz pulse
const GAP = 2;             // px between the marker and the object's tile

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

  /** Marker above (or, near the top of the view, below) a tile. Returns a handle, or null if disabled. */
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

  place(marker) {
    const ts = this.tileSize;
    const x = marker.tileX * ts + ts / 2;
    const top = marker.tileY * ts;
    // If a marker above the tile would be clipped by the top of the view, put it below instead.
    const above = top - GAP - ts >= this.scene.cameras.main.scrollY;
    marker.base = above ? top - GAP : top + ts + GAP;
    marker.sprite.setOrigin(0.5, above ? 1 : 0).setPosition(x, marker.base - (this.dim ? 1 : 0));
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
