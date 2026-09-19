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
