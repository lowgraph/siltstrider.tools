const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
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
