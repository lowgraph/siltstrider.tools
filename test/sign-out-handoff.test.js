const { test } = require('node:test');
const assert = require('node:assert/strict');
const handoff = import('../lib/sign-in-handoff.mjs');
const build = { world: 'tr', arce: true, name: 'QA – Sign-out character',
  race: 'Khajiit (Cathay-raht)', sign: 'The Tower', gender: 'Female' };
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('sign-out returns the entire unsaved character once, only after signing out', async () => {
  const { keepCharacterForSignOut, takeCharacterAfterSignOut, SIGN_OUT_HANDOFF_KEY } = await handoff;
  const store = storage();
  assert.equal(keepCharacterForSignOut(build, { storage: store, now: 100 }), true);
  assert.deepEqual(takeCharacterAfterSignOut({ signedIn: false, storage: store, now: 200 }), build);
  assert.equal(store.getItem(SIGN_OUT_HANDOFF_KEY), null);
  assert.equal(takeCharacterAfterSignOut({ signedIn: false, storage: store, now: 300 }), null);
});

test('a signed-in or unknown-session return cannot consume a sign-out character as valid', async () => {
  const { keepCharacterForSignOut, takeCharacterAfterSignOut, SIGN_OUT_HANDOFF_KEY } = await handoff;
  for (const signedIn of [true, undefined]) {
    const store = storage();
    keepCharacterForSignOut(build, { storage: store, now: 100 });
    assert.equal(takeCharacterAfterSignOut({ signedIn, storage: store, now: 200 }), null);
    assert.equal(store.getItem(SIGN_OUT_HANDOFF_KEY), null, 'rejected marker is removed');
  }
});

test('expired, future-dated and malformed sign-out markers are rejected and removed', async () => {
  const { takeCharacterAfterSignOut, SIGN_OUT_HANDOFF_KEY, HANDOFF_MAX_AGE_MS } = await handoff;
  for (const raw of [
    JSON.stringify({ at: 0, build }), JSON.stringify({ at: HANDOFF_MAX_AGE_MS + 2, build }),
    '{broken', JSON.stringify({ at: HANDOFF_MAX_AGE_MS, build: [] }),
    JSON.stringify({ at: HANDOFF_MAX_AGE_MS, build: { ...build, race: '' } })
  ]) {
    const store = storage();
    store.setItem(SIGN_OUT_HANDOFF_KEY, raw);
    assert.equal(takeCharacterAfterSignOut({ signedIn: false, storage: store, now: HANDOFF_MAX_AGE_MS + 1 }), null);
    assert.equal(store.getItem(SIGN_OUT_HANDOFF_KEY), null);
  }
});

test('sign-in cancellation and sign-out restoration use separate markers', async () => {
  const { keepCharacterForSignIn, keepCharacterForSignOut, takeCharacterAfterSignIn,
    takeCharacterAfterSignOut, forgetCharacterForSignIn, SIGN_OUT_HANDOFF_KEY } = await handoff;
  const store = storage();
  keepCharacterForSignIn({ ...build, name: 'cancelled sign-in' }, { storage: store, now: 100 });
  assert.equal(takeCharacterAfterSignOut({ signedIn: false, storage: store, now: 200 }), null);
  keepCharacterForSignOut(build, { storage: store, now: 100 });
  forgetCharacterForSignIn({ storage: store });
  assert.ok(store.getItem(SIGN_OUT_HANDOFF_KEY));
  assert.equal(takeCharacterAfterSignIn({ signedIn: true, storage: store, now: 200 }), null);
  assert.deepEqual(takeCharacterAfterSignOut({ signedIn: false, storage: store, now: 200 }), build);
});

test('sign-out storage denial, missing storage and invalid input never throw', async () => {
  const { keepCharacterForSignOut, takeCharacterAfterSignOut, forgetCharacterForSignOut } = await handoff;
  const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('blocked'); } };
  for (const store of [null, denied]) {
    assert.equal(keepCharacterForSignOut(build, { storage: store }), false);
    assert.equal(takeCharacterAfterSignOut({ signedIn: false, storage: store }), null);
    assert.doesNotThrow(() => forgetCharacterForSignOut({ storage: store }));
  }
  for (const value of [null, [], 'character']) assert.equal(keepCharacterForSignOut(value, { storage: storage() }), false);
});
