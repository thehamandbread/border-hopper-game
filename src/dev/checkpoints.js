import { gameState } from '../systems/GameState.js';

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

/** A plausible end of the prologue, so Mission 1 checkpoints work without playing it. */
function prologueState(gs) {
  gs.setMeter('loyalty', 0);
  gs.setAnswer('prologue_want', 'family');
  gs.setFlag('tomi_involved', 0);
}

/** ...and of Mission 1's home scene. */
function homeState(gs) {
  prologueState(gs);
  gs.setAnswer('abuela_morning', 'deflect');
  gs.giveItem('tortilla');
}

/** ...and of the tire shop: carrying the envelope. */
function crossingState(gs, { opened = false, flagged = false } = {}) {
  homeState(gs);
  gs.giveItem('envelope');
  if (opened) gs.setFlag('envelope_opened', true);
  if (flagged) {
    // As if refused entry once: Heat +2, the card flagged, the second attempt.
    gs.setMeter('heat', 2);
    gs.setFlag('card_flagged', true);
    gs.mission.attempt = 2;
  }
}

/** Booth answers as if just sent to secondary inspection (booth suspicion 4). */
function sentToSecondary(gs, answers) {
  for (const [name, value] of Object.entries(answers)) gs.setAnswer(name, value);
  gs.mission.encounter = 'booth';
  gs.mission.suspicion.booth = 4;
}

/** Booth answers as if he'd just been passed through the gate. */
function passedBooth(gs, answers) {
  for (const [name, value] of Object.entries(answers)) gs.setAnswer(name, value);
  gs.mission.encounter = 'booth';
  gs.mission.suspicion.booth = 0;
}

/** Mission 2 begun: Mission 1 done (unopened, through the booth clean), the Mission 2 title card passed. */
function mission2State() {
  homeState(gameState);
  gameState.setMeter('loyalty', 1);
  gameState.startMission(2);
}

/** In the alley: through the booth with these answers, the back-door text already read. */
function alleyState(answers) {
  crossingState(gameState);
  passedBooth(gameState, answers);
  gameState.setFlag('m1_back_door_text', true);
  gameState.mission.encounter = 'alley';
}

/** At the laundromat's back door, unseen, the guard passed by: Walt next (E at the door). */
function atBackDoor(scene, { opened }) {
  alleyState({ cover_story: 'family', cover_detail: 'tia', booth_address: 'fourth_street', key_answer: opened ? 'just_paper' : 'tia_letter' });
  if (opened) gameState.setFlag('envelope_opened', true);
  for (const id of ['cone', 'detection', 'cover', 'sprint']) gameState.setFlag(`hint_alley_${id}`, true);
  const [x, y] = scene.mapData.backDoor;
  placeAtTile(scene, x, y + 1);
  scene.player.facing = 'up';
  // The camera turned to the far end of its sweep, away from the door (a few seconds before it's back).
  const cam = scene.stage.cameraSource;
  cam.update(cam.oneWay);
}

// Mission logs as a run would leave them (the same entries the booth, secondary and alley write).
const CLEAN_LOG = [];
const MESSY_LOG = [
  // Attempt 1: the booth ("I have to drop something off.", "A letter for a friend.", "I don't know."),
  // secondary ("Just a guy I know.", "I don't know.") and refused entry.
  { type: 'suspicion', encounter: 'booth', question_id: 'purpose', answer_id: 'dropoff', delta: 2 },
  { type: 'suspicion', encounter: 'booth', question_id: 'jacket', answer_id: 'dont_know', delta: 2 },
  { type: 'suspicion', encounter: 'secondary', question_id: 'friend', answer_id: 'a_guy', delta: 2 },
  { type: 'suspicion', encounter: 'secondary', question_id: 'why', answer_id: 'dont_know', delta: 2 },
  { type: 'heat', encounter: 'secondary', question_id: 'refused', answer_id: null, delta: 2 },
  // Attempt 2: the booth (family, "My tía.", "Fourth Street.", no answer in time), through.
  { type: 'suspicion', encounter: 'booth', question_id: 'jacket', answer_id: 'timeout', delta: 2 },
  // The alley: the guard ("Just walking."), the alley again, the camera.
  { encounter: 'alley', type: 'spotted', source: 'guard' },
  { encounter: 'alley', question_id: 'guard', answer_id: 'just_walking' },
  { type: 'heat', encounter: 'alley', question_id: 'guard', answer_id: 'just_walking', delta: 1 },
  { encounter: 'alley', type: 'spotted', source: 'camera' },
  { type: 'heat', encounter: 'alley', question_id: 'camera', answer_id: 'spotted', delta: 1 },
];

/** At the summary with this mission log (the scene builds its summary in create, so rebuild it). */
function summaryState(scene, log) {
  crossingState(gameState);
  for (const e of log) gameState.mission.log.push({ ...e });
  scene.scene.restart();
}

function placeAtTile(scene, tileX, tileY) {
  const { x, y } = scene.tileFeet(tileX, tileY);
  scene.player.setPosition(x, y);
  scene.player.body.reset(x, y);
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
  {
    id: 'm1_start',
    label: 'M1: home, waking up',
    scene: 'ApartmentScene',
    setup: () => prologueState(gameState),
  },
  {
    id: 'm1_table',
    label: 'M1: home, breakfast scene',
    scene: 'ApartmentScene',
    data: { awake: true },
    setup: (scene) => {
      prologueState(gameState);
      placeAtTile(scene, 3, 6); // beside the table
      scene.startBreakfast();
    },
  },
  {
    id: 'm1_text',
    label: 'M1: home, the text arrives',
    scene: 'ApartmentScene',
    data: { awake: true },
    // Breakfast so far applied instantly (Mateo and Abuela seated, plate and bottle down); the
    // conversation starts at "Mateo's phone buzzes." (node n26).
    setup: (scene) => {
      prologueState(gameState);
      gameState.setAnswer('abuela_morning', 'deflect');
      placeAtTile(scene, 4, 8); // where he stands up from his chair later
      scene.startBreakfast({
        skipTo: 'conversation',
        preEvents: ['mateo_sits', 'abuela_brings_plate', 'plate_down', 'abuela_sits', 'bottle_down'],
        dialogueNodes: { m1_home: 'n26' },
      });
    },
  },
  {
    id: 'm1_tireshop',
    label: 'M1: tire shop, entering',
    scene: 'TireShopScene',
    setup: () => homeState(gameState),
  },
  {
    id: 'm1_nando',
    label: 'M1: tire shop, Nando',
    scene: 'TireShopScene',
    data: { ruizDone: true },
    setup: (scene) => {
      homeState(gameState);
      placeAtTile(scene, 11, 5); // just under the truck
      scene.talkToNando();
    },
  },
  {
    id: 'm1_line',
    label: 'M1: the line',
    scene: 'PortScene',
    setup: () => crossingState(gameState),
  },
  {
    id: 'm1_booth',
    label: 'M1: the booth (envelope unopened)',
    scene: 'PortScene',
    data: { atBooth: true },
    setup: () => crossingState(gameState),
  },
  {
    id: 'm1_booth_opened',
    label: 'M1: the booth (envelope opened)',
    scene: 'PortScene',
    data: { atBooth: true },
    setup: () => crossingState(gameState, { opened: true }),
  },
  {
    id: 'm1_booth_flagged',
    label: 'M1: the booth (attempt 2, card flagged)',
    scene: 'PortScene',
    data: { atBooth: true },
    setup: () => crossingState(gameState, { flagged: true }),
  },
  {
    id: 'm1_secondary_family',
    label: 'M1: secondary (visiting family)',
    scene: 'SecondaryScene',
    // Path (c): "My tía.", no address ("I'd have to check my phone."), "Paperwork.".
    setup: () => {
      crossingState(gameState);
      sentToSecondary(gameState, { cover_story: 'family', cover_detail: 'tia', key_answer: 'paperwork' });
    },
  },
  {
    id: 'm1_secondary_exposed',
    label: 'M1: secondary (told the booth it was cash)',
    scene: 'SecondaryScene',
    setup: () => {
      crossingState(gameState);
      sentToSecondary(gameState, { cover_story: 'shopping', cover_detail: 'shoes', key_answer: 'cash' });
    },
  },
  {
    id: 'm1_threehills',
    label: 'M1: Three Hills, the walk',
    scene: 'ThreeHillsScene',
    // Through the booth on the first try: family, "My tía.", "Fourth Street.", "A letter for my tía.".
    setup: () => {
      crossingState(gameState);
      passedBooth(gameState, { cover_story: 'family', cover_detail: 'tia', booth_address: 'fourth_street', key_answer: 'tia_letter' });
    },
  },
  {
    id: 'm1_alley',
    label: 'M1: the alley (visiting family, Fourth Street)',
    scene: 'AlleyScene',
    setup: () => alleyState({ cover_story: 'family', cover_detail: 'tia', booth_address: 'fourth_street', key_answer: 'tia_letter' }),
  },
  {
    id: 'm1_alley_family',
    label: 'M1: alley (visiting family, Fourth Street)',
    scene: 'AlleyScene',
    setup: () => alleyState({ cover_story: 'family', cover_detail: 'tia', booth_address: 'fourth_street', key_answer: 'tia_letter' }),
  },
  {
    id: 'm1_alley_drop',
    label: 'M1: alley (drop something off)',
    scene: 'AlleyScene',
    setup: () => alleyState({ cover_story: 'dropoff', cover_detail: 'letter', key_answer: 'dropoff_letter' }),
  },
  {
    id: 'm1_alley_passed_guard',
    label: 'M1: alley (already talked past the guard)',
    scene: 'AlleyScene',
    setup: () => {
      alleyState({ cover_story: 'shopping', cover_detail: 'shoes', key_answer: 'cash' });
      gameState.setFlag('passed_guard', true);
    },
  },
  {
    id: 'm1_alley_clinic',
    label: "M1: alley (doctor's appointment)",
    scene: 'AlleyScene',
    setup: () => alleyState({ cover_story: 'doctor', cover_detail: 'dentist', booth_time: 'eleven_thirty', key_answer: 'medical_papers' }),
  },
  {
    id: 'm1_walt_unopened',
    label: 'M1: the back door (envelope unopened)',
    scene: 'AlleyScene',
    setup: (scene) => atBackDoor(scene, { opened: false }),
  },
  {
    id: 'm1_walt_opened',
    label: 'M1: the back door (envelope opened)',
    scene: 'AlleyScene',
    setup: (scene) => atBackDoor(scene, { opened: true }),
  },
  {
    id: 'm1_evening',
    label: 'M1: evening at home (after Walt)',
    scene: 'EveningScene',
    // After Walt (unopened) with a camera spot in the alley: the summary afterwards shows 1 / +1 / None.
    setup: () => {
      alleyState({ cover_story: 'family', cover_detail: 'tia', booth_address: 'fourth_street', key_answer: 'tia_letter' });
      gameState.applyEffects([{ meter: 'loyalty', add: 1, once: 'm1_walt_loyalty' }]);
      gameState.mission.log.push(
        { encounter: 'alley', type: 'spotted', source: 'camera' },
        { type: 'heat', encounter: 'alley', question_id: 'camera', answer_id: 'spotted', delta: 1 },
      );
      gameState.setMeter('heat', 1);
    },
  },
  {
    id: 'm1_summary_clean',
    label: 'M1: summary (a clean run)',
    scene: 'SummaryScene',
    setup: (scene) => summaryState(scene, CLEAN_LOG),
  },
  {
    id: 'm1_summary_messy',
    label: 'M1: summary (a messy run)',
    scene: 'SummaryScene',
    setup: (scene) => summaryState(scene, MESSY_LOG),
  },
  {
    id: 'm2_start',
    label: 'M2: the morning at home',
    scene: 'MorningScene',
    setup: () => mission2State(),
  },
  {
    id: 'm2_warehouse',
    label: 'M2: the warehouse',
    scene: 'WarehouseScene',
    // Setup runs after the scene's create, so set the clock back to where the warehouse starts it.
    setup: () => {
      mission2State();
      gameState.clock.set('10:02');
    },
  },
  {
    id: 'stealth_sandbox',
    label: 'Dev: stealth sandbox (guard, camera, cover)',
    scene: 'StealthSandboxScene',
    setup: () => {},
  },
];

export const getCheckpoint = (id) => CHECKPOINTS.find((c) => c.id === id);
