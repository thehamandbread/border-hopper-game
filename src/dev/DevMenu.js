import { gameState } from '../systems/GameState.js';
import { CHECKPOINTS, getCheckpoint } from './checkpoints.js';
import StatePanel from './StatePanel.js';

// Dev-only tools, installed from main.js in dev builds only (never shipped):
//   `        open/close the checkpoint menu (W/S or arrows + Space/Enter, or number keys)
//   F2       restart the current checkpoint
//   F1       toggle the live state panel
//   ?checkpoint=<id> in the URL starts at that checkpoint.
// The overlays are DOM elements; while the menu is open, game keyboard input is turned off.

class DevMenu {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.selected = 0;
    this.panel = new StatePanel();
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001,
      display: 'none', background: 'rgba(10, 10, 16, 0.94)', color: '#e8e4d8', border: '2px solid #e8d8b0',
      font: '14px/1.6 monospace', padding: '12px 18px', minWidth: '380px',
    });
    document.body.appendChild(this.el);
    window.addEventListener('keydown', (e) => this.onKey(e), true);
  }

  get open() {
    return this.el.style.display !== 'none';
  }

  setOpen(open) {
    this.el.style.display = open ? 'block' : 'none';
    this.game.input.keyboard.enabled = !open; // keep W/S/Space from reaching the game
    this.render();
  }

  render() {
    if (!this.open) return;
    const rows = CHECKPOINTS.map((c, i) => `${i === this.selected ? '>' : ' '} ${i + 1}. ${c.label}`);
    this.el.textContent = '';
    const pre = document.createElement('pre');
    pre.style.margin = 0;
    pre.textContent = ['CHECKPOINTS  (` close, F2 restart, F1 state)', '', ...rows].join('\n');
    this.el.appendChild(pre);
  }

  onKey(e) {
    if (e.code === 'Backquote') {
      e.preventDefault();
      this.setOpen(!this.open);
      return;
    }
    if (e.code === 'F1') {
      e.preventDefault();
      this.panel.toggle();
      return;
    }
    if (e.code === 'F2') {
      e.preventDefault();
      this.start(this.current ?? 'prologue_start');
      return;
    }
    if (!this.open) return;
    e.preventDefault();
    e.stopPropagation();
    const n = CHECKPOINTS.length;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.selected = (this.selected + n - 1) % n;
    else if (e.code === 'KeyS' || e.code === 'ArrowDown') this.selected = (this.selected + 1) % n;
    else if (e.code === 'Space' || e.code === 'Enter') return this.pick(this.selected);
    else if (/^Digit[1-9]$/.test(e.code)) return this.pick(Number(e.code.slice(5)) - 1);
    this.render();
  }

  pick(i) {
    if (!CHECKPOINTS[i]) return;
    this.setOpen(false);
    this.start(CHECKPOINTS[i].id);
  }

  /** Stops whatever is running, resets GameState, starts the checkpoint's scene, then runs its setup. */
  start(id) {
    const cp = getCheckpoint(id);
    if (!cp) {
      console.warn(`[dev] unknown checkpoint "${id}"`); // eslint-disable-line no-console
      return;
    }
    this.current = id;
    gameState.reset();
    const mgr = this.game.scene;
    for (const s of mgr.getScenes(true)) if (s.scene.key !== cp.scene) s.scene.stop();
    const target = mgr.getScene(cp.scene);
    target.events.once('create', () => cp.setup(target));
    if (target.sys.isActive()) target.scene.restart(cp.data ?? {});
    else mgr.start(cp.scene, cp.data ?? {});
    console.log(`[dev] checkpoint ${id}`); // eslint-disable-line no-console
  }

  /** Called by BootScene when loading is done: start a ?checkpoint= from the URL. Returns true if it did. */
  handleBoot() {
    const id = new URLSearchParams(window.location.search).get('checkpoint');
    if (!id || !getCheckpoint(id)) return false;
    this.start(id);
    return true;
  }
}

export function installDevTools(game) {
  game.devTools = new DevMenu(game);
}
