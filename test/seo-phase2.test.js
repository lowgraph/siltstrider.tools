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
  assert.match(aboutSrc, /breadth-first search/, "must mention breadth-first search / BFS");
  assert.match(aboutSrc, /Fewest-hops/, "must describe fewest-hops routing");
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

  // Privacy and zero-tracking
  assert.match(aboutSrc, /zero-tracking/, "must emphasize zero tracking");
  assert.match(aboutSrc, /\.omwsave/, "must mention .omwsave parsing");
  assert.match(aboutSrc, /strictly client-side/, "must affirm client-side execution");

  // Negative assertion: no prohibited overstatements
  assert.doesNotMatch(aboutSrc, /verified by hand against UESP/i, "About must not overstate checking methodology");
});

test("Alchemy Workstation has contextual apparatus modifiers and engine formula cues", () => {
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
});

test("Spellmaking Workstation has casting mechanics and cost formula cues", () => {
  const spellSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "spellmaking", "spellmaking-workstation.jsx"),
    "utf8"
  );

  // Casting mechanics cue
  assert.match(spellSrc, /Casting Mechanics &amp; Costs:/, "must contain casting mechanics header");
  assert.match(spellSrc, /\(2×Skill \+ Willpower\/5 \+ Luck\/10 − MagickaCost\) × Fatigue/, "must show cast chance formula");
  assert.match(spellSrc, /Primary school is determined by the highest-cost effect/, "must explain primary school rule");
  assert.match(spellSrc, /Target spells add a 1\.5× cost modifier/, "must explain target range multiplier");
});

test("Enchanting Workstation has constant effect soul rule and self-enchant formula cues", () => {
  const enchantSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "enchanting", "enchanting-workstation.jsx"),
    "utf8"
  );

  // Constant effect rule
  assert.match(enchantSrc, /Soul Capacity &amp; Constant Effect:/, "must contain constant effect rule header");
  assert.match(enchantSrc, /minimum soul capacity of <strong[^>]*>400<\/strong>/, "must specify 400 soul minimum");
  assert.match(enchantSrc, /Golden Saint or Ascended Sleeper/, "must cite Golden Saint or Ascended Sleeper");

  // Self-enchant formula cue
  assert.match(enchantSrc, /Enchanting Formula:/, "must contain enchanting formula header");
  assert.match(enchantSrc, /\(0\.75×Enchant \+ 0\.25×Int \+ 0\.1×Luck − 2\.5×Points\) × Fatigue/, "must show self-enchant formula");
});

test("Travel Workstation has transit engine rules and routing microcopy", () => {
  const travelSrc = fs.readFileSync(
    path.join(ROOT, "components", "calculators", "travel", "travel-workstation.jsx"),
    "utf8"
  );

  assert.match(travelSrc, /Transit Engine Rules:/, "must contain transit engine rules header");
  assert.match(travelSrc, /breadth-first search \(BFS\)/, "must mention BFS routing");
  assert.match(travelSrc, /fewest hops/, "must mention fewest hops");
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

  assert.match(builderRootSrc, /<h2[^>]*>\s*Morrowind Character Builder &amp; Class Planner\s*<\/h2>/, "must have h2 title in builder root");

  const configSrc = fs.readFileSync(
    path.join(ROOT, "components", "character-builder", "configurator.jsx"),
    "utf8"
  );

  assert.match(configSrc, /Character Math Invariants:/, "must contain math invariants header");
  assert.match(configSrc, /Base Health = <span[^>]*>⌊\(Strength \+ Endurance\) \/ 2⌋<\/span>/, "must show base health formula");
  assert.match(configSrc, /Base Magicka = <span[^>]*>Intelligence × Sign Multiplier<\/span>/, "must show base magicka formula");
  assert.match(configSrc, /Fatigue = <span[^>]*>Strength \+ Willpower \+ Agility \+ Endurance<\/span>/, "must show fatigue formula");
});

test("All newly modified components avoid undefined, null, and non-token classes", () => {
  const filesToCheck = [
    "components/views/about-view.jsx",
    "components/calculators/alchemy/alchemy-workstation.jsx",
    "components/calculators/spellmaking/spellmaking-workstation.jsx",
    "components/calculators/enchanting/enchanting-workstation.jsx",
    "components/calculators/travel/travel-workstation.jsx",
    "components/level-simulator/level-simulator-root.jsx",
    "components/character-builder/character-builder-root.jsx",
    "components/character-builder/configurator.jsx"
  ];

  for (const rel of filesToCheck) {
    const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.doesNotMatch(content, />undefined</, `${rel} must not contain raw undefined`);
    assert.doesNotMatch(content, />null</, `${rel} must not contain raw null`);
    // Ensure no broken className interpolation
    assert.doesNotMatch(content, /className="[^"]*undefined[^"]*"/, `${rel} must not contain undefined class`);
  }
});
