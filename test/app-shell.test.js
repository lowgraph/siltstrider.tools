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
