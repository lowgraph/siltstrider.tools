/* Signed-in Cloud Vault checks on the local test site (scripts/local-stack.cjs), without Clerk.
 * Each run makes an RSA key, gives the local Worker only its public half (CLERK_JWT_KEY, which
 * Clerk's own verifier reads, as in production's offline mode), signs session tokens for
 * made-up users, and puts a small stand-in for Clerk's browser object on each page before the
 * site's scripts run. Everything else is real: the built pages, the Worker and a fresh local
 * database. Clerk's sign-in screens and the production keys are not tested here; the local
 * site with the Clerk development instance, and the owner's production check, cover them.
 *
 *   node scripts/test-vault.cjs --axe-path <axe.min.js> [--out <dir>] [--port 8788]
 *        [--no-build] [--filter <text>] [--chrome <path>]
 *
 * Nothing is downloaded. Output (report.json, screenshots, axe results, the Worker log) goes to
 * --out, by default under A:/Cache.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { generateKeyPairSync, sign } = require('node:crypto');
const assert = require('node:assert/strict');
const stack = require('./local-stack.cjs');
// Its own build, so it can rebuild while the Clerk-mode local site serves .next-export-local.
const EXPORT_DIR = '.next-export-vault';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const port = Number(option('--port', 8788));
const filter = option('--filter', '');
const output = path.resolve(option('--out', `A:/Cache/vault-browser-${Date.now()}`));
const chromePath = option('--chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const axePath = option('--axe-path', process.env.BROWSER_AXE_PATH);
if (!axePath || !fs.existsSync(axePath)) throw Error('Provide --axe-path pointing to an installed axe.min.js.');
const axeSource = fs.readFileSync(axePath, 'utf8');
fs.mkdirSync(output, { recursive: true });
const state = path.join(output, 'state');
fs.rmSync(state, { recursive: true, force: true });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = { started: new Date().toISOString(), cases: [], runtimeErrors: [], serverErrors: [] };

// The key pair for this run. Clerk reads a one-line PEM (its loader strips the line breaks).
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = publicKey.export({ type: 'spki', format: 'pem' }).replace(/\r?\n/g, '');
// A placeholder instance and secret, as in test/worker-auth.test.js: Clerk's library wants a secret
// key, but with CLERK_JWT_KEY it checks tokens locally and calls no Clerk instance.
const placeholderKey = 'pk_test_' + Buffer.from('silt-local-test.clerk.accounts.dev$').toString('base64');
const envFile = path.join(output, 'vault.env');
fs.writeFileSync(envFile, `CLERK_JWT_KEY=${pem}\nCLERK_PUBLISHABLE_KEY=${placeholderKey}\nCLERK_SECRET_KEY=sk_test_placeholder_not_a_real_secret\n`);

const ALICE = { id: 'user_vault_alice', fullName: 'Alice Tester', firstName: 'Alice', username: 'alice', primaryEmailAddress: { emailAddress: 'alice+clerk_test@example.com' } };
const BOB = { id: 'user_vault_bob', fullName: 'Bob Tester', firstName: 'Bob', username: 'bob', primaryEmailAddress: { emailAddress: 'bob+clerk_test@example.com' } };
let origin, api;

function token(user, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: user.id, sid: `sess_${user.id}`, iss: 'https://silt-local-test.clerk.accounts.dev', azp: origin, iat: now, nbf: now - 5, exp: now + 3600, ...overrides };
  const data = [{ alg: 'RS256', typ: 'JWT', kid: 'vault-test' }, claims].map((part) => Buffer.from(JSON.stringify(part)).toString('base64url')).join('.');
  return `${data}.${sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url')}`;
}
async function request(method, pathname, { user, jwt = user && token(user), body } = {}) {
  const headers = { Origin: origin };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(api + pathname, { method, headers, body: body && JSON.stringify(body) });
  return { status: response.status, body: await response.json().catch(() => null) };
}
const seedBuild = (name, race = 'Nord', className = 'Warrior') => ({ saveType: 'character_build', name, data: { version: 1, name, race, gender: 'Male', className, sign: 'The Warrior', maj: [], min: [] } });

/* ---------- browser ---------- */
let send, evaluate;
const loaded = new Set();
async function connect(profile) {
  let devtools;
  for (let i = 0; i < 100 && !devtools; i++) { try { devtools = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { await pause(100); } }
  if (!devtools) throw Error('Chrome did not start.');
  const targets = await (await fetch(`http://127.0.0.1:${devtools}/json`)).json();
  const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
  let id = 0; const pending = new Map();
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error(`CDP timeout: ${method}`)); }, 45000);
    pending.set(n, { resolve, reject, timer }); socket.send(JSON.stringify({ id: n, method, params }));
  });
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id) { const p = pending.get(msg.id); if (p) { pending.delete(msg.id); clearTimeout(p.timer); msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result); } }
    if (msg.method === 'Page.lifecycleEvent' && msg.params.name === 'load') loaded.add(msg.params.loaderId);
    if (msg.method === 'Runtime.exceptionThrown') report.runtimeErrors.push({ case: current, message: msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text });
    if (msg.method === 'Network.responseReceived' && msg.params.response.url.startsWith(origin) && msg.params.response.status >= 500) report.serverErrors.push({ case: current, url: new URL(msg.params.response.url).pathname, status: msg.params.response.status });
  });
  evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  for (const domain of ['Page', 'Runtime', 'Network']) await send(`${domain}.enable`);
  await send('Page.setLifecycleEventsEnabled', { enabled: true });
  return socket;
}
async function until(expression, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await evaluate(`Boolean(${expression})`).catch(() => false)) return; await pause(100); }
  throw Error(`Timed out: ${expression}`);
}
async function open(route) {
  const navigation = await send('Page.navigate', { url: `${origin}${route}` });
  if (navigation.errorText) throw Error(`Navigation failed: ${navigation.errorText}`);
  const deadline = Date.now() + 30000;
  while (navigation.loaderId && !loaded.has(navigation.loaderId) && Date.now() < deadline) await pause(100);
  await until('document.readyState === "complete" && document.querySelector("main")');
}
async function viewport(width) { await send('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: false }); }
async function screenshot(name) { fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64')); }
async function key(keyName, code, number, modifiers = 0) {
  for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: keyName, code, windowsVirtualKeyCode: number, modifiers });
  await pause(60);
}
async function click(selector) {
  const box = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, button: 'left', clickCount: 1, ...box });
  await pause(150);
}
// A button by its text, inside `scope`; tagged so click() can find it by selector.
async function button(text, scope = 'body') {
  await evaluate(`(()=>{document.querySelectorAll('[data-vault-test]').forEach(el=>el.removeAttribute('data-vault-test'));const el=[...document.querySelectorAll(${JSON.stringify(scope)}+' button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!el)throw Error('Missing button '+${JSON.stringify(text)});el.dataset.vaultTest='1'})()`);
  await click('[data-vault-test="1"]');
}
async function type(selector, text) { await click(selector); await key('a', 'KeyA', 65, 2); await send('Input.insertText', { text }); await pause(150); }
const text = (selector = 'main') => evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent.replace(/\\s+/g,' ') || ''`);
const card = (name) => `[...document.querySelectorAll('.vault-card')].find(c=>c.querySelector('h4')?.textContent.trim()===${JSON.stringify(name)})`;
async function inCard(name, label) {
  await evaluate(`(()=>{document.querySelectorAll('[data-vault-test]').forEach(el=>el.removeAttribute('data-vault-test'));const c=${card(name)};if(!c)throw Error('No card '+${JSON.stringify(name)});const b=[...c.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b)throw Error('No '+${JSON.stringify(label)}+' on '+${JSON.stringify(name)});b.dataset.vaultTest='1'})()`);
  await click('[data-vault-test="1"]');
}
async function audit(name) {
  await evaluate(axeSource);
  const violations = await evaluate(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})))`);
  fs.writeFileSync(path.join(output, `${name}-axe.json`), JSON.stringify(violations, null, 2));
  return violations;
}
const assertAccessible = (violations, where) => assert.deepEqual(violations.map((v) => `${v.id} (${v.nodes.length})`), [], `axe on ${where}`);

// The stand-in for Clerk's browser object, installed before the site's scripts on every
// page load. The first token can be made to fail, to check the one retry with skipCache.
let stubScript = null;
async function signIn(user, { firstToken } = {}) {
  await signOut();
  const source = `(()=>{const user=${JSON.stringify(user)};const tokens={first:${JSON.stringify(firstToken || token(user))},fresh:${JSON.stringify(token(user))}};let calls=0;
    const session={id:'sess_'+user.id,status:'active',async getToken(o){calls++;return o&&o.skipCache?tokens.fresh:tokens.first;}};const state={user,session};
    window.Clerk={loaded:true,user,session,client:{sessions:[session]},addListener(l){l(state);return()=>{};},openSignIn(){},openSignUp(){},openUserProfile(){},async signOut(){}};
    window.__vaultTest={tokenCalls:()=>calls};})();`;
  stubScript = (await send('Page.addScriptToEvaluateOnNewDocument', { source })).identifier;
  // Clerk's own marker of a signed-in browser, which the site checks before loading Clerk.
  await send('Network.setCookie', { name: '__client_uat', value: String(Math.floor(Date.now() / 1000)), url: origin });
}
async function signOut() {
  if (stubScript) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: stubScript });
  stubScript = null;
  await send('Network.deleteCookies', { name: '__client_uat', url: origin });
}
async function theme(name) { await evaluate(`localStorage.setItem('silt-theme', ${JSON.stringify(name)})`); }

let current = 'setup', worker, workerLog = '';
async function check(name, run) {
  if (!name.includes(filter)) return;
  current = name;
  try { const detail = await run(); report.cases.push({ name, passed: true, detail }); console.log(`PASS ${name}`); }
  catch (error) {
    const file = name.replace(/[^a-z0-9-]/gi, '-');
    await screenshot(`${file}-failure`).catch(() => {});
    fs.writeFileSync(path.join(output, `${file}-failure.html`), await evaluate('document.documentElement.outerHTML').catch(() => ''));
    report.cases.push({ name, passed: false, error: error.stack }); console.log(`FAIL ${name}: ${error.message}`);
  }
}

/* ---------- cases ---------- */
async function cases() {
  await check('signed out: the Vault offers sign-in and shows no account', async () => {
    await signOut(); await viewport(1366); await open('/vault');
    await until('document.querySelector("main").textContent.includes("Connect Your Account for Cloud Sync")');
    assert.equal(await evaluate('document.querySelectorAll(".vault-card").length'), 0);
    assert.equal((await request('GET', '/api/saves')).status, 401, 'no token, no saves');
  });

  await check('the API: owners only, valid tokens only', async () => {
    const created = await request('POST', '/api/saves', { user: ALICE, body: seedBuild('Alice Seeded Nord') });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.save?.id || created.body.id;
    assert.ok(id, 'the new save has an id');
    assert.deepEqual((await request('GET', '/api/saves', { user: ALICE })).body.saves.map((s) => s.name), ['Alice Seeded Nord']);
    assert.deepEqual((await request('GET', '/api/saves', { user: BOB })).body.saves, [], "Bob does not see Alice's save");
    assert.equal((await request('GET', `/api/saves/${id}`, { user: BOB })).status, 404, "Bob cannot open it");
    assert.equal((await request('DELETE', `/api/saves/${id}?revision=1`, { user: BOB })).status, 404, 'or delete it');
    for (const [why, jwt] of [['expired', token(ALICE, { exp: Math.floor(Date.now() / 1000) - 120 })], ['another site', token(ALICE, { azp: 'https://attacker.example' })], ['not a token', 'not-a-token']]) {
      assert.equal((await request('GET', '/api/saves', { jwt })).status, 401, why);
    }
    return { id };
  });

  await check('signed in: save, rename, reload, load and delete through the page', async () => {
    await signIn(ALICE); await viewport(1366); await open('/vault');
    await until('document.querySelector("main").textContent.includes("1 / 5 Saves Used")');
    assert.ok(await evaluate('window.__vaultTest.tokenCalls() > 0'), 'the page asked the stand-in for a token');
    await type('main input[placeholder^="Name (e.g."]', 'Vault Test One');
    await button('Save Character to Cloud', 'main');
    await until(`${card('Vault Test One')} && document.querySelector("main").textContent.includes("2 / 5 Saves Used")`);
    await inCard('Vault Test One', 'Rename');
    await type('main .vault-card form input', 'Vault Test Renamed');
    await button('Save', 'main .vault-card form');
    await until(card('Vault Test Renamed'));
    await open('/vault');
    await until(card('Vault Test Renamed'));
    assert.match(await evaluate(`${card('Vault Test Renamed')}.textContent`), /Revision 2/, 'the rename is a new revision');
    await inCard('Alice Seeded Nord', 'Load Build →');
    await until('document.querySelector("main").textContent.includes("Loaded \\"Alice Seeded Nord\\"")');
    await button('← Character Builder', 'main');
    await until('document.getElementById("builder-race")');
    assert.equal(await evaluate('document.getElementById("builder-race").value'), 'Nord', 'the loaded build is the active character');
    assert.equal(await evaluate('document.getElementById("builder-className").value'), 'Warrior');
    await open('/vault'); await until(card('Vault Test Renamed'));
    await inCard('Vault Test Renamed', 'Delete');
    await button('Confirm', 'main');
    await until(`!${card('Vault Test Renamed')} && document.querySelector("main").textContent.includes("1 / 5 Saves Used")`);
    assert.deepEqual((await request('GET', '/api/saves', { user: ALICE })).body.saves.map((s) => s.name), ['Alice Seeded Nord']);
  });

  await check('an expired token is renewed once, and the Vault still loads', async () => {
    await signIn(ALICE, { firstToken: token(ALICE, { exp: Math.floor(Date.now() / 1000) - 120 }) });
    await open('/vault');
    await until(card('Alice Seeded Nord'));
    assert.ok(await evaluate('window.__vaultTest.tokenCalls() >= 2'), 'asked again with skipCache after the 401');
    assert.doesNotMatch(await text(), /session could not be renewed/);
  });

  await check('a damaged save is refused with a reference, and nothing of it loads', async () => {
    await signIn(ALICE); await open('/vault'); await until(card('Alice Seeded Nord'));
    const [{ results: [row] }] = stack.sql(state, "SELECT id FROM cloud_saves WHERE clerk_user_id = 'user_vault_alice' AND name = 'Alice Seeded Nord'");
    stack.sql(state, `UPDATE cloud_saves SET payload_hash = '${'0'.repeat(64)}' WHERE id = '${row.id}'`);
    await inCard('Alice Seeded Nord', 'Load Build →');
    await until('document.querySelector("main").textContent.includes("no longer matches the checksum")');
    assert.match(await text(), /Reference: [0-9a-f-]{36}/, 'a reference to quote');
    assert.doesNotMatch(await text(), /Loaded "Alice Seeded Nord"/);
    const api = await request('GET', `/api/saves/${row.id}`, { user: ALICE });
    assert.equal(api.status, 422);
    assert.equal(api.body.error, 'INTEGRITY_ERROR');
    assert.equal(api.body.save, undefined, 'nothing of the save');
    await pause(300);
    assert.match(workerLog, /save_integrity_failed/, 'the Worker logged the reference');
  });

  await check('a full free quota blocks a new save; a supporter gets 25 slots', async () => {
    for (let i = 1; i <= 5; i++) assert.equal((await request('POST', '/api/saves', { user: BOB, body: seedBuild(`Bob ${i}`) })).status, 201);
    const sixth = await request('POST', '/api/saves', { user: BOB, body: seedBuild('Bob 6') });
    assert.equal(sixth.status, 409); assert.equal(sixth.body.error, 'QUOTA_EXCEEDED');
    await signIn(BOB); await open('/vault');
    await until('document.querySelector("main").textContent.includes("5 / 5 Saves Used")');
    assert.match(await text(), /Capacity reached/);
    assert.equal(await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Save Character to Cloud').disabled`), true);
    stack.sql(state, "INSERT INTO user_tiers (clerk_user_id, tier, max_saves, created_at, updated_at) VALUES ('user_vault_bob', 'supporter', 25, datetime('now'), datetime('now'))");
    await open('/vault');
    await until('document.querySelector("main").textContent.includes("5 / 25 Saves Used")');
    assert.match(await text(), /Supporter Tier: 25/);
    assert.doesNotMatch(await text(), /Capacity reached/);
    assert.equal((await request('POST', '/api/saves', { user: BOB, body: seedBuild('Bob 6') })).status, 201, 'the sixth save fits now');
  });

  for (const name of ['morrowind', 'ashfall']) {
    for (const width of [1366, 375]) {
      await check(`signed-in pages and the Vault window, axe/${name}/${width}`, async () => {
        await signIn(ALICE); await viewport(width); await theme(name);
        await open('/vault'); await until(card('Alice Seeded Nord'));
        await inCard('Alice Seeded Nord', 'Rename'); await until('document.querySelector("main .vault-card form input")');
        assertAccessible(await audit(`vault-${name}-${width}`), `/vault with a card being renamed`);
        await screenshot(`vault-${name}-${width}`);
        await open('/builder');
        await evaluate('window.dispatchEvent(new CustomEvent("silt-open-vault"))');
        // Wait for the count: the line shows the default 0 until the entitlements arrive.
        await until('document.querySelector("[role=dialog] .cloud-vault-account")?.textContent.includes("1 / 5")');
        const line = await evaluate(`(()=>{const el=document.querySelector('[role=dialog] .cloud-vault-account');return {shown:getComputedStyle(el).display!=='none',text:el.textContent.replace(/\\s+/g,' ').trim()}})()`);
        assert.equal(line.shown, width >= 640, `the account line ${width >= 640 ? 'shows' : 'is hidden'} at ${width} px`);
        assert.match(line.text, /Alice Tester.*Free Tier · 1 \/ 5 Saves/);
        await until(`[...document.querySelectorAll('[role=dialog] h4')].some(h=>h.textContent.includes('Alice Seeded Nord'))`);
        assertAccessible(await audit(`vault-window-${name}-${width}`), 'the Vault window');
        await screenshot(`vault-window-${name}-${width}`);
        await open('/account');
        await until('!document.querySelector("main").textContent.includes("Loading")', 10000).catch(() => {});
        assertAccessible(await audit(`account-${name}-${width}`), '/account signed in');
        await screenshot(`account-${name}-${width}`);
        assert.equal(await evaluate('document.querySelector("section[aria-label=Premium] h2")?.textContent'), 'Become a Premium supporter', 'a section heading under the page h1');
        await evaluate('document.querySelector("section[aria-label=Premium]").scrollIntoView({block:"center"})');
        await screenshot(`account-premium-${name}-${width}`);
        return line;
      });
    }
  }
}

(async () => {
  if (!args.includes('--no-build')) {
    let key = placeholderKey;
    try { key = stack.developmentKeys(undefined, { secret: false }).CLERK_PUBLISHABLE_KEY; } catch {}
    stack.build(key, EXPORT_DIR);
  }
  if (stack.builtKey(EXPORT_DIR) === null) throw Error('No build for the suite yet: run without --no-build.');
  const started = stack.start({ port, state, envFiles: [envFile], assetsDir: EXPORT_DIR, stdio: ['ignore', 'pipe', 'pipe'] });
  worker = started.child; origin = started.origin; api = started.api;
  for (const stream of [worker.stdout, worker.stderr]) stream.on('data', (chunk) => { workerLog += chunk; });
  await stack.ready(`${api}/`);
  const profile = fs.mkdtempSync(path.join(output, 'chrome-'));
  const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let socket;
  try {
    socket = await connect(profile);
    await open('/about');
    await cases();
  } finally {
    socket?.close(); chrome.kill(); worker.kill();
  }
})().catch((error) => { report.cases.push({ name: current, passed: false, error: error.stack }); console.log(`FAIL ${current}: ${error.message}`); })
  .finally(() => {
    fs.writeFileSync(path.join(output, 'worker.log'), workerLog);
    report.finished = new Date().toISOString();
    report.failed = report.cases.filter((c) => !c.passed).length + report.runtimeErrors.length + report.serverErrors.length + (report.cases.length ? 0 : 1);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ cases: report.cases.length, failed: report.failed, runtimeErrors: report.runtimeErrors.length, serverErrors: report.serverErrors.length, output }));
    process.exitCode = report.failed ? 1 : 0;
  });
