const STYLE = {
  fontFamily: 'monospace',
  fontSize: '8px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
};
const DONE_COLOR = '#8fd18f';
const LINE_H = 11;

/** Checklist in the top-left corner, fixed to the camera, with a "Carrying" line below. */
export default class TaskListHud {
  constructor(scene, taskList, player) {
    this.taskList = taskList;
    this.lines = new Map();
    taskList.tasks.forEach((task, i) => {
      const line = scene.add.text(6, 6 + i * LINE_H, '', STYLE).setScrollFactor(0).setDepth(2000);
      this.lines.set(task.id, line);
      this.refresh(task);
    });
    this.carryLine = scene.add
      .text(6, 6 + taskList.tasks.length * LINE_H + 3, '', { ...STYLE, color: '#f0d080' })
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
      .setColor(task.done ? DONE_COLOR : '#ffffff');
  }
}
