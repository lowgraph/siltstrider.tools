/**
 * Core calculation logic and infrastructure for Morrowind Character Level Simulator
 * and Build Progression Optimizer (Phase 6).
 *
 * Implements:
 * - Theoretical level cap calculation: currentLevel + floor(sum(100 - currentMajorMinor) / 10)
 * - Canonical attribute multipliers: 0 (1x), 1-4 (2x), 5-7 (3x), 8-9 (4x), 10+ (5x); Luck fixed at 1x
 * - Non-retroactive Health gain: floor(newEndurance / 10)
 * - 6 Character archetype detectors and optimal attribute priority queues
 * - Manual level step validation and state application (supporting Stats Only & Stats+Skills modes)
 * - Automated 5x multiplier solver with level-by-level Miscellaneous skill training itineraries
 * - Smart Major/Minor skill distribution prioritizing attributes with low/no Misc training headroom
 * - Trainer cost estimation and health comparison curves
 * - Dual-mode progression matrices: Attribute Progression Matrix & 27-Skill Progression Matrix
 * - Character Builder bridge extraction
 */

import {
  ATTRS,
  ATTR_ABBR,
  SPECIALIZATIONS,
  SKILL_SPEC,
  SKILL_GOV,
  computeSheet
} from "./character-math.mjs";

export { ATTRS, ATTR_ABBR, SPECIALIZATIONS, SKILL_SPEC, SKILL_GOV };

/** Progression display / simulation modes */
export const PROGRESSION_MODES = {
  STATS_ONLY: "stats_only",
  STATS_AND_SKILLS: "stats_and_skills"
};

/** Canonical list of all 27 Morrowind skills */
export const ALL_SKILLS = Object.keys(SKILL_GOV);

/** Skills grouped by their governing attribute */
export const ATTRIBUTE_SKILLS = {
  Strength: ["Armorer", "Blunt Weapon", "Long Blade", "Axe", "Acrobatics"],
  Intelligence: ["Enchant", "Conjuration", "Alchemy", "Security"],
  Willpower: ["Destruction", "Alteration", "Mysticism", "Restoration"],
  Agility: ["Block", "Sneak", "Light Armor", "Marksman"],
  Speed: ["Athletics", "Unarmored", "Short Blade", "Hand-to-hand"],
  Endurance: ["Medium Armor", "Heavy Armor", "Spear"],
  Personality: ["Illusion", "Mercantile", "Speechcraft"],
  Luck: []
};

/**
 * Multiplier threshold lookup for Morrowind attribute level-ups.
 * 0 increases: 1x (+1)
 * 1-4 increases: 2x (+2)
 * 5-7 increases: 3x (+3)
 * 8-9 increases: 4x (+4)
 * 10+ increases: 5x (+5)
 */
export const MULTIPLIER_THRESHOLDS = [
  { minIncreases: 10, multiplier: 5 },
  { minIncreases: 8, multiplier: 4 },
  { minIncreases: 5, multiplier: 3 },
  { minIncreases: 1, multiplier: 2 },
  { minIncreases: 0, multiplier: 1 }
];

/**
 * 6 Canonical Build Archetypes with their attribute priority queues.
 * In accordance with Morrowind mechanics and user specifications:
 * - Endurance is rushed first for maximum non-retroactive Health pool.
 * - Stealth builds prioritize Strength over Speed because sneak criticals
 *   (4x melee / 2x ranged) scale directly with Strength.
 */
export const ARCHETYPES = {
  warrior: {
    id: "warrior",
    name: "Melee Tank / Warrior",
    priority: ["Endurance", "Strength", "Agility", "Speed", "Willpower", "Personality", "Intelligence", "Luck"],
    description: "Rushes Endurance to 100 for maximum HP, followed by Strength and Agility for melee dominance."
  },
  stealth: {
    id: "stealth",
    name: "Stealth / Assassin / Marksman",
    priority: ["Endurance", "Agility", "Strength", "Speed", "Intelligence", "Personality", "Willpower", "Luck"],
    description: "Endurance first, then Agility and Strength for high sneak critical multipliers (4x melee / 2x ranged)."
  },
  mage: {
    id: "mage",
    name: "Pure Mage / Caster",
    priority: ["Endurance", "Intelligence", "Willpower", "Agility", "Speed", "Strength", "Personality", "Luck"],
    description: "Endurance first, then Intelligence for maximum Magicka pool and Willpower for spell casting success."
  },
  battlemage: {
    id: "battlemage",
    name: "Battlemage / Spellsword",
    priority: ["Endurance", "Strength", "Intelligence", "Willpower", "Agility", "Speed", "Personality", "Luck"],
    description: "Hybrid warrior-mage balancing Endurance, Strength for physical arms, and Intelligence for spell arsenal."
  },
  nightblade: {
    id: "nightblade",
    name: "Nightblade / Shadowcaster",
    priority: ["Endurance", "Agility", "Intelligence", "Strength", "Willpower", "Speed", "Personality", "Luck"],
    description: "Hybrid stealth-mage balancing Agility for evasion/criticals with Intelligence for tactical spellcraft."
  },
  diplomat: {
    id: "diplomat",
    name: "Diplomat / Merchant",
    priority: ["Endurance", "Personality", "Speed", "Agility", "Strength", "Willpower", "Intelligence", "Luck"],
    description: "Endurance first, followed by Personality and Speed for dialogue dominance, bartering, and mobility."
  }
};

/**
 * Resolves an attribute priority queue from an optional user list and fallback archetype priority.
 * Safely handles partial lists (e.g. ['Intelligence', 'Willpower']) by placing prioritized
 * attributes first and filling remaining attributes from fallback.
 *
 * @param {Array<string>} [customPriority] Custom attribute priority list
 * @param {Array<string>} [fallbackPriority] Fallback priority queue (defaults to Warrior)
 * @returns {Array<string>} 8-attribute priority list
 */
export function resolveAttributePriority(customPriority, fallbackPriority = ARCHETYPES.warrior.priority) {
  if (!Array.isArray(customPriority) || customPriority.length === 0) {
    return [...fallbackPriority];
  }
  const result = [];
  for (const attr of customPriority) {
    if (ATTRS.includes(attr) && !result.includes(attr)) {
      result.push(attr);
    }
  }
  for (const attr of fallbackPriority) {
    if (!result.includes(attr)) {
      result.push(attr);
    }
  }
  return result;
}

/**
 * Computes attribute multiplier (1 to 5) based on governing skill increases during a level.
 * @param {number} skillIncreases Number of increases in skills governed by this attribute
 * @returns {number} Multiplier (1, 2, 3, 4, or 5)
 */
export function getAttributeMultiplier(skillIncreases) {
  const count = Math.max(0, Number(skillIncreases) || 0);
  for (const entry of MULTIPLIER_THRESHOLDS) {
    if (count >= entry.minIncreases) {
      return entry.multiplier;
    }
  }
  return 1;
}

/**
 * Returns the minimum skill increases needed to earn a target multiplier.
 * @param {number} multiplier Desired multiplier (1 to 5)
 * @returns {number} Required skill increases (0, 1, 5, 8, or 10)
 */
export function getSkillIncreasesForMultiplier(multiplier) {
  const m = Math.min(5, Math.max(1, Number(multiplier) || 1));
  for (const entry of MULTIPLIER_THRESHOLDS) {
    if (m >= entry.multiplier) {
      return entry.minIncreases;
    }
  }
  return 0;
}

/**
 * Calculates theoretical level cap based on major and minor skill levels.
 * Canonical base formula: 1 + floor(sum(100 - BaseMajorMinorSkill) / 10)
 * For characters already above level 1: currentLevel + floor(sum(100 - CurrentMajorMinorSkill) / 10)
 *
 * @param {Array<number>|Object} skills Array of numbers or map of skillName -> value
 * @param {Array<string>} [majorMinorNames] If skills is a map, the 10 major/minor skill names
 * @param {number} [currentLevel=1] Current character level (defaults to 1)
 * @returns {number} Theoretical level cap
 */
export function calculateTheoreticalLevelCap(skills, majorMinorNames, currentLevel = 1) {
  let skillValues = [];

  if (Array.isArray(skills)) {
    skillValues = skills.slice(0, 10);
  } else if (skills && typeof skills === "object") {
    if (Array.isArray(majorMinorNames)) {
      skillValues = majorMinorNames.map((name) => {
        const val = skills[name];
        return typeof val === "object" && val !== null ? val.v ?? 0 : Number(val) || 0;
      });
    } else {
      const names = [
        ...(Array.isArray(skills.maj) ? skills.maj : Array.isArray(skills.build?.maj) ? skills.build.maj : []),
        ...(Array.isArray(skills.min) ? skills.min : Array.isArray(skills.build?.min) ? skills.build.min : [])
      ];
      if (names.length === 10) {
        const skillSource = skills.skills || skills;
        skillValues = names.map((name) => {
          const val = skillSource[name];
          return typeof val === "object" && val !== null ? val.v ?? 0 : Number(val) || 0;
        });
      } else {
        skillValues = [];
      }
    }
  }

  const totalHeadroom = skillValues.reduce((sum, val) => {
    const numeric = typeof val === "object" && val !== null ? val.v ?? 0 : Number(val) || 0;
    return sum + Math.max(0, 100 - numeric);
  }, 0);

  const startLevel = Math.max(1, Math.floor(Number(currentLevel) || 1));
  return startLevel + Math.floor(totalHeadroom / 10);
}

/**
 * Calculates Health gained on level-up: floor(Endurance / 10) using the new Endurance.
 * @param {number} newEndurance Endurance after level-up bonus
 * @returns {number} Health gained
 */
export function calculateHealthGain(newEndurance) {
  return Math.floor(Math.max(0, Number(newEndurance) || 0) / 10);
}

/**
 * Calculates gold training cost to raise a skill from currentSkill by pointsToTrain.
 * Morrowind base training formula: Cost to train from S to S+1 is S gold.
 * Sum for k points: k * S + k * (k - 1) / 2
 *
 * @param {number} currentSkill Starting skill rank
 * @param {number} pointsToTrain Number of points to train
 * @returns {number} Total gold cost
 */
export function calculateTrainingCost(currentSkill, pointsToTrain) {
  const s = Math.max(0, Math.floor(Number(currentSkill) || 0));
  const k = Math.max(0, Math.floor(Number(pointsToTrain) || 0));
  if (k === 0) return 0;
  return k * s + (k * (k - 1)) / 2;
}

/**
 * Normalizes a character build, canonical character, or sheet into a standardized
 * leveling state object.
 *
 * @param {Object} character Input character (build, sheet, or canonical character)
 * @param {Object} [catalogs] Catalogs object if computing from raw build
 * @returns {Object} Normalized state { level, attributes, skills, health, magicka, fatigue, maj, min, misc, ... }
 */
export function normalizeCharacterState(character, catalogs) {
  if (!character) {
    throw new Error("normalizeCharacterState requires character definition");
  }

  let sheet = null;
  let build = character;

  // If already a computed sheet (has attrs and skills objects)
  if (character.attrs && character.skills) {
    sheet = character;
  } else if (catalogs) {
    sheet = computeSheet(character, catalogs);
  }

  const attributes = {};
  ATTRS.forEach((a) => {
    if (sheet?.attrs?.[a]) {
      attributes[a] = typeof sheet.attrs[a] === "object" ? sheet.attrs[a].v : Number(sheet.attrs[a]);
    } else if (character.attributes?.[a] !== undefined) {
      attributes[a] = Number(character.attributes[a]);
    } else if (character.attrs?.[a] !== undefined) {
      attributes[a] = typeof character.attrs[a] === "object" ? character.attrs[a].v : Number(character.attrs[a]);
    } else {
      attributes[a] = 40;
    }
  });

  const skills = {};
  ALL_SKILLS.forEach((s) => {
    if (sheet?.skills?.[s]) {
      skills[s] = typeof sheet.skills[s] === "object" ? sheet.skills[s].v : Number(sheet.skills[s]);
    } else if (character.skills?.[s] !== undefined) {
      const val = character.skills[s];
      skills[s] = typeof val === "object" && val !== null ? val.v ?? 5 : Number(val);
    } else {
      skills[s] = 5;
    }
  });

  // Extract Major and Minor skills from build, character, or computed sheet parts
  const rawMaj =
    character.maj ||
    character.build?.maj ||
    (sheet?.skills
      ? Object.entries(sheet.skills)
          .filter(([_, d]) => d?.parts?.some((p) => typeof p === "string" && p.includes("major")))
          .map(([s]) => s)
      : []);

  const rawMin =
    character.min ||
    character.build?.min ||
    (sheet?.skills
      ? Object.entries(sheet.skills)
          .filter(([_, d]) => d?.parts?.some((p) => typeof p === "string" && p.includes("minor")))
          .map(([s]) => s)
      : []);

  const maj = Array.isArray(rawMaj) ? [...rawMaj] : [];
  const min = Array.isArray(rawMin) ? [...rawMin] : [];
  const usedMajorMinor = new Set([...maj, ...min]);
  const misc = ALL_SKILLS.filter((s) => !usedMajorMinor.has(s));

  // Magicka multiplier from race / birthsign
  const magMult = (sheet?.race?.mag || 0) + (sheet?.sign?.mag || 0) + (character.magMult || 0);

  const health =
    sheet?.health ??
    character.health ??
    Math.floor(((attributes.Strength || 40) + (attributes.Endurance || 40)) / 2);
  const magicka = sheet?.magicka ?? character.magicka ?? Math.floor(attributes.Intelligence * (1 + magMult));
  const fatigue =
    sheet?.fatigue ??
    character.fatigue ??
    attributes.Strength + attributes.Willpower + attributes.Agility + attributes.Endurance;

  const curLevel = Math.max(1, Math.floor(Number(character.level) || 1));
  const levelCap = calculateTheoreticalLevelCap(skills, [...maj, ...min], curLevel);

  const raceName =
    typeof build.race === "object" ? build.race?.name || "Dark Elf" : build.race || sheet?.race?.name || "Dark Elf";
  const signName =
    typeof build.sign === "object" ? build.sign?.name || "The Lady" : build.sign || sheet?.sign?.name || "The Lady";

  return {
    level: curLevel,
    levelCap,
    attributes,
    skills,
    health,
    magicka,
    fatigue,
    magMult,
    maj,
    min,
    misc,
    race: raceName,
    gender: build.gender || "Male",
    sign: signName,
    spec: build.spec || "Combat",
    fav1: build.fav1 || "Strength",
    fav2: build.fav2 || "Endurance",
    className: build.className || "Custom"
  };
}

/**
 * Detects the closest build archetype from character specialization, skills, and attributes.
 * Assigns one of the 6 canonical archetypes:
 * - Melee Tank / Warrior
 * - Stealth / Assassin / Marksman
 * - Pure Mage / Caster
 * - Battlemage / Spellsword
 * - Nightblade / Shadowcaster
 * - Diplomat / Merchant
 *
 * @param {Object} build Character build definition { spec, maj, min, fav1, fav2, className }
 * @returns {Object} Detected archetype definition from ARCHETYPES
 */
export function detectArchetype(build) {
  if (!build) return ARCHETYPES.warrior;

  const className = (build.className || "").toLowerCase().trim();

  // Canonical class name shortcuts
  if (className === "warrior" || className === "knight" || className === "barbarian" || className === "crusader") {
    return ARCHETYPES.warrior;
  }
  if (
    className === "thief" ||
    className === "assassin" ||
    className === "archer" ||
    className === "scout" ||
    className === "acrobat" ||
    className === "monk" ||
    className === "rogue"
  ) {
    return ARCHETYPES.stealth;
  }
  if (className === "mage" || className === "sorcerer" || className === "healer") {
    return ARCHETYPES.mage;
  }
  if (className === "battlemage" || className === "spellsword") {
    return ARCHETYPES.battlemage;
  }
  if (className === "nightblade" || className === "witchhunter" || className === "agent") {
    return ARCHETYPES.nightblade;
  }
  if (className === "bard" || className === "pilgrim" || className === "merchant" || className === "diplomat") {
    return ARCHETYPES.diplomat;
  }

  const maj = Array.isArray(build.maj) ? build.maj : [];
  const min = Array.isArray(build.min) ? build.min : [];
  const fav1 = build.fav1 || "";
  const fav2 = build.fav2 || "";
  const spec = build.spec || "Combat";

  // Score Diplomat / Merchant first
  let diplomatScore = 0;
  if (maj.includes("Mercantile") || min.includes("Mercantile")) diplomatScore += 4;
  if (maj.includes("Speechcraft") || min.includes("Speechcraft")) diplomatScore += 4;
  if (fav1 === "Personality" || fav2 === "Personality") diplomatScore += 3;
  if (maj.includes("Mercantile") && maj.includes("Speechcraft")) diplomatScore += 5;

  if (diplomatScore >= 8) {
    return ARCHETYPES.diplomat;
  }

  // Count specialization weighted points
  let combatPts = spec === "Combat" ? 4 : 0;
  let magicPts = spec === "Magic" ? 4 : 0;
  let stealthPts = spec === "Stealth" ? 4 : 0;

  maj.forEach((s) => {
    const sSpec = SKILL_SPEC[s];
    if (sSpec === "Combat") combatPts += 3;
    else if (sSpec === "Magic") magicPts += 3;
    else if (sSpec === "Stealth") stealthPts += 3;
  });

  min.forEach((s) => {
    const sSpec = SKILL_SPEC[s];
    if (sSpec === "Combat") combatPts += 1.5;
    else if (sSpec === "Magic") magicPts += 1.5;
    else if (sSpec === "Stealth") stealthPts += 1.5;
  });

  // Check favored attributes influence
  if (fav1 === "Strength" || fav2 === "Strength") combatPts += 1.5;
  if (fav1 === "Intelligence" || fav2 === "Intelligence") magicPts += 1.5;
  if (fav1 === "Willpower" || fav2 === "Willpower") magicPts += 1;
  if (fav1 === "Agility" || fav2 === "Agility") stealthPts += 1.5;

  // Hybrids:
  // Battlemage: strong in Magic AND Combat, with Magic+Combat distinctly higher than stealth pairings
  const isBattlemageCandidate =
    magicPts >= 7 &&
    combatPts >= 7 &&
    magicPts + combatPts >= magicPts + stealthPts &&
    magicPts + combatPts >= combatPts + stealthPts &&
    Math.abs(magicPts - combatPts) <= 6;

  // Nightblade: strong in Magic AND Stealth, with Magic+Stealth distinctly higher than combat pairings
  const isNightbladeCandidate =
    magicPts >= 7 &&
    stealthPts >= 7 &&
    magicPts + stealthPts >= magicPts + combatPts &&
    magicPts + stealthPts >= combatPts + stealthPts &&
    Math.abs(magicPts - stealthPts) <= 6;

  if (isBattlemageCandidate && isNightbladeCandidate) {
    return magicPts + combatPts >= magicPts + stealthPts ? ARCHETYPES.battlemage : ARCHETYPES.nightblade;
  }
  if (isBattlemageCandidate) {
    return ARCHETYPES.battlemage;
  }
  if (isNightbladeCandidate) {
    return ARCHETYPES.nightblade;
  }

  // Dominant single focus
  if (magicPts >= combatPts && magicPts >= stealthPts) {
    return ARCHETYPES.mage;
  }
  if (stealthPts >= combatPts && stealthPts >= magicPts) {
    return ARCHETYPES.stealth;
  }
  return ARCHETYPES.warrior;
}

/**
 * Validates a manual level-up step against canonical Morrowind progression rules.
 * Supports both full "Stats & Skills" mode and "Stats Only" mode.
 *
 * Rules:
 * 1. In full mode: exactly 10 Major/Minor skill points allocated.
 * 2. No skill can exceed 100.
 * 3. Up to 3 attributes selected (or fewer if fewer than 3 uncapped attributes exist).
 * 4. No attribute can exceed 100.
 * 5. In full mode: Multipliers must not exceed the earned multiplier from governing skill increases.
 * 6. Luck multiplier is strictly 1x (+1) and requires no governing skill increases.
 *
 * @param {Object} currentState Current character state
 * @param {Object} stepData Step data { attributeBonuses, majorMinorIncreases, miscIncreases, miscTraining }
 * @param {Object} [options] Validation options { mode, statsOnly }
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateLevelStep(currentState, stepData, options = {}) {
  const errors = [];
  if (!currentState || !stepData) {
    return { valid: false, errors: ["Missing state or step data"] };
  }

  const isStatsOnly =
    options.mode !== undefined
      ? options.mode === PROGRESSION_MODES.STATS_ONLY
      : options.statsOnly !== undefined
      ? Boolean(options.statsOnly)
      : stepData.mode === PROGRESSION_MODES.STATS_ONLY || Boolean(stepData.statsOnly);

  const attributes = currentState.attributes || {};
  const skills = currentState.skills || {};
  const maj = Array.isArray(currentState.maj) ? currentState.maj : [];
  const min = Array.isArray(currentState.min) ? currentState.min : [];
  const misc = Array.isArray(currentState.misc) ? currentState.misc : [];
  const majorMinorSet = new Set([...maj, ...min]);
  const miscSet = new Set(misc.length ? misc : ALL_SKILLS.filter((s) => !majorMinorSet.has(s)));

  const mmIncreases = stepData.majorMinorIncreases || {};
  let miscIncreases = stepData.miscIncreases;
  if (!miscIncreases && Array.isArray(stepData.miscTraining)) {
    miscIncreases = {};
    stepData.miscTraining.forEach((m) => {
      miscIncreases[m.skill] = (miscIncreases[m.skill] || 0) + m.points;
    });
  }
  miscIncreases = miscIncreases || {};

  const attrBonuses = Array.isArray(stepData.attributeBonuses) ? stepData.attributeBonuses : [];

  if (!isStatsOnly) {
    // 1. Major/Minor total must be exactly 10
    let totalMM = 0;
    for (const [skill, pts] of Object.entries(mmIncreases)) {
      const num = Number(pts);
      if (!Number.isInteger(num)) {
        errors.push(`Skill ${skill} increase must be an integer (provided: ${pts}).`);
      } else if (num < 0) {
        errors.push(`Skill ${skill} increase cannot be negative.`);
      }
      if (!majorMinorSet.has(skill)) {
        errors.push(`Skill ${skill} is not a Major or Minor skill.`);
      }
      totalMM += Number(pts) || 0;
      const curVal = skills[skill] ?? 0;
      if (curVal + num > 100) {
        errors.push(`Skill ${skill} cannot exceed 100 (current: ${curVal}, added: ${num}).`);
      }
    }

    if (totalMM !== 10) {
      errors.push(`Level-up requires exactly 10 Major or Minor skill increases (provided: ${totalMM}).`);
    }

    // 2. Misc skills check
    for (const [skill, pts] of Object.entries(miscIncreases)) {
      const num = Number(pts);
      if (!Number.isInteger(num)) {
        errors.push(`Misc skill ${skill} increase must be an integer (provided: ${pts}).`);
      } else if (num < 0) {
        errors.push(`Misc skill ${skill} increase cannot be negative.`);
      }
      if (!miscSet.has(skill)) {
        errors.push(`Skill ${skill} is not a Miscellaneous skill.`);
      }
      const curVal = skills[skill] ?? 0;
      if (curVal + num > 100) {
        errors.push(`Misc skill ${skill} cannot exceed 100 (current: ${curVal}, added: ${num}).`);
      }
    }
  }

  // 3. Attribute bonuses check
  const uncappedAttrs = ATTRS.filter((a) => (attributes[a] ?? 0) < 100);
  const maxAllowedPicks = Math.min(3, uncappedAttrs.length);

  if (attrBonuses.length > maxAllowedPicks) {
    errors.push(`Cannot select more than ${maxAllowedPicks} attributes to level up (selected: ${attrBonuses.length}).`);
  }

  const seenAttrs = new Set();
  const attrSkillIncreases = {};
  ATTRS.forEach((a) => (attrSkillIncreases[a] = 0));

  if (!isStatsOnly) {
    for (const [skill, pts] of Object.entries(mmIncreases)) {
      const gov = SKILL_GOV[skill];
      if (gov) attrSkillIncreases[gov] += Number(pts) || 0;
    }
    for (const [skill, pts] of Object.entries(miscIncreases)) {
      const gov = SKILL_GOV[skill];
      if (gov) attrSkillIncreases[gov] += Number(pts) || 0;
    }
  }

  for (const pick of attrBonuses) {
    const attr = pick.attribute;
    const bonus = Number(pick.bonus);

    if (!ATTRS.includes(attr)) {
      errors.push(`Invalid attribute name: ${attr}.`);
      continue;
    }
    if (seenAttrs.has(attr)) {
      errors.push(`Attribute ${attr} was selected multiple times.`);
    }
    seenAttrs.add(attr);

    const curAttrVal = attributes[attr] ?? 0;
    if (curAttrVal >= 100) {
      errors.push(`Attribute ${attr} is already capped at 100.`);
    }
    if (curAttrVal + bonus > 100) {
      errors.push(`Attribute ${attr} cannot exceed 100 (current: ${curAttrVal}, bonus: +${bonus}).`);
    }

    if (!Number.isInteger(bonus)) {
      errors.push(`Attribute ${attr} bonus must be an integer (provided: ${pick.bonus}).`);
    } else if (attr === "Luck") {
      if (bonus !== 1) {
        errors.push(`Luck bonus must strictly be +1 (selected: +${bonus}).`);
      }
    } else {
      if (bonus < 1 || bonus > 5) {
        errors.push(`Attribute ${attr} bonus must be between 1 and 5 (provided: ${bonus}).`);
      } else if (!isStatsOnly) {
        const increases = attrSkillIncreases[attr] || 0;
        const maxMult = getAttributeMultiplier(increases);
        if (bonus > maxMult) {
          errors.push(
            `Attribute ${attr} bonus +${bonus} requires at least ${getSkillIncreasesForMultiplier(bonus)} skill increases, but only received ${increases}.`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Applies a validated manual or automated level step to the current state,
 * calculating new attributes, skills, and vitals.
 *
 * @param {Object} currentState Current state
 * @param {Object} stepData Step data
 * @returns {Object} Next state at level + 1
 */
export function applyLevelStep(currentState, stepData) {
  const nextAttributes = { ...currentState.attributes };
  const nextSkills = { ...currentState.skills };

  const attrBonuses = Array.isArray(stepData.attributeBonuses) ? stepData.attributeBonuses : [];
  const mmIncreases = stepData.majorMinorIncreases || {};
  let miscIncreases = stepData.miscIncreases;
  if (!miscIncreases && Array.isArray(stepData.miscTraining)) {
    miscIncreases = {};
    stepData.miscTraining.forEach((m) => {
      miscIncreases[m.skill] = (miscIncreases[m.skill] || 0) + m.points;
    });
  }
  miscIncreases = miscIncreases || {};

  // Update skills
  for (const [skill, pts] of Object.entries(mmIncreases)) {
    nextSkills[skill] = Math.min(100, (nextSkills[skill] || 0) + (Number(pts) || 0));
  }
  for (const [skill, pts] of Object.entries(miscIncreases)) {
    nextSkills[skill] = Math.min(100, (nextSkills[skill] || 0) + (Number(pts) || 0));
  }

  // Update attributes
  for (const pick of attrBonuses) {
    const attr = pick.attribute;
    const bonus = Number(pick.bonus) || 0;
    nextAttributes[attr] = Math.min(100, (nextAttributes[attr] || 0) + bonus);
  }

  // Calculate Health gain using the NEW Endurance
  const healthGain = calculateHealthGain(nextAttributes.Endurance);
  const nextHealth = (currentState.health || 0) + healthGain;

  // Calculate Magicka & Fatigue
  const magMult = currentState.magMult || 0;
  const nextMagicka = Math.floor(nextAttributes.Intelligence * (1 + magMult));
  const nextFatigue =
    nextAttributes.Strength + nextAttributes.Willpower + nextAttributes.Agility + nextAttributes.Endurance;

  return {
    ...currentState,
    level: currentState.level + 1,
    attributes: nextAttributes,
    skills: nextSkills,
    health: nextHealth,
    magicka: nextMagicka,
    fatigue: nextFatigue,
    lastStep: {
      healthGain,
      attributeBonuses: attrBonuses,
      majorMinorIncreases: mmIncreases,
      miscIncreases: miscIncreases
    }
  };
}

/**
 * Solves a single level step optimally for 5x multipliers, generating:
 * - Up to 3 optimal attribute bonuses (+5 or +1 Luck)
 * - 10 Major/Minor skill allocations
 * - Exact Miscellaneous skill training recommendations needed for 5x multipliers
 * - Estimated gold training costs
 *
 * @param {Object} currentState Current character state
 * @param {Object} [options] Solver options { priority, strategy, mode, statsOnly }
 * @returns {Object|null} Optimized step itinerary or null if level capped
 */
export function optimizeLevelStep(currentState, options = {}) {
  const isStatsOnly =
    options.mode === PROGRESSION_MODES.STATS_ONLY ||
    Boolean(options.statsOnly);

  const attributes = currentState.attributes || {};
  const skills = currentState.skills || {};
  const maj = Array.isArray(currentState.maj) ? currentState.maj : [];
  const min = Array.isArray(currentState.min) ? currentState.min : [];
  const misc = Array.isArray(currentState.misc) ? currentState.misc : [];
  const majorMinorSkills = [...maj, ...min];
  const uncappedMajorMinor = majorMinorSkills.filter((s) => (skills[s] || 0) < 100);

  // In full mode, check if at least 10 major/minor skill increases remain across all major/minor skills
  const totalMMHeadroom = uncappedMajorMinor.reduce((sum, s) => sum + (100 - (skills[s] || 0)), 0);
  if (!isStatsOnly && totalMMHeadroom < 10) {
    return null; // Cannot trigger level-up
  }

  const priority = resolveAttributePriority(options.priority, ARCHETYPES.warrior.priority);
  const strategy = options.strategy || "auto";

  // 1. Pick up to 3 attributes to level
  const uncappedAttrs = ATTRS.filter((a) => (attributes[a] || 0) < 100);
  if (uncappedAttrs.length === 0) {
    // All attributes capped, but can still level up
    const mmIncreases = isStatsOnly ? {} : allocateMajorMinorPoints(currentState, [], 10);
    return {
      level: currentState.level,
      nextLevel: currentState.level + 1,
      mode: isStatsOnly ? PROGRESSION_MODES.STATS_ONLY : PROGRESSION_MODES.STATS_AND_SKILLS,
      attributeBonuses: [],
      majorMinorIncreases: mmIncreases,
      miscTraining: [],
      miscIncreases: {},
      totalTrainingCost: 0,
      healthGain: calculateHealthGain(attributes.Endurance),
      newEndurance: attributes.Endurance,
      newHealth: (currentState.health || 0) + calculateHealthGain(attributes.Endurance),
      summary: "All attributes maxed at 100. Level advance via Major/Minor skills."
    };
  }

  const chosenAttrs = [];

  // Strategy logic:
  // "rush_endurance" or "auto": Always take Endurance if < 100
  if ((strategy === "auto" || strategy === "rush_endurance") && (attributes.Endurance || 0) < 100) {
    chosenAttrs.push("Endurance");
  }

  // "efficient_luck": Always take Luck (+1) if < 100
  if (strategy === "efficient_luck" && (attributes.Luck || 0) < 100 && !chosenAttrs.includes("Luck")) {
    chosenAttrs.push("Luck");
  }

  // Fill remaining slots from priority queue
  for (const attr of priority) {
    if (chosenAttrs.length >= Math.min(3, uncappedAttrs.length)) break;
    if (!chosenAttrs.includes(attr) && (attributes[attr] || 0) < 100) {
      if (strategy === "triple_5" && attr === "Luck") {
        // Only pick Luck in triple_5 if no non-Luck uncapped attributes remain
        const remainingNonLuck = uncappedAttrs.filter((a) => a !== "Luck" && !chosenAttrs.includes(a));
        if (remainingNonLuck.length > 0) continue;
      }
      chosenAttrs.push(attr);
    }
  }

  // Target bonuses per attribute
  const targetBonusPerAttr = {};
  for (const attr of chosenAttrs) {
    const curVal = attributes[attr] || 0;
    targetBonusPerAttr[attr] = attr === "Luck" ? 1 : Math.min(5, 100 - curVal);
  }

  if (isStatsOnly) {
    const attributeBonuses = [];
    for (const attr of chosenAttrs) {
      const curVal = attributes[attr] || 0;
      const bonus = targetBonusPerAttr[attr];
      attributeBonuses.push({
        attribute: attr,
        bonus,
        startValue: curVal,
        endValue: curVal + bonus,
        multiplier: attr === "Luck" ? 1 : bonus
      });
    }

    const endurancePick = attributeBonuses.find((b) => b.attribute === "Endurance");
    const newEndurance = endurancePick ? endurancePick.endValue : attributes.Endurance;
    const healthGain = calculateHealthGain(newEndurance);

    return {
      level: currentState.level,
      nextLevel: currentState.level + 1,
      mode: PROGRESSION_MODES.STATS_ONLY,
      attributeBonuses,
      majorMinorIncreases: {},
      miscTraining: [],
      miscIncreases: {},
      totalTrainingCost: 0,
      healthGain,
      newEndurance,
      newHealth: (currentState.health || 0) + healthGain,
      summary: `Stats only: ${attributeBonuses.map((b) => `${b.attribute} +${b.bonus}`).join(", ")}`
    };
  }

  // 2. Allocate 10 Major/Minor points with smart prioritization
  const mmAllocations = allocateMajorMinorPoints(currentState, chosenAttrs, 10, targetBonusPerAttr);

  // 3. Calculate attribute bonuses and Misc training needed
  const attributeBonuses = [];
  const miscTraining = [];
  const miscIncreases = {};
  let totalTrainingCost = 0;

  for (const attr of chosenAttrs) {
    const curVal = attributes[attr] || 0;
    const targetBonus = targetBonusPerAttr[attr];

    if (attr === "Luck") {
      attributeBonuses.push({
        attribute: "Luck",
        bonus: 1,
        startValue: curVal,
        endValue: curVal + 1,
        multiplier: 1
      });
      continue;
    }

    // Count skill points already received from Major/Minor allocations
    let pointsFromMM = 0;
    for (const [s, pts] of Object.entries(mmAllocations)) {
      if (SKILL_GOV[s] === attr) {
        pointsFromMM += pts;
      }
    }

    // Target skill increases for targetBonus multiplier
    const targetIncreases = getSkillIncreasesForMultiplier(targetBonus);
    const neededMisc = Math.max(0, targetIncreases - pointsFromMM);
    let pointsFromMisc = 0;

    if (neededMisc > 0) {
      // Find candidate Misc skills governed by this attribute
      const candidateMisc = (misc.length ? misc : ALL_SKILLS.filter((s) => !majorMinorSkills.includes(s)))
        .filter((s) => SKILL_GOV[s] === attr && (skills[s] || 0) + (miscIncreases[s] || 0) < 100)
        .sort((a, b) => ((skills[a] || 0) + (miscIncreases[a] || 0)) - ((skills[b] || 0) + (miscIncreases[b] || 0))); // lowest skill first (cheapest training!)

      let remainingToTrain = neededMisc;
      for (const miscSkill of candidateMisc) {
        if (remainingToTrain <= 0) break;
        const curSkillVal = (skills[miscSkill] || 0) + (miscIncreases[miscSkill] || 0);
        const availableHeadroom = 100 - curSkillVal;
        const trainPts = Math.min(remainingToTrain, availableHeadroom);

        if (trainPts > 0) {
          const cost = calculateTrainingCost(curSkillVal, trainPts);
          totalTrainingCost += cost;

          miscTraining.push({
            skill: miscSkill,
            points: trainPts,
            startValue: curSkillVal,
            endValue: curSkillVal + trainPts,
            cost,
            attribute: attr
          });

          miscIncreases[miscSkill] = (miscIncreases[miscSkill] || 0) + trainPts;
          pointsFromMisc += trainPts;
          remainingToTrain -= trainPts;
        }
      }
    }

    const totalIncreases = pointsFromMM + pointsFromMisc;
    const earnedMult = getAttributeMultiplier(totalIncreases);
    const actualBonus = Math.min(targetBonus, earnedMult);

    attributeBonuses.push({
      attribute: attr,
      bonus: actualBonus,
      startValue: curVal,
      endValue: curVal + actualBonus,
      multiplier: earnedMult
    });
  }

  // Calculate new Endurance & Health Gain
  const endurancePick = attributeBonuses.find((b) => b.attribute === "Endurance");
  const newEndurance = endurancePick ? endurancePick.endValue : attributes.Endurance;
  const healthGain = calculateHealthGain(newEndurance);

  // Generate readable itinerary summary
  const miscSummary =
    miscTraining.length > 0
      ? miscTraining.map((m) => `${m.skill} +${m.points} (${m.attribute} ${m.points >= 10 ? "5x" : "bonus"})`).join(", ")
      : "None required";
  const mmSummary = Object.entries(mmAllocations)
    .map(([s, pts]) => `${s} +${pts}`)
    .join(", ");
  const summary = `Train Misc: ${miscSummary} | Major/Minor: ${mmSummary}`;

  return {
    level: currentState.level,
    nextLevel: currentState.level + 1,
    mode: PROGRESSION_MODES.STATS_AND_SKILLS,
    attributeBonuses,
    majorMinorIncreases: mmAllocations,
    miscTraining,
    miscIncreases,
    totalTrainingCost,
    healthGain,
    newEndurance,
    newHealth: (currentState.health || 0) + healthGain,
    summary
  };
}

/**
 * Heuristic helper: Distributes 10 Major/Minor skill increases.
 * Prioritizes attributes that lack Misc skill headroom, ensuring attributes
 * that cannot be trained through Misc skills receive Major/Minor allocations.
 */
function allocateMajorMinorPoints(currentState, chosenAttrs, totalPointsNeeded = 10, targetBonusPerAttr = {}) {
  const { skills, maj = [], min = [], misc = [] } = currentState;
  const majorMinorSkills = [...maj, ...min];
  const usedMajorMinor = new Set(majorMinorSkills);
  const miscSkillsList = misc.length ? misc : ALL_SKILLS.filter((s) => !usedMajorMinor.has(s));
  const allocations = {};
  let remaining = totalPointsNeeded;

  // Calculate available Misc headroom for each chosen non-Luck attribute
  const nonLuckAttrs = chosenAttrs.filter((a) => a !== "Luck");
  const attrMiscHeadroom = {};
  for (const attr of nonLuckAttrs) {
    const attrMisc = miscSkillsList.filter((s) => SKILL_GOV[s] === attr && (skills[s] || 0) < 100);
    attrMiscHeadroom[attr] = attrMisc.reduce((sum, s) => sum + (100 - (skills[s] || 0)), 0);
  }

  // Sort chosen attributes: least Misc headroom first (so attributes with 0 or few Misc skills get MM points first!)
  const sortedAttrs = [...nonLuckAttrs].sort((a, b) => (attrMiscHeadroom[a] ?? 0) - (attrMiscHeadroom[b] ?? 0));

  // 1. Allocate to Major/Minor skills for sorted chosen attributes up to needed increases
  for (const attr of sortedAttrs) {
    if (remaining <= 0) break;
    const targetBonus = targetBonusPerAttr[attr] || 5;
    const neededIncreases = getSkillIncreasesForMultiplier(targetBonus);
    let attrAllocated = 0;

    const matching = majorMinorSkills.filter((s) => SKILL_GOV[s] === attr && (skills[s] || 0) < 100);
    for (const skill of matching) {
      if (remaining <= 0 || attrAllocated >= neededIncreases) break;
      const cur = (skills[skill] || 0) + (allocations[skill] || 0);
      const headroom = 100 - cur;
      const maxPts = Math.min(remaining, headroom, neededIncreases - attrAllocated);
      if (maxPts > 0) {
        allocations[skill] = (allocations[skill] || 0) + maxPts;
        remaining -= maxPts;
        attrAllocated += maxPts;
      }
    }
  }

  // 2. If points still needed, allocate to any available Major/Minor skills (preferring highest headroom)
  if (remaining > 0) {
    const available = majorMinorSkills
      .filter((s) => (skills[s] || 0) + (allocations[s] || 0) < 100)
      .sort((a, b) => {
        const headA = 100 - ((skills[a] || 0) + (allocations[a] || 0));
        const headB = 100 - ((skills[b] || 0) + (allocations[b] || 0));
        return headB - headA;
      });

    for (const skill of available) {
      if (remaining <= 0) break;
      const cur = (skills[skill] || 0) + (allocations[skill] || 0);
      const pts = Math.min(remaining, 100 - cur);
      if (pts > 0) {
        allocations[skill] = (allocations[skill] || 0) + pts;
        remaining -= pts;
      }
    }
  }

  return allocations;
}

/**
 * Simulates a full character progression from initial level up to targetLevel (or level cap).
 * Generates level-by-level training cards with 5x multipliers.
 *
 * @param {Object} character Initial character build or sheet
 * @param {Object} [options] Simulation options:
 *   - targetLevel: number (defaults to levelCap)
 *   - archetype: archetype id ('warrior', 'stealth', 'mage', 'battlemage', 'nightblade', 'diplomat')
 *   - priority: custom array of prioritized attributes
 *   - strategy: 'auto' | 'rush_endurance' | 'triple_5' | 'efficient_luck'
 *   - mode: 'stats_only' | 'stats_and_skills'
 *   - statsOnly: boolean
 *   - catalogs: character catalogs for build resolution
 * @returns {Object} Progression dossier { initialSheet, steps, finalState, levelCap, archetype, priority, mode, totalTrainingCost }
 */
export function simulateProgression(character, options = {}) {
  const initialSheet = normalizeCharacterState(character, options.catalogs);
  const detected = detectArchetype(initialSheet);
  const chosenArchetype = options.archetype && ARCHETYPES[options.archetype]
    ? ARCHETYPES[options.archetype]
    : detected;

  const priority = resolveAttributePriority(options.priority, chosenArchetype.priority);
  const isStatsOnly =
    options.mode === PROGRESSION_MODES.STATS_ONLY ||
    Boolean(options.statsOnly);

  const levelCap = isStatsOnly ? (options.targetLevel || 100) : initialSheet.levelCap;
  const targetLevel = options.targetLevel ? (isStatsOnly ? options.targetLevel : Math.min(options.targetLevel, levelCap)) : levelCap;

  let state = { ...initialSheet };
  const steps = [];
  let totalTrainingCost = 0;

  while (state.level < targetLevel) {
    const step = optimizeLevelStep(state, {
      priority,
      strategy: options.strategy || "auto",
      mode: isStatsOnly ? PROGRESSION_MODES.STATS_ONLY : PROGRESSION_MODES.STATS_AND_SKILLS,
      statsOnly: isStatsOnly
    });

    if (!step) break; // Reached theoretical limit

    state = applyLevelStep(state, {
      attributeBonuses: step.attributeBonuses,
      majorMinorIncreases: step.majorMinorIncreases,
      miscIncreases: step.miscIncreases || {}
    });

    totalTrainingCost += step.totalTrainingCost;
    steps.push({
      ...step,
      stateAfter: {
        attributes: { ...state.attributes },
        skills: { ...state.skills },
        health: state.health,
        magicka: state.magicka,
        fatigue: state.fatigue
      }
    });
  }

  return {
    initialSheet,
    steps,
    finalState: state,
    levelCap,
    archetype: chosenArchetype,
    priority,
    mode: isStatsOnly ? PROGRESSION_MODES.STATS_ONLY : PROGRESSION_MODES.STATS_AND_SKILLS,
    totalTrainingCost
  };
}

/**
 * Calculates health growth curves comparing the optimized progression (rushing Endurance)
 * against a delayed Endurance path.
 *
 * @param {Object} character Initial character
 * @param {number} [targetLevel] Target level for curve comparison
 * @param {Object} [catalogs] Catalogs object
 * @returns {Object} { levels, optimalHealth, delayedHealth, difference, maxDifference }
 */
export function calculateHealthGrowthCurve(character, targetLevel, catalogs) {
  const base = normalizeCharacterState(character, catalogs);
  const cap = base.levelCap;
  const maxLvl = targetLevel ? Math.min(targetLevel, cap) : Math.min(cap, 50);
  const startLevel = base.level || 1;

  // 1. Simulate optimal progression (rushes Endurance)
  const optimal = simulateProgression(base, { targetLevel: maxLvl, strategy: "auto" });

  // 2. Simulate delayed progression (Endurance remains base or only +1 per level)
  const delayedLevels = [startLevel];
  const delayedHealth = [base.health];
  let curEnd = base.attributes.Endurance;
  let curHp = base.health;

  for (let lvl = startLevel; lvl < maxLvl; lvl++) {
    // Delayed path: receives only +1 Endurance every other level or flat Endurance
    if (lvl > 20 && curEnd < 100) {
      curEnd = Math.min(100, curEnd + 2);
    }
    const gain = calculateHealthGain(curEnd);
    curHp += gain;
    delayedLevels.push(lvl + 1);
    delayedHealth.push(curHp);
  }

  const levels = [startLevel];
  const optimalHealth = [base.health];
  optimal.steps.forEach((s) => {
    levels.push(s.nextLevel);
    optimalHealth.push(s.newHealth);
  });

  // Ensure matching lengths
  const len = Math.min(levels.length, delayedLevels.length);
  const diff = [];
  for (let i = 0; i < len; i++) {
    diff.push(optimalHealth[i] - delayedHealth[i]);
  }

  return {
    levels: levels.slice(0, len),
    optimalHealth: optimalHealth.slice(0, len),
    delayedHealth: delayedHealth.slice(0, len),
    difference: diff,
    maxDifference: diff[diff.length - 1] || 0
  };
}

/**
 * Generates the 8-attribute progression matrix for "Stats Only" or "Stats & Skills" mode.
 * Each entry includes abbreviation, starting value, points gained across progression, and current/final value.
 *
 * @param {Object} progressionResult Result from simulateProgression
 * @param {number} [stepIndex] Optional step index (-1 or undefined for final state)
 * @returns {Array<Object>} 8 attribute rows
 */
export function getAttributeProgressionMatrix(progressionResult, stepIndex) {
  if (!progressionResult || !progressionResult.initialSheet) return [];

  const { initialSheet, steps = [], finalState } = progressionResult;
  const targetState =
    stepIndex !== undefined && stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex].stateAfter
      : finalState;

  return ATTRS.map((attr) => {
    const startVal = initialSheet.attributes[attr] || 0;
    const curVal = targetState.attributes[attr] || 0;
    return {
      attribute: attr,
      abbreviation: ATTR_ABBR[attr] || attr.slice(0, 3).toUpperCase(),
      startingValue: startVal,
      pointsGained: curVal - startVal,
      currentValue: curVal,
      capped: curVal >= 100
    };
  });
}

/**
 * Generates the full 27-skill progression matrix for "Stats & Skills" mode.
 * Each entry includes starting rating, points gained across progression, and final rating.
 *
 * @param {Object} progressionResult Result from simulateProgression
 * @param {number} [stepIndex] Optional step index (-1 or undefined for final state)
 * @returns {Array<Object>} 27 skill rows
 */
export function getSkillProgressionMatrix(progressionResult, stepIndex) {
  if (!progressionResult || !progressionResult.initialSheet) return [];

  const { initialSheet, steps = [], finalState } = progressionResult;
  const majorSet = new Set(initialSheet.maj || []);
  const minorSet = new Set(initialSheet.min || []);

  const targetState =
    stepIndex !== undefined && stepIndex >= 0 && stepIndex < steps.length
      ? steps[stepIndex].stateAfter
      : finalState;

  return ALL_SKILLS.map((skill) => {
    const tier = majorSet.has(skill) ? "Major" : minorSet.has(skill) ? "Minor" : "Misc";
    const startVal = initialSheet.skills[skill] || 0;
    const curVal = targetState.skills[skill] || 0;
    return {
      skill,
      tier,
      specialization: SKILL_SPEC[skill] || "Combat",
      governingAttribute: SKILL_GOV[skill] || "Strength",
      startingValue: startVal,
      pointsGained: curVal - startVal,
      currentValue: curVal,
      capped: curVal >= 100
    };
  });
}

/**
 * Extracts a character sheet representation from a leveled progression result,
 * suitable for bridging back to CharacterContext / Character Builder.
 *
 * @param {Object} progressionResult Result from simulateProgression
 * @param {number} [atLevel] Target level to extract (defaults to final level)
 * @returns {Object} Leveled character sheet
 */
export function extractCharacterSheet(progressionResult, atLevel) {
  if (!progressionResult) return null;

  const { initialSheet, steps = [], finalState } = progressionResult;
  let targetState = finalState;

  if (atLevel !== undefined && atLevel !== null) {
    const lvl = Number(atLevel);
    if (lvl <= initialSheet.level) {
      targetState = initialSheet;
    } else if (lvl < finalState.level) {
      const step = steps.find((s) => s.nextLevel === lvl);
      if (step) targetState = step.stateAfter;
    }
  }

  const attrs = {};
  ATTRS.forEach((a) => {
    attrs[a] = {
      v: targetState.attributes[a],
      parts: [`${targetState.attributes[a]} (leveled)`]
    };
  });

  const skills = {};
  ALL_SKILLS.forEach((s) => {
    skills[s] = {
      v: targetState.skills[s],
      parts: [`${targetState.skills[s]} (leveled)`]
    };
  });

  return {
    level: targetState.level,
    attrs,
    skills,
    health: targetState.health,
    magicka: targetState.magicka,
    fatigue: targetState.fatigue,
    race: initialSheet.race,
    gender: initialSheet.gender,
    sign: initialSheet.sign,
    spec: initialSheet.spec,
    fav1: initialSheet.fav1,
    fav2: initialSheet.fav2,
    maj: initialSheet.maj,
    min: initialSheet.min,
    className: initialSheet.className
  };
}
