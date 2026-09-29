const { test } = require('node:test');
require('./helpers/pending-game-data.cjs');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { renderToString } = require('react-dom/server');
const Module = require('node:module');
const path = require('node:path');

// The builder's character state, rendered as the site does (as in sign-in-handoff.test.js).
const bundled = require('esbuild').buildSync({
  stdin: { contents: `export * from './components/character-context.jsx'; export * from './components/shell-context.jsx';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime']
});
const fixture = new Module(path.resolve('random-premade-fixture.cjs'), module);
fixture.paths = module.paths;
fixture._compile(bundled.outputFiles[0].text, path.resolve('random-premade-fixture.cjs'));
const { CharacterProvider, useActiveCharacter, ShellProvider, useShell, DEFAULT_BUILD } = fixture.exports;
const premades = () => import('../lib/premade-data.mjs');

async function withRandom(value, run) {
  const real = Math.random;
  Math.random = () => value;
  try { return await run(); } finally { Math.random = real; }
}

async function page(url, check) {
  const dom = new JSDOM('<div id="root"></div>', { url });
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  let character, shell;
  function Probe() { character = useActiveCharacter(); shell = useShell(); return null; }
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(Probe)))));
    await check(() => character, () => shell);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('the prerendered page is the same whatever the random draw, so it hydrates', async () => {
  function Name() { const { build } = useActiveCharacter(); return React.createElement('p', null, `${build.race} · ${build.name || build.className}`); }
  const render = () => renderToString(React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(Name))));
  const first = await withRandom(0, render);
  const last = await withRandom(0.999, render);
  assert.equal(first, last, 'no random choice reaches the server render');
  assert.match(first, new RegExp(DEFAULT_BUILD.race), 'it shows the fixed default');
});

test('a fresh visit starts from a random premade once the page is up', async () => {
  const { getPremadeBuildPool, CANONICAL_RACES } = await premades();
  const pool = getPremadeBuildPool({ arce: false });
  await withRandom(0, () => page('https://siltstrider.tools/builder', async character => {
    assert.equal(character().build.name, pool[0].name, 'the draw picked the first of the pool');
    assert.ok(CANONICAL_RACES.includes(character().build.race));
  }));
  await withRandom(0.999, () => page('https://siltstrider.tools/builder', async character => {
    assert.equal(character().build.name, pool[pool.length - 1].name, 'another draw, another premade');
  }));
});

// As on the site: the prerendered page is hydrated, so the first effects run while the
// shell still shows the server's world (vanilla), before the visitor's own is read.
async function hydrated(url, storage, check) {
  const { hydrateRoot } = require('react-dom/client');
  let character, shell;
  function Probe() { character = useActiveCharacter(); shell = useShell(); return React.createElement('p', null, character.build.race); }
  const tree = () => React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(Probe)));
  delete global.window; delete global.document; // the prerender has no browser
  const html = renderToString(tree());
  const dom = new JSDOM(`<div id="root">${html}</div>`, { url });
  for (const [key, value] of Object.entries(storage)) dom.window.localStorage.setItem(key, value);
  Object.assign(global, { window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true });
  const errors = [];
  let root;
  try {
    await React.act(async () => { root = hydrateRoot(document.getElementById('root'), tree(), { onRecoverableError: e => errors.push(e) }); });
    assert.deepEqual(errors.map(String), [], 'it hydrates without a mismatch');
    await check(() => character, () => shell);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('TR + ARCE chosen on an earlier visit: the random start draws from the ARCE builds too', async () => {
  const { getPremadeBuildPool, CANONICAL_RACES } = await premades();
  const pool = getPremadeBuildPool({ arce: true });
  await withRandom(0.999, () => hydrated('https://siltstrider.tools/builder', { 'mw-world': 'tr', 'mw-arce': '1' }, async (character, shell) => {
    assert.equal(shell().arce, true);
    const { build } = character();
    assert.equal(build.name, pool[pool.length - 1].name, 'the last of the ARCE pool');
    assert.ok(!CANONICAL_RACES.includes(build.race), `an ARCE race (${build.race})`);
    assert.equal(build.world, 'tr');
    assert.equal(build.arce, true);
  }));
});

test('TR + ARCE from the address: the random start draws from the ARCE builds too', async () => {
  const { CANONICAL_RACES } = await premades();
  await withRandom(0.999, () => hydrated('https://siltstrider.tools/builder?world=tr&arce=1', {}, async character => {
    assert.ok(!CANONICAL_RACES.includes(character().build.race), `an ARCE race (${character().build.race})`);
    assert.equal(character().build.arce, true);
  }));
});

test('TR without ARCE, or a first visit: the random start keeps to the base-game races', async () => {
  const { getPremadeBuildPool, CANONICAL_RACES } = await premades();
  const pool = getPremadeBuildPool({ arce: false });
  await withRandom(0.999, () => hydrated('https://siltstrider.tools/builder', { 'mw-world': 'tr', 'mw-arce': '0' }, async character => {
    assert.equal(character().build.name, pool[pool.length - 1].name);
    assert.ok(CANONICAL_RACES.includes(character().build.race));
    assert.equal(character().build.world, 'tr');
    assert.equal(character().build.arce, false);
  }));
  await withRandom(0, () => hydrated('https://siltstrider.tools/', {}, async character => {
    assert.equal(character().build.name, pool[0].name);
    assert.equal(character().build.world, 'vanilla');
  }));
});

test('a shared build link still wins over the random start', async () => {
  const { encodeShareUrl } = await import('../lib/permalink-codec.mjs');
  const linked = { race: 'Nord', sign: 'The Warrior', gender: 'Female', className: 'Custom', name: 'Linked Nord' };
  const url = 'https://siltstrider.tools' + encodeShareUrl({ view: 'builder', world: 'vanilla', build: linked });
  await withRandom(0.5, () => page(url, async character => {
    assert.equal(character().build.name, 'Linked Nord');
    assert.equal(character().build.race, 'Nord');
  }));
});

test('leaving ARCE swaps an untouched random premade, but keeps a character the player made', async () => {
  const { CANONICAL_RACES, ARCE_BUILDS } = await premades();
  const arceOnly = ARCE_BUILDS.find(b => !CANONICAL_RACES.includes(b.race));
  // Untouched: the random start was an ARCE premade; going to vanilla draws a new one.
  await withRandom(0.999, () => page('https://siltstrider.tools/builder?world=tr&arce=1', async (character, shell) => {
    const start = character().build;
    assert.ok(!CANONICAL_RACES.includes(start.race), `the ARCE draw is an ARCE race (${start.race})`);
    await React.act(async () => shell().setProfile('vanilla'));
    assert.ok(CANONICAL_RACES.includes(character().build.race), 'a fresh base-game premade');
    assert.notEqual(character().build.name, start.name);
  }));
  // Made by the player: renamed, then leaving ARCE keeps the name and skills, and maps the race.
  await withRandom(0.999, () => page('https://siltstrider.tools/builder?world=tr&arce=1', async (character, shell) => {
    await React.act(async () => character().setBuild({ ...character().build, race: arceOnly.race, name: 'My Own Hero' }));
    const before = character().build;
    await React.act(async () => shell().setProfile('vanilla'));
    const after = character().build;
    assert.equal(after.name, 'My Own Hero', 'the character is kept');
    assert.deepEqual(after.maj, before.maj);
    assert.ok(CANONICAL_RACES.includes(after.race), `${before.race} becomes a base-game race (${after.race})`);
  }));
});

test('an ARCE race maps to its base-game kin, and anything else to the default', async () => {
  const { canonicalRaceFor, sameCharacter } = await premades();
  assert.equal(canonicalRaceFor('Khajiit (Suthay)'), 'Khajiit');
  assert.equal(canonicalRaceFor('khajiit (Ohmes-raht)'), 'Khajiit');
  assert.equal(canonicalRaceFor('Malahk Orc'), 'Orc');
  assert.equal(canonicalRaceFor(' Breton '), 'Breton', 'a base-game race is kept');
  for (const other of ['Naga', 'Hill Giant', '', null, 42]) assert.equal(canonicalRaceFor(other), 'Dark Elf', String(other));
  const a = { ...DEFAULT_BUILD, world: 'tr', arce: true };
  assert.equal(sameCharacter(a, { ...DEFAULT_BUILD, world: 'vanilla', arce: false }), true, 'the world does not make a new character');
  assert.equal(sameCharacter(a, { ...a, maj: [...a.maj].reverse() }), false, 'an edited skill list does');
  assert.equal(sameCharacter(a, null), false);
});
