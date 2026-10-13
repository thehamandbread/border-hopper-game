import { gameState } from '../systems/GameState.js';
import { pixelText } from '../systems/pixelText.js';
import { goToYard } from './LineScene.js';
import SecondaryScene from './SecondaryScene.js';

const FRAME = { CASE_ON_DESK: 2 };              // case_props.png
const CASE_AT = { x: 392, y: 43 };              // on Carr's desk (where Mission 1's envelope sat)
const CLOCK_TILE = [8, 0];                       // the waiting room's wall clock (secondary_map.json)
const CLOCK_FACE = { x: 3, y: 3, w: 26, h: 10 };
const WAIT_MINUTES = 19;                         // the waiting room's beat: 11:12 to 11:31 in the narration

/**
 * Mission 2, Scene 3b: secondary inspection. Mission 1's room and staging (SecondaryScene, and
 * cutscenes/m1_secondary.json playing dialogue m2_secondary in place of m1_secondary): the waiting
 * room, Carr, the cover-story follow-ups, then the case instead of the envelope. The wall clock is the
 * game clock (the digital plate over the clock tile); the waiting room's beat moves it on by the time
 * the narration passes. Carr never opens the case. Through: the yard (next build); refused: back to the
 * start of the line, the clock put back to when he got in line (LineScene with retry).
 */
export default class CaseSecondaryScene extends SecondaryScene {
  constructor() {
    super('CaseSecondaryScene');
  }

  create() {
    super.create();
    this.caseDesk = this.add.sprite(CASE_AT.x, CASE_AT.y, 'case_props', FRAME.CASE_ON_DESK).setOrigin(0.5, 1)
      .setDepth(CASE_AT.y + 20).setVisible(false);
    const [tx, ty] = CLOCK_TILE;
    const plate = this.add.image(tx * 16 + 8, ty * 16, 'clock_plate').setOrigin(0.5, 0).setDepth(2);
    this.clockText = pixelText(this, 0, 0, '', { color: 0xe05a48 }).setDepth(3);
    this.clockAt = { x: plate.x - 16 + CLOCK_FACE.x + CLOCK_FACE.w / 2, y: plate.y + CLOCK_FACE.y + CLOCK_FACE.h / 2 };
  }

  async inspect() {
    const things = {
      carr: this.carr, carrDesk: this.carrDesk, mateoSeat: this.mateoSeat, mateoDesk: this.mateoDesk,
      ...this.props, envelope: this.caseDesk,
    };
    await this.playCutscene('m1_secondary', { things, dialogueAliases: { m1_secondary: 'm2_secondary' } });
    if (this.result === 'refused') this.goToScene('LineScene', { fade: true, data: { retry: true } });
    else goToYard(this);
  }

  onStoryEvent(name) {
    if (name === 'office') {
      this.caseDesk.setVisible(true);
      this.props.documents.setVisible(true);
    } else if (name === 'clock_1131') {
      gameState.clock.set(gameState.clock.minutes + WAIT_MINUTES);
    } else if (name === 'carr_lifts_case') {
      this.tweens.add({ targets: this.caseDesk, y: CASE_AT.y - 2, duration: 250, yoyo: true });
    } else {
      super.onStoryEvent(name);
    }
  }

  update(time, delta) {
    super.update(time, delta);
    const t = gameState.clock.format();
    if (this.clockText && this.clockText.text !== t) {
      this.clockText.setText(t);
      this.clockText.setPosition(Math.round(this.clockAt.x - this.clockText.width / 2), Math.round(this.clockAt.y - this.clockText.height / 2));
    }
  }
}
