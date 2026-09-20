const { test } = require("node:test");
const assert = require("node:assert/strict");

test("Equipment Math: All 19 canonical slots and armor weights sum to 100%", async () => {
  const { EQUIP_SLOTS, ARMOR_SLOT_WEIGHTS } = await import("../lib/equipment-math.mjs");
  assert.equal(EQUIP_SLOTS.length, 19);
  const totalWeight = Object.values(ARMOR_SLOT_WEIGHTS).reduce((acc, w) => acc + w, 0);
  assert.equal(Math.round(totalWeight * 100) / 100, 1.0);
  assert.equal(ARMOR_SLOT_WEIGHTS.Cuirass, 0.30);
  assert.equal(ARMOR_SLOT_WEIGHTS.CarriedLeft, 0.10);
});

test("Equipment Math: Pure unarmored calculations at various skill ratings", async () => {
  const { computeTotalArmorRating, createDefaultLoadout } = await import("../lib/equipment-math.mjs");
  // Skill 100: 100 * 100 * 0.0065 = 65 AR
  const emptyLoadout = createDefaultLoadout();
  const arAt100 = computeTotalArmorRating(emptyLoadout, { Unarmored: 100 });
  assert.equal(arAt100, 65);

  // Skill 0: 0 AR
  const arAt0 = computeTotalArmorRating(emptyLoadout, { Unarmored: 0 });
  assert.equal(arAt0, 0);

  // Skill 50: floor(50 * 50 * 0.0065) = floor(16.25) = 16 AR
  const arAt50 = computeTotalArmorRating(emptyLoadout, { Unarmored: 50 });
  assert.equal(arAt50, 16);
});

test("Equipment Math: Armor skill scaling on individual pieces and full sets", async () => {
  const { computeSlotArmorRating, computeTotalArmorRating } = await import("../lib/equipment-math.mjs");
  // Cuirass base AR 60, Heavy Armor
  const heavyCuirass = {
    id: "ebony_cuirass",
    name: "Ebony Cuirass",
    type: "cuirass",
    armorClass: "heavy",
    armorRating: 60,
    weight: 28,
  };

  // At Heavy Armor 30 (Base skill divisor 30), piece AR = 60 * (30/30) = 60
  const arSkill30 = computeSlotArmorRating("Cuirass", heavyCuirass, { HeavyArmor: 30, Unarmored: 10 });
  assert.equal(arSkill30, 60);

  // At Heavy Armor 60, piece AR = 60 * (60/30) = 120
  const arSkill60 = computeSlotArmorRating("Cuirass", heavyCuirass, { HeavyArmor: 60, Unarmored: 10 });
  assert.equal(arSkill60, 120);

  // At Heavy Armor 100, piece AR = 60 * (100/30) = 200
  const arSkill100 = computeSlotArmorRating("Cuirass", heavyCuirass, { HeavyArmor: 100, Unarmored: 10 });
  assert.equal(arSkill100, 200);

  // Cuirass accounts for 30% of total AR
  const loadout = { Cuirass: heavyCuirass };
  // Total = 60 * 0.30 + 0 (unarmored 0) = 18.0
  const totalAR = computeTotalArmorRating(loadout, { HeavyArmor: 30, Unarmored: 0 });
  assert.equal(totalAR, 18.0);
});

test("Equipment Math: Encumbrance and carry capacity with Strength scaling", async () => {
  const { computeEncumbrance } = await import("../lib/equipment-math.mjs");
  const loadout = {
    Cuirass: { weight: 25 },
    Helmet: { weight: 5 },
    Greaves: { weight: 12 },
    CarriedRight: { weight: 18 },
  };

  // Strength 40 -> max capacity 200 lbs. Total weight = 60 lbs -> 30%
  const enc = computeEncumbrance(loadout, 40);
  assert.equal(enc.totalWeight, 60);
  assert.equal(enc.maxWeight, 200);
  assert.equal(enc.ratio, 30);
  assert.equal(enc.isOverEncumbered, false);

  // Over-encumbered test: Strength 10 -> max 50 lbs. Total 60 lbs -> over-encumbered
  const overEnc = computeEncumbrance(loadout, 10);
  assert.equal(overEnc.isOverEncumbered, true);
  assert.equal(overEnc.ratio, 100);
});

test("Equipment Math: Two-Handed weapon and shield mutually exclusive rule", async () => {
  const { equipItem } = await import("../lib/equipment-math.mjs");
  const twoHandedAxe = {
    id: "battleaxe_steel",
    name: "Steel Battleaxe",
    type: "AX2H",
    weight: 24,
    recordType: "WEAP",
  };
  const shield = {
    id: "shield_iron",
    name: "Iron Shield",
    type: "shield",
    armorRating: 15,
    weight: 12,
  };
  const oneHandedSword = {
    id: "iron_longsword",
    name: "Iron Longsword",
    type: "LB1H",
    weight: 16,
    recordType: "WEAP",
  };

  // Initial loadout with shield
  let loadout = { CarriedLeft: shield };

  // Equipping 2H weapon automatically removes shield
  const res1 = equipItem(loadout, "CarriedRight", twoHandedAxe);
  assert.equal(res1.success, true);
  assert.equal(res1.loadout.CarriedRight.id, "battleaxe_steel");
  assert.equal(res1.loadout.CarriedLeft, undefined);

  // Attempting to equip shield with 2H weapon active automatically clears 2H weapon
  const res2 = equipItem(res1.loadout, "CarriedLeft", shield);
  assert.equal(res2.success, true);
  assert.equal(res2.loadout.CarriedLeft.id, "shield_iron");
  assert.equal(res2.loadout.CarriedRight, undefined);

  // 1-Handed weapon and shield can coexist
  const res3 = equipItem(res2.loadout, "CarriedRight", oneHandedSword);
  assert.equal(res3.success, true);
  assert.equal(res3.loadout.CarriedLeft.id, "shield_iron");
  assert.equal(res3.loadout.CarriedRight.id, "iron_longsword");
});

test("Equipment Math: Beast race restrictions (Khajiit / Argonian rejecting boots and closed helms)", async () => {
  const { validateSlotEquip } = await import("../lib/equipment-math.mjs");
  const boots = {
    id: "chitin_boots",
    name: "Chitin Boots",
    type: "boots",
    armorRating: 10,
    weight: 6,
  };
  const closedHelm = {
    id: "iron_helmet",
    name: "Iron Closed Helmet",
    type: "helmet",
    armorRating: 15,
    weight: 5,
    bodyParts: [{ slot: 0 }],
  };
  const openHelm = {
    id: "colovian_fur_helm",
    name: "Colovian Fur Helm",
    type: "helmet",
    armorRating: 5,
    weight: 2,
    bodyParts: [{ slot: 1 }],
  };

  // Argonian cannot equip boots
  const valArgonianBoots = validateSlotEquip(boots, "Boots", { race: "Argonian" });
  assert.equal(valArgonianBoots.allowed, false);
  assert.match(valArgonianBoots.reason, /Beast races/);

  // Khajiit cannot equip closed helm
  const valKhajiitClosed = validateSlotEquip(closedHelm, "Helmet", { race: "Khajiit" });
  assert.equal(valKhajiitClosed.allowed, false);
  assert.match(valKhajiitClosed.reason, /closed helmets/);

  // Khajiit CAN equip open helm
  const valKhajiitOpen = validateSlotEquip(openHelm, "Helmet", { race: "Khajiit" });
  assert.equal(valKhajiitOpen.allowed, true);

  // Dark Elf (non-beast) can equip boots and closed helm freely
  const valDunmerBoots = validateSlotEquip(boots, "Boots", { race: "Dark Elf" });
  assert.equal(valDunmerBoots.allowed, true);
  const valDunmerHelm = validateSlotEquip(closedHelm, "Helmet", { race: "Dark Elf" });
  assert.equal(valDunmerHelm.allowed, true);
});

test("Equipment Math: Weapon combat profile formatting", async () => {
  const { getWeaponCombatProfile } = await import("../lib/equipment-math.mjs");
  const spear = {
    id: "iron_spear",
    name: "Iron Spear",
    type: "SP2H",
    speed: 1.0,
    reach: 1.8,
    chop: { min: 1, max: 8 },
    slash: { min: 1, max: 8 },
    thrust: { min: 5, max: 20 },
    health: 600,
    enchantp: 50,
  };

  const profile = getWeaponCombatProfile(spear);
  assert.equal(profile.name, "Iron Spear");
  assert.equal(profile.isTwoHanded, true);
  assert.equal(profile.reach, 1.8);
  assert.equal(profile.thrust, "5-20");
  assert.equal(profile.chop, "1-8");
});

test("Equipment Math: Constant Effect Enchantments aggregation", async () => {
  const { aggregateConstantEffects } = await import("../lib/equipment-math.mjs");
  const loadout = {
    LeftRing: {
      id: "ring_healing",
      name: "Ring of Phynaster",
      enchantmentId: "phynaster_en",
    },
    Cuirass: {
      id: "savior_hide",
      name: "Cuirass of the Savior's Hide",
      enchantmentId: "savior_en",
    },
  };

  const enchantsMap = {
    phynaster_en: {
      type: "constant",
      effects: [{ effect: "Resist Poison", magnitude: 20 }, { effect: "Resist Shock", magnitude: 20 }],
    },
    savior_en: {
      type: "constant",
      effects: [{ effect: "Resist Magicka", magnitude: 60 }],
    },
  };

  const activeEffects = aggregateConstantEffects(loadout, enchantsMap);
  assert.equal(activeEffects.length, 2);
  assert.equal(activeEffects[0].slot, "LeftRing");
  assert.equal(activeEffects[1].slot, "Cuirass");
});

test("Equipment Math: Default loadouts and preset templates initialization", async () => {
  const { createDefaultLoadoutPresets } = await import("../lib/equipment-math.mjs");
  const presets = createDefaultLoadoutPresets();
  assert.equal(presets.length, 4);
  assert.equal(presets[0].id, "loadout-1");
  assert.equal(presets[0].name, "Primary Combat");
  assert.deepEqual(presets[0].items, {});
});

// ADVERSARIAL EDGE CASES (Mandatory per rule 3)
test("Equipment Math (Adversarial): Null, undefined, malformed inputs and boundary conditions", async () => {
  const { computeTotalArmorRating, computeSlotArmorRating, computeEncumbrance, validateSlotEquip } = await import(
    "../lib/equipment-math.mjs"
  );

  // 1. Null / undefined items or skills in AR calculations
  assert.equal(computeTotalArmorRating(null, null), 1.0); // unarmored fallback at default 15
  assert.equal(computeSlotArmorRating("NonExistentSlot", null, null), 0);
  assert.equal(computeSlotArmorRating("Cuirass", { armorRating: null }, {}), 1); // fallback unarmored 15 -> floor(15*15*0.0065)=1

  // 2. Encumbrance with negative or null strength
  const encZeroStr = computeEncumbrance({ item: { weight: 10 } }, 0);
  assert.equal(encZeroStr.maxWeight, 0);
  assert.equal(encZeroStr.isOverEncumbered, true);

  const encNaN = computeEncumbrance({ item: { weight: "not a number" } }, undefined);
  assert.equal(encNaN.totalWeight, 0);
  assert.equal(encNaN.maxWeight, 200);

  // 3. Equipping into an invalid or non-existent slot
  const invalidSlotEquip = validateSlotEquip({ type: "helmet" }, "Belt");
  assert.equal(invalidSlotEquip.allowed, false);
  assert.match(invalidSlotEquip.reason, /Only belts/);

  // 4. Extreme values: negative AR or massive AR clamp
  const crazyArmor = { type: "cuirass", armorRating: -50 };
  const crazyAR = computeSlotArmorRating("Cuirass", crazyArmor, { HeavyArmor: 30 });
  assert.equal(crazyAR, -50); // does not crash or throw
});
