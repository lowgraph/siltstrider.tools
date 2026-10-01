const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader, save } = require('./helpers/qa-staged-data.cjs');

const modules = Promise.all([
  import('../lib/save-share-link.mjs'), import('../lib/permalink-codec.mjs'),
  import('../lib/challenge-engine.mjs')
]);

test('QA-22 imported links resolve all three save profiles, independent of summary IDs', async () => {
  const [{ generateSaveShareUrl }, { decodeShareUrl }] = await modules;
  const data = await loader();
  for (const profile of ['vanilla', 'tr', 'tr_arce']) {
    const raw = save();
    raw.identity.name = 'QA – Link source';
    raw.identity.gender = 'Female'; raw.identity.birthsign = 'Hara';
    if (profile !== 'vanilla') raw.contentFiles.push('Tamriel_Data.esm', 'TR_Mainland.esm');
    if (profile === 'tr_arce') {
      raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
      raw.identity.race = 'T_Els_Cathay-raht';
    }
    const before = JSON.stringify(raw);
    const decoded = decodeShareUrl(await generateSaveShareUrl(raw, data, 'https://example.invalid'));
    assert.equal(decoded.profile, profile);
    assert.equal(decoded.build.gender, 'Female');
    assert.equal(decoded.build.sign, 'The Thief');
    assert.equal(decoded.build.className, 'Mage');
    assert.equal(decoded.build.name, raw.identity.name);
    assert.equal(decoded.build.maj.length, 5); assert.equal(decoded.build.min.length, 5);
    assert.equal(JSON.stringify(raw), before, 'sharing does not mutate the save');
  }
});

test('QA-22 a custom class link uses its saved skill groups and attributes', async () => {
  const [{ generateSaveShareUrl }, { decodeShareUrl }] = await modules;
  const raw = save();
  raw.identity.class = { custom: true, specialization: 'Stealth', favoredAttributes: ['Agility', 'Luck'] };
  raw.build.skills.forEach((skill, index) => { skill.kind = index < 5 ? 'Major' : index < 10 ? 'Minor' : 'Misc'; });
  const decoded = decodeShareUrl(await generateSaveShareUrl(raw, await loader()));
  assert.deepEqual([decoded.build.className, decoded.build.spec, decoded.build.fav1, decoded.build.fav2], ['Custom', 'Stealth', 'Agility', 'Luck']);
  assert.deepEqual(decoded.build.maj, ['Block', 'Armorer', 'Medium Armor', 'Heavy Armor', 'Blunt Weapon']);
  assert.deepEqual(decoded.build.min, ['Long Blade', 'Axe', 'Spear', 'Athletics', 'Enchant']);
});

test('QA-22 unresolved identities and incomplete custom classes cannot publish replacement defaults', async () => {
  const [{ generateSaveShareUrl }] = await modules;
  const data = await loader();
  for (const change of [
    raw => { raw.identity.race = 'unpublished mod race'; },
    raw => { raw.identity.birthsign = 'unknown sign'; },
    raw => { raw.identity.gender = null; },
    raw => { raw.identity.class.id = 'unknown class'; },
    raw => { raw.identity.class = { custom: true, specialization: 'Magic', favoredAttributes: ['Intelligence'] }; }
  ]) {
    const raw = save(); change(raw);
    await assert.rejects(generateSaveShareUrl(raw, data), /Cannot share this save.*could not be resolved/);
  }
});

test('QA-22 malformed saves and unavailable catalogs fail without a permalink', async () => {
  const [{ generateSaveShareUrl }] = await modules;
  await assert.rejects(generateSaveShareUrl({ identity: {}, stuff: {}, build: { skills: 'bad' } }, await loader()), /Invalid OpenMW save/);
  await assert.rejects(generateSaveShareUrl(save(), {
    loadFeature: async () => { throw Error('QA offline'); }, loadCatalog: async () => []
  }), /QA offline/);
});

test('QA-22 duplicate custom skills and favored attributes cannot produce a broken recipient', async () => {
  const [{ generateSaveShareUrl }] = await modules;
  const data = await loader();
  for (const duplicate of ['skills', 'attributes']) {
    const raw = save();
    raw.identity.class = { custom: true, specialization: 'Magic', favoredAttributes: ['Intelligence', 'Willpower'] };
    raw.build.skills.forEach((skill, index) => { skill.kind = index < 5 ? 'Major' : index < 10 ? 'Minor' : 'Misc'; });
    if (duplicate === 'skills') raw.build.skills[1].id = raw.build.skills[0].id;
    else raw.identity.class.favoredAttributes = ['Intelligence', 'Intelligence'];
    await assert.rejects(generateSaveShareUrl(raw, data), /ten distinct skills and two different favored attributes/);
  }
});

test('QA-22 challenge run profiles survive link sanitizing, old seeds and visitor world changes', async () => {
  const [, { encodeShareUrl, decodeShareUrl }, { generateSeededRun, formatRunSeed, sanitizeRun, profileForRun }] = await modules;
  for (const profile of ['vanilla', 'tr', 'tr_arce']) {
    const seed = formatRunSeed({ code: 'QA222', profile, allowedBands: { Easy: true }, restrictionCount: 1, objectiveCount: 1 });
    const run = generateSeededRun(seed, { world: profile === 'vanilla' ? 'vanilla' : 'tr' }).run;
    assert.equal(run.profile, profile);
    const linked = sanitizeRun(JSON.parse(JSON.stringify(run)));
    const decoded = decodeShareUrl(encodeShareUrl({ view: 'challenge', ...profileForRun(linked, { profile: 'vanilla' }), run: linked }));
    assert.equal(decoded.profile, profile); assert.equal(decoded.run.seed, seed);
    delete linked.profile;
    assert.equal(profileForRun(linked, { profile: 'tr' }).profile, profile, 'legacy seeded run owns its world');
  }
});

test('QA-22 legacy seedless runs use their captured link world and reject invalid metadata', async () => {
  const [, , { sanitizeRun, profileForRun }] = await modules;
  const run = sanitizeRun({ race: 'Nord', profile: 'tr_arce', seedExact: false, rests: ['No potions'] });
  assert.equal(profileForRun(run, { profile: 'vanilla' }).profile, 'tr_arce');
  assert.equal(run.seedExact, false); assert.deepEqual(run.rests, ['No potions']);
  const bad = sanitizeRun({ race: 'Nord', profile: 'constructor', seed: 'broken' });
  assert.equal(bad.profile, undefined);
  assert.equal(profileForRun(bad, { world: 'tr', arce: true }).profile, 'tr_arce');
});
