const { test } = require("node:test");
require('./helpers/pending-game-data.cjs');
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
// react-dom checks for input-event support when it loads, so it needs a DOM first;
// without one, typing into a field never reaches onChange.
const bootstrap = new JSDOM("", { url: "http://localhost/" });
global.window = bootstrap.window;
global.document = bootstrap.window.document;
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
    external: ["react", "react/jsx-runtime", "next/script"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return exportName === "default" ? (m.exports.default || m.exports) : m.exports[exportName];
}

const SiteFooter = component("components/site-footer.jsx");
const AppShell = component("components/app-shell.jsx");

for (const id of ['c-race', 'maj0', 'btn-to-optimizer']) test(`challenge handoff ignores retired control ${id}`, async () => {
  const dom = setupDom('/challenge');
  const stale = document.createElement(id === 'btn-to-optimizer' ? 'button' : 'input');
  stale.id = id; stale.value = 'untouched';
  document.body.append(stale);
  let events = 0;
  stale.addEventListener('change', () => events++);
  stale.addEventListener('click', () => events++);
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    const send = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Send to Character Builder'));
    assert.ok(send);
    await act(async () => send.click());
    assert.equal(stale.value, 'untouched');
    assert.equal(events, 0);
    assert.equal(dom.window.location.pathname, '/builder');
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});

test("every shell destination has an exported page for reloads and bookmarks", async () => {
  const { KNOWN_VIEWS } = await import('../lib/permalink-codec.mjs');
  for (const view of KNOWN_VIEWS) {
    const file = view === 'home' ? 'app/page.jsx' : `app/${view}/page.jsx`;
    assert.ok(require('node:fs').existsSync(file), `Missing route: ${view}`);
  }
});

for (const [name, location, blocked] of [
  ['query profile', '/alchemy?world=tr&arce=1&campaign=test', false],
  ['irrelevant fragment', '/alchemy?world=tr&arce=1&campaign=test#ignored', false],
  ['unavailable storage', '/alchemy?world=tr&arce=1&campaign=test', true],
]) test(`world selection overrides ${name} without losing unrelated parameters`, async () => {
  const dom = setupDom(location);
  if (blocked) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('blocked'); } });
  const { ShellProvider, useShell } = component('components/shell-context.jsx');
  let shell;
  function Probe() { shell = useShell(); return null; }
  const root = createRoot(dom.window.document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(ShellProvider, null, React.createElement(Probe))));
    assert.equal(shell.profile, 'tr_arce');
    assert.equal(shell.view, 'alchemy');
    await act(async () => shell.setProfile('vanilla'));
    assert.equal(shell.profile, 'vanilla');
    assert.equal(new URLSearchParams(dom.window.location.search).get('campaign'), 'test');
    await act(async () => shell.setProfile('tr'));
    assert.equal(shell.profile, 'tr');
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});

test('navigation preserves a profile opened through query parameters', async () => {
  const dom = setupDom('/alchemy?world=tr&arce=1');
  const { ShellProvider, useShell } = component('components/shell-context.jsx');
  let shell;
  function Probe() { shell = useShell(); return null; }
  const root = createRoot(dom.window.document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(ShellProvider, null, React.createElement(Probe))));
    await act(async () => shell.navigate('account'));
    assert.equal(shell.view, 'account');
    assert.equal(shell.profile, 'tr_arce');
    assert.equal(dom.window.location.pathname, '/account');
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});

function setupDom(initialLocation = "#home") {
  const url = initialLocation.startsWith("http")
    ? initialLocation
    : "http://localhost:8765" + (initialLocation.startsWith("/") || initialLocation.startsWith("#") ? initialLocation : "/" + initialLocation);
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
    url
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.MutationObserver = dom.window.MutationObserver;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  return dom;
}

test("SiteFooter renders authentic disclaimer and handles navigation clicks", async () => {
  const dom = setupDom("/");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  const { ShellProvider } = component("components/shell-context.jsx");

  try {
    await act(async () => {
      root.render(
        React.createElement(
          ShellProvider,
          null,
          React.createElement(SiteFooter)
        )
      );
    });

    const footer = dom.window.document.querySelector("footer.site-footer");
    assert.ok(footer, "site-footer element must exist");
    assert.match(footer.textContent, /Unofficial fan project/);

    const aboutLink = dom.window.document.getElementById("link-about-footer");
    const changelogLink = dom.window.document.getElementById("link-changelog-footer");
    assert.ok(aboutLink, "link-about-footer must exist");
    assert.ok(changelogLink, "link-changelog-footer must exist");

    await act(async () => {
      aboutLink.click();
    });
    assert.equal(dom.window.location.pathname, "/about");
    assert.equal(dom.window.location.hash, "");

    await act(async () => {
      changelogLink.click();
    });
    assert.equal(dom.window.location.pathname, "/changelog");
    assert.equal(dom.window.location.hash, "");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("AppShell mounts cleanly and renders semantic panels for all 12 views", async () => {
  const dom = setupDom("/");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // Verify main container
    const main = dom.window.document.querySelector("main.site-main");
    assert.ok(main, "main.site-main must be rendered");

    // Verify all 12 semantic panel sections are present in the DOM
    const expectedPanels = [
      "panel-home",
      "panel-build",
      "panel-challenge",
      "panel-leveler",
      "panel-factions",
      "panel-enchant",
      "panel-spell",
      "panel-alchemy",
      "panel-travel",
      "panel-vault",
      "panel-about",
      "panel-changelog"
    ];

    for (const panelId of expectedPanels) {
      const panel = dom.window.document.getElementById(panelId);
      assert.ok(panel, `Panel #${panelId} must exist in AppShell`);
      assert.ok(panel.classList.contains("panel"), `Panel #${panelId} must have 'panel' class`);
    }

    // Default view is 'home': #panel-home should have 'show' class and not be hidden
    const homePanel = dom.window.document.getElementById("panel-home");
    assert.ok(homePanel.classList.contains("show"));
    assert.equal(homePanel.hasAttribute("hidden"), false);

    // Other panels must be hidden
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.equal(buildPanel.hasAttribute("hidden"), true);
    assert.equal(buildPanel.classList.contains("show"), false);

    // Body class must synchronize with the active view
    assert.ok(dom.window.document.body.classList.contains("view-home"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("AppShell updates active panel and body class on hash navigation", async () => {
  const dom = setupDom("/");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // Simulate navigation to #builder
    await act(async () => {
      dom.window.history.pushState(null, "", "/builder");
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });

    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.ok(buildPanel.classList.contains("show"), "panel-build should now be shown");
    assert.equal(buildPanel.hasAttribute("hidden"), false);
    assert.ok(dom.window.document.body.classList.contains("view-builder"));

    const homePanel = dom.window.document.getElementById("panel-home");
    assert.equal(homePanel.hasAttribute("hidden"), true);
    assert.equal(homePanel.classList.contains("show"), false);

    // Simulate navigation to #factions
    await act(async () => {
      dom.window.history.pushState(null, "", "/factions");
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });

    const factionsPanel = dom.window.document.getElementById("panel-factions");
    assert.ok(factionsPanel.classList.contains("show"), "panel-factions should now be shown");
    assert.equal(factionsPanel.hasAttribute("hidden"), false);
    assert.ok(dom.window.document.body.classList.contains("view-factions"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

// Adversarial Edge-Case Tests (Rule 3)
test("Adversarial QA 1: Unknown or invalid hash defaults safely to 'home' without crashing", async () => {
  const dom = setupDom("#invalid_tool_view_404");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    const homePanel = dom.window.document.getElementById("panel-home");
    assert.ok(homePanel.classList.contains("show"), "Invalid view must default to showing #panel-home");
    assert.equal(homePanel.hasAttribute("hidden"), false);
    assert.ok(dom.window.document.body.classList.contains("view-home"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial QA 2: Rapid successive view changes maintain state consistency", async () => {
  const dom = setupDom("/");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // Rapidly switch through multiple tools
    const views = ["builder", "challenge", "leveler", "factions", "alchemy", "travel", "about"];
    for (const view of views) {
      await act(async () => {
        dom.window.history.pushState(null, "", "/" + view);
        dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
      });
    }

    // After rapid barrage, the final view (about) must be the only active one
    const aboutPanel = dom.window.document.getElementById("panel-about");
    assert.ok(aboutPanel.classList.contains("show"), "Final view (#panel-about) must be shown");
    assert.equal(aboutPanel.hasAttribute("hidden"), false);
    assert.ok(dom.window.document.body.classList.contains("view-about"));

    // Exactly one panel should have class 'show'
    const shownPanels = dom.window.document.querySelectorAll(".panel.show");
    assert.equal(shownPanels.length, 1, "Exactly one panel must have 'show' class");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial QA 3: Inactive panels do not render child content", async () => {
  const dom = setupDom("/");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // While #home is active, #panel-build should not have rendered CharacterBuilderRoot
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.equal(buildPanel.querySelector(".character-builder-root"), null);

    // Switch to #builder
    await act(async () => {
      dom.window.history.pushState(null, "", "/builder");
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });

    // Now CharacterBuilderRoot should be rendered inside #panel-build
    assert.ok(buildPanel.querySelector(".character-builder-root"));

    // And HomeHubRoot should no longer be rendered inside #panel-home
    const homePanel = dom.window.document.getElementById("panel-home");
    assert.equal(homePanel.querySelector(".home-hub-root"), null);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: Send to Build Optimizer transfers rolled character into CharacterContext and switches to #builder", async () => {
  const dom = setupDom("/challenge");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    const challengePanel = dom.window.document.getElementById("panel-challenge");
    assert.ok(challengePanel.classList.contains("show"), "panel-challenge must be shown initially");

    // Click Generate Run
    const genBtn = dom.window.document.getElementById("react-btn-generate-run");
    assert.ok(genBtn, "#react-btn-generate-run button must exist");

    await act(async () => {
      genBtn.click();
    });

    // Verify identity heading has been rolled (not "Not rolled yet")
    const overviewHeading = challengePanel.querySelector(".character-overview-card h3");
    assert.ok(overviewHeading, "character-overview-card heading must exist");
    assert.doesNotMatch(overviewHeading.textContent, /Not rolled yet/i);

    // Find and click Send to Build Optimizer button
    const sendBtn = dom.window.document.getElementById("react-btn-to-optimizer");
    assert.ok(sendBtn, "#react-btn-to-optimizer button must exist");

    await act(async () => {
      sendBtn.click();
    });

    // Pathname must navigate to /builder
    assert.equal(dom.window.location.pathname, "/builder");
    assert.equal(dom.window.location.hash, "");

    // Active panel must now be #panel-build
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.ok(buildPanel.classList.contains("show"), "panel-build must be shown after transfer");
    assert.equal(challengePanel.classList.contains("show"), false);

    // Character builder must be mounted
    const builderRoot = buildPanel.querySelector(".character-builder-root");
    assert.ok(builderRoot, "character-builder-root must be rendered");

    // The selects inside configurator must match the transferred character identity
    const selects = buildPanel.querySelectorAll("select");
    assert.ok(selects.length > 0, "builder configurator selects must be present");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: the run survives a trip to the Build Optimizer and back, and a reload", async () => {
  const dom = setupDom("/challenge");
  const container = dom.window.document.getElementById("root");
  let root = createRoot(container);
  const summary = () => {
    const panel = dom.window.document.getElementById("panel-challenge");
    return [...panel.querySelectorAll(".character-overview-card h3, .run-summary-sheet li")].map((el) => el.textContent).join("|");
  };
  const go = async (hash) => {
    await act(async () => {
      dom.window.history.pushState(null, "", hash);
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
      await new Promise((r) => setTimeout(r, 0));
    });
  };

  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await act(async () => dom.window.document.getElementById("react-btn-generate-run").click());
    const rolled = summary();
    assert.doesNotMatch(rolled, /Not rolled yet/i);

    await act(async () => dom.window.document.getElementById("react-btn-to-optimizer").click());
    assert.equal(dom.window.location.pathname, "/builder");
    await go("/challenge");
    assert.equal(summary(), rolled, "the same run is waiting on return");

    const stored = JSON.parse(dom.window.localStorage.getItem("silt-challenge-run"));
    assert.equal(stored.run.seed.length > 0, true, "the run is kept in this browser");

    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(React.createElement(AppShell)));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    assert.equal(summary(), rolled, "a reload restores it");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: Generate keeps to the ticked difficulty bands (no Hard or Grind by default)", async () => {
  const dom = setupDom("/challenge");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    const panel = dom.window.document.getElementById("panel-challenge");
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
      await act(async () => dom.window.document.getElementById("react-btn-generate-run").click());
      for (const li of panel.querySelectorAll(".restrictions-tablet li")) seen.add(li.querySelector("span").textContent);
      assert.doesNotMatch(panel.querySelector(".major-objective-plaque").textContent, /Reach level 50/);
    }
    assert.deepEqual([...seen].sort(), ["Easy", "Medium"], "Standard ticks Easy and Medium only");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("The character sheet's Level Optimizer button opens the Level Simulator", async () => {
  const dom = setupDom("/builder");
  const root = createRoot(dom.window.document.getElementById("root"));
  // One bundle, so the sheet and the provider share a single shell context.
  const bundled = require("esbuild").buildSync({
    stdin: {
      contents: 'export { ShellProvider } from "./components/shell-context.jsx"; export { default as CharacterSheet } from "./components/character-builder/character-sheet.jsx";',
      resolveDir: path.resolve("."), loader: "jsx"
    },
    bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/jsx-runtime"]
  });
  const m = new Module(path.resolve("sheet-bundle.js"), module);
  m.paths = module.paths;
  m._compile(bundled.outputFiles[0].text, path.resolve("sheet-bundle.js"));
  const { ShellProvider, CharacterSheet } = m.exports;
  const { computeSheet } = await import("../lib/character-math.mjs");
  const attrs = { Strength: 40, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 40, Personality: 30, Luck: 40 };
  const catalogs = {
    skills: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor", "Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
    specSkills: { Combat: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"], Magic: ["Destruction", "Restoration"], Stealth: ["Short Blade", "Sneak", "Security"] },
    races: { "Dark Elf": { M: attrs, F: attrs, skills: {}, mag: 0 } },
    signs: { "The Lady": { mag: 0, attrs: {} } },
    raceSpells: {}, signSpells: {}
  };
  const build = {
    race: "Dark Elf", gender: "Male", sign: "The Lady", className: "Custom", spec: "Combat", fav1: "Strength", fav2: "Endurance",
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"], min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"]
  };
  try {
    await act(async () => root.render(React.createElement(ShellProvider, null,
      React.createElement(CharacterSheet, { build, sheet: computeSheet(build, catalogs), catalogs }))));
    await act(async () => dom.window.document.getElementById("btn-sheet-leveler").click());
    assert.equal(dom.window.location.pathname, "/leveler");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Go-to buttons navigate: Back to Character Builder, and the vault's shortcuts", async () => {
  const dom = setupDom("/leveler");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);
  const settle = () => act(async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); });
  const button = (text) => [...dom.window.document.querySelectorAll("main button")].find((b) => b.textContent.trim() === text);
  const press = async (text) => {
    const el = button(text);
    assert.ok(el, `"${text}" exists`);
    await act(async () => el.click());
    await settle();
  };
  const go = async (hash) => {
    await act(async () => {
      dom.window.history.pushState(null, "", hash);
      dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));
    });
    await settle();
  };
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
    await press("← Back to Character Builder");
    assert.equal(dom.window.location.pathname, "/builder");

    await go("/vault");
    await press("Level Simulator →");
    assert.equal(dom.window.location.pathname, "/leveler");
    await go("/vault");
    await press("← Character Builder");
    assert.equal(dom.window.location.pathname, "/builder");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs has one row of difficulty presets, beside the settings, and it says which is on (CHL-1)", async () => {
  const dom = setupDom("/challenge");
  const root = createRoot(dom.window.document.getElementById("root"));
  const doc = dom.window.document;
  const NAMES = ["Standard", "Hardcore", "Cursed", "Custom"];
  const presets = () => [...doc.querySelectorAll("main button")].filter((b) => NAMES.includes(b.textContent.trim()));
  const pressed = () => presets().filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent.trim());
  const pick = async (id, value) => {
    const select = doc.getElementById(id);
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, "value").set.call(select, value);
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    assert.deepEqual(presets().map((b) => b.textContent.trim()), NAMES, "each preset once");
    const group = presets()[0].closest('[role="group"]');
    assert.equal(doc.getElementById(group.getAttribute("aria-labelledby")).textContent.trim(), "Difficulty Preset");
    assert.ok(group.closest(".run-configurator"), "the row sits with the counts and bands a preset sets");
    assert.deepEqual([...doc.querySelectorAll(".seed-bar-panel button")].map((b) => b.textContent.trim()), ["Load", "Share"], "the seed bar keeps to the seed");

    assert.deepEqual(pressed(), ["Standard"], "one preset is on, and it says so");
    await act(async () => presets()[1].click());
    assert.deepEqual(pressed(), ["Hardcore"]);
    assert.equal(doc.getElementById("cfg-rest-count").value, "4", "Hardcore's restrictions apply");
    assert.equal(doc.getElementById("cfg-obj-count").value, "3", "and its objectives");

    await pick("cfg-rest-count", "1");
    assert.deepEqual(pressed(), ["Custom"], "a count picked by hand makes the run Custom");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: the seed box shows the run's seed, and loading it under other settings rolls the same run", async () => {
  const dom = setupDom("/challenge");
  const root = createRoot(dom.window.document.getElementById("root"));
  const doc = dom.window.document;
  const sheet = () => doc.querySelector(".run-summary-sheet").textContent;
  const button = (text) => [...doc.querySelectorAll("main button")].find((b) => b.textContent.trim() === text);
  const load = async (value) => {
    const input = doc.getElementById("challenge-seed-input");
    await act(async () => {
      input.value = value;
      input._valueTracker?.setValue("");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => [...input.form.querySelectorAll("button")].find((el) => el.textContent.trim() === "Load").click());
  };
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await act(async () => doc.getElementById("react-btn-generate-run").click());
    const seed = doc.getElementById("challenge-seed-input").value;
    assert.match(seed, /^[2-9A-Z]{5}-VANILLA-EM-R3O2$/, "Standard settings are in the seed");
    const rolled = sheet();

    await act(async () => button("Hardcore").click());
    await act(async () => doc.getElementById("react-btn-generate-run").click());
    assert.notEqual(sheet(), rolled);

    await load(seed.toLowerCase());
    assert.equal(sheet(), rolled, "the seed brings the run back under Hardcore settings");
    assert.equal(doc.getElementById("challenge-seed-input").value, seed);
    assert.ok(button("Standard").className.includes("active"), "and the settings it was rolled with");

    await load("not a seed");
    assert.match(doc.getElementById("challenge-seed-note").textContent, /not a Silt Strider seed/);
    assert.equal(sheet(), rolled, "a bad seed changes nothing");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: Share copies a link that opens the same run, in its world", async () => {
  const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); });
  let dom = setupDom("/challenge?world=tr&arce=0");
  let root = createRoot(dom.window.document.getElementById("root"));
  // The sheet's cards; the Copy Permalink button reads "Copied" for a moment after sharing.
  const sheet = () => dom.window.document.querySelector(".run-summary-sheet").textContent.replace(/Copied$/, "Copy Permalink");
  let copied = null;
  try {
    // Node has its own navigator global; the page reads whichever one is in scope.
    const clipboard = (value) => {
      for (const nav of [dom.window.navigator, globalThis.navigator]) Object.defineProperty(nav, "clipboard", { configurable: true, value });
    };
    clipboard({ writeText: async (text) => { copied = text; } });
    await act(async () => root.render(React.createElement(AppShell)));
    await act(async () => dom.window.document.getElementById("react-btn-generate-run").click());
    // A single-card reroll: the seed alone no longer makes this run, the link must carry it.
    await act(async () => dom.window.document.querySelector('[title="Roll another major objective"]').click());
    assert.match(dom.window.document.getElementById("challenge-seed-note").textContent, /seed alone rolls a different run/);
    await act(async () => [...dom.window.document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Share").click());
    await settle();
    assert.match(copied, /^http:\/\/localhost:8765\/challenge\?world=tr&arce=0&run=[A-Za-z0-9_-]+$/);
    const shared = sheet();
    await act(async () => root.unmount());
    dom.window.close();

    // Someone else opens the link: no stored run, a different device.
    dom = setupDom(copied);
    root = createRoot(dom.window.document.getElementById("root"));
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
    assert.equal(sheet(), shared, "the link opens the same run");
    assert.equal(dom.window.localStorage.getItem('mw-world'), 'tr', 'consuming the run link preserves its profile');
    assert.equal(dom.window.location.pathname, "/challenge");
    assert.equal(dom.window.location.hash, "", "hash is stripped from the address bar");

    // Without a clipboard, the link is shown to copy by hand.
    clipboard(undefined);
    await act(async () => [...dom.window.document.querySelectorAll("main button")].find((b) => b.textContent.trim() === "Share").click());
    await settle();
    const fallback = [...dom.window.document.querySelectorAll("input[readonly]")].find((i) => i.value.includes("run="));
    assert.ok(fallback, "the link is on screen");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: a character sent to the Build Optimizer can be sent back, with its changes", async () => {
  const dom = setupDom("/challenge");
  const root = createRoot(dom.window.document.getElementById("root"));
  const doc = dom.window.document;
  const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); });
  const button = (text) => [...doc.querySelectorAll("main button")].find((b) => b.textContent.trim() === text);
  const restrictions = () => [...doc.querySelectorAll(".restrictions-tablet li")].map((li) => li.textContent);
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    assert.equal(doc.querySelector(".challenge-handoff"), null);
    await act(async () => doc.getElementById("react-btn-generate-run").click());
    const identity = doc.querySelector(".character-overview-card h3").textContent;
    const rolledRests = restrictions();
    const gender = /Female/.test(identity) ? "Female" : "Male";
    const other = gender === "Female" ? "Male" : "Female";

    await act(async () => doc.getElementById("react-btn-to-optimizer").click());
    await settle();
    assert.equal(dom.window.location.pathname, "/builder");
    assert.ok(doc.querySelector(".challenge-handoff"), "the builder offers to send it back");

    await act(async () => button(other).click());
    await act(async () => button("Send build back to the challenge run").click());
    await settle();
    assert.equal(dom.window.location.pathname, "/challenge");
    const back = doc.querySelector(".character-overview-card h3").textContent;
    assert.equal(back, identity.replace(gender, other), "the change came back with it");
    assert.deepEqual(restrictions(), rolledRests, "objectives and restrictions stay");
    assert.match(doc.getElementById("challenge-seed-note").textContent, /seed alone rolls a different run/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Challenge Runs: your settings are remembered; a loaded seed's are only for its run", async () => {
  const dom = setupDom("/challenge");
  const container = dom.window.document.getElementById("root");
  let root = createRoot(container);
  const doc = dom.window.document;
  const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); });
  const button = (text) => [...doc.querySelectorAll("main button")].find((b) => b.textContent.trim() === text);
  const active = () => [...doc.querySelectorAll(".run-configurator button")].filter((b) => b.className.includes("active")).map((b) => b.textContent.trim());
  const reload = async () => {
    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
  };
  const pick = async (id, value) => {
    const select = doc.getElementById(id);
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, "value").set.call(select, value);
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
    await act(async () => button("Hardcore").click());
    await pick("cfg-obj-count", "5");
    await reload();
    assert.equal(doc.getElementById("cfg-obj-count").value, "5", "the count survives a reload");
    assert.equal(doc.getElementById("cfg-rest-count").value, "4", "so do the Hardcore settings");
    assert.deepEqual(active(), ["Custom"], "a hand-picked count is Custom");
    assert.match(doc.getElementById("cfg-preferred-note").textContent, /remembered on this device/);

    const input = doc.getElementById("challenge-seed-input");
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, "ABCDE-VANILLA-E-R1O1");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => [...input.form.querySelectorAll("button")].find((b) => b.textContent.trim() === "Load").click());
    await settle();
    assert.equal(doc.getElementById("cfg-rest-count").value, "1", "the seed's settings roll its run");
    assert.match(doc.getElementById("cfg-preferred-note").textContent, /came with a loaded seed/);

    await reload();
    assert.equal(doc.getElementById("cfg-rest-count").value, "4", "but the remembered ones are still yours");
    assert.equal(doc.getElementById("cfg-obj-count").value, "5");

    await act(async () => button("Standard").click());
    await pick("cfg-rest-count", "2");
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input.isConnected ? input : doc.getElementById("challenge-seed-input"), "ABCDE-VANILLA-E-R1O1");
      doc.getElementById("challenge-seed-input").dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(async () => [...doc.getElementById("challenge-seed-input").form.querySelectorAll("button")].find((b) => b.textContent.trim() === "Load").click());
    await settle();
    await act(async () => button("Back to my settings").click());
    assert.equal(doc.getElementById("cfg-rest-count").value, "2", "Back to my settings restores them");
    assert.match(doc.getElementById("cfg-preferred-note").textContent, /remembered on this device/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Copy Build Link copies a link that opens the same character, in its world", async () => {
  const settle = () => act(async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); });
  let dom = setupDom("/builder?world=tr&arce=0");
  let root = createRoot(dom.window.document.getElementById("root"));
  const button = (text) => [...dom.window.document.querySelectorAll("main button")].find((b) => b.textContent.trim() === text);
  const gender = () => [...dom.window.document.querySelectorAll("main button")].filter((b) => ["Male", "Female"].includes(b.textContent.trim()) && b.className.includes("active")).map((b) => b.textContent.trim());
  const clipboard = (value) => {
    for (const nav of [dom.window.navigator, globalThis.navigator]) Object.defineProperty(nav, "clipboard", { configurable: true, value });
  };
  let copied = null;
  try {
    clipboard({ writeText: async (text) => { copied = text; } });
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
    // A first visit opens on the premade catalog (BLD-3).
    await act(async () => button("Custom Class Builder").click());
    await act(async () => button("Female").click());
    await act(async () => button("Copy Build Link").click());
    await settle();
    assert.match(copied, /^http:\/\/localhost:8765\/builder\?world=tr&arce=0&build=[A-Za-z0-9_-]+$/);
    await act(async () => root.unmount());
    dom.window.close();

    // Someone else opens it: a fresh page, Male by default.
    dom = setupDom(copied);
    root = createRoot(dom.window.document.getElementById("root"));
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
    assert.deepEqual(gender(), ["Female"], "the link opens the same character");
    assert.equal(dom.window.location.pathname, "/builder");
    assert.equal(dom.window.location.hash, "", "hash is stripped from the address bar");

    clipboard(undefined);
    await act(async () => button("Copy Build Link").click());
    await settle();
    assert.ok([...dom.window.document.querySelectorAll("input[readonly]")].some((i) => i.value.includes("build=")), "without a clipboard the link is shown");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial QA 4: Send to Build Optimizer on unrolled challenge run applies safe default character state without error", async () => {
  const dom = setupDom("/challenge");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // Directly click Send to Build Optimizer without rolling first
    const sendBtn = dom.window.document.getElementById("react-btn-to-optimizer");
    assert.ok(sendBtn, "#react-btn-to-optimizer button must exist");

    await act(async () => {
      sendBtn.click();
    });

    // Must navigate to /builder safely without unhandled exception
    assert.equal(dom.window.location.pathname, "/builder");
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.ok(buildPanel.classList.contains("show"), "panel-build must be shown");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial QA 5: Send to Build Optimizer clears activeSave state and sets valid class and skills", async () => {
  const dom = setupDom("/challenge");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // Generate run
    const genBtn = dom.window.document.getElementById("react-btn-generate-run");

    await act(async () => {
      genBtn.click();
    });

    const sendBtn = dom.window.document.getElementById("react-btn-to-optimizer");
    await act(async () => {
      sendBtn.click();
    });

    assert.equal(dom.window.location.pathname, "/builder");
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.ok(buildPanel.classList.contains("show"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Bitter Cup is controlled in the level optimizer and survives navigation", async () => {
 const dom=setupDom("/leveler"), root=createRoot(dom.window.document.getElementById("root"));
 const go=async(view)=>act(async()=>{dom.window.history.pushState(null, "", "/"+view);dom.window.dispatchEvent(new dom.window.PopStateEvent("popstate"));});
 try {
  await act(async()=>root.render(React.createElement(AppShell)));
  const checkbox=dom.window.document.getElementById("level-bittercup");
  assert.ok(checkbox); assert.equal(checkbox.checked,false);
  await act(async()=>checkbox.click());
  assert.equal(checkbox.checked,true);
  await go("builder");
  assert.equal(dom.window.document.getElementById("c-bittercup"),null);
  await go("leveler");
  assert.equal(dom.window.document.getElementById("level-bittercup").checked,true);
  await act(async()=>dom.window.document.getElementById("level-bittercup").click());
  assert.equal(dom.window.document.getElementById("level-bittercup").checked,false);
 } finally {await act(async()=>root.unmount());dom.window.close();}
});


test("HTML5 History traversal: popstate Back and Forward navigates seamlessly between workstations", async () => {
  const dom = setupDom("/");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);
  const settle = () => act(async () => { for (let i = 0; i < 15; i++) await new Promise((r) => setTimeout(r, 0)); });

  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();

    assert.equal(dom.window.location.pathname, "/");
    assert.ok(dom.window.document.getElementById("panel-home").classList.contains("show"));

    // Navigate to /builder via top bar button
    await act(async () => dom.window.document.getElementById("react-nav-build").click());
    await settle();
    assert.equal(dom.window.location.pathname, "/builder");
    assert.ok(dom.window.document.getElementById("panel-build").classList.contains("show"));

    // Navigate to /travel via top bar button
    await act(async () => dom.window.document.getElementById("react-nav-travel").click());
    await settle();
    assert.equal(dom.window.location.pathname, "/travel");
    assert.ok(dom.window.document.getElementById("panel-travel").classList.contains("show"));

    // Press browser Back button -> /builder
    await act(async () => {
      dom.window.history.back();
    });
    await settle();
    assert.equal(dom.window.location.pathname, "/builder");
    assert.ok(dom.window.document.getElementById("panel-build").classList.contains("show"));
    assert.ok(!dom.window.document.getElementById("panel-travel").classList.contains("show"));

    // Press browser Back button again -> /
    await act(async () => {
      dom.window.history.back();
    });
    await settle();
    assert.equal(dom.window.location.pathname, "/");
    assert.ok(dom.window.document.getElementById("panel-home").classList.contains("show"));
    assert.ok(!dom.window.document.getElementById("panel-build").classList.contains("show"));

    // Press browser Forward button -> /builder
    await act(async () => {
      dom.window.history.forward();
    });
    await settle();
    assert.equal(dom.window.location.pathname, "/builder");
    assert.ok(dom.window.document.getElementById("panel-build").classList.contains("show"));

    // Press browser Forward button again -> /travel
    await act(async () => {
      dom.window.history.forward();
    });
    await settle();
    assert.equal(dom.window.location.pathname, "/travel");
    assert.ok(dom.window.document.getElementById("panel-travel").classList.contains("show"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});


test("Query permalink payload: /builder?build=... loads build and cleans query string from address bar", async () => {
  const buildPayload = { race: "Nord", className: "Custom", sign: "The Lady" };
  const b64 = Buffer.from(JSON.stringify(buildPayload), "utf-8").toString("base64url");
  const dom = setupDom("/builder?build=" + b64);
  const root = createRoot(dom.window.document.getElementById("root"));
  const settle = () => act(async () => { for (let i = 0; i < 15; i++) await new Promise((r) => setTimeout(r, 0)); });

  try {
    await act(async () => root.render(React.createElement(AppShell, { initialView: "builder" })));
    await settle();

    assert.equal(dom.window.location.pathname, "/builder");
    assert.equal(dom.window.location.hash, "");
    assert.equal(dom.window.location.search, "");
    assert.ok(dom.window.document.getElementById("panel-build").classList.contains("show"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('hydrating the shell raises no snapshot warning', async () => {
  // useSyncExternalStore compares snapshots by identity; a new server snapshot on every
  // call makes React warn "The result of getServerSnapshot should be cached".
  const dom = setupDom('/alchemy');
  const { ShellProvider } = component('components/shell-context.jsx');
  const { renderToString } = require('react-dom/server');
  const { hydrateRoot } = require('react-dom/client');
  const tree = React.createElement(ShellProvider, { initialView: 'alchemy' }, React.createElement('span', null, 'ok'));
  const container = dom.window.document.getElementById('root');
  container.innerHTML = renderToString(tree);
  const errors = [];
  const original = console.error;
  console.error = (...args) => { errors.push(args.map(String).join(' ')); };
  let root;
  try {
    await act(async () => { root = hydrateRoot(container, tree); });
  } finally {
    console.error = original;
    await act(async () => root?.unmount());
    dom.window.close();
  }
  assert.deepEqual(errors.filter(e => /getServerSnapshot|getSnapshot/.test(e)), []);
});
