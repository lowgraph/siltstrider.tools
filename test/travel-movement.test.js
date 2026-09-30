const { test } = require("node:test");
const assert = require("node:assert/strict");

const lib = () => import("../lib/travel-movement.mjs");
const walkLib = () => import("../lib/travel-walk.mjs");

const SETTINGS = { fEncumbranceStrMult: 5, fEncumberedMoveEffect: 0.3, fMinFlySpeed: 5, fMaxFlySpeed: 300 };
const RUNNER = { speed: 40, athletics: 30, strength: 50 }; // runs 287 units a second unladen
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} against ${expected}`);

test("what is carried slows every speed, and past the capacity nobody moves", async () => {
  const { movementFor } = await lib();
  const free = movementFor(RUNNER, SETTINGS);
  close(free.run, 287, "unladen");
  assert.equal(free.capacity, 250, "Strength 50 x fEncumbranceStrMult 5");
  const half = movementFor(RUNNER, SETTINGS, { carried: 125 });
  close(half.run, 287 * (1 - 0.3 * 0.5), "half the capacity: 15% slower");
  close(half.swim, free.swim * 0.85, "swimming too");
  assert.equal(half.overloaded, false);
  const full = movementFor(RUNNER, SETTINGS, { carried: 250 });
  close(full.run, 287 * 0.7, "at capacity, still moving");
  const over = movementFor(RUNNER, SETTINGS, { carried: 250.5 });
  assert.deepEqual([over.overloaded, over.run, over.swim], [true, 0, 0], "over it, standing still");
  const weak = movementFor({ ...RUNNER, strength: 0 }, SETTINGS);
  assert.deepEqual([weak.overloaded, weak.share], [false, 0], "nothing carried is no load, even with no capacity");
  assert.equal(movementFor({ ...RUNNER, strength: 0 }, SETTINGS, { carried: 1 }).overloaded, true);
});

test("Feather takes weight off and Burden puts it on", async () => {
  const { movementFor } = await lib();
  assert.equal(movementFor(RUNNER, SETTINGS, { carried: 100, feather: 40 }).load, 60);
  assert.equal(movementFor(RUNNER, SETTINGS, { carried: 100, burden: 40 }).load, 140);
  assert.equal(movementFor(RUNNER, SETTINGS, { carried: 10, feather: 40 }).load, 0, "never below nothing");
});

test("levitating flies at Speed plus the magnitude, slowed by the load", async () => {
  const { movementFor } = await lib();
  assert.equal(movementFor(RUNNER, SETTINGS).fly, 0, "no Levitate, no flight");
  // 5 + 0.01 x (40 + 20) x (300 - 5) = 182.
  close(movementFor(RUNNER, SETTINGS, { levitate: 20 }).fly, 182, "fMinFlySpeed + 0.6 x 295");
  close(movementFor(RUNNER, SETTINGS, { levitate: 20, carried: 125 }).fly, 182 * 0.85, "the same cut for the load");
  assert.equal(movementFor(RUNNER, SETTINGS, { waterWalking: 1 }).waterWalking, true);
});

const CATALOGS = {
  Armor: [{ key: "iron_cuirass", name: "Iron Cuirass", weight: 30 }],
  Clothing: [{ key: "ring_float", name: "Ring of Floating", weight: 0.1, enchantmentId: "float_en" },
             { key: "ring_wet", name: "Ring of Wading", weight: 0.1, enchantmentId: "wade_en" },
             { key: "amulet_light", name: "Amulet of Lightness", weight: 1, enchantmentId: "light_en" }],
  Miscellaneous: [{ key: "gold_001", weight: 0 }, { key: "misc_rock", weight: 2.5 }]
};
const ENCHANTMENTS = [
  { key: "float_en", castType: "constant_effect", effects: [{ effectId: 10, magnitude: { min: 10, max: 15 } }] },
  { key: "wade_en", castType: "when_used", effects: [{ effectId: 2, magnitude: { min: 1, max: 1 } }] },
  { key: "light_en", castType: "constant_effect", effects: [{ effectId: 8, magnitude: { min: 25, max: 25 } }, { effectId: 1, magnitude: { min: 5, max: 5 } }] }];
const SPELLS = [
  { key: "argonian_ww", name: "Argonian Water Walking", type: "ability", effects: [{ effectId: 2, magnitude: { min: 1, max: 1 } }] },
  { key: "levitate", name: "Levitate", type: "spell", effects: [{ effectId: 10, magnitude: { min: 30, max: 30 } }] },
  { key: "swamp fever", name: "Swamp Fever", type: "common_disease", effects: [{ effectId: 7, magnitude: { min: 5, max: 5 } }] }];
const SAVE = { stuff: {
  inventory: [
    { id: "Iron_Cuirass", count: 1, equipped: true },
    { id: "misc_rock", count: 4, equipped: false },
    { id: "ring_float", count: 1, equipped: true },
    { id: "ring_wet", count: 1, equipped: true },
    { id: "amulet_light", count: 1, equipped: false },
    { id: "T_Mod_Unknown", count: 3, equipped: false },
    { id: "$generated:7", count: 1, equipped: true }],
  spells: ["argonian_ww", "levitate", "Swamp Fever"],
  created: [{ id: "$generated:7", kind: "CLOT", name: "Belt of Striding", weight: 2, constant: [{ effectId: 10, magnitude: 5 }] }] } };

test("a save's pack is weighed from the catalogs and its own records, and the rest is counted", async () => {
  const { carriedWeight, itemIndex } = await lib();
  const { weight, unknown } = carriedWeight(SAVE, itemIndex(CATALOGS));
  // Cuirass 30, four rocks 10, rings 0.2, amulet 1, and the belt made by the player 2.
  close(weight, 43.2, "each stack's weight times its count, ids read without case");
  assert.equal(unknown, 1, "one stack the data does not know");
  assert.deepEqual(carriedWeight(null, new Map()), { weight: 0, unknown: 0 });
});

test("constant effects come from worn enchantments, the player's own, abilities and diseases", async () => {
  const { constantEffects, itemIndex } = await lib();
  const effects = constantEffects(SAVE, itemIndex(CATALOGS), { enchantments: ENCHANTMENTS, spells: SPELLS });
  assert.equal(effects.levitate, 15, "the worn ring at its low end, 10, and the player's belt, 5");
  assert.equal(effects.waterWalking, 1, "the ability; the ring is cast when used, not worn");
  assert.equal(effects.feather, 0, "the amulet is carried, not worn");
  assert.equal(effects.burden, 5, "a disease is always on");
  assert.deepEqual(effects.sources.sort(), ["Argonian Water Walking", "Belt of Striding", "Ring of Floating", "Swamp Fever"].sort());
  const bare = constantEffects({ stuff: { inventory: [], spells: [] } }, new Map());
  assert.deepEqual([bare.levitate, bare.waterWalking, bare.sources], [0, 0, []]);
});

// Two islands, the sea between them wider than a swim: "." land, "~" water to swim,
// " " open sea. Four squares of 2,048 units a cell.
const CODE = { " ": 0, ".": 1, "#": 2, "~": 3 };
function drawGrid(rows) {
  const per = 4, height = rows.length, cells = {};
  rows.forEach((row, r) => [...row].forEach((ch, gx) => {
    const gy = height - 1 - r, key = `exterior:${Math.floor(gx / per)},${Math.floor(gy / per)}`;
    const codes = cells[key] ||= new Array(per * per).fill(0);
    codes[(gy % per) * per + (gx % per)] = CODE[ch];
  }));
  const encoded = Object.fromEntries(Object.entries(cells).map(([key, codes]) => {
    const packed = Buffer.alloc(Math.ceil(codes.length / 4));
    codes.forEach((code, i) => { packed[i >> 2] |= code << ((i & 3) * 2); });
    return [key, packed.toString("base64")];
  }));
  return { squaresPerCell: per, squareSize: 2048, cells: encoded };
}
const at = (gx, gy) => [(gx + 0.5) * 2048, (gy + 0.5) * 2048];
const LAND = Object.fromEntries([0, 1, 2, 3].map(x => [`exterior:${x},0`, "f".repeat(16)]));

test("with Water Walking the sea is walked, at the run speed, as far as it goes", async () => {
  const { walkGrid, findWalk, addStopWalks, MAX_SWIM } = await walkLib();
  const grid = walkGrid(drawGrid([".~~    ~~.", ".~~    ~~."]));
  assert.ok(8 * 2048 > MAX_SWIM);
  assert.equal(findWalk(grid, at(0, 0), at(9, 0)), null, "too far to swim");
  const walked = findWalk(grid, at(0, 0), at(9, 0), { waterWalk: true });
  assert.equal(walked.water, 8 * 2048, "eight squares of water underfoot");
  const points = new Map([["West", [at(0, 0)]], ["East", [at(9, 0)]]]);
  const none = addStopWalks({ West: [], East: [] }, points, LAND, 287, { grid, swim: 150 });
  assert.deepEqual(none.West, []);
  const legs = addStopWalks({ West: [], East: [] }, points, LAND, 287, { grid, swim: 150, waterWalk: true });
  const leg = legs.West[0];
  assert.deepEqual([leg.to, leg.waterWalk, leg.water], ["East", true, 8 * 2048]);
  close(leg.hours, (leg.distance / 287) * 30 / 3600, "all of it at the run speed, none at the swim speed");
  close(leg.movementSeconds, leg.distance / 287, "Water Walking real seconds use running speed");
});

test("with Levitate a flight goes straight over what the ground cannot cross, and only when quicker", async () => {
  const { walkGrid, addStopWalks, addPlaces, PLACE_PREFIX } = await walkLib();
  const walled = walkGrid(drawGrid(["................", "################", "................"]));
  const points = new Map([["North", [at(2, 2)]], ["South", [at(2, 0)]]]);
  const graph = () => ({ North: [], South: [] });
  assert.deepEqual(addStopWalks(graph(), points, LAND, 287, { grid: walled }).North, [], "the wall stops a walk");
  const flown = addStopWalks(graph(), points, LAND, 287, { grid: walled, fly: 182 }).North[0];
  assert.deepEqual([flown.to, flown.levitate, flown.distance], ["South", true, 2 * 2048]);
  close(flown.hours, (2 * 2048 / 182) * 30 / 3600, "at the fly speed");
  close(flown.movementSeconds, 2 * 2048 / 182, "real flight seconds use the fly speed");
  const open = walkGrid(drawGrid(["................", "................", "................"]));
  const walked = addStopWalks(graph(), points, LAND, 287, { grid: open, fly: 182 }).North[0];
  assert.equal(walked.levitate, undefined, "running is quicker than flying at 182, so the leg is walked");
  const quick = addStopWalks(graph(), points, LAND, 287, { grid: open, fly: 400 }).North[0];
  assert.equal(quick.levitate, true, "flying at 400 beats running at 287");
  const place = addPlaces({ South: [] }, ["exterior:0,0"], { points: new Map([["South", [at(2, 0)]]]), land: LAND,
    speed: 287, grid: walled, fly: 182 });
  assert.ok(place[PLACE_PREFIX + "exterior:0,0"].some(e => e.to === "South"), "a place flies too");
});

test("a flown or water-walked leg says so on the route step", async () => {
  const { planRoute } = await import("../lib/travel-graph.mjs");
  const graph = {
    A: [{ to: "B", kind: "Walk", walk: true, levitate: true, free: true, price: 0, hours: 1, distance: 9000, direction: "north" }],
    B: [{ to: "C", kind: "Walk", walk: true, waterWalk: true, terrain: true, water: 4000, free: true, price: 0, hours: 1, distance: 9000, direction: "east" }],
    C: []
  };
  const [flown, walked] = planRoute("A", "C", graph).steps;
  assert.deepEqual([flown.levitate, flown.waterWalk, walked.levitate, walked.waterWalk], [true, false, false, true]);
});
