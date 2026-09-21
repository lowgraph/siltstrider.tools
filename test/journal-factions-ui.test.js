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

const JournalFactionsRoot = component("components/journal-factions/journal-factions-root.jsx");
const FactionRoster = component("components/journal-factions/faction-roster.jsx");
const FactionDetailView = component("components/journal-factions/faction-detail-view.jsx");

function setupDom() {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost:8765"
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.CustomEvent = dom.window.CustomEvent;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  dom.window.siltShell = {
    getSnapshot: () => ({
      ready: true,
      world: "vanilla",
      arce: false,
      profile: "vanilla",
      view: "factions"
    }),
    navigate: () => {},
    setProfile: () => {}
  };

  return dom;
}

const mockFightersGuild = {
  key: "fighters guild",
  name: "Fighters Guild",
  favouredAttributes: ["strength", "endurance"],
  skills: ["axe", "long_blade", "blunt_weapon", "heavy_armor", "armorer", "block"],
  ranks: [
    { index: 0, name: "Associate", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
    { index: 1, name: "Apprentice", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
    { index: 2, name: "Journeyman", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
    { index: 3, name: "Swordsman", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
    { index: 4, name: "Protector", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 35 },
    { index: 5, name: "Defender", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
    { index: 6, name: "Warder", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
    { index: 7, name: "Guardian", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 90 },
    { index: 8, name: "Champion", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 110 },
    { index: 9, name: "Master", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
  ],
  reactions: [
    { faction: "fighters guild", adjustment: 3 },
    { faction: "thieves guild", adjustment: -2 }
  ],
  ownedPlacements: 186
};

const mockHlaalu = {
  key: "hlaalu",
  name: "Great House Hlaalu",
  favouredAttributes: ["speed", "agility"],
  skills: ["speechcraft", "mercantile", "marksman", "short_blade", "light_armor", "security"],
  ranks: [
    { index: 0, name: "Hireling", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
    { index: 1, name: "Retainer", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 }
  ],
  reactions: [
    { faction: "hlaalu", adjustment: 3 },
    { faction: "redoran", adjustment: -1 }
  ],
  ownedPlacements: 349
};

const mockRedoran = {
  key: "redoran",
  name: "Great House Redoran",
  favouredAttributes: ["endurance", "strength"],
  skills: ["athletics", "spear", "long_blade", "heavy_armor", "medium_armor", "armorer"],
  ranks: [
    { index: 0, name: "Hireling", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 }
  ],
  reactions: [],
  ownedPlacements: 586
};

const mockNonJoinable = {
  key: "sixth house",
  name: "Sixth House",
  favouredAttributes: [],
  skills: [],
  ranks: [],
  reactions: [],
  ownedPlacements: 120
};

test("JournalFactionsRoot renders header, roster, and detail view in split pane", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        React.createElement(JournalFactionsRoot)
      );
    });

    assert.ok(container.textContent.includes("Faction Journal"), "Should display main title");
    assert.ok(container.querySelector(".journal-factions-root"), "Should render root workstation class");
    assert.ok(container.querySelector(".faction-roster-pane"), "Should render roster pane");
    assert.ok(container.querySelector(".faction-detail-pane"), "Should render detail pane");
    assert.ok(container.textContent.includes("Fighters Guild"), "Should display default selected faction");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("FactionRoster filters by category, search text, and tracks active faction", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  let selectedKey = "fighters guild";
  let search = "";
  let category = "all";

  const factions = [mockFightersGuild, mockHlaalu, mockRedoran, mockNonJoinable];
  const joined = [{ id: "fighters guild", rank: 1, reputation: 10 }];

  try {
    await act(async () => {
      root.render(
        React.createElement(FactionRoster, {
          factions,
          selectedFactionKey: selectedKey,
          onSelectFaction: (k) => { selectedKey = k; },
          searchQuery: search,
          onSearchChange: (s) => { search = s; },
          activeCategory: category,
          onCategoryChange: (c) => { category = c; },
          joinedFactions: joined,
          character: null
        })
      );
    });

    // Check roster entries
    const items = container.querySelectorAll(".faction-roster-item");
    assert.equal(items.length, 4, "Should display all 4 factions under 'all' category");

    // Check search filtering
    await act(async () => {
      root.render(
        React.createElement(FactionRoster, {
          factions,
          selectedFactionKey: selectedKey,
          onSelectFaction: (k) => { selectedKey = k; },
          searchQuery: "Hlaalu",
          onSearchChange: (s) => { search = s; },
          activeCategory: category,
          onCategoryChange: (c) => { category = c; },
          joinedFactions: joined,
          character: null
        })
      );
    });

    const filtered = container.querySelectorAll(".faction-roster-item");
    assert.equal(filtered.length, 1, "Only Hlaalu should match search 'Hlaalu'");
    assert.ok(container.textContent.includes("Great House Hlaalu"));

    // Check Category filtering (Great Houses)
    await act(async () => {
      root.render(
        React.createElement(FactionRoster, {
          factions,
          selectedFactionKey: selectedKey,
          onSelectFaction: (k) => { selectedKey = k; },
          searchQuery: "",
          onSearchChange: (s) => { search = s; },
          activeCategory: "houses",
          onCategoryChange: (c) => { category = c; },
          joinedFactions: joined,
          character: null
        })
      );
    });

    const houses = container.querySelectorAll(".faction-roster-item");
    assert.equal(houses.length, 2, "Hlaalu and Redoran should be Great Houses");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("FactionDetailView renders rank steppers, promotion solver, and deficits", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  const character = {
    attributes: { Strength: 30, Endurance: 30 },
    skills: { LongBlade: 25, HeavyArmor: 10, Armorer: 5, Block: 5, Axe: 5, BluntWeapon: 5 }
  };
  const membership = { id: "fighters guild", rank: 1, reputation: 5 };

  try {
    await act(async () => {
      root.render(
        React.createElement(FactionDetailView, {
          faction: mockFightersGuild,
          character,
          membership,
          joinedFactionKeys: ["fighters guild"],
          quests: [],
          onUpdateMembership: () => {}
        })
      );
    });

    // Check Rank track exists
    const rankButtons = container.querySelectorAll(".rank-stepper-btn");
    assert.equal(rankButtons.length, 10, "Should have 10 rank buttons for Fighters Guild");

    // Check Solver Card exists
    assert.ok(container.textContent.includes("Target Rank Qualification"));
    assert.ok(container.textContent.includes("Favoured Attributes"));

    // Check diplomacy section
    assert.ok(container.textContent.includes("Inter-Faction Relations"));
    assert.ok(container.textContent.includes("Thieves Guild"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("FactionDetailView displays mutual exclusivity warning for rival Great Houses", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        React.createElement(FactionDetailView, {
          faction: mockRedoran,
          character: null,
          membership: null,
          joinedFactionKeys: ["hlaalu"],
          quests: [],
          onUpdateMembership: () => {}
        })
      );
    });

    assert.ok(container.textContent.includes("Mutual Exclusivity Warning"), "Must warn about Great House conflict");
    assert.ok(container.textContent.includes("hlaalu"), "Must mention rival faction key hlaalu");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial: Handles non-joinable faction with empty ranks cleanly", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        React.createElement(FactionDetailView, {
          faction: mockNonJoinable,
          character: null,
          membership: null,
          joinedFactionKeys: [],
          quests: [],
          onUpdateMembership: () => {}
        })
      );
    });

    assert.ok(container.textContent.includes("Non-Joinable"), "Should indicate non-joinable status");
    assert.equal(container.querySelectorAll(".rank-stepper-btn").length, 0, "Non-joinable should have no rank buttons");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial: Handles character with maxed stats (100 in all) showing 0 deficits and 100% progress", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  const godChar = {
    attributes: { Strength: 100, Endurance: 100 },
    skills: { Axe: 100, LongBlade: 100, BluntWeapon: 100, HeavyArmor: 100, Armorer: 100, Block: 100 }
  };
  const membership = { id: "fighters guild", rank: 8, reputation: 200 };

  try {
    await act(async () => {
      root.render(
        React.createElement(FactionDetailView, {
          faction: mockFightersGuild,
          character: godChar,
          membership,
          joinedFactionKeys: ["fighters guild"],
          quests: [],
          onUpdateMembership: () => {}
        })
      );
    });

    assert.ok(container.textContent.includes("Eligible for Promotion") || container.textContent.includes("Met"));
    assert.doesNotMatch(container.textContent, /Deficit: -/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial: Handles malformed faction with null skills, null ranks, and undefined reactions", async () => {
  const dom = setupDom();
  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  const brokenFaction = {
    key: "broken_cult",
    name: "Broken Cult",
    favouredAttributes: null,
    skills: null,
    ranks: null,
    reactions: null
  };

  try {
    await act(async () => {
      root.render(
        React.createElement(FactionDetailView, {
          faction: brokenFaction,
          character: null,
          membership: null,
          joinedFactionKeys: [],
          quests: [],
          onUpdateMembership: () => {}
        })
      );
    });

    assert.ok(container.textContent.includes("Broken Cult"));
    assert.ok(container.textContent.includes("Non-Joinable"));
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
