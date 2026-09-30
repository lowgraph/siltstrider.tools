const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const MIGRATION = '0007_account_settings.sql';
const directory = path.join(__dirname, '../cloudflare/migrations');
const sql = name => fs.readFileSync(path.join(directory, name), 'utf8');

function historicalDatabase(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const migrations = fs.readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  assert.ok(migrations.includes(MIGRATION));
  for (const name of migrations.filter(name => name < MIGRATION)) db.exec(sql(name));
  return db;
}

function database(t) {
  const db = historicalDatabase(t);
  db.exec(sql(MIGRATION));
  return db;
}

function insert(db, owner, document, revision = 1) {
  return db.prepare(`INSERT INTO account_settings
    (clerk_user_id, settings_json, revision, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)`).run(owner, document, revision, '2026-09-30T00:00:00Z', '2026-09-30T00:00:00Z');
}

function rejected(db, owner, document, revision = 1) {
  assert.throws(() => insert(db, owner, document, revision), /CHECK constraint failed|NOT NULL constraint failed/);
}

test('node:sqlite supports the JSON functions required by migration 0007', t => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const row = db.prepare(`SELECT json_valid(?) AS valid, json_type(?) AS kind,
    json_type(?, '$.version') AS versionKind`).get('{"version":1}', '{"version":1}', '{"version":1}');
  assert.equal(row.valid, 1);
  assert.equal(row.kind, 'object');
  assert.equal(row.versionKind, 'integer');
  assert.equal(db.prepare('SELECT json_valid(?) AS valid').get('bad json').valid, 0);
});

test('0007 applies after historical migrations without changing cloud saves, profiles or entitlements', t => {
  const db = historicalDatabase(t);
  db.prepare(`INSERT INTO cloud_saves
    (id, clerk_user_id, name, packed_payload, packed_size, unpacked_size, payload_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('save', 'owner-a', 'Keep my save', Buffer.from([1]), 1, 1, 'a'.repeat(64), '2026', '2026');
  db.prepare(`INSERT INTO saved_loadouts
    (id, clerk_user_id, name, world, loadout_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('loadout', 'owner-a', 'Keep my gear', 'vanilla', '{"version":1,"items":[]}', '2026', '2026');
  db.prepare(`INSERT INTO account_profiles (clerk_user_id, username, icon_id, updated_at)
    VALUES (?, ?, ?, ?)`).run('owner-a', 'Nerevarine', 2, '2026');
  db.prepare(`INSERT INTO user_tiers (clerk_user_id, tier, max_saves, max_loadouts, max_challenges, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('owner-a', 'paid', 25, 25, 25, '2026', '2026');
  db.prepare('INSERT INTO premium_support_codes (clerk_user_id, code) VALUES (?, ?)').run('owner-a', 'keep-code');
  db.prepare(`INSERT INTO premium_payments (transaction_id, clerk_user_id, amount_cents, received_at)
    VALUES (?, ?, ?, ?)`).run('receipt', 'owner-a', 500, '2026');

  const schema = db.prepare('SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name').all();
  const tables = schema.filter(row => row.type === 'table').map(row => row.name);
  const records = tables.map(name => [name, db.prepare(`SELECT * FROM "${name}"`).all()]);
  const entitlements = db.prepare('SELECT * FROM v_user_entitlements').all();
  db.exec(sql(MIGRATION));

  const existingSchema = db.prepare(`SELECT type, name, tbl_name, sql FROM sqlite_schema
    WHERE tbl_name <> 'account_settings' ORDER BY type, name`).all();
  assert.deepEqual(existingSchema, schema, 'every existing table, index, trigger and view stays unchanged');
  for (const [name, rows] of records) assert.deepEqual(db.prepare(`SELECT * FROM "${name}"`).all(), rows, `${name} records stay unchanged`);
  assert.deepEqual(db.prepare('SELECT * FROM v_user_entitlements').all(), entitlements);
  assert.equal(db.prepare('SELECT count(*) AS count FROM account_settings').get().count, 0);
});

test('a fresh account stores settings without a username or save-vault slot', t => {
  const db = database(t);
  insert(db, 'owner-a', '{"version":1,"world":"tr"}');
  insert(db, 'owner-b', '{"version":1,"world":"vanilla"}');
  assert.equal(db.prepare('SELECT count(*) AS count FROM account_profiles').get().count, 0);
  assert.equal(db.prepare('SELECT count(*) AS count FROM cloud_saves').get().count, 0);
  assert.equal(db.prepare('SELECT count(*) AS count FROM account_settings').get().count, 2);
  assert.equal(db.prepare('SELECT settings_json FROM account_settings WHERE clerk_user_id=?').get('owner-b').settings_json,
    '{"version":1,"world":"vanilla"}');
});

test('0007 rejects malformed JSON, null/missing versions, arrays, empty owners and invalid revisions', t => {
  const db = database(t);
  for (const document of ['bad json', '[]', 'null', '{}', '{"version":null}', '{"version":"1"}',
    '{"version":true}', '{"version":0}', '{"version":1.5}']) rejected(db, 'bad-owner', document);
  for (const owner of ['', '   ', null]) rejected(db, owner, '{"version":1}');
  for (const revision of [0, -1, 1.5]) rejected(db, 'bad-revision', '{"version":1}', revision);
  insert(db, 'future-version', '{"version":2,"future":{"enabled":true}}');
  assert.equal(db.prepare('SELECT count(*) AS count FROM account_settings').get().count, 1);
});

test('0007 bounds UTF-8 bytes rather than character count and preserves future fields', t => {
  const db = database(t);
  const prefix = '{"version":1,"extra":"', suffix = '"}';
  const exact = prefix + 'x'.repeat(16384 - Buffer.byteLength(prefix + suffix)) + suffix;
  assert.equal(Buffer.byteLength(exact), 16384);
  insert(db, 'exact-limit', exact);
  rejected(db, 'too-large', exact.slice(0, -2) + 'x' + suffix);
  const wide = JSON.stringify({ version: 1, extra: '界'.repeat(6000) });
  assert.ok(wide.length < 16384 && Buffer.byteLength(wide) > 16384);
  rejected(db, 'wide', wide);
  assert.ok(JSON.parse(db.prepare('SELECT settings_json FROM account_settings WHERE clerk_user_id=?').get('exact-limit').settings_json).extra.startsWith('xxx'));
});

test('revision-checked writes isolate owners and reject stale updates and simultaneous first writes', t => {
  const db = database(t);
  insert(db, 'owner-a', '{"version":1,"world":"vanilla"}');
  insert(db, 'owner-b', '{"version":1,"world":"tr"}');
  const update = (owner, revision, document) => db.prepare(`UPDATE account_settings
    SET settings_json=?, revision=revision+1, updated_at=? WHERE clerk_user_id=? AND revision=?`)
    .run(document, '2026-09-30T00:01:00Z', owner, revision).changes;
  assert.equal(update('owner-a', 1, '{"version":1,"world":"tr_arce"}'), 1);
  assert.equal(update('owner-a', 1, '{"version":1,"world":"vanilla"}'), 0);
  assert.equal(update('missing-owner', 1, '{"version":1}'), 0);
  assert.equal(db.prepare('SELECT revision FROM account_settings WHERE clerk_user_id=?').get('owner-a').revision, 2);
  const other = db.prepare('SELECT settings_json, revision FROM account_settings WHERE clerk_user_id=?').get('owner-b');
  assert.equal(other.settings_json, '{"version":1,"world":"tr"}');
  assert.equal(other.revision, 1);
  const first = db.prepare(`INSERT INTO account_settings (clerk_user_id, settings_json, created_at, updated_at)
    VALUES (?, ?, ?, ?) ON CONFLICT(clerk_user_id) DO NOTHING`);
  assert.equal(first.run('new-owner', '{"version":1}', '2026', '2026').changes, 1);
  assert.equal(first.run('new-owner', '{"version":1,"world":"tr"}', '2026', '2026').changes, 0);
  assert.equal(db.prepare('SELECT settings_json FROM account_settings WHERE clerk_user_id=?').get('new-owner').settings_json, '{"version":1}');
});

test('0007 stores approved preferences and dataset overrides without extra columns', t => {
  const db = database(t);
  const document = { version: 1, world: 'tr', theme: 'morrowind',
    versionUpdates: { policy: 'pinned', notify: false }, defaultScope: 'dataset',
    toolDefaults: { travel: { objective: 'gold' }, gear: { theft: false, questRewards: true },
      challenge: { preset: 'custom', restrictionCount: 'random', objectiveCount: '2', allowedBands: { Hard: true } } },
    datasetOverrides: [{ world: 'tr', modpackId: 'pack-a', modVersionId: 'release-1', toolDefaults: { travel: { mageGuild: true } } }] };
  insert(db, 'approved-owner', JSON.stringify(document));
  const stored = db.prepare('SELECT settings_json FROM account_settings WHERE clerk_user_id=?').get('approved-owner').settings_json;
  assert.deepEqual(JSON.parse(stored), document);
  assert.equal(db.prepare("SELECT json_extract(settings_json, '$.theme') AS theme FROM account_settings WHERE clerk_user_id=?").get('approved-owner').theme, 'morrowind');
});
