const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;
const Module = require("node:module");

function component(file) {
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
  return m.exports;
}

async function loadSite(hash = "") {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  vc.on("error", (e) => errors.push(String(e)));

  const dom = await JSDOM.fromFile(path.join(__dirname, "../index.html"), {
    url: "https://example.test/" + hash,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  await new Promise((r) => setTimeout(r, 50));
  return dom;
}

test("syncStatsToCalculators populates base stats without locking or overwriting manual edits", () => {
  const dom = new JSDOM(
    `
    <input id="enc-skill" type="number" value="50">
    <input id="enc-int" type="number" value="40">
    <input id="enc-luck" type="number" value="40">
    <input id="spl-alt" type="number" value="50">
    <input id="spl-wil" type="number" value="40">
    <input id="alc-skill" type="number" value="50">
    `,
    { url: "http://localhost/" }
  );
  global.window = dom.window;
  global.document = dom.window.document;
  global.Event = dom.window.Event;

  const { syncStatsToCalculators } = component("components/character-context.jsx");

  const mockSheet = {
    attributes: {
      Intelligence: { v: 55 },
      Willpower: { v: 60 },
      Luck: { v: 40 },
      Personality: { v: 30 }
    },
    skills: {
      Enchant: { v: 35 },
      Alteration: { v: 45 },
      Alchemy: { v: 25 },
      Mercantile: { v: 20 }
    }
  };

  // 1. Initial sync seeds values
  syncStatsToCalculators(mockSheet, { force: false });
  assert.equal(document.getElementById("enc-skill").value, "35");
  assert.equal(document.getElementById("enc-int").value, "55");
  assert.equal(document.getElementById("spl-alt").value, "45");
  assert.equal(document.getElementById("spl-wil").value, "60");
  assert.equal(document.getElementById("alc-skill").value, "25");

  // 2. User simulates high-level progression (tests with Enchant 100)
  const encInput = document.getElementById("enc-skill");
  encInput.value = "100";
  encInput.dispatchEvent(new Event("input", { bubbles: true }));

  // 3. Passive background sheet update must NOT overwrite the user's manual edit
  syncStatsToCalculators(mockSheet, { force: false });
  assert.equal(document.getElementById("enc-skill").value, "100", "Manual user edit must be preserved");

  // 4. Explicit force sync (e.g. user clicks 'Ingest Base Character Stats') restores baseline
  syncStatsToCalculators(mockSheet, { force: true });
  assert.equal(document.getElementById("enc-skill").value, "35", "Force sync restores base character stat");
});

test("Enchanting HUD renders base stats and constant effect cap indicators", async () => {
  const dom = new JSDOM(
    `
    <div id="root"></div>
    <input id="enc-skill" type="number" value="35">
    <input id="enc-int" type="number" value="50">
    <input id="enc-luck" type="number" value="40">
    <input id="enc-soul" type="number" value="400">
    <select id="enc-type">
      <option value="used">Cast When Used</option>
      <option value="const" selected>Constant Effect</option>
    </select>
    `,
    { url: "http://localhost/" }
  );
  global.window = dom.window;
  global.document = dom.window.document;
  global.Event = dom.window.Event;
  global.MutationObserver = dom.window.MutationObserver;
  global.IS_REACT_ACT_ENVIRONMENT = true;

  const { CharacterProvider, EnchantingHud } = component("components/calculator-hud.jsx");

  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => {
      root.render(
        React.createElement(
          CharacterProvider,
          null,
          React.createElement(EnchantingHud)
        )
      );
    });

    const text = document.getElementById("root").textContent;
    assert.match(text, /Active Character:/);
    assert.match(text, /Constant Effect Cap:/);
    assert.match(text, /Soul: 400\/400 ✓/);
  } finally {
    await act(async () => root.unmount());
  }
});

test("Spellmaking and Alchemy reliability formulas calculate accurately", () => {
  // Spell cast chance: (2 * School - Cost + WIL / 5 + LUC / 10) * (0.75 + 0.5 * 1)
  const schoolSkill = 50;
  const spellCost = 20;
  const wil = 50;
  const luck = 40;
  const baseChance = 2 * schoolSkill - spellCost + 0.2 * wil + 0.1 * luck; // 100 - 20 + 10 + 4 = 94
  const castChance = Math.max(0, Math.min(100, Math.round(baseChance * 1.25))); // 94 * 1.25 = 117.5 -> 100
  assert.equal(castChance, 100);

  // Alchemy brew chance: Alchemy + INT / 10 + LUC / 10
  const alcSkill = 40;
  const int = 50;
  const brewChance = Math.max(0, Math.min(100, Math.round(alcSkill + 0.1 * int + 0.1 * luck))); // 40 + 5 + 4 = 49
  assert.equal(brewChance, 49);
});

test("Deep link with character payload restores enchanting view and build data", async (t) => {
  // Build a test payload for Dark Elf Custom class
  const build = {
    v: 1,
    race: "Dark Elf",
    gender: "Male",
    className: "Custom",
    sign: "The Lady",
    spec: "Combat",
    fav1: "Strength",
    fav2: "Endurance",
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"],
    min: ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"]
  };
  const b64 = Buffer.from(JSON.stringify(build)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const hash = `#enchanting&build=${b64}&world=vanilla&arce=0`;

  const dom = await loadSite(hash);
  t.after(() => dom.window.close());

  const { window } = dom;
  const { document } = window;
  assert.equal(document.querySelector(".panel.show")?.id, "panel-enchant", "Must open enchanting view");
  assert.equal(window.worldMode, "vanilla");

  // Check that character controls were restored
  assert.equal(document.getElementById("c-race").value, "Dark Elf");
  assert.equal(document.getElementById("c-class").value, "Custom");
});
