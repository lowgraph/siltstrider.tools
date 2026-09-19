const { test } = require("node:test");
const assert = require("node:assert/strict");

test("Enchanting Math: calculates base points, CE validity, and self-enchant rate", async () => {
  const {
    calcEffectCost,
    calcEnchantmentTotalPoints,
    calcSelfEnchantChance,
    calcBarterBuyPrice
  } = await import("../lib/enchant-math.mjs");

  // Single effect cost
  const effect = { n: "Fortify Strength", b: 1, mag: 1, dur: 1, ce: 1 };
  const costUsed = calcEffectCost(effect, "used", 10, 10, 10, 0, "self", 0);
  assert.equal(costUsed, 5.025); // ((10+10)*10 + 1) * 1 * 0.5 * 0.05 = 201 * 0.025 = 5.025
  assert.ok(costUsed > 0);

  // Constant effect
  const costCe = calcEffectCost(effect, "const", 10, 10, 10, 0, "self", 0);
  assert.equal(Math.round(costCe), 50);

  // Self enchant chance
  const chanceLow = calcSelfEnchantChance(15, 30, 40, 50);
  assert.equal(chanceLow, 0); // low stats cannot self-enchant 50 pt item

  const chanceHigh = calcSelfEnchantChance(100, 100, 100, 10);
  assert.ok(chanceHigh > 50);

  // Barter pricing
  const npc = { merc: 10, pers: 45, luck: 40 };
  const pc = { merc: 40, pers: 40, luck: 40, disp: 50 };
  const price = calcBarterBuyPrice(1000, npc, pc);
  assert.ok(price > 0 && price <= 1500);
});

test("Spellmaking Math: calculates magicka cost, cast chance, and barter prices", async () => {
  const {
    calcSingleSpellEffectCost,
    calcTotalSpellMagickaCost,
    calcSpellCastChance,
    calcSpellmakerBarterPrice
  } = await import("../lib/spell-math.mjs");

  const fireDamage = { n: "Fire Damage", b: 5, mag: 1, dur: 1, school: "Destruction" };
  const costSelf = calcSingleSpellEffectCost(fireDamage, 10, 10, 5, 0, "self");
  // ((10+10)*5)*5*0.05 = 100 * 0.25 = 25
  assert.equal(costSelf, 25);

  const costTarget = calcSingleSpellEffectCost(fireDamage, 10, 10, 5, 0, "target");
  assert.equal(costTarget, 37.5); // 25 * 1.5

  const total = calcTotalSpellMagickaCost([
    { effect: fireDamage, min: 10, max: 10, dur: 5, area: 0, range: "self" }
  ]);
  assert.equal(total, 25);

  // Cast chance
  const chance = calcSpellCastChance(25, 50, 40, 40, 1.0);
  // (50*2 + 40/5 + 40/10 - 25) * (0.75 + 0.5) = (100 + 8 + 4 - 25) * 1.25 = 87 * 1.25 = 108.75 -> clamped to 100
  assert.equal(chance, 100);

  const npc = { merc: 10, pers: 45, luck: 40 };
  const pc = { merc: 40, pers: 40, luck: 40, disp: 50 };
  const fee = calcSpellmakerBarterPrice(100, npc, pc);
  assert.ok(fee > 0);
});

test("Alchemy Math: identifies shared effects and computes potion strength", async () => {
  const {
    findSharedEffects,
    calculatePotion
  } = await import("../lib/alchemy-math.mjs");

  const ashYam = {
    id: "ash_yam",
    n: "Ash Yam",
    effects: [
      { n: "Fortify Intelligence", b: 1, arg: "Intelligence" },
      { n: "Resist Common Disease", b: 2 },
      { n: "Fortify Strength", b: 1, arg: "Strength" }
    ]
  };

  const bloat = {
    id: "bloat",
    n: "Bloat",
    effects: [
      { n: "Drain Magicka", b: 2, bad: true },
      { n: "Fortify Intelligence", b: 1, arg: "Intelligence" },
      { n: "Fortify Willpower", b: 1, arg: "Willpower" }
    ]
  };

  const shared = findSharedEffects([ashYam, bloat]);
  assert.equal(shared.length, 1);
  assert.equal(shared[0].effect.n, "Fortify Intelligence");

  const potion = calculatePotion({
    ingredients: [ashYam, bloat],
    alchemySkill: 50,
    intelligence: 40,
    luck: 40,
    mortarQuality: 1.0
  });

  assert.equal(potion.isValid, true);
  assert.ok(potion.name.includes("Fortify Intelligence"));
  assert.ok(potion.brewChance > 50);
  assert.ok(potion.effects[0].magnitude > 0);
  assert.ok(potion.effects[0].duration > 0);
});

test("Travel Graph: routes shortest transit paths across Vvardenfell and Tamriel Rebuilt", async () => {
  const {
    findFewestHopsRoute,
    getAvailableTransitStops
  } = await import("../lib/travel-graph.mjs");

  const stops = getAvailableTransitStops("vanilla");
  assert.ok(stops.includes("Seyda Neen"));
  assert.ok(stops.includes("Vivec"));
  assert.ok(stops.includes("Balmora"));

  // 1-hop path Seyda Neen -> Vivec
  const r1 = findFewestHopsRoute("Seyda Neen", "Vivec", "vanilla");
  assert.equal(r1.isValid, true);
  assert.equal(r1.hops, 1);
  assert.equal(r1.steps[0].kind, "Silt Strider");

  // Multi-hop path Khuul -> Vivec
  const r2 = findFewestHopsRoute("Khuul", "Vivec", "vanilla");
  assert.equal(r2.isValid, true);
  assert.ok(r2.hops >= 1);
});
