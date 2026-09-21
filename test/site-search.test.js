const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const search = () => import("../lib/site-search.mjs");
const effects = () => import("../lib/effect-text.mjs");
const intents = () => import("../lib/search-intent.mjs");
const indexLib = () => import("../lib/site-search-index.mjs");

const fx = (effectId, name, extra = {}) => ({ effectId, name, attribute: null, skill: null, range: "self", magnitude: { min: 0, max: 0 }, durationSeconds: 0, areaFeet: 0, ...extra });

test("effect lines read like the game's tooltips", async () => {
  const { describeEffect, effectName, effectNames } = await effects();
  const names = effectNames([{ id: "strength", name: "Strength" }], [{ skill: "long blade", name: "Long Blade" }]);
  assert.equal(effectName(fx(79, "Fortify Attribute", { attribute: "strength" }), names), "Fortify Strength");
  assert.equal(effectName(fx(83, "Fortify Skill", { skill: "long blade" }), names), "Fortify Long Blade");
  assert.equal(effectName(fx(83, "Fortify Skill", { skill: "hand_to_hand" })), "Fortify Hand To Hand", "unknown ids fall back to title case");

  const fire = fx(14, "Fire Damage", { range: "target", magnitude: { min: 2, max: 20 }, durationSeconds: 1, areaFeet: 5 });
  assert.equal(describeEffect(fire, {}), "Fire Damage 2 to 20 pts for 1 sec in 5 ft on Target");
  assert.equal(describeEffect(fx(79, "Fortify Attribute", { attribute: "strength", magnitude: { min: 1, max: 1 }, durationSeconds: 60 }), {}, names), "Fortify Strength 1 pt for 60 secs on Self");
  assert.equal(describeEffect(fx(90, "Resist Fire", { magnitude: { min: 20, max: 20 } }), {}, {}, { constant: true }), "Resist Fire 20%", "resistances are percentages; constant effects have no duration or range");
  assert.equal(describeEffect(fx(59, "Telekinesis", { magnitude: { min: 10, max: 10 }, durationSeconds: 30 }), {}), "Telekinesis 10 ft for 30 secs on Self");
  assert.equal(describeEffect(fx(84, "Fortify Maximum Magicka", { magnitude: { min: 10, max: 15 } }), {}, {}, { constant: true }), "Fortify Maximum Magicka 1.0 to 1.5x INT");
  assert.equal(describeEffect(fx(118, "Command Creature", { range: "touch", magnitude: { min: 1, max: 1 }, durationSeconds: 5 }), {}), "Command Creature 1 level for 5 secs on Touch");
  assert.equal(describeEffect(fx(63, "Divine Intervention"), { noMagnitude: true, noDuration: true, appliedOnce: true }), "Divine Intervention on Self");
  assert.equal(describeEffect(fx(75, "Restore Health", { magnitude: { min: 10, max: 10 }, durationSeconds: 5 }), {}, {}, { noTarget: true }), "Restore Health 10 pts for 5 secs", "potions print no range");
  assert.equal(describeEffect(fx(7, "Burden", { magnitude: { min: 5, max: 5 } }), { appliedOnce: false }), "Burden 5 pts for 1 sec on Self", "durations round up to a second unless the effect applies once");
});

test("normalizing folds case, accents and apostrophes and maps back to the title", async () => {
  const { normalizeText } = await search();
  const { text, map } = normalizeText("Azura's  Star — Ébonÿ");
  assert.equal(text, "azuras star ebony");
  assert.equal("Azura's  Star — Ébonÿ"[map[text.indexOf("star")]], "S");
  assert.equal(normalizeText("  --Hello--  ").text, "hello");
});

function fixture(S) {
  const ctx = S.searchContext({
    Attributes: [{ id: "strength", name: "Strength" }, { id: "intelligence", name: "Intelligence" }],
    Skills: [{ skill: "alchemy", name: "Alchemy" }],
    EffectRules: [{ effectId: 63, noMagnitude: true, noDuration: true, appliedOnce: true }],
    Enchantments: [{ id: "Servant_en", castType: "when_used", charges: 260, effects: [fx(16, "Frost Damage", { range: "touch", magnitude: { min: 1, max: 15 }, durationSeconds: 1 })] }],
    GameSettings: [{ id: "fLightMaxMod", value: 0.6 }, { id: "fMedMaxMod", value: 0.9 }, { id: "iHelmWeight", value: 5 }, { id: "iShieldWeight", value: 15 }]
  });
  const weapon = (key, name, extra = {}) => ({ id: key, key, name, type: "SB1H", chop: { min: 6, max: 15 }, slash: { min: 6, max: 15 }, thrust: { min: 6, max: 12 }, speed: 2.5, reach: 1, health: 300, weight: 1.8, value: 4000, ...extra });
  const entries = [
    ...S.pageEntries(),
    ...S.stopEntries({ Balmora: [{ to: "Vivec", kind: "Silt Strider" }, { to: "Caldera", kind: "Guild Guide" }], Vivec: [] }),
    ...S.factionEntries([{ key: "mages guild", name: "Mages Guild", favouredAttributes: ["intelligence"], skills: ["alchemy"], ranks: [{ name: "Associate" }, { name: "Apprentice" }] }, { key: "old", name: "<Deprecated>", ranks: [] }], ctx),
    ...S.ingredientEntries([
      { key: "ingred_bread_01", id: "ingred_bread_01", name: "Bread", weight: 0.2, value: 1, effects: [{ slot: 0, effectId: 77, name: "Restore Fatigue" }] },
      { key: "t_bread", id: "T_Bread", name: "Bread", weight: 0.2, value: 1, effects: [{ slot: 0, effectId: 77, name: "Restore Fatigue" }] },
      { key: "ham", id: "ham", name: "Ham", weight: 1, value: 2, effects: [{ slot: 1, effectId: 79, name: "Fortify Attribute", attribute: "strength" }, { slot: 0, effectId: 82, name: "Fortify Fatigue" }] }
    ], ctx),
    ...S.spellEntries([{ key: "orc strength", id: "orc strength", name: "Orc Strength", type: "spell", cost: 12, effects: [fx(79, "Fortify Attribute", { attribute: "strength", magnitude: { min: 10, max: 10 }, durationSeconds: 30 })] }], ctx),
    ...S.itemEntries({
      Weapons: [weapon("glass dagger", "Glass Dagger", { magical: true }), weapon("glass dagger_x", "Glass Dagger", { health: 400 }), weapon("glass dagger_copy", "Glass Dagger", { magical: true })],
      Armor: [{ id: "azura's servant", key: "azura's servant", name: "Azura's Servant", type: "shield", armorRating: 80, health: 1600, weight: 45, value: 30000, enchantmentId: "servant_en" }, { id: "glass_helm", key: "glass_helm", name: "Glass Helm", type: "helmet", armorRating: 50, health: 500, weight: 3, value: 12000 }],
      Books: [{ id: "bk_alc", key: "bk_alc", name: "A Game at Dinner", skill: "alchemy", weight: 3, value: 50 }, { id: "sc_di", key: "sc_di", name: "Scroll of Divine Intervention", isScroll: true, weight: 0.2, value: 60 }]
    }, ctx)
  ];
  return { ctx, entries };
}

test("entries cover pages, stops, factions, ingredients, spells and items", async () => {
  const S = await search();
  const { entries } = fixture(S);
  const byKind = kind => entries.filter(e => e.kind === kind).map(e => e.title);
  assert.equal(byKind("page").length, S.SEARCH_PAGES.length);
  assert.deepEqual(byKind("stop"), ["Balmora", "Vivec"]);
  assert.deepEqual(byKind("faction"), ["Mages Guild"], "<Deprecated> records are dropped");
  assert.equal(entries.find(e => e.id === "stop:Balmora").subtitle, "Silt Strider, Guild Guide · 2 destinations");
  assert.equal(entries.find(e => e.id === "ingredient:ham").subtitle, "Fortify Fatigue · Fortify Strength", "effects in slot order, attributes named");

  const daggers = entries.filter(e => e.title === "Glass Dagger");
  assert.equal(daggers.length, 2, "identical records collapse");
  assert.equal(daggers[0].count, 2);
  assert.ok(daggers.every(d => / · glass dagger/.test(d.subtitle)), "look-alikes that differ get their record id");
  assert.equal(entries.find(e => e.title === "Azura's Servant").subtitle, "Armor · Heavy Shield · Frost Damage");
  assert.equal(entries.find(e => e.title === "Glass Helm").subtitle, "Armor · Light Helmet");
  assert.equal(entries.find(e => e.title === "A Game at Dinner").subtitle, "Book · Skill book: Alchemy");
});

test("ranking prefers exact and prefix titles, then effects, then mid-word letters", async () => {
  const S = await search();
  const { entries } = fixture(S);
  const titles = (query, options) => S.searchEntries(entries, query, options).map(g => [g.group, g.items.map(i => i.entry.title)]);

  assert.deepEqual(titles("glass")[0], ["items", ["Glass Helm", "Glass Dagger", "Glass Dagger"]]);
  const fortify = S.searchEntries(entries, "fortify str");
  assert.deepEqual(fortify.map(g => g.group), ["spells", "ingredients"], "Orc Strength's title and effect both match, so spells lead");
  assert.equal(fortify[1].items[0].entry.title, "Ham");
  assert.deepEqual(titles("alchemy")[0], ["tools", ["Alchemy"]], "an exact title wins its group the top spot");
  assert.ok(titles("alchemy").some(([group, list]) => group === "factions" && list.includes("Mages Guild")), "faction skills are searchable");
  assert.deepEqual(titles("balmorra"), [["places", ["Balmora"]]], "one typo still finds the town");
  assert.deepEqual(titles("breadd").map(([g]) => g), ["ingredients"]);
  assert.ok(!titles("bread").some(([g]) => g === "places"), "typo matches hide once something matches as typed");
  assert.deepEqual(titles("zzzz"), []);
});

test("groups cap in the All view, a chosen group lists more, and an empty query lists tools", async () => {
  const S = await search();
  const { entries } = fixture(S);
  const all = S.searchEntries(entries, "glass", { perGroup: 1 });
  assert.equal(all[0].items.length, 1);
  assert.equal(all[0].total, 3);
  assert.equal(S.searchEntries(entries, "glass", { group: "items" })[0].items.length, 3);
  const empty = S.searchEntries(entries, "  ");
  assert.equal(empty.length, 1);
  assert.equal(empty[0].group, "tools");
  assert.equal(empty[0].items.length, S.SEARCH_PAGES.length);
  assert.deepEqual(S.searchEntries(entries, "", { group: "places" })[0].items.map(i => i.entry.title), ["Balmora", "Vivec"], "browsing a group is alphabetical");
});

test("highlight ranges point at the matched letters of the original title", async () => {
  const { highlightRanges } = await search();
  const title = "Azura's Star";
  assert.deepEqual(highlightRanges(title, "azuras"), [[0, 7]], "the apostrophe is inside the match");
  assert.deepEqual(highlightRanges(title, "star az").map(([a, b]) => title.slice(a, b)), ["Az", "Star"]);
  assert.deepEqual(highlightRanges("Ebony Dart", "dart ebony"), [[0, 5], [6, 10]]);
});

test("details describe each kind and give items and spells a console command", async () => {
  const S = await search();
  const { entries, ctx } = fixture(S);
  const details = title => S.entryDetails(entries.find(e => e.title === title), ctx);

  const dagger = details("Glass Dagger");
  assert.deepEqual(dagger.rows.slice(0, 4), [["Type", "Short Blade, One Handed"], ["Chop", "6–15"], ["Slash", "6–15"], ["Thrust", "6–12"]]);
  assert.equal(dagger.console, 'player->additem "glass dagger" 1');
  assert.ok(dagger.notes.some(n => /magic weapons/.test(n)));

  const shield = details("Azura's Servant");
  assert.ok(shield.rows.some(([k, v]) => k === "Class" && v === "Heavy"));
  assert.ok(shield.rows.some(([k, v]) => k === "Charge" && v === "260"));
  assert.equal(shield.effectsTitle, "Cast when used");
  assert.deepEqual(shield.effects, ["Frost Damage 1 to 15 pts for 1 sec on Touch"]);

  const spell = details("Orc Strength");
  assert.deepEqual(spell.rows, [["Cost", "12 magicka"]]);
  assert.deepEqual(spell.effects, ["Fortify Strength 10 pts for 30 secs on Self"]);
  assert.equal(spell.console, 'player->addspell "orc strength"');

  assert.deepEqual(details("A Game at Dinner").notes, ["Reading it the first time raises Alchemy by 1."]);
  assert.deepEqual(details("Mages Guild").effects, ["Associate", "Apprentice"]);
  assert.equal(details("Balmora").action, "Plan a trip here");
  assert.deepEqual(details("Balmora").rows, [["Silt Strider", "Vivec"], ["Guild Guide", "Caldera"]]);
});

test("search intents hand one result to one view and expire", async () => {
  const I = await intents();
  const seen = [];
  const stop = I.subscribeSearchIntent(() => seen.push(I.getSearchIntent()));
  const intent = I.setSearchIntent({ view: "travel", kind: "destination", value: "Balmora" }, 1000);
  assert.equal(I.intentFor("travel", intent, 2000), intent);
  assert.equal(I.intentFor("alchemy", intent, 2000), null, "other views ignore it");
  assert.equal(I.intentFor("travel", intent, 1000 + 61_000), null, "an unused intent goes stale");
  I.clearSearchIntent({ ...intent });
  assert.equal(I.getSearchIntent(), intent, "clearing a different intent leaves the pending one");
  I.clearSearchIntent(intent);
  assert.equal(I.getSearchIntent(), null);
  stop();
  assert.equal(seen.length, 2);
});

test("the index loads part by part, keeps failures to their part and retries them", async () => {
  const { createSearchIndex, indexEntries } = await indexLib();
  let failItems = true;
  const catalogs = {
    Attributes: [], Skills: [], EffectRules: [],
    Travel: [{ from: "a", to: "b", mode: "silt_strider" }],
    Factions: [{ key: "fg", name: "Fighters Guild", ranks: [] }],
    Ingredients: [], Spells: [{ key: "fireball", id: "fireball", name: "Fireball", type: "spell", cost: 5, effects: [] }],
    Weapons: [], Armor: [], Clothing: [], Potions: [], Books: [], Enchantments: [], GameSettings: []
  };
  const loader = {
    async loadCatalog(profile, name) {
      if (name === "Weapons" && failItems) throw new Error("offline");
      return catalogs[name];
    },
    async loadCatalogMetadata() { return { nodes: { a: { name: "Balmora" }, b: { name: "Vivec" } } }; }
  };
  const warn = console.warn;
  console.warn = () => {};
  try {
    const index = createSearchIndex(loader);
    const state = index.get("vanilla");
    assert.equal(index.get("vanilla"), state, "one load per profile");
    await new Promise(resolve => { const off = state.subscribe(() => { if (state.pending === 0) { off(); resolve(); } }); });
    assert.deepEqual(state.failed, ["items"]);
    const titles = indexEntries(state).map(e => e.title);
    assert.ok(["Balmora", "Vivec", "Fighters Guild", "Fireball", "Home"].every(t => titles.includes(t)));

    failItems = false;
    const retry = index.get("vanilla");
    assert.notEqual(retry, state, "a finished load with failures starts over");
    await new Promise(resolve => { const off = retry.subscribe(() => { if (retry.pending === 0) { off(); resolve(); } }); });
    assert.deepEqual(retry.failed, []);
    assert.equal(index.get("vanilla"), retry);
  } finally {
    console.warn = warn;
  }
});

test("the shipped bundles answer the obvious searches", async () => {
  const current = path.join(__dirname, "..", "public", "game-data", "current.json");
  if (!fs.existsSync(current)) return; // bundle is staged locally, not committed
  const { manifest } = JSON.parse(fs.readFileSync(current, "utf8"));
  const root = path.join(path.dirname(current), path.dirname(manifest), "vanilla");
  const read = name => JSON.parse(fs.readFileSync(path.join(root, name + ".json"), "utf8"));
  const S = await search();
  const { adaptTravelGraph } = await import("../lib/travel-graph.mjs");
  const cat = name => read(name).records;
  const ctx = S.searchContext({ Attributes: cat("Attributes"), Skills: cat("Skills"), EffectRules: cat("EffectRules"), Enchantments: cat("Enchantments"), GameSettings: cat("GameSettings") });
  const travel = read("Travel");
  const entries = [
    ...S.pageEntries(),
    ...S.stopEntries(adaptTravelGraph(travel.records, travel.nodes)),
    ...S.factionEntries(cat("Factions"), ctx),
    ...S.ingredientEntries(cat("Ingredients"), ctx),
    ...S.spellEntries(cat("Spells"), ctx),
    ...S.itemEntries({ Weapons: cat("Weapons"), Armor: cat("Armor"), Clothing: cat("Clothing"), Potions: cat("Potions"), Books: cat("Books") }, ctx)
  ];
  const top = query => S.searchEntries(entries, query)[0]?.items[0]?.entry;
  assert.equal(top("glass dagger").title, "Glass Dagger");
  assert.equal(top("balmora").kind, "stop");
  assert.equal(top("balmorra").title, "Balmora");
  assert.equal(top("mages guild").kind, "faction");
  assert.equal(top("fireball").title, "Fireball");
  assert.ok(S.searchEntries(entries, "fortify strength").some(g => g.group === "ingredients"));
  for (const entry of entries) {
    assert.ok(entry.title.trim() && !/^</.test(entry.title), `entry ${entry.id} has a real name`);
    assert.doesNotThrow(() => S.entryDetails(entry, ctx), `details for ${entry.id}`);
  }
});
