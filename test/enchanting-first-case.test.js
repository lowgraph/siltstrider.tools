const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const React = require('react');
const { JSDOM } = require('jsdom');

// ENC-1: Enchanting opens on an early enchantment a player can afford (an Expensive Ring and
// a Lesser Soul Gem, a new effect at 5 points for 5 seconds), not on an Exquisite Ring and a
// Grand Soul Gem; the item list reads from the cheapest grade up.
const math = () => import('../lib/enchant-math.mjs');

async function workstation(data) {
  const deps = {
    '../../character-context': { useActiveCharacter: () => ({ build: {}, sheet: {} }) },
    '../../shell-context': { useShell: () => ({ profile: 'vanilla', world: 'vanilla' }) },
    '../../active-character-link': require('./helpers/active-character-link.cjs'),'./ingredient-combobox': require('./helpers/ingredient-combobox.cjs'),
    '../../use-game-data': { useGameData: () => ({ status: 'ready', data }) },
    '../../use-search-intent': { useSearchIntent: () => null },
  };
  const file = path.resolve('components/calculators/enchanting/enchanting-workstation.jsx');
  const code = require('esbuild').transformSync(fs.readFileSync(file, 'utf8'), { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const match of code.matchAll(/require\("([^"]+\.mjs)"\)/g)) deps[match[1]] = await import(pathToFileURL(path.resolve(path.dirname(file), match[1])));
  const mod = new Module(file, module);
  mod.paths = module.paths;
  mod.require = (id) => deps[id] || require(id);
  mod._compile(code, file);
  return mod.exports.default;
}

const RESTORE = { key: 'restore', name: 'Restore Health', baseCost: 5, school: 'restoration', allowEnchanting: true, allowSpellmaking: true, castSelf: true, castTouch: true, castTarget: true };
const DATA = { profile: 'vanilla', catalogs: { Attributes: [], Skills: [], MagicEffects: [], GameSettings: [], EffectRules: [RESTORE] } };

async function withSoul(check) {
  const Enchanting=await workstation(DATA);
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const root=require('react-dom/client').createRoot(document.getElementById('root'));
  const type=async value=>React.act(async()=>{
    const control=document.getElementById('enchant-soul-size');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(control,value);
    control.dispatchEvent(new window.Event('input',{bubbles:true}));
  });
  try { await React.act(async()=>root.render(React.createElement(Enchanting))); await check(type); }
  finally { await React.act(async()=>root.unmount()); dom.window.close(); }
}

test('a typed 300-point soul is retained as a custom soul, below the constant-effect threshold',async()=>withSoul(async type=>{
  await type('300');
  assert.equal(document.getElementById('enchant-soul-size').value,'300');
  assert.equal(document.getElementById('enchant-soul-select').value,'300');
  assert.match(document.getElementById('enchant-soul-select').selectedOptions[0].textContent,/Custom soul/);
  assert.equal([...document.querySelectorAll('button')].find(b=>b.textContent==='Constant').disabled,true);
}));

test('typing across 400 enables constant effects and lowering the soul returns to when-used',async()=>withSoul(async type=>{
  const constant=()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Constant');
  await type('400'); assert.equal(constant().disabled,false);
  await React.act(async()=>constant().click());
  assert.equal(constant().getAttribute('aria-pressed'),'true');
  await type('399'); assert.equal(constant().disabled,true);
  assert.equal([...document.querySelectorAll('button')].find(b=>b.textContent==='When Used').getAttribute('aria-pressed'),'true');
}));

test('empty, negative and fractional typed soul sizes stay finite and nonnegative',async()=>withSoul(async type=>{
  for(const [value,want] of [['','0'],['-10','0'],['300.9','300'],['1000','1000']]) {
    await type(value);
    assert.equal(document.getElementById('enchant-soul-size').value,want);
    assert.equal(document.getElementById('enchant-soul-select').value,want);
  }
}));

test('the first case: an Expensive Ring and a Lesser Soul Gem, too small a soul for Constant Effect', async () => {
  const { ENCHANT_BASE_ITEMS, SOUL_GEMS, DEFAULT_ENCHANT_ITEM, DEFAULT_SOUL_GEM } = await math();
  const item = ENCHANT_BASE_ITEMS.find((b) => b.name === DEFAULT_ENCHANT_ITEM);
  const gem = SOUL_GEMS.find((g) => g.name === DEFAULT_SOUL_GEM);
  assert.deepEqual([item.name, item.capacity], ['Expensive Ring', 15]);
  assert.deepEqual([gem.name, gem.soul], ['Lesser Soul Gem', 30]);
  assert.ok(!gem.canCe && gem.soul < 400, 'Constant Effect needs 400');
});

test('each kind of item is listed from the cheapest grade up', async () => {
  const { ENCHANT_BASE_ITEMS } = await math();
  for (const kind of ['Ring', 'Amulet', 'Shirt', 'Robe']) {
    const grades = ENCHANT_BASE_ITEMS.filter((b) => new RegExp(`\\b${kind}$`).test(b.name));
    assert.ok(grades.length >= 2, kind);
    for (let i = 1; i < grades.length; i++) assert.ok(grades[i].capacity > grades[i - 1].capacity, `${grades[i - 1].name} before ${grades[i].name}`);
  }
  assert.equal(ENCHANT_BASE_ITEMS[0].name, 'Common Ring', 'the list starts at the cheapest ring');
  assert.equal(ENCHANT_BASE_ITEMS.at(-1).type, 'Custom', 'and ends with a custom item');
  assert.equal(new Set(ENCHANT_BASE_ITEMS.map((b) => b.name)).size, ENCHANT_BASE_ITEMS.length, 'no name twice');
});

test('why these numbers: a new effect at 5 for 5 s fits the ring; at 10 for 10 s it did not; a Common Ring holds only the smallest', async () => {
  const { calcEffectCost } = await math();
  const restore = { b: RESTORE.baseCost, mag: 1, dur: 1 };
  const fire = { b: 5, mag: 1, dur: 1 };
  assert.ok(calcEffectCost(restore, 'used', 5, 5, 5, 0, 'self') <= 15, 'Restore Health on self, 5 for 5 s');
  assert.ok(calcEffectCost(fire, 'strike', 5, 5, 5, 0, 'target') <= 15, 'Fire Damage on target, 5 for 5 s');
  assert.ok(calcEffectCost(restore, 'used', 10, 10, 10, 0, 'self') > 15, 'the old starting numbers overflow it');
  // Every effect costs at least a point, so a Common Ring (1) holds one, at the smallest size.
  assert.equal(calcEffectCost({ b: 1, mag: 1, dur: 1 }, 'used', 1, 1, 1, 0, 'self'), 1);
  assert.ok(calcEffectCost(restore, 'used', 5, 5, 5, 0, 'self') > 1);
});

test('the page opens on that case: the ring, the gem, Constant waiting, and a new effect that fits', async () => {
  const Enchanting = await workstation(DATA);
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const choose = (control, value) => React.act(async () => { control.value = value; control.dispatchEvent(new window.Event('change', { bubbles: true })); });
  try {
    await React.act(async () => root.render(React.createElement(Enchanting)));
    assert.match([...document.querySelectorAll('select')].map((s) => s.selectedOptions[0]?.textContent).join(' | '), /Expensive Ring \(15 pts\)/);
    assert.equal(document.getElementById('enchant-soul-select').value, '30');
    const constant = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Constant');
    assert.equal(constant.disabled, true);
    assert.match(document.body.textContent, /0 \/ 15 Points/);
    await choose(document.querySelector('select[aria-label="Effect 1"]'), 'restore');
    const used = document.body.textContent.match(/(\d+(?:\.\d+)?) \/ 15 Points/);
    assert.ok(used && Number(used[1]) <= 15, `the first effect fits (${used && used[1]} of 15)`);
    assert.doesNotMatch(document.body.textContent, /exceed the selected item capacity/);
  } finally {
    await React.act(async () => root.unmount());
    dom.window.close();
  }
});
