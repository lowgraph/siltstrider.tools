/**
 * Loads the search index for a game-data profile, one part at a time, so the
 * palette can show places and factions while items are still downloading.
 * Catalogs come from the bundle loader, which shares its cache with the tools.
 */
import { adaptTravelGraph } from "./travel-graph.mjs";
import {
  factionEntries, ingredientEntries, itemEntries, pageEntries, searchContext, spellEntries, stopEntries
} from "./site-search.mjs";

export const SEARCH_PARTS = Object.freeze(["travel", "factions", "ingredients", "spells", "items"]);
const PAGES = pageEntries();

/**
 * loader: { loadCatalog(profile, name), loadCatalogMetadata(profile, name) }.
 * Returns { get(profile) } where each profile's state is
 * { ctx, parts: { travel: [...] }, failed: [part], pending, version, subscribe(fn) }.
 */
export function createSearchIndex(loader) {
  const profiles = new Map();

  function start(profile) {
    const listeners = new Set();
    const state = {
      profile, ctx: null, parts: {}, failed: [], pending: SEARCH_PARTS.length, version: 0,
      subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
    const emit = () => { state.version += 1; listeners.forEach(fn => fn()); };
    const catalog = name => loader.loadCatalog(profile, name);
    const base = Promise.all(["Attributes", "Skills", "EffectRules"].map(catalog))
      .then(([Attributes, Skills, EffectRules]) => { state.ctx = searchContext({ Attributes, Skills, EffectRules }); return state.ctx; });
    const part = (name, build) => base.then(build).then(
      entries => { state.parts[name] = entries; },
      error => { state.failed.push(name); console.warn(`Search: ${name} did not load`, error); }
    ).finally(() => { state.pending -= 1; emit(); });

    part("travel", async () => {
      const [records, metadata] = await Promise.all([catalog("Travel"), loader.loadCatalogMetadata(profile, "Travel")]);
      return stopEntries(adaptTravelGraph(records, metadata?.nodes || {}));
    });
    part("factions", async ctx => factionEntries(await catalog("Factions"), ctx));
    part("ingredients", async ctx => ingredientEntries(await catalog("Ingredients"), ctx));
    part("spells", async ctx => spellEntries(await catalog("Spells"), ctx));
    part("items", async ctx => {
      const names = ["Weapons", "Armor", "Clothing", "Potions", "Books", "Enchantments", "GameSettings"];
      const loaded = Object.fromEntries((await Promise.all(names.map(catalog))).map((records, i) => [names[i], records]));
      const extra = searchContext({ Enchantments: loaded.Enchantments, GameSettings: loaded.GameSettings });
      ctx.enchantments = extra.enchantments;
      ctx.gmst = extra.gmst;
      return itemEntries(loaded, ctx);
    });
    return state;
  }

  return {
    // A profile that finished with failures starts over on the next open.
    get(profile) {
      const state = profiles.get(profile);
      if (!state || (state.pending === 0 && state.failed.length)) profiles.set(profile, start(profile));
      return profiles.get(profile);
    }
  };
}

/** Every entry loaded so far for a profile state (pages first). */
export function indexEntries(state) {
  return state ? [...PAGES, ...SEARCH_PARTS.flatMap(part => state.parts[part] || [])] : PAGES;
}
