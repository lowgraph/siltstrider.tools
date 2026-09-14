"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const SITE_PATH = path.join(__dirname, "..", "index.html");

// Loads the single-file app into a real DOM and runs its inline scripts,
// the same way a browser would. This lets us call the app's own global
// functions (including its built-in self-tests) from Node.
async function loadSite() {
  const dom = await JSDOM.fromFile(SITE_PATH, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://example.com/",
  });
  // Inline <script> tags run synchronously as the document is parsed, but
  // give any load-event handlers a turn before we start poking at it.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return dom;
}

test("page loads and exposes the optimizer self-tests", async () => {
  const dom = await loadSite();
  const { window } = dom;
  assert.equal(typeof window.runOptimizerTests, "function");
  assert.equal(typeof window.regressionRankingsDiffer, "function");
  assert.equal(typeof window.makeBuildProfile, "function");
});

test("runOptimizerTests() self-check passes", async () => {
  const dom = await loadSite();
  const result = dom.window.runOptimizerTests();
  const failing = Object.keys(result).filter((k) => k !== "all" && !result[k]);
  assert.deepEqual(failing, [], `failing sub-checks: ${failing.join(", ")}`);
  assert.equal(result.all, true);
});

test("regressionRankingsDiffer() reports rankings differ across builds", async () => {
  const dom = await loadSite();
  assert.equal(dom.window.regressionRankingsDiffer(), true);
});

test("core views are present in the DOM", async () => {
  const dom = await loadSite();
  const { document } = dom.window;
  assert.equal(document.querySelector("title").textContent.includes("Silt Strider"), true);
  assert.equal(typeof dom.window.showView, "function");
});

// ---------------------------------------------------------------------------
// Regression tests for the September 2026 review fixes.
// ---------------------------------------------------------------------------

const fs = require("node:fs");

function setSheet(window, { race, spec, sign, maj, min }) {
  const { document } = window;
  const set = (id, v) => {
    const el = document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  if (race) set("c-race", race);
  if (spec) set("c-spec", spec);
  if (sign) set("c-sign", sign);
  (maj || []).forEach((s, i) => set("maj" + i, s));
  (min || []).forEach((s, i) => set("min" + i, s));
}

function gearRows(window) {
  return [...window.document.querySelectorAll("#gear-box table tr")]
    .map((tr) => [...tr.children].map((td) => td.textContent.trim()));
}

function rowsFor(window, slot) {
  return gearRows(window).filter((r) => r[0] === slot).map((r) => r[1]);
}

test("the frame image is embedded once and referenced by custom property", () => {
  const html = fs.readFileSync(SITE_PATH, "utf8");
  const payloads = html.match(/base64,[A-Za-z0-9+/=]{1000,}/g) || [];
  const pngPayloads = payloads.filter((p) => p.length > 100000);
  assert.equal(pngPayloads.length, 1, "the border-image PNG must be embedded exactly once");
  assert.equal((html.match(/border-image: var\(--frame-img\)/g) || []).length, 3);
  assert.match(html, /--frame-img: url\("data:image\/png;base64,/);
});

test("desktop nav wraps instead of crushing the brand", () => {
  const html = fs.readFileSync(SITE_PATH, "utf8");
  const media = html.slice(html.indexOf("@media (min-width: 900px)"));
  assert.match(media.slice(0, 600), /\.topbar \{ flex-wrap: wrap; \}/);
  assert.match(media.slice(0, 600), /\.brand \{ flex: 1 1 260px; \}/);
  assert.match(html, /\.brand \{[^}]*word-break: normal;/s);
});

test("late shield matches the build's own armor class", async () => {
  const dom = await loadSite();
  const { window } = dom;
  window.document.getElementById("btn-build").click();
  window.document.getElementById("btn-custom").click();

  // Light Armor + Block must not be sent to a Heavy Armor shield.
  setSheet(window, {
    race: "Khajiit", spec: "Stealth", sign: "The Thief",
    maj: ["Short Blade", "Light Armor", "Block", "Sneak", "Security"],
    min: ["Acrobatics", "Athletics", "Alchemy", "Mercantile", "Speechcraft"],
  });
  window.document.getElementById("btn-gear").click();
  const lightShields = rowsFor(window, "Shield");
  assert.equal(lightShields.length, 2, "expected an early and a late shield row");
  assert.ok(!lightShields[1].includes("Eleidon"), `Light build got a Heavy shield: ${lightShields[1]}`);
  assert.match(lightShields[1], /Glass Tower Shield/);

  // Heavy Armor + Block still gets Eleidon's Ward.
  setSheet(window, {
    race: "Orc", spec: "Combat", sign: "The Lady",
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"],
    min: ["Medium Armor", "Restoration", "Spear", "Mercantile", "Speechcraft"],
  });
  window.document.getElementById("btn-gear").click();
  const heavyShields = rowsFor(window, "Shield");
  assert.match(heavyShields[1], /Eleidon's Ward/);
});

test("a single magic major does not turn a warrior into a caster", async () => {
  const dom = await loadSite();
  const { window } = dom;
  window.document.getElementById("btn-build").click();
  window.document.getElementById("btn-custom").click();

  setSheet(window, {
    race: "Nord", spec: "Combat", sign: "The Warrior",
    maj: ["Axe", "Heavy Armor", "Block", "Armorer", "Restoration"],
    min: ["Medium Armor", "Long Blade", "Spear", "Athletics", "Mercantile"],
  });
  window.document.getElementById("btn-gear").click();
  const warriorKit = rowsFor(window, "Ring 1").concat(rowsFor(window, "Amulet"), rowsFor(window, "Robe"));
  assert.ok(!warriorKit.some((x) => x.includes("Mentor's Ring")), `warrior was given Mentor's Ring: ${warriorKit.join(" | ")}`);
  assert.ok(!warriorKit.some((x) => x.includes("Necromancer's Amulet")), "warrior was given the caster amulet");

  // A real caster still gets the caster kit.
  setSheet(window, {
    race: "Breton", spec: "Magic", sign: "The Atronach",
    maj: ["Destruction", "Alteration", "Mysticism", "Enchant", "Alchemy"],
    min: ["Illusion", "Restoration", "Unarmored", "Conjuration", "Mercantile"],
  });
  window.document.getElementById("btn-gear").click();
  assert.ok(rowsFor(window, "Ring 1").some((x) => x.includes("Mentor's Ring")), "caster lost Mentor's Ring");
});

test("loading a build does not leak skills from the discarded sheet", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  document.getElementById("btn-build").click();
  document.getElementById("btn-custom").click();

  const majors = () => [...Array(5)].map((_, i) => document.getElementById("maj" + i).value);
  setSheet(window, {
    maj: ["Long Blade", "Heavy Armor", "Block", "Athletics", "Armorer"],
    min: ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"],
  });
  document.getElementById("btn-save-code").click();
  const code = document.getElementById("build-code").value;

  setSheet(window, { maj: ["Destruction", "Alteration", "Mysticism", "Enchant", "Alchemy"] });
  document.getElementById("build-code").value = code;
  document.getElementById("btn-load-code").click();
  assert.deepEqual(majors(), ["Long Blade", "Heavy Armor", "Block", "Athletics", "Armorer"]);

  // Editing a major now duplicates Block; the swap must hand back Long Blade,
  // not a skill from the mage sheet that was thrown away.
  setSheet(window, { maj: ["Block"] });
  assert.deepEqual(majors(), ["Block", "Heavy Armor", "Long Blade", "Athletics", "Armorer"]);
});

test("premade builds refresh the duplicate-swap state too", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  window.Element.prototype.scrollIntoView = function () {};
  document.getElementById("btn-build").click();
  document.getElementById("btn-premade").click();
  document.querySelectorAll("#cat-stack .cat-btn")[0].click();
  const row = document.querySelectorAll("#cat-stack .cat-row")[0];
  row.querySelectorAll(".build-link")[0].click();
  [...row.querySelectorAll(".build-item.open .btn")]
    .find((b) => b.textContent.includes("Open in custom"))
    .click();
  const majors = [...Array(5)].map((_, i) => document.getElementById("maj" + i).value);
  const prev = [...Array(5)].map((_, i) => document.getElementById("maj" + i).dataset.prev);
  assert.deepEqual(prev, majors, "dataset.prev must match the applied premade sheet");
});

test("randomizing a character keeps the favored-attribute lock in sync", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  document.getElementById("btn-challenge").click();
  const f1 = document.getElementById("r-fav1");
  const f2 = document.getElementById("r-fav2");
  for (let i = 0; i < 25; i++) {
    document.getElementById("btn-rand-char").click();
    assert.notEqual(f1.value, f2.value, "randomizer produced duplicate favored attributes");
    const disabledInF1 = [...f1.options].filter((o) => o.disabled).map((o) => o.value);
    const disabledInF2 = [...f2.options].filter((o) => o.disabled).map((o) => o.value);
    assert.deepEqual(disabledInF1, [f2.value], "f1 must grey out exactly f2's current value");
    assert.deepEqual(disabledInF2, [f1.value], "f2 must grey out exactly f1's current value");
  }
});

test("item locations corrected against UESP stay corrected", async () => {
  const dom = await loadSite();
  const locations = dom.window.eval("ITEM_LOCATIONS");
  const expectations = [
    ["Ten Pace Boots", /Bal Fell/i, /Palansour/i],
    ["Mentor's Ring", /urn labelled Lord Brinne/i, /skeleton/i],
    ["Cuirass of the Savior's Hide", /Tel Fyr/i, /Ascadian/i],
    ["Helm of Oreyn Bearclaw", /Sheogorad/i, /west of Gnaar Mok/i],
    ["Boots of the Apostle", /south of Gnisis/i, /west of Gnisis/i],
    ["Boots of Blinding Speed", /northwest of Caldera/i, /between Balmora and Caldera/i],
    ["Fist of Randagulf Left Gauntlet", /Ilunibi/i, /Kogoruhn/i],
    ["Fist of Randagulf Rt Gauntlet", /Ilunibi/i, /Kogoruhn/i],
    // Corrected against the game data in the vanilla handoff.
    ["Keening", /Odrosal/i, /Citadel of Dagoth Ur/i],
    ["Marara's Ring", /Drethan Ancestral Tomb/i, /Ibar-Dad/i],
    ["Daedric Crescent", /Magas Volar/i, /Clockwork City/i],
    ["Daedric Long Bow", /Dram Bero/i, /Daedra drop/i],
  ];
  for (const [item, expected, forbidden] of expectations) {
    const text = locations[item];
    assert.ok(text, `${item} missing from ITEM_LOCATIONS`);
    assert.match(text, expected, `${item} lost its corrected location`);
    assert.doesNotMatch(text, forbidden, `${item} regressed to the old incorrect location`);
  }
  // The same claim is duplicated in whereToGet(); keep both in step.
  assert.match(dom.window.whereToGet("boots of blinding speed"), /northwest of Caldera/i);
  assert.match(dom.window.whereToGet("mentor's ring"), /urn labelled Lord Brinne/i);
});

test("TR major objectives stay completable and correctly described", async () => {
  const dom = await loadSite();
  const trMajors = dom.window.eval("TR_MAJORS");
  const joined = trMajors.join("\n");
  // House Dres cannot be joined on the mainland in TR 26.08.
  assert.doesNotMatch(joined, /House Dres/i, "House Dres is not a joinable faction in TR");
  // Narsis is run by a Hlaalu council; there is no King of Narsis.
  assert.doesNotMatch(joined, /King of Narsis/i);
  // Passwall is a spell reward, not a retrievable artifact.
  assert.doesNotMatch(joined, /artifact \(Passwall/i);
  assert.ok(trMajors.some((m) => /Passwall spell/i.test(m)), "Passwall objective should name the spell");
  assert.equal(trMajors.filter((m) => /Passwall/i.test(m)).length, 1, "only one Passwall objective");
  assert.ok(trMajors.every((m) => typeof m === "string" && m.trim().length), "no blank objectives");
  assert.equal(new Set(trMajors).size, trMajors.length, "no duplicate TR objectives");
});

test("no third-party scripts are injected into the page", () => {
  const html = fs.readFileSync(SITE_PATH, "utf8");
  assert.doesNotMatch(html, /skycastle|aha-img-guard/i, "strip the aha-img-guard script from exports");
  assert.doesNotMatch(html, /<script[^>]+src=/i, "the page must not load external scripts");
});

test("every armor slot row recommends an item for that slot", async () => {
  const dom = await loadSite();
  const SLOT_WORDS = {
    Helm: /Helm|Coif|None/, Cuirass: /Cuirass|Mail|Shirt/, Pauldrons: /Pauldron|None/, Greaves: /Greaves|None/,
    Boots: /Boots|Shoes/i, Gauntlets: /Gauntlet|Bracer|Brace|hands|gloves/i, Shield: /Shield|Ward|None/,
  };
  for (const kind of ["Light Armor", "Medium Armor", "Heavy Armor", "Unarmored"]) {
    const set = dom.window.eval(`armorSet(${JSON.stringify(kind)})`);
    for (const [slot, want] of Object.entries(SLOT_WORDS)) {
      for (const [phase, label] of [["e", "early"], ["l", "late"]]) {
        const text = set[slot][phase];
        assert.match(text, want, `${kind} ${slot} (${label}) names no ${slot.toLowerCase()}: ${text}`);
        assert.ok(text.length < 220, `${kind} ${slot} (${label}) reads like a whole kit: ${text}`);
      }
    }
  }
});

test("the Daedric Long Bow is recommended, not declared missing", async () => {
  const dom = await loadSite();
  const html = fs.readFileSync(SITE_PATH, "utf8");
  assert.doesNotMatch(html, /No obtainable Daedric Long ?bow/i);
  const scored = dom.window.eval("SCORED_WEAPONS").Marksman.map((w) => w.itemName);
  assert.ok(scored.includes("Daedric Long Bow"), `Marksman scored list: ${scored.join(", ")}`);
  assert.match(dom.window.eval("WEAPONS").Marksman.late, /Daedric Long Bow/);
});
