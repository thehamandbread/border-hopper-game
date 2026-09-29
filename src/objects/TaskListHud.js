import { pixelText } from '../systems/pixelText.js';

const WHITE = 0xffffff;
const DONE_COLOR = 0x8fd18f;
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
      this.refresh(task);
    });
    this.carryLine = pixelText(scene, 6, 6 + taskList.tasks.length * LINE_H + 3, '', { color: CARRY_COLOR })
      .setScrollFactor(0)
      .setDepth(2000);

    taskList.on('task-progress', (t) => this.refresh(t));
    taskList.on('task-complete', (t) => this.refresh(t));
    player.on('carrying-changed', (item) => this.carryLine.setText(item ? `Carrying: ${item}` : ''));
  }

  refresh(task) {
    const count = task.count > 1 ? ` (${task.progress}/${task.count})` : '';
    this.lines
      .get(task.id)
      .setText(`${task.done ? '[x]' : '[ ]'} ${task.label}${count}`)
      .setTint(task.done ? DONE_COLOR : WHITE);
  }
}
