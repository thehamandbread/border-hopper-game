import Phaser from 'phaser';

/**
 * Tracks progress on a list of tasks defined in JSON, done in the order they are listed:
 *   { "tasks": [{ "id": "...", "label": "...", "count": 1, "notYet": "optional early-attempt line" }] }
 * Only the current task (the first unfinished one) can be done.
 * Events: 'task-progress' (task), 'task-complete' (task), 'all-complete'.
 */
export default class TaskList extends Phaser.Events.EventEmitter {
  constructor(defs) {
    super();
    this.tasks = defs.tasks.map((t) => ({
      id: t.id,
      label: t.label,
      count: t.count ?? 1,
      notYet: t.notYet ?? null, // in-world line shown when the task is tried out of order
      progress: 0,
      done: false,
    }));
    this.allDone = false;
  }

  /** Builds a TaskList from a JSON file already loaded into the scene's cache. */
  static fromCache(scene, key) {
    return new TaskList(scene.cache.json.get(key));
  }

  /** The first unfinished task, or undefined when everything is done. */
  current() {
    return this.tasks.find((t) => !t.done);
  }

  isCurrent(id) {
    return this.current()?.id === id;
  }

  get(id) {
    return this.tasks.find((t) => t.id === id);
  }

  /** Adds progress to a task (default 1). Completes it when the count is reached. */
  progress(id, amount = 1) {
    const task = this.get(id);
    if (!task || task.done) return;
    task.progress = Math.min(task.count, task.progress + amount);
    this.emit('task-progress', task);
    if (task.progress >= task.count) {
      task.done = true;
      this.emit('task-complete', task);
      if (!this.allDone && this.tasks.every((t) => t.done)) {
        this.allDone = true;
        this.emit('all-complete');
      }
    }
  }

  complete(id) {
    const task = this.get(id);
    if (task) this.progress(id, task.count - task.progress);
  }

  isComplete() {
    return this.allDone;
  }
}
