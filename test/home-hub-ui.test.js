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
    external: ["react", "react/jsx-runtime"],
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

const mockBuild = {
  version: 1,
  name: "Nerevar Reborn",
  race: "Dunmer",
  gender: "Male",
  className: "Spellsword",
  sign: "The Mage",
  spec: "Magic",
  fav1: "Willpower",
  fav2: "Endurance",
  maj: ["Destruction", "Alteration", "Long Blade", "Medium Armor", "Block"],
  min: ["Restoration", "Mysticism", "Athletics", "Armorer", "Enchant"],
};

test("ToolLauncherCard renders title, description, tags, and handles navigation click", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  let navigatedTo = null;
  const ToolLauncherCard = component("components/home-hub/tool-launcher-card.jsx");

  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(ToolLauncherCard, {
        id: "leveler",
        title: "Level Simulator",
        subtitle: "Progression & Health",
        description: "Simulate leveling to cap.",
        tags: ["5x Multipliers", "Health Math"],
        actionLabel: "Launch Simulator →",
        badge: "HOT",
        onNavigate: (view) => {
          navigatedTo = view;
        },
      })
    );
  });

  assert.ok(container.textContent.includes("Level Simulator"));
  assert.ok(container.textContent.includes("Progression & Health"));
  assert.ok(container.textContent.includes("Simulate leveling to cap."));
  assert.ok(container.textContent.includes("5x Multipliers"));
  assert.ok(container.textContent.includes("Health Math"));
  assert.ok(container.textContent.includes("HOT"));

  const btn = container.querySelector("button");
  assert.ok(btn);
  assert.equal(btn.textContent.trim(), "Launch Simulator →");

  await act(async () => {
    btn.click();
  });

  assert.equal(navigatedTo, "leveler");
  root.unmount();
});

test("Adversarial: ToolLauncherCard handles null/empty tags, missing subtitle, and undefined onNavigate gracefully", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  let globalNavigated = null;
  dom.window.siltShell = {
    navigate: (v) => {
      globalNavigated = v;
    },
  };

  const ToolLauncherCard = component("components/home-hub/tool-launcher-card.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(ToolLauncherCard, {
        id: "builder",
        title: "Build Optimizer",
        // subtitle, tags, actionLabel, badge omitted
      })
    );
  });

  assert.ok(container.textContent.includes("Build Optimizer"));
  const btn = container.querySelector("button");
  assert.ok(btn);

  await act(async () => {
    btn.click();
  });

  assert.equal(globalNavigated, "builder");
  root.unmount();
});

test("ActiveSessionBanner renders active character details and handles action buttons", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  let openedVault = false;
  dom.window.addEventListener("silt-open-vault", () => {
    openedVault = true;
  });

  let navigatedTo = null;
  dom.window.siltShell = {
    navigate: (v) => {
      navigatedTo = v;
    },
  };

  const ActiveSessionBanner = component("components/home-hub/active-session-banner.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(ActiveSessionBanner, {
        onNavigate: (v) => {
          navigatedTo = v;
        },
      })
    );
  });

  assert.ok(container.textContent.includes("Current Session"));
  assert.ok(container.textContent.includes("Health:"));
  assert.ok(container.textContent.includes("Magicka:"));
  assert.ok(container.textContent.includes("Fatigue:"));

  const buttons = Array.from(container.querySelectorAll("button"));
  const resumeBtn = buttons.find((b) => b.textContent.includes("Resume Build Optimizer"));
  const levelBtn = buttons.find((b) => b.textContent.includes("Level Simulator"));
  const vaultBtn = buttons.find((b) => b.textContent.includes("Cloud Vault"));

  assert.ok(resumeBtn);
  assert.ok(levelBtn);
  assert.ok(vaultBtn);

  await act(async () => {
    resumeBtn.click();
  });
  assert.equal(navigatedTo, "builder");

  await act(async () => {
    levelBtn.click();
  });
  assert.equal(navigatedTo, "leveler");

  await act(async () => {
    vaultBtn.click();
  });
  assert.equal(openedVault, true);

  root.unmount();
});

test("Adversarial: ActiveSessionBanner handles completely missing window.siltShell without crashing", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  delete dom.window.siltShell;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const ActiveSessionBanner = component("components/home-hub/active-session-banner.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ActiveSessionBanner));
  });

  const buttons = Array.from(container.querySelectorAll("button"));
  assert.ok(buttons.length >= 3);

  // Clicking when siltShell is undefined must not throw an uncaught exception
  assert.doesNotThrow(() => {
    buttons[0].click();
  });

  root.unmount();
});

test("ToolDirectoryGrid renders all 9 canonical tools in correct order", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const ToolDirectoryGrid = component("components/home-hub/tool-directory-grid.jsx");
  const TOOLS = component("components/home-hub/tool-directory-grid.jsx", "TOOLS");

  assert.equal(TOOLS.length, 9);
  const expectedIds = [
    "builder",
    "leveler",
    "vault",
    "factions",
    "challenge",
    "enchanting",
    "spellmaking",
    "alchemy",
    "travel",
  ];
  assert.deepEqual(TOOLS.map((t) => t.id), expectedIds);

  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ToolDirectoryGrid));
  });

  assert.ok(container.textContent.includes("CRPG Tools Directory"));
  assert.ok(container.textContent.includes("Build Optimizer"));
  assert.ok(container.textContent.includes("Level Simulator"));
  assert.ok(container.textContent.includes("Cloud Character Vault"));
  assert.ok(container.textContent.includes("Faction Journal"));
  assert.ok(container.textContent.includes("Challenge Runs"));
  assert.ok(container.textContent.includes("Enchanting Calculator"));
  assert.ok(container.textContent.includes("Spellmaking Calculator"));
  assert.ok(container.textContent.includes("Alchemy Calculator"));
  assert.ok(container.textContent.includes("Travel Optimizer"));

  const articles = container.querySelectorAll("article");
  assert.equal(articles.length, 9);

  root.unmount();
});

test("WorldProfilesGuide lists all 3 profiles and switches profile on click", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  let switchedProfile = null;
  dom.window.siltShell = {
    setProfile: (p) => {
      switchedProfile = p;
    },
  };

  const WorldProfilesGuide = component("components/home-hub/world-profiles-guide.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(WorldProfilesGuide));
  });

  assert.ok(container.textContent.includes("Vanilla Vvardenfell"));
  assert.ok(container.textContent.includes("Tamriel Rebuilt Mainland"));
  assert.ok(container.textContent.includes("TR + ARCE Rebalance"));

  const buttons = Array.from(container.querySelectorAll("button"));
  const trBtn = buttons.find((b) => b.textContent.includes("Tamriel Rebuilt"));
  assert.ok(trBtn);

  await act(async () => {
    trBtn.click();
  });

  assert.equal(switchedProfile, "tr");
  root.unmount();
});

test("Adversarial: WorldProfilesGuide handles repeated rapid profile switches and missing shell without throwing", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  delete dom.window.siltShell;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const WorldProfilesGuide = component("components/home-hub/world-profiles-guide.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(WorldProfilesGuide));
  });

  const buttons = Array.from(container.querySelectorAll("button"));
  buttons.forEach((btn) => {
    assert.doesNotThrow(() => btn.click());
  });

  root.unmount();
});

test("ColophonBulletin displays project metadata, license, and navigation links", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  let navigatedTo = null;
  dom.window.siltShell = {
    navigate: (v) => {
      navigatedTo = v;
    },
  };

  const ColophonBulletin = component("components/home-hub/colophon-bulletin.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(ColophonBulletin));
  });

  assert.ok(container.textContent.includes("Pelagiad by Isak Larborn"));
  assert.ok(container.textContent.includes("Morrowind.esm"));
  assert.ok(container.textContent.includes("About & Credits"));
  assert.ok(container.textContent.includes("Changelog"));

  const buttons = Array.from(container.querySelectorAll("button"));
  const aboutBtn = buttons.find((b) => b.textContent.includes("About & Credits"));
  const changelogBtn = buttons.find((b) => b.textContent.includes("Changelog"));

  assert.ok(aboutBtn);
  assert.ok(changelogBtn);

  await act(async () => {
    aboutBtn.click();
  });
  assert.equal(navigatedTo, "about");

  await act(async () => {
    changelogBtn.click();
  });
  assert.equal(navigatedTo, "changelog");

  root.unmount();
});

test("HomeHubRoot coordinates complete layout with header, active session, grid, guide, and colophon", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const HomeHubRoot = component("components/home-hub/home-hub-root.jsx");
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(HomeHubRoot));
  });

  // Verify semantic hierarchy
  const main = container.querySelector("main.home-hub-root");
  assert.ok(main);

  const header = main.querySelector("header");
  assert.ok(header);
  assert.ok(header.textContent.includes("Silt Strider"));

  const sections = main.querySelectorAll("section");
  assert.ok(sections.length >= 2); // Tools directory + World profiles guide

  const footer = main.querySelector("footer");
  assert.ok(footer);
  assert.ok(footer.textContent.includes("Pelagiad"));

  root.unmount();
});
