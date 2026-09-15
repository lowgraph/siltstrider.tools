"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const SITE_PATH = path.join(__dirname, "..", "index.html");

// Loads the single-file app into a real DOM and runs its inline scripts,
// the same way a browser would. This lets us call the app's own global
// functions (including its built-in self-tests) from Node.
async function loadSite(url = "https://example.com/") {
  const dom = await JSDOM.fromFile(SITE_PATH, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url,
  });
  // Inline <script> tags run synchronously as the document is parsed, but
  // give any load-event handlers a turn before we start poking at it.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return dom;
}

// Copies a value made inside the page into this realm, so deep equality doesn't trip over the page's own prototypes.
const plain = (x) => JSON.parse(JSON.stringify(x));

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

test("Morrowind's borders are embedded once each and drawn pixel for pixel", () => {
  const html = fs.readFileSync(SITE_PATH, "utf8").replace(/\r\n/g, "\n");
  assert.doesNotMatch(html, /--frame-img/, "the old ornate frame image should be gone");
  for (const name of ["mw-border", "mw-bevel", "mw-groove"]) {
    const found = [...html.matchAll(new RegExp(`--${name}: url\\("data:image\\/png;base64,([A-Za-z0-9+/=]+)"\\)`, "g"))];
    assert.equal(found.length, 1, `the --${name} texture must be embedded exactly once`);
    const png = Buffer.from(found[0][1], "base64");
    assert.equal(png.toString("latin1", 1, 4), "PNG");
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [128, 128], `--${name} is 128px square`);
  }
  const rule = (selector) => {
    const start = html.indexOf("\n    " + selector + " {");
    assert.ok(start >= 0, `no ${selector} rule`);
    return html.slice(start, html.indexOf("}", start));
  };
  // A slice as wide as the border puts one texture pixel on each screen pixel; stretching would smooth the grain away.
  const uses = {
    "mw-border": [[".hero", 6], ["#run-summary .sum-row", 6], [".panel", 6], [".cat-row", 6], [".build-sheet", 6]],
    "mw-bevel": [[".btn", 4], [".icon-btn", 4], [".seg", 4], [".arce-toggle", 4], ["select", 4]],
    "mw-groove": [[".hero::after", 2], [".vital-bar", 2]],
  };
  for (const [name, list] of Object.entries(uses)) {
    for (const [selector, width] of list) {
      const css = rule(selector);
      assert.match(css, new RegExp(`border: ${width}px solid transparent;[\\s\\S]*border-image: var\\(--${name}\\) ${width} repeat;`), `${selector} should draw --${name} at ${width}px`);
      assert.doesNotMatch(css, /border-radius: (?!0)/, `${selector} should keep square corners`);
    }
  }
  assert.match(rule(".btn.home-card"), /border-width: 6px;[\s\S]*border-image: var\(--mw-border\) 6 repeat;/, "home cards are cards, with the window frame");
  assert.match(rule(".save-row"), /border-top: 2px solid transparent;[\s\S]*border-image: var\(--mw-groove\) 2 \/ 2px 0 0 0 repeat;/);
  assert.match(rule("select"), /appearance: none;/, "dropdowns draw their own arrow");
  assert.doesNotMatch(html, /border-image: var\(--mw-[a-z]+\)[^;]*stretch/, "no border may stretch its texture");
});

test("the desktop header stays on one row without the nav covering the site name", () => {
  const html = fs.readFileSync(SITE_PATH, "utf8").replace(/\r\n/g, "\n");
  const desktop = html.slice(html.indexOf("@media (min-width: 900px) {"));
  const rules = desktop.slice(0, desktop.indexOf("\n    }\n"));
  assert.match(rules, /\.topbar \{ flex-wrap: nowrap;/);
  assert.match(rules, /\.brand h1 \{ white-space: nowrap; \}/, "the site name must not break across lines");
  assert.match(rules, /\.header-tools \{ flex: 0 0 auto; \}/, "the nav and world switches must not shrink under the site name");
  const narrow = html.slice(html.indexOf("@media (min-width: 900px) and (max-width: 1199px) {"));
  assert.match(narrow.slice(0, narrow.indexOf("\n    }\n")), /#btn-world-tr::after \{ content: "TR"; \}/, "narrow desktops need the short world labels");
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

test("a build permalink restores the sheet without leaking skills from the discarded one", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  document.getElementById("btn-build").click();
  document.getElementById("btn-custom").click();
  setSheet(window, {
    maj: ["Long Blade", "Heavy Armor", "Block", "Athletics", "Armorer"],
    min: ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"],
  });
  setSheet(window, { maj: ["Destruction", "Alteration", "Mysticism", "Enchant", "Alchemy"] });
  setSheet(window, { maj: ["Long Blade", "Heavy Armor", "Block", "Athletics", "Armorer"] });
  const link = window.location.href;
  assert.match(link, /#builder&build=/);

  const reopened = (await loadSite(link)).window;
  const majors = () => [...Array(5)].map((_, i) => reopened.document.getElementById("maj" + i).value);
  assert.deepEqual(majors(), ["Long Blade", "Heavy Armor", "Block", "Athletics", "Armorer"]);
  // Editing a major now duplicates Block; the swap must hand back Long Blade, not a skill from a discarded sheet.
  setSheet(reopened, { maj: ["Block"] });
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
    document.getElementById(i % 2 ? "btn-rand-all" : "dice-class").click();
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

test("Send to Build Optimizer opens the rolled character in the custom builder", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  window.Element.prototype.scrollIntoView = function () {};
  for (let i = 0; i < 12; i++) {
    document.getElementById("btn-challenge").click();
    document.getElementById("btn-rand-all").click();
    const rolled = plain(window.readPanelBuild("r"));
    const cls = document.getElementById("r-class").value;
    document.getElementById("btn-to-optimizer").click();
    assert.deepEqual(plain(window.readPanelBuild("c")), rolled, `the ${cls} character changed on its way to the optimizer`);
    assert.equal(document.getElementById("c-class").value, cls);
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

test("the skills cards show the class's skills and roll only for a custom or unrolled class", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  const $ = (id) => document.getElementById(id);
  const cardItems = (id) => [...$(id).closest(".sum-row").querySelectorAll("li")].map((li) => li.textContent);
  const picks = (prefix) => [...Array(5)].map((_, i) => $(prefix + i).value);
  $("btn-challenge").click();

  // Nothing rolled yet: the skills can roll, and rolling them makes a custom class.
  assert.equal($("dice-major-skills").disabled, false);
  assert.equal($("lock-major-skills").disabled, true, "there are no skills to lock before they're rolled");
  $("dice-major-skills").click();
  assert.equal(window.eval("challengeRun.cls"), "Custom");
  assert.deepEqual(cardItems("dice-major-skills"), picks("rmaj"));
  assert.deepEqual(cardItems("dice-minor-skills"), picks("rmin"));
  assert.equal(new Set(picks("rmaj").concat(picks("rmin"))).size, 10);

  // A custom class rerolls one card at a time, and locked skills survive Randomize all.
  const minors = picks("rmin");
  $("dice-major-skills").click();
  assert.deepEqual(picks("rmin"), minors, "rolling the major skills changed the minor skills");
  assert.equal(new Set(picks("rmaj").concat(picks("rmin"))).size, 10);
  $("lock-minor-skills").click();
  $("btn-rand-all").click();
  assert.equal(window.eval("challengeRun.cls"), "Custom", "locked skills must keep their custom class");
  assert.deepEqual(picks("rmin"), minors, "Randomize all rerolled locked skills");
  $("lock-minor-skills").click();

  // A rolled class brings its own skills, and the skills cards can't roll over them.
  let tries = 0;
  do $("dice-class").click(); while (window.eval("challengeRun.cls") === "Custom" && ++tries < 60);
  const cls = window.eval("challengeRun.cls");
  const preset = plain(window.eval(`classTable()[${JSON.stringify(cls)}]`));
  assert.deepEqual(cardItems("dice-major-skills"), preset.maj);
  assert.deepEqual(cardItems("dice-minor-skills"), preset.min);
  assert.equal($("dice-major-skills").disabled, true);
  assert.equal($("dice-minor-skills").disabled, true);
  window.eval('rollAspect("min")');
  assert.deepEqual(picks("rmin"), preset.min, "a skills roll replaced the class's skills");
});

test("a challenge-run permalink restores the run and ignores anything that isn't on the site's lists", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  document.getElementById("btn-challenge").click();
  document.getElementById("btn-rand-all").click();
  const cards = (doc) => [...doc.querySelectorAll("#run-summary .sum-row")].map((row) =>
    [...row.querySelectorAll(".sum-kicker, .sum-val, .sum-desc")].map((el) => el.textContent).join(" | "));
  const link = window.location.href;
  assert.match(link, /#challenge&run=/);
  const reopened = (await loadSite(link)).window;
  assert.deepEqual(cards(reopened.document), cards(document));
  assert.deepEqual(plain(reopened.readPanelBuild("r")), plain(window.readPanelBuild("r")));

  const evil = '<img src=x onerror="window.pwned=1">';
  const payload = Buffer.from(JSON.stringify({
    race: evil, gender: "Female", cls: "Custom", spec: "Magic", fav1: "Luck", fav2: evil,
    maj: [evil, "Block", "Axe", "Spear", "Sneak"], min: ["Alchemy", "Enchant", "Illusion", "Security", "Unarmored"],
    major: evil, minors: [evil, "Ride a gondola in Vivec"], rests: ["Hard — No potions", evil, "No magic"],
  })).toString("base64url");
  const hostile = (await loadSite("https://example.com/#challenge&run=" + payload)).window;
  assert.equal(hostile.document.querySelector("#run-summary img"), null, "permalink text was read as HTML");
  assert.equal(hostile.pwned, undefined);
  const run = plain(hostile.eval("challengeRun"));
  assert.equal(run.race, "");
  assert.equal(run.gender, "Female");
  assert.equal(run.cls, "", "a custom class with an unknown skill or attribute must be dropped");
  assert.equal(run.major, "");
  assert.deepEqual(run.minors.map((o) => o.text), ["Ride a gondola in Vivec"]);
  assert.deepEqual(run.rests, ["No magic"]);
});

test("restrictions that repeat or undercut each other don't roll together", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const clash = (a, b) => window.restrictionsClash(a, b);
  const pool = [...window.eval("POOL")];
  const pairs = [
    ["Level 20 cap", "Level 10 cap"],
    ["No magic", "No spending Magicka"],
    ["No Magicka — fatigue and potions only", "No spending Magicka"],
    ["No spending Magicka", "No destruction"],
    ["No birthsign powers", "No activated birthsign powers"],
    ["No racial powers", "No activated racial powers"],
    ["One weapon skill forever", "Only level one weapon skill"],
    ["Ironman — no quicksaving", "Ironman — no reloading a save after a fight"],
    ["Permadeath — one life", "One save file — no extra manual saves"],
    ["No companions or summoned meatshields", "No summons in combat"],
    ["No armor", "No shields"],
    ["No potions", "Found potions only — no Alchemy-made potions"],
    ["No alchemy", "No Fortify Intelligence alchemy loop"],
    ["Marksman only", "No ranged weapons"],
    ["No Tribunal or Bloodmoon DLC", "Tribunal and Bloodmoon allowed but main quest first"],
  ];
  for (const [a, b] of pairs) {
    assert.ok(pool.includes(a) && pool.includes(b), `${a} / ${b} must both be restrictions`);
    assert.ok(clash(a, b) && clash(b, a), `${a} and ${b} can roll together`);
  }
  // Unrelated restrictions still roll together. "Marksman only" used to count as travel because it contains "mark".
  for (const [a, b] of [["Marksman only", "No Divine Intervention"], ["No destruction", "No restoration"], ["Level 20 cap", "No potions"]]) {
    assert.ok(!clash(a, b), `${a} and ${b} should be allowed together`);
  }
  for (let i = 0; i < 200; i++) {
    const picks = [...window.pickCompatibleRestrictions(5, pool, [])];
    for (const a of picks) for (const b of picks) if (a !== b) assert.ok(!clash(a, b), `rolled ${a} with ${b}`);
  }
});

test("starting spells come from the race, the birthsign and the magic skills", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const spells = (b) => plain(window.startingSpells(b, window.computeSheet(b)));
  const mage = {
    race: "Breton", gender: "Male", sign: "The Mage", spec: "Magic", fav1: "Intelligence", fav2: "Willpower",
    maj: ["Destruction", "Alteration", "Conjuration", "Mysticism", "Alchemy"], min: ["Enchant", "Illusion", "Restoration", "Short Blade", "Unarmored"],
  };
  // Intelligence 60 rules out Exhausting Touch (75) and Tap Energy (180); Restoration 30 is too low for Feet of Notorgo.
  assert.deepEqual(spells(mage), {
    race: [], sign: [],
    skills: ["Bound Dagger", "Chameleon", "Detect Creature", "Fire Bite", "Hearth Heal", "Sanctuary", "Shield", "Summon Ancestral Ghost", "Water Walking"],
  });
  const warrior = {
    race: "Nord", gender: "Male", sign: "The Warrior", spec: "Combat", fav1: "Strength", fav2: "Endurance",
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"], min: ["Medium Armor", "Axe", "Spear", "Restoration", "Mercantile"],
  };
  assert.deepEqual(spells(warrior), { race: [], sign: [], skills: [] });
  assert.deepEqual(spells({ ...warrior, race: "Argonian" }).race, ["Water Breathing"]);
  assert.deepEqual(spells({ ...warrior, race: "Khajiit", sign: "The Ritual" }), { race: ["Eye of Night"], sign: ["Blessed Word", "Blessed Touch"], skills: [] });

  const { document } = window;
  document.getElementById("btn-build").click();
  document.getElementById("btn-custom").click();
  setSheet(window, { race: "Argonian", sign: "The Serpent" });
  const sheet = document.getElementById("c-summary").textContent;
  assert.match(sheet, /From your race: Water Breathing/);
  assert.match(sheet, /From your birthsign: Star-Curse/);
});

test("the challenge run has no leftovers from the old version", () => {
  const html = fs.readFileSync(SITE_PATH, "utf8");
  for (const id of ["inc-aspects", "inc-race", "rand-class", "rand-maj", "btn-rand-char", "r-summary", "challenge-char-editor",
    "btn-major", "btn-obj", "btn-roll", "major-drawn", "obj-drawn", "drawn", "drawn-note", "btn-about", "btn-changelog", "btn-save-code"]) {
    assert.doesNotMatch(html, new RegExp(`id="${id}"|getElementById\\("${id}"\\)`), `${id} is left over`);
  }
  const start = html.indexOf("const OBJECTIVES = [");
  assert.doesNotMatch(html.slice(start, html.indexOf("];", start)), /\n\s*\n/, "blank lines in OBJECTIVES");
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
  document.getElementById("dice-major").click();
  const major = window.eval("currentMajorText()");
  assert.ok([...window.eval("activeMajors()")].includes(major), `the major objective text picked up extra words: ${major}`);
  const card = document.getElementById("dice-major").closest(".sum-row").querySelector(".sum-val");
  assert.equal(window.plainText(card), major);
});

test("About lists corrections and support contacts, and the footer opens the changelog", async () => {
  const dom = await loadSite();
  const { document } = dom.window;
  assert.doesNotMatch(document.getElementById("panel-about").textContent, /verified by hand against UESP/i, "About must not overstate how data was checked");
  assert.ok(document.querySelector('#panel-about a[href="mailto:tmarcalferreira@gmail.com"]'), "corrections email link missing");
  assert.ok(document.querySelector('#panel-about a[href="https://ko-fi.com/tmarcalferreira"]'), "Ko-fi link missing");
  assert.ok(document.querySelector('#panel-about a[href="https://www.paypal.com/ncp/payment/CELX7C97ZJ2D6"]'), "PayPal link missing");
  document.getElementById("link-changelog-footer").click();
  assert.ok(document.getElementById("panel-changelog").classList.contains("show"), "the footer link should open the changelog");
  assert.ok(!document.getElementById("panel-about").classList.contains("show"), "opening the changelog should close About");
  document.getElementById("link-about-footer").click();
  assert.ok(document.getElementById("panel-about").classList.contains("show"), "the footer link should open About");
  assert.ok(document.querySelectorAll("#panel-changelog time").length >= 3, "changelog entries need dates");
});

test("the starting sheet shows Health, Magicka and Fatigue as the game's coloured bars", async () => {
  const dom = await loadSite();
  const { window } = dom;
  const { document } = window;
  document.getElementById("btn-build").click();
  document.getElementById("btn-custom").click();
  setSheet(window, { race: "Breton", sign: "The Mage", spec: "Magic" });
  const sheet = window.computeSheet(window.readPanelBuild("c"));
  const bars = [...document.querySelectorAll("#c-summary .vital")].map((row) => {
    const bar = row.querySelector(".vital-bar");
    return [row.querySelector(".vital-label").textContent, bar.className, bar.textContent];
  });
  assert.deepEqual(bars, [
    ["Health", "vital-bar vital-health", `${sheet.health}/${sheet.health}`],
    ["Magicka", "vital-bar vital-magicka", `${sheet.magicka}/${sheet.magicka}`],
    ["Fatigue", "vital-bar vital-fatigue", `${sheet.fatigue}/${sheet.fatigue}`],
  ]);
});
