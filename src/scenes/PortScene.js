import StoryScene from './StoryScene.js';

// Depths: the awning's shade sits on the ground (above the tiles, below everyone); the booth glass
// sits just in front of the officer.
const SHADE_DEPTH = 1;
const DOG_Y = 112;        // the dog walks just outside the front rope (cutscenes/m1_crossing.json)
const HANDLER_Y = 128;
const OFFSTAGE_X = 31 * 16;
const LINE_STEP_GAP = 30; // Mateo stops this far behind the woman (px)
const LINE_STEPS = 2;     // the line inches forward this many tiles as he catches up
const LEASH = 0x2a2420;
const FRAME = { OFFICER_TYPING: 1, GATE_OPEN: 19 };

/**
 * Mission 1, Scene 3: the pedestrian line and the booth (port_map.json, dialogue m1_line and m1_booth,
 * cutscenes/m1_crossing.json). Mateo walks the one-wide lane under his own control; walk-over triggers
 * play the line's narration in script order (the queue at the start, the sign, his pocket). At the
 * last trigger the line stops and the cutscene takes over: the handler walks the dog down the line,
 * the envelope choice, the line moves, the booth. The booth passes him through the gate to Three Hills
 * (a stub for now) or sends him to the door on his left: secondary inspection.
 *
 * data: { atBooth: true } starts at the booth (checkpoints); anything kept between attempts lives in
 * GameState (attempt, card_flagged, envelope_opened).
 */
export default class PortScene extends StoryScene {
  constructor() {
    super('PortScene');
  }

  create(data = {}) {
    const map = this.cache.json.get('port_map');
    this.buildStory(map);
    this.boothResult = null;
    this.nextTrigger = 0;
    this.lineStepsTaken = 0;
    this.createAwning(map);
    this.createBooth(map);
    this.createQueue(map);
    this.createDog();
    this.leash = this.add.graphics();
    if (data.atBooth) {
      // As if the line had moved: everyone ahead gone through the gate, Mateo at the booth.
      this.playCrossing({ skipTo: 'booth', preEvents: ['line_moves'] });
      return;
    }
    // The queue and the heat, as soon as the scene has faded in.
    this.setLock('arriving', true);
    this.time.delayedCall(900, () => {
      this.setLock('arriving', false);
      this.startDialogue('m1_line', 'arrive');
    });
  }

  createAwning(map) {
    const { fromX, toX, rows, edgeRow, posts } = map.awning;
    for (let x = fromX; x <= toX; x++) {
      for (const y of rows) this.add.image(x * 16, y * 16, 'port_awning', 0).setOrigin(0, 0).setDepth(SHADE_DEPTH);
      this.add.image(x * 16, edgeRow * 16, 'port_awning', 1).setOrigin(0, 0).setDepth(SHADE_DEPTH);
    }
    for (const x of posts) {
      const at = this.tileFeet(x, edgeRow);
      this.add.image(at.x, at.y, 'awning_post').setOrigin(0.5, 1).setDepth(at.y);
    }
  }

  /** The officer behind the booth glass: typing, until a tell or a question has him look up. */
  createBooth(map) {
    const [ox, oy] = map.officer;
    const feet = { x: ox * 16 + 8, y: (oy + 1) * 16 };
    this.officer = this.add.sprite(feet.x, feet.y, 'booth_officer', FRAME.OFFICER_TYPING).setOrigin(0.5, 1).setDepth(feet.y);
    this.add.image(ox * 16, oy * 16, 'booth_glass').setOrigin(0, 0).setDepth(feet.y + 1);
  }

  /**
   * The people ahead of Mateo, a couple of tiles short of where they stop: the line inches forward as
   * he catches up. Their props sit on the ground with them.
   */
  createQueue(map) {
    this.queue = {};
    this.props = {};
    for (const q of map.queue) {
      const at = this.tileFeet(q.tile[0] - LINE_STEPS, q.tile[1]);
      const s = this.add.sprite(at.x, at.y, 'queue_npcs', q.frame).setOrigin(0.5, 1).setDepth(at.y);
      // Right-facing walks only: the cutscene runner's standing frame for 'right' is 8, so offset it.
      Object.assign(s, { walk: q.walk, facing: 'right', frameOffset: q.frame - 8, idle: q.idle });
      if (q.idle) s.play(q.idle);
      this.queue[q.id] = s;
    }
    for (const p of map.props) {
      const at = this.tileFeet(p.tile[0] - LINE_STEPS, p.tile[1]);
      this.props[p.id] = this.add.sprite(at.x, at.y, 'port_props', p.frame).setOrigin(0.5, 1).setDepth(at.y - 1);
    }
  }

  createDog() {
    this.handler = this.add.sprite(OFFSTAGE_X + 14, HANDLER_Y, 'handler_walk', 12).setOrigin(0.5, 1).setVisible(false);
    Object.assign(this.handler, { walk: 'handler-walk', facing: 'left' });
    this.dog = this.add.sprite(OFFSTAGE_X, DOG_Y, 'dog_walk', 12).setOrigin(0.5, 1).setVisible(false);
    Object.assign(this.dog, { walk: 'dog-walk', facing: 'left' });
  }

  /** One step of the line moving up: everyone ahead walks a tile to the right. */
  stepLine() {
    this.lineStepsTaken += 1;
    this.lineStepping = true;
    const things = [...Object.values(this.queue), ...Object.values(this.props)];
    things.forEach((t) => {
      if (t.walk) t.play(`${t.walk}-right`, true);
      this.tweens.add({
        targets: t,
        x: t.x + 16,
        duration: 450,
        onComplete: () => {
          if (t.idle) t.play(t.idle);
          else if (t.walk) {
            t.anims.stop();
            t.setFrame(t.frameOffset + 8);
          }
          this.lineStepping = false;
        },
      });
    });
  }

  /** The line's walk-over triggers, in script order; the last one stops the line. */
  checkTriggers() {
    if (this.locks.size) return;
    const triggers = this.mapData.triggers;
    const t = triggers[this.nextTrigger];
    if (!t || this.player.x < t.xPx) return;
    this.nextTrigger += 1;
    if (t.node === 'stop') this.playCrossing();
    else this.startDialogue('m1_line', t.node);
  }

  async playCrossing(options = {}) {
    const things = {
      officer: this.officer, handler: this.handler, dog: this.dog,
      ...this.queue, ...this.props,
    };
    if (!options.skipTo) {
      // Everyone settles where the line stops.
      for (const q of this.mapData.queue) this.queue[q.id].x = this.tileFeet(...q.tile).x;
      for (const p of this.mapData.props) this.props[p.id].x = this.tileFeet(...p.tile).x;
    }
    await this.playCutscene('m1_crossing', { things, dialogueNodes: { m1_line: 'stop' }, ...options });
    if (this.boothResult === 'pass') this.throughTheGate();
    else if (this.boothResult === 'secondary') this.toSecondary();
  }

  onStoryEvent(name) {
    if (name === 'open_gate') this.ground.putTileAt(FRAME.GATE_OPEN, ...this.mapData.gate);
    else if (name === 'booth_pass') this.boothResult = 'pass';
    else if (name === 'booth_secondary') this.boothResult = 'secondary';
  }

  /** Through the open gate and on: Three Hills. */
  async throughTheGate() {
    this.ground.putTileAt(FRAME.GATE_OPEN, ...this.mapData.gate);
    await this.playCutscene({ steps: [{ type: 'moveActor', actor: 'player', path: [[28, 5], [31, 5]], speed: 50 }] });
    this.goToScene('ThreeHillsStubScene', { fade: true });
  }

  /** "The door on your left": to the door, then secondary inspection. */
  async toSecondary() {
    const [dx, dy] = this.mapData.door;
    await this.playCutscene({ steps: [{ type: 'moveActor', actor: 'player', path: [[dx, 5], [dx, dy + 1]], speed: 50 }] });
    if (this.scene.manager.keys.SecondaryScene) this.goToScene('SecondaryScene', { fade: true });
    else this.goToScene('ThreeHillsStubScene', { fade: true, data: { label: 'Secondary inspection (next build)' } });
  }

  update() {
    super.update();
    if (!this.cutscene) {
      // The people ahead block the lane: Mateo stops behind the woman, and the line inches up as he
      // catches up with it, until it stops.
      const woman = this.queue.woman;
      const limit = woman.x - LINE_STEP_GAP;
      if (this.player.x > limit) {
        this.player.body.reset(limit, this.player.y);
        if (this.lineStepsTaken < LINE_STEPS && !this.lineStepping) this.stepLine();
      }
      this.checkTriggers();
    }
    this.leash.clear();
    if (this.dog.visible) {
      this.leash.lineStyle(1, LEASH).lineBetween(this.handler.x - 4, this.handler.y - 13, this.dog.x + 3, this.dog.y - 9);
      this.leash.setDepth(Math.max(this.dog.y, this.handler.y) + 1);
    }
  }
}
