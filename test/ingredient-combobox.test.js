const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

// CALC-3: one searchable box per Alchemy slot, where there were a dropdown and a separate
// "Search..." field.
const search = () => import('../lib/option-search.mjs');
const combobox = require('./helpers/ingredient-combobox.cjs');
const IngredientCombobox = combobox.default;

const ING = ['Ash Salts', 'Bonemeal', 'Fire Salts', 'Frost Salts', 'Salt Rice', "Scamp Skin", 'Void Salts (Hircine)']
  .map((n, i) => ({ id: `i${i}`, n }));

test('matching: the start of a name first, then the start of a word, then anywhere; case and spaces do not matter', async () => {
  const { rankOptions } = await search();
  const names = (q) => rankOptions(ING, q).map((o) => o.n);
  assert.deepEqual(names('salt'), ['Salt Rice', 'Ash Salts', 'Fire Salts', 'Frost Salts', 'Void Salts (Hircine)']);
  assert.deepEqual(names('  SALT  '), names('salt'), 'trimmed, any case');
  assert.deepEqual(names('ire'), ['Fire Salts'], 'inside a word');
  assert.deepEqual(names('alts'), ['Ash Salts', 'Fire Salts', 'Frost Salts', 'Void Salts (Hircine)'], 'all inside words: in list order');
  assert.deepEqual(names('(hir'), ['Void Salts (Hircine)'], 'brackets are text, not a pattern');
  assert.deepEqual(names('zzz'), []);
  const all = rankOptions(ING, '');
  assert.deepEqual(all, ING, 'nothing typed: everything, in order');
  assert.notEqual(all, ING, 'a copy, so the caller cannot sort the list it was given');
  assert.deepEqual(rankOptions([{ id: 'x', n: null }, ...ING], 'bone').map((o) => o.n), ['Bonemeal'], 'a nameless option is skipped');
});

test('arrow keys wrap around, start from either end, and do nothing on an empty list', async () => {
  const { stepIndex } = await search();
  assert.equal(stepIndex(-1, 1, 5), 0);
  assert.equal(stepIndex(-1, -1, 5), 4);
  assert.equal(stepIndex(4, 1, 5), 0);
  assert.equal(stepIndex(0, -1, 5), 4);
  assert.equal(stepIndex(2, 1, 5), 3);
  assert.equal(stepIndex(9, 1, 5), 0, 'a highlight past a list that shrank starts over');
  assert.equal(stepIndex(0, 1, 0), -1);
});

async function mount(element, check) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
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
const type = (box, text) => React.act(async () => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(box, text);
  box.dispatchEvent(new window.Event('input', { bubbles: true }));
});
const key = (box, k) => React.act(async () => box.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })));
const options = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent);

test('the box: type to filter, arrows to move, Enter or a click to choose, Escape or leaving to put it back', async () => {
  const chosen = [];
  function Harness() {
    const [value, setValue] = React.useState(ING[1]);
    return React.createElement(IngredientCombobox, { slot: 2, value, options: ING, onSelect: (v) => { chosen.push(v.n); setValue(v); } });
  }
  await mount(React.createElement(Harness), async () => {
    const box = document.querySelector('input[role="combobox"]');
    assert.equal(box.getAttribute('aria-label'), 'Crucible 3 ingredient');
    assert.equal(box.value, 'Bonemeal', 'it shows the slot\'s ingredient');
    assert.equal(box.getAttribute('aria-expanded'), 'false');

    await type(box, 'salt');
    assert.equal(box.getAttribute('aria-expanded'), 'true');
    assert.deepEqual(options(), ['Salt Rice', 'Ash Salts', 'Fire Salts', 'Frost Salts', 'Void Salts (Hircine)']);
    assert.match(document.querySelector('[aria-live="polite"]').textContent, /^5 ingredients$/);
    const listbox = document.getElementById(box.getAttribute('aria-controls'));
    assert.equal(listbox.getAttribute('role'), 'listbox');
    const active = () => document.getElementById(box.getAttribute('aria-activedescendant'))?.textContent;
    assert.equal(active(), 'Salt Rice', 'typing highlights the best match');
    await key(box, 'ArrowDown');
    await key(box, 'ArrowDown');
    assert.equal(active(), 'Fire Salts');
    await key(box, 'ArrowUp');
    await key(box, 'Enter');
    assert.deepEqual(chosen, ['Ash Salts']);
    assert.equal(box.value, 'Ash Salts');
    assert.equal(box.getAttribute('aria-expanded'), 'false');

    // Escape and leaving the box put the slot's ingredient back.
    await type(box, 'fro');
    await key(box, 'Escape');
    assert.equal(box.value, 'Ash Salts');
    assert.equal(box.getAttribute('aria-expanded'), 'false');
    await type(box, 'bone');
    await React.act(async () => box.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true })));
    assert.equal(box.value, 'Ash Salts');

    // A click on an option: its mousedown keeps the focus, so the click lands.
    await type(box, 'scamp');
    const option = [...document.querySelectorAll('[role="option"]')][0];
    const down = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    await React.act(async () => option.dispatchEvent(down));
    assert.equal(down.defaultPrevented, true);
    await React.act(async () => option.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
    assert.equal(box.value, 'Scamp Skin');

    // Nothing matches: said in words, and Enter chooses nothing.
    await type(box, 'zzz');
    assert.deepEqual(options(), []);
    assert.match(document.body.textContent, /No ingredient matches “zzz”/);
    await key(box, 'Enter');
    assert.deepEqual(chosen, ['Ash Salts', 'Scamp Skin']);
    // ArrowDown on a closed box opens it on the slot's ingredient.
    await key(box, 'Escape');
    await key(box, 'ArrowDown');
    assert.equal(active(), 'Scamp Skin');
  });
});

async function workstation(data) {
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: {}, sheet: {} }) },
    '../../shell-context': { useShell: () => ({ profile: 'vanilla', world: 'vanilla' }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),
    './ingredient-combobox': combobox,
    '../../use-game-data': { useGameData: () => ({ status: 'ready', data }) },
    '../../use-search-intent': { useSearchIntent: () => null },
  };
  const file = path.resolve('components/calculators/alchemy/alchemy-workstation.jsx');
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = (id) => deps[id] || require(id);
  mod._compile(code, file);
  return mod.exports.default;
}

test('in Alchemy: one box per slot, no other slot\'s ingredient offered, the Slot 1 filter still applies, Clear empties it', async () => {
  const setting = (k, v) => ({ key: k.toLowerCase(), value: v });
  const Alchemy = await workstation({ profile: 'vanilla', catalogs: {
    Attributes: [], Skills: [],
    MagicEffects: [{ key: '14', name: 'Fire Damage', baseCost: 2 }, { key: '16', name: 'Frost Damage', baseCost: 2 }],
    EffectRules: [{ key: '14', noMagnitude: false, noDuration: false, harmful: true }, { key: '16', noMagnitude: false, noDuration: false, harmful: true }],
    Ingredients: [
      { key: 'a', name: 'Ash Salts', effects: [{ slot: 0, effectId: 14 }] },
      { key: 'b', name: 'Fire Petal', effects: [{ slot: 0, effectId: 14 }] },
      { key: 'c', name: 'Frost Salts', effects: [{ slot: 0, effectId: 16 }] }
    ],
    Apparatus: [{ key: 'apparatus_j_mortar_01', type: 'mortar_and_pestle', name: 'Mortar', quality: 1 }],
    GameSettings: [setting('fPotionStrengthMult', 0.5), setting('iAlchemyMod', 2), setting('fPotionT1MagMult', 1.5), setting('fPotionT1DurMult', 0.5)]
  } });
  await mount(React.createElement(Alchemy), async () => {
    const boxes = [...document.querySelectorAll('.alchemy-workstation input[role="combobox"]')];
    assert.equal(boxes.length, 4);
    assert.equal(document.querySelectorAll('.alchemy-workstation select').length, 4, 'only the four apparatus selects are left');
    assert.equal(document.querySelector('input[placeholder="Search..."]'), null, 'no separate search field');

    await combobox.pickIngredient(React, window, 0, 'Ash Salts');
    assert.equal(boxes[0].value, 'Ash Salts');
    await type(boxes[1], 's');
    assert.deepEqual(options(), ['Frost Salts'], 'Ash Salts is in slot 1, so slot 2 offers only the other one with an s');
    await key(boxes[1], 'Escape');

    await React.act(async () => document.getElementById('alc-filter-match-first').click());
    await type(boxes[1], '');
    await key(boxes[1], 'ArrowDown');
    assert.deepEqual(options(), ['Fire Petal'], 'only what shares an effect with Slot 1');
    await key(boxes[1], 'Escape');

    const clear = [...document.querySelectorAll('button')].find((b) => b.title === 'Clear Slot 1');
    await React.act(async () => clear.click());
    assert.equal(boxes[0].value, '');
  });
});
