const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;

function component(file, exportName = "default") {
  const result = require("esbuild").buildSync({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

async function renderHeader(shellOverrides = {}) {
  const dom = new JSDOM('<div id="root"></div><div class="account-bar"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.scrollTo = () => {};
  const navigated = [];
  const shell = { ready: true, world: "vanilla", arce: false, profile: "vanilla", view: "home", navigate: v => navigated.push(v), setProfile: () => {}, ...shellOverrides };
  const SiteHeader = component("components/site-header.jsx");
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(SiteHeader, { shell })));
  const tabs = [...document.querySelectorAll("nav.phone-tabs > button")];
  const cleanup = async () => { await act(async () => root.unmount()); dom.window.close(); };
  return { dom, shell, navigated, tabs, cleanup };
}

test("the phone tab bar offers the most used tools and a menu", async () => {
  const { tabs, cleanup } = await renderHeader();
  try {
    assert.deepEqual(tabs.map(t => t.textContent), ["Home", "Build", "Level", "Alchemy", "Menu"]);
    assert.equal(document.querySelector("nav.phone-tabs").getAttribute("aria-label"), "Main");
    assert.ok(tabs.every(t => t.getAttribute("type") === "button"));
    assert.equal(tabs[0].getAttribute("aria-current"), "page", "the current view is marked");
    assert.ok(tabs.slice(1).every(t => !t.hasAttribute("aria-current")));
  } finally { await cleanup(); }
});

test("tabs navigate, and the menu tab opens and closes the drawer", async () => {
  const { tabs, navigated, cleanup } = await renderHeader({ view: "builder" });
  try {
    await act(async () => tabs[3].click());
    assert.deepEqual(navigated, ["alchemy"]);

    const drawer = document.getElementById("react-menu-drawer");
    const menu = tabs[4];
    assert.equal(menu.getAttribute("aria-expanded"), "false");
    await act(async () => menu.click());
    assert.equal(drawer.classList.contains("open"), true, "the menu tab opens the drawer");
    assert.equal(menu.getAttribute("aria-expanded"), "true");
    assert.equal(menu.textContent, "Close");
    assert.equal(document.querySelector(".hamburger").getAttribute("aria-expanded"), "true", "the header button reflects the same state");

    await act(async () => menu.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
    assert.equal(drawer.classList.contains("open"), false, "the document click listener does not reopen or trap it");
    assert.equal(menu.textContent, "Menu");
  } finally { await cleanup(); }
});

test("pages reached through the menu light up the menu tab", async () => {
  const { tabs, cleanup } = await renderHeader({ view: "travel" });
  try {
    assert.ok(tabs.slice(0, 4).every(t => !t.hasAttribute("aria-current")));
    assert.equal(tabs[4].getAttribute("data-section"), "true");
  } finally { await cleanup(); }
});

test("planner tabs wait for the shell, the menu tab never does", async () => {
  const { tabs, navigated, cleanup } = await renderHeader({ ready: false });
  try {
    assert.ok(tabs.slice(0, 4).every(t => t.disabled), "planner tabs are disabled until the shell is ready");
    assert.equal(tabs[4].disabled, false, "the menu stays reachable");
    await act(async () => tabs[0].click());
    assert.deepEqual(navigated, []);
  } finally { await cleanup(); }
});

test("the top bar offers all three worlds, TR + ARCE included, from any of them", async () => {
  const picked = [];
  const { cleanup } = await renderHeader({ profile: "vanilla", world: "vanilla", arce: false, setProfile: (p) => picked.push(p) });
  try {
    const worlds = () => [...document.querySelectorAll('.world-bar .seg [aria-pressed]')];
    assert.deepEqual(worlds().map((b) => b.textContent), ["Vanilla", "Tamriel Rebuilt", "TR + ARCE"], "no need to pick Tamriel Rebuilt first");
    assert.deepEqual(worlds().map((b) => b.getAttribute("aria-pressed")), ["true", "false", "false"]);
    assert.equal(document.getElementById("react-arce"), null, "the old ARCE add-on toggle is gone");
    await act(async () => worlds()[2].click());
    await act(async () => worlds()[0].click());
    assert.deepEqual(picked, ["tr_arce"], "the current world is not picked again");
  } finally { await cleanup(); }

  const again = await renderHeader({ profile: "tr_arce", world: "tr", arce: true });
  try {
    const pressed = [...document.querySelectorAll('.world-bar .seg [aria-pressed="true"]')].map((b) => b.textContent);
    assert.deepEqual(pressed, ["TR + ARCE"], "TR + ARCE is shown as its own world, not as Tamriel Rebuilt");
  } finally { await again.cleanup(); }
});
