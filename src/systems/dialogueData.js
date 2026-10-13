/**
 * Conversation data that reuses another conversation by reference: { "extends": "<id>", "nodes": {...} }
 * takes every node of <id> and replaces or adds the ones it lists (e.g. Mission 2's booth reuses
 * Mission 1's cover-story questions and swaps the key question). get(id) returns a conversation's
 * data. No Phaser here: the node tests use it too.
 */
export function resolveDialogue(data, get) {
  if (!data?.extends) return data;
  const base = resolveDialogue(get(data.extends), get);
  if (!base) throw new Error(`Dialogue "${data.id}" extends unknown "${data.extends}"`);
  const { extends: _base, ...own } = data;
  return { ...base, ...own, nodes: { ...base.nodes, ...data.nodes } };
}
