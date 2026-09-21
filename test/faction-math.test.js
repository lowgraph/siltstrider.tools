const { test } = require('node:test');
const assert = require('node:assert/strict');

test('normalizeStatKey and getStatValue handle varied schema shapes seamlessly', async () => {
  const { normalizeStatKey, getStatValue } = await import('../lib/faction-math.mjs');

  // Normalization
  assert.equal(normalizeStatKey('Long Blade'), 'longblade');
  assert.equal(normalizeStatKey('long_blade'), 'longblade');
  assert.equal(normalizeStatKey('LongBlade'), 'longblade');
  assert.equal(normalizeStatKey('hand-to-hand'), 'handtohand');
  assert.equal(normalizeStatKey(''), '');
  assert.equal(normalizeStatKey(null), '');

  // getStatValue with computeSheet object structure { v, parts }
  const sheetAttrs = {
    Intelligence: { v: 45, parts: ['40 race', '+5 favored'] },
    Willpower: { v: 50, parts: ['50 race'] }
  };
  assert.equal(getStatValue(sheetAttrs, 'intelligence'), 45);
  assert.equal(getStatValue(sheetAttrs, 'WILLPOWER'), 50);
  assert.equal(getStatValue(sheetAttrs, 'Strength'), 0);

  // getStatValue with plain numeric object
  const plainSkills = {
    alchemy: 35,
    mysticism: 20,
    long_blade: 55
  };
  assert.equal(getStatValue(plainSkills, 'Alchemy'), 35);
  assert.equal(getStatValue(plainSkills, 'Long Blade'), 55);
  assert.equal(getStatValue(plainSkills, 'destruction'), 0);

  // getStatValue with omwsave-parser array structure
  const omwSkills = [
    { id: 'Block', value: 40, base: 35 },
    { id: 'ShortBlade', value: 25, base: 25 }
  ];
  assert.equal(getStatValue(omwSkills, 'block'), 40);
  assert.equal(getStatValue(omwSkills, 'Short Blade'), 25);
  assert.equal(getStatValue(omwSkills, 'axe'), 0);

  // Null/undefined guards
  assert.equal(getStatValue(null, 'intelligence'), 0);
  assert.equal(getStatValue(sheetAttrs, null), 0);
});

test('joinableFactions distinguishes joinable guilds from lore/NPC factions', async () => {
  const { joinableFactions } = await import('../lib/faction-math.mjs');

  const factions = [
    { key: 'mages guild', name: 'Mages Guild', ranks: [{ index: 0, name: 'Associate' }] },
    { key: 'sixth house', name: 'Sixth House', ranks: [] }, // Non-joinable
    { key: 'talos cult', name: 'Talos Cult', ranks: [] },   // Non-joinable
    { key: 'redoran', name: 'Great House Redoran', ranks: [{ index: 0, name: 'Hireling' }] }
  ];

  const joinable = joinableFactions(factions);
  assert.equal(joinable.length, 2);
  assert.deepEqual(joinable.map(f => f.key), ['mages guild', 'redoran']);
  assert.deepEqual(joinableFactions([]), []);
  assert.deepEqual(joinableFactions(null), []);
});

test('meetsRank evaluates canonical FADT promotion rules accurately', async () => {
  const { meetsRank } = await import('../lib/faction-math.mjs');

  const magesGuild = {
    key: 'mages guild',
    name: 'Mages Guild',
    favouredAttributes: ['intelligence', 'willpower'],
    skills: ['alchemy', 'mysticism', 'illusion', 'alteration', 'destruction', 'enchant'],
    ranks: [
      { index: 0, name: 'Associate', attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: 'Apprentice', attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 4, name: 'Conjurer', attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 30 }
    ]
  };

  const charConjurer = {
    attributes: { intelligence: 35, willpower: 32 },
    skills: { alchemy: 45, mysticism: 15, illusion: 12, alteration: 5 },
    factionReputation: 35
  };

  // Meets Conjurer (Rank 4)
  assert.equal(meetsRank(magesGuild, 4, charConjurer), true);

  // Fails on attribute 1 (intelligence < 30)
  const charLowInt = {
    ...charConjurer,
    attributes: { intelligence: 29, willpower: 35 }
  };
  assert.equal(meetsRank(magesGuild, 4, charLowInt), false);

  // Fails on attribute 2 (willpower < 30)
  const charLowWil = {
    ...charConjurer,
    attributes: { intelligence: 35, willpower: 28 }
  };
  assert.equal(meetsRank(magesGuild, 4, charLowWil), false);

  // Fails on primary skill (no faction skill >= 40)
  const charLowPrimary = {
    ...charConjurer,
    skills: { alchemy: 39, mysticism: 39, illusion: 39 }
  };
  assert.equal(meetsRank(magesGuild, 4, charLowPrimary), false);

  // Fails on favoured skill (has 45 primary, but only 1 other skill >= 10, needs 2 more >= 10)
  const charOneFavoured = {
    ...charConjurer,
    skills: { alchemy: 45, mysticism: 15, illusion: 8, alteration: 5 }
  };
  assert.equal(meetsRank(magesGuild, 4, charOneFavoured), false);

  // Fails on reputation
  const charLowRep = {
    ...charConjurer,
    factionReputation: 29
  };
  assert.equal(meetsRank(magesGuild, 4, charLowRep), false);

  // Rank that does not exist returns null
  assert.equal(meetsRank(magesGuild, 99, charConjurer), null);
});

test('solvePromotionGaps diagnoses exact deficits and recommendations', async () => {
  const { solvePromotionGaps, getHighestEligibleRank } = await import('../lib/faction-math.mjs');

  const fightersGuild = {
    key: 'fighters guild',
    name: 'Fighters Guild',
    favouredAttributes: ['strength', 'endurance'],
    skills: ['axe', 'long_blade', 'blunt_weapon', 'heavy_armor', 'armorer', 'block'],
    ranks: [
      { index: 0, name: 'Associate', attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: 'Apprentice', attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: 'Journeyman', attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: 'Swordsman', attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 }
    ]
  };

  const char = {
    attributes: { strength: 30, endurance: 30 }, // meets rank 1 (30/30), fails rank 5 (31/31)
    skills: { long_blade: 25, block: 10, armorer: 4 }, // primary deficit for swordsman (req 30, lb is 25: +5), fav2 deficit (armorer is 4, req 5: +1)
    factionReputation: 15 // rep deficit for swordsman (req 20, has 15: +5)
  };

  // Highest eligible rank with current stats is Apprentice (Rank 1; Journeyman needs primary 20 and rep 10, wait char has lb 25 and rep 15 so char meets Journeyman Rank 2!)
  // In fact: Rank 2 requires 30/30, primary 20, rep 10. Char has 30/30, lb 25 >= 20, rep 15 >= 10. So char meets Rank 2!
  assert.equal(getHighestEligibleRank(fightersGuild, char), 2);

  // Solve gap for Swordsman (Rank 3)
  const gaps = solvePromotionGaps(fightersGuild, 2, char, 3);
  assert.equal(gaps.eligible, false);
  assert.equal(gaps.isMaxRank, false);
  assert.equal(gaps.targetRank.name, 'Swordsman');

  // Verify attribute gaps (attrs are 30/30, Swordsman requires 30/30 so met is true)
  assert.equal(gaps.attributes.every(a => a.met), true);

  // Verify skill gaps
  assert.equal(gaps.skills.primary.gap, 5);
  assert.equal(gaps.skills.primary.met, false);
  assert.equal(gaps.skills.favoured[1].gap, 1);
  assert.equal(gaps.skills.favoured[1].met, false);

  // Verify reputation gap
  assert.equal(gaps.reputation.gap, 5);
  assert.equal(gaps.reputation.met, false);

  assert.ok(gaps.deficits.length >= 3);

  // Solve for max rank reached
  const maxRankSolver = solvePromotionGaps(fightersGuild, 3, char, 4);
  assert.equal(maxRankSolver.isMaxRank, true);
  assert.equal(maxRankSolver.deficits[0], 'Already reached highest achievable rank.');
});

test('getMutualExclusionConflict identifies Great House and Vampire locks', async () => {
  const { getMutualExclusionConflict } = await import('../lib/faction-math.mjs');

  // Great Houses: Hlaalu vs Redoran vs Telvanni
  const conflictRedoran = getMutualExclusionConflict('redoran', ['hlaalu', 'mages guild']);
  assert.ok(conflictRedoran);
  assert.equal(conflictRedoran.category, 'Great House');
  assert.equal(conflictRedoran.rival, 'hlaalu');

  // Vampire Clans: Aundae vs Berne vs Quarra
  const conflictClan = getMutualExclusionConflict('clan berne', ['clan aundae']);
  assert.ok(conflictClan);
  assert.equal(conflictClan.category, 'Vampire Clan');
  assert.equal(conflictClan.rival, 'clan aundae');

  // No conflict for non-exclusive guilds
  assert.equal(getMutualExclusionConflict('fighters guild', ['mages guild', 'thieves guild']), null);
  assert.equal(getMutualExclusionConflict('hlaalu', ['mages guild', 'imperial legion']), null);
});

test('getFactionReactions and getFactionQuests organize diplomacy and linked quests', async () => {
  const { getFactionReactions, getFactionQuests } = await import('../lib/faction-math.mjs');

  const testFaction = {
    key: 'mages guild',
    reactions: [
      { faction: 'imperial cult', adjustment: 1 },
      { faction: 'thieves guild', adjustment: 1 },
      { faction: 'telvanni', adjustment: -3 },
      { faction: 'morag tong', adjustment: 0 }
    ]
  };

  const { allies, hostile, neutral } = getFactionReactions(testFaction);
  assert.equal(allies.length, 2);
  assert.equal(hostile.length, 1);
  assert.equal(neutral.length, 1);
  assert.equal(hostile[0].faction, 'telvanni');
  assert.equal(hostile[0].adjustment, -3);

  // Quest matching
  const questCatalog = {
    records: [
      { key: 'mg_flowers', name: 'Mages Guild: Four Types of Flowers', trackable: true, stages: [10, 50, 100], finishesAt: [100] },
      { key: 'mg_bowl', name: 'Mages Guild: Ceramic Bowl', trackable: true, stages: [10, 100], finishesAt: [100] },
      { key: 'fg_rathunt', name: 'Fighters Guild: Exterminator', trackable: true, stages: [10, 100], finishesAt: [100] }
    ]
  };

  const saveQuests = [
    { id: 'mg_flowers', stage: 100, finished: true },
    { id: 'mg_bowl', stage: 10, finished: false }
  ];

  const matched = getFactionQuests('mages guild', questCatalog, saveQuests);
  assert.equal(matched.length, 2);
  assert.equal(matched[0].key, 'mg_flowers');
  assert.equal(matched[0].progress.status, 'finished');
  assert.equal(matched[1].key, 'mg_bowl');
  assert.equal(matched[1].progress.status, 'active');
});

test('Adversarial edge cases: extreme stats, corrupted records, empty ranks', async () => {
  const { meetsRank, solvePromotionGaps, getHighestEligibleRank, getStatValue } = await import('../lib/faction-math.mjs');

  // Adversarial Case 1: Corrupted or null faction record
  assert.equal(meetsRank(null, 0, {}), null);
  assert.equal(meetsRank({ key: 'empty' }, 0, {}), null);
  assert.equal(getHighestEligibleRank(null, {}), -1);
  assert.equal(solvePromotionGaps(null, 0, {}).isValid, false);

  // Adversarial Case 2: Zero stats and negative reputation
  const emptyFaction = {
    key: 'test',
    favouredAttributes: ['strength', 'intelligence'],
    skills: ['axe', 'alchemy', 'long_blade'],
    ranks: [{ index: 0, name: 'Rank0', attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 5, reputation: 0 }]
  };
  const zeroChar = {
    attributes: {},
    skills: {},
    factionReputation: -50
  };
  assert.equal(meetsRank(emptyFaction, 0, zeroChar), false);
  const zeroGaps = solvePromotionGaps(emptyFaction, -1, zeroChar, 0);
  assert.equal(zeroGaps.eligible, false);
  assert.equal(zeroGaps.reputation.gap, 50); // Need +50 to reach 0 from -50

  // Adversarial Case 3: Max level character (all 100s)
  const godChar = {
    attributes: { strength: 100, intelligence: 100, willpower: 100, agility: 100, speed: 100, endurance: 100, personality: 100, luck: 100 },
    skills: Object.fromEntries(['axe', 'alchemy', 'long_blade'].map(s => [s, 100])),
    factionReputation: 200
  };
  assert.equal(meetsRank(emptyFaction, 0, godChar), true);
  assert.equal(getHighestEligibleRank(emptyFaction, godChar), 0);

  // Adversarial Case 4: Missing skill array or single skill
  const oneSkillFaction = {
    key: 'minimal',
    favouredAttributes: ['strength'],
    skills: ['axe'], // only 1 skill, but needs 3 skills for ranks requiring primary + 2 favoured!
    ranks: [{ index: 0, name: 'Min', attribute1: 30, attribute2: 0, primarySkill: 10, favouredSkill: 5, reputation: 0 }]
  };
  // Since character only has 1 skill, second and third skills are 0 < 5, so cannot meet favoured requirements
  assert.equal(meetsRank(oneSkillFaction, 0, godChar), false);
  const oneSkillGaps = solvePromotionGaps(oneSkillFaction, -1, godChar, 0);
  assert.equal(oneSkillGaps.eligible, false);
});
