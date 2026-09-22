const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

test('Cloud Save Codec (SLT1): Full fidelity round-trip for OpenMW save extracts', async () => {
  const {
    packCloudSave,
    unpackCloudSave,
    extractCloudSaveMetadata,
    SAVE_TYPES,
    SKILL_IDS,
    ATTRIBUTE_IDS,
    EQUIP_SLOTS
  } = await import('../lib/cloud-save-codec.mjs');

  const sampleSave = {
    formatVersion: 40,
    contentFiles: ['Morrowind.esm', 'Tribunal.esm', 'Bloodmoon.esm', 'Tamriel_Data.esm', 'TR_Mainland.esm'],
    identity: {
      name: 'Nerevarine Incarnate',
      race: 'Dark Elf',
      gender: 'Female',
      class: { id: 'Custom', name: 'Telvanni Battlemage', custom: true, specialization: 'Magic', favoredAttributes: ['Intelligence', 'Willpower'] },
      birthsign: 'The Lady',
      level: 28,
      cell: "Balmora, Caius Cosades' House"
    },
    vitals: {
      health: { current: 245.5, max: 260 },
      magicka: { current: 410, max: 410 },
      fatigue: { current: 310, max: 325 },
      gold: 148500,
      reputation: 45,
      bounty: 0,
      timePlayedSeconds: 184592.25
    },
    build: {
      skillKindSource: 'save-class-record',
      skills: SKILL_IDS.map((id, i) => {
        const base = 35 + (i * 2);
        const modifier = i % 4 === 0 ? 10 : 0;
        const damage = i === 5 ? 15 : 0;
        return {
          id,
          index: i,
          base,
          modifier,
          damage,
          value: base + modifier - damage,
          progress: Math.round(((i * 13) % 100) / 100 * 100) / 100,
          kind: i < 5 ? 'Major' : i < 10 ? 'Minor' : 'Misc'
        };
      }),
      attributes: ATTRIBUTE_IDS.map((id, i) => {
        const base = 60 + i * 5;
        const modifier = i === 0 ? 20 : 0;
        const damage = 0;
        return {
          id,
          index: i,
          base,
          modifier,
          damage,
          value: base + modifier - damage
        };
      })
    },
    progress: {
      quests: Array.from({ length: 80 }, (_, i) => ({
        id: `ms_quest_arc_${i}`,
        stage: (i * 10) % 110,
        finished: i % 2 === 0,
        status: i % 2 === 0 ? 'finished' : 'active'
      })).sort((a, b) => a.id.localeCompare(b.id)),
      otherJournalIds: Array.from({ length: 120 }, (_, i) => `topic_reference_${i}`).sort((a, b) => a.localeCompare(b)),
      factions: [
        { id: 'Blades', rank: 4, reputation: 18, expelled: false },
        { id: 'House Telvanni', rank: 7, reputation: 35, expelled: false },
        { id: 'Mages Guild', rank: 6, reputation: 28, expelled: false },
        { id: 'Thieves Guild', rank: 2, reputation: 5, expelled: true }
      ].sort((a, b) => a.id.localeCompare(b.id))
    },
    stuff: {
      inventory: Array.from({ length: 100 }, (_, i) => {
        const isEquipped = i < 12;
        const slot = isEquipped ? EQUIP_SLOTS[i % EQUIP_SLOTS.length] : null;
        return {
          id: `item_mw_${i % 50}`,
          count: i % 5 === 0 ? 25 : 1,
          soul: i === 7 ? 'golden saint' : null,
          equipped: slot !== null,
          slot
        };
      }).sort((a, b) => a.id.localeCompare(b.id) || (a.soul ?? '').localeCompare(b.soul ?? '') || (a.slot ?? '').localeCompare(b.slot ?? '')),
      spells: Array.from({ length: 40 }, (_, i) => `spell_tome_${i}`).sort((a, b) => a.localeCompare(b))
    },
    warnings: ['No PLAY record warning test']
  };

  const { packed, packedSize, uncompressedSize, payloadHash, encoding } = packCloudSave(SAVE_TYPES.OPENMW_SAVE, sampleSave);
  assert.equal(encoding, 'slt1_deflate');
  assert.ok(packedSize > 0);
  assert.ok(uncompressedSize > packedSize);
  assert.equal(payloadHash.length, 64);

  // Measure compression ratio vs formatted and minified JSON
  const minJson = JSON.stringify(sampleSave);
  const compressionRatio = packedSize / minJson.length;

  // Packed binary must achieve at least 85% compression vs minified JSON (typically > 95%)
  assert.ok(compressionRatio < 0.15, `Expected compression ratio < 15%, got ${(compressionRatio * 100).toFixed(1)}%`);

  // Unpack and verify 100% field equality
  const unpacked = unpackCloudSave(packed);
  assert.equal(unpacked.saveType, SAVE_TYPES.OPENMW_SAVE);
  assert.deepEqual(unpacked.data, sampleSave);

  // Metadata verification
  const meta = extractCloudSaveMetadata(SAVE_TYPES.OPENMW_SAVE, sampleSave, packed, uncompressedSize);
  assert.equal(meta.save_type, 'openmw_save');
  assert.equal(meta.name, 'Nerevarine Incarnate');
  assert.equal(meta.level, 28);
  assert.equal(meta.race, 'Dark Elf');
  assert.equal(meta.class_name, 'Telvanni Battlemage');
  assert.equal(meta.class_custom, 1);
  assert.equal(meta.birthsign, 'The Lady');
  assert.equal(meta.cell, "Balmora, Caius Cosades' House");
  assert.equal(meta.gold, 148500);
  assert.equal(meta.time_played_seconds, 184592.25);
  assert.equal(meta.quest_count, 80);
  assert.equal(meta.topic_count, 120);
  assert.equal(meta.item_count, 100);
  assert.equal(meta.spell_count, 40);
  assert.equal(meta.faction_count, 4);
  assert.equal(meta.packed_size, packedSize);
  assert.equal(meta.unpacked_size, uncompressedSize);
  assert.equal(meta.payload_hash, payloadHash);
});

test('Cloud Save Codec: Canonical Character Builder round-trip parity', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES } = await import('../lib/cloud-save-codec.mjs');

  const char = {
    version: 1,
    world: 'vanilla',
    arce: false,
    className: 'Custom',
    race: 'Dark Elf',
    gender: 'Male',
    sign: 'The Warrior',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Long Blade', 'Heavy Armor', 'Block', 'Armorer', 'Athletics'],
    min: ['Alchemy', 'Alteration', 'Mysticism', 'Restoration', 'Speechcraft']
  };

  const { packed, packedSize, uncompressedSize } = packCloudSave(SAVE_TYPES.CHARACTER_BUILD, char);
  const unpacked = unpackCloudSave(packed);
  assert.equal(unpacked.saveType, SAVE_TYPES.CHARACTER_BUILD);
  assert.deepEqual(unpacked.data, char);

  const meta = extractCloudSaveMetadata(SAVE_TYPES.CHARACTER_BUILD, char, packed, uncompressedSize);
  assert.equal(meta.save_type, 'character_build');
  assert.equal(meta.name, 'Custom');
  assert.equal(meta.race, 'Dark Elf');
  assert.equal(meta.class_custom, 1);
  assert.equal(meta.level, 1);
  assert.equal(meta.packed_size, packedSize);
  assert.equal(meta.unpacked_size, uncompressedSize);
});

test('Cloud Save Codec: Challenge Run round-trip parity', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES } = await import('../lib/cloud-save-codec.mjs');

  const challenge = {
    version: 1,
    character: {
      version: 1,
      world: 'tr',
      arce: true,
      className: 'Farmer',
      race: 'Naga',
      gender: 'Female',
      sign: 'The Steed',
      spec: 'Stealth',
      fav1: 'Speed',
      fav2: 'Agility',
      maj: ['Spear', 'Athletics', 'Unarmored', 'Alchemy', 'Security'],
      min: ['Short Blade', 'Sneak', 'Acrobatics', 'Mercantile', 'Speechcraft']
    },
    rolled: { race: true, gender: true, className: true, sign: false },
    major: 'Complete the Main Quest of Morrowind without using fast travel.',
    minors: ['Collect 50,000 gold without bartering with Creeper or the Mudcrab Merchant', 'Become Patriarch of the Tribunal Temple'],
    restrictions: ['No Potions in Combat', 'No Training by Merchants']
  };

  const { packed, packedSize, uncompressedSize } = packCloudSave(SAVE_TYPES.CHALLENGE_RUN, challenge);
  const unpacked = unpackCloudSave(packed);
  assert.equal(unpacked.saveType, SAVE_TYPES.CHALLENGE_RUN);
  assert.deepEqual(unpacked.data, challenge);

  const meta = extractCloudSaveMetadata(SAVE_TYPES.CHALLENGE_RUN, challenge, packed, uncompressedSize);
  assert.equal(meta.save_type, 'challenge_run');
  assert.equal(meta.name, 'Challenge Run');
  assert.equal(meta.race, 'Naga');
  assert.equal(meta.class_name, 'Farmer');
  assert.equal(meta.class_custom, 0);
  assert.equal(meta.quest_count, 2);
  assert.equal(meta.packed_size, packedSize);
  assert.equal(meta.unpacked_size, uncompressedSize);
});

test('Cloud Save Codec: Custom Loadout round-trip parity and metadata', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES, validateCustomLoadout } = await import('../lib/cloud-save-codec.mjs');

  const loadout = {
    version: 1,
    name: 'Telvanni Archmagister War Kit',
    world: 'vanilla',
    description: 'Enchanted glass cuirass and daedric staff for fast clearing',
    items: [
      { id: 'glass_helm', slot: 'Helmet', soul: null, count: 1 },
      { id: 'glass_cuirass', slot: 'Cuirass', soul: null, count: 1 },
      { id: 'daedric_staff', slot: 'CarriedRight', soul: 'golden saint', count: 1 },
      { id: 'ring_suran', slot: 'LeftRing', soul: null, count: 1 },
      { id: 'ring_marandus', slot: 'RightRing', soul: null, count: 1 },
      { id: 'custom_mantle', slot: 'CustomCapeSlot', soul: null, count: 1 }
    ]
  };

  assert.ok(validateCustomLoadout(loadout));

  const { packed, packedSize, uncompressedSize, encoding } = packCloudSave(SAVE_TYPES.CUSTOM_LOADOUT, loadout);
  assert.equal(encoding, 'slt1_deflate');
  assert.ok(packedSize > 0);

  const unpacked = unpackCloudSave(packed);
  assert.equal(unpacked.saveType, SAVE_TYPES.CUSTOM_LOADOUT);
  assert.deepEqual(unpacked.data, loadout);

  const meta = extractCloudSaveMetadata(SAVE_TYPES.CUSTOM_LOADOUT, loadout, packed, uncompressedSize);
  assert.equal(meta.save_type, 'custom_loadout');
  assert.equal(meta.name, 'Telvanni Archmagister War Kit');
  assert.equal(meta.item_count, 6);
  assert.equal(meta.packed_size, packedSize);
  assert.equal(meta.unpacked_size, uncompressedSize);
});

test('Cloud Save Codec: Adversarial edge cases (negative stages, custom quest status, custom values/indexes, signed numbers)', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES, SKILL_IDS, ATTRIBUTE_IDS } = await import('../lib/cloud-save-codec.mjs');

  // 1. Sparse save with null vitals and empty lists
  const sparseSave = {
    formatVersion: 10,
    contentFiles: [],
    identity: {
      name: '',
      race: null,
      gender: null,
      class: { id: null, name: null, custom: false, specialization: null, favoredAttributes: [] },
      birthsign: null,
      level: 1,
      cell: null
    },
    vitals: {
      health: null,
      magicka: null,
      fatigue: null,
      gold: 0,
      reputation: 0,
      bounty: 0,
      timePlayedSeconds: null
    },
    build: {
      skillKindSource: null,
      skills: [],
      attributes: []
    },
    progress: {
      quests: [],
      otherJournalIds: [],
      factions: []
    },
    stuff: {
      inventory: [],
      spells: []
    },
    warnings: []
  };

  const sparsePacked = packCloudSave(SAVE_TYPES.OPENMW_SAVE, sparseSave);
  const sparseUnpacked = unpackCloudSave(sparsePacked.packed);
  assert.deepEqual(sparseUnpacked.data, sparseSave);

  // 2. High-adversity save:
  // - Negative quest stages (e.g. -1, -10)
  // - Custom quest statuses ("failed", "dormant")
  // - Non-standard skill values (explicit value differs from base + mod - dam)
  // - Non-standard attribute values
  // - Non-standard skill and attribute indexes
  // - Negative bounty and negative gold
  // - Equipped item with null slot, and unequipped item with valid slot
  const adversarialSave = {
    formatVersion: 40,
    contentFiles: ['Morrowind.esm'],
    identity: {
      name: '  Adversarial Hero  ',
      race: 'Alfiq',
      gender: 'Male',
      class: { id: 'custom_necromancer', name: 'Corpse Stitcher', custom: true, specialization: 'Magic', favoredAttributes: ['Intelligence', 'Endurance'] },
      birthsign: 'The Void',
      level: 50,
      cell: 'Mod Realm, Chamber of Souls'
    },
    vitals: {
      health: { current: 500.55, max: 500.55 },
      magicka: { current: 1200, max: 1200 },
      fatigue: { current: 400, max: 400 },
      gold: -2500, // negative gold
      reputation: -10, // negative reputation
      bounty: -500, // negative bounty
      timePlayedSeconds: 3600.5
    },
    build: {
      skillKindSource: 'mod-class',
      skills: [
        {
          id: 'Block',
          index: 15, // custom index
          base: 50,
          modifier: -15,
          damage: 10,
          value: 99, // custom explicit value (not 25)
          progress: 0.75,
          kind: 'Major'
        },
        {
          id: 'ThrowingWeapons', // 28th modded skill
          index: 27,
          base: 40,
          modifier: 0,
          damage: 0,
          value: 42, // custom value
          progress: 0.1,
          kind: 'Minor'
        }
      ],
      attributes: [
        {
          id: 'Strength',
          index: 6, // custom index
          base: 70,
          modifier: -5,
          damage: 5,
          value: 88 // custom explicit value (not 60)
        },
        {
          id: 'Sanity', // modded attribute
          index: 8,
          base: 100,
          modifier: -30,
          damage: 10,
          value: 60
        }
      ]
    },
    progress: {
      quests: [
        { id: 'quest_negative_1', stage: -1, finished: false, status: 'active' },
        { id: 'quest_failed_custom', stage: 100, finished: true, status: 'failed' },
        { id: 'quest_dormant_custom', stage: -5, finished: false, status: 'dormant' }
      ],
      otherJournalIds: ['topic_a', 'topic_b'],
      factions: [{ id: 'Dark Brotherhood', rank: -1, reputation: -50, expelled: true }]
    },
    stuff: {
      inventory: [
        { id: 'iron_dagger', count: 1, soul: null, equipped: true, slot: null }, // equipped with null slot
        { id: 'iron_shield', count: 1, soul: null, equipped: false, slot: 'CarriedLeft' }, // unequipped with slot
        { id: 'custom_relic', count: 5, soul: 'dremora lord', equipped: true, slot: 'CustomNecklace' }
      ],
      spells: ['blood_drain']
    },
    warnings: ['adversarial test warning']
  };

  const advPacked = packCloudSave(SAVE_TYPES.OPENMW_SAVE, adversarialSave);
  const advUnpacked = unpackCloudSave(advPacked.packed);
  assert.deepEqual(advUnpacked.data, adversarialSave);

  // 3. Name sanitization check with whitespace-only name
  const whitespaceSave = {
    ...sparseSave,
    identity: { ...sparseSave.identity, name: '     ' }
  };
  const metaWs = extractCloudSaveMetadata(SAVE_TYPES.OPENMW_SAVE, whitespaceSave, advPacked.packed, 100);
  assert.equal(metaWs.name, 'Nerevarine', 'Whitespace-only name must safely fall back to non-empty name');
  assert.ok(metaWs.name.length >= 1 && metaWs.name.length <= 120);

  // 4. Large safe integers in varint/svarint (> 2^32, e.g. 5,000,000,000)
  const { ByteBuffer, ByteReader } = await import('../lib/cloud-save-codec.mjs');
  const buf = new ByteBuffer();
  buf.varint(5000000000);
  buf.svarint(-5000000000);
  const reader = new ByteReader(buf.finish());
  assert.equal(reader.varint(), 5000000000);
  assert.equal(reader.svarint(), -5000000000);

  // 5. Corrupt buffer rejection
  assert.throws(() => unpackCloudSave(new Uint8Array(5)), /header too short/);
  assert.throws(() => unpackCloudSave(new Uint8Array(12)), /Invalid SLT1 header/);

  const corrupted = new Uint8Array(advPacked.packed);
  corrupted[4] = 99; // corrupt version
  assert.throws(() => unpackCloudSave(corrupted), /Unsupported SLT1 format version/);

  const truncatedPayload = advPacked.packed.subarray(0, advPacked.packed.length - 20);
  assert.throws(() => unpackCloudSave(truncatedPayload), /(decompression|Payload size mismatch|end of file)/i);
});

test('Cloud Save Codec: Pure JS SHA-256 and Async Web Streams compression', async () => {
  const {
    sha256Sync,
    computeSha256,
    packCloudSaveAsync,
    unpackCloudSaveAsync,
    SAVE_TYPES
  } = await import('../lib/cloud-save-codec.mjs');

  // Verify pure JS SHA-256 matches node:crypto SHA-256 byte for byte
  const testBytes = Buffer.from('Silt Strider Cloud Save Vault Validation 2026');
  const expectedHash = crypto.createHash('sha256').update(testBytes).digest('hex');
  const actualHash = sha256Sync(testBytes);
  assert.equal(actualHash, expectedHash);
  assert.equal(computeSha256(testBytes), expectedHash);

  // Async packing and unpacking
  const testLoadout = {
    version: 1,
    name: 'Async Loadout Test',
    world: 'vanilla',
    description: 'Testing CompressionStream / async pipeline',
    items: [{ id: 'glass_dagger', slot: 'CarriedRight', soul: null, count: 1 }]
  };

  const { packed } = await packCloudSaveAsync(SAVE_TYPES.CUSTOM_LOADOUT, testLoadout);
  const unpacked = await unpackCloudSaveAsync(packed);
  assert.deepEqual(unpacked.data, testLoadout);
});

test('Cloud Save Codec: Validation functions reject invalid structures', async () => {
  const {
    validateOmwSave,
    validateCharacterBuild,
    validateChallengeRun,
    validateCustomLoadout
  } = await import('../lib/cloud-save-codec.mjs');

  assert.throws(() => validateOmwSave(null), /Save data must be a non-null object/);
  assert.throws(() => validateOmwSave({ formatVersion: 'invalid' }), /formatVersion must be a number/);
  assert.throws(() => validateCharacterBuild({ maj: 'not an array' }), /maj must be an array/);
  assert.throws(() => validateChallengeRun({ character: 'not an object' }), /character must be an object/);
  assert.throws(() => validateCustomLoadout({ name: '' }), /Loadout name must be a non-empty string/);
  assert.throws(() => validateCustomLoadout({ name: 'Valid', items: [{ id: 123 }] }), /Loadout item id must be a string/);
});
