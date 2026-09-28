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

test("a save is placed by its room indoors and its position outdoors", async () => {
  const { placeFromSave } = await lib();
  const places = new Set(["interior:seyda neen, arrille's tradehouse", "exterior:5,-7", "exterior:-2,-9"]);
  assert.equal(placeFromSave({ identity: { cell: "Seyda Neen, Arrille's Tradehouse", position: [-265, -78, 129] } }, places),
    "interior:seyda neen, arrille's tradehouse", "indoors the position is local; the name decides");
  assert.equal(placeFromSave({ identity: { cell: "Ascadian Isles Region", position: [43832.1, -51202.3, 124.9] } }, places),
    "exterior:5,-7", "a region name says nothing precise; the position does");
  assert.equal(placeFromSave({ identity: { cell: "Somewhere Unknown", position: [1e7, 1e7, 0], lastExteriorPosition: [-12414.8, -70046.3, 426] } }, places),
    "exterior:-2,-9", "the last exterior position when the position leads nowhere");
  assert.equal(placeFromSave({ identity: { cell: null, position: null } }, places), null);
  assert.equal(placeFromSave(null, places), null);
  assert.equal(placeFromSave({ identity: { cell: "x", position: ["a", 1] } }, places), null);
  assert.equal(placeFromSave({ identity: { cell: "Seyda Neen, Arrille's Tradehouse" } }, new Map([["interior:seyda neen, arrille's tradehouse", {}]])),
    "interior:seyda neen, arrille's tradehouse", "a Map of places works too");
});

test("a save with no position, reopened from the cloud, is placed by its town's name", async () => {
  const { placeFromSave } = await lib();
  const places = new Map([
    ["exterior:-2,-9", { key: "exterior:-2,-9", name: "Seyda Neen", interior: false }],
    ["exterior:-3,-9", { key: "exterior:-3,-9", name: "Seyda Neen", interior: false }],
    ["interior:seyda neen", { key: "interior:seyda neen", name: "Seyda Neen", interior: true }],
    ["exterior:4,-4", { key: "exterior:4,-4", interior: false, region: "ascadian isles region" }]]);
  assert.equal(placeFromSave({ identity: { cell: "Seyda Neen" } }, places), "interior:seyda neen", "an interior of that name first");
  places.delete("interior:seyda neen");
  assert.equal(placeFromSave({ identity: { cell: "seyda neen" } }, places), "exterior:-2,-9", "the town's first cell, case aside");
  assert.equal(placeFromSave({ identity: { cell: "Ascadian Isles Region" } }, places), null, "a region is too vague to start from");
  assert.equal(placeFromSave({ identity: { cell: "Seyda Neen" } }, new Set(["exterior:-2,-9"])), null, "a Set carries no names");
});

// A walkable grid drawn as rows north first: "." land, "#" too steep or a wall, "~" water
// to swim, " " open sea. Four squares of 2,048 units a cell, so cell (0, 0) is the
// bottom-left four by four.
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

test("the walkable grid decodes two bits a square, south-west first, and refuses what it cannot read", async () => {
  const { walkGrid, squareAt, SEA, LAND, BLOCKED, SWIM } = await lib();
  const grid = walkGrid(drawGrid(["~#..", "....", "....", ".#.."]));
  assert.equal(squareAt(grid, 0, 0), LAND);
  assert.equal(squareAt(grid, 1, 0), BLOCKED, "the second square of the bottom row");
  assert.equal(squareAt(grid, 0, 3), SWIM, "the top-left square is the last row");
  assert.equal(squareAt(grid, 1, 3), BLOCKED);
  assert.equal(squareAt(grid, 5, 0), SEA, "a cell the grid lacks is open sea");
  assert.equal(squareAt(grid, -1, -1), SEA, "and so is one to the south-west");
  assert.equal(walkGrid(null), null);
  assert.equal(walkGrid({ squaresPerCell: 4, squareSize: 1000, cells: {} }), null, "squares must tile a cell");
  assert.equal(walkGrid({ squaresPerCell: 4, squareSize: 2048 }), null, "no cells");
  const broken = walkGrid({ squaresPerCell: 4, squareSize: 2048, cells: { "exterior:0,0": "AA==" } });
  assert.equal(squareAt(broken, 0, 0), SEA, "a cell too short to hold its squares is sea, not garbage");
});

test("a walk over the grid goes round a wall, and none crosses a closed one", async () => {
  const { walkGrid, findWalk } = await lib();
  const open = walkGrid(drawGrid([
    "........",
    ".######.",
    "........",
    "........"]));
  const round = findWalk(open, at(3, 3), at(3, 1));
  assert.ok(round, "a way round the end of the wall");
  assert.ok(round.distance > 2 * 2048 * 1.5, `longer than the straight line, got ${round.distance}`);
  assert.equal(round.water, 0);
  const closed = walkGrid(drawGrid([
    "........",
    "########",
    "........",
    "........"]));
  assert.equal(findWalk(closed, at(3, 3), at(3, 1)), null, "a wall end to end, and sea beyond the grid");
  assert.equal(findWalk(open, at(3, 3), at(3, 1), { maxCost: 2048 * 3 }), null, "nothing within the cost allowed");
});

test("a diagonal step cannot slip between two blocked squares", async () => {
  const { walkGrid, findWalk } = await lib();
  const grid = walkGrid(drawGrid([
    "        ",
    "   #.   ",
    "   .#   ",
    "        "]));
  assert.equal(findWalk(grid, at(4, 2), at(3, 1)), null, "the two land squares only touch at a corner");
});

test("a walk's ends move onto ground it can stand on, but not far", async () => {
  const { walkGrid, findWalk } = await lib();
  const grid = walkGrid(drawGrid([
    "#.......",
    "........",
    "........",
    "........"]));
  const walk = findWalk(grid, at(0, 3), at(7, 3));
  assert.ok(walk, "a door in a cliff face: the walk starts from the land beside it");
  const far = walkGrid(drawGrid([
    "####....",
    "####....",
    "####....",
    "####...."]));
  assert.equal(findWalk(far, at(0, 3), at(7, 3)), null, "more than two squares from any footing");
});

test("water is swum near land, timed at the swim speed, and never for long", async () => {
  const { walkGrid, findWalk, swimSpeed, runSpeed, MAX_SWIM } = await lib();
  const strait = walkGrid(drawGrid([".~~.", ".~~.", ".~~.", ".~~."]));
  const across = findWalk(strait, at(0, 1), at(3, 1));
  assert.equal(across.water, 2 * 2048, "two squares swum");
  assert.equal(across.land, 2048, "half a square either side, from each end to its middle");
  // Run 287 x (0.5 + 0.01 x 30 x 0.1) = 287 x 0.53.
  assert.equal(Math.round(swimSpeed({ speed: 40, athletics: 30 }) * 100) / 100, Math.round(287 * 0.53 * 100) / 100);
  assert.ok(swimSpeed({ speed: 40, athletics: 30 }) < runSpeed({ speed: 40, athletics: 30 }));
  const wide = walkGrid(drawGrid([".~~~~~~~~~~~~~~.", "................"]));
  const dry = findWalk(wide, at(0, 1), at(15, 1), { swimCost: 1.9 });
  assert.equal(dry.water, 0, "swimming costs more than running, so the path keeps to land");
  const sea = walkGrid(drawGrid([".~~~~~~~~~~~~~~."]));
  assert.ok(14 * 2048 > MAX_SWIM);
  assert.equal(findWalk(sea, at(0, 0), at(15, 0)), null, "no walk swims the length of a coast");
});

test("stops are joined over the grid when there is one, as legs that say so", async () => {
  const { walkGrid, addStopWalks } = await lib();
  const grid = walkGrid(drawGrid([
    "................",
    "................",
    "######.#########",
    "................"]));
  const points = new Map([["North", [at(2, 3)]], ["South", [at(2, 0)]]]);
  const land = { "exterior:0,0": "f".repeat(16), "exterior:1,0": "f".repeat(16), "exterior:2,0": "f".repeat(16), "exterior:3,0": "f".repeat(16) };
  const straight = addStopWalks({ North: [], South: [] }, points, land, 287);
  assert.equal(straight.North[0].terrain, undefined, "without a grid, a straight line as before");
  assert.equal(straight.North[0].distance, 3 * 2048);
  const walked = addStopWalks({ North: [], South: [] }, points, land, 287, { grid, swim: 150 });
  const leg = walked.North.find(e => e.to === "South");
  assert.ok(leg.terrain);
  assert.equal(leg.straight, 3 * 2048);
  assert.ok(leg.distance > leg.straight, "through the gap at the sixth square");
  assert.equal(leg.water, 0);
  assert.ok(walked.South.some(e => e.to === "North" && e.distance === leg.distance), "and back the same way");
  const shut = walkGrid(drawGrid(["................", "################", "................"]));
  assert.deepEqual(addStopWalks({ North: [], South: [] }, new Map([["North", [at(2, 2)]], ["South", [at(2, 0)]]]), land, 287, { grid: shut }).North, [],
    "a wall end to end: no walk, though the straight line is short");
});

test("a place walled in reaches the network the long way round", async () => {
  const { walkGrid, addPlaces, PLACE_PREFIX, PLACE_WALK_LIMIT } = await lib();
  // A ring wall three cells wide with its only gate at the far end: the stop is just
  // outside the near side, but the walk out goes all the way round.
  const grid = walkGrid(drawGrid([
    "................",
    "#########.##....",
    ...Array(10).fill("#..........#...."),
    "############....",
    "................"]));
  const points = new Map([["Outside", [at(14, 7)]]]);
  const land = Object.fromEntries([0, 1, 2, 3].flatMap(x => [0, 1, 2, 3].map(y => [`exterior:${x},${y}`, "f".repeat(16)])));
  const inside = "exterior:1,1";
  const graph = addPlaces({ Outside: [] }, [inside], { points, land, speed: 287, grid, limit: 4 * 8192 });
  const walk = graph[PLACE_PREFIX + inside].find(e => e.to === "Outside");
  assert.ok(walk, "a walk, through the gate");
  assert.ok(walk.distance > walk.straight * 1.5, `beyond the usual detour: ${walk.distance} against ${walk.straight}`);
  // With a reach of 2.2 cells the stop (2.16 cells off) is in reach in a straight line, but
  // the walk round (4.7 cells) is longer than 1.5 times the reach: only the further search
  // finds it. That search still counts only stops within the reach in a straight line:
  // "Distant" (3 cells off) is never walked to, though its path is within three times it.
  const reach = 2.2 * 8192;
  const both = new Map([...points, ["Distant", [at(15, 13)]]]);
  const far = addPlaces({ Outside: [], Distant: [] }, [inside], { points: both, land, speed: 287, grid, limit: reach });
  const walks = far[PLACE_PREFIX + inside];
  const out = walks.find(e => e.to === "Outside");
  assert.ok(out && out.distance > reach * 1.5 && out.distance <= reach * 3, "found by the search three times as far");
  assert.equal(walks.some(e => e.to === "Distant"), false, "a stop beyond the reach in a straight line stays out");
  assert.ok(PLACE_WALK_LIMIT > reach);
});

// Mournhold: no door outside anywhere. The transport arrives in the courtyard; the
// bazaar and the temple are through doors; a sewer loops back; a vault has no doors.
const MOURNHOLD = { records: [
  { key: "interior:mournhold, courtyard", depth: null, exits: [], doors: ["interior:mournhold, plaza"] },
  { key: "interior:mournhold, plaza", depth: null, exits: [], doors: ["interior:mournhold, bazaar", "interior:mournhold, courtyard", "interior:mournhold, temple"] },
  { key: "interior:mournhold, bazaar", depth: null, exits: [], doors: ["interior:mournhold, plaza", "interior:mournhold, sewers"] },
  { key: "interior:mournhold, sewers", depth: null, exits: [], doors: ["interior:mournhold, bazaar", "interior:mournhold, temple"] },
  { key: "interior:mournhold, temple", depth: null, exits: [], doors: ["interior:mournhold, plaza", "interior:mournhold, sewers"] },
  { key: "interior:vault", depth: null, exits: [], doors: [] },
  { key: "interior:tomb", depth: 0, exits: [[600, 4000]] }] };

test("a sealed room's doors are searched nearest first, and a room with a way out has none", async () => {
  const { roomsThrough } = await lib();
  const rooms = roomsThrough("interior:mournhold, bazaar", MOURNHOLD);
  assert.deepEqual(rooms.get("interior:mournhold, courtyard"),
    ["interior:mournhold, bazaar", "interior:mournhold, plaza", "interior:mournhold, courtyard"]);
  assert.deepEqual(rooms.get("interior:mournhold, temple"),
    ["interior:mournhold, bazaar", "interior:mournhold, plaza", "interior:mournhold, temple"],
    "two doors either way round; ties go to the order the doors are listed");
  assert.equal(rooms.has("interior:mournhold, bazaar"), false, "not the room itself");
  assert.equal(rooms.size, 4);
  assert.equal(roomsThrough("interior:vault", MOURNHOLD).size, 0, "no doors, nowhere to go");
  assert.equal(roomsThrough("interior:tomb", MOURNHOLD).size, 0, "a room with a way out walks outside instead");
  assert.equal(roomsThrough("interior:mournhold, bazaar", { records: [{ key: "interior:mournhold, bazaar", depth: null, exits: [] }] }).size, 0,
    "a release before Access 1.2.0 lists no doors");
  assert.equal(roomsThrough("interior:mournhold, bazaar", null).size, 0);
});

test("a sealed place joins the rooms the network knows through its doors, both ways", async () => {
  const { addPlaces, PLACE_PREFIX } = await lib();
  const courtyard = PLACE_PREFIX + "interior:mournhold, courtyard";
  const bazaar = PLACE_PREFIX + "interior:mournhold, bazaar";
  const graph = { [courtyard]: [], Ebonheart: [{ to: courtyard, kind: "Dialogue Teleport" }] };
  const nodes = { "interior:mournhold, temple": { name: "Mournhold, Temple", town: "Mournhold Temple" } };
  const out = addPlaces({ ...graph, "Mournhold Temple": [] }, ["interior:mournhold, bazaar"], { access: MOURNHOLD, nodes });
  const legs = out[bazaar].filter(e => e.indoors);
  assert.deepEqual(legs.map(e => e.to).sort(), ["Mournhold Temple", courtyard].sort(), "a teleport's room and a stop");
  const toCourtyard = legs.find(e => e.to === courtyard);
  assert.deepEqual([toCourtyard.kind, toCourtyard.hours, toCourtyard.price, toCourtyard.doors.length], ["Indoors", 0, 0, 3]);
  const back = out[courtyard].find(e => e.to === bazaar);
  assert.deepEqual(back.doors, [...toCourtyard.doors].reverse(), "and back, the rooms in the other order");
  const alone = addPlaces({}, ["interior:mournhold, bazaar"], { access: MOURNHOLD });
  assert.deepEqual(alone[bazaar], [], "nothing the network knows is through the doors");
  assert.deepEqual(addPlaces({}, ["interior:vault"], { access: MOURNHOLD })[PLACE_PREFIX + "interior:vault"], []);
});

test("two sealed places added together can reach each other through the doors", async () => {
  const { addPlaces, PLACE_PREFIX } = await lib();
  const out = addPlaces({}, ["interior:mournhold, temple", "interior:mournhold, courtyard"], { access: MOURNHOLD });
  assert.ok(out[PLACE_PREFIX + "interior:mournhold, temple"].some(e => e.to === PLACE_PREFIX + "interior:mournhold, courtyard" && e.indoors),
    "the first place added links to the second, though it was added after");
  assert.equal(out[PLACE_PREFIX + "interior:mournhold, courtyard"].filter(e => e.to === PLACE_PREFIX + "interior:mournhold, temple").length, 1,
    "one leg each way, not two");
});
