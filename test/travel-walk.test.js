const { test } = require("node:test");
const assert = require("node:assert/strict");

const lib = () => import("../lib/travel-walk.mjs");
const ALL = "f".repeat(16);

// A strip of land along y = 0..8191 from x = 0 to 5 cells, with cell (2, 0) all sea.
const LAND = {
  "exterior:0,0": ALL, "exterior:1,0": ALL, "exterior:3,0": ALL, "exterior:4,0": ALL, "exterior:5,0": ALL,
  // Cell (6, 0): only the westmost column of blocks is land, a 7 km-wide strait beyond it.
  "exterior:6,0": "0101010101010101"
};

test("the land mask reads blocks south-west first, and a missing cell is sea", async () => {
  const { onLand } = await lib();
  assert.equal(onLand(LAND, 100, 100), true);
  assert.equal(onLand(LAND, 2 * 8192 + 100, 100), false, "no mask: sea");
  assert.equal(onLand(LAND, 6 * 8192 + 500, 100), true, "block (0, 0) of the strait cell");
  assert.equal(onLand(LAND, 6 * 8192 + 1500, 100), false, "block (1, 0) is water");
  assert.equal(onLand({ "exterior:0,0": "8000000000000000" }, 8191, 8191), true, "the top bit is the north-east block");
  assert.equal(onLand({ "exterior:0,0": "8000000000000000" }, 0, 8191), false);
  assert.equal(onLand({ "exterior:-1,-1": ALL }, -1, -1), true, "negative positions floor into cell -1");
  assert.equal(onLand(null, 0, 0), false);
  assert.equal(onLand({ "exterior:0,0": "zz" }, 0, 0), false, "a malformed mask is sea");
});

test("the longest stretch of water on a straight line", async () => {
  const { longestWater } = await lib();
  assert.equal(longestWater(LAND, [100, 4000], [8000, 4000]), 0);
  const across = longestWater(LAND, [1 * 8192 + 4000, 4000], [3 * 8192 + 4000, 4000]);
  assert.ok(across >= 8192 - 512 && across <= 8192 + 512, `about one cell of sea, got ${across}`);
});

test("run speed and time follow OpenMW 0.51.0", async () => {
  const { runSpeed, walkHours, formatDuration } = await lib();
  // (100 + 0.4 x 100) x (0.3 x 1 + 1.75) = 140 x 2.05 = 287 units a second.
  assert.equal(Math.round(runSpeed({ speed: 40, athletics: 30 }) * 100) / 100, 287);
  assert.equal(runSpeed({ speed: 0, athletics: 0 }), 175, "walk 100 times the base run multiplier");
  const hours = walkHours(8192, 287);
  assert.ok(Math.abs(hours - (8192 / 287) * 30 / 3600) < 1e-12, "timescale 30");
  assert.equal(walkHours(100, 0), null, "no speed, no time");
  assert.equal(formatDuration(hours), "14 min");
  assert.equal(formatDuration(2), "2 h");
  assert.equal(formatDuration(2.25), "2 h 15 min");
  assert.equal(formatDuration(0), "no time");
  assert.equal(formatDuration(NaN), "");
});

test("bearings are compass directions, north up", async () => {
  const { bearing } = await lib();
  assert.equal(bearing([0, 0], [10, 0]), "east");
  assert.equal(bearing([0, 0], [0, 10]), "north");
  assert.equal(bearing([0, 0], [-10, -10]), "south-west");
  assert.equal(bearing([0, 0], [10, -9]), "south-east");
});

test("stops gather the points you can walk to them from", async () => {
  const { stopPoints } = await lib();
  const nodes = {
    "exterior:0,0": { name: "Fort", town: "Fort" }, "exterior:1,0": { name: "Town, Docks", town: "Town" },
    "interior:town, guild": { name: "Town, Guild", town: "Town" }
  };
  const points = stopPoints({
    records: [{ from: "exterior:0,0", to: "exterior:1,0", fromPos: [100, 100], toPos: [9000, 100] },
              { from: "exterior:1,0", to: "interior:town, guild", fromPos: [9050, 150], toPos: [1, 1] }],
    nodes,
    access: { records: [{ key: "interior:town, guild", depth: 0, exits: [[9500, 400]] }] },
    intervention: { markers: { divine: [{ cell: "exterior:4,0", pos: [4 * 8192, 10], town: "Shrine" }], almsivi: [] } }
  });
  assert.deepEqual(points.get("Fort"), [[100, 100]]);
  assert.deepEqual(points.get("Town"), [[9000, 100], [9500, 400]], "near duplicates count once; an indoor stop adds its exit");
  assert.deepEqual(points.get("Shrine"), [[4 * 8192, 10]]);
});

test("nearby stops are joined on foot, but never across the sea or too far", async () => {
  const { addStopWalks } = await lib();
  const graph = { A: [], B: [], C: [], D: [] };
  const points = new Map([["A", [[500, 4000]]], ["B", [[1 * 8192 + 500, 4000]]],
    ["C", [[3 * 8192 + 500, 4000]]], ["D", [[5 * 8192 + 500, 4000]]]]);
  const walked = addStopWalks(graph, points, LAND, 287);
  assert.deepEqual(walked.A.map(e => e.to), ["B"], "A-C crosses the sea cell; A-D is too far");
  assert.deepEqual(walked.B.map(e => e.to), ["A"], "B-C is in reach but crosses a cell of sea");
  assert.deepEqual(walked.C.map(e => e.to), ["D"], "C-D is two cells over land");
  const leg = walked.C[0];
  assert.deepEqual([leg.kind, leg.walk, leg.free, leg.distance, leg.direction], ["Walk", true, true, 2 * 8192, "east"]);
  assert.deepEqual(addStopWalks(graph, points, null, 287), graph, "without a land mask nobody walks");
});

test("a place joins the network by walking, and a sealed one cannot", async () => {
  const { addPlaces, placePoints, doorChain, PLACE_PREFIX } = await lib();
  const access = { records: [
    { key: "interior:tomb", depth: 0, exits: [[600, 4000]] },
    { key: "interior:tomb, crypt", depth: 1, via: "interior:tomb", exits: [[600, 4000]] },
    { key: "interior:vault", depth: null, exits: [] }] };
  assert.deepEqual(placePoints("exterior:1,0"), [[8192 + 4096, 4096]]);
  assert.deepEqual(placePoints("interior:vault", access), []);
  assert.deepEqual(doorChain("interior:tomb, crypt", access), ["interior:tomb, crypt", "interior:tomb"]);
  const points = new Map([["A", [[500, 4000]]]]);
  const graph = addPlaces({ A: [] }, ["interior:tomb, crypt", "interior:vault"], { points, access, land: LAND, speed: 287 });
  const crypt = PLACE_PREFIX + "interior:tomb, crypt";
  assert.deepEqual(graph[crypt].map(e => [e.to, e.kind]), [["A", "Walk"]]);
  assert.ok(graph.A.some(e => e.to === crypt), "and back again");
  assert.deepEqual(graph[PLACE_PREFIX + "interior:vault"], [], "no door out, no walk");
});

test("interventions can be cast from a chosen place", async () => {
  const { addPlaces, PLACE_PREFIX } = await lib();
  const intervention = {
    records: [{ key: "exterior:1,0", divine: 0, almsivi: null }],
    markers: { divine: [{ cell: "exterior:4,0", pos: [0, 0], name: "Fort Shrine", town: "Fort" }], almsivi: [] }
  };
  const graph = addPlaces({}, ["exterior:1,0"], { intervention, spells: { divine: true, almsivi: true } });
  assert.deepEqual(graph[PLACE_PREFIX + "exterior:1,0"].map(e => [e.to, e.spell]), [["Fort", "divine"]]);
  assert.deepEqual(addPlaces({}, ["exterior:1,0"], { intervention, spells: {} })[PLACE_PREFIX + "exterior:1,0"], []);
});
