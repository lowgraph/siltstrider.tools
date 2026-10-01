const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;

// BLD-4 review: the Character Builder's "Save this character" list, with storage that
// throws, corrupt and foreign values, odd names, loading over a loaded .omwsave, and the
// Cloud Vault's local tab showing the same list.
const ROOT = path.resolve(__dirname, '..');
const KEY = 'siltstrider-saved-characters';

// The panel with a stand-in character context (globalThis.__character), so a test can give it
// an active save and see what is applied.
async function loadPanel() {
  const result = await require('esbuild').build({
    entryPoints: [path.join(ROOT, 'components/character-builder/local-characters-panel.jsx')],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'],
    plugins: [{ name: 'character-seam', setup(build) {
      build.onResolve({ filter: /character-context$/ }, () => ({ path: 'character-context', namespace: 'seam' }));
      build.onLoad({ filter: /.*/, namespace: 'seam' }, () => ({ loader: 'js', contents: `
        export const DEFAULT_BUILD = { version: 1, world: 'vanilla', arce: false, name: '', race: 'Dark Elf', gender: 'Male', className: 'Custom', sign: 'The Lady', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance', maj: [], min: [], bitterCup: false };
        export function useActiveCharacter() { return globalThis.__character; }` }));
    } }]
  });
  const file = path.join(ROOT, 'local-save-panel.cjs');
  const m = new Module(file, module); m.paths = module.paths; m._compile(result.outputFiles[0].text, file);
  return m.exports.default;
}
function component(file) {
  const result = require('esbuild').buildSync({ entryPoints: [path.join(ROOT, file)], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const m = new Module(path.join(ROOT, file), module); m.paths = module.paths; m._compile(result.outputFiles[0].text, path.join(ROOT, file));
  return m.exports.default;
}

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : input, 'http://localhost/');
    if (url.pathname === '/api/saves') return Response.json({ saves: [], total: 0 });
    if (url.pathname === '/api/entitlements') return Response.json({ tier: 'free', maxSaves: 5, currentSaves: 0, remainingSaves: 5 });
    throw new Error('unexpected request ' + url.pathname);
  };
});
afterEach(() => { global.fetch = originalFetch; });

const BUILD = { version: 1, world: 'tr', arce: true, name: 'Hrolfa', race: 'Nord', gender: 'Female', className: 'Custom', sign: 'The Warrior', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance',
  maj: ['Heavy Armor', 'Long Blade', 'Block', 'Armorer', 'Athletics'], min: ['Restoration', 'Medium Armor', 'Spear', 'Mercantile', 'Speechcraft'], bitterCup: false };

async function mount({ storage = null, stored = null, context = {} } = {}, check, extra = null) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/builder' });
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  if (storage) Object.defineProperty(dom.window, 'localStorage', { configurable: true, get: storage });
  else if (stored !== null) dom.window.localStorage.setItem(KEY, stored);
  const applied = [];
  let cleared = 0;
  globalThis.__character = { build: BUILD, activeSave: null, clearSave() { cleared += 1; }, setBuild(b) { applied.push(b); }, loadBuild(b) { applied.push(b); }, ...context };
  const Panel = await loadPanel();
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(Panel, { build: BUILD }), extra && React.createElement(extra.Component, extra.props))));
    await check({ applied, cleared: () => cleared });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
}
const panel = () => document.getElementById('saved-characters-panel');
const rows = () => [...panel().querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Load').map((b) => b.closest('div.p-2').querySelector('.font-bold').textContent);
const click = (el) => act(async () => el.click());
const saveButton = () => document.getElementById('btn-save-local-character');

test('a browser that refuses site data: the Builder still opens, and Save says why it cannot keep characters', async () => {
  // Reading window.localStorage itself throws, as when a browser blocks site data.
  await mount({ storage: () => { throw new Error('SecurityError: The operation is insecure.'); } }, async () => {
    assert.ok(panel(), 'the panel renders');
    assert.deepEqual(rows(), []);
    await click(saveButton());
    assert.match(panel().textContent, /not letting the site keep characters/);
  });
});

test('storage that refuses a write (full, or a private window): Save reports it and the list is unchanged', async () => {
  const store = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError: storage is full'); }, removeItem() {} };
  await mount({ storage: () => store }, async () => {
    await click(saveButton());
    assert.match(panel().textContent, /storage is full/);
    assert.deepEqual(rows(), []);
  });
});

test('corrupt or foreign stored values list only real records, and odd names do not break the page', async () => {
  await mount({ stored: '{not json' }, async () => { assert.deepEqual(rows(), []); });
  const foreign = JSON.stringify([1, 'x', null, [2], { id: 'a', name: { evil: 1 }, character: { race: { x: 1 }, sign: 'The Lord' } }, { id: 'b', name: 'Ok', character: { race: 'Nord', sign: 'The Warrior' } }]);
  await mount({ stored: foreign }, async () => {
    assert.deepEqual(rows(), ['Custom Character', 'Ok'], 'objects only; a name that is not text falls back');
    assert.match(panel().textContent, /Dark Elf · Custom · The Lord/, 'a race that is not text falls back too');
  });
});

test('a character named __proto__ is saved, listed and loaded as a name, nothing more', async () => {
  const dom = new JSDOM('', { url: 'http://localhost/' });
  const { saveLocalCharacter, loadLocalCharacters } = await import('../lib/character-vault.mjs');
  saveLocalCharacter({ name: '__proto__', character: { ...BUILD, name: '__proto__' } }, dom.window.localStorage);
  saveLocalCharacter({ name: 'constructor', character: { ...BUILD, name: 'constructor' } }, dom.window.localStorage);
  const stored = dom.window.localStorage.getItem(KEY);
  dom.window.close();
  await mount({ stored }, async ({ applied }) => {
    assert.deepEqual(rows(), ['__proto__', 'constructor']);
    await click([...panel().querySelectorAll('button')].find((b) => b.textContent.trim() === 'Load'));
    assert.equal(applied.at(-1).name, '__proto__');
    assert.equal(Object.getPrototypeOf(applied.at(-1)), Object.prototype, 'the loaded build is a plain object');
    assert.equal(({}).race, undefined, 'nothing leaked onto Object.prototype');
  });
  assert.equal(loadLocalCharacters(null).length, 0);
});

test('loading refuses an unreadable character, and a good one keeps the world and loadouts and sets a loaded save aside', async () => {
  const stored = JSON.stringify([
    { id: 'broken', name: 'Broken', character: { name: 'Broken', maj: 'nonsense' } },
    { id: 'good', name: 'Traveller', character: { ...BUILD, world: 'vanilla', arce: false, name: 'Traveller', loadouts: [{ id: 'early', items: [] }] } }
  ]);
  await mount({ stored, context: { activeSave: { token: 1 } } }, async ({ applied, cleared }) => {
    const load = (name) => [...panel().querySelectorAll('button')].find((b) => b.textContent.trim() === 'Load' && b.closest('div.p-2').textContent.includes(name));
    await click(load('Broken'));
    assert.equal(applied.length, 0, 'nothing applied');
    assert.match(panel().textContent, /cannot be read/);
    assert.equal(cleared(), 0, 'and the loaded save stays');
    await click(load('Traveller'));
    const build = applied.at(-1);
    assert.equal(build.name, 'Traveller');
    assert.equal(build.race, 'Nord');
    assert.deepEqual([build.world, build.arce], ['tr', true], 'the world the visitor is in, not the one it was saved in');
    assert.deepEqual(build.loadouts, [{ id: 'early', items: [] }], 'its gear comes with it');
    assert.equal(cleared(), 1, 'the loaded .omwsave is set aside, as a shared link does');
  });
});

test("saving in the Builder shows up in the Cloud Vault's local tab, and a foreign value cannot break the Vault", async () => {
  const Modal = component('components/character-vault/cloud-vault-modal.jsx');
  const foreign = JSON.stringify([{ id: 'odd', name: { evil: 1 }, character: { race: ['x'], sign: 'The Lord' } }]);
  await mount({ stored: foreign }, async () => {
    const tab = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Local Browser Saves'));
    await click(tab);
    assert.match(document.body.textContent, /Local Character/, 'the odd record shows a fallback name');
    await click(saveButton());
    assert.match(document.body.textContent, /Hrolfa/, 'the new save is in the Vault too');
  }, { Component: Modal, props: { activeBuild: BUILD, isOpen: true, onClose() {} } });
});


test('QA-21 an asynchronous local load failure keeps the existing save and reports the error',async()=>{
  const stored=JSON.stringify([{id:'qa-local',name:'QA – Local',character:BUILD}]);
  await mount({stored,context:{activeSave:{token:1},loadBuild:async()=>{throw Error('QA catalog unavailable');}}},async({cleared})=>{
    await click([...panel().querySelectorAll('button')].find(b=>b.textContent.trim()==='Load'));
    assert.equal(cleared(),0);
    assert.match(panel().textContent,/QA catalog unavailable/);
    assert.doesNotMatch(panel().textContent,/Loaded "QA/);
  });
});
