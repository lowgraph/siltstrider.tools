const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const MIGRATION_0001_PATH = path.join(__dirname, '../cloudflare/migrations/0001_saved_characters.sql');
const MIGRATION_0002_PATH = path.join(__dirname, '../cloudflare/migrations/0002_cloud_save_vault.sql');

/* ==================================================================== */
/* 1. Database Level 0:N Relationship & Isolation Tests (SQLite / D1)   */
/* ==================================================================== */

test('0:N Database: User with 0 records across all tables returns clean empty results', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

# Query a brand new user who has 0 records anywhere
clerk_user_id = 'user_brand_new_zero'

# 1. Header view returns 0 rows (empty list)
rows = con.execute("SELECT * FROM v_cloud_save_headers WHERE clerk_user_id = ?", (clerk_user_id,)).fetchall()
assert rows == [], f"Expected empty list, got {rows}"

# 2. Direct table queries return empty list
assert con.execute("SELECT * FROM cloud_saves WHERE clerk_user_id = ?", (clerk_user_id,)).fetchall() == []
assert con.execute("SELECT * FROM saved_characters WHERE clerk_user_id = ?", (clerk_user_id,)).fetchall() == []
assert con.execute("SELECT * FROM saved_challenges WHERE clerk_user_id = ?", (clerk_user_id,)).fetchall() == []
assert con.execute("SELECT * FROM saved_loadouts WHERE clerk_user_id = ?", (clerk_user_id,)).fetchall() == []

# 3. Aggregations on 0 records
agg = con.execute("""
  SELECT
    count(*),
    coalesce(sum(packed_size), 0),
    max(updated_at),
    min(level)
  FROM cloud_saves
  WHERE clerk_user_id = ?
""", (clerk_user_id,)).fetchone()
assert agg == (0, 0, None, None), f"Unexpected aggregation on 0 records: {agg}"

# 4. Pagination on 0 records
paged = con.execute("SELECT id FROM cloud_saves WHERE clerk_user_id = ? ORDER BY updated_at DESC LIMIT 10 OFFSET 0", (clerk_user_id,)).fetchall()
assert paged == []

# 5. Non-existent updates and deletions on 0 records affect 0 rows and do not error
cur = con.execute("UPDATE cloud_saves SET name = 'Ghost' WHERE clerk_user_id = ? AND id = 'ghost_id'", (clerk_user_id,))
assert cur.rowcount == 0

cur = con.execute("DELETE FROM cloud_saves WHERE clerk_user_id = ? AND id = 'ghost_id'", (clerk_user_id,))
assert cur.rowcount == 0

print("OK_ZERO_USER")
`;
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_ZERO_USER/);
});

test('0:N Database: Dynamic lifecycle transition (0 -> 1 -> N -> 0)', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

user_id = 'user_dynamic_lifecycle'

# Configure supporter tier with max_saves = 50 for lifecycle stress test
con.execute("""
  INSERT INTO user_tiers (clerk_user_id, tier, max_saves, max_loadouts, max_challenges, created_at, updated_at)
  VALUES (?, 'supporter', 50, 50, 50, '2026', '2026')
""", (user_id,))

# State 1: 0 records
assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (user_id,)).fetchone()[0] == 0

# State 2: Insert 1st record (0 -> 1)
con.execute("""
  INSERT INTO cloud_saves (
    id, clerk_user_id, version, save_type, name, format_version,
    level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
    quest_count, topic_count, item_count, spell_count, faction_count,
    packed_payload, packed_size, unpacked_size, encoding, payload_hash,
    revision, created_at, updated_at
  ) VALUES (
    'cs_first', ?, 1, 'openmw_save', 'First Hero', 40,
    1, 'Nord', 'Warrior', 0, 'The Warrior', 'Seyda Neen', 0, 0.0,
    0, 0, 0, 0, 0,
    X'534C5431', 4, 10, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    1, '2026-09-19T00:00:00Z', '2026-09-19T00:00:00Z'
  )
""", (user_id,))

assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (user_id,)).fetchone()[0] == 1
assert con.execute("SELECT count(*) FROM v_cloud_save_headers WHERE clerk_user_id = ?", (user_id,)).fetchone()[0] == 1

# State 3: Insert N records (1 -> N = 30)
for i in range(2, 31):
  stype = 'character_build' if i % 3 == 0 else ('challenge_run' if i % 5 == 0 else 'openmw_save')
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, version, save_type, name, format_version,
      level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
      quest_count, topic_count, item_count, spell_count, faction_count,
      packed_payload, packed_size, unpacked_size, encoding, payload_hash,
      revision, created_at, updated_at
    ) VALUES (
      ?, ?, 1, ?, ?, 40,
      ?, 'Dunmer', 'Class', 0, 'Sign', 'Cell', 100, 120.0,
      1, 1, 1, 1, 1,
      X'534C5431', 4, 10, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      1, '2026-09-19T00:00:00Z', '2026-09-19T00:00:00Z'
    )
  """, (f"cs_{i}", user_id, stype, f"Hero {i}", i))

assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (user_id,)).fetchone()[0] == 30

# Filter by save_type where count is 0 (we never inserted 'custom_loadout')
zero_type_rows = con.execute("SELECT * FROM cloud_saves WHERE clerk_user_id = ? AND save_type = 'custom_loadout'", (user_id,)).fetchall()
assert zero_type_rows == [], f"Expected 0 custom_loadout rows, got {len(zero_type_rows)}"

# Filter by save_type where count is > 0
char_builds = con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ? AND save_type = 'character_build'", (user_id,)).fetchone()[0]
assert char_builds > 0

# State 4: Mass deletion back to 0 (N -> 0)
deleted = con.execute("DELETE FROM cloud_saves WHERE clerk_user_id = ?", (user_id,))
assert deleted.rowcount == 30

# Final check: back to clean 0
assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (user_id,)).fetchone()[0] == 0
assert con.execute("SELECT * FROM v_cloud_save_headers WHERE clerk_user_id = ?", (user_id,)).fetchall() == []

print("OK_LIFECYCLE")
`;
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_LIFECYCLE/);
});

test('0:N Database: Multi-tenant isolation between 0-record users and N-record users', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

user_zero = 'user_has_zero_records'
user_n = 'user_has_fifty_records'

# Configure supporter tier with max_saves = 50 for user_n
con.execute("""
  INSERT INTO user_tiers (clerk_user_id, tier, max_saves, max_loadouts, max_challenges, created_at, updated_at)
  VALUES (?, 'supporter', 50, 50, 50, '2026', '2026')
""", (user_n,))

# Insert 50 records for user_n
for i in range(50):
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, version, save_type, name, format_version,
      level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
      quest_count, topic_count, item_count, spell_count, faction_count,
      packed_payload, packed_size, unpacked_size, encoding, payload_hash,
      revision, created_at, updated_at
    ) VALUES (
      ?, ?, 1, 'openmw_save', 'Hero N', 40,
      1, 'Nord', 'Warrior', 0, 'Sign', 'Cell', 0, 0.0,
      0, 0, 0, 0, 0,
      X'534C5431', 4, 10, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      1, '2026-09-19T00:00:00Z', '2026-09-19T00:00:00Z'
    )
  """, (f"cs_user_n_{i}", user_n))

# Assert user_zero sees 0 records
assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (user_zero,)).fetchone()[0] == 0
assert con.execute("SELECT * FROM v_cloud_save_headers WHERE clerk_user_id = ?", (user_zero,)).fetchall() == []

# Assert user_zero cannot delete or update user_n's records
cur = con.execute("DELETE FROM cloud_saves WHERE clerk_user_id = ? AND id = 'cs_user_n_0'", (user_zero,))
assert cur.rowcount == 0

cur = con.execute("UPDATE cloud_saves SET name = 'Stolen' WHERE clerk_user_id = ? AND id = 'cs_user_n_0'", (user_zero,))
assert cur.rowcount == 0

# Confirm record remains unchanged and belonging to user_n
row = con.execute("SELECT name, clerk_user_id FROM cloud_saves WHERE id = 'cs_user_n_0'").fetchone()
assert row == ('Hero N', user_n)

# Cross-table multi-tenant overview
assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (user_n,)).fetchone()[0] == 50

print("OK_ISOLATION")
`;
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_ISOLATION/);
});

test('0:N Database: Heterogeneous table counts per user (mixed 0s and Ns)', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

user_mixed = 'user_heterogeneous'

# User has:
# - 3 cloud_saves
# - 0 saved_characters (legacy)
# - 2 saved_challenges
# - 0 saved_loadouts

for i in range(3):
  con.execute("""
    INSERT INTO cloud_saves (
      id, clerk_user_id, version, save_type, name, format_version,
      level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
      quest_count, topic_count, item_count, spell_count, faction_count,
      packed_payload, packed_size, unpacked_size, encoding, payload_hash,
      revision, created_at, updated_at
    ) VALUES (
      ?, ?, 1, 'openmw_save', 'Hero', 40,
      1, 'Nord', 'Warrior', 0, 'Sign', 'Cell', 0, 0.0,
      0, 0, 0, 0, 0,
      X'534C5431', 4, 10, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      1, '2026', '2026'
    )
  """, (f"cs_{i}", user_mixed))

for i in range(2):
  con.execute("""
    INSERT INTO saved_challenges (
      id, clerk_user_id, version, name, world, arce, major_objective, challenge_json, revision, created_at, updated_at
    ) VALUES (
      ?, ?, 1, 'Ironman Run', 'vanilla', 0, 'Kill Dagoth Ur', '{"version":1}', 1, '2026', '2026'
    )
  """, (f"ch_{i}", user_mixed))

# Single multi-table dashboard query
summary = con.execute("""
  SELECT
    (SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?),
    (SELECT count(*) FROM saved_characters WHERE clerk_user_id = ?),
    (SELECT count(*) FROM saved_challenges WHERE clerk_user_id = ?),
    (SELECT count(*) FROM saved_loadouts WHERE clerk_user_id = ?)
""", (user_mixed, user_mixed, user_mixed, user_mixed)).fetchone()

assert summary == (3, 0, 2, 0), f"Expected (3, 0, 2, 0), got {summary}"
print("OK_HETEROGENEOUS")
`;
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_HETEROGENEOUS/);
});

/* ==================================================================== */
/* 2. Payload / Codec Level 0:N Sub-Entity Tests                        */
/* ==================================================================== */

test('0:N Codec: Pure Zero Save (all sub-entity collections empty: 0 items, 0 quests, 0 spells, 0 factions, 0 topics)', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES } = await import('../lib/cloud-save-codec.mjs');

  const pureZeroSave = {
    formatVersion: 40,
    contentFiles: [],
    identity: {
      name: 'Fresh Prisoner',
      race: 'Argonian',
      gender: 'Male',
      class: { id: 'Slave', name: null, custom: false, specialization: null, favoredAttributes: [] },
      birthsign: 'The Tower',
      level: 1,
      cell: 'Seyda Neen, Prison Ship'
    },
    vitals: {
      health: { current: 45, max: 45 },
      magicka: { current: 30, max: 30 },
      fatigue: { current: 160, max: 160 },
      gold: 0,
      reputation: 0,
      bounty: 0,
      timePlayedSeconds: 0
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

  const { packed, packedSize, uncompressedSize, encoding } = packCloudSave(SAVE_TYPES.OPENMW_SAVE, pureZeroSave);
  assert.equal(encoding, 'slt1_deflate');
  assert.ok(packedSize > 0);
  assert.ok(packedSize < 200, `Expected ultra-small binary payload for zero-state, got ${packedSize} bytes`);

  const unpacked = unpackCloudSave(packed);
  assert.equal(unpacked.saveType, SAVE_TYPES.OPENMW_SAVE);
  assert.deepEqual(unpacked.data, pureZeroSave);

  // Assert collections are empty arrays (not null, not undefined)
  assert.ok(Array.isArray(unpacked.data.progress.quests) && unpacked.data.progress.quests.length === 0);
  assert.ok(Array.isArray(unpacked.data.progress.otherJournalIds) && unpacked.data.progress.otherJournalIds.length === 0);
  assert.ok(Array.isArray(unpacked.data.progress.factions) && unpacked.data.progress.factions.length === 0);
  assert.ok(Array.isArray(unpacked.data.stuff.inventory) && unpacked.data.stuff.inventory.length === 0);
  assert.ok(Array.isArray(unpacked.data.stuff.spells) && unpacked.data.stuff.spells.length === 0);
  assert.ok(Array.isArray(unpacked.data.contentFiles) && unpacked.data.contentFiles.length === 0);
  assert.ok(Array.isArray(unpacked.data.build.skills) && unpacked.data.build.skills.length === 0);
  assert.ok(Array.isArray(unpacked.data.build.attributes) && unpacked.data.build.attributes.length === 0);

  // Metadata counts are strictly 0
  const meta = extractCloudSaveMetadata(SAVE_TYPES.OPENMW_SAVE, pureZeroSave, packed, uncompressedSize);
  assert.equal(meta.quest_count, 0);
  assert.equal(meta.topic_count, 0);
  assert.equal(meta.item_count, 0);
  assert.equal(meta.spell_count, 0);
  assert.equal(meta.faction_count, 0);
  assert.equal(meta.gold, 0);
});

test('0:N Codec: Adversarial missing/null/undefined collections normalize cleanly to 0', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES } = await import('../lib/cloud-save-codec.mjs');

  const nullCollectionsSave = {
    formatVersion: 39,
    contentFiles: null, // missing array
    identity: {
      name: 'Null Test Hero',
      race: null,
      class: null,
      birthsign: null,
      level: null,
      cell: null
    },
    vitals: null,
    build: {
      skillKindSource: null,
      skills: null,     // null array
      attributes: null  // null array
    },
    progress: {
      quests: null,          // null array
      otherJournalIds: null, // null array
      factions: null         // null array
    },
    stuff: {
      inventory: null, // null array
      spells: null     // null array
    },
    warnings: null
  };

  // Must pack without throwing TypeError
  const { packed, uncompressedSize } = packCloudSave(SAVE_TYPES.OPENMW_SAVE, nullCollectionsSave);
  const unpacked = unpackCloudSave(packed);

  // Unpacked must cleanly normalize missing arrays to empty arrays []
  assert.ok(Array.isArray(unpacked.data.contentFiles) && unpacked.data.contentFiles.length === 0);
  assert.ok(Array.isArray(unpacked.data.build.skills) && unpacked.data.build.skills.length === 0);
  assert.ok(Array.isArray(unpacked.data.build.attributes) && unpacked.data.build.attributes.length === 0);
  assert.ok(Array.isArray(unpacked.data.progress.quests) && unpacked.data.progress.quests.length === 0);
  assert.ok(Array.isArray(unpacked.data.progress.otherJournalIds) && unpacked.data.progress.otherJournalIds.length === 0);
  assert.ok(Array.isArray(unpacked.data.progress.factions) && unpacked.data.progress.factions.length === 0);
  assert.ok(Array.isArray(unpacked.data.stuff.inventory) && unpacked.data.stuff.inventory.length === 0);
  assert.ok(Array.isArray(unpacked.data.stuff.spells) && unpacked.data.stuff.spells.length === 0);

  // Metadata counts safely report 0
  const meta = extractCloudSaveMetadata(SAVE_TYPES.OPENMW_SAVE, nullCollectionsSave, packed, uncompressedSize);
  assert.equal(meta.quest_count, 0);
  assert.equal(meta.topic_count, 0);
  assert.equal(meta.item_count, 0);
  assert.equal(meta.spell_count, 0);
  assert.equal(meta.faction_count, 0);
  assert.equal(meta.gold, 0);
  assert.equal(meta.time_played_seconds, null);
});

test('0:N Codec: Extreme N Stress Test (5,000+ sub-entities: 500 quests, 1,500 topics, 2,500 items, 300 spells, 40 factions)', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES, SKILL_IDS, ATTRIBUTE_IDS, EQUIP_SLOTS } = await import('../lib/cloud-save-codec.mjs');

  const extremeSave = {
    formatVersion: 40,
    contentFiles: Array.from({ length: 120 }, (_, i) => `mod_plugin_entry_${i}.esp`),
    identity: {
      name: 'God King of Vvardenfell',
      race: 'Chimer',
      gender: 'Male',
      class: { id: 'LivingGod', name: 'Immortal Tribune', custom: true, specialization: 'Magic', favoredAttributes: ['Intelligence', 'Personality'] },
      birthsign: 'The Lord',
      level: 78,
      cell: 'Vivec, Palace of Vivec'
    },
    vitals: {
      health: { current: 1850, max: 1850 },
      magicka: { current: 3200, max: 3200 },
      fatigue: { current: 950, max: 950 },
      gold: 55000000,
      reputation: 150,
      bounty: 0,
      timePlayedSeconds: 1500000.5
    },
    build: {
      skillKindSource: 'save-class-record',
      skills: SKILL_IDS.map((id, i) => ({
        id,
        index: i,
        base: 100,
        modifier: 25,
        damage: 0,
        value: 125,
        progress: 0.99,
        kind: i < 5 ? 'Major' : i < 10 ? 'Minor' : 'Misc'
      })),
      attributes: ATTRIBUTE_IDS.map((id, i) => ({
        id,
        index: i,
        base: 100,
        modifier: 50,
        damage: 0,
        value: 150
      }))
    },
    progress: {
      quests: Array.from({ length: 500 }, (_, i) => ({
        id: `quest_line_${i}`,
        stage: (i * 7) % 150,
        finished: i % 3 === 0,
        status: i % 3 === 0 ? 'finished' : (i % 7 === 0 ? 'failed' : 'active')
      })),
      otherJournalIds: Array.from({ length: 1500 }, (_, i) => `dialogue_topic_id_${i}`),
      factions: Array.from({ length: 40 }, (_, i) => ({
        id: `guild_faction_${i}`,
        rank: (i % 10),
        reputation: i * 5,
        expelled: i === 13
      }))
    },
    stuff: {
      inventory: Array.from({ length: 2500 }, (_, i) => {
        const slot = i < 19 ? EQUIP_SLOTS[i] : (i % 50 === 0 ? 'CustomCapeSlot' : null);
        return {
          id: `daedric_artifact_${i % 100}`,
          count: (i % 10) + 1,
          soul: i % 25 === 0 ? `creature_soul_${i % 10}` : null,
          equipped: slot !== null,
          slot
        };
      }),
      spells: Array.from({ length: 300 }, (_, i) => `spell_formula_tome_${i}`)
    },
    warnings: ['Benchmark save generated with 4,960 total sub-entities']
  };

  const rawJson = JSON.stringify(extremeSave);
  const rawJsonBytes = Buffer.byteLength(rawJson);

  const { packed, packedSize, uncompressedSize, encoding, payloadHash } = packCloudSave(SAVE_TYPES.OPENMW_SAVE, extremeSave);
  assert.equal(encoding, 'slt1_deflate');

  // Must stay comfortably within Cloudflare D1 1 MB check constraint
  assert.ok(packedSize < 1048576, `Packed payload must be <= 1 MB, was ${packedSize} bytes`);
  // Must achieve massive compression vs raw JSON (> 85%)
  assert.ok(packedSize / rawJsonBytes < 0.15, `Expected high density compression, got ${(packedSize / rawJsonBytes * 100).toFixed(1)}%`);

  // Verify complete round-trip integrity on all 5,000+ items
  const unpacked = unpackCloudSave(packed);
  assert.equal(unpacked.saveType, SAVE_TYPES.OPENMW_SAVE);
  assert.equal(unpacked.data.progress.quests.length, 500);
  assert.equal(unpacked.data.progress.otherJournalIds.length, 1500);
  assert.equal(unpacked.data.stuff.inventory.length, 2500);
  assert.equal(unpacked.data.stuff.spells.length, 300);
  assert.equal(unpacked.data.progress.factions.length, 40);
  assert.deepEqual(unpacked.data, extremeSave);

  // Metadata verification
  const meta = extractCloudSaveMetadata(SAVE_TYPES.OPENMW_SAVE, extremeSave, packed, uncompressedSize);
  assert.equal(meta.quest_count, 500);
  assert.equal(meta.topic_count, 1500);
  assert.equal(meta.item_count, 2500);
  assert.equal(meta.spell_count, 300);
  assert.equal(meta.faction_count, 40);
  assert.equal(meta.gold, 55000000);
});

test('0:N Loadouts & Challenges: Empty (0) and large (N) item/objective collections', async () => {
  const { packCloudSave, unpackCloudSave, extractCloudSaveMetadata, SAVE_TYPES, validateCustomLoadout, validateChallengeRun } = await import('../lib/cloud-save-codec.mjs');

  // 1. Naked Loadout (0 items)
  const nakedLoadout = {
    version: 1,
    name: 'Unarmored Monk (Naked)',
    world: 'vanilla',
    description: 'Zero armor, relying exclusively on Hand to Hand and Unarmored',
    items: []
  };

  assert.ok(validateCustomLoadout(nakedLoadout));
  const nakedPacked = packCloudSave(SAVE_TYPES.CUSTOM_LOADOUT, nakedLoadout);
  const nakedUnpacked = unpackCloudSave(nakedPacked.packed);
  assert.deepEqual(nakedUnpacked.data, nakedLoadout);
  assert.equal(nakedUnpacked.data.items.length, 0);

  const nakedMeta = extractCloudSaveMetadata(SAVE_TYPES.CUSTOM_LOADOUT, nakedLoadout, nakedPacked.packed, nakedPacked.uncompressedSize);
  assert.equal(nakedMeta.item_count, 0);

  // 2. Full Hoarder Loadout (75 equipped and bag items)
  const hoarderLoadout = {
    version: 1,
    name: 'Heavy Armory Battle Pack',
    world: 'tr',
    description: 'Full equipment kit with side arms and backup shields',
    items: Array.from({ length: 75 }, (_, i) => ({
      id: `item_kit_${i}`,
      slot: i < 19 ? 'Helmet' : null,
      soul: i === 5 ? 'golden saint' : null,
      count: i % 4 === 0 ? 50 : 1
    }))
  };

  assert.ok(validateCustomLoadout(hoarderLoadout));
  const hoarderPacked = packCloudSave(SAVE_TYPES.CUSTOM_LOADOUT, hoarderLoadout);
  const hoarderUnpacked = unpackCloudSave(hoarderPacked.packed);
  assert.deepEqual(hoarderUnpacked.data, hoarderLoadout);
  assert.equal(hoarderUnpacked.data.items.length, 75);

  const hoarderMeta = extractCloudSaveMetadata(SAVE_TYPES.CUSTOM_LOADOUT, hoarderLoadout, hoarderPacked.packed, hoarderPacked.uncompressedSize);
  assert.equal(hoarderMeta.item_count, 75);

  // 3. Challenge run with 0 minors and 0 restrictions
  const pureChallenge = {
    version: 1,
    character: {
      version: 1,
      world: 'vanilla',
      arce: false,
      className: 'Acrobat',
      race: 'Khajiit',
      gender: '',
      sign: '',
      spec: '',
      fav1: '',
      fav2: '',
      maj: [],
      min: []
    },
    rolled: { race: false, gender: false, className: false, sign: false },
    major: 'Escape Vvardenfell',
    minors: [],
    restrictions: []
  };

  assert.ok(validateChallengeRun(pureChallenge));
  const challengePacked = packCloudSave(SAVE_TYPES.CHALLENGE_RUN, pureChallenge);
  const challengeUnpacked = unpackCloudSave(challengePacked.packed);
  assert.deepEqual(challengeUnpacked.data, pureChallenge);
  assert.equal(challengeUnpacked.data.minors.length, 0);
  assert.equal(challengeUnpacked.data.restrictions.length, 0);

  const challengeMeta = extractCloudSaveMetadata(SAVE_TYPES.CHALLENGE_RUN, pureChallenge, challengePacked.packed, challengePacked.uncompressedSize);
  assert.equal(challengeMeta.quest_count, 0);
});

test('0:N Adversarial: Database constraint enforcement on counts and boundary values', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

user_id = 'user_adversarial_checks'

base_insert = """
  INSERT INTO cloud_saves (
    id, clerk_user_id, version, save_type, name, format_version,
    level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
    quest_count, topic_count, item_count, spell_count, faction_count,
    packed_payload, packed_size, unpacked_size, encoding, payload_hash,
    revision, created_at, updated_at
  ) VALUES (?, ?, 1, 'openmw_save', 'Hero', 40, 1, 'Nord', 'Warrior', 0, 'Sign', 'Cell', ?, 0.0, ?, ?, ?, ?, ?, ?, ?, 10, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 1, '2026', '2026')
"""

# 1. Negative quest count must be rejected
try:
  con.execute(base_insert, ('cs_neg_q', user_id, 0, -1, 0, 0, 0, 0, b'data', 4))
  assert False, "Should reject negative quest_count"
except sqlite3.IntegrityError:
  pass

# 2. Negative item count must be rejected
try:
  con.execute(base_insert, ('cs_neg_i', user_id, 0, 0, 0, -5, 0, 0, b'data', 4))
  assert False, "Should reject negative item_count"
except sqlite3.IntegrityError:
  pass

# 3. Negative gold must be rejected
try:
  con.execute(base_insert, ('cs_neg_g', user_id, -100, 0, 0, 0, 0, 0, b'data', 4))
  assert False, "Should reject negative gold"
except sqlite3.IntegrityError:
  pass

# 4. Zero-byte packed_payload BLOB must be rejected (CHECK length > 0)
try:
  con.execute(base_insert, ('cs_zero_blob', user_id, 0, 0, 0, 0, 0, 0, b'', 0))
  assert False, "Should reject zero-length blob"
except sqlite3.IntegrityError:
  pass

# 5. Mismatched packed_size vs actual BLOB length must be rejected
try:
  con.execute(base_insert, ('cs_mismatch', user_id, 0, 0, 0, 0, 0, 0, b'1234', 99))
  assert False, "Should reject mismatched packed_size"
except sqlite3.IntegrityError:
  pass

# 6. Valid zero counts everywhere must be accepted
con.execute(base_insert, ('cs_valid_zero', user_id, 0, 0, 0, 0, 0, 0, b'valid_blob', 10))
row = con.execute("SELECT quest_count, item_count, gold, packed_size FROM cloud_saves WHERE id = 'cs_valid_zero'").fetchone()
assert row == (0, 0, 0, 10), f"Unexpected row: {row}"

print("OK_CONSTRAINTS")
`;
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_CONSTRAINTS/);
});

test('0:N Quota Tiers: Free users capped at 5 saves; Paid users capped at 25 saves; both keep full inventory and challenges', () => {
  const pyScript = `
import sqlite3, sys

con = sqlite3.connect(':memory:')
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

free_user = 'u_adventurer_free'
paid_user = 'u_supporter_paid'

# Configure Paid user in user_tiers table
con.execute("""
  INSERT INTO user_tiers (clerk_user_id, tier, max_saves, max_loadouts, max_challenges, created_at, updated_at)
  VALUES (?, 'paid', 25, 25, 25, '2026-09-19', '2026-09-19')
""", (paid_user,))

save_insert = """
  INSERT INTO cloud_saves (
    id, clerk_user_id, version, save_type, name, format_version,
    level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
    quest_count, topic_count, item_count, spell_count, faction_count,
    packed_payload, packed_size, unpacked_size, encoding, payload_hash,
    revision, created_at, updated_at
  ) VALUES (
    ?, ?, 1, 'openmw_save', ?, 40,
    15, 'Dunmer', 'Battlemage', 0, 'The Lady', 'Balmora', 15000, 7200.0,
    15, 30, 85, 12, 3,
    X'534C54310101', 6, 120, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    1, '2026-09-19T00:00:00Z', '2026-09-19T00:00:00Z'
  )
"""

# 1. Free user inserts 5 saves (full inventory, 85 items each, 15 quests)
for i in range(5):
  con.execute(save_insert, (f"free_save_{i}", free_user, f"Free Character {i}"))

assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (free_user,)).fetchone()[0] == 5

# Free user attempts 6th save -> ABORT trigger fired
try:
  con.execute(save_insert, ("free_save_6", free_user, "Excess Save"))
  assert False, "Should have aborted 6th save for free user"
except sqlite3.IntegrityError as e:
  assert "QUOTA_EXCEEDED" in str(e), f"Expected QUOTA_EXCEEDED in error, got: {e}"

# Free user can overwrite an existing save without triggering quota error
con.execute("UPDATE cloud_saves SET name = 'Renamed Character 0' WHERE id = 'free_save_0' AND clerk_user_id = ?", (free_user,))
assert con.execute("SELECT name FROM cloud_saves WHERE id = 'free_save_0'").fetchone()[0] == 'Renamed Character 0'

# Free user deletes 1 save -> count becomes 4 -> can insert new 5th save
con.execute("DELETE FROM cloud_saves WHERE id = 'free_save_4' AND clerk_user_id = ?", (free_user,))
assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (free_user,)).fetchone()[0] == 4
con.execute(save_insert, ("free_save_new", free_user, "New 5th Character"))
assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (free_user,)).fetchone()[0] == 5

# 2. Paid user inserts 25 saves (full inventory, 85 items each, 15 quests)
for i in range(25):
  con.execute(save_insert, (f"paid_save_{i}", paid_user, f"Paid Character {i}"))

assert con.execute("SELECT count(*) FROM cloud_saves WHERE clerk_user_id = ?", (paid_user,)).fetchone()[0] == 25

# Paid user attempts 26th save -> ABORT trigger fired
try:
  con.execute(save_insert, ("paid_save_26", paid_user, "Excess Paid Save"))
  assert False, "Should have aborted 26th save for paid user"
except sqlite3.IntegrityError as e:
  assert "QUOTA_EXCEEDED" in str(e), f"Expected QUOTA_EXCEEDED in error, got: {e}"

# 3. Verify user entitlements view
entitlements = con.execute("SELECT tier, max_saves, current_saves FROM v_user_entitlements WHERE clerk_user_id = ?", (paid_user,)).fetchone()
assert entitlements == ('paid', 25, 25), f"Unexpected entitlements: {entitlements}"

print("OK_QUOTA_TIERS")
`;
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK_QUOTA_TIERS/);
});
