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

// Item names the gear table recommends for a slot: one list per row (early, then late),
// including the "or" alternatives listed under it.
function picksFor(window, slot) {
  const lists = [];
  let current = null;
  for (const tr of window.document.querySelectorAll("#gear-box table tbody tr")) {
    const first = tr.children[0] ? tr.children[0].textContent.trim() : "";
    if (tr.children.length < 3) current = null;
    else if (first === slot) lists.push((current = []));
    else if (!tr.classList.contains("gear-alt")) current = null;
    const name = tr.querySelector(".gear-name");
    if (current && name) current.push(name.textContent.trim());
  }
  return lists;
}

// An item cell should hold a name, not a sentence ("St. Felms" is fine; "X — sold by Y." is not).
const readsLikeSentence = (name) => name.length > 90 || / — |: |\.$/.test(name);

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
  const lightShields = picksFor(window, "Shield");
  assert.equal(lightShields.length, 2, "expected an early and a late shield row");
  assert.ok(!lightShields[1].some((n) => n.includes("Eleidon")), `Light build got a Heavy shield: ${lightShields[1].join(" | ")}`);
  assert.ok(lightShields[1].includes("Glass Tower Shield"), `late shield picks: ${lightShields[1].join(" | ")}`);

  // Heavy Armor + Block still gets Eleidon's Ward.
  setSheet(window, {
    race: "Orc", spec: "Combat", sign: "The Lady",
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"],
    min: ["Medium Armor", "Restoration", "Spear", "Mercantile", "Speechcraft"],
  });
  window.document.getElementById("btn-gear").click();
  const heavyShields = picksFor(window, "Shield");
  assert.ok(heavyShields[1].includes("Eleidon's Ward"), `late shield picks: ${heavyShields[1].join(" | ")}`);
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
  const warriorKit = ["Ring 1", "Amulet", "Robe"].flatMap((slot) => picksFor(window, slot).flat());
  assert.ok(!warriorKit.includes("Mentor's Ring"), `warrior was given Mentor's Ring: ${warriorKit.join(" | ")}`);
  assert.ok(!warriorKit.includes("Necromancer's Amulet"), "warrior was given the caster amulet");

  // A real caster still gets the caster kit.
  setSheet(window, {
    race: "Breton", spec: "Magic", sign: "The Atronach",
    maj: ["Destruction", "Alteration", "Mysticism", "Enchant", "Alchemy"],
    min: ["Illusion", "Restoration", "Unarmored", "Conjuration", "Mercantile"],
  });
  window.document.getElementById("btn-gear").click();
  assert.ok(picksFor(window, "Ring 1").flat().includes("Mentor's Ring"), "caster lost Mentor's Ring");
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
  // Locations come from each pick or ITEM_LOCATIONS, never from keyword matching on prose.
  assert.equal(typeof dom.window.whereToGet, "undefined", "whereToGet() should stay deleted");
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

test("every armor slot lists named picks for that slot", async () => {
  const dom = await loadSite();
  const SLOT_WORDS = {
    Helm: /Helm|Face of God|None/, Cuirass: /Cuirass|Mail|None/, Pauldrons: /Pauldron|None/, Greaves: /Greaves|None/,
    Boots: /Boots|Shoes/, Gauntlets: /Gauntlet|Bracer|Brace|Glove|None/, Shield: /Shield|Ward|None/,
  };
  for (const kind of ["Light Armor", "Medium Armor", "Heavy Armor", "Unarmored"]) {
    const set = dom.window.eval(`armorSet(${JSON.stringify(kind)})`);
    for (const [slot, want] of Object.entries(SLOT_WORDS)) {
      for (const [phase, label] of [["e", "early"], ["l", "late"]]) {
        const picks = [...set[slot][phase]];
        assert.ok(picks.length, `${kind} ${slot} (${label}) has no picks`);
        for (const p of picks) {
          assert.match(p.item, want, `${kind} ${slot} (${label}) names no ${slot.toLowerCase()}: ${p.item}`);
          assert.ok(!readsLikeSentence(p.item), `${kind} ${slot} (${label}) item reads like a sentence: ${p.item}`);
          if (p.item !== "None") assert.ok(dom.window.pickWhere(p), `${kind} ${slot} (${label}): ${p.item} has no location`);
        }
      }
    }
  }
});

test("Tamriel Rebuilt gear rows add named TR picks after the vanilla ones", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const html = fs.readFileSync(SITE_PATH, "utf8");
  assert.doesNotMatch(html, /No unverified TR|Also TR:/, "TR rows should name items from the game data, not placeholders");
  window.eval('worldMode = "tr"');
  for (const kind of ["Light Armor", "Medium Armor", "Heavy Armor"]) {
    const base = window.eval(`armorSet(${JSON.stringify(kind)})`);
    const set = window.eval(`withTrArmor(${JSON.stringify(kind)})`);
    for (const slot of Object.keys(base)) {
      for (const phase of ["e", "l"]) {
        const vanilla = [...base[slot][phase]].map((p) => p.item);
        const all = [...set[slot][phase]];
        assert.deepEqual(all.slice(0, vanilla.length).map((p) => p.item), vanilla, `${kind} ${slot}: the vanilla picks must come first`);
        assert.ok(all.slice(vanilla.length).every((p) => p.tr), `${kind} ${slot}: added picks must be marked Tamriel Rebuilt`);
        assert.ok(all.length <= 4, `${kind} ${slot} (${phase}) lists too many picks: ${all.map((p) => p.item).join(", ")}`);
      }
    }
  }
  window.eval('worldMode = "vanilla"');
  const trItems = Object.values(window.eval("ITEM_DATA")).filter((d) => d.world === "tr").map((d) => d.itemName);
  for (const name of ["Boots of Peace", "Requiem", "Helm of the Savior's Hide", "Witherbrand", "Dragon's Blade"]) {
    assert.ok(trItems.includes(name), `${name} missing from the TR item data`);
  }
});

test("the Daedric Long Bow is recommended, not declared missing", async () => {
  const dom = await loadSite();
  const html = fs.readFileSync(SITE_PATH, "utf8");
  assert.doesNotMatch(html, /No obtainable Daedric Long ?bow/i);
  const scored = dom.window.eval("SCORED_WEAPONS").Marksman.map((w) => w.itemName);
  assert.ok(scored.includes("Daedric Long Bow"), `Marksman scored list: ${scored.join(", ")}`);
  assert.ok([...dom.window.eval("WEAPONS").Marksman.late].some((p) => p.item === "Daedric Long Bow"));
});

test("the gear table names items and places, not sentences", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  document.getElementById("btn-build").click();
  document.getElementById("btn-custom").click();
  const sheets = [
    { race: "Nord", spec: "Combat", sign: "The Warrior", maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"], min: ["Medium Armor", "Axe", "Spear", "Restoration", "Mercantile"] },
    { race: "Breton", spec: "Magic", sign: "The Atronach", maj: ["Destruction", "Alteration", "Mysticism", "Unarmored", "Enchant"], min: ["Illusion", "Restoration", "Conjuration", "Alchemy", "Short Blade"] },
    { race: "Bosmer", spec: "Stealth", sign: "The Thief", maj: ["Marksman", "Light Armor", "Sneak", "Security", "Short Blade"], min: ["Acrobatics", "Athletics", "Alchemy", "Hand-to-hand", "Blunt Weapon"] },
  ];
  for (const world of ["vanilla", "tr"]) {
    window.eval(`worldMode = ${JSON.stringify(world)}`);
    for (const sheet of sheets) {
      setSheet(window, sheet);
      document.getElementById("btn-gear").click();
      const rows = [...document.querySelectorAll("#gear-box table tbody tr")].filter((tr) => tr.children.length === 3);
      assert.ok(rows.length > 10, `${world} ${sheet.race}: the gear table did not render`);
      for (const tr of rows) {
        const name = tr.querySelector(".gear-name").textContent.trim();
        const where = tr.children[2].textContent.trim();
        assert.ok(!readsLikeSentence(name), `${world} ${sheet.race}: item cell reads like a sentence: ${name}`);
        assert.doesNotMatch(name, /\sor\s/, `${world} ${sheet.race}: two items merged into one cell: ${name}`);
        assert.doesNotMatch(where, /Generic loot/i, `${world} ${sheet.race}: generic location for ${name}`);
        if (name !== "None") assert.notEqual(where, "—", `${world} ${sheet.race}: no location for ${name}`);
      }
      if (world === "tr") assert.ok(document.querySelector("#gear-box .gear-tag"), "TR mode should label Tamriel Rebuilt picks");
    }
  }
  window.eval('worldMode = "vanilla"');
});

test("the custom builder and the challenge-run panel compute the same sheet", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  const split = (s) => s.split(",").map((x) => x.trim());
  // Attribute, skill, Health, Fatigue and Magicka numbers as each panel renders them.
  const customNumbers = () => {
    const out = {};
    for (const li of document.querySelectorAll("#c-summary details li")) {
      const m = li.textContent.match(/^(.+?): (\d+) \(/);
      if (m) out[m[1]] = Number(m[2]);
    }
    for (const li of document.querySelectorAll("#c-summary ul li")) {
      const m = li.textContent.match(/^(Health|Fatigue|Magicka):.*= (\d+)/);
      if (m) out[m[1]] = Number(m[2]);
    }
    return out;
  };
  const randNumbers = () => {
    const out = {};
    for (const li of document.querySelectorAll("#r-summary li")) {
      const m = li.textContent.match(/^(.+?): (\d+)$/);
      if (m) out[m[1]] = Number(m[2]);
    }
    const derived = document.getElementById("r-summary").textContent.match(/Health (\d+) · Fatigue (\d+) · Magicka (\d+)/);
    if (derived) Object.assign(out, { Health: Number(derived[1]), Fatigue: Number(derived[2]), Magicka: Number(derived[3]) });
    return out;
  };
  const builds = [...window.eval("BUILDS.slice(0, 8).concat(RACE_BUILDS.slice(0, 4))")];
  assert.equal(builds.length, 12);
  for (const b of builds) {
    const [fav1, fav2] = split(b.fav);
    const build = { race: b.race, gender: b.gender, sign: b.sign, spec: b.spec, fav1, fav2, maj: split(b.maj), min: split(b.min) };
    window.applyBuild(Object.assign({ className: "Custom" }, build));
    const set = (id, v) => { document.getElementById(id).value = v; };
    set("r-class", "Custom"); set("r-race", build.race); set("r-gender", build.gender); set("r-sign", build.sign);
    set("r-spec", build.spec); set("r-fav1", build.fav1); set("r-fav2", build.fav2);
    build.maj.forEach((s, i) => set("rmaj" + i, s));
    build.min.forEach((s, i) => set("rmin" + i, s));
    window.refreshRand();
    const custom = customNumbers();
    assert.ok(Object.keys(custom).length >= 11, `${b.name}: the custom sheet did not render`);
    assert.deepEqual(randNumbers(), custom, `${b.name}: the two panels disagree`);
  }
});

test("a class preset in the custom builder refreshes the duplicate-swap state", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  const choose = (id, v) => {
    const el = document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  choose("c-class", "Warrior");
  choose("c-class", "Custom");
  // Block is the Warrior's fifth major; moving it to slot 2 must hand slot 5 the Warrior's Medium Armor,
  // not Heavy Armor from the default sheet the preset replaced.
  choose("maj1", "Block");
  const skills = [...Array(5)].flatMap((_, i) => [document.getElementById("maj" + i).value, document.getElementById("min" + i).value]);
  assert.equal(new Set(skills).size, 10, `a skill is now picked twice: ${skills.join(", ")}`);
  assert.equal(document.getElementById("maj4").value, "Medium Armor");
});

test("challenge-run skill pickers swap duplicates and refresh the sheet", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  const choose = (id, v) => {
    const el = document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new window.Event("change", { bubbles: true }));
  };
  choose("r-class", "Warrior");
  choose("r-race", "Nord");
  const majors = () => [...Array(5)].map((_, i) => document.getElementById("rmaj" + i).value);
  const warrior = majors();
  // Picking a skill that's already a major swaps the two slots instead of listing it twice.
  choose("rmaj0", warrior[4]);
  assert.deepEqual(majors(), [warrior[4], warrior[1], warrior[2], warrior[3], warrior[0]]);
  // Picking a new skill updates the sheet straight away.
  assert.doesNotMatch(document.getElementById("r-summary").textContent, /Sneak: /);
  choose("rmin0", "Sneak");
  assert.match(document.getElementById("r-summary").textContent, /Sneak: 15/);
  assert.equal(document.getElementById("rmaj0").getAttribute("aria-label"), "Major skill 1");
});

test("ARCE races, classes and builds match the ARCE 4.1 plugin", async () => {
  const dom = await loadSite();
  const races = dom.window.eval("ARCE_RACES");
  const classes = dom.window.eval("ARCE_CLASS");
  assert.equal(Object.keys(races).length, 21, "ARCE adds 21 races on top of the vanilla ten");
  assert.equal(Object.keys(classes).length, 67, "ARCE adds 67 classes on top of the vanilla 21");
  for (const name of ["Tsaesci", "Naga", "Ayleid", "Khajiit (Tojay)", "Sea Elf", "Reachman", "Duadri"]) assert.ok(races[name], `${name} missing`);
  for (const name of ["Kamal", "Tang Mo", "Po Tun", "Maormer", "Suthay-raht"]) assert.ok(!races[name], `${name} isn't a race ARCE adds`);
  // Tamriel_Data's Tsaesci: Agility 50, Unarmored +15.
  assert.equal(races.Tsaesci.M.Agility, 50);
  assert.equal(races.Tsaesci.skills.Unarmored, 15);
  assert.ok(classes["Wise Woman"] && classes["Lamp Knight"], "vanilla NPC classes and Tamriel_Data classes are both included");
  const builds = [...dom.window.eval("ARCE_BUILDS")];
  assert.equal(builds.length, 42, "one male and one female sheet per ARCE race");
  for (const b of builds) {
    assert.ok(races[b.race], `${b.name} uses a race ARCE doesn't add`);
    assert.equal(new Set(b.maj.split(", ").concat(b.min.split(", "))).size, 10, `${b.name} picks a skill twice`);
  }
});

test("restrictions and objectives name real things and suit the world", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const pool = [...window.eval("POOL")];
  const objectives = [...window.eval("OBJECTIVES")].map((o) => o.text);
  const all = pool.concat(objectives, [...window.eval("MAJORS")], [...window.eval("TR_MAJORS")]).join("\n");
  // Each of these contradicted the game data: wrong people or places, impossible goals, or content Tamriel Rebuilt 26.08 doesn't have.
  for (const wrong of [/Arrille/, /Lake Amaya/, /hammock/, /three Canton levels/, /persuasion alone/, /soultrap on the player/, /Andothren/, /ferry plot/, /joined zero factions/, /crafted/, /console or mods/]) {
    assert.doesNotMatch(all, wrong);
  }
  assert.equal(new Set(objectives).size, objectives.length, "no duplicate objectives");
  assert.equal(new Set(pool).size, pool.length, "no duplicate restrictions");
  window.eval('worldMode = "tr"');
  assert.ok(![...window.eval("activePool()")].includes("No Tribunal or Bloodmoon DLC"), "Tamriel Rebuilt needs Tribunal and Bloodmoon");
  window.eval('worldMode = "vanilla"');
  assert.ok([...window.eval("activePool()")].includes("No Tribunal or Bloodmoon DLC"));
});

test("places show their region, and the early-game note explains Mentor's Ring", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  // Objectives list: Gnisis is in the West Gash.
  const gnisis = [...document.querySelectorAll("#obj-pool li")].find((li) => /Visit Gnisis/.test(li.textContent));
  assert.ok(gnisis, "the Gnisis objective is missing");
  assert.deepEqual([...gnisis.querySelectorAll(".region-tag")].map((t) => t.textContent), ["West Gash"]);
  // A text that already names its region gets no extra label.
  assert.deepEqual([...window.eval('regionsIn("Clear the four Red Mountain citadels: Endusal, Odrosal, Tureynulal and Vemynal")')], []);
  assert.deepEqual([...window.eval('regionsIn("Lying on the Padomaic Ocean floor [42, -31].")')], []);
  // Gear table: a caster's Mentor's Ring row shows the Bitter Coast, and the early-game note says where the ring is.
  document.getElementById("btn-build").click();
  document.getElementById("btn-custom").click();
  setSheet(window, {
    race: "Breton", spec: "Magic", sign: "The Mage",
    maj: ["Destruction", "Alteration", "Mysticism", "Enchant", "Alchemy"],
    min: ["Illusion", "Restoration", "Unarmored", "Conjuration", "Mercantile"],
  });
  document.getElementById("btn-gear").click();
  const row = [...document.querySelectorAll("#gear-box tbody tr")].find((tr) => tr.querySelector(".gear-name") && tr.querySelector(".gear-name").textContent === "Mentor's Ring");
  assert.ok(row, "the Mentor's Ring row is missing");
  assert.ok([...row.children[2].querySelectorAll(".region-tag")].some((t) => t.textContent === "Bitter Coast"));
  assert.match(document.querySelector("#gear-box details p.muted").textContent, /Samarys Ancestral Tomb near Seyda Neen/);
  // Region labels stay out of the text the challenge run reads back.
  document.getElementById("btn-challenge").click();
  document.getElementById("btn-major").click();
  const major = window.eval("currentMajorText()");
  assert.ok([...window.eval("activeMajors()")].includes(major), `the major objective text picked up extra words: ${major}`);
});

test("About lists corrections and support contacts, and the changelog opens", async () => {
  const dom = await loadSite();
  const { document } = dom.window;
  assert.doesNotMatch(document.getElementById("panel-about").textContent, /verified by hand against UESP/i, "About must not overstate how data was checked");
  assert.ok(document.querySelector('#panel-about a[href="mailto:tmarcalferreira@gmail.com"]'), "corrections email link missing");
  assert.ok(document.querySelector('#panel-about a[href="https://ko-fi.com/tmarcalferreira"]'), "Ko-fi link missing");
  document.getElementById("btn-changelog").click();
  assert.ok(document.getElementById("panel-changelog").classList.contains("show"), "the Changelog button should open the changelog");
  assert.ok(!document.getElementById("panel-about").classList.contains("show"), "opening the changelog should close About");
  assert.ok(document.querySelectorAll("#panel-changelog time").length >= 2, "changelog entries need dates");
});
