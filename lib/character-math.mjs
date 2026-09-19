/**
 * Pure calculation logic for Morrowind character generation and live stats.
 * Mirrors the canonical math from index.html / legacy-runtime.js.
 */

export const ATTRS = [
  "Strength",
  "Intelligence",
  "Willpower",
  "Agility",
  "Speed",
  "Endurance",
  "Personality",
  "Luck"
];

export const ATTR_ABBR = {
  Strength: "STR",
  Intelligence: "INT",
  Willpower: "WIL",
  Agility: "AGI",
  Speed: "SPD",
  Endurance: "END",
  Personality: "PER",
  Luck: "LUC"
};

export const SPECIALIZATIONS = ["Combat", "Magic", "Stealth"];

export const SKILL_SPEC = {
  "Block": "Combat",
  "Armorer": "Combat",
  "Medium Armor": "Combat",
  "Heavy Armor": "Combat",
  "Blunt Weapon": "Combat",
  "Long Blade": "Combat",
  "Axe": "Combat",
  "Spear": "Combat",
  "Athletics": "Combat",
  "Enchant": "Magic",
  "Destruction": "Magic",
  "Alteration": "Magic",
  "Illusion": "Magic",
  "Conjuration": "Magic",
  "Mysticism": "Magic",
  "Restoration": "Magic",
  "Alchemy": "Magic",
  "Unarmored": "Magic",
  "Security": "Stealth",
  "Sneak": "Stealth",
  "Acrobatics": "Stealth",
  "Light Armor": "Stealth",
  "Short Blade": "Stealth",
  "Marksman": "Stealth",
  "Mercantile": "Stealth",
  "Speechcraft": "Stealth",
  "Hand-to-hand": "Stealth"
};

export const SKILL_GOV = {
  "Block": "Agility",
  "Armorer": "Strength",
  "Medium Armor": "Endurance",
  "Heavy Armor": "Endurance",
  "Blunt Weapon": "Strength",
  "Long Blade": "Strength",
  "Axe": "Strength",
  "Spear": "Endurance",
  "Athletics": "Speed",
  "Enchant": "Intelligence",
  "Destruction": "Willpower",
  "Alteration": "Willpower",
  "Illusion": "Personality",
  "Conjuration": "Intelligence",
  "Mysticism": "Willpower",
  "Restoration": "Willpower",
  "Alchemy": "Intelligence",
  "Unarmored": "Speed",
  "Security": "Intelligence",
  "Sneak": "Agility",
  "Acrobatics": "Strength",
  "Light Armor": "Agility",
  "Short Blade": "Speed",
  "Marksman": "Agility",
  "Mercantile": "Personality",
  "Speechcraft": "Personality",
  "Hand-to-hand": "Speed"
};

export function calculateAttributeDistribution(maj = [], min = []) {
  const counts = {
    Strength: 0,
    Intelligence: 0,
    Willpower: 0,
    Agility: 0,
    Speed: 0,
    Endurance: 0,
    Personality: 0,
    Luck: 0
  };
  const combined = [...(maj || []), ...(min || [])];
  combined.forEach((skill) => {
    const attr = SKILL_GOV[skill];
    if (attr && counts[attr] !== undefined) {
      counts[attr] += 1;
    }
  });
  return counts;
}

export const ATTR_TIP = {
  Strength: "Melee damage, encumbrance, starting Fatigue.",
  Intelligence: "Magicka = Intelligence × (1 + Fortify Maximum Magicka).",
  Willpower: "Spell success chance and fatigue; magicka only regenerates from rest, potions, absorption, or altars.",
  Agility: "To-hit, dodge, starting Fatigue, security chance.",
  Speed: "Movement speed.",
  Endurance: "Health = (STR+END)/2 at level 1; +Endurance/10 HP per level (rounded).",
  Personality: "NPC disposition and speechcraft checks.",
  Luck: "Small bonus to almost every roll."
};

export const PC_START_SPELLS = [
  { name: "Bound Dagger", school: "Conjuration", cost: 6 },
  { name: "Chameleon", school: "Illusion", cost: 15 },
  { name: "Detect Creature", school: "Mysticism", cost: 19 },
  { name: "Exhausting Touch", school: "Destruction", cost: 75 },
  { name: "Feet of Notorgo", school: "Restoration", cost: 45, attribute: "Speed" },
  { name: "Fire Bite", school: "Destruction", cost: 6 },
  { name: "Hearth Heal", school: "Restoration", cost: 13 },
  { name: "Sanctuary", school: "Illusion", cost: 15 },
  { name: "Shield", school: "Alteration", cost: 15 },
  { name: "Summon Ancestral Ghost", school: "Conjuration", cost: 21 },
  { name: "Tap Energy", school: "Mysticism", cost: 180 },
  { name: "Water Walking", school: "Alteration", cost: 9 }
];

/**
 * Evaluates and applies the Bitter Cup artifact modifier:
 * +20 to highest attribute (capped at 100).
 * -20 to lowest attribute (minimum 0).
 *
 * Tie-breaking strictly follows canonical Morrowind engine evaluation order:
 * Strength, Intelligence, Willpower, Agility, Speed, Endurance, Personality, Luck.
 *
 * @param {Object} attributes Object with attribute names as keys and numbers or { v: number } as values
 * @returns {Object} { highest, lowest, bonus: 20, penalty: 20, modifiedAttributes: Object }
 */
export function applyBitterCup(attributes) {
  if (!attributes || typeof attributes !== "object") {
    throw new Error("applyBitterCup requires attributes object");
  }

  const getVal = (a) => {
    const raw = attributes[a];
    if (typeof raw === "object" && raw !== null) return Number(raw.v) || 0;
    return Number(raw) || 0;
  };

  let maxAttr = ATTRS[0];
  let maxVal = getVal(ATTRS[0]);
  let minAttr = ATTRS[0];
  let minVal = getVal(ATTRS[0]);

  for (let i = 1; i < ATTRS.length; i++) {
    const attr = ATTRS[i];
    const val = getVal(attr);
    if (val > maxVal) {
      maxAttr = attr;
      maxVal = val;
    }
    if (val < minVal) {
      minAttr = attr;
      minVal = val;
    }
  }

  const modified = {};
  for (const attr of ATTRS) {
    let v = getVal(attr);
    if (attr === maxAttr) {
      v = Math.min(100, v + 20);
    }
    if (attr === minAttr) {
      v = Math.max(0, v - 20);
    }
    modified[attr] = v;
  }

  return {
    highest: maxAttr,
    lowest: minAttr,
    bonus: 20,
    penalty: 20,
    modifiedAttributes: modified
  };
}

/**
 * Computes live character statistics from a build definition and catalog facts.
 * @param {Object} b Build state { race, gender, sign, spec, fav1, fav2, maj, min }
 * @param {Object} catalogs Catalogs object from adaptCharacterCatalogs
 * @returns {Object|null} Sheet statistics or null if required fields missing
 */
export function computeSheet(b, catalogs) {
  if (!b || !catalogs) return null;
  const race = catalogs.races?.[b.race];
  const sign = catalogs.signs?.[b.sign];
  const specSkills = catalogs.specSkills?.[b.spec];
  if (!race || !sign || !specSkills) return null;

  const g = b.gender === "Female" ? "F" : "M";
  const maj = Array.isArray(b.maj) ? b.maj : [];
  const min = Array.isArray(b.min) ? b.min : [];
  const attrs = {};

  ATTRS.forEach((a) => {
    let v = race[g]?.[a] ?? 40;
    const parts = [v + " race"];
    if (a === b.fav1 || a === b.fav2) {
      v += 10;
      parts.push("+10 favored");
    }
    if (sign.attrs?.[a]) {
      v += sign.attrs[a];
      parts.push("+" + sign.attrs[a] + " " + b.sign);
    }
    attrs[a] = { v, parts };
  });

  const skills = {};
  const allSkills = catalogs.skills || [];
  allSkills.forEach((sk) => {
    let v = 5;
    const parts = ["5 base"];
    const rb = race.skills?.[sk] || 0;
    if (rb) {
      v += rb;
      parts.push("+" + rb + " race");
    }
    if (specSkills.includes(sk)) {
      v += 5;
      parts.push("+5 spec");
    }
    if (maj.includes(sk)) {
      v += 25;
      parts.push("+25 major");
    } else if (min.includes(sk)) {
      v += 10;
      parts.push("+10 minor");
    }
    skills[sk] = { v, parts };
  });

  // A birthsign's Fortify Strength or Endurance does not raise starting Health.
  let bitterCupResult = null;
  if (b.bitterCup) {
    bitterCupResult = applyBitterCup(attrs);
    const { highest, lowest } = bitterCupResult;
    if (highest === lowest) {
      attrs[highest].parts.push("+20 Bitter Cup", "-20 Bitter Cup");
    } else {
      attrs[highest].v = Math.min(100, attrs[highest].v + 20);
      attrs[highest].parts.push("+20 Bitter Cup");

      attrs[lowest].v = Math.max(0, attrs[lowest].v - 20);
      attrs[lowest].parts.push("-20 Bitter Cup");
    }
  }

  const strForHp = attrs.Strength.v - (sign.attrs?.Strength || 0);
  const endForHp = attrs.Endurance.v - (sign.attrs?.Endurance || 0);
  const used = maj.concat(min);
  const repeats = used.filter((s, i) => used.indexOf(s) !== i);

  return {
    race,
    sign,
    attrs,
    skills,
    strForHp,
    endForHp,
    health: Math.floor((strForHp + endForHp) / 2),
    fatigue: attrs.Strength.v + attrs.Willpower.v + attrs.Agility.v + attrs.Endurance.v,
    magicka: Math.floor(attrs.Intelligence.v * (1 + (race.mag || 0) + (sign.mag || 0))),
    duplicates: repeats.filter((s, i) => repeats.indexOf(s) === i),
    favoredClash: b.fav1 === b.fav2,
    bitterCup: bitterCupResult
  };
}

/**
 * Derives starting spells and abilities.
 * @param {Object} b Build state
 * @param {Object} sheet Computed sheet from computeSheet
 * @param {Object} catalogs Catalogs object
 * @returns {Object} { race: string[], sign: string[], skills: string[] }
 */
export function startingSpells(b, sheet, catalogs) {
  if (!b || !sheet || !catalogs) return { race: [], sign: [], skills: [] };
  const race = (catalogs.raceSpells?.[b.race] || []).slice();
  const sign = (catalogs.signSpells?.[b.sign] || []).slice();
  const base = (a) => sheet.attrs[a].v - (sheet.sign.attrs?.[a] || 0);

  // In tenths, so the Willpower and Luck terms stay whole numbers.
  const chance10 = (s) => 20 * (sheet.skills[s.school]?.v || 0) - 10 * s.cost + 2 * base("Willpower") + base("Luck");
  const skills = PC_START_SPELLS.filter(
    (s) =>
      race.indexOf(s.name) < 0 &&
      s.cost <= base("Intelligence") &&
      chance10(s) >= 500 &&
      (!s.attribute || base(s.attribute) >= 70)
  ).map((s) => s.name);

  return { race, sign, skills };
}

/**
 * Handles duplicate skill swapping across Major and Minor arrays.
 * When a user selects skill X at index `idx` in `targetArray` (maj or min),
 * if X is already taken elsewhere in maj or min, the other slot swaps with oldSkill.
 */
export function swapSkill(maj, min, isMajor, index, newSkill) {
  const nextMaj = [...maj];
  const nextMin = [...min];
  const oldSkill = isMajor ? nextMaj[index] : nextMin[index];

  if (newSkill === oldSkill) return { maj: nextMaj, min: nextMin };

  // Check if newSkill is taken in majors
  const majIndex = nextMaj.findIndex((s, i) => (isMajor ? i !== index : true) && s === newSkill);
  if (majIndex !== -1) {
    nextMaj[majIndex] = oldSkill;
  } else {
    // Check if newSkill is taken in minors
    const minIndex = nextMin.findIndex((s, i) => (!isMajor ? i !== index : true) && s === newSkill);
    if (minIndex !== -1) {
      nextMin[minIndex] = oldSkill;
    }
  }

  if (isMajor) {
    nextMaj[index] = newSkill;
  } else {
    nextMin[index] = newSkill;
  }

  return { maj: nextMaj, min: nextMin };
}
