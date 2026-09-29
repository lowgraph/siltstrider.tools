const {test} = require('node:test');
require('./helpers/pending-game-data.cjs');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const React = require('react');
const {createRoot} = require('react-dom/client');
const Module = require('node:module');
const path = require('node:path');
const result = require('esbuild').buildSync({
  stdin: {contents: `export * from './components/character-context.jsx'; export * from './components/shell-context.jsx';`, resolveDir: process.cwd()},
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime']
});
const mod = new Module(path.resolve('native-state-fixture.cjs'), module);
mod.paths = module.paths;
mod._compile(result.outputFiles[0].text, path.resolve('native-state-fixture.cjs'));
const {CharacterProvider, useActiveCharacter, ShellProvider, useShell} = mod.exports;

async function harness(hash, check) {
  const dom = new JSDOM('<div id="root"></div><input id="c-race" value="Orc"><input id="enc-skill" value="999">', {url: 'http://localhost' + hash});
  Object.assign(global, {window: dom.window, document: dom.window.document, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true});
  // Loading catalogs must not reactivate global-table fallbacks.
  for (const key of ['siltCharacters', 'RACES', 'SIGNS', 'VANILLA_CLASS', 'SPEC_SKILLS', 'siltShell', 'syncSkillPrev']) {
    Object.defineProperty(window, key, {get() {throw new Error(`Retired global read: ${key}`);}});
  }
  let state;
  function Probe() {state = {character: useActiveCharacter(), shell: useShell()}; return null;}
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(ShellProvider, null, React.createElement(CharacterProvider, null, React.createElement(Probe)))));
    await check(() => state, dom);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('stale DOM controls and storage events cannot overwrite a React build', async () => {
  await harness('/builder', async state => {
    const initialRace = state().character.build.race;
    assert.ok(initialRace, 'initial build has a conforming race');
    await React.act(async () => state().character.updateField('name', 'Native character'));
    await React.act(async () => {
      document.getElementById('c-race').setAttribute('value', 'Nord');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('hashchange'));
    });
    assert.equal(state().character.build.name, 'Native character');
    assert.equal(state().character.build.race, initialRace);
    assert.equal(document.getElementById('enc-skill').value, '999');
    assert.equal(state().character.catalogs, null);
  });
});

test('profile links and navigation work even with a poisoned legacy shell', async () => {
  await harness('/builder?world=tr&arce=1', async state => {
    assert.equal(state().shell.profile, 'tr_arce');
    await React.act(async () => state().shell.navigate('travel'));
    assert.equal(state().shell.view, 'travel');
    await React.act(async () => state().shell.setProfile('vanilla'));
    assert.equal(state().shell.profile, 'vanilla');
    assert.equal(state().character.build.world, 'vanilla');
  });
});

test('malformed build links preserve defaults without consulting retired controls', async () => {
  await harness('/builder?build=%%%invalid', async state => {
    assert.equal(state().character.build.className, 'Custom');
    assert.ok(state().character.build.race, 'preserves conforming race');
    await React.act(async () => state().shell.navigate('alchemy'));
    assert.equal(state().shell.view, 'alchemy');
  });
});
