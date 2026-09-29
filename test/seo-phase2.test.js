"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

test("AboutView contains dedicated System Accuracy & Game Mechanics section", () => {
  const aboutSrc = fs.readFileSync(path.join(ROOT, "components", "views", "about-view.jsx"), "utf8");

  // Section container and header
  assert.match(aboutSrc, /System Accuracy &amp; Game Mechanics/, "must contain System Accuracy & Game Mechanics heading");
  assert.match(aboutSrc, /about-mechanics/, "must have about-mechanics container class");

  // OpenMW 0.51.0 source provenance
  assert.match(aboutSrc, /OpenMW 0\.51\.0/, "must cite OpenMW 0.51.0");
  assert.match(aboutSrc, /apps\/openmw\/mwmechanics\//, "must cite mwmechanics source directory");

  // Alchemy mechanics: apparatus modifiers
  assert.match(aboutSrc, /Mortar and pestle/, "must explain mortar and pestle");
  assert.match(aboutSrc, /Retort/, "must explain retort");
  assert.match(aboutSrc, /Alembic/, "must explain alembic");
  assert.match(aboutSrc, /Calcinator/, "must explain calcinator");
  assert.match(aboutSrc, /Brew chance/, "must mention brew chance scaling");

  // Level progression mechanics
  assert.match(aboutSrc, /non-retroactive/, "must specify non-retroactive health growth");
  assert.match(aboutSrc, /⌊Endurance \/ 10⌋/, "must show Endurance health formula");
  assert.match(aboutSrc, /2× to 5× attribute multipliers/, "must describe attribute multipliers");

  // Travel routing mechanics
  assert.match(aboutSrc, /shortest-path search/, "must name the routing search");
  assert.match(aboutSrc, /fewest legs, the cheapest fare or the fastest trip/, "must describe the three objectives");
  assert.match(aboutSrc, /Mages Guild membership/, "must mention Mages Guild transit requirements");

  // Spellcraft mechanics
  assert.match(aboutSrc, /Magicka costs derive from effect base cost/, "must describe spell cost math");
  assert.match(aboutSrc, /Casting success chance/, "must describe casting reliability formula");

  // Enchanting mechanics
  assert.match(aboutSrc, /400\+ soul capacity/, "must specify 400+ soul threshold for constant effect");
  assert.match(aboutSrc, /Golden Saints or Ascended Sleepers/, "must name 400+ soul creatures");
  assert.match(aboutSrc, /self-enchant success chance/, "must mention self-enchant chance");

  // Multi-world coverage
  assert.match(aboutSrc, /Tribunal, Bloodmoon/, "must cover Tribunal and Bloodmoon");
  assert.match(aboutSrc, /Tamriel Rebuilt 26\.08 \(Poison Song\)/, "must cover TR 26.08 Poison Song");
  assert.match(aboutSrc, /ARCE/, "must cover ARCE");

  // Local import is private; optional cloud storage is a separate server operation.
  assert.match(aboutSrc, /in your browser without uploading it/, "must explain local import");
  assert.match(aboutSrc, /\.omwsave/, "must mention .omwsave parsing");
  assert.match(aboutSrc, /Choosing to save it to Cloud Vault sends its parsed character data to our service/, "must disclose cloud storage");
  assert.doesNotMatch(aboutSrc, /zero-tracking|no saves or character data are ever sent/, "must not promise all operations stay local");

  // Disambiguation
  assert.match(aboutSrc, /about-disambiguation/, "must contain about-disambiguation container");
  assert.match(aboutSrc, /Tales from Nirn: Silt Strider/, "must cite Tales from Nirn: Silt Strider server");
  assert.match(aboutSrc, /https:\/\/siltstrider\.com/, "must provide disambiguation link to siltstrider.com");

  // Negative assertion: no prohibited overstatements
  assert.doesNotMatch(aboutSrc, /verified by hand against UESP/i, "About must not overstate checking methodology");
});

test("Primary workstations provide semantic h2 heading hierarchy", () => {
  const workstations = [
    { file: "components/character-builder/character-builder-root.jsx", title: /Character Builder/ },
    { file: "components/level-simulator/level-simulator-root.jsx", title: /Level Simulator/ },
    { file: "components/calculators/alchemy/alchemy-workstation.jsx", title: /Alchemy/ },
    { file: "components/calculators/spellmaking/spellmaking-workstation.jsx", title: /Spellmaking/ },
    { file: "components/calculators/enchanting/enchanting-workstation.jsx", title: /Enchanting/ },
    { file: "components/calculators/travel/travel-workstation.jsx", title: /Travel Planner/ }
  ];

  for (const ws of workstations) {
    const src = fs.readFileSync(path.join(ROOT, ws.file), "utf8");
    assert.match(src, new RegExp(`<h2[^>]*>\\s*${ws.title.source}\\s*<\\/h2>`), `${ws.file} must have semantic h2 heading matching ${ws.title}`);
  }
});

test("Alchemy Workstation has contextual apparatus modifiers and verified engine formula cues", () => {
  const alchemySrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "alchemy", "alchemy-workstation.jsx"),
    "utf8"
  );

  // Apparatus modifiers note
  assert.match(alchemySrc, /Apparatus Modifiers:/, "must contain apparatus modifiers note");
  assert.match(alchemySrc, /Mortar &amp; Pestle/, "must explain Mortar & Pestle in apparatus note");
  assert.match(alchemySrc, /Retort/, "must explain Retort in apparatus note");
  assert.match(alchemySrc, /Alembic/, "must explain Alembic in apparatus note");
  assert.match(alchemySrc, /Calcinator/, "must explain Calcinator in apparatus note");

  // Engine brewing formula cue
  assert.match(alchemySrc, /Engine Brewing Formula:/, "must contain engine brewing formula cue");
  assert.match(alchemySrc, /⌊Alchemy \+ 0\.1×Int \+ 0\.1×Luck⌋%/, "must state exact brew chance formula");
  // Negative check: must not state that fatigue modifies brewing chance (fatigue does not apply in OpenMW alchemy)
  assert.doesNotMatch(alchemySrc, /at standard fatigue/, "must not make false fatigue claims in alchemy brewing");
});

test("Spellmaking Workstation has casting mechanics and cost formula cues", () => {
  const spellSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "spellmaking", "spellmaking-workstation.jsx"),
    "utf8"
  );

  // Casting mechanics and magicka cost cue
  assert.match(spellSrc, /Casting Mechanics &amp; Costs:/, "must contain casting mechanics header");
  assert.match(spellSrc, /Magicka Cost:/, "must include Magicka Cost formula header");
  assert.match(spellSrc, /⌊∑ \(\(Min \+ Max\) × Duration \+ Area\) × BaseCost × 0\.05⌋/, "must show exact magicka cost formula");
  assert.match(spellSrc, /\(2×Skill \+ Willpower\/5 \+ Luck\/10 − MagickaCost\) × Fatigue/, "must show cast chance formula");
  assert.match(spellSrc, /Primary school is determined by the highest-cost effect/, "must explain primary school rule");
  assert.match(spellSrc, /Target spells add a 1\.5× cost modifier/, "must explain target range multiplier");
});

test("Enchanting Workstation has constant effect soul rule, point formula, and self-enchant cues", () => {
  const enchantSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "enchanting", "enchanting-workstation.jsx"),
    "utf8"
  );

  // Constant effect rule
  assert.match(enchantSrc, /Soul Capacity &amp; Constant Effect:/, "must contain constant effect rule header");
  assert.match(enchantSrc, /minimum soul capacity of <strong[^>]*>400<\/strong>/, "must specify 400 soul minimum");
  assert.match(enchantSrc, /Golden Saint or Ascended Sleeper/, "must cite Golden Saint or Ascended Sleeper");

  // Enchantment points and Self-enchant formula cues
  assert.match(enchantSrc, /Enchanting Formula:/, "must contain enchanting formula header");
  assert.match(enchantSrc, /Points: <span[^>]*>\(\(Min \+ Max\) × Duration \+ Area\) × BaseCost × 0\.025<\/span>/, "must show enchantment points formula");
  assert.match(enchantSrc, /\(0\.75×Enchant \+ 0\.25×Int \+ 0\.1×Luck − 2\.5×Points\) × Fatigue/, "must show self-enchant formula");
});

test("Travel Workstation has transit engine rules and routing microcopy", () => {
  const travelSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "travel", "travel-workstation.jsx"),
    "utf8"
  );

  assert.match(travelSrc, /Transit Engine Rules:/, "must contain transit engine rules header");
  assert.match(travelSrc, /shortest-path search over fewest legs, least gold or fewest in-game hours/, "must explain the routing objectives");
  assert.match(travelSrc, /fTravelMult/, "must show the fare formula");
  assert.match(travelSrc, /Mages Guild membership/, "must explain Mages Guild requirement");
});

test("Level Simulator Root has Morrowind leveling invariants microcopy", () => {
  const levelerSrc = fs.readFileSync(
    path.join(ROOT, "components", "level-simulator", "level-simulator-root.jsx"),
    "utf8"
  );

  assert.match(levelerSrc, /Morrowind Leveling Invariants:/, "must contain leveling invariants header");
  assert.match(levelerSrc, /10 Major or Minor skill increases/, "must mention 10 skill increases requirement");
  assert.match(levelerSrc, /1–4 = 2×/, "must explain multiplier tier 2x");
  assert.match(levelerSrc, /10\+ = 5×/, "must explain multiplier tier 5x");
  assert.match(levelerSrc, /⌊Endurance \/ 10⌋/, "must show non-retroactive health gain formula");
});

test("Character Builder Root and Configurator have header hierarchy and math invariants", () => {
  const builderRootSrc = fs.readFileSync(
    path.join(ROOT, "components", "character-builder", "character-builder-root.jsx"),
    "utf8"
  );

  assert.match(builderRootSrc, /<h2[^>]*>\s*Character Builder\s*<\/h2>/, "must have h2 title in builder root");

  const configSrc = fs.readFileSync(
    path.join(ROOT, "components", "character-builder", "configurator.jsx"),
    "utf8"
  );

  assert.match(configSrc, /Character Math Invariants:/, "must contain math invariants header");
  assert.match(configSrc, /Base Health = <span[^>]*>⌊\(Strength \+ Endurance\) \/ 2⌋<\/span>/, "must show base health formula");
  assert.match(configSrc, /Base Magicka = <span[^>]*>Intelligence × \(1 \+ Race &amp; Sign Multiplier\)<\/span>/, "must show base magicka formula with race and sign");
  assert.match(configSrc, /Fatigue = <span[^>]*>Strength \+ Willpower \+ Agility \+ Endurance<\/span>/, "must show fatigue formula");
});

test("Adversarial QA 1: Spell casting chance and self-enchant math safely clamp boundary and extreme values", async () => {
  const { calcSpellCastChance } = await import("../lib/spell-math.mjs");
  const { calcSelfEnchantChance } = await import("../lib/enchant-math.mjs");

  // Zero/negative stats clamp safely to 0 (no NaN, no negative percentages)
  assert.equal(calcSpellCastChance(100, 0, 0, 0, 0.0), 0, "cast chance with zero stats must clamp to 0%");
  assert.equal(calcSpellCastChance(500, 10, 10, 10, 0.5), 0, "extreme magicka cost must clamp to 0%");

  // Extreme over-cap stats clamp safely to 100 (no overflow beyond 100%)
  assert.equal(calcSpellCastChance(1, 200, 200, 200, 1.25), 100, "over-cap stats must clamp to 100%");
  assert.equal(calcSpellCastChance(0, 50, 40, 40, 1.0), 100, "zero cost spell must always succeed (100%)");

  // Enchanting clamps
  assert.equal(calcSelfEnchantChance(0, 0, 0, 100), 0, "zero stats with high points must clamp to 0%");
  assert.equal(calcSelfEnchantChance(200, 200, 200, 1), 100, "over-cap enchanting must clamp to 100%");
});

test("Adversarial QA 2: Potion calculation handles boundary, zero-apparatus, and malformed inputs gracefully", async () => {
  const { calculatePotion } = await import("../lib/alchemy-math.mjs");

  // Empty ingredient list
  const emptyRes = calculatePotion({ ingredients: [] });
  assert.equal(emptyRes.isValid, false);
  assert.equal(emptyRes.effects.length, 0);
  assert.equal(emptyRes.goldValue, 0);

  // Single ingredient (cannot brew alone)
  const singleRes = calculatePotion({
    ingredients: [{ id: "ing_1", effects: [{ n: "Restore Health", b: 1 }] }]
  });
  assert.equal(singleRes.isValid, false);
  assert.match(singleRes.message, /at least two ingredients/i);

  // Zero-quality mortar (impossible to brew without mortar)
  const noMortarRes = calculatePotion({
    ingredients: [
      { id: "ing_1", effects: [{ n: "Restore Health", b: 1 }] },
      { id: "ing_2", effects: [{ n: "Restore Health", b: 1 }] }
    ],
    mortarQuality: 0
  });
  assert.equal(noMortarRes.isValid, false);
  assert.match(noMortarRes.message, /mortar and pestle are required/i);
});

test("Adversarial QA 3: All newly modified components avoid undefined, null, and non-token classes", () => {
  const filesToCheck = [
    "components/views/about-view.jsx",
    "components/views/changelog-view.jsx",
    "components/calculators/alchemy/alchemy-workstation.jsx",
    "components/calculators/spellmaking/spellmaking-workstation.jsx",
    "components/calculators/enchanting/enchanting-workstation.jsx",
    "components/calculators/travel/travel-workstation.jsx",
    "components/level-simulator/level-simulator-root.jsx",
    "components/character-builder/character-builder-root.jsx",
    "components/character-builder/configurator.jsx",
    "components/journal-factions/journal-factions-root.jsx",
    "components/journal-factions/faction-detail-view.jsx",
    "components/challenge-runs/challenge-runs-root.jsx",
    "components/character-vault/cloud-vault-workstation.jsx"
  ];

  for (const rel of filesToCheck) {
    const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.doesNotMatch(content, />undefined</, `${rel} must not contain raw undefined`);
    assert.doesNotMatch(content, />null</, `${rel} must not contain raw null`);
    // Ensure no broken className interpolation
    assert.doesNotMatch(content, /className="[^"]*undefined[^"]*"/, `${rel} must not contain undefined class`);
  }
});

test("Faction Journal has semantic h2 heading and advancement invariants microcopy", () => {
  const rootSrc = fs.readFileSync(path.join(ROOT, "components", "journal-factions", "journal-factions-root.jsx"), "utf8");
  assert.match(rootSrc, /<h2[^>]*>\s*Faction Journal\s*<\/h2>/, "must have h2 title in factions root");
  assert.doesNotMatch(rootSrc, /<h1[^>]*>\s*Faction Journal\s*<\/h1>/, "must not use h1 in factions root");

  const detailSrc = fs.readFileSync(path.join(ROOT, "components", "journal-factions", "faction-detail-view.jsx"), "utf8");
  assert.match(detailSrc, /Faction Advancement Invariants:/, "must contain faction advancement invariants header");
  assert.match(detailSrc, /two Favored Attributes/, "must explain two favored attributes requirement");
  assert.match(detailSrc, /Great House Exclusivity:/, "must explain Great House exclusivity rule");
});

test("Challenge Runs has semantic h2 heading and deterministic seed engine microcopy", () => {
  const challengeSrc = fs.readFileSync(path.join(ROOT, "components", "challenge-runs", "challenge-runs-root.jsx"), "utf8");
  assert.match(challengeSrc, /<h2[^>]*>\s*Challenge Runs\s*<\/h2>/, "must have h2 title in challenge root");
  assert.match(challengeSrc, /Challenge Engine Invariants:/, "must contain challenge engine invariants header");
  assert.match(challengeSrc, /deterministic 32-bit pseudorandom seed engine/, "must describe PRNG seed engine");
});

test("Cloud Vault has semantic h2 heading and zero-tracking inspection microcopy", () => {
  const vaultSrc = fs.readFileSync(path.join(ROOT, "components", "character-vault", "cloud-vault-workstation.jsx"), "utf8");
  assert.match(vaultSrc, /<h2[^>]*>\s*Cloud Vault\s*<\/h2>/, "must have h2 title in vault workstation");
  assert.match(vaultSrc, /Save Inspection &amp; Vault Invariants:/, "must contain save inspection invariants header");
  assert.match(vaultSrc, /Zero-Server Binary Parsing:/, "must explain zero-server binary parsing");
  assert.match(vaultSrc, /Cloud Sync Quotas:/, "must describe free and supporter cloud quotas");
});

test("Changelog has enriched h2 heading", () => {
  const changelogSrc = fs.readFileSync(path.join(ROOT, "components", "views", "changelog-view.jsx"), "utf8");
  assert.match(changelogSrc, /<h2[^>]*>\s*Silt Strider Tools Changelog &amp; Version History\s*<\/h2>/, "must have enriched h2 in changelog view");
});

