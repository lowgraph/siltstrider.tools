/**
 * Scripted teleports on the route: Propylons, dialogue transports, teleporting items and
 * activators, from the Teleports catalog. A teleport is used only when the character
 * carries what it asks for, and a quest's teleport only when asked for. An end that is
 * a travel stop joins it; any other end becomes a place, walked to like any other.
 */
import { stopNameFor } from "./travel-graph.mjs";
import { addPlaces, PLACE_PREFIX } from "./travel-walk.mjs";

export const TELEPORT_KINDS = Object.freeze({
  propylon: "Propylon",
  dialogue: "Dialogue Teleport",
  item: "Item Teleport",
  activator: "Teleport"
});

/** Lowercased item ids a save carries. */
export function heldFromSave(save) {
  return new Set((save?.stuff?.inventory || [])
    .map(item => (typeof item?.id === "string" ? item.id.toLowerCase() : null))
    .filter(Boolean));
}

/** Whether a teleport works for someone carrying `held`. */
export function usableTeleport(teleport, held = new Set(), includeQuest = false) {
  if (!teleport || (teleport.questGated && !includeQuest)) return false;
  return (teleport.requires || []).every(item => held.has(item))
    && !(teleport.unless || []).some(item => held.has(item));
}

/**
 * The items teleports ask about, for the "items you carry" list: Propylon indices first,
 * then the rest, each with the teleports it opens.
 */
export function teleportItems(catalog = null) {
  const opens = new Map();
  for (const teleport of catalog?.records || []) {
    if (teleport.questGated) continue;
    for (const id of teleport.requires || []) opens.set(id, (opens.get(id) || 0) + 1);
  }
  return [...opens.entries()]
    .map(([id, count]) => ({ id, name: catalog?.items?.[id] || id, opens: count, index: /index/i.test(id) }))
    .sort((a, b) => (b.index - a.index) || a.name.localeCompare(b.name));
}

function label(teleport, itemName) {
  const needs = (teleport.requires || []).filter(id => id !== teleport.object).map(itemName);
  const suffix = needs.length ? ` (needs ${needs.join(", ")})` : "";
  // Asked for in conversation, whatever it leads to: Folms Mirel's Propylons are dialogue.
  if (teleport.kind === "dialogue" || teleport.topic) {
    return `Ask ${teleport.speakerName || teleport.speaker || "the speaker"} about "${teleport.topic}"${suffix}`;
  }
  return `Use the ${teleport.objectName || teleport.object || "teleport"}${suffix}`;
}

/**
 * Add the teleports someone carrying `held` can use. Returns a new graph and the place
 * cells it had to add, which are joined to the network on foot through `walk`, the
 * options addPlaces takes.
 */
export function addTeleports(graph = {}, catalog = null, { nodes = {}, held = new Set(), includeQuest = false, walk = {} } = {}) {
  let out = Object.fromEntries(Object.entries(graph || {}).map(([stop, edges]) => [stop, [...edges]]));
  const records = (catalog?.records || []).filter(t => usableTeleport(t, held, includeQuest));
  if (!records.length) return { graph: out, places: [] };
  const nodeFor = cell => stopNameFor(nodes?.[cell], cell) || PLACE_PREFIX + cell;
  const itemName = id => catalog?.items?.[id] || id;
  const places = new Set();
  const legs = [];
  for (const teleport of records) {
    const to = nodeFor(teleport.to);
    if (to.startsWith(PLACE_PREFIX)) places.add(teleport.to);
    // An item works anywhere: from every stop the network already has.
    const origins = teleport.from?.length
      ? teleport.from.map(cell => [cell, nodeFor(cell)])
      : Object.keys(out).filter(id => !id.startsWith(PLACE_PREFIX)).map(id => [null, id]);
    for (const [cell, from] of origins) {
      if (from === to) continue;
      if (cell && from.startsWith(PLACE_PREFIX)) places.add(cell);
      legs.push([from, {
        to, kind: TELEPORT_KINDS[teleport.kind] || "Teleport", teleport: teleport.kind,
        free: true, price: 0, hours: 0, label: label(teleport, itemName),
        board: cell ? (nodes?.[cell]?.district || null) : null,
        questGated: Boolean(teleport.questGated) || undefined,
        conditions: teleport.questGated ? teleport.conditions : undefined
      }]);
    }
  }
  if (places.size) out = addPlaces(out, [...places], walk);
  for (const [from, edge] of legs) {
    if (!out[from]) out[from] = [];
    if (!out[edge.to]) out[edge.to] = [];
    if (!out[from].some(e => e.to === edge.to && e.kind === edge.kind && e.label === edge.label)) out[from].push(edge);
  }
  return { graph: out, places: [...places] };
}
