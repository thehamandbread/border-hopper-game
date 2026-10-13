/**
 * The end-of-mission summary, built from the mission log (GameState.mission.log). Plain JS, no Phaser:
 * tools/test_summary.mjs runs it in node.
 *
 *   buildMissionSummary(log, dialogues) -> {
 *     timesSpotted       entries with type 'spotted' (guard and camera, every alley attempt)
 *     heatChange         the signed sum of every Heat entry in the mission (the crossing included)
 *     suspiciousAnswers  { booth: [text], secondary: [text] }: every entry that raised suspicion, in log
 *                        order (no dedupe across attempts), as the exact text the player saw. A timeout
 *                        is the timer's own outcome line ("Mateo doesn't answer.").
 *     unresolved         ids of entries whose text couldn't be found (skipped; shown in the dev panel)
 *   }
 * dialogues: { booth: [conversation data], secondary: [...] } (an entry's encounter names its
 * conversations, e.g. Mission 1's and Mission 2's booth; a single conversation works too). The first
 * one that has the answer gives its text. Suspicion values never appear in the output.
 */
import { resolveDialogue } from './dialogueData.js';

export const SUMMARY_ENCOUNTERS = ['booth', 'secondary'];

const PAUSES = /\{p:\d+\}/g; // typewriter holds inside text (never displayed)

export function buildMissionSummary(log, dialogues) {
  const suspiciousAnswers = Object.fromEntries(SUMMARY_ENCOUNTERS.map((e) => [e, []]));
  const unresolved = [];
  let timesSpotted = 0;
  let heatChange = 0;
  for (const e of log) {
    if (e.type === 'spotted') timesSpotted += 1;
    else if (e.type === 'heat') heatChange += e.delta;
    else if (e.type === 'suspicion' && e.delta > 0) {
      const text = suspiciousAnswers[e.encounter] ? resolveAnswerIn(dialogues[e.encounter], e.question_id, e.answer_id) : null;
      if (text) suspiciousAnswers[e.encounter].push(text);
      else unresolved.push(`${e.encounter ?? '-'}:${e.question_id ?? '-'}/${e.answer_id ?? '-'}`);
    }
  }
  return { timesSpotted, heatChange, suspiciousAnswers, unresolved };
}

/** resolveAnswer over a list of conversations (or one): the first that has the answer. */
export function resolveAnswerIn(dialogues, questionId, answerId) {
  for (const d of [].concat(dialogues ?? [])) {
    const text = resolveAnswer(d, questionId, answerId);
    if (text) return text;
  }
  return null;
}

/**
 * The text the player saw for an answer: the choice node `questionId`'s option (or option variant)
 * whose id is `answerId` (or its 1-based number, for options without ids); 'timeout' is the timed
 * choice's outcome line. null if there's no such answer.
 */
export function resolveAnswer(dialogue, questionId, answerId) {
  const node = dialogue?.nodes?.[questionId];
  if (!node || node.type !== 'choice' || answerId == null) return null;
  if (answerId === 'timeout') {
    const outcome = dialogue.nodes[node.timer?.next];
    return outcome?.text ? clean(outcome.text) : null;
  }
  for (const o of node.options) {
    if (o.id === answerId && o.text) return clean(o.text);
    const v = o.variants?.find((x) => x.id === answerId && x.text);
    if (v) return clean(v.text);
  }
  const n = /^\d+$/.test(answerId) ? node.options[Number(answerId) - 1] : null;
  return n?.text ? clean(n.text) : null;
}

/**
 * The conversations the summary looks answers up in, from a get(id) for loaded dialogue data: each
 * mission's booth and secondary, with "extends" resolved (Mission 2's add the case questions).
 */
export function summaryDialogues(get) {
  const one = (id) => resolveDialogue(get(id), get);
  return {
    booth: ['m1_booth', 'm2_booth'].map(one).filter(Boolean),
    secondary: ['m1_secondary', 'm2_secondary'].map(one).filter(Boolean),
  };
}

/** A signed number for display: +3, -2, 0. */
export function signed(n) {
  return n > 0 ? `+${n}` : n < 0 ? `${n}` : '0';
}

const clean = (text) => text.replace(PAUSES, '');
