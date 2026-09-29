const { test } = require('node:test');
require('./helpers/pending-game-data.cjs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const Module = require('node:module');
const path = require('node:path');

const handoff = import('../lib/sign-in-handoff.mjs');
const KHAJIIT = { version: 1, world: 'tr', arce: true, name: 'Ba', race: 'Khajiit (Cathay-raht)', gender: 'Female',
  className: 'Custom', sign: 'The Thief', spec: 'Stealth', fav1: 'Agility', fav2: 'Speed',
  maj: ['Sneak', 'Acrobatics', 'Light Armor', 'Short Blade', 'Marksman'],
  min: ['Security', 'Athletics', 'Hand-to-hand', 'Mercantile', 'Speechcraft'], bitterCup: false };

function memoryStorage() {
  const items = new Map();
  return { items, getItem: k => (items.has(k) ? items.get(k) : null), setItem: (k, v) => items.set(k, String(v)), removeItem: k => items.delete(k) };
}

test('a character kept for sign-in comes back once, only after a real sign-in', async () => {
  const { keepCharacterForSignIn, takeCharacterAfterSignIn, HANDOFF_KEY } = await handoff;
  const storage = memoryStorage();
  assert.equal(keepCharacterForSignIn(KHAJIIT, { storage, now: 1000 }), true);
  assert.deepEqual(takeCharacterAfterSignIn({ signedIn: true, storage, now: 2000 }), KHAJIIT);
  assert.equal(storage.items.has(HANDOFF_KEY), false, 'deleted as soon as it is taken');
  assert.equal(takeCharacterAfterSignIn({ signedIn: true, storage, now: 3000 }), null, 'only once');
});

test('a cancelled sign-in, an old handoff or a damaged one gives nothing back and is deleted', async () => {
  const { keepCharacterForSignIn, takeCharacterAfterSignIn, HANDOFF_KEY, HANDOFF_MAX_AGE_MS } = await handoff;
  const cases = [
    ['no sign-in happened', s => keepCharacterForSignIn(KHAJIIT, { storage: s, now: 0 }), { signedIn: false, now: 10 }],
    ['older than the round trip', s => keepCharacterForSignIn(KHAJIIT, { storage: s, now: 0 }), { signedIn: true, now: HANDOFF_MAX_AGE_MS + 1 }],
    ['from the future', s => keepCharacterForSignIn(KHAJIIT, { storage: s, now: 5000 }), { signedIn: true, now: 10 }],
    ['not JSON', s => s.setItem(HANDOFF_KEY, '{oops'), { signedIn: true, now: 10 }],
    ['no race', s => keepCharacterForSignIn({ ...KHAJIIT, race: '' }, { storage: s, now: 0 }), { signedIn: true, now: 10 }],
    ['an array', s => s.setItem(HANDOFF_KEY, JSON.stringify({ at: 0, build: [] })), { signedIn: true, now: 10 }],
  ];
  for (const [name, put, take] of cases) {
    const storage = memoryStorage();
    put(storage);
    assert.equal(takeCharacterAfterSignIn({ ...take, storage }), null, name);
    assert.equal(storage.items.has(HANDOFF_KEY), false, `${name}: deleted`);
  }
});

test('no storage, a full or throwing storage, and bad input never throw', async () => {
  const { keepCharacterForSignIn, takeCharacterAfterSignIn } = await handoff;
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(keepCharacterForSignIn(KHAJIIT, { storage: throwing }), false);
  assert.equal(takeCharacterAfterSignIn({ signedIn: true, storage: throwing }), null);
  assert.equal(keepCharacterForSignIn(KHAJIIT, { storage: null }), false);
  assert.equal(takeCharacterAfterSignIn({ signedIn: true, storage: null }), null);
  assert.equal(keepCharacterForSignIn(null, { storage: memoryStorage() }), false);
  assert.equal(takeCharacterAfterSignIn(), null, 'no arguments at all');
});

// The builder's character state, rendered as the site does.
const bundled = require('esbuild').buildSync({
  stdin: { contents: `export * from './components/character-context.jsx'; export * from './components/shell-context.jsx';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime']
});
const fixture = new Module(path.resolve('sign-in-handoff-fixture.cjs'), module);
fixture.paths = module.paths;
fixture._compile(bundled.outputFiles[0].text, path.resolve('sign-in-handoff-fixture.cjs'));
const { CharacterProvider, useActiveCharacter, ShellProvider } = fixture.exports;

async function page(url, before, check) {
  const dom = new JSDOM('<div id="root"></div>', { url });
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  before(dom.window);
  let character;
  function Probe() { character = useActiveCharacter(); return null; }
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(Probe)))));
    await check(() => character, dom.window);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('the sign-in buttons keep the character, and the signed-in return restores it', async () => {
  const { SIGN_IN_EVENT, HANDOFF_KEY } = await handoff;
  let kept;
  // Before sign-in: the builder holds the Khajiit; the button announces the round trip.
  await page('https://siltstrider.tools/builder?world=tr&arce=1', () => {}, async (character, win) => {
    await React.act(async () => character().setBuild(KHAJIIT));
    await React.act(async () => win.dispatchEvent(new win.Event(SIGN_IN_EVENT)));
    kept = win.sessionStorage.getItem(HANDOFF_KEY);
    assert.ok(kept, 'kept for the round trip');
    assert.equal(JSON.parse(kept).build.race, 'Khajiit (Cathay-raht)');
  });
  // The return: a new page load, now signed in, with the tab's session storage.
  await page('https://siltstrider.tools/builder?world=tr&arce=1', win => {
    win.sessionStorage.setItem(HANDOFF_KEY, kept);
    win.document.cookie = '__client_uat=1790000000';
  }, async (character, win) => {
    assert.equal(character().build.race, 'Khajiit (Cathay-raht)', 'not the default Dark Elf');
    assert.deepEqual(character().build.maj, KHAJIIT.maj);
    assert.equal(character().build.world, 'tr');
    assert.equal(character().build.arce, true);
    assert.equal(win.sessionStorage.getItem(HANDOFF_KEY), null, 'deleted once restored');
  });
});

test('a cancelled sign-in or a shared link does not bring the kept character back', async () => {
  const { keepCharacterForSignIn, HANDOFF_KEY } = await handoff;
  await page('https://siltstrider.tools/builder', win => {
    keepCharacterForSignIn(KHAJIIT, { storage: win.sessionStorage });
  }, async (character, win) => {
    assert.notEqual(character().build.race, 'Khajiit (Cathay-raht)', 'no session: a refresh after cancelling starts over');
    assert.ok(character().build.race, 'a conforming build is loaded');
    assert.equal(win.sessionStorage.getItem(HANDOFF_KEY), null, 'and the kept character is gone');
  });
  const { encodeShareUrl } = await import('../lib/permalink-codec.mjs').catch(() => ({}));
  if (typeof encodeShareUrl !== 'function') return;
  const shared = encodeShareUrl({ view: 'builder', build: { ...KHAJIIT, race: 'Nord', sign: 'The Lady' } });
  await page(new URL(shared, 'https://siltstrider.tools').href, win => {
    keepCharacterForSignIn(KHAJIIT, { storage: win.sessionStorage });
    win.document.cookie = '__client_uat=1790000000';
  }, async character => {
    assert.equal(character().build.race, 'Nord', 'a shared link opened with the page wins');
  });
});

test('forgetting drops the kept character and never throws', async () => {
  const { keepCharacterForSignIn, forgetCharacterForSignIn, HANDOFF_KEY } = await handoff;
  const storage = memoryStorage();
  keepCharacterForSignIn(KHAJIIT, { storage });
  forgetCharacterForSignIn({ storage });
  assert.equal(storage.items.has(HANDOFF_KEY), false);
  forgetCharacterForSignIn({ storage: null });
  forgetCharacterForSignIn({ storage: { removeItem() { throw new Error('blocked'); } } });
});
