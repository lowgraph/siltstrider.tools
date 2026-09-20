/**
 * Silt Strider Equipment & Loadout Math Engine
 *
 * Canonical formulas for:
 * 1. 19-Slot Equipment Management
 * 2. Weighted Total Armor Rating (AR) with armor skill scaling and Unarmored calculations
 * 3. Encumbrance & Carry Capacity (Strength * 5)
 * 4. Weapon Combat Profiles (Chop, Slash, Thrust, Speed, Reach)
 * 5. Two-Handed weapon / Shield exclusivity
 * 6. Beast Race equipment restrictions (Argonian / Khajiit)
 * 7. Active Constant Effect Enchantment Aggregation
 */

export const EQUIP_SLOTS = Object.freeze([
  "Helmet",
  "Cuirass",
  "Greaves",
  "LeftPauldron",
  "RightPauldron",
  "LeftGauntlet",
  "RightGauntlet",
  "Boots",
  "Shirt",
  "Pants",
  "Skirt",
  "Robe",
  "LeftRing",
  "RightRing",
  "Amulet",
  "Belt",
  "CarriedRight",
  "CarriedLeft",
  "Ammunition",
]);

export const ARMOR_SLOT_WEIGHTS = Object.freeze({
  Cuirass: 0.30,
  CarriedLeft: 0.10, // Only counts if item is a Shield
  Helmet: 0.10,
  Greaves: 0.10,
  Boots: 0.10,
  LeftPauldron: 0.10,
  RightPauldron: 0.10,
  LeftGauntlet: 0.05,
  RightGauntlet: 0.05,
});

export const SLOT_DISPLAY_NAMES = Object.freeze({
  Helmet: "Helmet",
  Cuirass: "Cuirass",
  Greaves: "Greaves",
  LeftPauldron: "Left Pauldron",
  RightPauldron: "Right Pauldron",
  LeftGauntlet: "Left Gauntlet",
  RightGauntlet: "Right Gauntlet",
  Boots: "Boots",
  Shirt: "Shirt",
  Pants: "Pants",
  Skirt: "Skirt",
  Robe: "Robe",
  LeftRing: "Left Ring",
  RightRing: "Right Ring",
  Amulet: "Amulet",
  Belt: "Belt",
  CarriedRight: "Main-Hand Weapon",
  CarriedLeft: "Off-Hand Shield / Light",
  Ammunition: "Ammunition",
});

export const TWO_HANDED_WEAPON_TYPES = new Set([
  "LB2H", // Long Blade Two-Handed (Claymore, Dai-katana)
  "BL2C", // Blunt Two-Handed Close (Warhammer)
  "BL2W", // Blunt Two-Handed Wide (Staff)
  "AX2H", // Axe Two-Handed (Battleaxe)
  "SP2H", // Spear
  "BOW",  // Marksman Bow
  "CROSSBOW", // Marksman Crossbow
]);

export const BEAST_RACES = new Set([
  "argonian",
  "khajiit",
  "naga",
  "suthay-raht",
  "ohmes",
  "ohmes-raht",
  "cathay",
  "cathay-raht",
  "dagi",
  "dagi-raht",
  "alfiq",
  "alfiq-raht",
  "tojay",
  "tojay-raht",
]);

/** Normalize skill names or keys to lowercase alphanumeric */
function normSkill(name) {
  if (!name) return "";
  return String(name).toLowerCase().replace(/[\s_-]/g, "");
}

/** Get character skill rating from skills object or array */
export function getSkillRating(skills, skillName, fallback = 30) {
  if (!skills) return fallback;
  const target = normSkill(skillName);

  if (Array.isArray(skills)) {
    const found = skills.find((s) => normSkill(s.id || s.name) === target);
    if (found && typeof found.value === "number") return found.value;
    if (found && typeof found.base === "number") return found.base + (found.mod || 0);
  } else if (typeof skills === "object") {
    for (const [key, val] of Object.entries(skills)) {
      if (normSkill(key) === target) {
        if (typeof val === "number") return val;
        if (typeof val?.value === "number") return val.value;
        if (typeof val?.base === "number") return val.base + (val.mod || 0);
      }
    }
  }
  return fallback;
}

/** Determines armor skill category for an item: 'light', 'medium', 'heavy', or null */
export function getArmorCategory(item) {
  if (!item) return null;
  const raw = String(item.armorClass || item.class || item.type || "").toLowerCase();
  if (raw.includes("heavy")) return "heavy";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("light")) return "light";
  // Check weapon / shield or generic armor rating
  if (typeof item.armorRating === "number") {
    // If weight / rating heuristic
    if (item.weight >= 20) return "heavy";
    if (item.weight >= 8) return "medium";
    return "light";
  }
  return null;
}

export const getEffectiveArmorCategory = getArmorCategory;

/**
 * Compute the effective Armor Rating for a single slot.
 *
 * Piece AR = Base AR * (ArmorSkill / 30)
 * Unarmored AR = floor(UnarmoredSkill * UnarmoredSkill * 0.0065)
 */
export function computeSlotArmorRating(slotName, item, skills = {}) {
  // If slot cannot contribute to AR
  if (!ARMOR_SLOT_WEIGHTS[slotName]) return 0;
  // If CarriedLeft is not a shield, it has 0 AR contribution
  if (slotName === "CarriedLeft" && item && item.type !== "shield") return 0;

  const unarmoredSkill = getSkillRating(skills, "Unarmored", 15);
  const unarmoredAR = Math.floor(unarmoredSkill * unarmoredSkill * 0.0065);

  if (!item || item.armorRating === undefined || item.armorRating === null) {
    return unarmoredAR;
  }

  const baseAR = Number(item.armorRating) || 0;
  const category = getArmorCategory(item);
  let relevantSkill = unarmoredSkill;

  if (category === "heavy") {
    relevantSkill = getSkillRating(skills, "HeavyArmor", 30);
  } else if (category === "medium") {
    relevantSkill = getSkillRating(skills, "MediumArmor", 30);
  } else if (category === "light") {
    relevantSkill = getSkillRating(skills, "LightArmor", 30);
  }

  return Math.round((baseAR * (relevantSkill / 30)) * 100) / 100;
}

/**
 * Compute Total Armor Rating across all 9 armor slots according to canonical Morrowind weights:
 * Cuirass: 30%, Shield: 10%, Helm: 10%, Greaves: 10%, Boots: 10%, L.Pauldron: 10%, R.Pauldron: 10%, L.Gauntlet: 5%, R.Gauntlet: 5%.
 */
export function computeTotalArmorRating(loadout = {}, skills = {}) {
  const activeLoadout = loadout || {};
  let totalAR = 0;
  for (const [slot, weight] of Object.entries(ARMOR_SLOT_WEIGHTS)) {
    const item = activeLoadout[slot] || null;
    const slotAR = computeSlotArmorRating(slot, item, skills);
    totalAR += slotAR * weight;
  }
  return Math.round(totalAR * 10) / 10;
}

/**
 * Compute total weight and encumbrance ratio.
 * Max Carry Weight = Strength * 5.
 */
export function computeEncumbrance(loadout = {}, strength = 40) {
  const activeLoadout = loadout || {};
  let totalWeight = 0;
  for (const item of Object.values(activeLoadout)) {
    if (item && typeof item.weight === "number") {
      totalWeight += item.weight * (item.count || 1);
    }
  }
  totalWeight = Math.round(totalWeight * 10) / 10;
  const parsedStr = Number(strength);
  const validStr = (strength !== null && strength !== undefined && !Number.isNaN(parsedStr)) ? parsedStr : 40;
  const maxWeight = Math.max(0, validStr * 5);
  const ratio = maxWeight > 0 ? Math.min(100, (totalWeight / maxWeight) * 100) : 0;
  const isOverEncumbered = totalWeight > maxWeight;

  return {
    totalWeight,
    maxWeight,
    ratio: Math.round(ratio * 10) / 10,
    isOverEncumbered,
  };
}

/** Checks whether a race is a beast race (Argonian, Khajiit) */
export function isBeastRace(race) {
  if (!race) return false;
  const norm = String(race).toLowerCase().trim();
  for (const beast of BEAST_RACES) {
    if (norm.includes(beast)) return true;
  }
  return false;
}

/** Checks whether an item is a closed helmet that beasts cannot wear */
export function isClosedHelmet(item) {
  if (!item) return false;
  const type = String(item.type || "").toLowerCase();
  if (type !== "helmet") return false;

  // If item has bodyParts, check if it covers the entire head (slot 0 or slot 1)
  if (Array.isArray(item.bodyParts)) {
    const coversHead = item.bodyParts.some((p) => p.slot === 0 || p.slot === 1);
    const name = String(item.name || item.id || "").toLowerCase();
    // Open helmets explicitly compatible with beasts in Morrowind/OpenMW
    const openHelms = ["colovian", "bonemold", "chitin", "cloth", "cephalopod", "telvanni", "open"];
    if (openHelms.some((h) => name.includes(h))) return false;
    return coversHead;
  }

  // Conservatively, iron, steel, or full closed helmets
  const idOrName = String(item.name || item.id || "").toLowerCase();
  const closedKeywords = ["full", "closed", "plate", "ebony", "daedric", "glass", "indoril", "orcish"];
  return closedKeywords.some((k) => idOrName.includes(k));
}

/**
 * Validates whether an item can be equipped into a specific slot.
 * Enforces:
 * - Slot compatibility (item category/type matching slot)
 * - Beast race restrictions (no boots, no closed helmets)
 * - Two-handed weapon exclusivity
 */
export function validateSlotEquip(item, slotName, { race = "", currentLoadout = {} } = {}) {
  if (!item) return { allowed: true };

  const beast = isBeastRace(race);
  const itemType = String(item.type || "").toLowerCase();
  const slot = String(slotName);

  // 1. Beast Race Restrictions
  if (beast) {
    if (slot === "Boots" || itemType === "boots" || itemType === "shoes") {
      return {
        allowed: false,
        reason: "Beast races (Argonians and Khajiit) cannot equip boots or footwear.",
      };
    }
    if (slot === "Helmet" && isClosedHelmet(item)) {
      return {
        allowed: false,
        reason: "Beast races cannot wear closed helmets that cover the head and muzzle.",
      };
    }
  }

  // 2. Slot Category Compatibility
  if (slot === "Helmet" && itemType !== "helmet") {
    return { allowed: false, reason: "Only helmets can be equipped in the head slot." };
  }
  if (slot === "Cuirass" && itemType !== "cuirass") {
    return { allowed: false, reason: "Only cuirasses can be equipped in the chest armor slot." };
  }
  if (slot === "Greaves" && itemType !== "greaves") {
    return { allowed: false, reason: "Only greaves can be equipped in the leg armor slot." };
  }
  if (slot === "Boots" && itemType !== "boots" && itemType !== "shoes") {
    return { allowed: false, reason: "Only boots or shoes can be equipped in the feet slot." };
  }
  if (slot === "LeftPauldron" && itemType !== "left_pauldron" && itemType !== "pauldron") {
    return { allowed: false, reason: "Only left pauldrons can be equipped in the left shoulder slot." };
  }
  if (slot === "RightPauldron" && itemType !== "right_pauldron" && itemType !== "pauldron") {
    return { allowed: false, reason: "Only right pauldrons can be equipped in the right shoulder slot." };
  }
  if (slot === "LeftGauntlet" && !["left_gauntlet", "left_bracer", "left_glove", "gauntlet", "bracer"].includes(itemType)) {
    return { allowed: false, reason: "Only left gauntlets, bracers, or gloves can be equipped in the left hand slot." };
  }
  if (slot === "RightGauntlet" && !["right_gauntlet", "right_bracer", "right_glove", "gauntlet", "bracer"].includes(itemType)) {
    return { allowed: false, reason: "Only right gauntlets, bracers, or gloves can be equipped in the right hand slot." };
  }
  if (slot === "CarriedLeft" && itemType !== "shield" && itemType !== "light") {
    return { allowed: false, reason: "Only shields or torches/lights can be equipped in the off-hand slot." };
  }
  if (slot === "CarriedRight" && item.recordType !== "WEAP" && !item.chop && !item.slash && !item.thrust) {
    return { allowed: false, reason: "Only weapons can be equipped in the main-hand slot." };
  }
  if (slot === "Ammunition" && !["arrow", "bolt", "thrown"].includes(itemType)) {
    return { allowed: false, reason: "Only arrows, bolts, or thrown weapons can be equipped in the ammunition slot." };
  }
  if (slot === "Robe" && itemType !== "robe") {
    return { allowed: false, reason: "Only robes can be equipped in the outer body slot." };
  }
  if (slot === "Shirt" && itemType !== "shirt") {
    return { allowed: false, reason: "Only shirts can be equipped in the undergarment shirt slot." };
  }
  if (slot === "Pants" && itemType !== "pants") {
    return { allowed: false, reason: "Only pants can be equipped in the undergarment pants slot." };
  }
  if (slot === "Skirt" && itemType !== "skirt") {
    return { allowed: false, reason: "Only skirts can be equipped in the skirt slot." };
  }
  if ((slot === "LeftRing" || slot === "RightRing") && itemType !== "ring") {
    return { allowed: false, reason: "Only rings can be equipped in finger slots." };
  }
  if (slot === "Amulet" && itemType !== "amulet") {
    return { allowed: false, reason: "Only amulets or necklaces can be equipped in the neck slot." };
  }
  if (slot === "Belt" && itemType !== "belt") {
    return { allowed: false, reason: "Only belts can be equipped in the waist slot." };
  }

  // 3. Two-Handed Exclusivity
  if (slot === "CarriedLeft" && itemType === "shield") {
    const mainHand = currentLoadout.CarriedRight;
    if (mainHand && TWO_HANDED_WEAPON_TYPES.has(String(mainHand.type).toUpperCase())) {
      return {
        allowed: false,
        reason: "Cannot equip a shield while wielding a two-handed weapon.",
        requiresUnequip: "CarriedRight",
      };
    }
  }

  return { allowed: true };
}

/**
 * Equip an item into a loadout, resolving two-handed and shield exclusions.
 */
export function equipItem(loadout, slotName, item, { race = "" } = {}) {
  const next = { ...(loadout || {}) };

  // Pre-resolve mutual exclusions so equipping smoothly auto-swaps conflicting slots
  if (slotName === "CarriedRight" && item && TWO_HANDED_WEAPON_TYPES.has(String(item.type).toUpperCase())) {
    delete next.CarriedLeft;
  }
  if (slotName === "CarriedLeft" && item && String(item.type).toLowerCase() === "shield") {
    const mainHand = next.CarriedRight;
    if (mainHand && TWO_HANDED_WEAPON_TYPES.has(String(mainHand.type).toUpperCase())) {
      delete next.CarriedRight;
    }
  }

  const validation = validateSlotEquip(item, slotName, { race, currentLoadout: next });
  if (!validation.allowed) {
    return { success: false, reason: validation.reason, loadout: loadout || {} };
  }

  if (item) {
    next[slotName] = item;
  } else {
    delete next[slotName];
  }

  return { success: true, loadout: next };
}

/**
 * Extract combat ratings for an equipped weapon in CarriedRight.
 */
export function getWeaponCombatProfile(weapon) {
  if (!weapon) return null;
  const isRanged = ["BOW", "CROSSBOW", "ARROW", "BOLT", "THROWN"].includes(String(weapon.type).toUpperCase());
  const isTwoHanded = TWO_HANDED_WEAPON_TYPES.has(String(weapon.type).toUpperCase());

  return {
    id: weapon.id || weapon.key,
    name: weapon.name || "Unknown Weapon",
    type: weapon.type || "Weapon",
    isTwoHanded,
    isRanged,
    speed: weapon.speed ?? 1.0,
    reach: weapon.reach ?? 1.0,
    chop: weapon.chop ? `${weapon.chop.min}-${weapon.chop.max}` : "—",
    slash: weapon.slash ? `${weapon.slash.min}-${weapon.slash.max}` : "—",
    thrust: weapon.thrust ? `${weapon.thrust.min}-${weapon.thrust.max}` : "—",
    health: weapon.health,
    enchantCapacity: weapon.enchantp ?? 0,
    enchantmentId: weapon.enchantmentId || null,
    silver: Boolean(weapon.silver),
    magical: Boolean(weapon.magical),
  };
}

/**
 * Aggregates Constant Effect enchantments from all equipped items.
 */
export function aggregateConstantEffects(loadout = {}, enchantmentsMap = {}) {
  const effects = [];
  for (const [slot, item] of Object.entries(loadout)) {
    if (!item?.enchantmentId) continue;
    const enchant = enchantmentsMap[item.enchantmentId] || (enchantmentsMap.get && enchantmentsMap.get(item.enchantmentId));
    if (enchant && (enchant.type === "constant" || enchant.type === 3 || enchant.chargeType === "constant")) {
      effects.push({
        slot,
        itemId: item.id || item.key,
        itemName: item.name || item.id,
        enchantId: item.enchantmentId,
        effects: enchant.effects || [],
      });
    }
  }
  return effects;
}

/**
 * Creates an initial clean loadout structure.
 */
export function createDefaultLoadout() {
  return {};
}

/**
 * Default 4 loadouts preset container.
 */
export function createDefaultLoadoutPresets() {
  return [
    { id: "loadout-1", name: "Primary Combat", items: {} },
    { id: "loadout-2", name: "Secondary / Alternate", items: {} },
    { id: "loadout-3", name: "Stealth & Infiltration", items: {} },
    { id: "loadout-4", name: "Arcane & Utility", items: {} },
  ];
}
