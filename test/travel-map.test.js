const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const lib = () => import("../lib/travel-map.mjs");
const graphLib = () => import("../lib/travel-graph.mjs");

test("stops sit at the average of their outdoor departure cells", async () => {
  const { resolveStopPositions } = await lib();
  const nodes = {
    "exterior:-3,-2": { key: "exterior:-3,-2", name: "Balmora" },
    "interior:balmora, guild of mages": { key: "interior:balmora, guild of mages", name: "Balmora, Guild of Mages", interior: true },
    "exterior:3,-10": { key: "exterior:3,-10", name: "Vivec, Foreign Quarter" },
    "exterior:4,-12": { key: "exterior:4,-12", name: "Vivec, Arena" }
  };
  const { positions, unplaced } = await resolveStopPositions(nodes, []);
  assert.deepEqual(positions.Balmora, [-3, -2], "the guild hall folds into the town and does not move it");
  assert.deepEqual(positions.Vivec, [3.5, -11], "every canton counts towards Vivec");
  assert.deepEqual(unplaced, []);
});

test("indoor-only stops fall back to settlements, then to their districts", async () => {
  const { resolveStopPositions } = await lib();
  const nodes = {
    a: { key: "interior:caldera, guild of mages", name: "Caldera, Guild of Mages", interior: true },
    b: { key: "interior:nivalis, icebreaker keep", name: "Nivalis, Icebreaker Keep: Mages Guild Outpost", interior: true },
    c: { key: "interior:anvil, guild of mages", name: "Anvil, Guild of Mages: Top Floor", interior: true },
    d: { key: "exterior:-121,-55", name: "Anvil, Marina" },
    e: { key: "exterior:-119,-56", name: "Anvil, Port Quarter" },
    f: { key: "interior:nowhere hall", name: "Nowhere Hall", interior: true }
  };
  const settlements = [{ name: "Caldera", centre: [-2, 2] }, { name: "Nivalis", centre: [30, 21] }, { name: "Broken", centre: ["x", 1] }];
  const { positions, unplaced } = resolveStopPositions(nodes, settlements);
  assert.deepEqual(positions.Caldera, [-2, 2]);
  assert.deepEqual(positions["Nivalis, Icebreaker Keep: Mages Guild Outpost"], [30, 21], "the part before the first comma names the settlement");
  assert.deepEqual(positions.Anvil, [-120, -55.5], "a town known only by its districts sits at their average");
  assert.deepEqual(unplaced, ["Nowhere Hall"], "anything unresolvable is reported, not guessed");
});

test("malformed nodes, keys and places are ignored", async () => {
  const { resolveStopPositions, parseGrid, regionLabels, mapBounds } = await lib();
  assert.equal(parseGrid("exterior:abc,1"), null);
  assert.equal(parseGrid("interior:balmora"), null);
  assert.equal(parseGrid(undefined), null);
  assert.deepEqual(parseGrid("exterior:-10,7"), [-10, 7]);
  const { positions, unplaced } = resolveStopPositions({ a: null, b: { key: "exterior:1,1" }, c: { key: "exterior:1,1", name: "   " } }, null);
  assert.deepEqual(positions, {});
  assert.deepEqual(unplaced, []);
  assert.deepEqual(regionLabels([null, { interior: true, region: "x region", grid: [1, 1] }, { region: "y region", grid: [NaN, 1] }]), []);
  assert.equal(mapBounds({}), null);
});

test("region labels sit at the centre of each region's cells, largest first", async () => {
  const { regionLabels, formatRegionName } = await lib();
  const labels = regionLabels([
    { key: "exterior:0,0", region: "azura's coast region", grid: [0, 0] },
    { key: "exterior:2,2", region: "azura's coast region", grid: [2, 2] },
    { key: "exterior:5,5", region: "west gash region" }
  ]);
  assert.deepEqual(labels.map(l => [l.name, l.x, l.y, l.cells]), [["Azura's Coast", 1, 1, 2], ["West Gash", 5, 5, 1]]);
  assert.equal(formatRegionName("ascadian isles region"), "Ascadian Isles");
});

test("map edges are undirected and kept once per travel mode", async () => {
  const { mapEdges } = await lib();
  const edges = mapEdges({
    Balmora: [{ to: "Vivec", kind: "Silt Strider" }, { to: "Vivec", kind: "Guild Guide" }, { to: "Balmora", kind: "Boat" }],
    Vivec: [{ to: "Balmora", kind: "Silt Strider" }, null]
  });
  assert.deepEqual(edges, [{ a: "Balmora", b: "Vivec", kind: "Silt Strider" }, { a: "Balmora", b: "Vivec", kind: "Guild Guide" }]);
});

test("compressAxis closes long empty stretches and stays continuous", async () => {
  const { compressAxis } = await lib();
  const west = [-136, -130, -120, -110, -103];
  const east = [-27, -20, -10, 0, 10, 20, 30, 40];
  const { map, inGap, breaks } = compressAxis([...west, ...east], 24, 6);
  assert.deepEqual(breaks, [{ at: -100, cells: 76 }]);
  assert.equal(map(-103), -103, "the west cluster keeps its place");
  assert.equal(map(-27), -97, "the east side moves up to the gap width");
  assert.equal(map(40) - map(0), 40, "distances inside a cluster are kept");
  assert.ok(Math.abs(map(-27.000001) - map(-27)) < 1e-3, "no jump at the edge of a gap");
  assert.ok(inGap(-60) && !inGap(-103) && !inGap(0));
  assert.equal(map(NaN), null);
  const flat = compressAxis([1, 2, 3]);
  assert.deepEqual(flat.breaks, []);
  assert.equal(flat.map(2), 2);
});

test("adaptTravelGraph still names stops the way the map does", async () => {
  const { adaptTravelGraph, cleanStopName } = await graphLib();
  assert.equal(cleanStopName("Balmora, Guild of Mages"), "Balmora");
  assert.equal(cleanStopName("Sadrith Mora, Wolverine Hall: Mage's Guild"), "Sadrith Mora");
  assert.equal(cleanStopName("Vivec, Foreign Quarter"), "Vivec");
  assert.equal(cleanStopName(""), null);
  const graph = adaptTravelGraph(
    [{ from: "a", to: "b", mode: "guild_guide" }, { from: "b", to: "c", mode: "gondola" }],
    { a: { name: "Balmora, Guild of Mages" }, b: { name: "Vivec, Arena" }, c: { name: "Vivec, Foreign Quarter" } }
  );
  assert.deepEqual(graph, { Balmora: [{ to: "Vivec", kind: "Guild Guide" }], Vivec: [] }, "canton-to-canton gondolas collapse away");
});

test("every stop in the shipped vanilla and TR networks gets a map position", async () => {
  const current = path.join(__dirname, "..", "public", "game-data", "current.json");
  if (!fs.existsSync(current)) return; // bundle is staged locally, not committed
  const { manifest } = JSON.parse(fs.readFileSync(current, "utf8"));
  const root = path.join(path.dirname(current), path.dirname(manifest));
  const { resolveStopPositions } = await lib();
  const { adaptTravelGraph } = await graphLib();
  for (const profile of ["vanilla", "tr"]) {
    const travelFile = path.join(root, profile, "Travel.json");
    if (!fs.existsSync(travelFile)) continue;
    const travel = JSON.parse(fs.readFileSync(travelFile, "utf8"));
    const places = JSON.parse(fs.readFileSync(path.join(root, profile, "Places.json"), "utf8"));
    const stops = Object.keys(adaptTravelGraph(travel.records, travel.nodes));
    const { positions } = resolveStopPositions(travel.nodes, places.settlements);
    assert.deepEqual(stops.filter(s => !positions[s]), [], `${profile}: stops without a position`);
  }
});
