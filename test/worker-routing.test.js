const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../wrangler.jsonc'), 'utf8'));

test('only the API runs the Worker; everything else is served as a static asset', () => {
  const { assets } = config();
  // Every Worker invocation counts against the plan's request allowance. A first visit
  // to /builder makes about 18 requests; with the Worker first for all of them, a busy
  // launch day could exhaust the free allowance and take the site down.
  assert.deepEqual(assets.run_worker_first, ['/api/*']);
  assert.equal(assets.not_found_handling, '404-page', 'unknown paths get the 404 page without the Worker');
  assert.equal(assets.binding, 'ASSETS');
});

test('the Worker still owns every API route and the www redirect for them', async (t) => {
  t.mock.method(console, 'error', () => {});
  const { default: worker } = await import('../cloudflare/worker.mjs');
  const env = { APP_ORIGIN: 'https://siltstrider.tools' };
  const redirect = await worker.fetch(new Request('https://www.siltstrider.tools/api/saves?x=1'), env);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get('Location'), 'https://siltstrider.tools/api/saves?x=1');
  // With no ASSETS binding a path outside the API falls through to a 404; an API path is
  // answered by the API itself (here 503: this test environment has no sign-in secret).
  const api = await worker.fetch(new Request('https://siltstrider.tools/api/account'), { ...env, DB: {} });
  assert.notEqual(api.status, 404);
  assert.match(api.headers.get('Content-Type') || '', /application\/json/);
  const page = await worker.fetch(new Request('https://siltstrider.tools/builder'), env);
  assert.equal(page.status, 404, 'pages are not the Worker\'s job');
  for (const route of ['/api/saves', '/api/saves/some-id', '/api/account', '/api/entitlements', '/api/premium/code', '/api/webhooks/kofi']) {
    assert.ok(config().assets.run_worker_first.some(pattern => new RegExp('^' + pattern.replace('*', '.*') + '$').test(route)), route);
  }
});
