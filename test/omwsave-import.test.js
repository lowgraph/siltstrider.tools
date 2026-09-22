const { test } = require('node:test');
const assert = require('node:assert/strict');

const parser = import('../lib/omwsave-parser.mjs');
const codec = import('../lib/cloud-save-codec.mjs');
const importer = import('../lib/omwsave-import.mjs');
const characters = import('../lib/character-catalogs.mjs');
const levels = import('../lib/level-math.mjs');

/* ---- A synthetic .omwsave, format 37 like the real modded corpus, no real data ---- */
const sub = (tag, bytes) => {
  const b = Buffer.alloc(8 + bytes.length);
  b.write(tag, 0, 'latin1');
  b.writeUInt32LE(bytes.length, 4);
  Buffer.from(bytes).copy(b, 8);
  return b;
};
const rec = (tag, subs) => {
  const body = Buffer.concat(subs);
  const head = Buffer.alloc(16);
  head.write(tag, 0, 'latin1');
  head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
};
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
const i32 = (n) => { const b = Buffer.alloc(4); b.writeInt32LE(n); return b; };
const text = (s) => Buffer.from(s, 'latin1');
const refId = (s) => Buffer.concat([Buffer.from([2]), text(s)]); // UnsizedString
const generated = (n) => { const b = Buffer.alloc(9); b[0] = 4; b.writeBigUInt64LE(BigInt(n), 1); return b; };

function saveFile({ flags = 9, spec = 0, favoured = [5, 3], custom = true } = {}) {
  const npc = [sub('NAME', refId('player')), sub('RNAM', refId('Khajiit')),
    sub('CNAM', custom ? generated(51) : refId('Warrior'))];
  if (flags !== null) npc.push(sub('FLAG', u32(flags)));
  const cldt = Buffer.alloc(60);
  cldt.writeInt32LE(favoured[0], 0);
  cldt.writeInt32LE(favoured[1], 4);
  cldt.writeInt32LE(spec, 8);
  [7, 8, 11, 17, 20].forEach((major, k) => cldt.writeInt32LE(major, 16 + k * 8));
  [14, 15, 16, 24, 25].forEach((minor, k) => cldt.writeInt32LE(minor, 12 + k * 8));
  return Buffer.concat([
    rec('TES3', [sub('FORM', u32(37))]),
    rec('SAVE', [sub('PLNA', text('Tester')), sub('PLLE', i32(1)), sub('DEPE', text('Morrowind.esm'))]),
    rec('NPC_', npc),
    ...(custom ? [rec('CLAS', [sub('NAME', generated(51)), sub('FNAM', text('Tom Catess')), sub('CLDT', cldt)])] : [])
  ]);
}

test('the parser reads gender from the player record, female and male alike', async () => {
  const { parseOmwSave } = await parser;
  assert.equal(parseOmwSave(saveFile({ flags: 9 })).identity.gender, 'Female'); // Female | Base
  assert.equal(parseOmwSave(saveFile({ flags: 8 })).identity.gender, 'Male');
});

test('a save without the flag word leaves gender unknown instead of guessing male', async () => {
  const { parseOmwSave } = await parser;
  assert.equal(parseOmwSave(saveFile({ flags: null })).identity.gender, null);
});

test('a custom class keeps its specialization and favoured attributes', async () => {
  const { parseOmwSave } = await parser;
  const { class: cls } = parseOmwSave(saveFile({ spec: 2, favoured: [5, 3] })).identity;
  assert.equal(cls.name, 'Tom Catess');
  assert.equal(cls.specialization, 'Stealth');
  assert.deepEqual(cls.favoredAttributes, ['Endurance', 'Agility']);
});

test('a predefined class records only its id; its details come from the catalogs', async () => {
  const { parseOmwSave } = await parser;
  const { class: cls } = parseOmwSave(saveFile({ custom: false })).identity;
  assert.equal(cls.id, 'Warrior');
  assert.equal(cls.specialization, null);
  assert.deepEqual(cls.favoredAttributes, []);
});

/* ---- The codec carries the new fields, and reads payloads written before them ---- */
const SKILLS = ['Block', 'Armorer', 'MediumArmor', 'HeavyArmor', 'BluntWeapon', 'LongBlade', 'Axe', 'Spear',
  'Athletics', 'Enchant', 'Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism', 'Restoration',
  'Alchemy', 'Unarmored', 'Security', 'Sneak', 'Acrobatics', 'LightArmor', 'ShortBlade', 'Marksman',
  'Mercantile', 'Speechcraft', 'HandToHand'];
const ATTRS = ['Strength', 'Intelligence', 'Willpower', 'Agility', 'Speed', 'Endurance', 'Personality', 'Luck'];
const MAJORS = ['Spear', 'Athletics', 'Alteration', 'Unarmored', 'Acrobatics'];
const MINORS = ['Mysticism', 'Restoration', 'Alchemy', 'Mercantile', 'Speechcraft'];

function parsedSave(overrides = {}) {
  const base = { Strength: 42, Intelligence: 44, Willpower: 37, Agility: 47, Speed: 51, Endurance: 47, Personality: 39, Luck: 50 };
  const save = {
    formatVersion: 37,
    contentFiles: ['Morrowind.esm', 'Tribunal.esm', 'Bloodmoon.esm', 'Tamriel_Data.esm', 'TR_Mainland.esm', 'SomeMod.esp'],
    identity: {
      name: 'Tester', race: 'Khajiit', gender: 'Female', birthsign: 'Hara', level: 4, cell: 'Caldera',
      class: { id: '$generated:51', name: 'Tom Catess', custom: true, specialization: 'Combat',
        favoredAttributes: ['Endurance', 'Agility'] }
    },
    vitals: { health: { current: 49, max: 49 }, magicka: { current: 44, max: 44 },
      fatigue: { current: 173, max: 173 }, gold: 0, reputation: 0, bounty: 0, timePlayedSeconds: 10 },
    build: {
      skillKindSource: 'save-class-record',
      skills: SKILLS.map((id, index) => ({ id, index, base: 10 + index, modifier: 0, damage: 0, value: 10 + index,
        progress: 0, kind: MAJORS.includes(id) ? 'Major' : MINORS.includes(id) ? 'Minor' : 'Misc' })),
      attributes: ATTRS.map((id, index) => ({ id, index, base: base[id], modifier: 0, damage: 0, value: base[id] }))
    },
    progress: { quests: [], otherJournalIds: [], factions: [] },
    stuff: {
      inventory: [
        { id: 'devil spear', count: 1, soul: null, equipped: true, slot: 'CarriedRight' },
        { id: 'common_pants_05', count: 1, soul: null, equipped: true, slot: 'Pants' },
        { id: 'NOD_WAR_MISC_SKIRT04a', count: 1, soul: null, equipped: true, slot: 'Skirt' },
        { id: 'common_shirt_01', count: 1, soul: null, equipped: false, slot: null }
      ],
      spells: []
    },
    warnings: []
  };
  return { ...save, ...overrides, identity: { ...save.identity, ...(overrides.identity || {}) } };
}

test('the codec round-trips gender, specialization and favoured attributes', async () => {
  const { packCloudSave, unpackCloudSave, SAVE_TYPES } = await codec;
  const back = unpackCloudSave(packCloudSave(SAVE_TYPES.OPENMW_SAVE, parsedSave()).packed).data;
  assert.equal(back.identity.gender, 'Female');
  assert.equal(back.identity.class.specialization, 'Combat');
  assert.deepEqual(back.identity.class.favoredAttributes, ['Endurance', 'Agility']);
});

test('a payload stored before the identity extension still decodes, with it unknown', async () => {
  const { serializeOmwSave, deserializeOmwSave } = await codec;
  // No favoured attributes means the extension is exactly three bytes: gender, spec, count.
  const save = parsedSave({ identity: { class: { id: 'x', name: null, custom: false, specialization: 'Magic', favoredAttributes: [] } } });
  const full = serializeOmwSave(save);
  const old = deserializeOmwSave(full.subarray(0, full.length - 3));
  assert.equal(old.identity.gender, null);
  assert.equal(old.identity.class.specialization, null);
  assert.deepEqual(old.identity.class.favoredAttributes, []);
  assert.equal(old.identity.name, 'Tester', 'everything before the extension is intact');
});

test('an unrecognised gender or specialization is stored as unknown, not as a wrong value', async () => {
  const { serializeOmwSave, deserializeOmwSave } = await codec;
  const back = deserializeOmwSave(serializeOmwSave(parsedSave({ identity: { gender: 'Other',
    class: { id: 'x', custom: false, specialization: 'Sorcery', favoredAttributes: [] } } })));
  assert.equal(back.identity.gender, null);
  assert.equal(back.identity.class.specialization, null);
});

/* ---- Resolving a save against a profile's catalogs ---- */
const SPECS = ['combat', 'magic', 'stealth'];
async function catalogs() {
  const { adaptCharacterCatalogs } = await characters;
  const attribute = (male, female) => Object.fromEntries(ATTRS.map((a) => [a.toLowerCase(), { male, female }]));
  const slug = (id) => id.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  return adaptCharacterCatalogs({
    profile: 'tr',
    catalogs: {
      Attributes: ATTRS.map((name, index) => ({ id: name.toLowerCase(), index, name })),
      Skills: SKILLS.map((id, index) => ({ id: String(index), skill: slug(id), specialization: SPECS[Math.floor(index / 9)] })),
      Races: [
        { key: 'khajiit', id: 'Khajiit', name: 'Khajiit', playable: true, beast: true, attributes: attribute(40, 30),
          skillBonuses: [], spellIds: [], description: '' },
        { key: 'dark elf', id: 'Dark Elf', name: 'Dark Elf', playable: true, beast: false, attributes: attribute(40, 40),
          skillBonuses: [], spellIds: [], description: '' }
      ],
      Classes: [{ key: 'warrior', id: 'Warrior', name: 'Warrior', playable: true, specialization: 'combat',
        favoredAttributes: ['strength', 'endurance'],
        majorSkills: ['long_blade', 'medium_armor', 'heavy_armor', 'athletics', 'block'],
        minorSkills: ['armorer', 'spear', 'marksman', 'axe', 'blunt_weapon'] }],
      Birthsigns: [{ key: 'hara', id: 'Hara', name: 'The Thief', spellIds: [], description: '' },
        { key: 'lady', id: 'Lady', name: 'The Lady', spellIds: [], description: '' }]
    }
  }, []);
}
const CURRENT = { race: 'Dark Elf', gender: 'Male', className: 'Custom', sign: 'The Lady', spec: 'Magic',
  fav1: 'Intelligence', fav2: 'Willpower', maj: ['Destruction', 'Alteration', 'Illusion', 'Conjuration', 'Mysticism'],
  min: ['Restoration', 'Alchemy', 'Enchant', 'Unarmored', 'Speechcraft'] };

test('the profile follows the content files: vanilla, Tamriel Rebuilt, and ARCE on top', async () => {
  const { profileForSave } = await importer;
  assert.equal(profileForSave({ contentFiles: ['Morrowind.esm'] }).profile, 'vanilla');
  assert.equal(profileForSave(parsedSave()).profile, 'tr');
  assert.equal(profileForSave({ contentFiles: ['TAMRIEL_DATA.ESM', 'tr_mainland.esm',
    'ARCE - All Races and Classes Enabled (Vanilla and Tamriel_Data).ESP'] }).profile, 'tr_arce');
  // ARCE without Tamriel Rebuilt is no TR profile.
  assert.equal(profileForSave({ contentFiles: ['Tamriel_Data.esm', 'ARCE - All Races and Classes Enabled.esp'] }).profile, 'vanilla');
});

test('a custom-class save becomes the builder labels, with nothing unresolved', async () => {
  const { buildFromSave } = await importer;
  const { build, unresolved } = buildFromSave(parsedSave(), await catalogs(), { current: CURRENT, profile: 'tr' });
  assert.deepEqual(unresolved, []);
  assert.equal(build.race, 'Khajiit');
  assert.equal(build.gender, 'Female');
  assert.equal(build.sign, 'The Thief', 'the record id Hara, as the builder names it');
  assert.equal(build.className, 'Custom');
  assert.deepEqual([build.spec, build.fav1, build.fav2], ['Combat', 'Endurance', 'Agility']);
  assert.deepEqual(build.maj, MAJORS);
  assert.deepEqual(build.min, MINORS);
  assert.deepEqual([build.world, build.arce], ['tr', false]);
});

test('skill ids map to labels by index, including the two the naive way gets wrong', async () => {
  const { buildFromSave } = await importer;
  const save = parsedSave();
  save.build.skills.forEach((s) => { s.kind = ['LongBlade', 'HandToHand', 'MediumArmor', 'LightArmor', 'ShortBlade'].includes(s.id) ? 'Major' : s.kind === 'Major' ? 'Misc' : s.kind; });
  const { build } = buildFromSave(save, await catalogs(), { current: CURRENT, profile: 'tr' });
  assert.deepEqual(build.maj, ['Medium Armor', 'Long Blade', 'Light Armor', 'Short Blade', 'Hand-to-hand']);
});

test('a predefined class takes its definition from the catalogs', async () => {
  const { buildFromSave } = await importer;
  const save = parsedSave({ identity: { class: { id: 'Warrior', name: null, custom: false, specialization: null, favoredAttributes: [] } } });
  const { build, unresolved } = buildFromSave(save, await catalogs(), { current: CURRENT, profile: 'tr' });
  assert.deepEqual(unresolved, []);
  assert.equal(build.className, 'Warrior');
  assert.deepEqual([build.spec, build.fav1, build.fav2], ['Combat', 'Strength', 'Endurance']);
  assert.deepEqual(build.maj, ['Long Blade', 'Medium Armor', 'Heavy Armor', 'Athletics', 'Block']);
});

test('what a mod adds keeps the current value and is listed, never a stand-in default', async () => {
  const { buildFromSave } = await importer;
  const save = parsedSave({ identity: { race: 'T_Mod_Lizardfolk', birthsign: 'mod_sign', gender: null,
    class: { id: 'mod_class', name: null, custom: false, specialization: null, favoredAttributes: [] } } });
  const { build, unresolved } = buildFromSave(save, await catalogs(), { current: CURRENT, profile: 'tr' });
  const fields = unresolved.map((u) => u.field);
  for (const field of ['race', 'sign', 'gender', 'className', 'skills']) assert.ok(fields.includes(field), field);
  assert.equal(build.race, 'Dark Elf');
  assert.equal(build.sign, 'The Lady');
  assert.deepEqual(build.maj, CURRENT.maj, 'the current choices, not a Warrior');
  assert.equal(unresolved.find((u) => u.field === 'race').value, 'T_Mod_Lizardfolk');
});

test('the Level Simulator starts from the save, and level-math accepts that sheet', async () => {
  const { buildFromSave, sheetFromSave } = await importer;
  const { normalizeCharacterState } = await levels;
  const catalogData = await catalogs();
  const save = parsedSave();
  const { build } = buildFromSave(save, catalogData, { current: CURRENT, profile: 'tr' });
  const state = normalizeCharacterState(sheetFromSave(save, catalogData, build), catalogData);
  assert.equal(state.level, 4);
  assert.equal(state.attributes.Strength, 42, 'the save value, not the chargen one');
  assert.equal(state.skills.Spear, 17, 'Spear is index 7, so its base is 10 + 7');
  assert.equal(state.health, 49);
  assert.deepEqual(state.maj, MAJORS);
});

test('the rules check measures fatigue always and starting values only at level 1', async () => {
  const { buildFromSave, rulesCheck } = await importer;
  const catalogData = await catalogs();
  const levelFour = parsedSave();
  const { build } = buildFromSave(levelFour, catalogData, { current: CURRENT, profile: 'tr' });
  assert.deepEqual(rulesCheck(levelFour, catalogData, build).differences, [],
    'fatigue 173 is exactly Str + Wil + Agi + End');
  assert.equal(rulesCheck(levelFour, catalogData, build).unchecked.length, 1);

  const modded = parsedSave({ identity: { level: 1 }, vitals: { ...parsedSave().vitals, fatigue: { current: 100, max: 100 } } });
  const { differences, unchecked } = rulesCheck(modded, catalogData, build);
  assert.deepEqual(unchecked, []);
  assert.ok(differences.some((d) => d.what === 'Maximum fatigue' && d.save === 100 && d.rules === 173));
  // Female Khajiit strength is 30 here; the save's 42 is a mod's doing.
  assert.ok(differences.some((d) => d.what === 'Strength' && d.save === 42 && d.rules === 30));
});

test('the worn loadout uses catalog records and lists what the profile does not have', async () => {
  const { loadoutFromSave } = await importer;
  const equipment = {
    Weapons: [{ key: 'devil spear', id: 'devil spear', name: 'Devil Spear', type: 'SP2H' }],
    Armor: [],
    Clothing: [{ key: 'common_pants_05', id: 'common_pants_05', name: 'Common Pants', type: 'pants' },
      { key: 'common_shirt_01', id: 'common_shirt_01', name: 'Common Shirt', type: 'shirt' }]
  };
  const { loadout, unresolved } = loadoutFromSave(parsedSave(), equipment);
  assert.deepEqual(Object.keys(loadout.items).sort(), ['CarriedRight', 'Pants']);
  assert.equal(loadout.items.CarriedRight.name, 'Devil Spear');
  assert.deepEqual(unresolved, [{ slot: 'Skirt', id: 'NOD_WAR_MISC_SKIRT04a' }]);
  assert.equal(loadout.name, 'Worn by Tester');
});
