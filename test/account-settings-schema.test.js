const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const setup = `
import sqlite3, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
con = sqlite3.connect(':memory:')
for migration in sorted((root / 'cloudflare/migrations').glob('*.sql')):
    con.executescript(migration.read_text(encoding='utf-8'))
con.executescript((root / 'cloudflare/proposals/account_settings.sql').read_text(encoding='utf-8'))
def insert(owner, document, revision=1):
    return con.execute('INSERT INTO account_settings (clerk_user_id, settings_json, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        (owner, document, revision, '2026-09-30T00:00:00Z', '2026-09-30T00:00:00Z'))
def rejected(owner, document, revision=1):
    try:
        insert(owner, document, revision)
    except sqlite3.IntegrityError:
        return
    raise AssertionError('Invalid settings record was accepted')
`;
function sqlite(script) {
  const output = execFileSync('python', ['-B', '-c', `${setup}\n${script}\nprint('OK')`, path.resolve(__dirname, '..')], {
    encoding: 'utf8', env: { ...process.env, TEMP: 'A:\\Cache', TMP: 'A:\\Cache' }
  });
  assert.match(output, /OK/);
}

test('proposed settings table works after all historical migrations, preserves saves and needs no username', () => {
  sqlite(`
con.execute('INSERT INTO saved_loadouts (id, clerk_user_id, name, world, loadout_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ('loadout', 'owner-a', 'Keep me', 'vanilla', json.dumps({'version': 1, 'items': []}), '2026', '2026'))
insert('owner-a', '{"version":1,"world":"tr"}')
insert('owner-b', '{"version":1,"world":"vanilla"}')
assert con.execute('SELECT count(*) FROM account_profiles').fetchone()[0] == 0
assert con.execute('SELECT name FROM saved_loadouts').fetchone()[0] == 'Keep me'
assert con.execute('SELECT count(*) FROM account_settings').fetchone()[0] == 2
assert con.execute('SELECT settings_json FROM account_settings WHERE clerk_user_id=?', ('owner-b',)).fetchone()[0] == '{"version":1,"world":"vanilla"}'
`);
});

test('proposed SQL rejects malformed JSON, null/missing versions, arrays, empty owners and invalid revisions', () => {
  sqlite(`
for document in ['bad json', '[]', 'null', '{}', '{"version":null}', '{"version":"1"}', '{"version":true}', '{"version":0}', '{"version":1.5}']:
    rejected('bad-owner', document)
for owner in ['', '   ']:
    rejected(owner, '{"version":1}')
for revision in [0, -1, 1.5]:
    rejected('bad-revision', '{"version":1}', revision)
insert('future-version', '{"version":2,"future":{"enabled":true}}')
assert con.execute('SELECT count(*) FROM account_settings').fetchone()[0] == 1
`);
});

test('SQL bounds UTF-8 bytes rather than character count and preserves unknown future fields', () => {
  sqlite(`
prefix, suffix = '{"version":1,"extra":"', '"}'
exact = prefix + 'x' * (16384 - len((prefix + suffix).encode('utf-8'))) + suffix
assert len(exact.encode('utf-8')) == 16384
insert('exact-limit', exact)
rejected('too-large', exact[:-2] + 'x' + suffix)
wide = json.dumps({'version': 1, 'extra': '界' * 6000}, ensure_ascii=False)
assert len(wide) < 16384 and len(wide.encode('utf-8')) > 16384
rejected('wide', wide)
assert json.loads(con.execute('SELECT settings_json FROM account_settings WHERE clerk_user_id=?', ('exact-limit',)).fetchone()[0])['extra'].startswith('xxx')
`);
});

test('revision checked writes isolate owners and reject stale updates and simultaneous first writes', () => {
  sqlite(`
insert('owner-a', '{"version":1,"world":"vanilla"}')
insert('owner-b', '{"version":1,"world":"tr"}')
def update(owner, revision, document):
    return con.execute('UPDATE account_settings SET settings_json=?, revision=revision+1, updated_at=? WHERE clerk_user_id=? AND revision=?',
        (document, '2026-09-30T00:01:00Z', owner, revision)).rowcount
assert update('owner-a', 1, '{"version":1,"world":"tr_arce"}') == 1
assert update('owner-a', 1, '{"version":1,"world":"vanilla"}') == 0
assert update('missing-owner', 1, '{"version":1}') == 0
assert con.execute('SELECT revision FROM account_settings WHERE clerk_user_id=?', ('owner-a',)).fetchone()[0] == 2
assert con.execute('SELECT settings_json, revision FROM account_settings WHERE clerk_user_id=?', ('owner-b',)).fetchone() == ('{"version":1,"world":"tr"}', 1)
sql = 'INSERT INTO account_settings (clerk_user_id, settings_json, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(clerk_user_id) DO NOTHING'
assert con.execute(sql, ('new-owner', '{"version":1}', '2026', '2026')).rowcount == 1
assert con.execute(sql, ('new-owner', '{"version":1,"world":"tr"}', '2026', '2026')).rowcount == 0
assert con.execute('SELECT settings_json FROM account_settings WHERE clerk_user_id=?', ('new-owner',)).fetchone()[0] == '{"version":1}'
`);
});
