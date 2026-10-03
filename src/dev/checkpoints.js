// Dev-only checkpoint registry (never shipped: only loaded from main.js in dev builds).
//
// Each checkpoint names the scene to start (with optional scene data) and a setup(scene) that runs
// after the scene's create(), with a fresh GameState. Restaurant checkpoints replay the real task
// steps (tile swaps, task completion) so the scene's own logic does the rest. Curb checkpoints start
// the curb cutscene partway: CutsceneRunner fast-forwards to a labelled step, applies story events
// instantly (e.g. Don Aurelio already sitting), and can start the conversation at a given node.

// Restaurant tile indexes (see tools/art/README.md).
const TABLE_DIRTY = 5;
const TABLE_CLEAN = 6;
const TRASH_FULL = 10;
const TRASH_EMPTY = 11;

function findTiles(scene, index) {
  const found = [];
  scene.ground.forEachTile((t) => {
    if (t.index === index) found.push(t);
  });
  return found;
}

function unregisterByPrompt(scene, prompt) {
  for (const item of [...scene.interactions.items]) if (item.prompt === prompt) scene.interactions.unregister(item);
}

/** As if Mateo had taken the trash out. */
function doTrash(scene) {
  for (const t of findTiles(scene, TRASH_FULL)) scene.ground.putTileAt(TRASH_EMPTY, t.x, t.y);
  unregisterByPrompt(scene, 'Grab trash bag');
  scene.markers.remove(scene.trashMarker);
  scene.tasks.complete('take_out_trash');
}

/** As if Mateo had wiped every table (completing the task makes the phone ring). */
function doTables(scene) {
  for (const t of findTiles(scene, TABLE_DIRTY)) scene.ground.putTileAt(TABLE_CLEAN, t.x, t.y);
  unregisterByPrompt(scene, 'Wipe table');
  for (const m of [...scene.markers.markers]) if (m.taskId === 'wipe_tables') scene.markers.remove(m);
  scene.tasks.progress('wipe_tables', 3);
}

function placeMateo(scene, x, y) {
  scene.player.setPosition(x, y);
}

/** As if the call had played out: stove burning (fire spread ~25 s), alarm on, call over. */
function doCall(scene) {
  scene.ringSound?.stop();
  scene.markers.remove(scene.phoneMarker);
  scene.phoneLedge.setFrame(0);
  scene.phone.setIdle();
  scene.clearMessage();
  scene.phoneState = 'call';
  scene.igniteStove();
  scene.fire.update(25000);
  scene.onCallEnded();
  const spot = scene.restartSpot;
  placeMateo(scene, spot.x, spot.y);
}

export const CHECKPOINTS = [
  {
    id: 'prologue_start',
    label: 'Prologue: start of shift',
    scene: 'RestaurantScene',
    setup: () => {},
  },
  {
    id: 'prologue_tables',
    label: 'Prologue: trash done, tables next',
    scene: 'RestaurantScene',
    setup: (scene) => {
      doTrash(scene);
      placeMateo(scene, 200, 150);
    },
  },
  {
    id: 'prologue_phone',
    label: 'Prologue: phone ringing',
    scene: 'RestaurantScene',
    setup: (scene) => {
      doTrash(scene);
      placeMateo(scene, 184, 190);
      doTables(scene);
    },
  },
  {
    id: 'prologue_escape',
    label: 'Prologue: call ended, escape',
    scene: 'RestaurantScene',
    setup: (scene) => {
      doTrash(scene);
      doTables(scene);
      doCall(scene);
    },
  },
  {
    id: 'curb_start',
    label: 'Curb: Don Aurelio arrives',
    scene: 'CurbScene',
    data: { skipTo: 'car_arrives' },
    setup: () => {},
  },
  {
    id: 'curb_choice2',
    label: "Curb: 'what do you want' choice",
    scene: 'CurbScene',
    // Don Aurelio already sitting; the conversation starts at "Let me ask you something..." (node n23).
    data: { skipTo: 'conversation', preEvents: ['aurelio_sits'], dialogueNodes: { curb: 'n23' } },
    setup: () => {},
  },
  {
    id: 'first_text',
    label: 'Prologue: first text arrives',
    scene: 'CurbScene',
    // Everything fast-forwarded: Don Aurelio has driven off; then the first text arrives.
    data: { skipTo: '__after_end', preEvents: ['aurelio_leaves', 'first_text'] },
    setup: () => {},
  },
];

export const getCheckpoint = (id) => CHECKPOINTS.find((c) => c.id === id);
