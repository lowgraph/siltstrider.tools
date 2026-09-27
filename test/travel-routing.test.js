const { test } = require("node:test");
const assert = require("node:assert/strict");

const lib = () => import("../lib/travel-graph.mjs");

// Darvame Hleran's side of the haggle as the pipeline publishes it (autocalc, level 0).
const STRIDER = { mercantile: 29, personality: 38, luck: 40, disposition: 50, statsSource: "derived",
  haggles: true, priceable: true, race: "Dark Elf", female: true };
const SETTINGS = { fFatigueBase: 1.25, fDispRaceMod: 5, fDispPersonalityMult: 0.5, fDispPersonalityBase: 50 };

test("a journey is priced as getBarterOffer prices it", async () => {
  const { journeyGold } = await lib();
  // pc = (50-50 + 5 + 4 + 8) x 1.25 = 21.25; npc = (29 + 4 + 7.6) x 1.25 = 50.75
  // buy = 0.01 x (100 - 0.5 x (21.25 - 50.75)) = 1.1475; 13 x 1.1475 = 14.9, truncated
  const edge = { price: 13, barter: STRIDER };
  assert.equal(journeyGold(edge, { mercantile: 5, luck: 40, personality: 40, disposition: 50 }, SETTINGS), 14);
  // pc = (100-50 + 100 + 10 + 10) x 1.25 = 212.5; buy = 0.01 x (100 - 0.5 x 161.75) = 0.19125
  assert.equal(journeyGold(edge, { mercantile: 100, luck: 100, personality: 100, disposition: 100 }, SETTINGS), 2,
    "every player term is capped, so a master haggler still pays something");
});

test("followers multiply the base price before the haggle", async () => {
  const { journeyGold } = await lib();
  const player = { mercantile: 5, luck: 40, personality: 40, disposition: 50 };
  assert.equal(journeyGold({ price: 13, barter: STRIDER }, { ...player, followers: 2 }, SETTINGS), 44);
});

test("a creature never haggles and an unknown seller is not guessed", async () => {
  const { journeyGold } = await lib();
  const player = { mercantile: 5, luck: 40, personality: 40 };
  assert.equal(journeyGold({ price: 10, barter: { haggles: false, priceable: true } }, player), 10);
  assert.equal(journeyGold({ price: 10, barter: { ...STRIDER, priceable: false, mercantile: null } }, player), null);
  assert.equal(journeyGold({ price: 10 }, player), null, "an older release carries no seller");
  assert.equal(journeyGold({ price: null, barter: STRIDER }, player), null, "an edge with no position has no price");
  assert.equal(journeyGold(undefined, player), null);
});

test("a price never drops below one gold", async () => {
  const { journeyGold } = await lib();
  const edge = { price: 1, barter: { ...STRIDER, mercantile: 0, personality: 0, luck: 0 } };
  assert.equal(journeyGold(edge, { mercantile: 100, luck: 100, personality: 100, disposition: 100 }, SETTINGS), 1);
});

test("disposition: base, a shared race and personality, truncated and clamped", async () => {
  const { travelDisposition } = await lib();
  assert.equal(travelDisposition(STRIDER, { personality: 40 }, SETTINGS), 45, "50 + 0.5 x (40 - 50)");
  assert.equal(travelDisposition(STRIDER, { personality: 40, races: ["dark elf"] }, SETTINGS), 50, "a fellow Dunmer");
  assert.equal(travelDisposition(STRIDER, { personality: 41 }, SETTINGS), 45, "45.5 truncates");
  assert.equal(travelDisposition({ ...STRIDER, disposition: 95 }, { personality: 100 }, SETTINGS), 100);
  assert.equal(travelDisposition({ ...STRIDER, disposition: 0 }, { personality: 0 }, SETTINGS), 0);
  assert.equal(travelDisposition({}, { personality: 50 }), 50, "missing inputs fall back to the vanilla settings");
});

// A -> D directly by an expensive, slow boat, or A -> B -> C -> D by cheap, quick guides.
const GRAPH = {
  A: [{ to: "D", kind: "Boat", price: 90, hours: 20, board: "Docks" }, { to: "B", kind: "Guild Guide", price: 10, hours: 0 }],
  B: [{ to: "C", kind: "Guild Guide", price: 10, hours: 0 }],
  C: [{ to: "D", kind: "Silt Strider", price: 10, hours: 2 }],
  D: [],
  Island: []
};
const byPrice = edge => edge.price;

test("each objective picks its own route", async () => {
  const { planRoute } = await lib();
  const fewest = planRoute("A", "D", GRAPH, { objective: "hops", goldOf: byPrice });
  assert.deepEqual(fewest.path, ["A", "D"]);
  assert.deepEqual(fewest.totals, { gold: 90, hours: 20, goldKnown: true, hoursKnown: true });
  assert.equal(fewest.steps[0].board, "Docks");
  const cheapest = planRoute("A", "D", GRAPH, { objective: "gold", goldOf: byPrice });
  assert.deepEqual(cheapest.path, ["A", "B", "C", "D"]);
  assert.equal(cheapest.totals.gold, 30);
  const fastest = planRoute("A", "D", GRAPH, { objective: "time", goldOf: byPrice });
  assert.equal(fastest.totals.hours, 2);
});

test("ties break on the other two measures", async () => {
  const { planRoute } = await lib();
  const graph = {
    A: [{ to: "Z", kind: "Boat", price: 50, hours: 5 }, { to: "Z", kind: "Silt Strider", price: 20, hours: 5 }],
    Z: []
  };
  const route = planRoute("A", "Z", graph, { objective: "time", goldOf: byPrice });
  assert.equal(route.steps[0].kind, "Silt Strider", "equal hours and legs, so the cheaper leg");
});

test("an unpriced leg makes the total incomplete rather than wrong", async () => {
  const { planRoute } = await lib();
  const graph = { A: [{ to: "B", kind: "Boat", hours: 3 }], B: [] };
  const route = planRoute("A", "B", graph, { objective: "gold" });
  assert.equal(route.isValid, true);
  assert.equal(route.totals.goldKnown, false);
  assert.equal(route.steps[0].gold, null);
  assert.equal(route.totals.hoursKnown, true);
});

test("planRoute handles the edges of the question", async () => {
  const { planRoute } = await lib();
  assert.equal(planRoute("A", "A", GRAPH).hops, 0);
  assert.equal(planRoute("A", "A", GRAPH).isValid, true);
  assert.equal(planRoute("A", "Nowhere", GRAPH).isValid, false);
  assert.equal(planRoute("", "D", GRAPH).isValid, false);
  const stranded = planRoute("A", "Island", GRAPH);
  assert.equal(stranded.isValid, false);
  assert.match(stranded.message, /No fast-travel transit route/);
  assert.equal(planRoute("A", "D", GRAPH, { objective: "nonsense" }).hops, 1, "an unknown objective means fewest legs");
});

test("stops are named by town, and an unnamed dock by its region", async () => {
  const { stopNameFor } = await lib();
  assert.equal(stopNameFor({ name: "Old Ebonheart, Docks", town: "Old Ebonheart" }, "exterior:7,-18"), "Old Ebonheart");
  assert.equal(stopNameFor({ name: "Vivec, Arena" }, "exterior:4,-11"), "Vivec", "an older release folds by name");
  assert.equal(stopNameFor({ name: null, town: null, region: "roth roryn region" }, "exterior:-3,-14"),
    "Roth Roryn Region (-3, -14)");
  assert.equal(stopNameFor({ name: null, region: "azura's coast region" }, "exterior:19,-5"),
    "Azura's Coast Region (19, -5)", "no capital after an apostrophe");
  assert.equal(stopNameFor({ name: null, region: null }, "exterior:1,1"), null);
  assert.equal(stopNameFor(undefined, "exterior:1,1"), null);
});

test("the live graph merges a town's stops and keeps each provider's price", async () => {
  const { adaptTravelGraph } = await lib();
  const nodes = {
    "exterior:7,-18": { name: "Old Ebonheart, Docks", town: "Old Ebonheart", district: "Docks" },
    "interior:old ebonheart, guild of mages": { name: "Old Ebonheart, Guild of Mages", town: "Old Ebonheart", district: "Guild of Mages" },
    "exterior:2,-13": { name: "Ebonheart", town: "Ebonheart", district: null },
    "interior:vivec, guild of mages": { name: "Vivec, Guild of Mages", town: "Vivec", district: "Guild of Mages" }
  };
  const providers = { ship: { name: "Ship", barter: STRIDER }, other: { name: "Other", barter: STRIDER } };
  const graph = adaptTravelGraph([
    { from: "exterior:7,-18", to: "exterior:2,-13", mode: "boat", provider: "ship", price: 3, hours: 0 },
    { from: "exterior:7,-18", to: "exterior:2,-13", mode: "boat", provider: "other", price: 4, hours: 0 },
    { from: "interior:old ebonheart, guild of mages", to: "interior:vivec, guild of mages", mode: "guild_guide",
      provider: "guide", price: 10, hours: 0, requiresMageGuild: true }
  ], nodes, { providers });
  assert.deepEqual(Object.keys(graph).sort(), ["Ebonheart", "Old Ebonheart", "Vivec"]);
  assert.equal(graph["Old Ebonheart"].length, 3, "two boats with their own prices, and the guide");
  const ship = graph["Old Ebonheart"].find(e => e.provider === "ship");
  assert.deepEqual(ship, { to: "Ebonheart", kind: "Boat", provider: "ship", providerName: "Ship",
    barter: STRIDER, price: 3, hours: 0, board: "Docks" });
  assert.equal(graph["Old Ebonheart"].find(e => e.kind === "Guild Guide").alight, "Guild of Mages");
});
