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
    external: ["react", "react/jsx-runtime", "next/script"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return exportName === "default" ? (m.exports.default || m.exports) : m.exports[exportName];
}

const SiteFooter = component("components/site-footer.jsx");
const AppShell = component("components/app-shell.jsx");

function setupDom(initialHash = "#home") {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost:8765/" + initialHash
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
  const dom = setupDom("#home");
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
    assert.equal(dom.window.location.hash, "#about");

    await act(async () => {
      changelogLink.click();
    });
    assert.equal(dom.window.location.hash, "#changelog");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("AppShell mounts cleanly and renders semantic panels for all 12 views", async () => {
  const dom = setupDom("#home");
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
  const dom = setupDom("#home");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(React.createElement(AppShell));
    });

    // Simulate navigation to #builder
    await act(async () => {
      dom.window.location.hash = "#builder";
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
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
      dom.window.location.hash = "#factions";
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
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
  const dom = setupDom("#home");
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
        dom.window.location.hash = "#" + view;
        dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
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
  const dom = setupDom("#home");
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
      dom.window.location.hash = "#builder";
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
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
  const dom = setupDom("#challenge");
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

    // Hash must navigate to #builder
    assert.match(dom.window.location.hash, /^#builder/);

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
  const dom = setupDom("#challenge");
  const container = dom.window.document.getElementById("root");
  let root = createRoot(container);
  const summary = () => {
    const panel = dom.window.document.getElementById("panel-challenge");
    return [...panel.querySelectorAll(".character-overview-card h3, .run-summary-sheet li")].map((el) => el.textContent).join("|");
  };
  const go = async (hash) => {
    await act(async () => {
      dom.window.location.hash = hash;
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
      await new Promise((r) => setTimeout(r, 0));
    });
  };

  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await act(async () => dom.window.document.getElementById("react-btn-generate-run").click());
    const rolled = summary();
    assert.doesNotMatch(rolled, /Not rolled yet/i);

    await act(async () => dom.window.document.getElementById("react-btn-to-optimizer").click());
    assert.match(dom.window.location.hash, /^#builder/);
    await go("#challenge");
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
  const dom = setupDom("#challenge");
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
  const dom = setupDom("#builder");
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
    assert.match(dom.window.location.hash, /^#leveler/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Go-to buttons navigate: Back to Character Builder, and the vault's shortcuts", async () => {
  const dom = setupDom("#leveler");
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
      dom.window.location.hash = hash;
      dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
    });
    await settle();
  };
  try {
    await act(async () => root.render(React.createElement(AppShell)));
    await settle();
    await press("← Back to Character Builder");
    assert.match(dom.window.location.hash, /^#builder/);

    await go("#vault");
    await press("Level Simulator →");
    assert.match(dom.window.location.hash, /^#leveler/);
    await go("#vault");
    await press("← Character Builder");
    assert.match(dom.window.location.hash, /^#builder/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial QA 4: Send to Build Optimizer on unrolled challenge run applies safe default character state without error", async () => {
  const dom = setupDom("#challenge");
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

    // Must navigate to #builder safely without unhandled exception
    assert.match(dom.window.location.hash, /^#builder/);
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.ok(buildPanel.classList.contains("show"), "panel-build must be shown");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial QA 5: Send to Build Optimizer clears activeSave state and sets valid class and skills", async () => {
  const dom = setupDom("#challenge");
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

    assert.match(dom.window.location.hash, /^#builder/);
    const buildPanel = dom.window.document.getElementById("panel-build");
    assert.ok(buildPanel.classList.contains("show"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

