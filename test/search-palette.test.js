const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
// react-dom checks for input-event support when it loads, so it needs a DOM first.
const bootstrap = new JSDOM("", { url: "http://localhost/" });
global.window = bootstrap.window;
global.document = bootstrap.window.document;
const { createRoot } = require("react-dom/client");
const { act } = React;

// The bundled component shares the test's search-intent store (globalThis.__searchIntent),
// so the test can see the intents it sets.
const sharedIntentStore = {
  name: "shared-intent-store",
  setup(build) {
    build.onResolve({ filter: /search-intent.mjs$/ }, () => ({ path: "search-intent", namespace: "shared" }));
    build.onLoad({ filter: /.*/, namespace: "shared" }, () => ({ contents: "module.exports = globalThis.__searchIntent;", loader: "js" }));
  }
};

async function component(file, exportName = "default") {
  globalThis.__searchIntent = await import("../lib/search-intent.mjs");
  const result = await require("esbuild").build({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime", "react-dom"],
    plugins: [sharedIntentStore]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

const fx = (effectId, name) => ({ effectId, name, attribute: null, skill: null, range: "target", magnitude: { min: 2, max: 20 }, durationSeconds: 1, areaFeet: 5 });
const CATALOGS = {
  Attributes: [], Skills: [], EffectRules: [], Enchantments: [], GameSettings: [],
  Travel: [{ from: "a", to: "b", mode: "silt_strider" }],
  Factions: [{ key: "mages guild", name: "Mages Guild", ranks: [{ name: "Associate" }] }],
  Ingredients: [{ key: "ingred_bread_01", id: "ingred_bread_01", name: "Bread", weight: 0.2, value: 1, effects: [{ slot: 0, effectId: 77, name: "Restore Fatigue" }] }],
  Spells: [{ key: "fireball", id: "fireball", name: "Fireball", type: "spell", cost: 5, effects: [fx(14, "Fire Damage")] }],
  Weapons: [], Armor: [], Clothing: [], Potions: [], Books: []
};
const loader = {
  async loadCatalog(profile, name) { return CATALOGS[name]; },
  async loadCatalogMetadata() { return { nodes: { a: { name: "Balmora" }, b: { name: "Vivec" } } }; }
};

const settle = () => act(async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); });

async function setup() {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/", pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true, writable: true });
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const copied = [];
  Object.defineProperty(dom.window.navigator, "clipboard", { value: { writeText: async text => { copied.push(text); } }, configurable: true });
  const SearchPalette = await component("components/search/search-palette.jsx");
  const { getSearchIntent, clearSearchIntent } = await import("../lib/search-intent.mjs");
  clearSearchIntent();
  const calls = { navigate: [], close: 0 };
  let setOpen;
  function Harness() {
    const [open, set] = React.useState(true);
    setOpen = set;
    return React.createElement(SearchPalette, {
      open, loader, profile: "vanilla",
      onClose: () => { calls.close += 1; set(false); },
      navigate: view => calls.navigate.push(view)
    });
  }
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(Harness)));
  await settle();
  const input = () => document.querySelector(".search-dialog input");
  const type = async text => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input(), text);
    await act(async () => input().dispatchEvent(new window.Event("input", { bubbles: true })));
    await settle();
  };
  const key = async (name, init = {}) => act(async () => input().dispatchEvent(new window.KeyboardEvent("keydown", { key: name, bubbles: true, ...init })));
  const options = () => [...document.querySelectorAll('[role="option"]')];
  const selected = () => document.querySelector('[role="option"][aria-selected="true"]');
  const cleanup = async () => { await act(async () => root.unmount()); dom.window.close(); };
  return { calls, copied, input, type, key, options, selected, getSearchIntent, setOpen: v => act(async () => setOpen(v)), cleanup };
}

test("the palette opens focused, lists the tools and filters as you type", async () => {
  const t = await setup();
  try {
    const dialog = document.querySelector('[role="dialog"]');
    assert.equal(dialog.getAttribute("aria-modal"), "true");
    assert.equal(document.activeElement, t.input(), "focus starts in the search field");
    assert.equal(document.querySelector("#root").inert, true, "the page behind is inert");
    assert.equal(t.options().length, 12, "an empty query lists every tool");
    assert.equal(t.input().getAttribute("aria-activedescendant"), t.selected().id);

    await t.type("balm");
    assert.deepEqual(t.options().map(o => o.querySelector(".search-option-title").textContent), ["Balmora"]);
    assert.equal(document.querySelector(".search-option-title mark").textContent, "Balm");
    assert.equal(document.querySelector(".search-card-title").textContent, "Balmora", "the details pane follows the active result");

    await t.type("qqqq");
    assert.match(document.querySelector(".search-empty").textContent, /No matches/);
  } finally { await t.cleanup(); }
});

test("Enter on a place hands the stop to the Travel Optimizer and closes", async () => {
  const t = await setup();
  try {
    await t.type("balmora");
    await t.key("Enter");
    assert.deepEqual(t.calls.navigate, ["travel"]);
    assert.equal(t.calls.close, 1);
    const intent = t.getSearchIntent();
    assert.deepEqual({ view: intent.view, kind: intent.kind, value: intent.value }, { view: "travel", kind: "destination", value: "Balmora" });
    assert.equal(document.querySelector(".search-dialog"), null);
    assert.equal(document.querySelector("#root").inert, false, "the page is usable again");
  } finally { await t.cleanup(); }
});

test("arrow keys move through results and wrap; ingredients go to Alchemy", async () => {
  const t = await setup();
  try {
    await t.type("b");
    const titles = t.options().map(o => o.textContent);
    assert.ok(titles.length >= 2);
    const first = t.selected().id;
    await t.key("ArrowUp");
    assert.equal(t.selected().id, t.options()[t.options().length - 1].id, "up from the top wraps to the end");
    await t.key("ArrowDown");
    assert.equal(t.selected().id, first);

    await t.type("bread");
    await t.key("Enter");
    assert.deepEqual(t.calls.navigate, ["alchemy"]);
    assert.equal(t.getSearchIntent().value, "ingred_bread_01");
  } finally { await t.cleanup(); }
});

test("spells copy their console command; Escape closes", async () => {
  const t = await setup();
  try {
    await t.type("fireball");
    assert.match(document.querySelector(".search-card-effects").textContent, /Fire Damage 2 to 20 pts/);
    await t.key("Enter");
    await settle();
    assert.deepEqual(t.copied, ['player->addspell "fireball"']);
    assert.deepEqual(t.calls.navigate, [], "nothing to open");
    assert.equal(t.calls.close, 0);

    await t.key("Escape");
    assert.equal(t.calls.close, 1);
  } finally { await t.cleanup(); }
});

test("filter chips narrow the results", async () => {
  const t = await setup();
  try {
    const chip = label => [...document.querySelectorAll(".search-chips button")].find(b => b.textContent === label);
    await act(async () => chip("Factions").click());
    assert.equal(chip("Factions").getAttribute("aria-pressed"), "true");
    assert.deepEqual(t.options().map(o => o.querySelector(".search-option-title").textContent), ["Mages Guild"], "an empty query browses the group");
    await t.key("Enter");
    assert.deepEqual(t.calls.navigate, ["factions"]);
  } finally { await t.cleanup(); }
});

test("Ctrl+K and / open search from the header; / in a field is left alone", async () => {
  const dom = new JSDOM('<div id="root"></div><input id="field">', { url: "http://localhost/", pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true, writable: true });
  global.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.scrollTo = () => {};
  const SiteHeader = await component("components/site-header.jsx");
  const shell = { ready: true, world: "vanilla", arce: false, profile: "vanilla", view: "home", navigate: () => {}, setProfile: () => {} };
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(SiteHeader, { shell })));
  const warn = console.warn;
  console.warn = () => {}; // the header's palette uses the real loader, which has no server here
  const press = (target, init) => act(async () => target.dispatchEvent(new dom.window.KeyboardEvent("keydown", { bubbles: true, ...init })));
  try {
    const trigger = document.querySelector(".search-trigger");
    assert.equal(trigger.getAttribute("aria-haspopup"), "dialog");
    assert.equal(document.querySelector(".search-dialog"), null);

    await press(document.getElementById("field"), { key: "/" });
    assert.equal(document.querySelector(".search-dialog"), null, "typing / in a field does not open search");

    await press(document.body, { key: "/" });
    assert.ok(document.querySelector(".search-dialog"), "/ opens search");
    await press(document.body, { key: "k", ctrlKey: true });
    assert.equal(document.querySelector(".search-dialog"), null, "Ctrl+K toggles it closed");
    await press(document.body, { key: "k", metaKey: true });
    assert.ok(document.querySelector(".search-dialog"), "Cmd+K opens it");
    await act(async () => document.querySelector(".search-close").click());
    assert.equal(document.querySelector(".search-dialog"), null);

    await act(async () => trigger.click());
    assert.ok(document.querySelector(".search-dialog"), "the header button opens it");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    console.warn = warn;
  }
});
