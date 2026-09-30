const { test } = require('node:test');
require('./helpers/pending-game-data.cjs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot, hydrateRoot } = require('react-dom/client');
const { renderToString } = require('react-dom/server');
const Module = require('node:module');
const path = require('node:path');

// BLD-3: a newcomer's first Builder opens on the premade catalog while the character is
// still the random start; anyone else, or any other character, gets the Custom Class Builder.
const ROOT = path.join(__dirname, '..');
const bundled = require('esbuild').buildSync({
  stdin: {
    contents: `export { default as CharacterBuilderRoot } from './components/character-builder/character-builder-root.jsx'; export * from './components/character-context.jsx'; export * from './components/shell-context.jsx';`,
    resolveDir: ROOT
  },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/*']
});
const fixture = new Module(path.join(ROOT, 'builder-first-visit-fixture.cjs'), module);
fixture.paths = module.paths;
fixture._compile(bundled.outputFiles[0].text, path.join(ROOT, 'builder-first-visit-fixture.cjs'));
const { CharacterBuilderRoot, CharacterProvider, useActiveCharacter, ShellProvider, useShell } = fixture.exports;
const lib = () => import('../lib/builder-first-visit.mjs');
const VISITED = 'siltstrider-builder-visited';

function memoryStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}
const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };

async function withRandom(value, run) {
  const real = Math.random;
  Math.random = () => value;
  try { return await run(); } finally { Math.random = real; }
}

// The Builder as the site renders it: prerendered and hydrated (`hydrate`), or opened
// from another page (a client render, with the shell already up).
async function builder(url, { storage = {}, hydrate = true, blockStorage = false } = {}, check) {
  let character, shell;
  function Probe() { character = useActiveCharacter(); shell = useShell(); return null; }
  const tree = () => React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(Probe), React.createElement(CharacterBuilderRoot)));
  let html = '';
  if (hydrate) {
    delete global.window; delete global.document; // the prerender has no browser
    html = renderToString(tree());
  }
  const dom = new JSDOM(`<div id="root">${html}</div>`, { url });
  for (const [key, value] of Object.entries(storage)) dom.window.localStorage.setItem(key, value);
  if (blockStorage) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('denied'); } });
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  const errors = [];
  let root;
  try {
    await React.act(async () => {
      if (hydrate) root = hydrateRoot(document.getElementById('root'), tree(), { onRecoverableError: (e) => errors.push(e) });
      else { root = createRoot(document.getElementById('root')); root.render(tree()); }
    });
    assert.deepEqual(errors.map(String), [], 'it hydrates without a mismatch');
    await check({ character: () => character, shell: () => shell, dom });
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

const tab = () => ['builder', 'equipment', 'premade'].find((t) => document.getElementById(`btn-tab-${t}`)?.classList.contains('active'));
const click = (el) => React.act(async () => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
const buttonNamed = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === text);

test('a newcomer: never opened the Builder here, and keeps no character of its own', async () => {
  const { isNewcomer, markBuilderVisited } = await lib();
  const store = memoryStorage();
  assert.equal(isNewcomer(store), true);
  markBuilderVisited(store);
  assert.equal(store.getItem(VISITED), '1');
  assert.equal(isNewcomer(store), false, 'the second visit');
  assert.equal(isNewcomer(memoryStorage({ 'silt-active-save': '{"version":1}' })), false, 'a loaded save is kept');
  assert.equal(isNewcomer(memoryStorage({ 'siltstrider-saved-characters': JSON.stringify([{ name: 'Mine', build: {} }]) })), false, 'a saved character');
  // Stored data can be anything: what holds no character does not count as one.
  assert.equal(isNewcomer(memoryStorage({ 'siltstrider-saved-characters': '{not json' })), true, 'a corrupt value');
  assert.equal(isNewcomer(memoryStorage({ 'siltstrider-saved-characters': '[1,"x",null]' })), true, 'no records in it');
  assert.equal(isNewcomer(memoryStorage({ 'siltstrider-saved-characters': '[]' })), true, 'an empty list');
});

test('blocked storage: not a newcomer, so the Builder opens as it always has, and nothing throws', async () => {
  const { isNewcomer, markBuilderVisited } = await lib();
  assert.equal(isNewcomer(null), false);
  assert.equal(isNewcomer(throwing), false);
  assert.doesNotThrow(() => markBuilderVisited(throwing));
  assert.doesNotThrow(() => markBuilderVisited(null));
  await builder('https://siltstrider.tools/builder', { blockStorage: true }, async () => {
    assert.equal(tab(), 'builder');
    assert.equal(document.querySelector('.premade-browser'), null);
  });
});

test('a first visit opens on the premade catalog, says why, and remembers the visit', async () => {
  await withRandom(0.3, () => builder('https://siltstrider.tools/builder', {}, async ({ character }) => {
    assert.equal(character().isStarter, true, 'the character is the random start');
    assert.equal(tab(), 'premade');
    assert.ok(document.querySelector('.premade-browser'));
    assert.match(document.querySelector('.premade-welcome').textContent, /New here\?.*Pick a playstyle/);
    assert.equal(window.localStorage.getItem(VISITED), '1');
  }));
});

test('a second visit opens on the Custom Class Builder, as do saved characters or a kept save', async () => {
  for (const storage of [
    { [VISITED]: '1' },
    { 'siltstrider-saved-characters': JSON.stringify([{ name: 'Mine', build: { race: 'Nord' } }]) },
    { 'silt-active-save': 'not a save that decodes' }
  ]) {
    await builder('https://siltstrider.tools/builder', { storage }, async () => {
      assert.equal(tab(), 'builder', Object.keys(storage)[0]);
      assert.equal(document.querySelector('.premade-welcome'), null);
    });
  }
});

test('a shared build link on a first visit opens that character in the Custom Class Builder', async () => {
  const { encodeShareUrl } = await import('../lib/permalink-codec.mjs');
  const linked = { race: 'Nord', sign: 'The Warrior', gender: 'Female', className: 'Custom', name: 'Linked Nord' };
  const url = 'https://siltstrider.tools' + encodeShareUrl({ view: 'builder', world: 'vanilla', build: linked });
  await withRandom(0.5, () => builder(url, {}, async ({ character }) => {
    assert.equal(character().build.name, 'Linked Nord');
    assert.equal(character().isStarter, false);
    assert.equal(tab(), 'builder');
    assert.equal(window.localStorage.getItem(VISITED), '1', 'the visit is still remembered');
  }));
});

test('opened from another page: the catalog, then a loaded premade goes to the Builder with it', async () => {
  await withRandom(0.3, () => builder('https://siltstrider.tools/builder', { hydrate: false }, async ({ character }) => {
    assert.equal(tab(), 'premade');
    const category = document.querySelector('.premade-browser [aria-expanded="false"]');
    await click(category);
    const load = buttonNamed('Load Build →');
    const name = load.closest('.group').querySelector('strong').textContent;
    await click(load);
    assert.equal(tab(), 'builder');
    assert.equal(character().build.name, name, `${name} is loaded`);
    assert.equal(character().isStarter, false);
  }));
});

test('"Build my own instead" goes to the Custom Class Builder and stays there', async () => {
  await withRandom(0.3, () => builder('https://siltstrider.tools/builder', {}, async ({ character, shell }) => {
    await click(buttonNamed('Build my own instead'));
    assert.equal(tab(), 'builder');
    // A world switch there and back keeps the random start, and the visitor's choice stands.
    await React.act(async () => shell().setProfile('tr_arce'));
    await React.act(async () => shell().setProfile('vanilla'));
    assert.equal(tab(), 'builder');
    assert.equal(character().isStarter, true);
  }));
});

test('the random start replaced after the page is up (a save, sign-in): the Builder shows it', async () => {
  await withRandom(0.3, () => builder('https://siltstrider.tools/builder', {}, async ({ character }) => {
    assert.equal(tab(), 'premade');
    await React.act(async () => character().setBuild({ ...character().build, name: 'Restored Hero', race: 'Breton' }));
    assert.equal(tab(), 'builder', 'no catalog over a character of their own');
  }));
  // Unless the visitor already chose the catalog themselves.
  await withRandom(0.3, () => builder('https://siltstrider.tools/builder', {}, async ({ character }) => {
    await click(document.getElementById('btn-tab-premade'));
    await React.act(async () => character().setBuild({ ...character().build, name: 'Restored Hero' }));
    assert.equal(tab(), 'premade');
  }));
});

test('leaving ARCE with an untouched ARCE start draws another premade and keeps the catalog', async () => {
  await withRandom(0.999, () => builder('https://siltstrider.tools/builder?world=tr&arce=1', {}, async ({ character, shell }) => {
    assert.equal(tab(), 'premade');
    const first = character().build.name;
    await React.act(async () => shell().setProfile('vanilla'));
    assert.equal(character().isStarter, true, 'a new random start');
    assert.notEqual(character().build.name, first);
    assert.equal(tab(), 'premade');
  }));
});
