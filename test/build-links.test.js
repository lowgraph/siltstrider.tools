const { test } = require("node:test");
const assert = require("node:assert/strict");

const vault = import("../lib/character-vault.mjs");
const codec = import("../lib/permalink-codec.mjs");

const BUILD = {
  name: "Nerevar", race: "Dark Elf", gender: "Female", className: "Custom", sign: "The Atronach",
  spec: "Magic", fav1: "Intelligence", fav2: "Willpower",
  maj: ["Destruction", "Alteration", "Mysticism", "Enchant", "Conjuration"],
  min: ["Restoration", "Illusion", "Alchemy", "Unarmored", "Short Blade"],
  bitterCup: false, world: "tr", arce: true,
  loadouts: [{ id: "loadout-1", items: { cuirass: { name: "Glass Cuirass" } } }]
};

test("a build link opens the same character in the same world, in browsers too", async () => {
  const { generateBuildShareUrl, sanitizeBuild } = await vault;
  const { decodeShareHash } = await codec;
  const realBuffer = globalThis.Buffer;
  // What Next.js ships to the browser: a Buffer without the 'base64url' encoding.
  globalThis.Buffer = { from: () => ({ toString: () => { throw new TypeError("Unknown encoding: base64url"); } }) };
  let url;
  try {
    url = generateBuildShareUrl(BUILD, "https://siltstrider.tools/");
  } finally {
    globalThis.Buffer = realBuffer;
  }
  assert.match(url, /^https:\/\/siltstrider\.tools\/#builder&TR&ARCE&build=[A-Za-z0-9_-]+&world=tr&arce=1$/);
  const decoded = decodeShareHash(url.slice(url.indexOf("#")));
  assert.equal(decoded.profile, "tr_arce");
  const { world, arce, loadouts, ...character } = BUILD;
  assert.deepEqual(sanitizeBuild(decoded.build), character, "every character field, and no loadouts");
  assert.equal(generateBuildShareUrl(null), "#builder");
});

test("a build from a link keeps only what a build has", async () => {
  const { sanitizeBuild } = await vault;
  const hostile = sanitizeBuild({
    race: "Nord", sign: "The Lady", className: { evil: 1 }, name: "x".repeat(500), gender: "Robot",
    spec: "Chaos", fav1: "Luck", fav2: "Charm", maj: ["Block", "Hacking"], min: 5, bitterCup: "yes",
    __proto__: { polluted: true }
  });
  assert.deepEqual(hostile, { race: "Nord", sign: "The Lady", className: "Custom", name: "x".repeat(60), fav1: "Luck", bitterCup: false });
  assert.equal(hostile.polluted, undefined);
  const repeated = ["Block", "Block", "Axe", "Spear", "Athletics"];
  assert.equal(sanitizeBuild({ ...BUILD, maj: repeated }).maj, undefined, "skills must be ten different ones");
  assert.equal(sanitizeBuild({ race: "Nord" }), null, "no sign, no character");
  assert.equal(sanitizeBuild(null), null);
  assert.equal(sanitizeBuild([1]), null);
});
