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
const { act } = React;

const theme = () => import("../lib/theme.mjs");

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

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

test("Ashfall is the default and anything unknown falls back to it", async () => {
  const T = await theme();
  assert.equal(T.DEFAULT_THEME, "ashfall");
  assert.equal(T.normalizeTheme("morrowind"), "morrowind");
  for (const bad of [null, undefined, "", "light", "constructor", "__proto__", 42]) assert.equal(T.normalizeTheme(bad), "ashfall", String(bad));
  assert.equal(T.otherTheme("ashfall"), "morrowind");
  assert.equal(T.otherTheme("morrowind"), "ashfall");
  assert.equal(T.otherTheme("nonsense"), "morrowind", "unknown reads as Ashfall, so the other one is Morrowind");
  assert.equal(T.readStoredTheme(memoryStorage({ "silt-theme": "morrowind" })), "morrowind");
  assert.equal(T.readStoredTheme({ getItem() { throw new Error("denied"); } }), "ashfall");
});

test("the inline script applies the stored theme before anything renders", async () => {
  const T = await theme();
  const run = setup => {
    const dom = new JSDOM("<!doctype html><html data-theme=\"ashfall\"><head></head><body></body></html>", { url: "http://localhost/", runScripts: "outside-only" });
    setup?.(dom.window);
    dom.window.eval(T.THEME_INIT_SCRIPT);
    const value = dom.window.document.documentElement.getAttribute("data-theme");
    dom.window.close();
    return value;
  };
  assert.equal(run(), "ashfall", "nothing stored");
  assert.equal(run(w => w.localStorage.setItem("silt-theme", "morrowind")), "morrowind");
  assert.equal(run(w => w.localStorage.setItem("silt-theme", "ashfall")), "ashfall");
  assert.equal(run(w => w.localStorage.setItem("silt-theme", "<script>")), "ashfall", "a tampered value is ignored");
  assert.equal(run(w => Object.defineProperty(w, "localStorage", { get() { throw new Error("blocked"); } })), "ashfall", "storage blocked");
  assert.ok(T.THEME_INIT_SCRIPT.length < 400, "small enough to inline");
});

function fakeDoc(themeName = "ashfall") {
  const dom = new JSDOM(`<html data-theme="${themeName}"><body></body></html>`, { url: "http://localhost/", pretendToBeVisual: true });
  return dom.window.document;
}

test("setTheme applies, remembers and notifies", async () => {
  const T = await theme();
  const doc = fakeDoc();
  const storage = memoryStorage();
  let notified = 0;
  const off = T.subscribeTheme(() => { notified += 1; });
  try {
    assert.equal(T.setTheme("morrowind", { doc, storage, animate: false }), "morrowind");
    assert.equal(doc.documentElement.getAttribute("data-theme"), "morrowind");
    assert.equal(storage.data["silt-theme"], "morrowind");
    assert.ok(notified > 0);
    assert.equal(T.toggleTheme({ doc, storage, animate: false }), "ashfall");
    assert.equal(doc.documentElement.getAttribute("data-theme"), "ashfall");

    const blocked = { setItem() { throw new Error("quota"); } };
    assert.equal(T.setTheme("morrowind", { doc, storage: blocked, animate: false }), "morrowind", "a full or blocked storage still switches");
    assert.equal(doc.documentElement.getAttribute("data-theme"), "morrowind");
    T.setTheme("ashfall", { doc, storage, animate: false });
  } finally { off(); }
});

test("the cross-fade path: late and missing callbacks cannot desync the theme", async () => {
  const T = await theme();
  const doc = fakeDoc();
  const storage = memoryStorage();
  const queued = [];
  doc.startViewTransition = cb => { queued.push(cb); return {}; };
  const win = { matchMedia: () => ({ matches: false }), setTimeout: (fn) => { queued.fallbacks = (queued.fallbacks || []).concat(fn); } };

  T.setTheme("morrowind", { doc, storage, win });
  assert.equal(doc.documentElement.getAttribute("data-theme"), "ashfall", "the page waits for the transition");
  assert.equal(T.getTheme(doc), "morrowind", "the store already reports the new theme");
  assert.equal(storage.data["silt-theme"], "morrowind");

  T.setTheme("ashfall", { doc, storage, win });
  assert.equal(T.getTheme(doc), "ashfall");
  queued[0]();
  assert.equal(doc.documentElement.getAttribute("data-theme"), "ashfall", "the stale first callback does nothing");
  queued[1]();
  assert.equal(doc.documentElement.getAttribute("data-theme"), "ashfall");

  T.setTheme("morrowind", { doc, storage, win });
  queued.fallbacks.at(-1)();
  assert.equal(doc.documentElement.getAttribute("data-theme"), "morrowind", "the fallback switches when the callback never comes");
  queued[2]();
  assert.equal(doc.documentElement.getAttribute("data-theme"), "morrowind");

  const reduced = { matchMedia: () => ({ matches: true }), setTimeout() {} };
  T.setTheme("ashfall", { doc, storage, win: reduced });
  assert.equal(doc.documentElement.getAttribute("data-theme"), "ashfall", "reduced motion switches at once");
  assert.equal(queued.length, 3, "and starts no transition");

  Object.defineProperty(doc, "visibilityState", { value: "hidden", configurable: true });
  T.setTheme("morrowind", { doc, storage, win });
  assert.equal(doc.documentElement.getAttribute("data-theme"), "morrowind", "a hidden tab switches at once");
  assert.equal(queued.length, 3);
});

test("the J shortcut fires only for a plain J outside text fields", async () => {
  const T = await theme();
  const dom = new JSDOM('<input id="text"><input id="check" type="checkbox"><textarea id="area"></textarea><select id="sel"></select><div id="edit" contenteditable="true"><span id="inner">x</span></div><button id="btn"></button>', { url: "http://localhost/" });
  const el = id => dom.window.document.getElementById(id);
  const ev = (init, target = dom.window.document.body) => ({ key: "j", ctrlKey: false, metaKey: false, altKey: false, repeat: false, defaultPrevented: false, target, ...init });
  assert.equal(T.isThemeShortcut(ev({})), true);
  assert.equal(T.isThemeShortcut(ev({ key: "J" })), true, "with Shift or Caps Lock too");
  assert.equal(T.isThemeShortcut(ev({}, el("btn"))), true, "a focused button is not typing");
  assert.equal(T.isThemeShortcut(ev({}, el("check"))), true);
  for (const id of ["text", "area", "sel", "edit", "inner"]) assert.equal(T.isThemeShortcut(ev({}, el(id))), false, id);
  for (const mod of ["ctrlKey", "metaKey", "altKey", "repeat", "defaultPrevented"]) assert.equal(T.isThemeShortcut(ev({ [mod]: true })), false, mod);
  assert.equal(T.isThemeShortcut(ev({ key: "k" })), false);
  assert.equal(T.isThemeShortcut(null), false);
  dom.window.close();
});

async function renderToggle(initialTheme) {
  const dom = new JSDOM(`<html data-theme="${initialTheme}"><body><div id="root"></div><input id="field"></body></html>`, { url: "http://localhost/", pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const ThemeToggle = component("components/theme-toggle.jsx");
  const ThemeProvider = component("components/theme-provider.jsx", "ThemeProvider");
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(ThemeProvider, null, React.createElement(ThemeToggle))));
  const button = () => document.querySelector(".theme-toggle");
  const html = () => document.documentElement.getAttribute("data-theme");
  const cleanup = async () => { await act(async () => root.unmount()); dom.window.close(); };
  return { dom, button, html, cleanup };
}

test("the toggle names its action and current theme, and switches on click", async () => {
  const t = await renderToggle("ashfall");
  try {
    const b = t.button();
    assert.equal(b.getAttribute("type"), "button");
    assert.equal(b.getAttribute("aria-keyshortcuts"), "J");
    assert.equal(b.getAttribute("aria-label"), "Switch to Morrowind UI (current theme: Modern UI). Shortcut: J");
    assert.ok([...b.querySelectorAll(".theme-toggle-face, .theme-toggle-tip")].every(el => el.getAttribute("aria-hidden") === "true"), "the visible faces do not double the name");
    assert.match(b.querySelector(".theme-toggle-tip").textContent, /Toggle theme J/);
    assert.ok(b.querySelector(".theme-toggle-face--to-morrowind svg mask"), "the Moon-and-Star sigil");

    await act(async () => b.click());
    assert.equal(t.html(), "morrowind");
    assert.equal(window.localStorage.getItem("silt-theme"), "morrowind");
    assert.equal(b.getAttribute("aria-label"), "Switch to Modern UI (current theme: Morrowind UI). Shortcut: J");
    assert.equal(b.dataset.nextTheme, "ashfall");
  } finally { await t.cleanup(); }
});

test("the provider's J shortcut toggles the theme but leaves typing alone", async () => {
  const t = await renderToggle("morrowind");
  try {
    assert.match(t.button().getAttribute("aria-label"), /Switch to Modern UI/, "reads the theme the inline script set");
    const press = async (target, init = {}) => act(async () => target.dispatchEvent(new window.KeyboardEvent("keydown", { key: "j", bubbles: true, cancelable: true, ...init })));
    await press(document.body);
    assert.equal(t.html(), "ashfall");
    await press(document.getElementById("field"));
    assert.equal(t.html(), "ashfall", "J typed in a field is text");
    await press(document.body, { metaKey: true });
    assert.equal(t.html(), "ashfall");
    await press(document.body, { key: "J" });
    assert.equal(t.html(), "morrowind");
  } finally { await t.cleanup(); }
});

test("Ashfall re-values every color token, so nothing falls back to the classic palette", () => {
  const base = fs.readFileSync(path.join(__dirname, "..", "app", "theme.css"), "utf8");
  const ashfall = fs.readFileSync(path.join(__dirname, "..", "app", "theme-ashfall.css"), "utf8");
  const block = ashfall.slice(ashfall.indexOf(':root[data-theme="ashfall"] {'), ashfall.indexOf("}", ashfall.indexOf(':root[data-theme="ashfall"] {')));
  const names = css => [...css.matchAll(/(--(?:color|gradient)-[a-z0-9-]+)\s*:/g)].map(m => m[1]);
  const missing = [...new Set(names(base))].filter(name => !names(block).includes(name));
  assert.deepEqual(missing, []);
  assert.ok(names(base).length > 100);
  const layout = fs.readFileSync(path.join(__dirname, "..", "app", "layout.jsx"), "utf8");
  assert.match(layout, /data-theme=\{DEFAULT_THEME\}/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(layout, /THEME_INIT_SCRIPT/);
  assert.ok(layout.indexOf("theme-ashfall.css") > layout.indexOf("globals.css"), "Ashfall loads after the base styles");
});
