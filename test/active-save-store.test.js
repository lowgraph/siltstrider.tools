const { test } = require("node:test");
const assert = require("node:assert/strict");

const lib = () => import("../lib/active-save-store.mjs");

function memoryStorage({ full = false, broken = false } = {}) {
  const items = new Map();
  return {
    items,
    getItem(key) { if (broken) throw new Error("blocked"); return items.has(key) ? items.get(key) : null; },
    setItem(key, value) { if (broken) throw new Error("blocked"); if (full) throw new Error("QuotaExceededError"); items.set(key, String(value)); },
    removeItem(key) { if (broken) throw new Error("blocked"); items.delete(key); }
  };
}

const SAVE = {
  formatVersion: 37,
  contentFiles: ["Morrowind.esm", "Tribunal.esm"],
  identity: { name: "Fargol", race: "Wood Elf", gender: "Male",
    class: { id: "assassin", name: null, custom: false, specialization: null, favoredAttributes: [] },
    birthsign: "The Thief", level: 3, cell: "Ascadian Isles Region",
    position: [43832.12, -51202.34, 124.87], lastExteriorPosition: [43832.12, -51202.34, 124.87] },
  vitals: { health: { current: 50, base: 50 }, magicka: { current: 40, base: 40 }, fatigue: { current: 200, base: 200 },
    gold: 1874, reputation: 0, bounty: 0, timePlayedSeconds: 3600 },
  build: { skillKindSource: null, skills: [], attributes: [] },
  progress: { quests: [], otherJournalIds: [], factions: [{ id: "Mages Guild", rank: 0, reputation: 0, expelled: false }] },
  stuff: { inventory: [{ id: "index_andra", count: 1, soul: null, equipped: false, slot: null }], spells: ["almsivi intervention"] },
  warnings: []
};

test("a loaded save comes back from storage as it went in", async () => {
  const { rememberSave, recallSave, ACTIVE_SAVE_KEY } = await lib();
  const storage = memoryStorage();
  assert.equal(await rememberSave(SAVE, storage), true);
  const record = JSON.parse(storage.items.get(ACTIVE_SAVE_KEY));
  assert.equal(record.version, 1);
  assert.ok(record.payload.length < 4000, `a few kilobytes, got ${record.payload.length}`);
  const back = await recallSave(storage);
  assert.equal(back.identity.name, "Fargol");
  assert.deepEqual(back.identity.position, [43832.12, -51202.34, 124.87], "the travel planner's starting point survives");
  assert.equal(back.vitals.gold, 1874);
  assert.deepEqual(back.stuff.spells, ["almsivi intervention"]);
  assert.equal(back.stuff.inventory[0].id, "index_andra");
  assert.equal(back.progress.factions[0].id, "Mages Guild");
});

test("anything that does not read back cleanly is removed, not trusted", async () => {
  const { recallSave, ACTIVE_SAVE_KEY } = await lib();
  for (const bad of ["not json", JSON.stringify({ version: 2, payload: "AAAA" }), JSON.stringify({ version: 1, payload: 5 }),
                     JSON.stringify({ version: 1, payload: "U0xUMQ==" }), JSON.stringify({ version: 1, payload: "@@@" })]) {
    const storage = memoryStorage();
    storage.items.set(ACTIVE_SAVE_KEY, bad);
    assert.equal(await recallSave(storage), null, bad);
    assert.equal(storage.items.has(ACTIVE_SAVE_KEY), false, "and forgotten");
  }
});

test("nothing kept, or storage unavailable, is simply nothing to restore", async () => {
  const { rememberSave, recallSave, forgetSave } = await lib();
  assert.equal(await recallSave(memoryStorage()), null);
  assert.equal(await recallSave(null), null);
  assert.equal(await recallSave(memoryStorage({ broken: true })), null, "a private window's storage throws");
  assert.equal(await rememberSave(SAVE, memoryStorage({ full: true })), false, "a full storage is not an error");
  assert.equal(await rememberSave(SAVE, memoryStorage({ broken: true })), false);
  assert.equal(await rememberSave(null, memoryStorage()), false);
  assert.doesNotThrow(() => forgetSave(memoryStorage({ broken: true })));
});

test("forgetting removes the kept save", async () => {
  const { rememberSave, recallSave, forgetSave } = await lib();
  const storage = memoryStorage();
  await rememberSave(SAVE, storage);
  forgetSave(storage);
  assert.equal(await recallSave(storage), null);
});
