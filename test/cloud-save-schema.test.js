const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const SCHEMA_PATH = path.join(__dirname, '../cloudflare/schema.sql');
const MIGRATION_0001_PATH = path.join(__dirname, '../cloudflare/migrations/0001_saved_characters.sql');
const MIGRATION_0002_PATH = path.join(__dirname, '../cloudflare/migrations/0002_cloud_save_vault.sql');
const WRANGLER_PATH = path.join(__dirname, '../wrangler.jsonc');

test('Cloud Save Schema: D1 schema and migrations exist and adhere to Cloudflare backend rules', () => {
  assert.ok(fs.existsSync(SCHEMA_PATH), 'cloudflare/schema.sql must exist');
  assert.ok(fs.existsSync(MIGRATION_0001_PATH), '0001_saved_characters.sql must exist');
  assert.ok(fs.existsSync(MIGRATION_0002_PATH), '0002_cloud_save_vault.sql must exist');
  assert.ok(fs.existsSync(WRANGLER_PATH), 'wrangler.jsonc must exist');

  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const mig1 = fs.readFileSync(MIGRATION_0001_PATH, 'utf8');
  const mig2 = fs.readFileSync(MIGRATION_0002_PATH, 'utf8');
  const wranglerText = fs.readFileSync(WRANGLER_PATH, 'utf8');

  // Verify wrangler D1 binding and nodejs_compat
  assert.match(wranglerText, /"d1_databases"/);
  assert.match(wranglerText, /"binding":\s*"DB"/);
  assert.match(wranglerText, /"database_name":\s*"siltstrider-db"/);
  assert.match(wranglerText, /"database_id":\s*"141a1409-3956-4267-a078-02483bbb2bf6"/);
  assert.match(wranglerText, /"nodejs_compat"/);

  // Check table definitions
  const expectedTables = ['saved_characters', 'cloud_saves', 'saved_challenges', 'saved_loadouts'];
  for (const table of expectedTables) {
    assert.ok(schemaSql.includes(`TABLE IF NOT EXISTS ${table}`) || schemaSql.includes(`TABLE ${table}`), `Schema must define ${table}`);
  }

  // Check view definition
  assert.match(schemaSql, /CREATE VIEW IF NOT EXISTS v_cloud_save_headers/);

  // Invariant checks on all tables
  for (const sql of [schemaSql, mig2]) {
    // 1. Clerk owns user identity (no users table, strict clerk_user_id check)
    assert.match(sql, /clerk_user_id TEXT NOT NULL CHECK \(length\(clerk_user_id\) > 0\)/);

    // 2. Optimistic concurrency counter
    assert.match(sql, /revision INTEGER NOT NULL DEFAULT 1 CHECK \(revision >= 1\)/);

    // 3. Size limits on payloads
    assert.match(sql, /packed_payload BLOB NOT NULL CHECK \(length\(packed_payload\) > 0 AND length\(packed_payload\) <= 1048576\)/);
    assert.match(sql, /challenge_json TEXT NOT NULL CHECK/);
    assert.match(sql, /loadout_json TEXT NOT NULL CHECK/);

    // 4. Owner indexes
    assert.match(sql, /idx_cloud_saves_owner_updated\s+ON cloud_saves \(clerk_user_id, updated_at DESC, id\)/);
    assert.match(sql, /idx_saved_challenges_owner_updated\s+ON saved_challenges \(clerk_user_id, updated_at DESC, id\)/);
    assert.match(sql, /idx_saved_challenges_owner_world\s+ON saved_challenges \(clerk_user_id, world, updated_at DESC\)/);
    assert.match(sql, /idx_saved_loadouts_owner_updated\s+ON saved_loadouts \(clerk_user_id, updated_at DESC, id\)/);
    assert.match(sql, /idx_saved_loadouts_owner_world\s+ON saved_loadouts \(clerk_user_id, world, updated_at DESC\)/);
  }
});

test('Cloud Save Schema: Live SQLite validation of constraints and adversarial edge cases', () => {
  const pyScript = `
import sqlite3, json, sys

con = sqlite3.connect(':memory:')
# Apply migration 1 and 2
con.executescript(open(sys.argv[1], encoding='utf-8').read())
con.executescript(open(sys.argv[2], encoding='utf-8').read())

# 1. Valid insertion into cloud_saves
con.execute('''
  INSERT INTO cloud_saves (
    id, clerk_user_id, version, save_type, name, format_version,
    level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
    quest_count, topic_count, item_count, spell_count, faction_count,
    packed_payload, packed_size, unpacked_size, encoding, payload_hash,
    revision, created_at, updated_at
  ) VALUES (
    'cs_1', 'user_1', 1, 'openmw_save', 'Valid Hero', 40,
    10, 'Dunmer', 'Warrior', 0, 'Warrior', 'Balmora', 100, 3600.0,
    5, 10, 20, 2, 1,
    X'534C5431010100', 7, 50, 'slt1_deflate', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    1, '2026-09-19T00:00:00Z', '2026-09-19T00:00:00Z'
  )
''')

# Query header view
row = con.execute("SELECT name, save_type, level, packed_size, unpacked_size FROM v_cloud_save_headers WHERE id = 'cs_1'").fetchone()
assert row == ('Valid Hero', 'openmw_save', 10, 7, 50), f"Header row unexpected: {row}"

# 2. Rejection of empty or whitespace-only name
try:
  con.execute('''
    INSERT INTO cloud_saves (
      id, clerk_user_id, name, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES ('cs_bad', 'user_1', '   ', X'01', 1, 1, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026', '2026')
  ''')
  assert False, "Should have rejected whitespace name"
except sqlite3.IntegrityError:
  pass

# 3. Rejection of invalid save_type
try:
  con.execute('''
    INSERT INTO cloud_saves (
      id, clerk_user_id, save_type, name, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at
    ) VALUES ('cs_bad2', 'user_1', 'unknown_type', 'Hero', X'01', 1, 1, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '2026', '2026')
  ''')
  assert False, "Should have rejected invalid save_type"
except sqlite3.IntegrityError:
  pass

# 4. Valid insertion into saved_loadouts
con.execute('''
  INSERT INTO saved_loadouts (
    id, clerk_user_id, version, name, world, loadout_json, revision, created_at, updated_at
  ) VALUES (
    'lo_1', 'user_1', 1, 'Mage Gear', 'vanilla', '{"version":1,"items":[]}', 1, '2026', '2026'
  )
''')

# 5. Rejection of saved_loadout with missing version in JSON
try:
  con.execute('''
    INSERT INTO saved_loadouts (
      id, clerk_user_id, name, loadout_json, created_at, updated_at
    ) VALUES ('lo_bad', 'user_1', 'Bad Loadout', '{"items":[]}', '2026', '2026')
  ''')
  assert False, "Should have rejected loadout_json without version 1"
except sqlite3.IntegrityError:
  pass

print("OK")
`;
  const { execFileSync } = require('node:child_process');
  const result = execFileSync('python', ['-c', pyScript, MIGRATION_0001_PATH, MIGRATION_0002_PATH], {
    encoding: 'utf8'
  });
  assert.match(result, /OK/);
});

test('Cloud Save Schema: Simulated D1 query execution and concurrency shapes', async () => {
  const {
    packCloudSave,
    extractCloudSaveMetadata,
    SAVE_TYPES
  } = await import('../lib/cloud-save-codec.mjs');

  const operations = [];
  const mockDb = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              operations.push({ type: 'run', sql, values });
              return { success: true, meta: { changes: 1 } };
            },
            async first() {
              operations.push({ type: 'first', sql, values });
              return null;
            },
            async all() {
              operations.push({ type: 'all', sql, values });
              return { results: [] };
            }
          };
        }
      };
    }
  };

  const sampleChar = {
    version: 1,
    world: 'vanilla',
    arce: false,
    className: 'Custom',
    race: 'Nord',
    gender: 'Male',
    sign: 'The Warrior',
    spec: 'Combat',
    fav1: 'Strength',
    fav2: 'Endurance',
    maj: ['Long Blade', 'Heavy Armor', 'Block', 'Armorer', 'Athletics'],
    min: ['Alchemy', 'Alteration', 'Mysticism', 'Restoration', 'Speechcraft']
  };

  const { packed, encoding, payloadHash, packedSize, uncompressedSize } = packCloudSave(SAVE_TYPES.CHARACTER_BUILD, sampleChar);
  const meta = extractCloudSaveMetadata(SAVE_TYPES.CHARACTER_BUILD, sampleChar, packed, uncompressedSize);

  const id = 'test-uuid-1234';
  const userId = 'user_clerk_test_99';
  const now = new Date().toISOString();

  // 1. Insert save
  const insertSql = `
    INSERT INTO cloud_saves (
      id, clerk_user_id, version, save_type, name, format_version,
      level, race, class_name, class_custom, birthsign, cell, gold, time_played_seconds,
      quest_count, topic_count, item_count, spell_count, faction_count,
      packed_payload, packed_size, unpacked_size, encoding, payload_hash,
      revision, created_at, updated_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `;

  await mockDb.prepare(insertSql).bind(
    id, userId, meta.save_type, meta.name, meta.format_version,
    meta.level, meta.race, meta.class_name, meta.class_custom, meta.birthsign, meta.cell,
    meta.gold, meta.time_played_seconds, meta.quest_count, meta.topic_count, meta.item_count,
    meta.spell_count, meta.faction_count, packed, packedSize, meta.unpacked_size,
    encoding, payloadHash, now, now
  ).run();

  assert.equal(operations.length, 1);
  assert.equal(operations[0].values[0], id);
  assert.equal(operations[0].values[1], userId);
  assert.equal(operations[0].values[2], 'character_build');
  assert.equal(operations[0].values[18], packed);
  assert.equal(operations[0].values[19], packedSize);
  assert.equal(operations[0].values[20], uncompressedSize);

  // 2. Query list without payload (fast listing)
  const listSql = `
    SELECT id, name, save_type, level, race, class_name, cell, gold, quest_count, item_count, updated_at, revision
    FROM cloud_saves
    WHERE clerk_user_id = ?
    ORDER BY updated_at DESC, id
    LIMIT ?
  `;
  await mockDb.prepare(listSql).bind(userId, 20).all();
  assert.equal(operations.length, 2);

  // 3. Point lookup fetching packed payload
  const getSql = `SELECT packed_payload, encoding, payload_hash FROM cloud_saves WHERE clerk_user_id = ? AND id = ?`;
  await mockDb.prepare(getSql).bind(userId, id).first();
  assert.equal(operations.length, 3);

  // 4. Update with optimistic concurrency
  const nextNow = new Date().toISOString();
  const updateSql = `
    UPDATE cloud_saves
    SET name = ?, packed_payload = ?, packed_size = ?, unpacked_size = ?, payload_hash = ?,
        updated_at = ?, revision = revision + 1
    WHERE clerk_user_id = ? AND id = ? AND revision = ?
  `;
  await mockDb.prepare(updateSql).bind('Renamed Build', packed, packedSize, uncompressedSize, payloadHash, nextNow, userId, id, 1).run();
  assert.equal(operations.length, 4);

  // 5. Delete with concurrency check
  const deleteSql = `DELETE FROM cloud_saves WHERE clerk_user_id = ? AND id = ? AND revision = ?`;
  await mockDb.prepare(deleteSql).bind(userId, id, 2).run();
  assert.equal(operations.length, 5);
});
