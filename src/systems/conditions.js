/**
 * Conditions in dialogue data ("if" on lines, options, variants, branch cases and effects;
 * "requires" on skippable questions). A condition reads one value and compares it:
 *
 *   { "flag": "envelope_opened" }                       truthy
 *   { "answer": "cover_story", "eq": "family" }          eq, ne, in: [...], gte, gt, lte, lt
 *   { "answer": "booth_time", "exists": true }           set at all (not null)
 *   { "meter": "heat", "gte": 2 }
 *   { "suspicion": "booth", "gte": "@encounters.booth.secondaryAt" }   "@path" reads the encounter config
 *   { "mission": "attempt", "gte": 3 }                   mission values (attempt, encounter)
 *   { "scene": "lineMoving" }                            a value the scene passes in
 * Combine with { "all": [...] }, { "any": [...] }, { "not": cond }; an array means all of them.
 * No Phaser here: tools/test_encounter.mjs runs it in node.
 */

const OPS = {
  eq: (v, x) => v === x,
  ne: (v, x) => v !== x,
  in: (v, x) => x.includes(v),
  gte: (v, x) => v >= x,
  gt: (v, x) => v > x,
  lte: (v, x) => v <= x,
  lt: (v, x) => v < x,
  exists: (v, x) => (v !== null && v !== undefined) === x,
};

/** Reads "@a.b.c" from the encounter config; anything else is returned as is. */
export function configValue(value, config) {
  if (typeof value !== 'string' || !value.startsWith('@')) return value;
  const found = value
    .slice(1)
    .split('.')
    .reduce((o, k) => (o == null ? undefined : o[k]), config);
  if (found === undefined) throw new Error(`Encounter config has no "${value.slice(1)}"`);
  return found;
}

function read(cond, state, scene) {
  if ('flag' in cond) return state.getFlag(cond.flag);
  if ('answer' in cond) return state.getAnswer(cond.answer);
  if ('meter' in cond) return state.getMeter(cond.meter);
  if ('suspicion' in cond) return state.getSuspicion(cond.suspicion);
  if ('mission' in cond) return state.mission[cond.mission];
  if ('scene' in cond) return scene?.[cond.scene];
  throw new Error(`Condition reads nothing: ${JSON.stringify(cond)}`);
}

/** True when cond holds (no condition holds). scene: values the scene supplies, for { "scene": ... }. */
export function test(cond, state, scene = {}) {
  if (cond === undefined || cond === null) return true;
  if (Array.isArray(cond)) return cond.every((c) => test(c, state, scene));
  if (cond.all) return cond.all.every((c) => test(c, state, scene));
  if (cond.any) return cond.any.some((c) => test(c, state, scene));
  if (cond.not) return !test(cond.not, state, scene);
  const value = read(cond, state, scene);
  const ops = Object.keys(cond).filter((k) => k in OPS);
  if (!ops.length) return !!value;
  return ops.every((op) => OPS[op](value, configValue(cond[op], state.encounterConfig)));
}

/**
 * An option or line with "variants": [{ "if": cond, ...fields }]: the first variant whose condition
 * holds overrides those fields (e.g. text, effects, id, next). Returns a plain copy without "variants".
 */
export function resolveVariant(obj, state, scene) {
  if (!obj.variants) return obj;
  const { variants, ...base } = obj;
  const hit = variants.find((v) => test(v.if, state, scene));
  if (!hit) return base;
  const { if: _cond, ...fields } = hit; // eslint-disable-line no-unused-vars
  return { ...base, ...fields };
}
