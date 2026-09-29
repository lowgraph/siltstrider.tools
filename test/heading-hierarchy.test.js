const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : input, "http://localhost/");
    if (url.pathname === "/api/saves") {
      return Response.json({
        saves: [
          {
            id: "save-1",
            name: "Nerevarine",
            save_type: "openmw_save",
            level: 20,
            race: "Dark Elf",
            class_name: "Spellsword",
            birthsign: "The Lady",
            cell_name: "Balmora",
            gold: 5000,
            quest_count: 10,
            item_count: 50,
            revision: 1,
            updated_at: "2026-09-29T12:00:00.000Z",
          }
        ],
        total: 1
      });
    }
    if (url.pathname === "/api/entitlements") {
      return Response.json({ tier: "free", maxSaves: 5, currentSaves: 1, remainingSaves: 4 });
    }
    throw new Error("Unexpected request: " + url.pathname);
  };
});
afterEach(() => {
  global.fetch = originalFetch;
});

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

const mockCatalogs = {
  races: {
    "Dark Elf": {
      name: "Dark Elf",
      male: { Strength: 40, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 40, Personality: 30, Luck: 40 },
      female: { Strength: 35, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 35, Personality: 40, Luck: 40 },
      bonuses: { "Short Blade": 10, Destruction: 10, "Light Armor": 5, Athletics: 5, Mysticism: 5, Marksman: 5 }
    }
  },
  classes: {
    Warrior: {
      name: "Warrior",
      spec: "Combat",
      fav1: "Strength",
      fav2: "Endurance",
      maj: ["Long Blade", "Medium Armor", "Heavy Armor", "Athletics", "Block"],
      min: ["Armorer", "Spear", "Axe", "Blunt Weapon", "Marksman"]
    }
  },
  signs: {
    "The Lady": {
      name: "The Lady",
      attrs: { Personality: 25, Endurance: 25 }
    }
  },
  specSkills: {
    Combat: ["Armorer", "Athletics", "Axe", "Block", "Blunt Weapon", "Heavy Armor", "Long Blade", "Medium Armor", "Spear"],
    Magic: ["Alchemy", "Alteration", "Conjuration", "Destruction", "Enchant", "Illusion", "Mysticism", "Restoration", "Unarmored"],
    Stealth: ["Acrobatics", "Hand-to-hand", "Light Armor", "Marksman", "Mercantile", "Security", "Short Blade", "Sneak", "Speechcraft"]
  }
};

const mockBuild = {
  race: "Dark Elf",
  gender: "Male",
  className: "Warrior",
  sign: "The Lady",
  spec: "Combat",
  fav1: "Strength",
  fav2: "Endurance",
  maj: ["Long Blade", "Medium Armor", "Heavy Armor", "Athletics", "Block"],
  min: ["Armorer", "Spear", "Axe", "Blunt Weapon", "Marksman"]
};

function verifyNoHeadingSkips(container, expectedH2) {
  const headings = Array.from(container.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  assert.ok(headings.length > 0, "must find headings");

  // Verify first visible heading is h2
  assert.equal(headings[0].tagName.toLowerCase(), "h2", "first visible heading must be h2");
  if (expectedH2) {
    assert.equal(headings[0].textContent.trim(), expectedH2);
  }

  // Verify no heading level skips (WCAG SC 1.3.1 / axe heading-order rule)
  let prevLevel = 2;
  for (let i = 1; i < headings.length; i++) {
    const h = headings[i];
    const level = parseInt(h.tagName[1], 10);
    assert.ok(
      level <= prevLevel + 1,
      `Heading <${h.tagName.toLowerCase()}> "${h.textContent.trim()}" at index ${i} skips a level after <h${prevLevel}>`
    );
    prevLevel = level;
  }

  // Verify no h5 or h6 tags are present
  const h5Count = container.querySelectorAll("h5").length;
  const h6Count = container.querySelectorAll("h6").length;
  assert.equal(h5Count, 0, "No h5 tags should exist; hierarchy must not exceed h4");
  assert.equal(h6Count, 0, "No h6 tags should exist");
}

test("Level Simulator adheres to strict semantic heading hierarchy (h2 -> h3 -> h4 with no skips)", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/#leveler" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const LevelSimulatorRoot = component("components/level-simulator/level-simulator-root.jsx");
  const root = createRoot(dom.window.document.getElementById("root"));

  try {
    await act(async () => {
      root.render(
        React.createElement(LevelSimulatorRoot, {
          catalogs: mockCatalogs,
          activeSave: null,
          fromSave: false,
          build: mockBuild,
          shell: { navigate() {} }
        })
      );
    });

    verifyNoHeadingSkips(dom.window.document.getElementById("root"), "Level Simulator");

    const h3Elements = Array.from(dom.window.document.querySelectorAll("h3")).map((el) => el.textContent.trim());
    assert.ok(h3Elements.some((t) => t.includes("Leveling Presets")), "h3 must include Leveling Presets");
    assert.ok(h3Elements.some((t) => t.includes("Attribute Leveling Priority")), "h3 must include Attribute Leveling Priority");
    assert.ok(h3Elements.some((t) => t.includes("Level-by-Level Training Itinerary")), "h3 must include Level-by-Level Training Itinerary");

    const h4Elements = Array.from(dom.window.document.querySelectorAll("h4")).map((el) => el.textContent.trim());
    assert.ok(h4Elements.some((t) => t.includes("Attribute Level-Up Picks")), "h4 must include Attribute Level-Up Picks");
    assert.ok(h4Elements.some((t) => t.includes("Leveled Vitals")), "h4 must include Leveled Vitals");
    assert.ok(h4Elements.some((t) => t.includes("Primary Attributes")), "h4 must include Primary Attributes");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Cloud Vault Workstation adheres to strict semantic heading hierarchy (h2 -> h3 -> h4 with no skips)", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/#vault" });
  dom.window.Clerk = {
    user: { id: "user-1", fullName: "Nerevar" },
    session: { getToken: async () => "mock-token" },
  };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const CloudVaultWorkstation = component("components/character-vault/cloud-vault-workstation.jsx");
  const root = createRoot(dom.window.document.getElementById("root"));

  try {
    await act(async () => {
      root.render(React.createElement(CloudVaultWorkstation, { build: mockBuild }));
    });

    verifyNoHeadingSkips(dom.window.document.getElementById("root"), "Cloud Vault");

    const h3Elements = Array.from(dom.window.document.querySelectorAll("h3")).map((el) => el.textContent.trim());
    assert.ok(h3Elements.some((t) => t.includes("Open a Save in Silt Strider")), "h3 must include Open a Save in Silt Strider");
    assert.ok(h3Elements.some((t) => t.includes("Save Character to Cloud")), "h3 must include Save Character to Cloud");
    assert.ok(h3Elements.some((t) => t.includes("Import Save")), "h3 must include Import Save");
    assert.ok(h3Elements.some((t) => t.includes("Saved Characters")), "h3 must include Saved Characters");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Cloud Vault Modal adheres to strict semantic heading hierarchy (h2 -> h3 -> h4 with no skips)", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  dom.window.Clerk = {
    user: { id: "user-1", fullName: "Nerevar" },
    session: { getToken: async () => "mock-token" },
  };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const CloudVaultModal = component("components/character-vault/cloud-vault-modal.jsx");
  const root = createRoot(dom.window.document.getElementById("root"));

  try {
    await act(async () => {
      root.render(
        React.createElement(CloudVaultModal, {
          activeBuild: mockBuild,
          isOpen: true,
          onClose() {}
        })
      );
    });

    verifyNoHeadingSkips(dom.window.document.getElementById("root"), "Cloud Vault");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("Adversarial: Heading hierarchy holds across signed-out state, local saves tab, and empty state", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/#vault" });
  delete dom.window.Clerk;
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const CloudVaultWorkstation = component("components/character-vault/cloud-vault-workstation.jsx");
  const root = createRoot(dom.window.document.getElementById("root"));

  try {
    // 1. Signed-out state
    await act(async () => {
      root.render(React.createElement(CloudVaultWorkstation, { build: mockBuild }));
    });

    verifyNoHeadingSkips(dom.window.document.getElementById("root"), "Cloud Vault");
    const h3Elements = Array.from(dom.window.document.querySelectorAll("h3")).map((el) => el.textContent.trim());
    assert.ok(h3Elements.some((t) => t.includes("Connect Your Account for Cloud Sync")), "signed-out shows Connect Your Account h3");

    // 2. Switch to Local Browser Saves tab
    const localTabBtn = Array.from(dom.window.document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Local Browser Saves")
    );
    assert.ok(localTabBtn, "Local Browser Saves tab must be present");
    await act(async () => {
      localTabBtn.click();
    });

    verifyNoHeadingSkips(dom.window.document.getElementById("root"), "Cloud Vault");
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
