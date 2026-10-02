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

const LOCAL_KEY = "siltstrider-saved-characters";

const sampleBuild = {
  name: "Nerevarine",
  race: "Dunmer",
  gender: "Male",
  className: "Spellsword",
  sign: "The Mage",
  spec: "Magic",
  fav1: "Willpower",
  fav2: "Endurance",
  maj: ["Destruction", "Alteration", "Long Blade", "Medium Armor", "Restoration"],
  min: ["Enchant", "Alchemy", "Block", "Athletics", "Armorer"],
};

test("BLD-4: LocalCharactersPanel renders save button, cloud vault button, and local storage notice", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(React.createElement(Panel, { build: sampleBuild }));
    });

    const saveBtn = document.getElementById("btn-save-local-character");
    assert.ok(saveBtn, "Save this character button must be rendered");
    assert.match(saveBtn.textContent, /Save this character/);

    const vaultBtn = document.getElementById("btn-open-cloud-vault");
    assert.ok(vaultBtn, "Cloud Vault button must be rendered");
    assert.match(vaultBtn.textContent, /Cloud Vault/);

    assert.match(document.body.textContent, /Saved Characters/);
    assert.match(document.body.textContent, /Local browser storage \(no account needed\)/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("BLD-4: Clicking Save this character saves to localStorage, updates list, and dispatches event", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  let dispatched = 0;
  window.addEventListener("silt-local-saves-changed", () => {
    dispatched++;
  });

  try {
    await act(async () => {
      root.render(React.createElement(Panel, { build: sampleBuild }));
    });

    const saveBtn = document.getElementById("btn-save-local-character");
    await act(async () => {
      saveBtn.click();
    });

    assert.equal(dispatched, 1, "silt-local-saves-changed event must be dispatched on save");

    const raw = window.localStorage.getItem(LOCAL_KEY);
    assert.ok(raw, "localStorage must contain saved characters");
    const records = JSON.parse(raw);
    assert.equal(records.length, 1);
    assert.equal(records[0].name, "Nerevarine");
    assert.equal(records[0].character.className, "Spellsword");
    assert.ok(records[0].id.startsWith("local_"));

    // Check UI feedback
    assert.match(saveBtn.textContent, /Saved "Nerevarine"!/);
    assert.match(document.body.textContent, /1 saved/);
    assert.match(document.body.textContent, /Dunmer · Spellsword · The Mage/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("BLD-4: Clicking Load calls applyBuild callback with character data", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  // Pre-seed localStorage
  window.localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify([
      {
        id: "local_test_123",
        name: "Indoril Hero",
        character: { race: "Dunmer", className: "Ordinator", sign: "The Warrior" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  );

  let loadedCharacter = null;
  const onApplyBuild = (char) => {
    loadedCharacter = char;
  };

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(React.createElement(Panel, { build: sampleBuild, onApplyBuild }));
    });

    assert.match(document.body.textContent, /Indoril Hero/);
    assert.match(document.body.textContent, /Dunmer · Ordinator · The Warrior/);

    const loadButtons = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.textContent.trim() === "Load"
    );
    assert.equal(loadButtons.length, 1, "There should be 1 Load button");

    await act(async () => {
      loadButtons[0].click();
    });

    assert.ok(loadedCharacter, "onApplyBuild must have been called");
    assert.equal(loadedCharacter.className, "Ordinator");
    assert.match(document.body.textContent, /Loaded "Indoril Hero"!/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("BLD-4: Confirming delete removes character from localStorage and list", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  window.localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify([
      {
        id: "local_del_1",
        name: "Temporary Build",
        character: { race: "Nord", className: "Barbarian", sign: "The Tower" },
      },
    ])
  );

  let eventCount = 0;
  window.addEventListener("silt-local-saves-changed", () => {
    eventCount++;
  });

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(React.createElement(Panel, { build: sampleBuild }));
    });

    assert.match(document.body.textContent, /Temporary Build/);

    const deleteBtn = document.querySelector('button[aria-label="Delete Temporary Build"]');
    assert.ok(deleteBtn, "Delete button must be found");

    await act(async () => {
      deleteBtn.click();
    });

    assert.equal(eventCount, 0, "Opening confirmation must not delete the character");
    await act(async () => {
      [...document.querySelectorAll('[role=alertdialog] button')].find(button => button.textContent === 'Delete character').click();
    });

    assert.equal(eventCount, 1, "Event must be fired on delete");
    const updated = JSON.parse(window.localStorage.getItem(LOCAL_KEY));
    assert.equal(updated.length, 0, "Character must be removed from localStorage");
    assert.equal(document.querySelector('button[aria-label="Delete Temporary Build"]'), null);
    assert.match(document.body.textContent, /Deleted "Temporary Build"./);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("BLD-4 Adversarial 1: localStorage access error is surfaced gracefully without crashing", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  // Simulate blocked / throwing storage on setItem
  Object.defineProperty(dom.window, "localStorage", {
    get() {
      return {
        getItem() {
          return null;
        },
        setItem() {
          throw new Error("QuotaExceededError: LocalStorage limit reached");
        },
        removeItem() {},
      };
    },
  });

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(React.createElement(Panel, { build: sampleBuild }));
    });

    const saveBtn = document.getElementById("btn-save-local-character");
    await act(async () => {
      saveBtn.click();
    });

    assert.match(document.body.textContent, /QuotaExceededError/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("BLD-4 Adversarial 2: Corrupted non-JSON storage is preserved without crashing mount", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  window.localStorage.setItem(LOCAL_KEY, "{corrupted: invalid json!");

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(React.createElement(Panel, { build: sampleBuild }));
    });

    assert.equal(
      window.localStorage.getItem(LOCAL_KEY),
      "{corrupted: invalid json!",
      "Mounting must not destroy existing corrupted data"
    );
    assert.doesNotMatch(document.body.textContent, /saved/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test("BLD-4 Adversarial 3: Saving multiple distinct characters assigns unique IDs and persists all", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CustomEvent = dom.window.CustomEvent;
  global.Event = dom.window.Event;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const Panel = component("components/character-builder/local-characters-panel.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    // Render first build
    await act(async () => {
      root.render(React.createElement(Panel, { build: { ...sampleBuild, name: "Hero One" } }));
    });

    const saveBtn = document.getElementById("btn-save-local-character");
    await act(async () => {
      saveBtn.click();
    });

    // Render second build
    await act(async () => {
      root.render(
        React.createElement(Panel, {
          build: {
            name: "Hero Two",
            race: "Redguard",
            className: "Warrior",
            sign: "The Lady",
          },
        })
      );
    });

    await act(async () => {
      saveBtn.click();
    });

    const records = JSON.parse(window.localStorage.getItem(LOCAL_KEY));
    assert.equal(records.length, 2, "Both characters must be persisted");
    assert.notEqual(records[0].id, records[1].id, "Characters must have unique IDs");
    assert.equal(records[0].name, "Hero One");
    assert.equal(records[1].name, "Hero Two");

    assert.match(document.body.textContent, /2 saved/);
    assert.match(document.body.textContent, /Hero One/);
    assert.match(document.body.textContent, /Hero Two/);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
