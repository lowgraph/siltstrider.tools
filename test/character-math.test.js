const { test } = require('node:test');
const assert = require('node:assert/strict');

test('character-math calculates attributes, vitals and skills accurately', async () => {
  const { computeSheet, startingSpells, swapSkill } = await import('../lib/character-math.mjs');

  const mockCatalogs = {
    skills: ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Block', 'Armorer', 'Destruction', 'Restoration', 'Short Blade', 'Sneak', 'Security'],
    specSkills: {
      Combat: ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Block', 'Armorer'],
      Magic: ['Destruction', 'Restoration'],
      Stealth: ['Short Blade', 'Sneak', 'Security']
    },
    races: {
      'Dark Elf': {
        M: { Strength: 40, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 40, Personality: 30, Luck: 40 },
        F: { Strength: 35, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 35, Personality: 40, Luck: 40 },
        skills: { 'Long Blade': 5, Destruction: 10, 'Short Blade': 10 },
        mag: 0
      }
    },
    signs: {
      'The Lady': {
        mag: 0,
        attrs: { Personality: 25, Endurance: 25 }
      }
    },
    raceSpells: {
      'Dark Elf': ['Ancestor Guardian']
    },
    signSpells: {
      'The Lady': []
    }
  };

  const build = {
    race: 'Dark Elf',
    gender: 'Male',
    sign: 'The Lady',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Long Blade', 'Heavy Armor', 'Block', 'Armorer', 'Medium Armor'],
    min: ['Destruction', 'Restoration', 'Short Blade', 'Sneak', 'Security']
  };

  const sheet = computeSheet(build, mockCatalogs);
  assert.ok(sheet);

  // Strength: 40 race + 10 favored = 50
  assert.equal(sheet.attrs.Strength.v, 50);
  // Endurance: 40 race + 10 favored + 25 Lady = 75
  assert.equal(sheet.attrs.Endurance.v, 75);
  // Health: floor((STR 50 + END (75 - 25 Lady)) / 2) = floor((50 + 50) / 2) = 50
  assert.equal(sheet.health, 50);
  // Magicka: 40 INT * (1 + 0 + 0) = 40
  assert.equal(sheet.magicka, 40);
  // Fatigue: 50 STR + 30 WIL + 40 AGI + 75 END = 195
  assert.equal(sheet.fatigue, 195);

  // Skill Long Blade: 5 base + 5 race + 5 spec + 25 major = 40
  assert.equal(sheet.skills['Long Blade'].v, 40);
  // Skill Destruction: 5 base + 10 race + 0 spec + 10 minor = 25
  assert.equal(sheet.skills['Destruction'].v, 25);

  const spells = startingSpells(build, sheet, mockCatalogs);
  assert.deepEqual(spells.race, ['Ancestor Guardian']);

  // Test duplicate skill swapping
  const swapped = swapSkill(build.maj, build.min, true, 0, 'Destruction');
  // Long Blade was at maj[0], Destruction was at min[0]. They should swap!
  assert.equal(swapped.maj[0], 'Destruction');
  assert.equal(swapped.min[0], 'Long Blade');
});

test('applyBitterCup and computeSheet handle Bitter Cup mechanics and canonical tie-breaking', async () => {
  const { computeSheet, applyBitterCup, ATTRS } = await import('../lib/character-math.mjs');

  const mockCatalogs = {
    skills: ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Block', 'Armorer', 'Destruction', 'Restoration', 'Short Blade', 'Sneak', 'Security'],
    specSkills: {
      Combat: ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Block', 'Armorer'],
      Magic: ['Destruction', 'Restoration'],
      Stealth: ['Short Blade', 'Sneak', 'Security']
    },
    races: {
      'Dark Elf': {
        M: { Strength: 40, Intelligence: 40, Willpower: 30, Agility: 40, Speed: 50, Endurance: 40, Personality: 30, Luck: 40 },
        skills: { 'Long Blade': 5 },
        mag: 0
      }
    },
    signs: {
      'The Lady': {
        mag: 0,
        attrs: { Personality: 25, Endurance: 25 }
      }
    }
  };

  const build = {
    race: 'Dark Elf',
    gender: 'Male',
    sign: 'The Lady',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Long Blade', 'Heavy Armor', 'Block', 'Armorer', 'Medium Armor'],
    min: ['Destruction', 'Restoration', 'Short Blade', 'Sneak', 'Security'],
    bitterCup: true
  };

  // 1. Integration in computeSheet with bitterCup: true
  const sheet = computeSheet(build, mockCatalogs);
  assert.ok(sheet.bitterCup);
  assert.equal(sheet.bitterCup.highest, 'Endurance');
  assert.equal(sheet.bitterCup.lowest, 'Willpower');
  assert.equal(sheet.attrs.Endurance.v, 95); // 75 + 20
  assert.equal(sheet.attrs.Willpower.v, 10); // 30 - 20
  assert.ok(sheet.attrs.Endurance.parts.includes('+20 Bitter Cup'));
  assert.ok(sheet.attrs.Willpower.parts.includes('-20 Bitter Cup'));

  // Health reflects the higher Endurance base:
  // strForHp: 50
  // endForHp: 95 - 25 (Lady) = 70
  // Health: floor((50 + 70) / 2) = 60 (up from 50!)
  assert.equal(sheet.health, 60);

  // 2. Canonical tie-breaker: highest tied attributes pick first in ATTRS
  const tiedHigh = {
    Strength: 60,
    Intelligence: 60,
    Willpower: 40,
    Agility: 40,
    Speed: 40,
    Endurance: 40,
    Personality: 40,
    Luck: 40
  };
  const resTiedHigh = applyBitterCup(tiedHigh);
  assert.equal(resTiedHigh.highest, 'Strength'); // Strength precedes Intelligence in ATTRS
  assert.equal(resTiedHigh.modifiedAttributes.Strength, 80);
  assert.equal(resTiedHigh.modifiedAttributes.Intelligence, 60);

  // 3. Canonical tie-breaker: lowest tied attributes pick first in ATTRS
  const tiedLow = {
    Strength: 70,
    Intelligence: 50,
    Willpower: 30,
    Agility: 30,
    Speed: 40,
    Endurance: 50,
    Personality: 40,
    Luck: 40
  };
  const resTiedLow = applyBitterCup(tiedLow);
  assert.equal(resTiedLow.lowest, 'Willpower'); // Willpower precedes Agility in ATTRS
  assert.equal(resTiedLow.modifiedAttributes.Willpower, 10);
  assert.equal(resTiedLow.modifiedAttributes.Agility, 30);

  // 4. Edge case: all attributes identical (e.g. all 40)
  // Strength is chosen for both highest and lowest -> net 0
  const all40 = {};
  ATTRS.forEach((a) => (all40[a] = 40));
  const resAll40 = applyBitterCup(all40);
  assert.equal(resAll40.highest, 'Strength');
  assert.equal(resAll40.lowest, 'Strength');
  assert.equal(resAll40.modifiedAttributes.Strength, 40);

  // 5. Capping and clamping boundaries: 100 max and 0 min
  const boundaryAttrs = {
    Strength: 95,
    Intelligence: 50,
    Willpower: 50,
    Agility: 50,
    Speed: 50,
    Endurance: 50,
    Personality: 50,
    Luck: 10
  };
  const resBoundary = applyBitterCup(boundaryAttrs);
  assert.equal(resBoundary.highest, 'Strength');
  assert.equal(resBoundary.lowest, 'Luck');
  assert.equal(resBoundary.modifiedAttributes.Strength, 100); // capped at 100 (95 + 20 -> 100)
  assert.equal(resBoundary.modifiedAttributes.Luck, 0); // clamped at 0 (10 - 20 -> 0)
});

