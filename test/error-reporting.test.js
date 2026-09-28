const { test } = require('node:test');
const assert = require('node:assert/strict');

const env = { APP_ORIGIN: 'https://siltstrider.tools' };
const load = () => import('../cloudflare/error-reporting.mjs');
function capture(t) {
  const entries = [];
  t.mock.method(console, 'error', (entry) => entries.push(entry));
  return entries;
}

test('a rejected handler hides private details and correlates the response with one log', async (t) => {
  const logs = capture(t);
  const { withErrorReporting } = await load();
  const request = new Request('https://siltstrider.tools/api/saves/private-id?build=private-build', {
    method: 'PUT', headers: { Authorization: 'Bearer private-token', 'X-Request-Id': 'forged-id' }, body: 'private-save',
  });
  const response = await withErrorReporting(async () => { throw new Error('SQL private-save private-token'); })(request, env);
  const body = await response.json();
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), env.APP_ORIGIN);
  assert.equal(body.requestId, response.headers.get('X-Request-Id'));
  assert.match(body.requestId, /^[0-9a-f-]{36}$/);
  assert.match(body.message, new RegExp(body.requestId));
  assert.equal(logs.length, 1);
  assert.equal(logs[0].requestId, body.requestId);
  assert.equal(logs[0].route, '/api/saves/:id');
  assert.equal(logs[0].failure, 'exception');
  assert.doesNotMatch(JSON.stringify([logs, body]), /private|forged|SQL|Bearer/);
});

test('handled 503 responses are counted, sanitized, and preserve retry timing', async (t) => {
  const logs = capture(t);
  const { withErrorReporting } = await load();
  const response = await withErrorReporting(async () => Response.json({ message: 'private database details' }, {
    status: 503, headers: { 'Retry-After': '30' },
  }))(new Request('https://siltstrider.tools/api/webhooks/kofi'), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Retry-After'), '30');
  assert.equal((await response.json()).error, 'SERVICE_UNAVAILABLE');
  assert.equal(logs[0].failure, 'http');
  assert.equal(logs[0].route, '/api/webhooks/kofi');
});

test('successful streams, redirects and expected 4xx errors are untouched and not logged', async (t) => {
  const logs = capture(t);
  const { withErrorReporting } = await load();
  for (const status of [200, 301, 400, 401, 403, 404, 409, 413, 429]) {
    const original = new Response('original', { status });
    const response = await withErrorReporting(async () => original)(new Request('https://siltstrider.tools/api/account'), env);
    assert.equal(response, original);
    assert.equal(await response.text(), 'original');
  }
  assert.deepEqual(logs, []);
});

test('non-Error throws, unknown paths, and HEAD requests still receive safe references', async (t) => {
  const logs = capture(t);
  const { withErrorReporting } = await load();
  for (const path of ['/api/private-name', '/private-name?token=private']) {
    const response = await withErrorReporting(async () => { throw null; })(new Request(`https://siltstrider.tools${path}`, { method: 'HEAD' }), env);
    assert.equal(response.status, 500);
    assert.equal(await response.text(), '');
    assert.ok(response.headers.get('X-Request-Id'));
  }
  assert.deepEqual(logs.map(e => e.route), ['/api/other', 'assets']);
  assert.notEqual(logs[0].requestId, logs[1].requestId);
  assert.doesNotMatch(JSON.stringify(logs), /private/);
});

test('the actual Worker catches asset failures and missing service bindings', async (t) => {
  const logs = capture(t);
  const { default: worker } = await import('../cloudflare/worker.mjs');
  const response = await worker.fetch(new Request('https://siltstrider.tools/'), {
    ...env, ASSETS: { fetch: async () => { throw new Error('private binding failure'); } },
  });
  assert.equal(response.status, 500);
  const unavailable = await worker.fetch(new Request('https://siltstrider.tools/api/saves'), env);
  assert.equal(unavailable.status, 503);
  assert.equal(logs.length, 2);
});
