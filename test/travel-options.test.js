const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../lib/travel-options.mjs');
const SAVE = { formatVersion: 37, identity: { name: 'Traveller', race: 'Breton', class: { id: 'mage' }, cell: 'Balmora', level: 2 },
  vitals: { magicka: { current: 40, max: 40 }, timePlayedSeconds: 1234 }, stuff: { spells: ['divine intervention'], inventory: [] } };
const storage = () => {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};

test('Travel save keys survive codec restore and changed load tokens, and isolate profiles and snapshots', async () => {
  const { travelSaveKey } = await load();
  const { serializeOmwSave, deserializeOmwSave } = await import('../lib/cloud-save-codec.mjs');
  const restored = deserializeOmwSave(serializeOmwSave(SAVE));
  assert.equal(travelSaveKey(restored), travelSaveKey(SAVE));
  assert.equal(travelSaveKey({ ...SAVE, token: 99 }), travelSaveKey(SAVE), 'transient load tokens are not identity');
  assert.notEqual(travelSaveKey(SAVE, 'vanilla'), travelSaveKey(SAVE, 'tr_arce'));
  assert.notEqual(travelSaveKey(SAVE), travelSaveKey({ ...SAVE, vitals: { ...SAVE.vitals, timePlayedSeconds: 1235 } }));
  assert.equal(travelSaveKey(null), null);
  assert.equal(travelSaveKey(SAVE, 'bad-profile'), null);
});

test('overrides persist false values and removed held items, while defaults and input remain intact', async () => {
  const { travelSaveKey, readTravelOverrides, writeTravelOverrides, applyTravelOverrides } = await load();
  const key = travelSaveKey(SAVE), store = storage();
  const edits = Object.freeze({ divine: false, mageGuild: false, carried: 12.5, held: Object.freeze({ index: false, amulet: true }) });
  assert.equal(writeTravelOverrides(key, edits, store), true);
  assert.deepEqual(readTravelOverrides(key, store), edits);
  const defaults = { divine: true, mageGuild: true, held: new Set(['index', 'new_item']), carried: 99, levitate: 0 };
  const restored = applyTravelOverrides(defaults, readTravelOverrides(key, store));
  assert.equal(restored.divine, false);
  assert.equal(restored.mageGuild, false);
  assert.equal(restored.carried, 12.5);
  assert.deepEqual([...restored.held], ['new_item', 'amulet']);
  assert.deepEqual([...defaults.held], ['index', 'new_item']);
  assert.equal(defaults.carried, 99);
});

test('reset affects only this save/profile and the bounded store retains the latest twenty snapshots', async () => {
  const { travelSaveKey, readTravelOverrides, writeTravelOverrides, TRAVEL_OPTIONS_KEY } = await load();
  const store = storage(), key = travelSaveKey(SAVE), other = travelSaveKey(SAVE, 'tr');
  writeTravelOverrides(key, { mageGuild: false }, store);
  writeTravelOverrides(other, { divine: true }, store);
  writeTravelOverrides(key, {}, store);
  assert.deepEqual(readTravelOverrides(key, store), {});
  assert.deepEqual(readTravelOverrides(other, store), { divine: true });
  for (let i = 0; i < 21; i++) writeTravelOverrides(travelSaveKey({ ...SAVE, identity: { ...SAVE.identity, name: `Player ${i}` } }), { carried: i }, store);
  assert.equal(Object.keys(JSON.parse(store.getItem(TRAVEL_OPTIONS_KEY)).saves).length, 20);
  assert.deepEqual(readTravelOverrides(travelSaveKey({ ...SAVE, identity: { ...SAVE.identity, name: 'Player 0' } }), store), {});
});

test('malformed values, prototype keys, corrupt records, denied storage and quota limits fail safely', async () => {
  const { travelSaveKey, cleanTravelOverrides, readTravelOverrides, writeTravelOverrides, TRAVEL_OPTIONS_KEY } = await load();
  const clean = cleanTravelOverrides(JSON.parse('{"divine":"false","mageGuild":false,"carried":-1,"levitate":101,"held":{"__proto__":true,"constructor":true,"ok":false,"bad":1},"followers":9}'));
  assert.deepEqual(clean, { mageGuild: false, held: { ok: false } });
  assert.deepEqual(cleanTravelOverrides({ carried: NaN, levitate: Infinity, held: [] }), {});
  const key = travelSaveKey(SAVE), store = storage();
  for (const raw of ['not json', '{"version":2,"saves":{}}', '{"version":1,"saves":[]}', 'x'.repeat(250001)]) {
    store.setItem(TRAVEL_OPTIONS_KEY, raw);
    assert.deepEqual(readTravelOverrides(key, store), {});
  }
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('full'); } };
  assert.deepEqual(readTravelOverrides(key, denied), {});
  assert.equal(writeTravelOverrides(key, { divine: false }, denied), false);
  assert.equal(writeTravelOverrides(key, {}, null), false);
  assert.equal(writeTravelOverrides('__proto__', { divine: true }, store), false);
});
