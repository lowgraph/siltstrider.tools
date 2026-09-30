const { test } = require('node:test');
const assert = require('node:assert/strict');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const store = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };

async function setup(t, request) {
  const { AccountSettingsSession } = await import('../lib/account-settings-client.mjs');
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const storage = store();
  const session = new AccountSettingsSession({ request, storage });
  t.after(() => session.stop());
  return { session, defaults: defaultAccountSettings, storage };
}

test('hydration and signing in never write or adopt shared-device preferences', async t => {
  const calls = [];
  const { session, defaults, storage } = await setup(t, async (method, data, signal, owner) => { calls.push({ method, owner }); return { settings: defaults(), revision: 0 }; });
  storage.setItem('mw-world', 'tr');
  await session.start(null);
  assert.equal(session.state.settings.world, 'tr');
  session.update(settings => ({ ...settings, theme: 'morrowind' }));
  await session.start('one');
  assert.equal(session.state.settings.theme, 'ashfall');
  assert.deepEqual(calls, [{ method: 'GET', owner: 'one' }]);
  assert.equal(session.state.adoptable, true);
  session.adoptGuest();
  assert.equal(session.state.settings.theme, 'morrowind');
  assert.equal(session.state.dirty, true);
});

test('account changes invalidate delayed reads and writes', async t => {
  const one = deferred();
  const { session, defaults } = await setup(t, (method, body, signal, owner) => owner === 'one' ? one.promise : Promise.resolve({ settings: { ...defaults(), world: 'tr' }, revision: 3 }));
  const loading = session.start('one');
  await session.start('two');
  one.resolve({ settings: { ...defaults(), theme: 'morrowind' }, revision: 1 });
  await loading;
  assert.equal(session.state.owner, 'two');
  assert.equal(session.state.settings.world, 'tr');
  assert.equal(session.state.settings.theme, 'ashfall');
  const write = deferred();
  session.request = () => write.promise;
  session.update(settings => ({ ...settings, world: 'vanilla' }));
  const saving = session.save();
  await session.start(null);
  write.resolve({ settings: defaults(), revision: 4 });
  await saving;
  assert.equal(session.state.owner, null);
  assert.equal(session.state.revision, 0);
});

test('a click while loading and newer edits during a write survive late responses', async t => {
  const read = deferred(), write = deferred();
  const calls = [];
  const { session, defaults } = await setup(t, (method, body) => { calls.push({ method, body }); return method === 'GET' ? read.promise : write.promise; });
  const loading = session.start('one');
  session.update(settings => ({ ...settings, world: 'tr_arce' }));
  read.resolve({ settings: { ...defaults(), theme: 'morrowind' }, revision: 2 });
  await loading;
  assert.equal(session.state.settings.world, 'tr_arce');
  assert.equal(session.state.settings.theme, 'morrowind');
  const saving = session.save();
  session.update(settings => ({ ...settings, theme: 'ashfall' }));
  write.resolve({ settings: calls[1].body.settings, revision: 3 });
  await saving;
  assert.equal(session.state.revision, 3);
  assert.equal(session.state.settings.theme, 'ashfall');
  assert.equal(session.state.dirty, true);
});

test('conflicts keep unsaved choices and require an explicit reload', async t => {
  let writes = 0;
  const { session, defaults } = await setup(t, async method => {
    if (method === 'PUT') { writes++; throw Object.assign(new Error('Changed elsewhere'), { code: 'REVISION_CONFLICT' }); }
    return { settings: defaults(), revision: 2 };
  });
  await session.start('one');
  session.update(settings => ({ ...settings, world: 'tr' }));
  await session.save();
  assert.equal(session.state.conflict, true);
  assert.equal(session.state.dirty, true);
  assert.equal(session.state.settings.world, 'tr');
  await session.save();
  assert.equal(writes, 1);
  await session.start('one');
  assert.equal(session.state.dirty, false);
  assert.equal(session.state.settings.world, 'vanilla');
});

test('a failed write keeps edits for retry; denied guest storage stays usable', async t => {
  let fail = true;
  const { session, defaults } = await setup(t, async (method, data) => {
    if (method === 'GET') return { settings: defaults(), revision: 0 };
    if (fail) throw new Error('Offline');
    return { settings: data.settings, revision: 1 };
  });
  await session.start('one');
  session.update(settings => ({ ...settings, theme: 'morrowind' }));
  await session.save();
  assert.equal(session.state.error, 'Offline');
  assert.equal(session.state.dirty, true);
  fail = false;
  await session.save();
  assert.equal(session.state.dirty, false);
  session.storage = null;
  await session.start(null);
  session.update(settings => ({ ...settings, world: 'tr' }));
  assert.equal(session.state.settings.world, 'tr');
  assert.match(session.state.error, /unavailable/);
});

test('retrying a failed initial load retains queued World and theme clicks', async t => {
  let fail = true;
  const { session, defaults } = await setup(t, async () => {
    if (fail) throw new Error('Offline');
    return { settings: { ...defaults(), toolDefaults: { travel: { objective: 'gold' } } }, revision: 7 };
  });
  await session.start('one');
  session.update(settings => ({ ...settings, world: 'tr', theme: 'morrowind' }));
  fail = false;
  await session.start('one', { keepPending: true });
  assert.equal(session.state.settings.world, 'tr');
  assert.equal(session.state.settings.theme, 'morrowind');
  assert.equal(session.state.settings.toolDefaults.travel.objective, 'gold');
  assert.equal(session.state.revision, 7);
  assert.equal(session.state.dirty, true);
});

test('an explicit choice matching loading placeholders still wins over server preferences', async t => {
  const read = deferred();
  const { session, defaults } = await setup(t, () => read.promise);
  const loading = session.start('one');
  session.update(settings => ({ ...settings, world: 'vanilla', theme: 'ashfall' }));
  read.resolve({ settings: { ...defaults(), world: 'tr', theme: 'morrowind' }, revision: 1 });
  await loading;
  assert.equal(session.state.settings.world, 'vanilla');
  assert.equal(session.state.settings.theme, 'ashfall');
});
