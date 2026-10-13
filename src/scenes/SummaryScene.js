import Phaser from 'phaser';
import { fadeInFromBlack } from '../systems/cards.js';
import { gameState } from '../systems/GameState.js';
import { buildMissionSummary, signed, summaryDialogues } from '../systems/missionSummary.js';
import { pixelText, wrapText } from '../systems/pixelText.js';

// Layout at the game's native 480x270.
const X = 56;            // labels
const VALUE_X = 300;     // the numbers
const INDENT = 14;       // sub-list headers, then answers one step further in
const RIGHT = 424;       // text wraps before this
const TITLE_Y = 18;
const TOP = 52;
const LINE_H = 11;
const LIST_BOTTOM = 234; // nothing listed below this (the footer sits under it)
const FOOTER_Y = 250;
const MAX_ANSWERS = 8;
const COLORS = { title: 0xf0d080, label: 0xffffff, value: 0xffffff, head: 0xb8b0c0, answer: 0xe8e4d8, rule: 0x4a4458, footer: 0xb8b0c0 };

/**
 * The end-of-mission summary (Mission 1): times spotted, the Heat change, and the answers that raised
 * suspicion (booth, then secondary inspection), from the mission log (missionSummary.js). Never shows
 * suspicion values, Loyalty or meters. Space continues: in dev builds to the next build's stub; in a
 * shipped build, back to the start.
 */
export default class SummaryScene extends Phaser.Scene {
  constructor() {
    super('SummaryScene');
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000');
    const dialogues = summaryDialogues((id) => this.cache.json.get(`dialogue_${id}`));
    this.summary = buildMissionSummary(gameState.mission.log, dialogues);
    if (import.meta.env.DEV && this.summary.unresolved.length) {
      console.log('[summary] unresolved answers', this.summary.unresolved); // eslint-disable-line no-console
    }
    this.draw();
    this.leaving = false;
    fadeInFromBlack(this).then(() => {
      this.input.keyboard.on('keydown-SPACE', () => this.continue());
    });
  }

  text(x, y, str, color, size) {
    return pixelText(this, x, y, str, { color, size });
  }

  draw() {
    const { width } = this.cameras.main;
    const s = this.summary;
    const title = this.text(0, TITLE_Y, 'MISSION 1: THE ENVELOPE', COLORS.title, 16);
    title.setX(Math.round((width - title.width) / 2));
    const rule = this.add.graphics();
    rule.fillStyle(COLORS.rule, 1).fillRect(X, TITLE_Y + 22, RIGHT - X, 1);

    let y = TOP;
    this.text(X, y, 'Times spotted', COLORS.label);
    this.text(VALUE_X, y, String(s.timesSpotted), COLORS.value);
    y += LINE_H + 2;
    this.text(X, y, 'Heat', COLORS.label);
    this.text(VALUE_X, y, signed(s.heatChange), COLORS.value);
    y += LINE_H + 8;
    this.text(X, y, 'Answers that raised suspicion', COLORS.label);
    y += LINE_H + 3;

    const lists = [['Booth', s.suspiciousAnswers.booth], ['Secondary inspection', s.suspiciousAnswers.secondary]];
    this.listed = [];
    if (!lists.some(([, l]) => l.length)) {
      this.text(X + INDENT, y, 'None', COLORS.answer);
    } else {
      let left = MAX_ANSWERS;
      for (const [head, answers] of lists) {
        if (!answers.length || left <= 0 || y + LINE_H * 2 > LIST_BOTTOM) continue;
        this.text(X + INDENT, y, head, COLORS.head);
        y += LINE_H;
        for (const a of answers) {
          if (left <= 0) break;
          const lines = wrapText(this, a, RIGHT - (X + INDENT * 2)).split('\n');
          if (y + lines.length * LINE_H > LIST_BOTTOM) {
            left = 0;
            break;
          }
          this.text(X + INDENT * 2, y, lines.join('\n'), COLORS.answer);
          this.listed.push(a);
          y += lines.length * LINE_H;
          left -= 1;
        }
        y += 4;
      }
    }

    const footer = this.text(0, FOOTER_Y, 'SPACE: continue', COLORS.footer);
    footer.setX(Math.round((width - footer.width) / 2));
  }

  continue() {
    if (this.leaving) return;
    this.leaving = true;
    const cam = this.cameras.main;
    cam.fadeOut(500, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const next = import.meta.env.DEV && this.scene.manager.keys.Mission2StubScene ? 'Mission2StubScene' : null;
      if (next) {
        this.scene.start(next);
      } else {
        gameState.reset();
        this.scene.start('RestaurantScene');
      }
    });
  }
}
