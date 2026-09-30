const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

async function fixture(t) {
  const { handleSettings } = await import('../cloudflare/routes/settings.mjs');
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const db = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync(path.join(__dirname, '../cloudflare/migrations')).sort()) db.exec(fs.readFileSync(path.join(__dirname, '../cloudflare/migrations', file), 'utf8'));
  t.after(() => db.close());
  const env = { DB: { prepare: sql => ({ bind: (...values) => ({
    first: async () => db.prepare(sql).get(...values) || null,
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...values).changes) } })
  }) }) } };
  const call = (method, body, owner = 'one') => handleSettings(new Request('https://site/api/settings', {
    method, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) })
  }), env, owner);
  return { db, env, call, defaults: defaultAccountSettings };
}

test('settings GET is read-only; a username-less owner can create and update independently', async t => {
  const { call, defaults, db } = await fixture(t);
  const fresh = await call('GET');
  assert.equal(fresh.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await fresh.json(), { settings: defaults(), revision: 0 });
  assert.equal(db.prepare('SELECT count(*) AS n FROM account_settings').get().n, 0);
  const settings = { ...defaults(), world: 'tr', toolDefaults: { travel: { mageGuild: false } } };
  const created = await call('PUT', { settings, revision: 0 });
  assert.equal(created.status, 200);
  assert.equal((await created.json()).revision, 1);
  assert.equal((await (await call('GET')).json()).settings.toolDefaults.travel.mageGuild, false);
  assert.equal((await (await call('GET', undefined, 'two')).json()).revision, 0);
  const updated = await call('PUT', { settings: { ...defaults(), theme: 'morrowind' }, revision: 1 });
  assert.equal((await updated.json()).revision, 2);
  for (const table of ['cloud_saves', 'account_profiles', 'user_tiers', 'premium_payments', 'premium_support_codes']) assert.equal(db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 0);
});

test('stale writes and simultaneous first creation cannot overwrite another document', async t => {
  const { call, defaults } = await fixture(t);
  const first = await Promise.all([call('PUT', { settings: { ...defaults(), world: 'tr' }, revision: 0 }), call('PUT', { settings: defaults(), revision: 0 })]);
  assert.deepEqual(first.map(response => response.status).sort(), [200, 409]);
  assert.equal((await call('PUT', { settings: defaults(), revision: 0 })).status, 409);
  assert.equal((await call('PUT', { settings: defaults(), revision: 9 })).status, 409);
  assert.equal((await (await call('GET')).json()).settings.world, 'tr');
  assert.equal((await call('PUT', { settings: defaults(), revision: 1 }, 'two')).status, 409);
});

test('invalid documents, revisions, caller IDs and unsupported data choices are rejected', async t => {
  const { call, defaults, db } = await fixture(t);
  for (const revision of [undefined, null, -1, 1.5, '0', true, 2 ** 54]) assert.equal((await call('PUT', { settings: defaults(), revision })).status, 400);
  for (const settings of [null, [], { version: 2 }, { version: 1, unknown: 1 }, { ...defaults(), modpackId: 'pack' }, { ...defaults(), world: 'tr', modVersionId: 'old-tr' }, { version: 1, toolDefaults: { gear: { questRewards: false } } }]) assert.equal((await call('PUT', { settings, revision: 0 })).status, 400);
  assert.equal((await call('PUT', '{')).status, 400);
  assert.equal((await call('PUT', { settings: defaults(), revision: 0, clerk_user_id: 'victim' })).status, 400);
  assert.equal((await call('GET', undefined, '')).status, 401);
  assert.equal((await call('POST')).status, 405);
  assert.equal(db.prepare('SELECT count(*) AS n FROM account_settings').get().n, 0);
});

test('request limits count UTF-8 bytes even without content-length', async t => {
  const { call, defaults, db } = await fixture(t);
  const body = { settings: { ...defaults(), padding: 'é'.repeat(9000) }, revision: 0 };
  assert.equal((await call('PUT', body)).status, 413);
  assert.equal((await call('PUT', { settings: { version: 1, padding: 'x'.repeat(16400) }, revision: 0 })).status, 413);
  assert.equal(db.prepare('SELECT count(*) AS n FROM account_settings').get().n, 0);
});

test('future stored contracts and unavailable datasets report an error without erasing rows', async t => {
  const { call, db } = await fixture(t);
  for (const document of ['{"version":2,"future":true}', '{"version":1,"modpackId":"future-pack"}', '{"version":1,"world":"tr","modVersionId":"old-release"}', '{"version":1,"toolDefaults":{"gear":{"questRewards":true}}}']) {
    db.prepare('INSERT OR REPLACE INTO account_settings VALUES (?, ?, 1, ?, ?)').run('one', document, 'now', 'now');
    const response = await call('GET');
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, 'UNSUPPORTED_SETTINGS');
    assert.equal(db.prepare('SELECT settings_json FROM account_settings').get().settings_json, document);
  }
});

test('the Worker requires authentication before dispatching settings', async () => {
  const { default: worker } = await import('../cloudflare/worker.mjs');
  let touched = false;
  const response = await worker.fetch(new Request('https://siltstrider.tools/api/settings'), { DB: { prepare() { touched = true; } }, CLERK_SECRET_KEY: 'test' }, {});
  assert.equal(response.status, 401);
  assert.equal(touched, false);
});

test('the actual Worker verifies offline session tokens and isolates settings owners', async t => {
  const { generateKeyPairSync, sign } = require('node:crypto');
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const { env, defaults, db } = await fixture(t);
  const { default: worker } = await import('../cloudflare/worker.mjs');
  const origin = 'https://siltstrider.tools';
  Object.assign(env, { APP_ORIGIN: origin, CLERK_JWT_KEY: publicKey.export({ type: 'spki', format: 'pem' }),
    CLERK_SECRET_KEY: 'sk_live_mock_secret_key', CLERK_PUBLISHABLE_KEY: 'pk_live_' + Buffer.from('example.clerk.accounts.dev$').toString('base64') });
  function token(owner) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'fixture' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: owner, sid: 'sess_' + owner, iss: 'https://example.clerk.accounts.dev', azp: origin, iat: now, nbf: now - 1, exp: now + 600 })).toString('base64url');
    const unsigned = `${header}.${payload}`;
    return unsigned + '.' + sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
  }
  const request = (method, owner, body, from = origin) => new Request(origin + '/api/settings', { method,
    headers: { Authorization: 'Bearer ' + token(owner), Origin: from, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  const created = await worker.fetch(request('PUT', 'one', { settings: { ...defaults(), theme: 'morrowind' }, revision: 0 }), env, {});
  assert.equal(created.status, 200);
  assert.equal((await created.json()).revision, 1);
  const owned = await worker.fetch(request('GET', 'one'), env, {});
  assert.equal((await owned.json()).settings.theme, 'morrowind');
  const other = await worker.fetch(request('GET', 'two'), env, {});
  assert.equal((await other.json()).revision, 0);
  assert.equal((await worker.fetch(request('PUT', 'one', { settings: defaults(), revision: 1 }, 'https://untrusted.example'), env, {})).status, 403);
  assert.equal(db.prepare('SELECT count(*) AS n FROM account_profiles').get().n, 0);
  const logs = [];
  t.mock.method(console, 'error', entry => logs.push(entry));
  const broken = { ...env, DB: { prepare() { throw new Error('SQL contains private-settings and private-token'); } } };
  const failed = await worker.fetch(request('GET', 'one'), broken, {});
  assert.equal(failed.status, 500);
  assert.equal(logs[0].route, '/api/settings');
  assert.doesNotMatch(JSON.stringify([logs, await failed.json()]), /private-|SQL contains/);
});
