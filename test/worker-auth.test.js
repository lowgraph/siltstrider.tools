const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

test('Worker verifies signed session JWTs and binds only their owner to INSERT', async () => {
  const { insertTestCharacter } = await import('../cloudflare/test-route.mjs');
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const key = publicKey.export({ type: 'spki', format: 'pem' });
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: 'user_verified', sid: 'sess_test', iss: 'https://example.clerk.accounts.dev', azp: 'http://localhost:8765', iat: now, nbf: now - 1, exp: now + 300 };
  function token(overrides = {}) {
    const data = [ { alg: 'RS256', typ: 'JWT', kid: 'test' }, { ...claims, ...overrides } ].map(x => Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
    return data + '.' + sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url');
  }
  const inserts = [];
  const env = {
    TEST_INSERT_ENABLED: 'true', APP_ORIGIN: 'http://localhost:8765',
    CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from('example.clerk.accounts.dev$').toString('base64'),
    CLERK_SECRET_KEY: 'sk_test_not_a_real_secret', CLERK_JWT_KEY: key,
    DB: { prepare(sql) { return { bind(...values) { return { async run() { inserts.push({ sql, values }); return { success: true }; } }; } }; } },
  };
  function request(jwt) {
    return new Request('http://localhost:8765/api/test-character', { method: 'POST', headers: jwt ? { Authorization: 'Bearer ' + jwt } : {}, body: JSON.stringify({ clerk_user_id: 'user_attacker' }) });
  }
  for (const jwt of [null, 'invalid', token({ exp: now - 60 }), token({ azp: 'https://attacker.example' })]) {
    assert.equal((await insertTestCharacter(request(jwt), env)).status, 401);
  }
  assert.equal(inserts.length, 0);
  const response = await insertTestCharacter(request(token()), env);
  assert.equal(response.status, 201, JSON.stringify(await response.clone().json()));
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].values[1], 'user_verified');
  assert.ok(!inserts[0].values.includes('user_attacker'));
  assert.equal((await insertTestCharacter(request(token()), { ...env, TEST_INSERT_ENABLED: 'false' })).status, 404);
  assert.equal(inserts.length, 1);
});

test('the fixed D1 fixture is accepted unchanged by the canonical character validator', async t => {
  const { TEST_CHARACTER } = await import('../cloudflare/test-route.mjs');
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), { url: 'http://localhost/', runScripts: 'dangerously' });
  t.after(() => dom.window.close());
  assert.deepEqual(JSON.parse(JSON.stringify(dom.window.normalizeCharacter(TEST_CHARACTER))), TEST_CHARACTER);
});
