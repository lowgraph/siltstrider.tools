const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

// CALC-1: before there is anything to calculate, the calculators show a dash and say what
// to do, not a number that looks like an answer (a 100% cast chance for no spell).

async function workstation(tool, data) {
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: {}, sheet: {} }) },
    '../../shell-context': { useShell: () => ({ profile: 'vanilla', world: 'vanilla' }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),'./reverse-alchemy': require('./helpers/reverse-alchemy.cjs'),'./ingredient-combobox': require('./helpers/ingredient-combobox.cjs'),
    '../../use-game-data': { useGameData: () => ({ status: 'ready', data }) },
    '../../use-search-intent': { useSearchIntent: () => null },
  };
  const file = path.resolve(`components/calculators/${tool}/${tool}-workstation.jsx`);
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) {
    deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  }
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = id => deps[id] || require(id);
  mod._compile(code, file);
  return mod.exports.default;
}

async function mount(Component, check) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(Component)));
    await check();
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
}

const choose = (control, value) => React.act(async () => {
  control.value = value;
  control.dispatchEvent(new window.Event('change', { bubbles: true }));
});
// The value shown under a result's label, e.g. value('Cast Reliability') -> "63%".
function value(label) {
  const heading = [...document.querySelectorAll('span')].find(span => span.textContent.trim() === label);
  assert.ok(heading, `a "${label}" result`);
  return heading.nextElementSibling.textContent.trim();
}
const EMPTY = '—not calculated yet';
const prompt = () => document.querySelector('.calc-empty-prompt')?.textContent.trim() || '';
const prices = name => [...document.querySelector(`[role="region"][aria-label="Ranked ${name}"]`).children].map(row => row.lastElementChild.textContent.trim());

const EFFECT_DATA = { profile: 'vanilla', catalogs: {
  Attributes: [], Skills: [], MagicEffects: [], GameSettings: [],
  EffectRules: [{ key: 'fire', name: 'Fire Damage', baseCost: 5, school: 'destruction',
    allowEnchanting: true, allowSpellmaking: true, castSelf: true, castTouch: true, castTarget: true }]
} };

test('Spellmaking shows no cost, cast chance, school or prices until an effect is chosen, and again once it is cleared', async () => {
  const Spellmaking = await workstation('spellmaking', EFFECT_DATA);
  await mount(Spellmaking, async () => {
    assert.equal(value('Magicka Cost'), EMPTY);
    assert.equal(value('Cast Reliability'), EMPTY, 'no 100% for a spell with no effect');
    assert.equal(value('Governing School:'), EMPTY);
    assert.match(prompt(), /Choose an effect to see its Magicka cost/);
    assert.ok(prices('spellmakers').length > 0, 'the spellmakers are still listed');
    assert.ok(prices('spellmakers').every(price => price === EMPTY), 'without their prices');

    const effect = document.querySelector('select[aria-label="Effect 1"]');
    await choose(effect, 'fire');
    assert.match(value('Magicka Cost'), /^\d+ pts$/);
    assert.match(value('Cast Reliability'), /^\d+%$/);
    assert.match(value('Governing School:'), /^Destruction \(\d+ skill\)$/i);
    assert.equal(prompt(), '');
    assert.ok(prices('spellmakers').every(price => /^[\d,]+ g$/.test(price)));

    await choose(effect, '');
    assert.equal(value('Cast Reliability'), EMPTY, 'clearing the effect clears the answer');
    assert.match(prompt(), /Choose an effect/);
  });
});

test('Enchanting keeps the item\'s capacity but shows no chance or prices until an effect is chosen', async () => {
  const Enchanting = await workstation('enchanting', EFFECT_DATA);
  await mount(Enchanting, async () => {
    assert.match(document.body.textContent, /0 \/ [\d.]+ Points/, 'capacity is a real number from the start');
    assert.equal(value('Self-Enchant Chance'), EMPTY);
    assert.equal(value('Base Gold Value'), EMPTY);
    assert.match(prompt(), /Choose an effect to see your chance to enchant it yourself/);
    assert.ok(prices('enchanters').length > 0 && prices('enchanters').every(price => price === EMPTY));

    await choose(document.querySelector('select[aria-label="Effect 1"]'), 'fire');
    assert.match(value('Self-Enchant Chance'), /^-?\d+%$/);
    assert.match(value('Base Gold Value'), /^[\d,]+ g$/);
    assert.equal(prompt(), '');
    assert.ok(prices('enchanters').every(price => /^[\d,]+ g$/.test(price)));
  });
});

test('Alchemy shows no brew chance or value until two ingredients make a potion', async () => {
  const setting = (key, v) => ({ key: key.toLowerCase(), value: v });
  const Alchemy = await workstation('alchemy', { profile: 'vanilla', catalogs: {
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
  await mount(Alchemy, async () => {
    assert.equal(value('Brew Success Chance'), EMPTY);
    assert.equal(value('Estimated Gold Value'), EMPTY);
    assert.match(document.body.textContent, /Select at least two ingredients/);

    const { pickIngredient } = require('./helpers/ingredient-combobox.cjs');
    await pickIngredient(React, window, 0, 'Ash Salts');
    await pickIngredient(React, window, 1, 'Frost Salts');
    assert.equal(value('Brew Success Chance'), EMPTY, 'two ingredients that share nothing make no potion');
    assert.match(document.body.textContent, /No shared effects/);

    await pickIngredient(React, window, 1, 'Fire Petal');
    assert.match(value('Brew Success Chance'), /^\d+%$/);
    assert.match(value('Estimated Gold Value'), /^\d+ g$/);
  });
});
