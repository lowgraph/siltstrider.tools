const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');

test('Worker authentication accepts only verified session owners', async () => {
  const { authenticateUser } = await import('../cloudflare/auth.mjs');
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
    APP_ORIGIN: 'http://localhost:8765',
    CLERK_PUBLISHABLE_KEY: 'pk_test_' + Buffer.from('example.clerk.accounts.dev$').toString('base64'),
    CLERK_SECRET_KEY: 'sk_test_not_a_real_secret', CLERK_JWT_KEY: key,
    DB: { prepare(sql) { return { bind(...values) { return { async run() { inserts.push({ sql, values }); return { success: true }; } }; } }; } },
  };
  function request(jwt) {
    return new Request('http://localhost:8765/api/saves', { method: 'POST', headers: jwt ? { Authorization: 'Bearer ' + jwt } : {}, body: JSON.stringify({ clerk_user_id: 'user_attacker' }) });
  }
  for (const jwt of [null, 'invalid', token({ exp: now - 60 }), token({ azp: 'https://attacker.example' })]) {
    assert.equal((await authenticateUser(request(jwt), env)).response.status, 401);
  }
  assert.equal(inserts.length, 0);
  const auth = await authenticateUser(request(token()), env);
  assert.equal(auth.authenticated, true);
  assert.equal(auth.userId, 'user_verified');
});

test('Worker permanently redirects www.siltstrider.tools requests to https://siltstrider.tools', async () => {
  const worker = (await import('../cloudflare/worker.mjs')).default;
  const req = new Request('http://www.siltstrider.tools/builder?build=test123');
  const res = await worker.fetch(req, {}, {});
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), 'https://siltstrider.tools/builder?build=test123');
});

