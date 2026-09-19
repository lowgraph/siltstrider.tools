const { test } = require("node:test");
const assert = require("node:assert/strict");

test("level-math theoretical level cap calculation matches canonical formula", async () => {
  const { calculateTheoreticalLevelCap } = await import("../lib/level-math.mjs");

  // Formula: 1 + floor(sum(100 - BaseMajorMinorSkill) / 10)

  // 1. Dark Elf Assassin test:
  // Majors: Sneak 35, Marksman 40, Light Armor 40, Short Blade 45, Security 35
  // Minors: Alchemy 15, Block 15, Acrobatics 20, Unarmored 15, Destruction 25
  // Headroom: (65 + 60 + 60 + 55 + 65) + (85 + 85 + 80 + 85 + 75) = 305 + 410 = 715? Wait:
  // 65 + 60 + 60 + 55 + 65 = 305
  // 85 + 85 + 80 + 85 + 75 = 410
  // Total = 715. floor(715 / 10) = 71. Cap = 1 + 71 = 72.
  const assassinSkills = [35, 40, 40, 45, 35, 15, 15, 20, 15, 25];
  assert.equal(calculateTheoreticalLevelCap(assassinSkills), 72);

  // 2. Fixed headroom scenario: 10 skills at 40 (each 60 headroom -> total 600)
  // 1 + floor(600 / 10) = 61
  const skillsAt40 = Array(10).fill(40);
  assert.equal(calculateTheoreticalLevelCap(skillsAt40), 61);

  // 3. Edge cases:
  // All skills already at 100: cap is 1 (cannot level up)
  const skillsAt100 = Array(10).fill(100);
  assert.equal(calculateTheoreticalLevelCap(skillsAt100), 1);

  // All skills at 0: headroom is 1000 -> 1 + floor(1000 / 10) = 101
  const skillsAt0 = Array(10).fill(0);
  assert.equal(calculateTheoreticalLevelCap(skillsAt0), 101);

  // Remainder test: 615 headroom -> 1 + floor(615 / 10) = 62
  const skillsFor615 = [35, 40, 40, 45, 35, 25, 25, 30, 25, 45];
  // 65 + 60 + 60 + 55 + 65 + 75 + 75 + 70 + 75 + 55 = 655? Let's check:
  // [40, 40, 40, 40, 40, 40, 40, 40, 40, 25] -> (9 * 60) + 75 = 615
  assert.equal(calculateTheoreticalLevelCap([40, 40, 40, 40, 40, 40, 40, 40, 40, 25]), 62);
});

test("attribute multipliers and required skill increases strictly follow Morrowind rules", async () => {
  const {
    getAttributeMultiplier,
    getSkillIncreasesForMultiplier
  } = await import("../lib/level-math.mjs");

  // Multiplier mapping:
  // 0 increases: 1x
  // 1-4 increases: 2x
  // 5-7 increases: 3x
  // 8-9 increases: 4x
  // 10+ increases: 5x
  assert.equal(getAttributeMultiplier(0), 1);
  assert.equal(getAttributeMultiplier(1), 2);
  assert.equal(getAttributeMultiplier(2), 2);
  assert.equal(getAttributeMultiplier(4), 2);
  assert.equal(getAttributeMultiplier(5), 3);
  assert.equal(getAttributeMultiplier(7), 3);
  assert.equal(getAttributeMultiplier(8), 4);
  assert.equal(getAttributeMultiplier(9), 4);
  assert.equal(getAttributeMultiplier(10), 5);
  assert.equal(getAttributeMultiplier(15), 5);

  // Reverse mapping (minimum increases required):
  assert.equal(getSkillIncreasesForMultiplier(5), 10);
  assert.equal(getSkillIncreasesForMultiplier(4), 8);
  assert.equal(getSkillIncreasesForMultiplier(3), 5);
  assert.equal(getSkillIncreasesForMultiplier(2), 1);
  assert.equal(getSkillIncreasesForMultiplier(1), 0);
});

test("health gain is non-retroactive and calculated using the post-level-up Endurance", async () => {
  const { calculateHealthGain } = await import("../lib/level-math.mjs");

  // Health gain = floor(newEndurance / 10)
  assert.equal(calculateHealthGain(30), 3);
  assert.equal(calculateHealthGain(39), 3);
  assert.equal(calculateHealthGain(40), 4);
  assert.equal(calculateHealthGain(45), 4);
  assert.equal(calculateHealthGain(49), 4);
  assert.equal(calculateHealthGain(50), 5);
  assert.equal(calculateHealthGain(75), 7);
  assert.equal(calculateHealthGain(95), 9);
  assert.equal(calculateHealthGain(100), 10);
});

test("training cost helper accurately computes Morrowind trainer formulas", async () => {
  const { calculateTrainingCost } = await import("../lib/level-math.mjs");

  // Cost to train 1 point from skill 15: 15 gold
  assert.equal(calculateTrainingCost(15, 1), 15);

  // Cost to train 6 points from skill 15: 15 + 16 + 17 + 18 + 19 + 20 = 105 gold
  // Formula: 6 * 15 + (6 * 5) / 2 = 90 + 15 = 105
  assert.equal(calculateTrainingCost(15, 6), 105);

  // Cost to train 4 points from skill 10: 10 + 11 + 12 + 13 = 46 gold
  // Formula: 4 * 10 + (4 * 3) / 2 = 40 + 6 = 46
  assert.equal(calculateTrainingCost(10, 4), 46);

  // Cost to train 10 points from skill 15: 15 + ... + 24 = 195 gold
  // Formula: 10 * 15 + (10 * 9) / 2 = 150 + 45 = 195
  assert.equal(calculateTrainingCost(15, 10), 195);

  // 0 points cost 0 gold
  assert.equal(calculateTrainingCost(50, 0), 0);
});

test("archetype detection correctly identifies all 6 user-specified archetypes and their queues", async () => {
  const { detectArchetype, ARCHETYPES } = await import("../lib/level-math.mjs");

  // 1. Melee Tank / Warrior
  const warriorBuild = {
    className: "Warrior",
    spec: "Combat",
    fav1: "Strength",
    fav2: "Endurance",
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Blunt Weapon", "Axe", "Spear", "Athletics", "Unarmored"]
  };
  const warriorArch = detectArchetype(warriorBuild);
  assert.equal(warriorArch.id, "warrior");
  assert.deepEqual(warriorArch.priority, [
    "Endurance", "Strength", "Agility", "Speed", "Willpower", "Personality", "Intelligence", "Luck"
  ]);

  // 2. Stealth / Assassin / Marksman:
  // Specific user rule: Strength is prioritized over Speed because sneak criticals scale with Strength!
  const assassinBuild = {
    className: "Assassin",
    spec: "Stealth",
    fav1: "Agility",
    fav2: "Speed",
    maj: ["Sneak", "Marksman", "Light Armor", "Short Blade", "Security"],
    min: ["Acrobatics", "Block", "Hand-to-hand", "Unarmored", "Armorer"]
  };
  const stealthArch = detectArchetype(assassinBuild);
  assert.equal(stealthArch.id, "stealth");
  assert.deepEqual(stealthArch.priority, [
    "Endurance", "Agility", "Strength", "Speed", "Intelligence", "Personality", "Willpower", "Luck"
  ]);
  // Verify Strength is explicitly before Speed in Stealth archetype:
  const strIdx = stealthArch.priority.indexOf("Strength");
  const spdIdx = stealthArch.priority.indexOf("Speed");
  assert.ok(strIdx < spdIdx, "Strength MUST be prioritized over Speed for Stealth builds");

  // 3. Pure Mage / Caster
  const mageBuild = {
    className: "Mage",
    spec: "Magic",
    fav1: "Intelligence",
    fav2: "Willpower",
    maj: ["Destruction", "Alteration", "Mysticism", "Restoration", "Conjuration"],
    min: ["Enchant", "Alchemy", "Illusion", "Unarmored", "Short Blade"]
  };
  const mageArch = detectArchetype(mageBuild);
  assert.equal(mageArch.id, "mage");
  assert.deepEqual(mageArch.priority, [
    "Endurance", "Intelligence", "Willpower", "Agility", "Speed", "Strength", "Personality", "Luck"
  ]);

  // 4. Battlemage / Spellsword
  const battlemageBuild = {
    className: "Battlemage",
    spec: "Magic",
    fav1: "Strength",
    fav2: "Intelligence",
    maj: ["Destruction", "Alteration", "Heavy Armor", "Long Blade", "Enchant"],
    min: ["Conjuration", "Armorer", "Blunt Weapon", "Axe", "Alchemy"]
  };
  const battlemageArch = detectArchetype(battlemageBuild);
  assert.equal(battlemageArch.id, "battlemage");
  assert.deepEqual(battlemageArch.priority, [
    "Endurance", "Strength", "Intelligence", "Willpower", "Agility", "Speed", "Personality", "Luck"
  ]);

  // 5. Nightblade / Shadowcaster
  const nightbladeBuild = {
    className: "Nightblade",
    spec: "Magic",
    fav1: "Agility",
    fav2: "Intelligence",
    maj: ["Illusion", "Short Blade", "Destruction", "Light Armor", "Alteration"],
    min: ["Sneak", "Security", "Mysticism", "Unarmored", "Restoration"]
  };
  const nightbladeArch = detectArchetype(nightbladeBuild);
  assert.equal(nightbladeArch.id, "nightblade");
  assert.deepEqual(nightbladeArch.priority, [
    "Endurance", "Agility", "Intelligence", "Strength", "Willpower", "Speed", "Personality", "Luck"
  ]);

  // 6. Diplomat / Merchant
  const diplomatBuild = {
    className: "Merchant",
    spec: "Stealth",
    fav1: "Personality",
    fav2: "Speed",
    maj: ["Speechcraft", "Mercantile", "Short Blade", "Light Armor", "Illusion"],
    min: ["Security", "Sneak", "Athletics", "Unarmored", "Hand-to-hand"]
  };
  const diplomatArch = detectArchetype(diplomatBuild);
  assert.equal(diplomatArch.id, "diplomat");
  assert.deepEqual(diplomatArch.priority, [
    "Endurance", "Personality", "Speed", "Agility", "Strength", "Willpower", "Intelligence", "Luck"
  ]);
});

test("manual level step validator validates 10-point Major/Minor rules and multiplier prerequisites", async () => {
  const { validateLevelStep, applyLevelStep, normalizeCharacterState } = await import("../lib/level-math.mjs");

  const baseCharacter = {
    level: 1,
    attributes: {
      Strength: 50,
      Intelligence: 40,
      Willpower: 30,
      Agility: 40,
      Speed: 50,
      Endurance: 40,
      Personality: 30,
      Luck: 40
    },
    skills: {
      "Long Blade": 40,
      "Heavy Armor": 35,
      "Block": 35,
      "Armorer": 30,
      "Medium Armor": 30,
      "Destruction": 25,
      "Restoration": 20,
      "Short Blade": 20,
      "Sneak": 20,
      "Security": 20,
      "Spear": 15,
      "Axe": 10
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
    health: 45
  };

  const state = normalizeCharacterState(baseCharacter);

  // 1. Invalid: Major/Minor points do NOT total 10 (only 9 points)
  const invalidStepSum = {
    attributeBonuses: [{ attribute: "Endurance", bonus: 5 }],
    majorMinorIncreases: { "Heavy Armor": 5, "Long Blade": 4 }, // total 9
    miscIncreases: { Spear: 5 }
  };
  const resSum = validateLevelStep(state, invalidStepSum);
  assert.equal(resSum.valid, false);
  assert.ok(resSum.errors.some((e) => e.includes("requires exactly 10")));

  // 2. Invalid: +5 multiplier chosen without sufficient governing skill increases (only 6 increases given)
  const invalidStepMult = {
    attributeBonuses: [{ attribute: "Strength", bonus: 5 }], // +5 requires 10 increases
    majorMinorIncreases: { "Long Blade": 6, "Heavy Armor": 4 }, // Long Blade gives 6 to Strength
    miscIncreases: {} // 0 Misc increases -> Strength only has 6 increases!
  };
  const resMult = validateLevelStep(state, invalidStepMult);
  assert.equal(resMult.valid, false);
  assert.ok(resMult.errors.some((e) => e.includes("requires at least 10 skill increases")));

  // 3. Invalid: Luck bonus > 1 (Luck is strictly fixed at +1)
  const invalidStepLuck = {
    attributeBonuses: [{ attribute: "Luck", bonus: 2 }],
    majorMinorIncreases: { "Long Blade": 10 },
    miscIncreases: {}
  };
  const resLuck = validateLevelStep(state, invalidStepLuck);
  assert.equal(resLuck.valid, false);
  assert.ok(resLuck.errors.some((e) => e.includes("Luck bonus must strictly be +1")));

  // 4. Valid Step: 10 Major/Minor points + necessary Misc points for +5 bonuses
  // Endurance: Heavy Armor +4 (Maj) + Spear +6 (Misc) = 10 increases -> +5
  // Strength: Long Blade +6 (Maj) + Axe +4 (Misc) = 10 increases -> +5
  // Agility: Block 0 + Sneak 0 (no mm) + 0 misc -> Luck +1 instead!
  const validStep = {
    attributeBonuses: [
      { attribute: "Endurance", bonus: 5 },
      { attribute: "Strength", bonus: 5 },
      { attribute: "Luck", bonus: 1 }
    ],
    majorMinorIncreases: {
      "Heavy Armor": 4,
      "Long Blade": 6
    },
    miscIncreases: {
      Spear: 6, // Spear governs Endurance
      Axe: 4 // Axe governs Strength
    }
  };
  const resValid = validateLevelStep(state, validStep);
  assert.equal(resValid.valid, true, `Validation errors: ${resValid.errors.join(", ")}`);

  // 5. Apply the valid step and verify new state
  const nextState = applyLevelStep(state, validStep);
  assert.equal(nextState.level, 2);
  // Endurance was 40 + 5 = 45
  assert.equal(nextState.attributes.Endurance, 45);
  // Strength was 50 + 5 = 55
  assert.equal(nextState.attributes.Strength, 55);
  // Luck was 40 + 1 = 41
  assert.equal(nextState.attributes.Luck, 41);
  // Health gain = floor(45 / 10) = 4
  assert.equal(nextState.lastStep.healthGain, 4);
  assert.equal(nextState.health, 45 + 4);
  // Skills updated
  assert.equal(nextState.skills["Heavy Armor"], 39);
  assert.equal(nextState.skills["Long Blade"], 46);
  assert.equal(nextState.skills["Spear"], 21);
  assert.equal(nextState.skills["Axe"], 14);
});

test("automated 5x multiplier optimizer prescribes level-by-level miscellaneous training itineraries", async () => {
  const { optimizeLevelStep, simulateProgression, normalizeCharacterState } = await import(
    "../lib/level-math.mjs"
  );

  const character = {
    level: 1,
    attributes: {
      Strength: 50,
      Intelligence: 40,
      Willpower: 30,
      Agility: 40,
      Speed: 50,
      Endurance: 40,
      Personality: 30,
      Luck: 40
    },
    skills: {
      "Long Blade": 40,
      "Heavy Armor": 35,
      "Block": 35,
      "Armorer": 30,
      "Medium Armor": 30,
      "Destruction": 25,
      "Restoration": 20,
      "Short Blade": 20,
      "Sneak": 20,
      "Security": 20,
      "Spear": 15,
      "Blunt Weapon": 15,
      "Axe": 15,
      "Marksman": 15,
      "Light Armor": 15
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
    health: 45
  };

  const state = normalizeCharacterState(character);

  // Test single step optimization:
  const step = optimizeLevelStep(state, {
    priority: ["Endurance", "Strength", "Agility", "Speed", "Willpower", "Personality", "Intelligence", "Luck"],
    strategy: "auto"
  });

  assert.ok(step, "Step should be generated");
  assert.equal(step.nextLevel, 2);

  // Endurance must be rushed (+5)
  const endBonus = step.attributeBonuses.find((b) => b.attribute === "Endurance");
  assert.ok(endBonus);
  assert.equal(endBonus.bonus, 5);

  // Verify total Major/Minor increases equal exactly 10
  const totalMM = Object.values(step.majorMinorIncreases).reduce((a, b) => a + b, 0);
  assert.equal(totalMM, 10);

  // Verify that for every chosen +5 attribute, total increases (Major/Minor + Misc) >= 10
  for (const pick of step.attributeBonuses) {
    if (pick.attribute === "Luck") continue;
    let increases = 0;
    // from Major/Minor
    for (const [s, pts] of Object.entries(step.majorMinorIncreases)) {
      if (s === "Long Blade" && pick.attribute === "Strength") increases += pts;
      if (s === "Heavy Armor" && pick.attribute === "Endurance") increases += pts;
      if (s === "Medium Armor" && pick.attribute === "Endurance") increases += pts;
      if (s === "Armorer" && pick.attribute === "Strength") increases += pts;
      if (s === "Block" && pick.attribute === "Agility") increases += pts;
    }
    // from Misc
    for (const m of step.miscTraining) {
      if (m.attribute === pick.attribute) increases += m.points;
    }
    assert.ok(
      increases >= 10,
      `Attribute ${pick.attribute} expected 10 skill increases for 5x multiplier, got ${increases}`
    );
  }

  // Full progression simulation test (simulate up to level 15):
  const progression = simulateProgression(character, {
    targetLevel: 15,
    strategy: "rush_endurance"
  });

  assert.equal(progression.steps.length, 14); // levels 2 through 15
  assert.equal(progression.finalState.level, 15);

  // Endurance was 40 at Level 1.
  // Gaining +5 every level:
  // L2: 45, L3: 50, L4: 55, L5: 60, L6: 65, L7: 70, L8: 75, L9: 80, L10: 85, L11: 90, L12: 95, L13: 100
  // By Level 13, Endurance is fully capped at 100!
  assert.equal(progression.finalState.attributes.Endurance, 100);

  // Verify health gains are accumulated non-retroactively (45 start + 104 gained across 14 levels = 149)
  assert.equal(progression.finalState.health, 149);
});

test("triple_5 and efficient_luck optimization strategies behave as specified", async () => {
  const { simulateProgression } = await import("../lib/level-math.mjs");

  const character = {
    level: 1,
    attributes: {
      Strength: 40,
      Intelligence: 40,
      Willpower: 40,
      Agility: 40,
      Speed: 40,
      Endurance: 40,
      Personality: 40,
      Luck: 40
    },
    skills: {
      "Long Blade": 35,
      "Heavy Armor": 35,
      "Block": 35,
      "Armorer": 35,
      "Medium Armor": 35,
      "Destruction": 20,
      "Restoration": 20,
      "Short Blade": 20,
      "Sneak": 20,
      "Security": 20
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"]
  };

  // 1. Efficient (+5/+5/+1 Luck) strategy: Luck is raised by +1 every level
  const luckProgression = simulateProgression(character, {
    targetLevel: 10,
    strategy: "efficient_luck"
  });

  luckProgression.steps.forEach((step) => {
    const luckPick = step.attributeBonuses.find((b) => b.attribute === "Luck");
    assert.ok(luckPick, `Luck should be chosen in step to level ${step.nextLevel}`);
    assert.equal(luckPick.bonus, 1);
  });
  // Luck started at 40, after 9 levels (level 10), Luck should be 40 + 9 = 49
  assert.equal(luckProgression.finalState.attributes.Luck, 49);

  // 2. Triple +5 (+5/+5/+5) strategy: does NOT pick Luck while non-Luck attributes are uncapped
  const tripleProgression = simulateProgression(character, {
    targetLevel: 5,
    strategy: "triple_5"
  });

  tripleProgression.steps.forEach((step) => {
    assert.equal(step.attributeBonuses.length, 3);
    step.attributeBonuses.forEach((b) => {
      assert.notEqual(b.attribute, "Luck");
      assert.equal(b.bonus, 5);
    });
  });
});

test("dual-mode support: progression matrix generates full 27 skills with accurate tiers and values", async () => {
  const { simulateProgression, getSkillProgressionMatrix } = await import("../lib/level-math.mjs");

  const character = {
    level: 1,
    attributes: {
      Strength: 50,
      Intelligence: 40,
      Willpower: 30,
      Agility: 40,
      Speed: 50,
      Endurance: 40,
      Personality: 30,
      Luck: 40
    },
    skills: {
      "Long Blade": 40,
      "Heavy Armor": 35,
      "Block": 35,
      "Armorer": 30,
      "Medium Armor": 30,
      "Destruction": 25,
      "Restoration": 20,
      "Short Blade": 20,
      "Sneak": 20,
      "Security": 20
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"]
  };

  const progression = simulateProgression(character, { targetLevel: 5 });
  const matrix = getSkillProgressionMatrix(progression);

  assert.equal(matrix.length, 27, "Must contain all 27 Morrowind skills");

  const longBlade = matrix.find((s) => s.skill === "Long Blade");
  assert.equal(longBlade.tier, "Major");
  assert.equal(longBlade.specialization, "Combat");
  assert.equal(longBlade.governingAttribute, "Strength");
  assert.equal(longBlade.startingValue, 40);
  assert.ok(longBlade.currentValue >= 40);
  assert.equal(longBlade.pointsGained, longBlade.currentValue - longBlade.startingValue);

  const destruction = matrix.find((s) => s.skill === "Destruction");
  assert.equal(destruction.tier, "Minor");
  assert.equal(destruction.specialization, "Magic");

  const spear = matrix.find((s) => s.skill === "Spear");
  assert.equal(spear.tier, "Misc");
  assert.equal(spear.specialization, "Combat");
});

test("health growth comparison curves demonstrate the advantage of rushing Endurance", async () => {
  const { calculateHealthGrowthCurve } = await import("../lib/level-math.mjs");

  const character = {
    level: 1,
    attributes: {
      Strength: 40,
      Intelligence: 40,
      Willpower: 40,
      Agility: 40,
      Speed: 40,
      Endurance: 40,
      Personality: 40,
      Luck: 40
    },
    skills: {
      "Long Blade": 35,
      "Heavy Armor": 35,
      "Block": 35,
      "Armorer": 35,
      "Medium Armor": 35,
      "Destruction": 20,
      "Restoration": 20,
      "Short Blade": 20,
      "Sneak": 20,
      "Security": 20
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
    health: 40
  };

  const curve = calculateHealthGrowthCurve(character, 25);
  assert.ok(curve.levels.length > 1);
  assert.equal(curve.optimalHealth[0], 40);
  assert.equal(curve.delayedHealth[0], 40);

  // Optimal Health should consistently outpace delayed Health over time
  const finalOptimal = curve.optimalHealth[curve.optimalHealth.length - 1];
  const finalDelayed = curve.delayedHealth[curve.delayedHealth.length - 1];
  assert.ok(
    finalOptimal > finalDelayed,
    `Optimal health (${finalOptimal}) should exceed delayed health (${finalDelayed})`
  );
  assert.ok(curve.maxDifference > 0);
});

test("extractCharacterSheet generates a valid sheet for Character Builder integration", async () => {
  const { simulateProgression, extractCharacterSheet } = await import("../lib/level-math.mjs");

  const character = {
    race: "Dark Elf",
    gender: "Male",
    sign: "The Lady",
    spec: "Combat",
    fav1: "Strength",
    fav2: "Endurance",
    className: "Warrior",
    attributes: {
      Strength: 50,
      Intelligence: 40,
      Willpower: 30,
      Agility: 40,
      Speed: 50,
      Endurance: 75,
      Personality: 55,
      Luck: 40
    },
    skills: {
      "Long Blade": 45,
      "Heavy Armor": 40,
      "Block": 35,
      "Armorer": 35,
      "Medium Armor": 35,
      "Destruction": 30,
      "Restoration": 20,
      "Short Blade": 30,
      "Sneak": 20,
      "Security": 20
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
    health: 50
  };

  const progression = simulateProgression(character, { targetLevel: 6 });
  const sheet = extractCharacterSheet(progression, 6);

  assert.equal(sheet.level, 6);
  assert.ok(sheet.attrs.Strength.v >= 50);
  assert.ok(sheet.attrs.Endurance.v >= 75);
  assert.ok(sheet.health > 50);
  assert.equal(sheet.race, "Dark Elf");
  assert.equal(sheet.sign, "The Lady");
});

test("level-math edge cases: all attributes maxed at 100, custom priority, and skill cap boundary", async () => {
  const {
    simulateProgression,
    validateLevelStep,
    normalizeCharacterState
  } = await import("../lib/level-math.mjs");

  // 1. All attributes already at 100: can still level up if Major/Minor skills have headroom
  const maxedAttrsCharacter = {
    level: 1,
    attributes: {
      Strength: 100,
      Intelligence: 100,
      Willpower: 100,
      Agility: 100,
      Speed: 100,
      Endurance: 100,
      Personality: 100,
      Luck: 100
    },
    skills: {
      "Long Blade": 35,
      "Heavy Armor": 35,
      "Block": 35,
      "Armorer": 35,
      "Medium Armor": 35,
      "Destruction": 20,
      "Restoration": 20,
      "Short Blade": 20,
      "Sneak": 20,
      "Security": 20
    },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
    health: 100
  };

  const maxedProg = simulateProgression(maxedAttrsCharacter, { targetLevel: 3 });
  assert.equal(maxedProg.finalState.level, 3);
  // Health gains floor(100 / 10) = 10 HP per level
  assert.equal(maxedProg.finalState.health, 100 + 10 + 10);
  // Attributes stay at 100
  assert.equal(maxedProg.finalState.attributes.Endurance, 100);
  // Attribute bonuses should be empty because no attribute can be raised
  assert.equal(maxedProg.steps[0].attributeBonuses.length, 0);

  // 2. Custom priority queue passed into simulateProgression
  const customPriority = [
    "Personality",
    "Speed",
    "Endurance",
    "Agility",
    "Strength",
    "Willpower",
    "Intelligence",
    "Luck"
  ];
  const customProg = simulateProgression(
    {
      level: 1,
      attributes: {
        Strength: 40,
        Intelligence: 40,
        Willpower: 40,
        Agility: 40,
        Speed: 40,
        Endurance: 40,
        Personality: 40,
        Luck: 40
      },
      skills: {
        "Long Blade": 35,
        "Heavy Armor": 35,
        "Block": 35,
        "Armorer": 35,
        "Medium Armor": 35,
        "Destruction": 20,
        "Restoration": 20,
        "Short Blade": 20,
        "Sneak": 20,
        "Security": 20
      },
      maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
      min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"],
      health: 40
    },
    { targetLevel: 2, priority: customPriority, strategy: "triple_5" }
  );

  const step1Attrs = customProg.steps[0].attributeBonuses.map((b) => b.attribute);
  // In triple_5 with customPriority, the top 3 attributes should be Personality, Speed, Endurance
  assert.deepEqual(step1Attrs, ["Personality", "Speed", "Endurance"]);

  // 3. Manual validation boundary: rejecting skill increase exceeding 100
  const state = normalizeCharacterState({
    level: 1,
    attributes: { Strength: 98, Endurance: 40 },
    skills: { "Long Blade": 95, "Heavy Armor": 40 },
    maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Medium Armor"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"]
  });

  const stepExceedSkill = {
    attributeBonuses: [{ attribute: "Strength", bonus: 2 }],
    majorMinorIncreases: { "Long Blade": 10 }, // 95 + 10 = 105 > 100
    miscIncreases: {}
  };
  const valRes = validateLevelStep(state, stepExceedSkill);
  assert.equal(valRes.valid, false);
  assert.ok(valRes.errors.some((e) => e.includes("cannot exceed 100")));

  // 4. Manual validation boundary: selecting already capped attribute
  const stateCappedAttr = normalizeCharacterState({
    level: 1,
    attributes: { Strength: 100, Endurance: 40 },
    skills: { "Heavy Armor": 40 },
    maj: ["Heavy Armor", "Block", "Armorer", "Medium Armor", "Long Blade"],
    min: ["Destruction", "Restoration", "Short Blade", "Sneak", "Security"]
  });
  const stepCappedAttr = {
    attributeBonuses: [{ attribute: "Strength", bonus: 1 }],
    majorMinorIncreases: { "Heavy Armor": 10 },
    miscIncreases: {}
  };
  const valRes2 = validateLevelStep(stateCappedAttr, stepCappedAttr);
  assert.equal(valRes2.valid, false);
  assert.ok(valRes2.errors.some((e) => e.includes("already capped at 100")));
});

