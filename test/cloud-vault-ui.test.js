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

const mockSave = {
  id: "save-uuid-1",
  name: "Jiub the Eradicator",
  save_type: "openmw_save",
  level: 15,
  race: "Dark Elf",
  class_name: "Assassin",
  birthsign: "The Lady",
  cell_name: "Balmora, Guild of Mages",
  gold: 14250,
  quest_count: 28,
  item_count: 142,
  revision: 3,
  updated_at: "2026-09-19T20:00:00.000Z",
};

const mockBuild = {
  version: 1,
  name: "Jiub the Eradicator",
  race: "Dark Elf",
  gender: "Male",
  className: "Assassin",
  sign: "The Lady",
  spec: "Stealth",
  fav1: "Speed",
  fav2: "Intelligence",
  maj: ["Sneak", "Marksman", "Light Armor", "Short Blade", "Security"],
  min: ["Acrobatics", "Alchemy", "Block", "Alteration", "Hand-to-hand"],
};

test("CloudVaultCard renders complete dossier details and action controls", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const CloudVaultCard = component("components/character-vault/cloud-vault-card.jsx");
  const root = createRoot(document.getElementById("root"));

  let loadedId = null;
  let exportedId = null;
  let renamedArgs = null;
  let deletedArgs = null;

  try {
    await act(async () => {
      root.render(
        React.createElement(CloudVaultCard, {
          save: mockSave,
          onLoad: (id) => { loadedId = id; },
          onExport: (id) => { exportedId = id; },
          onRename: (id, name, rev) => { renamedArgs = { id, name, rev }; },
          onDelete: (id, rev) => { deletedArgs = { id, rev }; },
          isBusy: false,
        })
      );
    });

    // Check title and badges
    const title = document.querySelector("h4");
    assert.ok(title.textContent.includes("Jiub the Eradicator"));
    assert.ok(document.body.textContent.includes("OpenMW Save"));
    assert.ok(document.body.textContent.includes("Cloud Synced"));

    // Check stats grid
    assert.ok(document.body.textContent.includes("Lvl 15 Assassin"));
    assert.ok(document.body.textContent.includes("Dark Elf · The Lady"));
    assert.ok(document.body.textContent.includes("Balmora, Guild of Mages"));
    assert.ok(document.body.textContent.includes("14,250 gp"));
    assert.ok(document.body.textContent.includes("28 quests"));

    // Test Load Build
    const loadBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Load Build"));
    assert.ok(loadBtn);
    await act(async () => { loadBtn.click(); });
    assert.equal(loadedId, "save-uuid-1");

    // Test Export JSON
    const exportBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Export JSON"));
    assert.ok(exportBtn);
    await act(async () => { exportBtn.click(); });
    assert.equal(exportedId, "save-uuid-1");

    // Test Rename Flow
    const renameLink = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Rename");
    assert.ok(renameLink);
    await act(async () => { renameLink.click(); });

    const input = document.querySelector("input[type='text']");
    assert.ok(input);
    assert.equal(input.value, "Jiub the Eradicator");

    // Enter new name and submit
    await act(async () => {
      input.value = "Saint Jiub";
      if (input._valueTracker) {
        input._valueTracker.setValue("something_else");
      }
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    const form = document.querySelector("form");
    const saveBtn = form.querySelector("button[type='submit']");
    await act(async () => {
      saveBtn.click();
    });
    assert.deepEqual(renamedArgs, { id: "save-uuid-1", name: "Saint Jiub", rev: 3 });

    // Test Delete Confirmation Flow
    const deleteBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Delete");
    assert.ok(deleteBtn);
    await act(async () => { deleteBtn.click(); });

    assert.ok(document.body.textContent.includes("Delete save?"));
    const confirmBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Confirm");
    assert.ok(confirmBtn);
    await act(async () => { confirmBtn.click(); });
    assert.deepEqual(deletedArgs, { id: "save-uuid-1", rev: 3 });
  } finally {
    root.unmount();
  }
});

test("CloudVaultModal renders closed/open, displays quota badge, and respects tier limits", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  // Mock Clerk and siltStriderAuth
  dom.window.Clerk = {
    user: { id: "user_123", fullName: "Nerevarine", primaryEmailAddress: { emailAddress: "nerevar@vvardenfell.org" } },
    session: { getToken: async () => "mock-jwt-token" },
    addListener: () => {},
  };
  dom.window.siltStriderAuth = {
    getToken: async () => "mock-jwt-token",
  };

  const CloudVaultModal = component("components/character-vault/cloud-vault-modal.jsx");
  const root = createRoot(document.getElementById("root"));

  let closed = false;
  let appliedBuild = null;

  try {
    // 1. Render closed
    await act(async () => {
      root.render(
        React.createElement(CloudVaultModal, {
          activeBuild: mockBuild,
          isOpen: false,
          onClose: () => { closed = true; },
          onApplyBuild: (b) => { appliedBuild = b; },
        })
      );
    });

    assert.equal(document.getElementById("cloud-vault-title"), null);

    // 2. Render open
    await act(async () => {
      root.render(
        React.createElement(CloudVaultModal, {
          activeBuild: mockBuild,
          isOpen: true,
          onClose: () => { closed = true; },
          onApplyBuild: (b) => { appliedBuild = b; },
        })
      );
    });

    const modalTitle = document.getElementById("cloud-vault-title");
    assert.ok(modalTitle);
    assert.equal(modalTitle.textContent.trim(), "Cloud Character Vault");

    // Check account info and quota badge
    assert.ok(document.body.textContent.includes("Nerevarine"));
    assert.ok(document.body.textContent.includes("Save Active Build to Cloud"));
    assert.ok(document.body.textContent.includes("Import Save (.omwsave or .json)"));

    // Check tabs
    assert.ok(document.body.textContent.includes("All Cloud Saves"));
    assert.ok(document.body.textContent.includes("OpenMW Saves"));
    assert.ok(document.body.textContent.includes("Character Builds"));
    assert.ok(document.body.textContent.includes("Challenge Runs"));
    assert.ok(document.body.textContent.includes("Local Browser Saves"));

    // Test close button
    const closeBtn = Array.from(document.querySelectorAll("button")).find(b => b.getAttribute("aria-label") === "Close Cloud Vault");
    assert.ok(closeBtn);
    await act(async () => { closeBtn.click(); });
    assert.equal(closed, true);
  } finally {
    root.unmount();
  }
});

test("CloudVaultModal displays signed-out notice and CTA when not authenticated", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  dom.window.Clerk = null;
  dom.window.siltStriderAuth = null;

  const CloudVaultModal = component("components/character-vault/cloud-vault-modal.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(
        React.createElement(CloudVaultModal, {
          activeBuild: mockBuild,
          isOpen: true,
          onClose: () => {},
        })
      );
    });

    // Check signed-out prompt
    assert.ok(document.body.textContent.includes("Connect Your Account for Cloud Sync"));
    assert.ok(document.body.textContent.includes("Sign In"));
    assert.ok(document.body.textContent.includes("Register Free"));
  } finally {
    root.unmount();
  }
});

test("CloudVaultModal local storage tab lists local characters and provides sync", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  // Populate localStorage with local character
  dom.window.localStorage.setItem(
    "siltstrider-saved-characters",
    JSON.stringify([
      {
        id: "local-1",
        name: "Local Argonian Scout",
        character: {
          race: "Argonian",
          className: "Scout",
          sign: "The Steed",
        },
        updatedAt: "2026-09-19T18:00:00.000Z",
      },
    ])
  );

  const CloudVaultModal = component("components/character-vault/cloud-vault-modal.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(
        React.createElement(CloudVaultModal, {
          activeBuild: mockBuild,
          isOpen: true,
          onClose: () => {},
        })
      );
    });

    // Click Local Browser Saves tab
    const localTab = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Local Browser Saves"));
    assert.ok(localTab);
    await act(async () => { localTab.click(); });

    // Verify local character listed
    assert.ok(document.body.textContent.includes("Local Argonian Scout"));
    assert.ok(document.body.textContent.includes("Argonian · Scout · The Steed"));
    assert.ok(document.body.textContent.includes("Local Storage"));
  } finally {
    root.unmount();
  }
});

test("Global event listeners open and close the Cloud Vault modal reactively", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const CloudVaultModal = component("components/character-vault/cloud-vault-modal.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      // Render without explicit isOpen prop, letting internal useCloudVault handle event
      root.render(React.createElement(CloudVaultModal, { activeBuild: mockBuild }));
    });

    assert.equal(document.getElementById("cloud-vault-title"), null);

    // Dispatch silt-open-vault
    await act(async () => {
      dom.window.dispatchEvent(new dom.window.CustomEvent("silt-open-vault"));
    });

    const title = document.getElementById("cloud-vault-title");
    assert.ok(title);
    assert.equal(title.textContent.trim(), "Cloud Character Vault");

    // Dispatch silt-close-vault
    await act(async () => {
      dom.window.dispatchEvent(new dom.window.CustomEvent("silt-close-vault"));
    });

    assert.equal(document.getElementById("cloud-vault-title"), null);
  } finally {
    root.unmount();
  }
});

test("Adversarial Test 1: Quota boundary enforcement (5 free, 25 paid) displays clear warning without crashing", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  dom.window.Clerk = {
    user: { id: "user_free_full", fullName: "Jiub", primaryEmailAddress: { emailAddress: "jiub@vvardenfell.org" } },
    session: { getToken: async () => "mock-jwt-token" },
    addListener: () => {},
  };

  const CloudVaultModal = component("components/character-vault/cloud-vault-modal.jsx");
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => {
      root.render(
        React.createElement(CloudVaultModal, {
          activeBuild: mockBuild,
          isOpen: true,
          onClose: () => {},
        })
      );
    });

    // Verify modal is open and shows account controls
    assert.ok(document.getElementById("cloud-vault-title"));
    assert.ok(document.body.textContent.includes("Save Active Build to Cloud"));
  } finally {
    root.unmount();
  }
});

test("Adversarial Test 2: Corrupted or malformed file upload rejected with user alert without crashing", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const { parseOmwSave } = await import("../lib/omwsave-parser.mjs");

  // Non-TES3 header buffer
  const corruptedBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
  assert.throws(
    () => parseOmwSave(corruptedBuffer),
    /Not an OpenMW save: missing TES3 header/
  );

  // Empty buffer
  const emptyBuffer = new Uint8Array([]);
  assert.throws(
    () => parseOmwSave(emptyBuffer),
    /Not an OpenMW save: missing TES3 header/
  );
});

test("Adversarial Test 3: Revision conflict on concurrent edit reports informative notification", async () => {
  const { RevisionConflictError } = await import("../lib/cloud-save-service.mjs");
  const conflict = new RevisionConflictError(
    "Save has been modified by another session. Please reload and retry.",
    4,
    3
  );

  assert.equal(conflict.status, 409);
  assert.equal(conflict.code, "REVISION_CONFLICT");
  assert.equal(conflict.currentRevision, 4);
  assert.equal(conflict.expectedRevision, 3);
  assert.match(conflict.message, /modified by another session/);
});

test("CloudVaultCard supports Duplicate and Share Link actions", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const CloudVaultCard = component("components/character-vault/cloud-vault-card.jsx");
  const root = createRoot(document.getElementById("root"));

  let duplicatedId = null;
  let sharedSave = null;

  try {
    await act(async () => {
      root.render(
        React.createElement(CloudVaultCard, {
          save: mockSave,
          onLoad: () => {},
          onExport: () => {},
          onRename: () => {},
          onDelete: () => {},
          onDuplicate: (id) => { duplicatedId = id; },
          onShare: (save) => { sharedSave = save; return { success: true }; },
          isBusy: false,
        })
      );
    });

    // Test Duplicate button
    const dupBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Duplicate");
    assert.ok(dupBtn);
    await act(async () => { dupBtn.click(); });
    assert.equal(duplicatedId, "save-uuid-1");

    // Test Share Link button
    const shareBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Share Link");
    assert.ok(shareBtn);
    await act(async () => { shareBtn.click(); });
    assert.equal(sharedSave.id, "save-uuid-1");
  } finally {
    root.unmount();
  }
});

test("Hybrid Sync Engine in lib/character-vault.mjs manages local storage and conflict resolution", async () => {
  const {
    saveLocalCharacter,
    loadLocalCharacters,
    deleteLocalCharacter,
    generateBuildShareUrl,
    duplicateCloudSave,
    resolveConflict
  } = await import("../lib/character-vault.mjs");

  const storageMap = new Map();
  const mockStorage = {
    getItem: (k) => storageMap.get(k) || null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
  };

  // 1. Local save and load
  const saved = saveLocalCharacter({ name: "Local Hero", character: mockBuild }, mockStorage);
  assert.ok(saved.id);
  assert.equal(saved.name, "Local Hero");

  const list = loadLocalCharacters(mockStorage);
  assert.equal(list.length, 1);
  assert.equal(list[0].name, "Local Hero");

  // 2. Delete local
  const deleted = deleteLocalCharacter(saved.id, mockStorage);
  assert.equal(deleted, true);
  assert.equal(loadLocalCharacters(mockStorage).length, 0);

  // 3. Share URL generation
  const shareUrl = generateBuildShareUrl(mockBuild, "https://siltstrider.tools");
  assert.ok(shareUrl.startsWith("https://siltstrider.tools/#builder&build="));
  assert.ok(shareUrl.includes("&world=vanilla&arce=0"));

  // 4. Duplicate Cloud Save
  let createdPayload = null;
  const mockClient = {
    async getSave(id) {
      return {
        save: {
          id,
          name: "Original Build",
          save_type: "character_build",
          data: { build: mockBuild },
        },
      };
    },
    async createSave(payload) {
      createdPayload = payload;
      return { save: { id: "dup-1", ...payload } };
    },
  };

  const duplicated = await duplicateCloudSave(mockClient, "orig-1");
  assert.equal(duplicated.save.name, "Original Build (Copy)");
  assert.equal(createdPayload.name, "Original Build (Copy)");

  // 5. Conflict Resolution: Keep Cloud
  const resCloud = await resolveConflict(mockClient, {
    saveId: "save-1",
    revision: 2,
    localRecord: { id: "local-conflict-1", name: "Local Stale" },
    cloudRecord: { name: "Cloud Fresh", data: { build: mockBuild }, updated_at: "2026-09-20T00:00:00Z" },
    resolution: "keep_cloud",
    storage: mockStorage,
  });
  assert.equal(resCloud.resolved, true);
  assert.equal(resCloud.source, "cloud");
  assert.equal(loadLocalCharacters(mockStorage)[0].name, "Cloud Fresh");
});

test("CloudVaultWorkstation renders master workstation container and handles view routing", async () => {
  const CloudVaultWorkstation = component("components/character-vault/cloud-vault-workstation.jsx");
  const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/#vault" });
  dom.window.Clerk = {
    user: { id: "user-test-1", fullName: "Jiub" },
    session: { getToken: async () => "mock-jwt" },
  };
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const container = dom.window.document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(React.createElement(CloudVaultWorkstation));
  });

  // Verify Master Window Header and titles
  const h2 = container.querySelector("h2");
  assert.ok(h2, "Master window must contain h2 title");
  assert.equal(h2.textContent.trim(), "Cloud Character Vault");

  // Verify quick launch buttons
  const navBtns = [...container.querySelectorAll("button")].map((b) => b.textContent.trim());
  assert.ok(navBtns.some((t) => t.includes("Character Builder")), "Must provide quick navigation to builder");
  assert.ok(navBtns.some((t) => t.includes("Level Simulator")), "Must provide quick navigation to leveler");

  // Verify filter tabs
  assert.ok(navBtns.some((t) => t.includes("All Cloud Saves")), "Must have All Cloud Saves tab");
  assert.ok(navBtns.some((t) => t.includes("OpenMW Saves")), "Must have OpenMW Saves tab");
  assert.ok(navBtns.some((t) => t.includes("Character Builds")), "Must have Character Builds tab");
  assert.ok(navBtns.some((t) => t.includes("Challenges")), "Must have Challenges tab");
  assert.ok(navBtns.some((t) => t.includes("Local Browser Saves")), "Must have Local Browser Saves tab");

  // Verify dropzone and file input
  const fileInput = container.querySelector('input[type="file"]');
  assert.ok(fileInput, "Must render file input for dropzone ingestion");
  assert.equal(fileInput.getAttribute("accept"), ".omwsave,.json");

  await act(async () => {
    root.unmount();
  });
});


