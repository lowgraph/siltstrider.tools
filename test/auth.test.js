const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { createServer, renderPage } = require('../archive/legacy/scripts/dev-server.cjs');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const publicKey = 'pk_test_' + Buffer.from('example.clerk.accounts.dev$').toString('base64');
const tick = () => new Promise(resolve => setImmediate(resolve));
function page(t, { key = publicKey, url = 'http://localhost:8765/', fail = false, sdk = true } = {}) {
  const calls = [];
  let listener;
  const clerk = {
    user: null, session: null,
    async load(options) { clerk.options = options; calls.push('load'); if (fail) throw new Error('Internal SDK failure'); },
    addListener(fn) { listener = fn; },
    mountUserButton(el) { el.textContent = 'Account'; calls.push('mount'); },
    unmountUserButton(el) { el.textContent = ''; calls.push('unmount'); },
    openSignIn(options) { calls.push(['sign-in', options.forceRedirectUrl]); },
    openSignUp(options) { calls.push(['sign-up', options.forceRedirectUrl]); }
  };
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(renderPage(html, key), { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      if (sdk) { w.Clerk = clerk; w.__internal_ClerkUICtor = {}; }
      Object.defineProperty(w.navigator, 'locks', { value: { request: async (_, __, fn) => fn() } });
    }
  });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  return { w: dom.window, clerk, calls, notify: (state = { user: clerk.user, session: clerk.session }) => listener(state) };
}

test('account controls follow emitted session changes before SDK getters update', async t => {
  const { w, clerk, calls, notify } = page(t);
  await w.siltStriderAuth.ready();
  const state = { user: { id: 'user_new' }, session: { id: 'session_new' } };
  notify(state);
  assert.equal(clerk.session, null);
  assert.equal(w.document.getElementById('account-status').textContent, 'Signed in');
  assert.equal(w.document.getElementById('account-sign-in').hidden, true);
  assert.equal(w.document.getElementById('account-user').hidden, false);
  notify(state);
  assert.equal(calls.filter(c => c === 'mount').length, 1);
  Object.assign(clerk, state);
  notify({ user: null, session: null });
  assert.equal(w.document.getElementById('account-sign-in').hidden, false);
  assert.equal(w.document.getElementById('account-user').hidden, true);
  assert.equal(calls.filter(c => c === 'unmount').length, 1);
});

test('auth completion returns to a permalink without signalling a document unload', async t => {
  const { w, clerk, notify } = page(t);
  await w.siltStriderAuth.ready();
  w.showView('builder');
  const before = JSON.stringify(w.getCurrentCharacter());
  const href = w.location.href;
  for (const navigate of [clerk.options.routerPush, clerk.options.routerReplace]) {
    let unloading = false;
    const windowNavigate = () => { unloading = true; };
    notify({ user: undefined, session: undefined });
    await navigate(href, { windowNavigate });
    assert.equal(unloading, false, 'same-document navigation must allow Clerk to finish setActive');
    if (!unloading) notify({ user: { id: 'test' }, session: { id: 'test' } });
    assert.equal(w.document.getElementById('account-status').textContent, 'Signed in');
    assert.equal(w.location.href, href);
    assert.equal(JSON.stringify(w.getCurrentCharacter()), before);
  }
  await clerk.options.routerPush('#home&world=vanilla&arce=0', { windowNavigate: () => assert.fail('hash navigation unloaded') });
  assert.equal(w.document.getElementById('panel-home').hidden, false);
  const forwarded = [];
  for (const target of ['/callback', '/?__clerk_sync=1', 'https://example.com/verify']) {
    await clerk.options.routerPush(target, { windowNavigate: to => forwarded.push(to) });
  }
  assert.deepEqual(forwarded, ['http://localhost:8765/callback', 'http://localhost:8765/?__clerk_sync=1', 'https://example.com/verify']);
});

test('sign-in and sign-up retain the current sheet link; account changes do not touch local saves', async t => {
  const { w, clerk, calls, notify } = page(t);
  await w.siltStriderAuth.ready();
  w.showView('builder');
  const character = JSON.stringify(w.getCurrentCharacter());
  await w.saveCharacter('Local only', w.getCurrentCharacter());
  const stored = w.localStorage.getItem('siltstrider-saved-characters');
  w.document.getElementById('account-sign-in').click(); await tick();
  w.document.getElementById('account-sign-up').click(); await tick();
  assert.deepEqual(calls.filter(Array.isArray), [['sign-in', w.location.href], ['sign-up', w.location.href]]);
  assert.equal(await w.siltStriderAuth.getToken(), null);
  clerk.user = { id: 'user_test' }; clerk.session = { getToken: async () => 'test-token' }; notify(); notify();
  assert.equal(w.document.getElementById('account-sign-in').hidden, true);
  assert.equal(w.document.getElementById('account-user').hidden, false);
  assert.equal(calls.filter(c => c === 'mount').length, 1);
  assert.equal(await w.siltStriderAuth.getToken(), 'test-token');
  clerk.user = clerk.session = null; notify();
  assert.equal(w.document.getElementById('account-sign-up').hidden, false);
  assert.equal(w.document.getElementById('account-user').hidden, true);
  assert.equal(w.localStorage.getItem('siltstrider-saved-characters'), stored);
  assert.equal(JSON.stringify(w.getCurrentCharacter()), character);
});

test('SDK failures are recoverable and do not block editing or local persistence', async t => {
  const { w, clerk } = page(t, { fail: true });
  await assert.rejects(w.siltStriderAuth.ready());
  assert.equal(w.document.getElementById('account-sign-in').disabled, false);
  assert.match(w.document.getElementById('account-status').textContent, /unavailable/);
  assert.doesNotMatch(w.document.getElementById('account-status').textContent, /Internal SDK/);
  await w.saveCharacter('Offline save', w.getCurrentCharacter());
  assert.equal(w.loadSavedCharacters().records.length, 1);
  clerk.load = async () => {};
  await w.siltStriderAuth.ready();
  assert.equal(w.document.getElementById('account-status').textContent, '');
});

test('standalone file and unconfigured deployment make no authentication requests', async t => {
  const { w, calls } = page(t, { key: '', url: 'file:///index.html' });
  assert.equal(w.document.querySelectorAll('script[src]').length, 0);
  assert.deepEqual(calls, []);
  w.document.getElementById('account-sign-in').click(); await tick();
  assert.match(w.document.getElementById('account-status').textContent, /not configured/);
});

test('development keys cannot enable authentication on the production domain', async t => {
  const { w, calls } = page(t, { url: 'https://siltstrider.tools/' });
  await assert.rejects(w.siltStriderAuth.ready(), /production configuration/);
  assert.deepEqual(calls, []);
  assert.equal(w.document.querySelectorAll('script[src]').length, 0);
});

test('blocked SDK downloads restore controls and permit a retry', async t => {
  const { w } = page(t, { sdk: false });
  const pending = w.siltStriderAuth.ready();
  const script = w.document.querySelector('script[src]');
  assert.equal(new URL(script.src).hostname, 'example.clerk.accounts.dev');
  script.dispatchEvent(new w.Event('error'));
  await assert.rejects(pending, /unavailable/);
  assert.equal(w.document.getElementById('account-sign-up').disabled, false);
  assert.equal(w.document.querySelectorAll('script[src]').length, 0);
});

test('local preview serves only the page and public key, never repository or secret files', async t => {
  const server = createServer(publicKey);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const response = await fetch(base);
  const body = await response.text();
  assert.match(body, new RegExp(publicKey));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(body, /sk_test_|sk_live_/);
  for (const file of ['/.env.local', '/.git/config', '/package.json', '/scripts/dev-server.cjs']) {
    assert.equal((await fetch(base + file)).status, 404);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  assert.throws(() => renderPage(html, '" onload="alert(1)'), /Invalid/);
});
