const { test } = require("node:test");
const assert = require("node:assert/strict");

const lib = () => import("../lib/travel-link.mjs");
const OBJECTIVES = { hops: {}, gold: {}, time: {} };

test("a shared link opens the route it names", async () => {
  const { readRouteLink } = await lib();
  assert.deepEqual(readRouteLink("?world=tr&from=Balmora&to=place%3Ainterior%3Asamarys+ancestral+tomb&plan=gold&walk=0&quest=1", OBJECTIVES),
    { from: "Balmora", to: "place:interior:samarys ancestral tomb", plan: "gold", walk: false, quest: true });
});

test("anything a link gets wrong is ignored rather than trusted", async () => {
  const { readRouteLink } = await lib();
  assert.deepEqual(readRouteLink("?plan=teleport&walk=yes&quest=0&from=%20%20&to=" + "x".repeat(301), OBJECTIVES),
    { from: null, to: null, plan: null, walk: null, quest: null });
  assert.deepEqual(readRouteLink("", OBJECTIVES), { from: null, to: null, plan: null, walk: null, quest: null });
  assert.equal(readRouteLink("?plan=__proto__", OBJECTIVES).plan, null, "only the page's own objectives");
});

test("writing a route keeps the shell's parameters and leaves defaults out", async () => {
  const { writeRouteLink, readRouteLink } = await lib();
  const search = writeRouteLink("?world=tr&arce=1&from=Old&campaign=x",
    { from: "Seyda Neen", to: "place:interior:arkngthand, hall of centrifuge", plan: "hops", walk: true, quest: false });
  const params = new URLSearchParams(search);
  assert.deepEqual([params.get("world"), params.get("arce"), params.get("campaign")], ["tr", "1", "x"]);
  assert.equal(params.get("from"), "Seyda Neen", "the old value is replaced");
  assert.equal(params.has("plan") || params.has("walk") || params.has("quest"), false);
  assert.deepEqual(readRouteLink(writeRouteLink("", { from: "A", to: "B", plan: "time", walk: false, quest: true }), OBJECTIVES),
    { from: "A", to: "B", plan: "time", walk: false, quest: true }, "what is written reads back");
  assert.equal(writeRouteLink("?from=A", {}), "", "an empty route clears to no query at all");
});
