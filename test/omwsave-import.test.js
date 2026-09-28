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

test('a picked or dropped file is read by its kind: .omwsave parsed, .json checked, .ess refused', async () => {
  const { File } = require('node:buffer');
  const { readSaveFile } = await importer;
  const parsed = await readSaveFile(new File([saveFile()], 'Tester.OMWSAVE'));
  assert.equal(parsed.identity.class.name, 'Tom Catess');
  const converted = await readSaveFile(new File([JSON.stringify(parsed)], 'tester.json'));
  assert.equal(converted.identity.gender, 'Female');
  // A Morrowind.exe save starts with the same TES3 header, so only its name tells them apart.
  await assert.rejects(readSaveFile(new File([saveFile()], 'quick.ess')), /Morrowind\.exe save/);
  await assert.rejects(readSaveFile(new File(['{"a":1}'], 'notes.json')), /not a converted OpenMW save/);
  await assert.rejects(readSaveFile(new File(['x'], 'save.zip')), /ending in \.omwsave/);
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
  // No favoured attributes means the extension is exactly three bytes: gender, spec, count;
  // no position means the position extension after it is one flag byte, and no
  // player-made items the one after that one count byte.
  const save = parsedSave({ identity: { class: { id: 'x', name: null, custom: false, specialization: 'Magic', favoredAttributes: [] } } });
  const full = serializeOmwSave(save);
  const old = deserializeOmwSave(full.subarray(0, full.length - 5));
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

test('the parser reads where the player stands and the last exterior position', async () => {
  const { parseOmwSave } = await parser;
  const f32s = (...values) => { const b = Buffer.alloc(4 * values.length); values.forEach((v, i) => b.writeFloatLE(v, 4 * i)); return b; };
  const withPlay = Buffer.concat([saveFile(), rec('PLAY', [sub('POS_', f32s(3979.5, 4408.25, 14485.75, 0, 0, 1)),
                                                          sub('LKEP', f32s(53998.5, -141929, 2082.25))])]);
  const { identity } = parseOmwSave(withPlay);
  assert.deepEqual(identity.position, [3979.5, 4408.25, 14485.75]);
  assert.deepEqual(identity.lastExteriorPosition, [53998.5, -141929, 2082.25]);
  const bare = parseOmwSave(saveFile()).identity;
  assert.equal(bare.position, null, 'no player record, no position');
  assert.equal(bare.lastExteriorPosition, null);
  const short = parseOmwSave(Buffer.concat([saveFile(), rec('PLAY', [sub('POS_', f32s(1, 2))])])).identity;
  assert.equal(short.position, null, 'a truncated position is not guessed at');
});

test('the codec carries where the player stands, and older payloads read it as unknown', async () => {
  const { serializeOmwSave, deserializeOmwSave } = await codec;
  const at = parsedSave({ identity: { position: [3979.66, 4408.77, 14485.88], lastExteriorPosition: [53998.4, -141929.08, 2082.33] } });
  const back = deserializeOmwSave(serializeOmwSave(at));
  assert.deepEqual(back.identity.position, [3979.66, 4408.77, 14485.88]);
  assert.deepEqual(back.identity.lastExteriorPosition, [53998.4, -141929.08, 2082.33]);
  const outside = deserializeOmwSave(serializeOmwSave(parsedSave({ identity: { position: [1.5, 2.5, 3.5] } })));
  assert.deepEqual(outside.identity.position, [1.5, 2.5, 3.5]);
  assert.equal('lastExteriorPosition' in outside.identity, false, 'only what the save had');
  const garbage = deserializeOmwSave(serializeOmwSave(parsedSave({ identity: { position: [NaN, 1, 2], lastExteriorPosition: [1, 2] } })));
  assert.equal('position' in garbage.identity || 'lastExteriorPosition' in garbage.identity, false, 'nothing unreadable is stored');
  const full = serializeOmwSave(parsedSave());
  // No positions and no player-made items: section 10 is one flag byte, section 11 one count.
  const before = deserializeOmwSave(full.subarray(0, full.length - 2));
  assert.equal('position' in before.identity, false, 'a payload written before the position extension');
  assert.equal(before.identity.name, 'Tester');
});

/* ---- Player-made items: dynamic ENCH and item records in the save ---- */
function enam(effectId, min, max = min) {
  const b = Buffer.alloc(24);
  b.writeInt16LE(effectId, 0); b.writeInt8(-1, 2); b.writeInt8(-1, 3);
  b.writeInt32LE(0, 4); b.writeInt32LE(0, 8); b.writeInt32LE(0, 12);
  b.writeInt32LE(min, 16); b.writeInt32LE(max, 20);
  return b;
}
function endt(type) { const b = Buffer.alloc(16); b.writeInt32LE(type, 0); return b; }
function createdSave() {
  const ctdt = Buffer.alloc(12); ctdt.writeInt32LE(8, 0); ctdt.writeFloatLE(0.5, 4); // a ring
  const aodt = Buffer.alloc(24); aodt.writeInt32LE(1, 0); aodt.writeFloatLE(15.5, 4);
  const wpdt = Buffer.alloc(32); wpdt.writeFloatLE(42, 0);
  return Buffer.concat([
    saveFile(),
    rec('ENCH', [sub('NAME', generated(900)), sub('ENDT', endt(3)), sub('ENAM', enam(10, 20, 30)), sub('ENAM', enam(2, 1))]),
    rec('ENCH', [sub('NAME', generated(901)), sub('ENDT', endt(1)), sub('ENAM', enam(14, 10))]),
    rec('CLOT', [sub('NAME', generated(1)), sub('FNAM', text('Ring of Striding')), sub('CTDT', ctdt), sub('ENAM', generated(900))]),
    rec('ARMO', [sub('NAME', generated(2)), sub('FNAM', text('Heavy Boots')), sub('AODT', aodt)]),
    rec('WEAP', [sub('NAME', generated(3)), sub('FNAM', text('Daedric Spear')), sub('WPDT', wpdt), sub('ENAM', generated(901))]),
    rec('CLOT', [sub('NAME', generated(4)), sub('FNAM', text('Sold Long Ago')), sub('CTDT', ctdt), sub('ENAM', generated(900))])
  ]);
}

test('the parser reads the player-made items held: weight, and the effects of a constant enchantment', async () => {
  const { parseCreatedItems } = await parser;
  const items = parseCreatedItems(createdSave(), ['$generated:1', '$GENERATED:2', '$generated:3']);
  assert.deepEqual(items.map((i) => [i.id, i.kind, i.name, i.weight]), [
    ['$generated:1', 'CLOT', 'Ring of Striding', 0.5],
    ['$generated:2', 'ARMO', 'Heavy Boots', 15.5],
    ['$generated:3', 'WEAP', 'Daedric Spear', 42]]);
  assert.deepEqual(items[0].constant, [{ effectId: 10, magnitude: 20 }, { effectId: 2, magnitude: 1 }],
    'Levitate at its low end, and Water Walking');
  assert.deepEqual(items[1].constant, [], 'no enchantment');
  assert.deepEqual(items[2].constant, [], 'a cast-on-strike enchantment is not on while worn');
  assert.deepEqual(parseCreatedItems(createdSave(), []), [], 'items made but no longer held are left out');
  const { parseOmwSave } = await parser;
  assert.deepEqual(parseOmwSave(saveFile()).stuff.created, [], 'a save without a player record has none');
});

test('the codec carries the player-made items, and older payloads read none', async () => {
  const { serializeOmwSave, deserializeOmwSave } = await codec;
  const created = [
    { id: '$generated:1', kind: 'CLOT', name: 'Ring of Striding', weight: 0.5, constant: [{ effectId: 10, magnitude: 20 }, { effectId: 2, magnitude: 1 }] },
    { id: '$generated:2', kind: 'ARMO', name: 'Heavy Boots', weight: 15.5, constant: [] },
    { id: '$generated:3', kind: 'WEAP', name: null, weight: null, constant: [] }];
  const save = parsedSave();
  const back = deserializeOmwSave(serializeOmwSave({ ...save, stuff: { ...save.stuff, created } }));
  assert.deepEqual(back.stuff.created, created);
  assert.deepEqual(back.stuff.inventory, save.stuff.inventory, 'the inventory is untouched');
  const full = serializeOmwSave(save);
  assert.equal('created' in deserializeOmwSave(full).stuff, false, 'none held, none stored');
  const older = deserializeOmwSave(full.subarray(0, full.length - 1));
  assert.equal('created' in older.stuff, false, 'a payload written before section 11');
  assert.equal(older.identity.name, 'Tester');
  const odd = deserializeOmwSave(serializeOmwSave({ ...save, stuff: { ...save.stuff, created: [
    { id: '', kind: 'CLOT' }, null, { id: '$generated:9', constant: [{ effectId: -1, magnitude: 5 }, { effectId: 8, magnitude: -3 }] }] } }));
  assert.deepEqual(odd.stuff.created, [{ id: '$generated:9', kind: null, name: null, weight: null, constant: [{ effectId: 8, magnitude: 0 }] }],
    'nameless entries dropped, a bad effect left out, a negative magnitude stored as none');
});
