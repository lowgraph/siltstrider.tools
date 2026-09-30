const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { JSDOM } = require('jsdom');

// CHL-2: one way to keep a rolled item (its lock on the sheet); the run's settings choose a
// race, class or birthsign instead of rolling it, and a choice is locked.
const choice = () => import('../lib/challenge-choice.mjs');
function component(file) {
  const built = require('esbuild').buildSync({ entryPoints: [path.resolve(file)], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'react-dom'] });
  const m = new Module(path.resolve(file), module); m.paths = module.paths; m._compile(built.outputFiles[0].text, path.resolve(file));
  return m.exports.default;
}
const RUN = { race: 'Nord', gender: 'Male', cls: 'Warrior', sign: 'The Lady', spec: 'Combat', fav1: 'Strength', fav2: 'Endurance', maj: ['Long Blade'], min: ['Spear'], seedExact: true, rests: ['No armor'] };
const CATALOGS = { classes: { Mage: { spec: 'Magic', fav: ['Intelligence', 'Willpower'], maj: ['Alteration', 'Destruction'], min: ['Enchant'] } } };

test('a choice is locked and kept; "Roll it" only unlocks; a class brings its specialization and skills', async () => {
  const { chooseCharacterSlot } = await choice();
  const picked = chooseCharacterSlot({ run: RUN, locks: { rest: true } }, 'race', 'Breton');
  assert.equal(picked.run.race, 'Breton');
  assert.equal(picked.run.seedExact, false, 'a chosen race no longer matches the seed');
  assert.deepEqual(picked.locks, { rest: true, race: true }, 'locked, and the other locks untouched');
  assert.equal(picked.run.rests, RUN.rests, 'nothing else in the run changes');

  const released = chooseCharacterSlot({ run: picked.run, locks: picked.locks }, 'race', '');
  assert.deepEqual(released.locks, { rest: true, race: false });
  assert.equal(released.run, picked.run, 'the run stays as it is until the next roll');

  const mage = chooseCharacterSlot({ run: RUN, locks: {} }, 'cls', 'Mage', CATALOGS);
  assert.deepEqual([mage.run.spec, mage.run.fav1, mage.run.fav2, mage.run.maj, mage.run.min], ['Magic', 'Intelligence', 'Willpower', ['Alteration', 'Destruction'], ['Enchant']]);
  assert.notEqual(mage.run.maj, CATALOGS.classes.Mage.maj, 'a copy of the class\'s skills');
  const custom = chooseCharacterSlot({ run: RUN, locks: {} }, 'cls', 'Custom', CATALOGS);
  assert.deepEqual([custom.run.cls, custom.run.spec, custom.run.maj], ['Custom', 'Combat', ['Long Blade']], 'a class the catalogs do not describe keeps the run\'s own');
});

test('nothing but race, class and birthsign can be chosen, and odd values are handled', async () => {
  const { chooseCharacterSlot, CHOOSABLE_SLOTS } = await choice();
  assert.deepEqual(CHOOSABLE_SLOTS, ['race', 'cls', 'sign']);
  const state = { run: RUN, locks: { race: true } };
  for (const slot of ['major', 'rest', 'gender', '__proto__', undefined]) {
    const out = chooseCharacterSlot(state, slot, 'x');
    assert.equal(out.run, RUN, String(slot));
    assert.equal(out.locks, state.locks, String(slot));
  }
  assert.deepEqual(chooseCharacterSlot(state, 'sign', '   ').locks, { race: true, sign: false }, 'spaces are no choice');
  assert.deepEqual(chooseCharacterSlot(state, 'sign', null).locks, { race: true, sign: false });
  assert.equal(chooseCharacterSlot(state, 'sign', ' The Tower ').run.sign, 'The Tower', 'trimmed');
  assert.equal(chooseCharacterSlot(undefined, 'race', 'Orc').run.race, 'Orc', 'no run yet');
});

async function mount(element, check) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/challenge' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(element));
    await check(root);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

test('the lock: named "Lock <item>", aria-pressed for its state, a closed padlock when on, disabled with nothing to keep', async () => {
  const LockToggle = component('components/challenge-runs/lock-toggle.jsx');
  const pressed = [];
  await mount(React.createElement('div', null,
    React.createElement(LockToggle, { locked: false, what: 'race', onToggle: () => pressed.push('race') }),
    React.createElement(LockToggle, { locked: true, what: 'restrictions', onToggle: () => pressed.push('rest') }),
    React.createElement(LockToggle, { locked: false, what: 'class', disabled: true, onToggle: () => pressed.push('cls') })), async () => {
    const [race, rest, cls] = [...document.querySelectorAll('button')];
    assert.deepEqual([race, rest, cls].map((b) => b.textContent), ['Lock race', 'Lock restrictions', 'Lock class'], 'the name does not change with the state');
    assert.deepEqual([race, rest, cls].map((b) => b.getAttribute('aria-pressed')), ['false', 'true', 'false']);
    assert.notEqual(race.querySelector('path').getAttribute('d'), rest.querySelector('path').getAttribute('d'), 'open and closed padlocks');
    assert.match(rest.title, /Locked: rolling does not change the restrictions/);
    await React.act(async () => { race.click(); rest.click(); cls.click(); });
    assert.deepEqual(pressed, ['race', 'rest'], 'a disabled lock does nothing');
  });
});

test('the settings\' pickers: no locks there, "Roll it" unless the sheet keeps it, and a kept value always shows', async () => {
  const RunConfigurator = component('components/challenge-runs/run-configurator.jsx');
  const chosen = [];
  const props = (locks, character) => ({ locks, character, races: ['Breton', 'Nord'], classes: ['Mage', 'Warrior'], signs: ['The Lady'],
    onUpdateCharacterSlot: (slot, value) => chosen.push([slot, value]), onToggleLock() {}, onGenerateRun() {}, onSelectPreset() {},
    onRestrictionCountChange() {}, onObjectiveCountChange() {}, onToggleBand() {}, allowedBands: { Easy: true }, restrictionCount: 3, objectiveCount: 2, preset: 'standard' });
  await mount(React.createElement(RunConfigurator, props({ race: false, cls: true, sign: true }, { race: 'Nord', cls: 'Warrior', sign: 'Serpent (TR)' })), async () => {
    assert.equal([...document.querySelectorAll('button')].filter((b) => /lock/i.test(b.textContent)).length, 0);
    const [race, cls, sign] = ['race', 'cls', 'sign'].map((s) => document.getElementById(`cfg-choose-${s}`));
    assert.equal(document.querySelector('label[for="cfg-choose-race"]').textContent, 'Race');
    assert.equal(race.value, '', 'rolled, not kept: Roll it');
    assert.equal(cls.value, 'Warrior', 'kept on the sheet: shown');
    assert.equal(sign.value, 'Serpent (TR)', 'a kept value the list does not hold is still shown');
    assert.equal(sign.options[1].value, 'Serpent (TR)');
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(race, 'Breton');
      race.dispatchEvent(new window.Event('change', { bubbles: true }));
    });
    assert.deepEqual(chosen, [['race', 'Breton']]);
  });
});
