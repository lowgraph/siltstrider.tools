const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('node:path');
const KEY = 'siltstrider-saved-characters';
const plain = value => JSON.parse(JSON.stringify(value));
// A shared FIFO lock service models two same-origin tabs in jsdom.
function makeLocks() {
  let queue = Promise.resolve();
  return { request(key, options, callback) {
    assert.equal(key, KEY); assert.equal(options.mode, 'exclusive');
    const operation = queue.then(callback);
    queue = operation.catch(() => {});
    return operation;
  } };
}
async function load(t, { raw, hash = '', blocked = false, locks = makeLocks(), shared } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  vc.on('error', e => errors.push(String(e)));
  const dom = await JSDOM.fromFile(path.join(__dirname, '../index.html'), {
    url: 'https://saves.test/' + hash, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      if (shared) Object.defineProperty(w, 'localStorage', { value: shared });
      if (locks) Object.defineProperty(w.navigator, 'locks', { value: locks });
      if (raw !== undefined) w.localStorage.setItem(KEY, raw);
      if (blocked) Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
      w.confirm = () => true;
    }
  });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  return dom.window;
}
function choose(w, id, value) {
  const el = w.document.getElementById(id); el.value = value;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}
async function click(w, action) {
  w.document.getElementById('saved-character-' + action).click();
  for (let i = 0; i < 50 && w.document.getElementById('saved-character-name').disabled; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(w.document.getElementById('saved-character-name').disabled, false);
}
function name(w, value) { w.document.getElementById('saved-character-name').value = value; }
function select(w, id) { choose(w, 'saved-character-list', id); }
const status = w => w.document.getElementById('saved-character-status').textContent;

for (const [label, world, arce, race, cls] of [
  ['Custom', 'vanilla', false, 'Dark Elf', 'Custom'],
  ['premade class', 'vanilla', false, 'Nord', 'Mage'],
  ['TR', 'tr', false, 'Breton', 'Knight'],
  ['ARCE', 'tr', true, 'Naga', 'Farmer']
]) test(label + ' save survives reload, restores calculations, and shares without local data', async t => {
  const w = await load(t); w.setWorld(world); w.setArce(arce); w.showView('builder');
  choose(w, 'c-race', race); choose(w, 'c-class', cls);
  if (cls === 'Custom') {
    choose(w, 'c-spec', 'Magic'); choose(w, 'c-fav1', 'Intelligence');
    choose(w, 'maj0', 'Destruction'); choose(w, 'min0', 'Alchemy');
  }
  const character = plain(w.getCurrentCharacter());
  const sheet = w.document.getElementById('c-summary').innerHTML;
  w.optimizeGear(); const gear = w.document.getElementById('gear-box').innerHTML;
  name(w, label); await click(w, 'new'); assert.match(status(w), /Saved/);
  const saved = w.loadSavedCharacters().records[0];
  assert.deepEqual(plain(saved.character), character);
  assert.deepEqual(Object.keys(saved).sort(), ['character', 'createdAt', 'id', 'name', 'updatedAt', 'version']);
  const fresh = await load(t, { raw: w.localStorage.getItem(KEY), hash: '#builder&world=vanilla&arce=0' });
  assert.equal(fresh.worldMode, 'vanilla'); assert.equal(fresh.arceOn, false);
  assert.notDeepEqual(plain(fresh.getCurrentCharacter()), character); // Listing saves never auto-loads one.
  assert.equal(fresh.document.getElementById('saved-character-list').options.length, 2);
  select(fresh, saved.id); await click(fresh, 'load');
  assert.deepEqual(plain(fresh.getCurrentCharacter()), character);
  assert.equal(fresh.document.getElementById('c-summary').innerHTML, sheet);
  fresh.optimizeGear(); assert.equal(fresh.document.getElementById('gear-box').innerHTML, gear);
  assert.equal(fresh.localStorage.getItem('mw-world'), world);
  assert.equal(fresh.localStorage.getItem('mw-arce'), arce ? '1' : '0');
  assert.ok(!fresh.location.hash.includes(saved.id));
  const recipient = await load(t, { hash: fresh.location.hash });
  assert.equal(recipient.localStorage.getItem(KEY), null);
  assert.deepEqual(plain(recipient.getCurrentCharacter()), character);
});

test('multiple same-name saves have independent IDs; rename and overwrite preserve metadata', async t => {
  const w = await load(t); name(w, 'Same name'); await click(w, 'new');
  const a = plain(w.loadSavedCharacters().records[0]);
  choose(w, 'c-race', 'Nord'); name(w, 'Same name'); await click(w, 'new');
  const b = plain(w.loadSavedCharacters().records[1]);
  assert.notEqual(a.id, b.id);
  for (const saved of [a, b]) {
    select(w, saved.id); await click(w, 'load');
    assert.deepEqual(plain(w.getCurrentCharacter()), saved.character);
  }
  select(w, a.id); name(w, 'Renamed'); await click(w, 'rename');
  const renamed = plain(w.getSavedCharacter(a.id));
  assert.equal(renamed.name, 'Renamed'); assert.equal(renamed.createdAt, a.createdAt);
  assert.ok(renamed.updatedAt > a.updatedAt); assert.deepEqual(renamed.character, a.character);
  choose(w, 'c-sign', 'The Mage'); const changed = plain(w.getCurrentCharacter());
  await click(w, 'update'); const updated = plain(w.getSavedCharacter(a.id));
  assert.deepEqual(updated.character, changed); assert.equal(updated.id, a.id);
  assert.equal(updated.createdAt, a.createdAt); assert.ok(updated.updatedAt > renamed.updatedAt);
  assert.equal(w.loadSavedCharacters().records.length, 2);
  assert.deepEqual(plain(w.getSavedCharacter(b.id)), b);
  w.confirm = () => false; await click(w, 'delete'); assert.equal(w.loadSavedCharacters().records.length, 2);
  const stored = w.localStorage.getItem(KEY); await click(w, 'update'); assert.equal(w.localStorage.getItem(KEY), stored);
  w.confirm = () => true; await click(w, 'delete');
  assert.deepEqual(plain(w.loadSavedCharacters().records), [b]);
  assert.deepEqual(plain(w.getCurrentCharacter()), changed);
});

test('names are text; empty/oversized names fail without writes', async t => {
  const w = await load(t); const payload = '<img id="save-injection" src=x onerror=alert(1)>';
  name(w, payload); await click(w, 'new');
  assert.equal(w.document.getElementById('save-injection'), null);
  assert.equal(w.document.getElementById('saved-character-list').selectedOptions[0].textContent, payload);
  const original = w.localStorage.getItem(KEY);
  for (const value of ['', '   ', 'a'.repeat(101)]) {
    name(w, value); await click(w, 'new'); assert.match(status(w), /1–100/);
    assert.equal(w.localStorage.getItem(KEY), original);
  }
});

test('malformed and unsupported collections stay untouched and do not break the site', async t => {
  for (const raw of ['{broken', 'null', '{}', '{"version":2,"records":[]}']) {
    const w = await load(t, { raw });
    assert.match(w.document.getElementById('saved-character-warning').textContent, /unchanged/);
    name(w, 'New'); await click(w, 'new'); assert.equal(w.localStorage.getItem(KEY), raw);
    assert.match(status(w), /unchanged/); assert.ok(w.computeSheet(w.readPanelBuild('c')));
  }
});

test('invalid, future, and duplicate-ID records are hidden and preserved during valid mutations', async t => {
  const seed = await load(t); const character = seed.getCurrentCharacter();
  const good = plain(await seed.saveCharacter('Valid', character));
  const invalid = [null, { ...good, id: 'bad-version', version: 9 },
    { ...good, id: 'bad-character', character: { ...good.character, race: 'unknown' } },
    { ...good, id: 'bad-date', createdAt: 'tomorrow' }, { ...good, id: 'no-name', name: '' },
    { ...good, id: 'duplicate' }, { ...good, id: 'duplicate' }];
  const w = await load(t, { raw: JSON.stringify([good, ...invalid]) });
  assert.deepEqual(plain(w.loadSavedCharacters().records), [good]);
  assert.match(w.loadSavedCharacters().warning, /7/);
  assert.throws(() => w.getSavedCharacter('duplicate'));
  await assert.rejects(w.deleteSavedCharacter('bad-version'));
  await w.renameSavedCharacter(good.id, 'Still valid');
  assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)).slice(1), invalid);
  await w.deleteSavedCharacter(good.id);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)), invalid);
});

test('unavailable storage and quota errors are visible and never report success', async t => {
  const blocked = await load(t, { blocked: true });
  name(blocked, 'Blocked'); await click(blocked, 'new'); assert.match(status(blocked), /unavailable/);
  assert.ok(blocked.computeSheet(blocked.readPanelBuild('c')));
  const w = await load(t); name(w, 'Existing'); await click(w, 'new');
  const original = w.localStorage.getItem(KEY);
  w.Storage.prototype.setItem = () => { throw new w.DOMException('Full', 'QuotaExceededError'); };
  for (const action of ['new', 'update', 'rename', 'delete']) {
    name(w, 'Attempt'); await click(w, action);
    assert.match(status(w), /Could not save changes/); assert.equal(w.localStorage.getItem(KEY), original);
  }
});

test('stale selection cannot resurrect a deleted save; storage events refresh the list', async t => {
  const w = await load(t); name(w, 'One'); await click(w, 'new');
  const id = w.loadSavedCharacters().records[0].id;
  await w.deleteSavedCharacter(id); await click(w, 'load'); assert.match(status(w), /no longer available/);
  await click(w, 'update'); assert.match(status(w), /no longer available/);
  w.dispatchEvent(new w.StorageEvent('storage', { key: KEY }));
  assert.match(w.document.getElementById('saved-character-warning').textContent, /another tab/);
  select(w, id);
  assert.equal(w.document.getElementById('saved-character-load').disabled, true);
  assert.equal(w.document.getElementById('saved-character-list').value, '');
});

test('two tabs serialize additions and independent edits; stale edits cannot overwrite newer data', async t => {
  const data = new Map();
  const shared = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
  const locks = makeLocks();
  const a = await load(t, { shared, locks });
  const b = await load(t, { shared, locks });
  const character = a.getCurrentCharacter();
  const [one, two] = await Promise.all([a.saveCharacter('One', character), b.saveCharacter('Two', character)]);
  assert.equal(a.loadSavedCharacters().records.length, 2);
  await Promise.all([a.renameSavedCharacter(one.id, 'One renamed'), b.renameSavedCharacter(two.id, 'Two renamed')]);
  assert.equal(a.getSavedCharacter(one.id).name, 'One renamed');
  assert.equal(a.getSavedCharacter(two.id).name, 'Two renamed');
  const revision = a.getSavedCharacter(one.id).updatedAt;
  const attempts = await Promise.allSettled([
    a.renameSavedCharacter(one.id, 'Winner', revision),
    b.updateSavedCharacter(one.id, 'Stale', character, revision)
  ]);
  assert.equal(attempts[0].status, 'fulfilled');
  assert.equal(attempts[1].status, 'rejected');
  assert.match(attempts[1].reason.message, /another tab/);
  await assert.rejects(b.deleteSavedCharacter(one.id, revision), /another tab/);
  assert.equal(a.getSavedCharacter(one.id).name, 'Winner');
  await Promise.all([a.deleteSavedCharacter(one.id), b.saveCharacter('Three', character)]);
  assert.deepEqual(plain(a.loadSavedCharacters().records.map(r => r.name)), ['Two renamed', 'Three']);
});

test('unsupported locking fails closed while reads and character loading still work', async t => {
  const seed = await load(t);
  const record = await seed.saveCharacter('Existing', seed.getCurrentCharacter());
  const w = await load(t, { raw: seed.localStorage.getItem(KEY), locks: null });
  const original = w.localStorage.getItem(KEY);
  select(w, record.id); await click(w, 'load'); assert.match(status(w), /Loaded/);
  for (const action of ['new', 'update', 'rename', 'delete']) {
    name(w, 'Attempt'); await click(w, action);
    assert.match(status(w), /Web Locks/); assert.equal(w.localStorage.getItem(KEY), original);
  }
});

test('queued saves capture their input once and disable duplicate UI submissions', async t => {
  const locks = makeLocks();
  const w = await load(t, { locks });
  let release;
  const held = locks.request(KEY, { mode: 'exclusive' }, () => new Promise(resolve => { release = resolve; }));
  await Promise.resolve();
  name(w, 'Queued'); const original = plain(w.getCurrentCharacter());
  const saving = click(w, 'new');
  assert.equal(w.document.getElementById('saved-character-new').disabled, true);
  w.document.getElementById('saved-character-new').click();
  choose(w, 'c-race', 'Nord');
  release(); await held; await saving;
  const records = plain(w.loadSavedCharacters().records);
  assert.equal(records.length, 1); assert.deepEqual(records[0].character, original);
});

test('storage notifications preserve draft names and stale revisions until explicit reselection', async t => {
  const w = await load(t); name(w, 'Original'); await click(w, 'new');
  const record = w.loadSavedCharacters().records[0];
  name(w, 'Draft');
  await w.renameSavedCharacter(record.id, 'Other tab');
  w.dispatchEvent(new w.StorageEvent('storage', { key: KEY }));
  assert.equal(w.document.getElementById('saved-character-name').value, 'Draft');
  await click(w, 'rename'); assert.match(status(w), /another tab/);
  assert.equal(w.getSavedCharacter(record.id).name, 'Other tab');
  select(w, record.id);
  assert.equal(w.document.getElementById('saved-character-name').value, 'Other tab');
  name(w, 'Reviewed'); await click(w, 'rename');
  assert.equal(w.getSavedCharacter(record.id).name, 'Reviewed');
});
