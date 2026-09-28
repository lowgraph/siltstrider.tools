const { test } = require("node:test");
const assert = require("node:assert/strict");

const lib = () => import("../lib/travel-teleports.mjs");

const NODES = {
  "interior:caldera, guild of mages": { name: "Caldera, Guild of Mages", town: "Caldera", district: "Guild of Mages" },
  "interior:ebonheart, grand council chambers": { name: "Ebonheart, Grand Council Chambers", town: "Ebonheart", district: "Grand Council Chambers" }
};
const CATALOG = {
  items: { index_andra: "Andasreth Propylon Index", index_master: "Master Propylon Index", amulet_quarra: "Quarra Amulet" },
  records: [
    { key: "p1", kind: "propylon", from: ["interior:berandas, propylon chamber"], to: "interior:andasreth, propylon chamber",
      requires: ["index_andra"], unless: ["index_master"], conditions: [], questGated: false, object: "propylon_andra", objectName: "Andasreth Propylon" },
    { key: "p2", kind: "propylon", from: ["interior:berandas, propylon chamber"], to: "interior:caldera, guild of mages",
      requires: ["index_master"], unless: [], conditions: [], questGated: false, object: "propylon_andra", objectName: "Andasreth Propylon" },
    { key: "d1", kind: "dialogue", from: ["interior:ebonheart, grand council chambers"], to: "interior:mournhold, royal palace",
      requires: [], unless: [], conditions: [], questGated: false, speaker: "asciene rane", speakerName: "Asciene Rane", topic: "transport to mournhold" },
    { key: "i1", kind: "item", from: [], to: "interior:druscashti, upper level", requires: ["amulet_quarra"], unless: [],
      conditions: [], questGated: false, object: "amulet_quarra", objectName: "Quarra Amulet" },
    { key: "q1", kind: "dialogue", from: ["interior:ebonheart, grand council chambers"], to: "interior:sotha sil, halls",
      requires: [], unless: [], conditions: ["journal X >= 10"], questGated: true, gatedBecause: "conditions",
      speaker: "almalexia", speakerName: "Almalexia", topic: "must be stopped" }
  ]
};

test("a teleport works only with what it asks for", async () => {
  const { usableTeleport } = await lib();
  const [andra, master] = CATALOG.records;
  assert.equal(usableTeleport(andra, new Set()), false);
  assert.equal(usableTeleport(andra, new Set(["index_andra"])), true);
  assert.equal(usableTeleport(andra, new Set(["index_andra", "index_master"])), false, "the Master Index diverts it to Caldera");
  assert.equal(usableTeleport(master, new Set(["index_master"])), true);
  assert.equal(usableTeleport(CATALOG.records[4], new Set()), false, "a quest teleport is hidden");
  assert.equal(usableTeleport(CATALOG.records[4], new Set(), true), true, "unless asked for");
  assert.equal(usableTeleport(null, new Set()), false);
});

test("a save's pack says what the character carries", async () => {
  const { heldFromSave } = await lib();
  assert.deepEqual([...heldFromSave({ stuff: { inventory: [{ id: "Index_Andra" }, { id: 5 }, null] } })], ["index_andra"]);
  assert.deepEqual([...heldFromSave(null)], []);
});

test("the items list puts Propylon indices first and skips quest-only items", async () => {
  const { teleportItems } = await lib();
  assert.deepEqual(teleportItems(CATALOG).map(i => [i.id, i.opens]),
    [["index_andra", 1], ["index_master", 1], ["amulet_quarra", 1]]);
  assert.deepEqual(teleportItems(null), []);
});

test("teleports join stops, make places of other ends, and walk them to the network", async () => {
  const { addTeleports } = await lib();
  const graph = { Caldera: [], Ebonheart: [], Balmora: [] };
  const { graph: out, places } = addTeleports(graph, CATALOG, { nodes: NODES, held: new Set(["index_master", "amulet_quarra"]) });
  const chamber = "place:interior:berandas, propylon chamber";
  assert.deepEqual(out[chamber].map(e => [e.to, e.kind]), [["Caldera", "Propylon"]], "only the Master Index route, to the Caldera stop");
  assert.equal(out[chamber][0].label, "Use the Andasreth Propylon (needs Master Propylon Index)");
  const mournhold = out.Ebonheart.find(e => e.kind === "Dialogue Teleport");
  assert.deepEqual([mournhold.to, mournhold.label, mournhold.board],
    ["place:interior:mournhold, royal palace", 'Ask Asciene Rane about "transport to mournhold"', "Grand Council Chambers"]);
  assert.ok(["Caldera", "Ebonheart", "Balmora"].every(stop => out[stop].some(e => e.kind === "Item Teleport")),
    "an item works from every stop");
  assert.ok(!out[chamber].some(e => e.kind === "Item Teleport"), "but not from places added alongside it");
  assert.ok(places.includes("interior:mournhold, royal palace"));
  assert.equal(graph.Caldera.length, 0, "the graph passed in is untouched");
  assert.equal(out.Ebonheart.some(e => e.to === "place:interior:sotha sil, halls"), false, "quest teleports stay out");
});

test("nothing usable leaves the graph as it was", async () => {
  const { addTeleports } = await lib();
  assert.deepEqual(addTeleports({ A: [] }, { records: [], items: {} }), { graph: { A: [] }, places: [] });
  assert.deepEqual(addTeleports({ A: [] }, null), { graph: { A: [] }, places: [] });
});

test("a Propylon asked for in conversation says who to ask", async () => {
  const { addTeleports } = await lib();
  const catalog = { items: { index_master: "Master Propylon Index" }, records: [
    { key: "f1", kind: "propylon", from: ["interior:caldera, guild of mages"], to: "interior:andasreth, propylon chamber",
      requires: ["index_master"], unless: [], conditions: [], questGated: false,
      speaker: "folms mirel", speakerName: "Folms Mirel", topic: "andasreth" }] };
  const { graph } = addTeleports({ Caldera: [] }, catalog, { nodes: NODES, held: new Set(["index_master"]) });
  assert.equal(graph.Caldera[0].label, 'Ask Folms Mirel about "andasreth" (needs Master Propylon Index)');
  assert.equal(graph.Caldera[0].kind, "Propylon");
});

test("a room with no door outside is reached through the doors from the teleport's room", async () => {
  const { addTeleports } = await lib();
  const { planRoute } = await import("../lib/travel-graph.mjs");
  const { addPlaces, PLACE_PREFIX } = await import("../lib/travel-walk.mjs");
  const access = { records: [
    { key: "interior:mournhold, courtyard", depth: null, exits: [], doors: ["interior:mournhold, bazaar"] },
    { key: "interior:mournhold, bazaar", depth: null, exits: [], doors: ["interior:mournhold, courtyard"] }] };
  const catalog = { items: {}, records: [
    { kind: "dialogue", from: ["interior:ebonheart, grand council chambers"], to: "interior:mournhold, courtyard",
      topic: "transport to mournhold", speaker: "effe-tei" },
    { kind: "dialogue", from: ["interior:mournhold, courtyard"], to: "interior:ebonheart, grand council chambers",
      topic: "transport to ebonheart", speaker: "effe-tei", questGated: true }] };
  const walk = { access, nodes: NODES };
  const { graph } = addTeleports({ Ebonheart: [], Caldera: [] }, catalog, { nodes: NODES, walk });
  const bazaar = "interior:mournhold, bazaar";
  const planned = addPlaces(graph, [bazaar], { access, nodes: NODES });
  const route = planRoute("Ebonheart", PLACE_PREFIX + bazaar, planned);
  assert.ok(route.isValid, route.message);
  assert.deepEqual(route.steps.map(s => s.kind), ["Dialogue Teleport", "Indoors"]);
  assert.deepEqual(route.steps[1].doors, ["interior:mournhold, courtyard", bazaar]);
  assert.equal(route.steps[1].indoors, true);
  const home = planRoute(PLACE_PREFIX + bazaar, "Ebonheart", planned);
  assert.equal(home.isValid, false, "the way back is a quest teleport, not taken unless asked for");
  const { graph: quest } = addTeleports({ Ebonheart: [], Caldera: [] }, catalog, { nodes: NODES, walk, includeQuest: true });
  assert.ok(planRoute(PLACE_PREFIX + bazaar, "Ebonheart", addPlaces(quest, [bazaar], { access, nodes: NODES })).isValid);
});
