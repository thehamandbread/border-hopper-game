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
 * dialogues: { booth: m1_booth data, secondary: m1_secondary data } (an entry's encounter names its
 * conversation). Suspicion values never appear in the output.
 */
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
      const text = suspiciousAnswers[e.encounter] ? resolveAnswer(dialogues[e.encounter], e.question_id, e.answer_id) : null;
      if (text) suspiciousAnswers[e.encounter].push(text);
      else unresolved.push(`${e.encounter ?? '-'}:${e.question_id ?? '-'}/${e.answer_id ?? '-'}`);
    }
  }
  return { timesSpotted, heatChange, suspiciousAnswers, unresolved };
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

/** A signed number for display: +3, -2, 0. */
export function signed(n) {
  return n > 0 ? `+${n}` : n < 0 ? `${n}` : '0';
}

const clean = (text) => text.replace(PAUSES, '');
