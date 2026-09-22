/**
 * Pure ESM challenge run generation engine for Silt Strider.
 * Coordinates individual card aspect rolling, deterministic seed-based full generation,
 * rule conflict resolution, and character sheet integration.
 */

import {
  POOL,
  MAJORS,
  TR_MAJORS,
  GRIND_MAJORS,
  OBJECTIVES,
  DIFFICULTY_PRESETS,
  createRng,
  generateSeed,
  pickCompatibleRestrictions,
  pickMixedObjectives,
  tagsOf,
  restrictionOkForNeeds,
  band,
  shuffle,
  restrictionsClash,
  objectivesClash
} from './challenge-math.mjs';

export { POOL, MAJORS, TR_MAJORS, OBJECTIVES };

import { ATTRS, SPECIALIZATIONS, computeSheet } from './character-math.mjs';

const ALL_SKILLS = Object.freeze([
  "Block", "Armorer", "Medium Armor", "Heavy Armor", "Blunt Weapon",
  "Long Blade", "Axe", "Spear", "Athletics", "Enchant",
  "Destruction", "Alteration", "Illusion", "Conjuration", "Mysticism",
  "Restoration", "Alchemy", "Unarmored", "Security", "Sneak",
  "Acrobatics", "Light Armor", "Short Blade", "Marksman", "Mercantile",
  "Speechcraft", "Hand-to-hand"
]);

export const DEFAULT_RACES = Object.freeze([
  "Dark Elf", "Nord", "Redguard", "Breton", "Wood Elf",
  "High Elf", "Imperial", "Orc", "Argonian", "Khajiit"
]);

export const DEFAULT_CLASSES = Object.freeze([
  "Acrobat", "Agent", "Archer", "Assassin", "Barbarian", "Bard",
  "Battlemage", "Crusader", "Healer", "Knight", "Mage", "Monk",
  "Nightblade", "Pilgrim", "Rogue", "Scout", "Sorcerer", "Spellsword",
  "Thief", "Warrior", "Witchhunter"
]);

export const DEFAULT_SIGNS = Object.freeze([
  "The Apprentice", "The Atronach", "The Lady", "The Lord",
  "The Lover", "The Mage", "The Ritual", "The Serpent",
  "The Shadow", "The Steed", "The Thief", "The Tower", "The Warrior"
]);

export function createEmptyRun(seed = "") {
  return {
    race: "",
    gender: "",
    cls: "",
    sign: "",
    spec: "Combat",
    fav1: "Strength",
    fav2: "Endurance",
    maj: [],
    min: [],
    major: "",
    minors: [],
    rests: [],
    restNote: "",
    vitals: null,
    seed: seed || ""
  };
}

/**
 * Returns eligible major objectives based on active world profile. With `allowedBands`,
 * grind majors (Reach level 50) are left out unless Grind is ticked.
 */
export function getActiveMajors(world = "vanilla", allowedBands = null) {
  const majors = world === "tr" ? MAJORS.concat(TR_MAJORS) : MAJORS;
  if (!allowedBands || allowedBands.Grind) return majors;
  return majors.filter((m) => !GRIND_MAJORS.includes(m));
}

/**
 * Returns eligible restriction pool based on active world profile.
 */
export function getActivePool(world = "vanilla", allowedBands = null) {
  let pool = POOL;
  if (world === "tr") {
    pool = pool.filter((x) => x !== "No Tribunal or Bloodmoon DLC");
  }
  if (allowedBands) {
    pool = pool.filter((x) => allowedBands[band(x)]);
  }
  return pool;
}

/**
 * Rolls an individual card aspect for a challenge run.
 *
 * @param {string} aspectKey - 'race' | 'gender' | 'cls' | 'sign' | 'maj' | 'min' | 'major' | 'rest' | 'obj'
 * @param {Object} currentRun - Current run state
 * @param {Object} [options]
 * @param {Object} [options.catalogs]
 * @param {string} [options.world='vanilla']
 * @param {Function} [options.rng=Math.random]
 * @param {Object} [options.allowedBands]
 * @param {number} [options.restrictionCount=3]
 * @param {number} [options.objectiveCount=2]
 * @returns {Object} Updated challenge run
 */
export function rollCardAspect(aspectKey, currentRun, options = {}) {
  const run = { ...currentRun };
  const {
    catalogs = null,
    world = "vanilla",
    rng = Math.random,
    allowedBands = { Easy: true, Medium: true, Hard: false, Grind: false },
    restrictionCount = 3,
    objectiveCount = 2
  } = options;

  const racePool = catalogs?.races
    ? Object.keys(catalogs.races).filter((n) => n !== "Hill Giant")
    : DEFAULT_RACES;

  const classPool = catalogs?.classes
    ? ["Custom", ...Object.keys(catalogs.classes)]
    : ["Custom", ...DEFAULT_CLASSES];

  const signPool = catalogs?.signs
    ? Object.keys(catalogs.signs)
    : DEFAULT_SIGNS;

  const majorsList = getActiveMajors(world, allowedBands);
  const activePool = getActivePool(world, allowedBands);

  switch (aspectKey) {
    case "race": {
      run.race = racePool[Math.floor(rng() * racePool.length)] || "Dark Elf";
      break;
    }
    case "gender": {
      run.gender = rng() < 0.5 ? "Male" : "Female";
      break;
    }
    case "sign": {
      run.sign = signPool[Math.floor(rng() * signPool.length)] || "The Lady";
      break;
    }
    case "cls": {
      const rolledClass = classPool[Math.floor(rng() * classPool.length)] || "Warrior";
      run.cls = rolledClass;
      if (rolledClass === "Custom") {
        run.spec = SPECIALIZATIONS[Math.floor(rng() * SPECIALIZATIONS.length)];
        const favAttrs = shuffle([...ATTRS], rng);
        run.fav1 = favAttrs[0];
        run.fav2 = favAttrs[1];
        const pickedSkills = shuffle([...ALL_SKILLS], rng);
        run.maj = pickedSkills.slice(0, 5);
        run.min = pickedSkills.slice(5, 10);
      } else if (catalogs?.classes?.[rolledClass]) {
        const c = catalogs.classes[rolledClass];
        run.spec = c.spec;
        run.fav1 = c.fav[0];
        run.fav2 = c.fav[1];
        run.maj = [...c.maj];
        run.min = [...c.min];
      }
      break;
    }
    case "maj":
    case "min": {
      run.cls = "Custom";
      if (!run.spec) run.spec = SPECIALIZATIONS[Math.floor(rng() * SPECIALIZATIONS.length)];
      if (!run.fav1 || !run.fav2) {
        const favAttrs = shuffle([...ATTRS], rng);
        run.fav1 = favAttrs[0];
        run.fav2 = favAttrs[1];
      }
      const otherGroup = aspectKey === "maj" ? (run.min || []) : (run.maj || []);
      const availableSkills = ALL_SKILLS.filter((s) => !otherGroup.includes(s));
      const newlyPicked = shuffle(availableSkills, rng).slice(0, 5);
      if (aspectKey === "maj") {
        run.maj = newlyPicked;
      } else {
        run.min = newlyPicked;
      }
      break;
    }
    case "major": {
      const eligible = majorsList.filter((m) => {
        if (!run.rests || !run.rests.length) return true;
        return run.rests.every((r) => restrictionOkForNeeds(r, tagsOf(m)));
      });
      const candidates = eligible.length ? eligible : majorsList;
      run.major = candidates[Math.floor(rng() * candidates.length)] || majorsList[0];
      break;
    }
    case "rest": {
      const needs = tagsOf(run.major || "");
      run.rests = pickCompatibleRestrictions(restrictionCount, activePool, needs, rng);
      break;
    }
    case "obj": {
      run.minors = pickMixedObjectives(objectiveCount, run.rests || [], rng);
      break;
    }
    default:
      break;
  }

  // Recalculate live vitals if identity is defined
  if (run.race && run.cls && run.sign && catalogs) {
    try {
      const computed = computeSheet(
        {
          race: run.race,
          gender: run.gender || "Male",
          sign: run.sign,
          className: run.cls,
          spec: run.spec || "Combat",
          fav1: run.fav1 || "Strength",
          fav2: run.fav2 || "Endurance",
          maj: run.maj || [],
          min: run.min || []
        },
        catalogs
      );
      if (computed) {
        run.vitals = {
          health: computed.health,
          magicka: computed.magicka,
          fatigue: computed.fatigue
        };
      }
    } catch {
      run.vitals = { health: 50, magicka: 40, fatigue: 180 };
    }
  }

  return run;
}

// A seed names everything a run is rolled from: a random code, the world, the ticked
// difficulty bands and the two counts, e.g. "K7Q2M-TR-EM-R3O2". Loaded anywhere, under
// any settings, it rolls the same run.
const SEED_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const BAND_LETTERS = Object.freeze({ Easy: "E", Medium: "M", Hard: "H", Grind: "G" });
const PROFILE_CODES = Object.freeze({ vanilla: "VANILLA", tr: "TR", tr_arce: "TRARCE" });

export function newSeedCode(random = Math.random, length = 5) {
  let code = "";
  for (let i = 0; i < length; i++) code += SEED_ALPHABET[Math.floor(random() * SEED_ALPHABET.length)];
  return code;
}

export function formatRunSeed({ code, profile = "vanilla", allowedBands = {}, restrictionCount, objectiveCount }) {
  const bands = Object.keys(BAND_LETTERS).filter((b) => allowedBands[b]).map((b) => BAND_LETTERS[b]).join("") || "N";
  const clamp = (n) => Math.min(5, Math.max(1, Math.round(Number(n)) || 1));
  return `${code}-${PROFILE_CODES[profile] || PROFILE_CODES.vanilla}-${bands}-R${clamp(restrictionCount)}O${clamp(objectiveCount)}`;
}

/**
 * { code, profile, settings } from a seed, or null. Seeds from before settings were
 * part of them ("SEED-4821-VANILLA") parse with settings null: the current ones apply.
 */
export function parseRunSeed(text) {
  const s = String(text || "").trim().toUpperCase().replace(/\s+/g, "");
  const profileOf = (code) => (code === "TRARCE" || code === "TR_ARCE" ? "tr_arce" : code === "TR" ? "tr" : "vanilla");
  let m = s.match(/^([0-9A-Z]{3,8})-(VANILLA|TR|TRARCE)-([EMHG]{1,4}|N)-R([1-5])O([1-5])$/);
  if (m) {
    const allowedBands = Object.fromEntries(Object.entries(BAND_LETTERS).map(([band, letter]) => [band, m[3].includes(letter)]));
    return {
      code: m[1],
      profile: profileOf(m[2]),
      settings: { allowedBands, restrictionCount: Number(m[4]), objectiveCount: Number(m[5]) }
    };
  }
  m = s.match(/^(?:SEED-)?([0-9A-Z]{3,8})-(VANILLA|TR|TRARCE|TR_ARCE)$/);
  return m ? { code: m[1], profile: profileOf(m[2]), settings: null } : null;
}

/**
 * Rolls a whole run from a seed. Unlocked cards come only from the seed, so the same
 * seed rolls the same run whatever came before; locked cards are copied from `current`.
 * `fallback` settings apply only to a seed that does not carry its own.
 */
export function generateSeededRun(seed, { catalogs = null, world = "vanilla", current = null, locks = {}, fallback = {} } = {}) {
  const parsed = parseRunSeed(seed);
  const settings = parsed?.settings || {
    allowedBands: fallback.allowedBands || { Easy: true, Medium: true, Hard: false, Grind: false },
    restrictionCount: Math.min(5, Math.max(1, Number(fallback.restrictionCount) || 3)),
    objectiveCount: Math.min(5, Math.max(1, Number(fallback.objectiveCount) || 2))
  };
  const base = createEmptyRun(seed);
  const kept = current || {};
  if (locks.race && kept.race) base.race = kept.race;
  if (locks.cls && kept.cls) Object.assign(base, { cls: kept.cls, spec: kept.spec, fav1: kept.fav1, fav2: kept.fav2, maj: [...(kept.maj || [])], min: [...(kept.min || [])] });
  if (locks.sign && kept.sign) base.sign = kept.sign;
  if (locks.major && kept.major) base.major = kept.major;
  if (locks.rest && kept.rests?.length) base.rests = [...kept.rests];
  if (locks.obj && kept.minors?.length) base.minors = [...kept.minors];

  const run = randomizeFullRun(base, { ...locks, maj: locks.cls, min: locks.cls }, {
    world,
    seed,
    catalogs,
    allowedBands: settings.allowedBands,
    restrictionCount: settings.restrictionCount,
    objectiveCount: settings.objectiveCount
  });
  run.restNote = run.rests.length ? "" : "Turn on more difficulty bands to roll active restrictions.";
  run.seedExact = !Object.values(locks).some(Boolean);
  return { run, settings, profile: parsed?.profile || null };
}

/**
 * Randomizes an entire challenge run, honoring locks.
 */
export function randomizeFullRun(currentRun, locks = {}, options = {}) {
  const {
    world = "vanilla",
    seed = null,
    catalogs = null
  } = options;

  const activeSeed = seed || generateSeed("SEED", world.toUpperCase());
  const rng = createRng(activeSeed);

  let run = currentRun ? { ...currentRun } : createEmptyRun(activeSeed);
  run.seed = activeSeed;

  const subOptions = { ...options, rng, world, catalogs };

  // 1. Identity cards
  if (!locks.race || !run.race) run = rollCardAspect("race", run, subOptions);
  if (!locks.gender || !run.gender) run = rollCardAspect("gender", run, subOptions);
  if (!locks.cls || !run.cls) run = rollCardAspect("cls", run, subOptions);
  if (!locks.sign || !run.sign) run = rollCardAspect("sign", run, subOptions);

  // 2. Custom skills if applicable
  if (run.cls === "Custom") {
    if (!locks.maj || !run.maj?.length) run = rollCardAspect("maj", run, subOptions);
    if (!locks.min || !run.min?.length) run = rollCardAspect("min", run, subOptions);
  }

  // 3. Objectives & Restrictions in dependency order:
  // Major first, then restrictions avoiding major's needs, then minor objectives avoiding restrictions' bans
  if (!locks.major || !run.major) run = rollCardAspect("major", run, subOptions);
  if (!locks.rest || !run.rests?.length) run = rollCardAspect("rest", run, subOptions);
  if (!locks.obj || !run.minors?.length) run = rollCardAspect("obj", run, subOptions);

  return run;
}
