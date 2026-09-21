/**
 * Site search: turns pages and game catalogs into search entries, ranks them
 * against a query, and describes an entry for the preview card. Pure; the
 * palette component loads the catalogs and renders the results.
 */
import { describeEffect, effectName } from "./effect-text.mjs";

export const SEARCH_GROUPS = Object.freeze([
  { id: "tools", label: "Tools" },
  { id: "places", label: "Places" },
  { id: "factions", label: "Factions" },
  { id: "ingredients", label: "Ingredients" },
  { id: "spells", label: "Spells" },
  { id: "items", label: "Items" }
]);

export const SEARCH_PAGES = Object.freeze([
  { view: "home", title: "Home", description: "Every planner and tool on the site.", keywords: "start directory index" },
  { view: "builder", title: "Build Optimizer", description: "Race, class, birthsign and skills, then gear.", keywords: "character class race birthsign skills attributes gear planner" },
  { view: "challenge", title: "Challenge Runs", description: "Roll a character with a goal, side tasks and restrictions.", keywords: "random roll generator restrictions" },
  { view: "leveler", title: "Level Simulator", description: "Plan level-ups, 5x multipliers and Health growth.", keywords: "level leveling multiplier health endurance progression" },
  { view: "factions", title: "Faction Journal", description: "Ranks, promotion requirements and quests for each faction.", keywords: "guild house rank promotion quests reputation" },
  { view: "enchanting", title: "Enchanting", description: "Enchantment cost, soul gems and success chance.", keywords: "enchant soul gem charge constant effect" },
  { view: "spellmaking", title: "Spellmaking", description: "Custom spell cost, cast chance and price.", keywords: "spell maker magicka cast chance" },
  { view: "alchemy", title: "Alchemy", description: "Mix ingredients and see the potion you get.", keywords: "potion brew ingredients apparatus mortar" },
  { view: "travel", title: "Travel Optimizer", description: "Fewest hops between towns, with a transit map.", keywords: "route silt strider boat guild guide transport map" },
  { view: "vault", title: "Cloud Vault", description: "Saved characters and OpenMW save import.", keywords: "save saves omwsave import cloud storage characters account" },
  { view: "about", title: "About", description: "About this unofficial fan project.", keywords: "info credits" },
  { view: "changelog", title: "Changelog", description: "What changed on the site, newest first.", keywords: "updates news release notes history" }
]);

// ---- Text ------------------------------------------------------------------

/**
 * Lowercase, strip accents, drop apostrophes ("Azura's" -> "azuras") and turn
 * any other punctuation into single spaces. `map[i]` is the index in the
 * original string of normalized character i, for highlighting.
 */
export function normalizeText(value) {
  const src = String(value ?? "");
  let text = "";
  const map = [];
  let space = true;
  for (let i = 0; i < src.length; i++) {
    const folded = src[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (const ch of folded) {
      if (/[a-z0-9]/.test(ch)) {
        text += ch;
        map.push(i);
        space = false;
      } else if (ch === "'" || ch === "\u2019") {
        continue;
      } else if (!space) {
        text += " ";
        map.push(i);
        space = true;
      }
    }
  }
  if (text.endsWith(" ")) {
    text = text.slice(0, -1);
    map.pop();
  }
  return { text, map };
}

export const normalize = value => normalizeText(value).text;
const wordsOf = value => normalize(value).split(" ").filter(Boolean);

// ---- Entries ----------------------------------------------------------------

function makeEntry({ group, kind, id, title, subtitle = "", phrases = [], sig = "", ref = null }) {
  const text = normalize(title);
  return {
    group, kind, id, title, subtitle, text,
    words: text.split(" ").filter(Boolean),
    phrases: phrases.map(wordsOf).filter(words => words.length),
    sig, ref, count: 1
  };
}

// Records that read the same (same name, same stats) collapse into one entry.
// Entries that still share a name and subtitle get the record id appended, so
// the list can tell them apart.
function dedupe(entries) {
  const seen = new Map();
  const out = [];
  for (const entry of entries) {
    const key = entry.kind + "|" + entry.text + "|" + entry.sig;
    const first = seen.get(key);
    if (first) { first.count += 1; continue; }
    seen.set(key, entry);
    out.push(entry);
  }
  const twins = new Map();
  for (const entry of out) {
    const key = entry.text + "|" + entry.subtitle;
    twins.set(key, (twins.get(key) || 0) + 1);
  }
  for (const entry of out) {
    const id = entry.ref?.record?.id;
    if (twins.get(entry.text + "|" + entry.subtitle) > 1 && id) entry.subtitle = [entry.subtitle, id].filter(Boolean).join(" · ");
  }
  return out;
}

// Unnamed and "<Deprecated>" records are not things a player can find.
const named = records => (Array.isArray(records) ? records : []).filter(r => typeof r?.name === "string" && r.name.trim() && !/^s*<.*>s*$/.test(r.name));
const unique = list => [...new Set(list.filter(Boolean))];
const number = value => (Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)) : 0);
const titleCase = id => String(id || "").replace(/_/g, " ").replace(/\b[a-z]/g, c => c.toUpperCase());

export function pageEntries() {
  return SEARCH_PAGES.map(page => makeEntry({
    group: "tools", kind: "page", id: "page:" + page.view, title: page.title,
    subtitle: page.description, phrases: [page.keywords], ref: { view: page.view }
  }));
}

/** graph: adaptTravelGraph output, { stop: [{ to, kind }] }. */
export function stopEntries(graph = {}) {
  return Object.keys(graph).sort().map(stop => {
    const edges = graph[stop] || [];
    const kinds = unique(edges.map(e => e.kind));
    const out = new Set(edges.map(e => e.to)).size;
    return makeEntry({
      group: "places", kind: "stop", id: "stop:" + stop, title: stop,
      subtitle: out ? `${kinds.join(", ")} · ${out} ${out === 1 ? "destination" : "destinations"}` : "Arrivals only",
      phrases: kinds, ref: { stop, edges }
    });
  });
}

export function ingredientEntries(records, ctx = {}) {
  return dedupe(named(records).map(r => {
    const effects = [...(r.effects || [])].sort((a, b) => a.slot - b.slot).map(e => effectName(e, ctx.names));
    return makeEntry({
      group: "ingredients", kind: "ingredient", id: "ingredient:" + r.key, title: r.name,
      subtitle: effects.join(" · "), phrases: effects,
      sig: [effects.join("|"), number(r.weight), r.value].join("|"), ref: { record: r }
    });
  }));
}

export function factionEntries(records, ctx = {}) {
  return named(records).filter(r => !r.hidden).map(r => {
    const attributes = (r.favouredAttributes || []).map(a => ctx.names?.attributes?.get(a) || titleCase(a));
    const skills = (r.skills || []).map(s => ctx.names?.skills?.get(s) || titleCase(s));
    const ranks = Array.isArray(r.ranks) ? r.ranks.length : r.rankCount || 0;
    return makeEntry({
      group: "factions", kind: "faction", id: "faction:" + r.key, title: r.name,
      subtitle: [ranks ? `${ranks} ranks` : "", attributes.join(", ")].filter(Boolean).join(" · "),
      phrases: skills, ref: { record: r, attributes, skills }
    });
  });
}

export const SPELL_TYPES = Object.freeze({
  spell: "Spell", power: "Power", ability: "Ability",
  common_disease: "Common disease", blight_disease: "Blight disease", curse: "Curse"
});
const CONSTANT_SPELLS = new Set(["ability", "common_disease", "blight_disease", "curse"]);

export function spellEntries(records, ctx = {}) {
  return dedupe(named(records).map(r => {
    const type = SPELL_TYPES[r.type] || titleCase(r.type);
    const effects = unique((r.effects || []).map(e => effectName(e, ctx.names)));
    return makeEntry({
      group: "spells", kind: "spell", id: "spell:" + r.key, title: r.name,
      subtitle: [type, effects.slice(0, 3).join(", ")].filter(Boolean).join(" · "),
      phrases: [...effects, type],
      sig: [r.type, r.cost, JSON.stringify(r.effects || [])].join("|"), ref: { record: r }
    });
  }));
}

export const WEAPON_TYPES = Object.freeze({
  SB1H: "Short Blade, One Handed", LB1H: "Long Blade, One Handed", LB2H: "Long Blade, Two Handed",
  BL1H: "Blunt Weapon, One Handed", BL2C: "Blunt Weapon, Two Handed", BL2W: "Blunt Weapon, Two Handed",
  SP2H: "Spear, Two Handed", AX1H: "Axe, One Handed", AX2H: "Axe, Two Handed",
  BOW: "Marksman, Bow", CROSSBOW: "Marksman, Crossbow", THROWN: "Marksman, Thrown",
  ARROW: "Arrow", BOLT: "Bolt"
});
const RANGED = new Set(["BOW", "CROSSBOW", "THROWN", "ARROW", "BOLT"]);
const ARMOR_WEIGHT_GMST = {
  helmet: "iHelmWeight", cuirass: "iCuirassWeight", left_pauldron: "iPauldronWeight", right_pauldron: "iPauldronWeight",
  greaves: "iGreavesWeight", boots: "iBootsWeight", left_gauntlet: "iGauntletWeight", right_gauntlet: "iGauntletWeight",
  left_bracer: "iGauntletWeight", right_bracer: "iGauntletWeight", shield: "iShieldWeight"
};

/** Light, Medium or Heavy, as OpenMW's Armor::getEquipmentSkill decides it. */
export function armorClass(record, gmst) {
  const base = gmst?.get(ARMOR_WEIGHT_GMST[record?.type]);
  const light = gmst?.get("fLightMaxMod");
  const medium = gmst?.get("fMedMaxMod");
  if (![base, light, medium].every(Number.isFinite)) return null;
  const weight = Number(record.weight) || 0;
  const cap = Math.floor(base);
  if (weight <= cap * light + 0.0005) return "Light";
  if (weight <= cap * medium + 0.0005) return "Medium";
  return "Heavy";
}

function enchantmentOf(record, ctx) {
  return record?.enchantmentId ? ctx.enchantments?.get(String(record.enchantmentId).toLowerCase()) || null : null;
}

/** catalogs: { Weapons, Armor, Clothing, Potions, Books } record arrays; any may be missing. */
export function itemEntries(catalogs = {}, ctx = {}) {
  const entries = [];
  const add = (kind, record, category, typeLabel, extra = []) => {
    const enchantment = enchantmentOf(record, ctx);
    const magic = unique((enchantment?.effects || record.effects || []).map(e => effectName(e, ctx.names)));
    entries.push(makeEntry({
      group: "items", kind, id: kind + ":" + record.key, title: record.name,
      subtitle: [category, typeLabel, magic.slice(0, 2).join(", ")].filter(Boolean).join(" · "),
      phrases: [category, typeLabel, ...extra, ...magic],
      sig: JSON.stringify([record.type, record.weight, record.value, record.health, record.armorRating, record.chop, record.slash, record.thrust, record.speed, record.skill, record.enchantmentId, record.effects]),
      ref: { record }
    }));
  };
  for (const r of named(catalogs.Weapons)) add("weapon", r, "Weapon", WEAPON_TYPES[r.type] || titleCase(r.type));
  for (const r of named(catalogs.Armor)) {
    const weightClass = armorClass(r, ctx.gmst);
    add("armor", r, "Armor", [weightClass, titleCase(r.type)].filter(Boolean).join(" "));
  }
  for (const r of named(catalogs.Clothing)) add("clothing", r, "Clothing", titleCase(r.type));
  for (const r of named(catalogs.Potions)) add("potion", r, "Potion", "");
  for (const r of named(catalogs.Books)) {
    const skill = r.skill != null ? ctx.names?.skills?.get(r.skill) || titleCase(r.skill) : null;
    if (r.isScroll) add("book", r, "Scroll", "");
    else add("book", r, "Book", skill ? "Skill book: " + skill : "", skill ? [skill] : []);
  }
  return dedupe(entries);
}

/** Lookup context shared by the entry builders and entryDetails. */
export function searchContext({ Attributes = [], Skills = [], EffectRules = [], Enchantments = [], GameSettings = [] } = {}) {
  return {
    names: {
      attributes: new Map(Attributes.map(r => [r.id, r.name])),
      skills: new Map(Skills.map(r => [r.skill, r.name]))
    },
    rules: new Map(EffectRules.map(r => [Number(r.effectId), r])),
    enchantments: new Map(Enchantments.map(r => [String(r.id ?? r.key).toLowerCase(), r])),
    gmst: new Map(GameSettings.map(r => [r.id, Number(r.value)]))
  };
}

// ---- Ranking ----------------------------------------------------------------

export function prepareQuery(query) {
  const text = normalize(query);
  return { text, tokens: text.split(" ").filter(Boolean) };
}

// One substitution, insertion, deletion or swap of neighbours, against a word's prefix.
function nearPrefix(token, word) {
  if (token.length < 4 || word.length < token.length - 1) return false;
  const within = (a, b) => {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) {
      if (a.slice(i + 1) === b.slice(i + 1)) return true;
      return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
    }
    return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  };
  return [token.length - 1, token.length, token.length + 1].some(n => n <= word.length && within(token, word.slice(0, n)));
}

const hasPrefix = (words, token) => words.some(w => w.startsWith(token));
const TYPO_CEILING = 150;

/** 0 when the entry does not match. Higher is better. */
export function scoreEntry(entry, q) {
  if (!q.tokens.length) return 0;
  const { text, words } = entry;
  const short = Math.min(99, text.length);
  if (text === q.text) return 1000;
  if (text.startsWith(q.text)) return 900 - Math.min(99, text.length - q.text.length);
  if (q.tokens.every(t => hasPrefix(words, t))) return 700 - short;
  // Effect, skill and keyword matches rank above letters found mid-word. A
  // phrase that covers the whole query ("fortify str" in Fortify Strength)
  // beats one that covers only what the title did not.
  if (entry.phrases.some(phrase => q.tokens.every(t => hasPrefix(phrase, t)))) {
    return 450 - short + (q.tokens.some(t => hasPrefix(words, t)) ? 30 : 0);
  }
  const rest = q.tokens.filter(t => !hasPrefix(words, t));
  if (rest.length < q.tokens.length && entry.phrases.some(phrase => rest.every(t => hasPrefix(phrase, t)))) return 350 - short;
  if (q.tokens.every(t => text.includes(t))) return 250 - short;
  if (q.tokens.every(t => hasPrefix(words, t) || words.some(w => nearPrefix(t, w)))) return 150 - short;
  return 0;
}

/** Character ranges [start, end) in `title` that the query matched, for <mark>. */
export function highlightRanges(title, query) {
  const q = typeof query === "string" ? prepareQuery(query) : query;
  const { text, map } = normalizeText(title);
  const hits = [];
  const find = token => {
    let at = -1;
    for (let i = text.indexOf(token); i !== -1; i = text.indexOf(token, i + 1)) {
      if (i === 0 || text[i - 1] === " ") { at = i; break; }
      if (at === -1) at = i;
    }
    return at;
  };
  const whole = text.startsWith(q.text) && q.text ? 0 : -1;
  const spans = whole === 0 ? [[0, q.text.length]] : q.tokens.map(t => [find(t), t.length]).filter(([at]) => at !== -1).map(([at, n]) => [at, at + n]);
  for (const [start, end] of spans) hits.push([map[start], map[end - 1] + 1]);
  hits.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of hits) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

const GROUP_ORDER = new Map(SEARCH_GROUPS.map((g, i) => [g.id, i]));
const byTitle = (a, b) => a.title.localeCompare(b.title);

/**
 * Grouped results. group "all" shows the best `perGroup` of every group, best
 * group first; a single group shows up to `limit`. An empty query lists the
 * tools, or the chosen group alphabetically.
 */
export function searchEntries(entries, query, { group = "all", perGroup = 4, limit = 50 } = {}) {
  const q = prepareQuery(query);
  const pool = group === "all" ? entries : entries.filter(e => e.group === group);
  const label = id => SEARCH_GROUPS.find(g => g.id === id)?.label || id;
  if (!q.tokens.length) {
    const list = group === "all" ? pool.filter(e => e.group === "tools") : [...pool].sort(byTitle);
    const id = group === "all" ? "tools" : group;
    return list.length ? [{ group: id, label: label(id), total: list.length, items: list.slice(0, limit).map(entry => ({ entry, score: 0, ranges: [] })) }] : [];
  }
  const hits = [];
  for (const entry of pool) {
    const score = scoreEntry(entry, q);
    if (score) hits.push({ entry, score });
  }
  // Typo matches (below TYPO_CEILING) only show when nothing matched as typed.
  const exact = hits.some(h => h.score > TYPO_CEILING);
  const buckets = new Map();
  for (const hit of exact ? hits.filter(h => h.score > TYPO_CEILING) : hits) {
    if (!buckets.has(hit.entry.group)) buckets.set(hit.entry.group, []);
    buckets.get(hit.entry.group).push(hit);
  }
  const groups = [...buckets].map(([id, hits]) => {
    hits.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length || byTitle(a.entry, b.entry));
    const shown = hits.slice(0, group === "all" ? perGroup : limit);
    return { group: id, label: label(id), total: hits.length, best: hits[0].score, items: shown.map(h => ({ ...h, ranges: highlightRanges(h.entry.title, q) })) };
  });
  groups.sort((a, b) => b.best - a.best || GROUP_ORDER.get(a.group) - GROUP_ORDER.get(b.group));
  return groups.map(({ best, ...rest }) => rest);
}

// ---- Preview ----------------------------------------------------------------

const CAST_TYPES = { when_used: "Cast when used", when_strikes: "Cast when strikes", constant_effect: "Constant effect", cast_once: "Cast once" };
const gold = value => `${Number(value) || 0} gold`;
const range = ({ min, max } = {}) => (min === max ? `${min}` : `${min}–${max}`);

function quoteId(id) {
  return `"${String(id).replace(/"/g, "")}"`;
}

function enchantmentBlock(record, ctx) {
  const enchantment = enchantmentOf(record, ctx);
  if (!enchantment) return {};
  const constant = enchantment.castType === "constant_effect";
  const rows = [];
  if (!constant && enchantment.castType !== "cast_once" && enchantment.charges) rows.push(["Charge", String(enchantment.charges)]);
  return {
    rows,
    effectsTitle: CAST_TYPES[enchantment.castType] || "Enchantment",
    effects: (enchantment.effects || []).map(e => describeEffect(e, ctx.rules?.get(Number(e.effectId)), ctx.names, { constant }))
  };
}

/**
 * What the preview card shows for an entry: { kicker, rows: [[label, value]],
 * effectsTitle, effects: [line], notes: [text], console, action }.
 * action is the label of what Enter does; items and spells copy `console`.
 */
export function entryDetails(entry, ctx = {}) {
  const r = entry.ref?.record;
  const weight = rec => ["Weight", String(number(rec.weight))];
  const value = rec => ["Value", gold(rec.value)];
  const additem = rec => `player->additem ${quoteId(rec.id ?? rec.key)} 1`;
  switch (entry.kind) {
    case "page":
      return { kicker: "Tool", rows: [], effects: [], notes: [entry.subtitle], action: "Open " + entry.title };
    case "stop": {
      const byKind = new Map();
      for (const e of entry.ref.edges) {
        if (!byKind.has(e.kind)) byKind.set(e.kind, new Set());
        byKind.get(e.kind).add(e.to);
      }
      const rows = [...byKind].map(([kind, to]) => [kind, [...to].sort().join(", ")]);
      return { kicker: "Travel stop", rows, effects: [], notes: rows.length ? [] : ["No departures from here."], action: "Plan a trip here" };
    }
    case "ingredient":
      return {
        kicker: "Ingredient", rows: [weight(r), value(r)], effectsTitle: "Effects",
        effects: [...(r.effects || [])].sort((a, b) => a.slot - b.slot).map(e => effectName(e, ctx.names)),
        notes: [], console: additem(r), action: "Add to Alchemy"
      };
    case "faction": {
      const rows = [];
      if (entry.ref.attributes.length) rows.push(["Favoured attributes", entry.ref.attributes.join(", ")]);
      if (entry.ref.skills.length) rows.push(["Skills", entry.ref.skills.join(", ")]);
      return {
        kicker: "Faction", rows, effectsTitle: "Ranks",
        effects: (r.ranks || []).map(rank => rank.name).filter(Boolean),
        notes: [], action: "Open in Faction Journal"
      };
    }
    case "spell": {
      const constant = CONSTANT_SPELLS.has(r.type);
      return {
        kicker: SPELL_TYPES[r.type] || titleCase(r.type),
        rows: constant ? [] : [["Cost", `${r.cost} magicka`]],
        effectsTitle: "Effects",
        effects: (r.effects || []).map(e => describeEffect(e, ctx.rules?.get(Number(e.effectId)), ctx.names, { constant })),
        notes: r.type === "power" ? ["Castable once a day."] : [],
        console: `player->addspell ${quoteId(r.id ?? r.key)}`, action: "Copy console command"
      };
    }
    case "weapon": {
      const rows = [["Type", WEAPON_TYPES[r.type] || titleCase(r.type)]];
      if (RANGED.has(r.type)) rows.push(["Damage", range(r.chop)]);
      else rows.push(["Chop", range(r.chop)], ["Slash", range(r.slash)], ["Thrust", range(r.thrust)], ["Reach", String(number(r.reach))]);
      rows.push(["Speed", String(number(r.speed))]);
      if (r.health) rows.push(["Condition", String(r.health)]);
      rows.push(weight(r), value(r));
      const magic = enchantmentBlock(r, ctx);
      const notes = [];
      if (r.silver) notes.push("Silver weapon.");
      if (r.magical) notes.push("Hits creatures that only magic weapons can harm.");
      return { kicker: "Weapon", rows: [...rows, ...(magic.rows || [])], effectsTitle: magic.effectsTitle, effects: magic.effects || [], notes, console: additem(r), action: "Copy console command" };
    }
    case "armor": {
      const weightClass = armorClass(r, ctx.gmst);
      const rows = [["Type", titleCase(r.type)]];
      if (weightClass) rows.push(["Class", weightClass]);
      rows.push(["Armor rating", String(r.armorRating ?? 0)], ["Condition", String(r.health ?? 0)], weight(r), value(r));
      const magic = enchantmentBlock(r, ctx);
      return { kicker: "Armor", rows: [...rows, ...(magic.rows || [])], effectsTitle: magic.effectsTitle, effects: magic.effects || [], notes: [], console: additem(r), action: "Copy console command" };
    }
    case "clothing": {
      const magic = enchantmentBlock(r, ctx);
      return { kicker: "Clothing", rows: [["Type", titleCase(r.type)], weight(r), value(r), ...(magic.rows || [])], effectsTitle: magic.effectsTitle, effects: magic.effects || [], notes: [], console: additem(r), action: "Copy console command" };
    }
    case "potion":
      return {
        kicker: "Potion", rows: [weight(r), value(r)], effectsTitle: "Effects",
        effects: (r.effects || []).map(e => describeEffect(e, ctx.rules?.get(Number(e.effectId)), ctx.names, { noTarget: true })),
        notes: [], console: additem(r), action: "Copy console command"
      };
    case "book": {
      const magic = enchantmentBlock(r, ctx);
      const skill = r.skill != null ? ctx.names?.skills?.get(r.skill) || titleCase(r.skill) : null;
      return {
        kicker: r.isScroll ? "Scroll" : skill ? "Skill book" : "Book",
        rows: [weight(r), value(r), ...(magic.rows || [])], effectsTitle: magic.effectsTitle, effects: magic.effects || [],
        notes: skill ? [`Reading it the first time raises ${skill} by 1.`] : [], console: additem(r), action: "Copy console command"
      };
    }
    default:
      return { kicker: "", rows: [], effects: [], notes: [] };
  }
}
