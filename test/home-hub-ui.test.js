const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
// react-dom checks for input-event support when it loads, so it needs a DOM first.
const bootstrap = new JSDOM("", { url: "http://localhost/" });
global.window = bootstrap.window;
global.document = bootstrap.window.document;
const { createRoot } = require("react-dom/client");
const { renderToString } = require("react-dom/server");
const { act } = React;

function component(file, exportName = "default") {
  const result = require("esbuild").buildSync({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime", "react-dom"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

const home = () => import("../lib/home-data.mjs");

const BUILD = {
  name: "", race: "Dark Elf", gender: "Female", className: "Nightblade", sign: "The Atronach",
  fav1: "Speed", fav2: "Willpower",
  maj: ["Short Blade", "Mysticism", "Illusion", "Alteration", "Sneak"],
  min: ["Marksman", "Light Armor", "Athletics", "Security", "Destruction"]
};
const ATTRS = { Strength: 40, Intelligence: 40, Willpower: 50, Agility: 40, Speed: 60, Endurance: 40, Personality: 30, Luck: 40 };
const SKILLS = { "Short Blade": 40, Mysticism: 40, Illusion: 35, Alteration: 35, Sneak: 30, Marksman: 20, "Light Armor": 20, Athletics: 20, Security: 15, Destruction: 15 };
// Shaped like character-math's computeSheet: { attrs: { Strength: { v } }, skills: { X: { v } }, health, ... }.
const SHEET = {
  attrs: Object.fromEntries(Object.entries(ATTRS).map(([k, v]) => [k, { v, parts: [] }])),
  skills: Object.fromEntries(Object.entries(SKILLS).map(([k, v]) => [k, { v, parts: [BUILD.maj.includes(k) ? "+25 major" : "+10 minor"] }])),
  health: 40, magicka: 100, fatigue: 170
};

test("the character summary names the build and reads the computed sheet", async () => {
  const { characterSummary } = await home();
  const unnamed = characterSummary(BUILD, SHEET);
  assert.equal(unnamed.name, "Dark Elf Nightblade");
  assert.equal(unnamed.initial, "D");
  assert.equal(unnamed.line, "Female Dark Elf · Nightblade · The Atronach");
  assert.deepEqual(unnamed.vitals.map(v => v.value), [40, 100, 170]);
  assert.deepEqual(unnamed.attributes.find(a => a.name === "Speed"), { name: "Speed", abbr: "SPD", value: 60, favoured: true });
  assert.equal(unnamed.attributes.filter(a => a.favoured).length, 2);
  assert.deepEqual(unnamed.majors.map(s => s.value), [40, 40, 35, 35, 30]);

  assert.equal(characterSummary({ ...BUILD, name: "  Nerevar " }, SHEET).name, "Nerevar");
  const loading = characterSummary(BUILD, null);
  assert.equal(loading.ready, false);
  assert.deepEqual(loading.attributes, [], "no numbers until the sheet exists");
});

test("next level-up and the Health gap come from the Level Simulator's math", async () => {
  const { nextLevelUp, healthGap } = await home();
  const { simulateProgression, normalizeCharacterState, detectArchetype, PROGRESSION_MODES } = await import("../lib/level-math.mjs");
  const up = nextLevelUp(SHEET);
  const base = normalizeCharacterState(SHEET);
  const arch = detectArchetype(base);
  const step = simulateProgression(base, { targetLevel: 2, archetype: arch.id, priority: arch.priority, strategy: "auto", mode: PROGRESSION_MODES.STATS_ONLY }).steps[0];
  assert.deepEqual(up.bonuses.map(b => b.attribute), step.attributeBonuses.map(b => b.attribute));
  assert.equal(up.level, 1);
  assert.equal(up.nextLevel, 2);
  assert.equal(up.healthFrom, 40);
  assert.equal(up.healthTo, step.newHealth);

  const gap = healthGap(SHEET, null, {}, 30);
  assert.equal(gap.level, 30);
  assert.ok(gap.gain > 0, "rushing Endurance ends with more Health");
  assert.equal(gap.optimal.length, gap.levels.length);
  assert.equal(gap.optimal.at(-1) - gap.delayed.at(-1), gap.gain);
  assert.equal(nextLevelUp(null), null);
});

test("the Alchemy preview uses the Alchemy tool's brew chance", async () => {
  const { alchemyPreview } = await home();
  const { calculatePotion } = await import("../lib/alchemy-math.mjs");
  const sheet = { ...SHEET, skills: { ...SHEET.skills, Alchemy: { v: 35 } } };
  const preview = alchemyPreview(sheet, 120);
  assert.deepEqual(preview, { chance: 43, skill: 35, intelligence: 40, luck: 40, ingredients: 120 });
  assert.equal(preview.chance, calculatePotion({ alchemySkill: 35, intelligence: 40, luck: 40 }).brewChance);
  assert.equal(alchemyPreview(SHEET).ingredients, null, "no count until the ingredients load");
  assert.equal(alchemyPreview({ attributes: { Intelligence: 100, Luck: 100 }, skills: { Alchemy: 100 } }).chance, 100, "capped at 100");
});

test("a loaded save's level reaches the card and its stats drive the next level-up", async () => {
  const { characterSummary, nextLevelUp } = await home();
  const saved = { ...SHEET, level: 7, fromSave: true, attrs: { ...SHEET.attrs, Endurance: { v: 70 } } };
  assert.equal(characterSummary(BUILD, saved).level, 7);
  assert.equal(characterSummary(BUILD, SHEET).level, 1);
  const up = nextLevelUp(saved, {});
  assert.equal(up.level, 7, "the level-up starts from the save's level");
  assert.equal(up.nextLevel, 8);
});

test("the example route goes from Seyda Neen to the stop farthest away, by fewest hops", async () => {
  const { exampleRoute, stopCount } = await home();
  const graph = {
    "Seyda Neen": [{ to: "Balmora", kind: "Silt Strider" }, { to: "Vivec", kind: "Silt Strider" }],
    Balmora: [{ to: "Ald-ruhn", kind: "Silt Strider" }, { to: "Seyda Neen", kind: "Silt Strider" }],
    "Ald-ruhn": [{ to: "Maar Gan", kind: "Silt Strider" }],
    Vivec: [{ to: "Ald-ruhn", kind: "Guild Guide" }],
    "Maar Gan": []
  };
  const route = exampleRoute("vanilla", graph);
  assert.deepEqual(route.path, ["Seyda Neen", "Balmora", "Ald-ruhn", "Maar Gan"], "ties between equal routes go to the first found");
  assert.equal(route.hops, 3);
  assert.equal(stopCount("vanilla", graph), 5);
  assert.equal(exampleRoute("vanilla", { Solo: [] }), null, "no route when nothing is reachable");
  assert.equal(exampleRoute("vanilla", { Balmora: [{ to: "Vivec", kind: "Boat" }], Vivec: [] }).from, "Balmora", "starts elsewhere when Seyda Neen is missing");

  const current = path.join(__dirname, "..", "public", "game-data", "current.json");
  if (!fs.existsSync(current)) return; // bundle is staged locally, not committed
  const { manifest } = JSON.parse(fs.readFileSync(current, "utf8"));
  const travel = JSON.parse(fs.readFileSync(path.join(path.dirname(current), path.dirname(manifest), "vanilla", "Travel.json"), "utf8"));
  const { adaptTravelGraph, findFewestHopsRoute } = await import("../lib/travel-graph.mjs");
  const live = adaptTravelGraph(travel.records, travel.nodes);
  const real = exampleRoute("vanilla", live);
  assert.equal(real.from, "Seyda Neen");
  assert.equal(real.hops, findFewestHopsRoute("Seyda Neen", real.to, "vanilla", live).hops);
  assert.ok(real.hops >= 3, "a multi-leg trip worth showing");
});

async function renderHome({ shell = {}, character, catalogs } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const calls = { navigate: [], profile: [], search: 0, loaded: [], cleared: 0 };
  dom.window.addEventListener("silt-open-search", () => { calls.search += 1; });
  const loader = {
    async loadCatalog() {
      return [
        { from: "a", to: "b", mode: "silt_strider" }, { from: "b", to: "c", mode: "boat" }, { from: "c", to: "d", mode: "guild_guide" }
      ];
    },
    async loadCatalogMetadata() {
      return { nodes: { a: { name: "Seyda Neen" }, b: { name: "Balmora" }, c: { name: "Vivec" }, d: { name: "Sadrith Mora" } } };
    }
  };
  const fullShell = {
    ready: true, view: "home", world: "vanilla", arce: false, profile: "vanilla",
    navigate: view => calls.navigate.push(view), setProfile: id => calls.profile.push(id), ...shell
  };
  const HomeHubRoot = component("components/home-hub/home-hub-root.jsx");
  const root = createRoot(document.getElementById("root"));
  const hooks = {
    loadSave: async save => { calls.loaded.push(save); },
    clearSave: () => { calls.cleared += 1; }
  };
  await act(async () => root.render(React.createElement(HomeHubRoot, {
    shell: fullShell, loader, character: { ...hooks, ...(character === undefined ? { build: BUILD, sheet: SHEET, catalogs } : character) }
  })));
  await act(async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); });
  const container = document.getElementById("root");
  const cleanup = async () => { await act(async () => root.unmount()); dom.window.close(); };
  return { container, calls, cleanup };
}

test("the home page shows the character, real counts and every tool", async () => {
  const { container, cleanup } = await renderHome();
  try {
    assert.match(container.querySelector(".home-title").textContent, /Plan the perfect Morrowind run/);
    const card = container.querySelector(".home-character");
    assert.equal(card.querySelector(".home-character-name").textContent, "Dark Elf Nightblade");
    assert.deepEqual([...card.querySelectorAll(".home-attribute dd")].map(d => d.textContent), ["40", "40", "50", "40", "60", "40", "30", "40"]);
    assert.equal(card.querySelectorAll(".home-star").length, 2, "the favoured attributes are marked");
    assert.match(card.querySelector(".home-levelup").textContent, /Level 1 → 2/);
    assert.match(card.querySelector(".home-levelup").textContent, /Health 40 → \d+/);

    const facts = [...container.querySelectorAll(".home-fact")].map(f => f.textContent);
    assert.deepEqual(facts, [
      "27skills modeled for every character",
      "103hand-picked challenge restrictions",
      "4travel stops in Vanilla",
      "3world profiles: Vanilla, TR and TR + ARCE"
    ], "the stop count comes from the loaded travel network");

    const tools = [...container.querySelectorAll("a.home-tool")];
    assert.deepEqual(tools.map(a => a.getAttribute("href")), ["#builder", "#leveler", "#alchemy", "#travel", "#enchanting", "#spellmaking", "#factions", "#challenge", "#vault"]);
    assert.match(container.querySelector(".home-tool--travel").textContent, /3 hops from Seyda Neen to Sadrith Mora/);
    assert.match(container.querySelector(".home-tool--alchemy").textContent, /8% chance for Dark Elf Nightblade to brew a potion/);
    assert.match(container.querySelector(".home-tool--alchemy").textContent, /3 ingredients to brew with/, "the count comes from the loaded Ingredients catalog");
    assert.deepEqual([...container.querySelectorAll(".home-tool--minor")].map(a => a.getAttribute("href")), ["#challenge", "#vault"]);
    assert.equal(container.querySelectorAll(".home-tool--minor .home-preview").length, 0, "occasional tools have no preview");
    assert.match(container.querySelector(".home-tool--leveler").textContent, /\+\d+ Health by level 30 for Dark Elf Nightblade/);
    assert.match(container.querySelector(".home-tool--builder").textContent, /41 premade builds/);
  } finally { await cleanup(); }
});

test("buttons and links navigate, switch worlds and open search", async () => {
  const { container, calls, cleanup } = await renderHome({ shell: { profile: "tr", world: "tr" } });
  try {
    const click = el => act(async () => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })));
    const button = text => [...container.querySelectorAll("button")].find(b => b.textContent.trim().startsWith(text));

    assert.equal(button("Roll a challenge run"), undefined, "the hero no longer offers challenge runs");
    await click(button("Start a new build"));
    await click(button("Plan level-ups"));
    await click(container.querySelector("a.home-tool--alchemy"));
    await click([...container.querySelectorAll(".home-colophon a")].find(a => a.textContent === "Challenge Runs"));
    await click([...container.querySelectorAll(".home-colophon a")].find(a => a.textContent === "Changelog"));
    assert.deepEqual(calls.navigate, ["builder", "leveler", "alchemy", "challenge", "changelog"]);

    const hero = [...container.querySelector(".home-hero-copy").children].map(el => el.className);
    assert.ok(hero.indexOf("home-save") < hero.indexOf("home-worlds"), "the save drop zone comes first");
    assert.equal(hero.indexOf("home-worlds") + 1, hero.indexOf("home-ctas"), "the world choice sits right above Start a new build");
    const worlds = [...container.querySelectorAll(".home-world")];
    assert.deepEqual(worlds.map(w => w.textContent), ["Vanilla", "Tamriel Rebuilt", "TR + ARCE"]);
    assert.equal(worlds[1].getAttribute("aria-pressed"), "true", "Tamriel Rebuilt is the active world");
    await click(worlds[1]);
    await click(worlds[2]);
    assert.deepEqual(calls.profile, ["tr_arce"], "choosing the active world again does nothing");
    assert.match(container.querySelector(".home-character-top").textContent, /Tamriel Rebuilt/);

    await click(container.querySelector(".home-news"));
    assert.equal(calls.search, 1, "the New pill asks the header to open search");
  } finally { await cleanup(); }
});

test("before the shell is ready the actions wait, and before the sheet loads the card says so", async () => {
  const { container, calls, cleanup } = await renderHome({ shell: { ready: false }, character: { build: BUILD, sheet: null, catalogs: null } });
  try {
    assert.ok([...container.querySelectorAll(".home-ctas button, .home-character-actions button, .home-world, .home-save button")].every(b => b.disabled));
    assert.match(container.querySelector(".home-character").textContent, /Loading the character sheet/);
    assert.equal(container.querySelector(".home-levelup"), null);
    assert.equal(container.querySelector(".home-tool--leveler .home-preview"), null, "no Health preview without a sheet");
    assert.deepEqual(calls.navigate, []);
  } finally { await cleanup(); }
});

test("the server render has no random content, so it hydrates cleanly", async () => {
  const HomeHubRoot = component("components/home-hub/home-hub-root.jsx");
  const shell = { ready: false, view: "home", world: "vanilla", profile: "vanilla", navigate() {}, setProfile() {} };
  const render = () => renderToString(React.createElement(HomeHubRoot, { shell, character: { build: BUILD, sheet: SHEET, catalogs: null }, loader: { loadCatalog: async () => [], loadCatalogMetadata: async () => ({}) } }));
  const first = render();
  assert.equal(render(), first);
});

test("a save dropped or chosen on the home page loads into every tool; a .ess is refused by name", async () => {
  const { File } = require("node:buffer");
  const { container, calls, cleanup } = await renderHome();
  try {
    const zone = container.querySelector(".home-save");
    assert.match(zone.textContent, /Drop your OpenMW save here/);
    const converted = { identity: { name: "Kimble", level: 3 }, stuff: {} };

    const drop = file => act(async () => {
      const event = new window.Event("drop", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: { types: ["Files"], files: [file] } });
      window.dispatchEvent(event);
      for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0));
    });
    await drop(new File([JSON.stringify(converted)], "Kimble.json"));
    assert.deepEqual(calls.loaded, [converted], "a file dropped anywhere on the page reaches loadSave");

    await drop(new File(["TES3"], "Save 1.ess"));
    assert.equal(calls.loaded.length, 1);
    assert.match(container.querySelector(".home-save-error").textContent, /Morrowind\.exe save \(\.ess\).*\.omwsave/);

    const input = container.querySelector('input[type="file"]');
    assert.equal(input.getAttribute("aria-label"), "Open an OpenMW save");
    Object.defineProperty(input, "files", { value: [new File([JSON.stringify(converted)], "again.json")] });
    await act(async () => {
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
      for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0));
    });
    assert.equal(calls.loaded.length, 2, "the file picker takes the same path");
  } finally { await cleanup(); }
});

test("with a save loaded the hero offers next steps and the card shows the save", async () => {
  const saved = { ...SHEET, level: 3, fromSave: true };
  const activeSave = {
    token: 1, profile: "tr", className: "Tom Catess", sheet: saved,
    save: { identity: { name: "Kimble", level: 3 } },
    unresolved: [{ field: "race" }], unworn: [{ slot: "Helmet" }, { slot: "Boots" }]
  };
  const { container, calls, cleanup } = await renderHome({ character: { build: { ...BUILD, name: "Kimble" }, sheet: SHEET, catalogs: null, activeSave } });
  try {
    const zone = container.querySelector(".home-save--loaded");
    assert.match(zone.textContent, /Kimble, level 3 Tom Catess/);
    assert.match(zone.textContent, /Tamriel Rebuilt/);
    assert.match(zone.textContent, /3 things from the save's mods could not be matched/);
    const card = container.querySelector(".home-character");
    assert.match(card.textContent, /From your save/);
    assert.equal(card.querySelector(".home-character-line").textContent, "Level 3 · Female Dark Elf · Tom Catess · The Atronach");

    const click = el => act(async () => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true })));
    const button = text => [...zone.querySelectorAll("button")].find(b => b.textContent.trim() === text);
    await click(button("Open the character"));
    await click(button("Plan level-ups"));
    await click(button("Factions and quests"));
    await click(button("Clear the save"));
    assert.deepEqual(calls.navigate, ["builder", "leveler", "factions"]);
    assert.equal(calls.cleared, 1);
  } finally { await cleanup(); }
});
