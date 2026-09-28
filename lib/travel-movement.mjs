/**
 * How fast, and how, a character moves on foot: what they carry slows them, constant
 * Levitate lets them fly over anything, constant Water Walking lets them walk the sea.
 * Transcribed from OpenMW 0.51.0: Npc::getWalkSpeed, Npc::getRunSpeed and
 * Npc::getMaxSpeed (apps/openmw/mwclass/npc.cpp), Actor::getEncumbrance and
 * getSwimSpeedImpl (apps/openmw/mwclass/actor.cpp, actor.hpp), and
 * Class::getNormalizedEncumbrance (apps/openmw/mwworld/class.cpp).
 */
import { runSpeed, swimSpeed } from "./travel-walk.mjs";

// ESM::MagicEffect indices.
export const EFFECT = Object.freeze({ waterWalking: 2, burden: 7, feather: 8, levitate: 10 });

/** The item catalogs a save's inventory is weighed against. */
export const ITEM_CATALOGS = Object.freeze(["Weapons", "Armor", "Clothing", "Books", "Potions", "Ingredients",
  "Apparatus", "Lockpicks", "Probes", "RepairTools", "Lights", "Miscellaneous"]);

const setting = (settings, name, fallback) => {
  const value = Number(settings?.[name]);
  return Number.isFinite(value) ? value : fallback;
};

/** Every item record by lowercased id, from whichever catalogs are given. */
export function itemIndex(catalogs = {}) {
  const items = new Map();
  for (const name of ITEM_CATALOGS) {
    for (const record of catalogs?.[name] || []) {
      const id = String(record?.key ?? record?.id ?? "").toLowerCase();
      if (id && !items.has(id)) items.set(id, record);
    }
  }
  return items;
}

/** The player-made items a save holds (parsed from its own records), by lowercased id. */
function createdIndex(save) {
  return new Map((save?.stuff?.created || []).filter(c => c?.id).map(c => [String(c.id).toLowerCase(), c]));
}

/**
 * What a save's pack weighs: each stack's weight times its count, from the catalogs or,
 * for what the player made, from the save's own record. Items neither knows (another
 * world's, or a mod's) are counted, not guessed.
 */
export function carriedWeight(save, items = new Map()) {
  let weight = 0, unknown = 0;
  const created = createdIndex(save);
  for (const stack of save?.stuff?.inventory || []) {
    const count = Math.max(0, Number(stack?.count) || 0);
    const id = String(stack?.id || "").toLowerCase();
    const record = items.get(id) || created.get(id);
    if (!record) { if (count) unknown += 1; continue; }
    const each = Number(record.weight);
    if (Number.isFinite(each) && each > 0) weight += each * count;
  }
  return { weight: Math.round(weight * 100) / 100, unknown };
}

// Spell types that are always on while the character has them.
const PERMANENT = new Set(["ability", "curse", "common_disease", "blight_disease"]);

/**
 * The movement effects always on: from constant-effect enchantments on equipped items,
 * the player's own among them, and from abilities (racial, birthsign), curses and
 * diseases the save carries.
 * Magnitudes add up as the engine adds them; a range counts at its low end, since a
 * constant effect rolls its magnitude once when it is put on.
 */
export function constantEffects(save, items = new Map(), { enchantments = [], spells = [] } = {}) {
  const byEnchantment = new Map((enchantments || []).map(r => [String(r.key ?? r.id).toLowerCase(), r]));
  const bySpell = new Map((spells || []).map(r => [String(r.key ?? r.id).toLowerCase(), r]));
  const totals = { levitate: 0, waterWalking: 0, feather: 0, burden: 0 };
  const sources = [];
  const add = (effects, source) => {
    let used = false;
    for (const effect of effects || []) {
      const kind = Object.keys(EFFECT).find(k => EFFECT[k] === Number(effect?.effectId));
      if (!kind) continue;
      totals[kind] += Math.max(0, Number(effect?.magnitude?.min ?? effect?.magnitude) || 0);
      used = true;
    }
    if (used) sources.push(source);
  };
  const created = createdIndex(save);
  for (const stack of save?.stuff?.inventory || []) {
    if (!stack?.equipped) continue;
    const id = String(stack.id || "").toLowerCase();
    const own = created.get(id);
    if (own) { add(own.constant, own.name || "an item you made"); continue; }
    const record = items.get(id);
    const enchantment = record?.enchantmentId ? byEnchantment.get(String(record.enchantmentId).toLowerCase()) : null;
    if (enchantment?.castType === "constant_effect") add(enchantment.effects, record.name || record.key);
  }
  for (const id of save?.stuff?.spells || []) {
    const spell = bySpell.get(String(id).toLowerCase());
    if (spell && PERMANENT.has(spell.type)) add(spell.effects, spell.name || spell.key);
  }
  return { ...totals, sources };
}

/**
 * Speeds on foot, in units a second, for someone carrying `carried` with these
 * constant effects. Encumbrance is what is carried less Feather plus Burden, over
 * Strength x fEncumbranceStrMult; each speed is cut by fEncumberedMoveEffect times that
 * share, and past it nobody moves. Levitating, the speed is fMinFlySpeed + 0.01 x (Speed
 * + Levitate) x (fMaxFlySpeed - fMinFlySpeed), cut the same way. Water Walking walks the
 * water at the run speed.
 */
export function movementFor(player = {}, settings = {}, { carried = 0, levitate = 0, waterWalking = false,
  feather = 0, burden = 0 } = {}) {
  const strength = Math.max(0, Number(player.strength) || 0);
  const capacity = strength * setting(settings, "fEncumbranceStrMult", 5);
  const load = Math.max(0, (Number(carried) || 0) - (Number(feather) || 0) + (Number(burden) || 0));
  // Class::getNormalizedEncumbrance: nothing carried is no load, even with no capacity.
  const share = load === 0 ? 0 : capacity > 0 ? load / capacity : Infinity;
  const overloaded = share > 1;
  const factor = overloaded ? 0 : Math.max(0, 1 - setting(settings, "fEncumberedMoveEffect", 0.3) * share);
  const magnitude = Math.max(0, Number(levitate) || 0);
  const speed = Math.max(0, Number(player.speed) || 0);
  const min = setting(settings, "fMinFlySpeed", 5), max = setting(settings, "fMaxFlySpeed", 300);
  return {
    run: runSpeed(player, settings) * factor,
    swim: swimSpeed(player, settings) * factor,
    fly: magnitude > 0 ? Math.max(0, (min + 0.01 * (speed + magnitude) * (max - min)) * factor) : 0,
    waterWalking: Boolean(waterWalking),
    load, capacity, share: Number.isFinite(share) ? share : null, overloaded
  };
}
