/**
 * Numbers and lists for the home page. Everything shown there comes from the
 * same data and math the tools use; nothing here is written by hand.
 */
import {
  ATTRS, ATTR_ABBR, PROGRESSION_MODES, calculateHealthGrowthCurve, detectArchetype, normalizeCharacterState, simulateProgression
} from "./level-math.mjs";
import { buildNetworkGraph, findFewestHopsRoute } from "./travel-graph.mjs";
import { calculatePotion } from "./alchemy-math.mjs";

export const WORLD_PROFILES = Object.freeze([
  {
    id: "vanilla", title: "Vanilla", content: "Morrowind · Tribunal · Bloodmoon",
    description: "The original game and both expansions: Vvardenfell and Solstheim, read from the official ESM files."
  },
  {
    id: "tr", title: "Tamriel Rebuilt", content: "Tamriel_Data · TR_Mainland 26.08",
    description: "The community’s mainland expansion: new towns, gear, ingredients, trainers and river strider routes."
  },
  {
    id: "tr_arce", title: "TR + ARCE", content: "Tamriel Rebuilt with ARCE",
    description: "Adds ARCE’s extra playable races and classes on top of Tamriel Rebuilt."
  }
]);

export const worldLabel = profile => WORLD_PROFILES.find(w => w.id === profile)?.title || "Vanilla";

export const HOME_TOOLS = Object.freeze([
  { view: "builder", title: "Build Optimizer", group: "Planners", description: "Pick a race, class and birthsign and watch the character sheet update. Then find the best gear you can actually get." },
  { view: "leveler", title: "Level Simulator", group: "Planners", badge: "Popular", description: "Which skills to train for ×5 level-ups, and how your Health grows." },
  { view: "alchemy", title: "Alchemy", group: "Calculators", description: "Four ingredients, your apparatus and the potion you get." },
  { view: "travel", title: "Travel Optimizer", group: "Calculators", description: "Fewest hops between towns by silt strider, boat and Guild Guide." },
  { view: "enchanting", title: "Enchanting", group: "Calculators", description: "Soul gems, enchantment cost and your chance to succeed." },
  { view: "spellmaking", title: "Spellmaking", group: "Calculators", description: "Magicka cost, cast chance and price of a custom spell." },
  { view: "factions", title: "Faction Journal", group: "Planners", badge: "New", description: "Ranks, promotion requirements and who likes whom." },
  { view: "challenge", title: "Challenge Runs", group: "Extras", description: "Roll a goal and rules to live by. Lock what you like, reroll the rest." },
  { view: "vault", title: "Cloud Vault", group: "Extras", description: "Keep characters in the cloud, across devices." }
]);

const value = entry => (entry && typeof entry === "object" ? Number(entry.v ?? entry.value ?? 0) : Number(entry) || 0);

/**
 * What the character card shows. build: the character context's build;
 * sheet: its computed sheet (null until the catalogs load).
 */
export function characterSummary(build = {}, sheet = null) {
  const named = typeof build.name === "string" && build.name.trim();
  const name = named ? build.name.trim() : `${build.race || "Dark Elf"} ${build.className || "Custom"}`;
  const favoured = new Set([build.fav1, build.fav2].filter(Boolean));
  return {
    name,
    initial: name.charAt(0).toUpperCase(),
    level: Math.max(1, Math.floor(Number(sheet?.level) || 1)),
    line: [`${build.gender || "Male"} ${build.race || "Dark Elf"}`, build.className || "Custom", build.sign || "The Lady"].join(" · "),
    ready: Boolean(sheet),
    vitals: sheet ? [
      { kind: "health", label: "Health", value: value(sheet.health) },
      { kind: "magicka", label: "Magicka", value: value(sheet.magicka) },
      { kind: "fatigue", label: "Fatigue", value: value(sheet.fatigue) }
    ] : [],
    attributes: sheet ? ATTRS.map(a => ({ name: a, abbr: ATTR_ABBR[a] || a.slice(0, 3).toUpperCase(), value: value((sheet.attrs || sheet.attributes)?.[a]), favoured: favoured.has(a) })) : [],
    majors: sheet ? (build.maj || []).map(skill => ({ name: skill, value: value(sheet.skills?.[skill]) })) : []
  };
}

function baseState(character, catalogs, options) {
  try {
    return normalizeCharacterState(character, catalogs, options);
  } catch {
    return null;
  }
}

/** The Level Simulator's first suggested level-up (its defaults: detected archetype, stats only). */
export function nextLevelUp(character, catalogs, options = {}) {
  const base = baseState(character, catalogs, options);
  if (!base) return null;
  const archetype = detectArchetype(base);
  // The unnormalized character: a second normalization with catalogs would rebuild a
  // loaded save's stats from its race and class at level 1.
  const run = simulateProgression(character, {
    targetLevel: (base.level || 1) + 1, archetype: archetype.id, priority: archetype.priority,
    strategy: "auto", mode: PROGRESSION_MODES.STATS_ONLY, catalogs
  });
  const step = run.steps[0];
  if (!step) return null;
  return {
    level: step.level,
    nextLevel: step.nextLevel,
    bonuses: step.attributeBonuses.map(b => ({ attribute: b.attribute, multiplier: b.multiplier })),
    healthFrom: base.health,
    healthTo: step.newHealth
  };
}

/** How much more Health rushing Endurance gives by `level` (capped at the character's level cap). */
export function healthGap(character, catalogs, options = {}, level = 30) {
  const base = baseState(character, catalogs, options);
  if (!base) return null;
  const curve = calculateHealthGrowthCurve(base, level, catalogs, options);
  if (!curve?.levels?.length) return null;
  return {
    level: curve.levels[curve.levels.length - 1],
    gain: curve.maxDifference,
    levels: curve.levels,
    optimal: curve.optimalHealth,
    delayed: curve.delayedHealth
  };
}

export function stopCount(world = "vanilla", graph = null) {
  return Object.keys(buildNetworkGraph(world, graph)).length;
}

/**
 * The fewest-hops route from `origin` to the stop farthest from it (ties go
 * alphabetically), to show off a multi-leg trip.
 */
export function exampleRoute(world = "vanilla", graph = null, origin = "Seyda Neen") {
  const network = buildNetworkGraph(world, graph);
  const stops = Object.keys(network).sort();
  if (!stops.length) return null;
  const from = network[origin] ? origin : stops[0];
  const hops = new Map([[from, 0]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const edge of network[cur] || []) {
      if (hops.has(edge.to)) continue;
      hops.set(edge.to, hops.get(cur) + 1);
      queue.push(edge.to);
    }
  }
  let to = null;
  for (const stop of stops) if (stop !== from && hops.has(stop) && (!to || hops.get(stop) > hops.get(to))) to = stop;
  if (!to) return null;
  const route = findFewestHopsRoute(from, to, world, graph);
  return route.isValid ? { from, to, hops: route.hops, path: route.path, steps: route.steps } : null;
}

/**
 * The Alchemy card: this character's chance to brew, by the Alchemy tool's own
 * formula, and how many ingredients the current world has (null until they load).
 */
export function alchemyPreview(sheet, ingredientCount = null) {
  const attributes = sheet?.attrs || sheet?.attributes || {};
  const skill = value(sheet?.skills?.Alchemy);
  const intelligence = value(attributes.Intelligence);
  const luck = value(attributes.Luck);
  const { brewChance } = calculatePotion({ ingredients: [], alchemySkill: skill, intelligence, luck });
  return { chance: brewChance, skill, intelligence, luck, ingredients: ingredientCount };
}
