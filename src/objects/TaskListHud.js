import { pixelText, textWidth } from '../systems/pixelText.js';

const WHITE = 0xffffff;
const DONE_COLOR = 0x8fd18f;
const FAILED_COLOR = 0xe05a48;
const DIM_COLOR = 0x7a7a7a; // tasks that aren't current yet
const CARRY_COLOR = 0xf0d080;
const LINE_H = 11;
const X = 6;
const Y = 6;
const DEPTH = 2000;

/**
 * Checklist in the top-left corner, fixed to the camera, with a "Carrying" line below.
 * Done tasks are green with [x]; failed tasks are red, [-] and struck through; upcoming tasks are dim.
 * Tasks added at runtime get a new line.
 */
export default class TaskListHud {
  constructor(scene, taskList, player) {
    this.scene = scene;
    this.taskList = taskList;
    this.lines = new Map();
    this.strikes = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH + 1);
    this.carryLine = pixelText(scene, X, 0, '', { color: CARRY_COLOR }).setScrollFactor(0).setDepth(DEPTH);
    this.refreshAll();

    for (const ev of ['task-progress', 'task-complete', 'task-failed', 'task-added']) {
      taskList.on(ev, () => this.refreshAll());
    }
    player.on('carrying-changed', (item) => this.carryLine.setText(item ? `Carrying: ${item}` : ''));
  }

  refreshAll() {
    this.strikes.clear();
    this.taskList.tasks.forEach((t, i) => this.refresh(t, i));
    this.carryLine.setY(Y + this.taskList.tasks.length * LINE_H + 3);
  }

  refresh(task, i) {
    let line = this.lines.get(task.id);
    if (!line) {
      line = pixelText(this.scene, X, Y + i * LINE_H, '').setScrollFactor(0).setDepth(DEPTH);
      this.lines.set(task.id, line);
    }
    const count = task.count > 1 ? ` (${task.progress}/${task.count})` : '';
    const box = task.done ? '[x]' : task.failed ? '[-]' : '[ ]';
    const text = `${box} ${task.label}${count}`;
    let color = DIM_COLOR;
    if (task.done) color = DONE_COLOR;
    else if (task.failed) color = FAILED_COLOR;
    else if (this.taskList.isCurrent(task.id)) color = WHITE;
    line.setText(text).setTint(color).setY(Y + i * LINE_H);
    if (task.failed) {
      // Strike through the label (not the box).
      const x0 = X + textWidth(this.scene, `${box} `);
      this.strikes.fillStyle(FAILED_COLOR).fillRect(x0, line.y + 4, textWidth(this.scene, `${task.label}${count}`), 1);
    }
  }
}
