/**
 * The game clock (Mission 2's crossing window). Plain JS, no Phaser and no wall clock: it only moves
 * in update(dtMs), so tools/test_mission2.mjs is deterministic. Times are minutes after midnight
 * (fractions allowed); format() shows H:MM. Numbers from public/assets/data/clock_config.json.
 *
 *   start() / pause()          the clock runs (gameMinutesPerRealSecond) only while started
 *   set(time)                  jump to a time ("10:31" or minutes)
 *   officerAt(time)            'day' before cutoffTime, 'night' from it on
 *   saveLineStart(time)        remember the time Mateo got in line...
 *   restoreLineStart()         ...and go back to it (refused entry restarts at the line: same officer)
 */
export function parseTime(t) {
  if (typeof t === 'number') return t;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(minutes) {
  const total = Math.floor(minutes + 1e-9);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export default class GameClock {
  constructor(config = { gameMinutesPerRealSecond: 1, startTime: '0:00', cutoffTime: '0:00' }) {
    this.configure(config);
  }

  configure(config) {
    this.config = config;
    this.rate = config.gameMinutesPerRealSecond ?? 1;
    this.cutoff = parseTime(config.cutoffTime ?? '0:00');
    this.reset();
  }

  /** Back to the start time, stopped, nothing saved. */
  reset() {
    this.minutes = parseTime(this.config.startTime ?? '0:00');
    this.running = false;
    this.lineStart = null;
  }

  start() {
    this.running = true;
  }

  pause() {
    this.running = false;
  }

  set(time) {
    this.minutes = parseTime(time);
  }

  update(dtMs) {
    if (this.running) this.minutes += (dtMs / 1000) * this.rate;
  }

  format(time = this.minutes) {
    return formatTime(parseTime(time));
  }

  officerAt(time = this.minutes) {
    return parseTime(time) < this.cutoff ? 'day' : 'night';
  }

  saveLineStart(time = this.minutes) {
    this.lineStart = parseTime(time);
  }

  restoreLineStart() {
    if (this.lineStart !== null) this.minutes = this.lineStart;
  }
}
