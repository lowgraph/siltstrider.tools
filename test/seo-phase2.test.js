"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function assertCalculationDisclosure(source, title = "How this is calculated") {
  const disclosures = [...source.matchAll(/<details\b([^>]*\bcalculation-notes\b[^>]*)>([\s\S]*?)<\/details>/g)];
  assert.equal(disclosures.length, 1, "one calculation disclosure per tool");
  assert.doesNotMatch(disclosures[0][1], /\bopen\b/, "explanations start closed");
  assert.ok(disclosures[0][2].trimStart().startsWith(`<summary>${title}</summary>`), "native summary names the disclosure");
  return disclosures[0][2];
}

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
  assert.match(aboutSrc, /Endurance \/ 10/, "must show Endurance health formula");
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

test("Alchemy keeps apparatus and formula explanations in one closed disclosure", () => {
  const alchemySrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "alchemy", "alchemy-workstation.jsx"),
    "utf8"
  );

  // Apparatus modifiers note
  const explanation = assertCalculationDisclosure(alchemySrc);
  assert.match(alchemySrc, /Mortar &amp; Pestle/, "must explain Mortar & Pestle in apparatus note");
  assert.match(alchemySrc, /Retort/, "must explain Retort in apparatus note");
  assert.match(alchemySrc, /Alembic/, "must explain Alembic in apparatus note");
  assert.match(alchemySrc, /Calcinator/, "must explain Calcinator in apparatus note");

  // Engine brewing formula cue
  assert.match(explanation, /Mortar &amp; Pestle/, "apparatus explanation is inside the disclosure");
  assert.match(explanation, /Brew chance:/, "formula is inside the disclosure");
  assert.match(explanation, /Alchemy \+ 0\.1×Intelligence \+ 0\.1×Luck/, "must keep the brew chance formula");
  assert.match(explanation, /rounded to the nearest whole number/, "must match the displayed chance rounding");
  // Negative check: must not state that fatigue modifies brewing chance (fatigue does not apply in OpenMW alchemy)
  assert.doesNotMatch(alchemySrc, /at standard fatigue/, "must not make false fatigue claims in alchemy brewing");
});

test("Spellmaking Workstation has casting mechanics and cost formula cues", () => {
  const spellSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "spellmaking", "spellmaking-workstation.jsx"),
    "utf8"
  );

  // Casting mechanics and magicka cost cue
  assertCalculationDisclosure(spellSrc);
  assert.match(spellSrc, /Magicka Cost:/, "must include Magicka Cost formula header");
  assert.match(spellSrc, /⌊∑ \(\(Min \+ Max\) × Duration \+ Area\) × BaseCost × 0\.05⌋/, "must show exact magicka cost formula");
  assert.match(spellSrc, /\(2×Skill \+ Willpower\/5 \+ Luck\/10 − MagickaCost\) × Fatigue/, "must show cast chance formula");
  assert.match(spellSrc, /most expensive effect determines which magic school/, "must explain primary school rule");
  assert.match(spellSrc, /Target range costs 1\.5 times/, "must explain target range multiplier");
});

test("Enchanting Workstation has constant effect soul rule, point formula, and self-enchant cues", () => {
  const enchantSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "enchanting", "enchanting-workstation.jsx"),
    "utf8"
  );

  // Constant effect rule
  const explanation = assertCalculationDisclosure(enchantSrc);
  assert.match(explanation, /Constant Effect needs a soul worth at least 400 points/, "must specify 400 soul minimum inside the disclosure");
  assert.match(enchantSrc, /Golden Saint or Ascended Sleeper/, "must cite Golden Saint or Ascended Sleeper");

  // Enchantment points and Self-enchant formula cues
  assert.match(explanation, /\(\(Min \+ Max\) × Duration \+ Area\) × BaseCost/, "must show effect cost formula");
  assert.match(explanation, /Capacity adds each running cost rounded down/, "must explain cumulative capacity floors");
  assert.match(explanation, /Enchant \+ 0\.2×Int \+ 0\.1×Luck/, "must show OpenMW attribute coefficients");
  assert.match(explanation, /Precise Points/, "chance uses precise points");
  assert.match(explanation, /Base Gold Value uses only the final running cost/, "price uses the final cost");
  assert.doesNotMatch(explanation, /0\.75×Enchant|0\.25×Int|2\.5×Points/, "retired coefficients must not remain in the explanation");
});

test("Travel keeps routing explanations in a closed disclosure", () => {
  const travelSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "travel", "travel-workstation.jsx"),
    "utf8"
  );

  const explanation = assertCalculationDisclosure(travelSrc, "How routes are worked out");
  assert.match(explanation, /fewest legs, least gold or fastest route/, "must explain the routing objectives");
  assert.match(explanation, /distance ÷ 4,000/, "must show the fare formula");
  assert.match(explanation, /Time spent indoors is not counted/, "must keep limits on route time");
  assert.match(explanation, /Mark and Recall are not included/, "must keep unsupported travel methods clear");
  assert.match(travelSrc, /Mages Guild membership/, "must explain Mages Guild requirement");
});

test("Level Simulator keeps leveling explanations in a closed disclosure", () => {
  const levelerSrc = fs.readFileSync(
    path.join(ROOT, "components", "level-simulator", "level-simulator-root.jsx"),
    "utf8"
  );

  assertCalculationDisclosure(levelerSrc);
  assert.match(levelerSrc, /10 Major or Minor skill increases/, "must mention 10 skill increases requirement");
  assert.match(levelerSrc, /1–4 = 2×/, "must explain multiplier tier 2x");
  assert.match(levelerSrc, /10\+ = 5×/, "must explain multiplier tier 5x");
  assert.match(levelerSrc, /Endurance \/ 10/, "must show non-retroactive health gain formula");
});

test("Character Builder keeps header hierarchy and a closed calculation disclosure", () => {
  const builderRootSrc = fs.readFileSync(
    path.join(ROOT, "components", "character-builder", "character-builder-root.jsx"),
    "utf8"
  );

  assert.match(builderRootSrc, /<h2[^>]*>\s*Character Builder\s*<\/h2>/, "must have h2 title in builder root");

  const configSrc = fs.readFileSync(
    path.join(ROOT, "components", "character-builder", "configurator.jsx"),
    "utf8"
  );

  assertCalculationDisclosure(configSrc);
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

test("Faction Journal has semantic h2 heading and a closed promotion disclosure", () => {
  const rootSrc = fs.readFileSync(path.join(ROOT, "components", "journal-factions", "journal-factions-root.jsx"), "utf8");
  assert.match(rootSrc, /<h2[^>]*>\s*Faction Journal\s*<\/h2>/, "must have h2 title in factions root");
  assert.doesNotMatch(rootSrc, /<h1[^>]*>\s*Faction Journal\s*<\/h1>/, "must not use h1 in factions root");

  const detailSrc = fs.readFileSync(path.join(ROOT, "components", "journal-factions", "faction-detail-view.jsx"), "utf8");
  assertCalculationDisclosure(detailSrc);
  assert.match(detailSrc, /two favored attributes/, "must explain two favored attributes requirement");
  assert.match(detailSrc, /normally join only one Great House/, "must explain Great House exclusivity rule");
});

test("Challenge Runs has semantic h2 heading and a closed explanation of seeds", () => {
  const challengeSrc = fs.readFileSync(path.join(ROOT, "components", "challenge-runs", "challenge-runs-root.jsx"), "utf8");
  assert.match(challengeSrc, /<h2[^>]*>\s*Challenge Runs\s*<\/h2>/, "must have h2 title in challenge root");
  const explanation = assertCalculationDisclosure(challengeSrc);
  assert.match(explanation, /same seed and settings produce the same/, "must explain repeatable seeds");
  assert.match(explanation, /locked can change the result/, "must explain why locked runs can differ");
});

test("Cloud Vault explains local inspection, deliberate uploads and quotas in a closed disclosure", () => {
  const vaultSrc = fs.readFileSync(path.join(ROOT, "components", "character-vault", "cloud-vault-workstation.jsx"), "utf8");
  assert.match(vaultSrc, /<h2[^>]*>\s*Cloud Vault\s*<\/h2>/, "must have h2 title in vault workstation");
  const explanation = assertCalculationDisclosure(vaultSrc);
  assert.match(explanation, /reads it in your browser/, "inspection stays local");
  assert.match(explanation, /only uploaded when you choose to save it to your account/, "must explain when data leaves the browser");
  assert.match(explanation, /Free accounts can keep 5 cloud saves; supporters can keep 25/, "must describe free and supporter cloud quotas");
  assert.doesNotMatch(explanation, /ArrayBuffer|SQLite|Cloudflare|Invariants/, "no implementation jargon in player guidance");
});

test("Changelog has enriched h2 heading", () => {
  const changelogSrc = fs.readFileSync(path.join(ROOT, "components", "views", "changelog-view.jsx"), "utf8");
  assert.match(changelogSrc, /<h2[^>]*>\s*Silt Strider Tools Changelog &amp; Version History\s*<\/h2>/, "must have enriched h2 in changelog view");
});

