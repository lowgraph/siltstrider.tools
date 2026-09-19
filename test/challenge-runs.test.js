const { test } = require('node:test');
const assert = require('node:assert/strict');

test('challenge-math: presets and bands integrity', async () => {
  const {
    DIFFICULTY_PRESETS,
    band,
    tagsOf,
    restrictionOkForNeeds,
    pickCompatibleRestrictions,
    POOL
  } = await import('../lib/challenge-math.mjs');

  assert.ok(DIFFICULTY_PRESETS.standard);
  assert.ok(DIFFICULTY_PRESETS.hardcore);
  assert.ok(DIFFICULTY_PRESETS.cursed);
  assert.ok(DIFFICULTY_PRESETS.custom);

  assert.equal(band('No Magicka'), 'Hard');
  assert.equal(band('No merchants except to pay for training'), 'Hard');
  assert.equal(band('Walk only — no running'), 'Grind');
  assert.equal(band('No custom class'), 'Easy');
});

test('challenge-math: conflict resolution prevents Reach level 50 with level caps', async () => {
  const {
    tagsOf,
    restrictionOkForNeeds,
    pickCompatibleRestrictions,
    POOL
  } = await import('../lib/challenge-math.mjs');

  const levelNeeds = tagsOf('Reach level 50');
  assert.deepEqual(levelNeeds, ['level']);

  assert.equal(restrictionOkForNeeds('Level 20 cap', levelNeeds), false);
  assert.equal(restrictionOkForNeeds('Level 10 cap', levelNeeds), false);
  assert.equal(restrictionOkForNeeds('Never sleep to level up — stay level 1', levelNeeds), false);

  const picked = pickCompatibleRestrictions(5, POOL, levelNeeds);
  for (const r of picked) {
    assert.ok(!/level 20 cap|level 10 cap|stay level 1/i.test(r), `rolled ${r} under Reach level 50`);
  }
});

test('challenge-math: mutually conflicting restrictions do not clash or roll together', async () => {
  const { restrictionsClash } = await import('../lib/challenge-math.mjs');

  assert.ok(restrictionsClash('Permadeath — one life', 'Ironman — no quicksaving'));
  assert.ok(restrictionsClash('No melee', 'Fists only — Hand-to-hand'));
  assert.ok(restrictionsClash('No magic', 'No destruction'));
  assert.ok(restrictionsClash('Lawful — pay every bounty, never murder', 'Outlaw — never pay a bounty'));
});

test('challenge-math: deterministic RNG reproduces identical rolls', async () => {
  const { createRng, pickCompatibleRestrictions, POOL } = await import('../lib/challenge-math.mjs');

  const seed = 'SEED-4918-TR';
  const rng1 = createRng(seed);
  const rng2 = createRng(seed);

  const rolls1 = [rng1(), rng1(), rng1(), rng1()];
  const rolls2 = [rng2(), rng2(), rng2(), rng2()];
  assert.deepEqual(rolls1, rolls2);

  const rest1 = pickCompatibleRestrictions(3, POOL, [], rng1);
  const rest2 = pickCompatibleRestrictions(3, POOL, [], rng2);
  assert.deepEqual(rest1, rest2);
});

test('challenge-math: regionsIn extracts named places', async () => {
  const { regionsIn } = await import('../lib/challenge-math.mjs');

  const regions = regionsIn("Ride every silt strider route out of Balmora: Ald'ruhn, Seyda Neen, Suran and Vivec");
  assert.ok(regions.includes('West Gash')); // Balmora
  assert.ok(regions.includes('Ashlands')); // Ald'ruhn
  assert.ok(regions.includes('Bitter Coast')); // Seyda Neen
  assert.ok(regions.includes('Ascadian Isles')); // Suran, Vivec
});

test('challenge-math: formatRunMarkdown generates complete dossier', async () => {
  const { formatRunMarkdown } = await import('../lib/challenge-math.mjs');

  const md = formatRunMarkdown({
    race: 'Dunmer',
    gender: 'Female',
    cls: 'Assassin',
    sign: 'The Shadow',
    major: 'Complete the main quest',
    majorRegions: ['Red Mountain'],
    vitals: { health: 45, magicka: 30, fatigue: 160 },
    rests: ['No Magicka', 'Walk only — no running'],
    minors: ['Pickpocket someone successfully without being caught'],
    seed: 'SEED-9999-VANILLA'
  });

  assert.ok(md.includes('Dunmer'));
  assert.ok(md.includes('Complete the main quest'));
  assert.ok(md.includes('[Hard]'));
  assert.ok(md.includes('SEED-9999-VANILLA'));
});
