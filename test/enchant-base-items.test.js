const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// The Enchanting page's base items are written by hand on the game's scale. Check them
// against the staged bundle: record enchant points times fEnchantmentMult.
test("hand-written enchanting base items match the game's capacities", async (t) => {
  const current = path.join(__dirname, "..", "public", "game-data", "current.json");
  if (!fs.existsSync(current)) return t.skip("the bundle is staged locally, not committed");
  const { manifest } = JSON.parse(fs.readFileSync(current, "utf8"));
  const dir = path.join(path.dirname(current), path.dirname(manifest), "vanilla");
  const records = (name) => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8")).records;
  const { ENCHANT_BASE_ITEMS } = await import("../lib/enchant-math.mjs");
  const { enchantMultiplier, enchantCapacity } = await import("../lib/gear-rows.mjs");

  const mult = enchantMultiplier(records("GameSettings"));
  const items = [...records("Clothing"), ...records("Armor"), ...records("Weapons")].filter((r) => !r.enchantmentId);
  let checked = 0;
  for (const base of ENCHANT_BASE_ITEMS.filter((b) => b.type !== "Custom")) {
    const record = items.find((r) => r.name === base.name);
    assert.ok(record, `${base.name} is in the game data`);
    assert.equal(base.capacity, enchantCapacity(record.enchantp, mult), `${base.name}: ${record.enchantp} points`);
    checked += 1;
  }
  assert.ok(checked >= 10);
});
