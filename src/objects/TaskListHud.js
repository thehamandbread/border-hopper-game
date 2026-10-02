import { pixelText } from '../systems/pixelText.js';

const WHITE = 0xffffff;
const DONE_COLOR = 0x8fd18f;
const DIM_COLOR = 0x7a7a7a; // tasks that aren't current yet
const CARRY_COLOR = 0xf0d080;
const LINE_H = 11;

/** Checklist in the top-left corner, fixed to the camera, with a "Carrying" line below. */
export default class TaskListHud {
  constructor(scene, taskList, player) {
    this.taskList = taskList;
    this.lines = new Map();
    taskList.tasks.forEach((task, i) => {
      const line = pixelText(scene, 6, 6 + i * LINE_H, '').setScrollFactor(0).setDepth(2000);
      this.lines.set(task.id, line);
    });
    this.refreshAll();
    this.carryLine = pixelText(scene, 6, 6 + taskList.tasks.length * LINE_H + 3, '', { color: CARRY_COLOR })
      .setScrollFactor(0)
      .setDepth(2000);

    taskList.on('task-progress', () => this.refreshAll());
    taskList.on('task-complete', () => this.refreshAll());
    player.on('carrying-changed', (item) => this.carryLine.setText(item ? `Carrying: ${item}` : ''));
  }

  refreshAll() {
    this.taskList.tasks.forEach((t) => this.refresh(t));
  }

  refresh(task) {
    const count = task.count > 1 ? ` (${task.progress}/${task.count})` : '';
    this.lines
      .get(task.id)
      .setText(`${task.done ? '[x]' : '[ ]'} ${task.label}${count}`)
      .setTint(task.done ? DONE_COLOR : this.taskList.isCurrent(task.id) ? WHITE : DIM_COLOR);
  }
}
