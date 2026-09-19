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
    favoredClash: b.fav1 === b.fav2
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
