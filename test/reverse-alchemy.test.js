const { test } = require('node:test');
const assert = require('node:assert/strict');
const engine = import('../lib/reverse-alchemy.mjs');
const effect = (id, n, arg = '', harmful = false) => ({ id, n, arg, harmful });
const health = effect('75', 'Restore Health'), fatigue = effect('77', 'Restore Fatigue'), damage = effect('18', 'Drain Health', '', true);
const ingredient = (id, effects, v = 1) => ({ id, n: id, effects, v });

test('effect identities preserve attribute targets and do not merge equal display names', async () => {
  const { alchemyEffectOptions, findAlchemyPairs } = await engine;
  const strength = effect('79', 'Fortify Attribute', 'Strength'), intelligence = effect('79', 'Fortify Attribute', 'Intelligence');
  const data = [ingredient('a', [strength]), ingredient('b', [strength]), ingredient('c', [intelligence]), ingredient('d', [intelligence])];
  assert.deepEqual(alchemyEffectOptions(data).map(e => e.n), ['Fortify Intelligence', 'Fortify Strength']);
  assert.deepEqual(findAlchemyPairs(data, ['79:Strength']).pairs[0].ingredients.map(i => i.id), ['a', 'b']);
  assert.equal(findAlchemyPairs(data, ['79:Luck']).total, 0);
});
test('every selected effect must be shared by both ingredients; no union-only matches', async () => {
  const { findAlchemyPairs } = await engine;
  const data = [ingredient('a', [health]), ingredient('b', [fatigue]), ingredient('c', [health, fatigue]), ingredient('d', [health, fatigue])];
  const result = findAlchemyPairs(data, ['75', '77']);
  assert.equal(result.total, 1);
  assert.deepEqual(result.pairs[0].ingredients.map(i => i.id), ['c', 'd']);
});
test('duplicates of one ingredient or one effect cannot manufacture a brew', async () => {
  const { alchemyEffectOptions, findAlchemyPairs } = await engine;
  const a = ingredient('a', [health, health, null]);
  assert.deepEqual(alchemyEffectOptions([a, a]), []);
  assert.equal(findAlchemyPairs([a, a], ['75']).total, 0);
  const b = ingredient('b', [health]);
  assert.equal(alchemyEffectOptions([a, a, b])[0].count, 2);
  assert.equal(findAlchemyPairs([a, a, b], ['75']).total, 1);
});
test('null catalogs, malformed effects, nameless records and absent selections fail safely', async () => {
  const { alchemyEffectOptions, findAlchemyPairs } = await engine;
  for (const data of [null, {}, [null, {}, ingredient('a', [null, {}, { id: {}, n: 'Bad' }, { id: 'x', n: 'Bad', arg: {} }]), { id: 'bad', n: null, effects: [health] }]]) {
    assert.deepEqual(alchemyEffectOptions(data), []);
    assert.equal(findAlchemyPairs(data, ['75']).total, 0);
  }
  assert.equal(findAlchemyPairs([ingredient('a', [health]), ingredient('b', [health])], []).total, 0);
});
test('extra effects are exposed and rank before lower ingredient value', async () => {
  const { findAlchemyPairs } = await engine;
  const data = [ingredient('a', [health, damage], 1), ingredient('b', [health, damage], 1), ingredient('c', [health], 50)];
  const result = findAlchemyPairs(data, ['75']);
  assert.deepEqual(result.pairs.map(p => p.ingredients.map(i => i.id)), [['a', 'c'], ['b', 'c'], ['a', 'b']]);
  assert.equal(result.pairs[2].extras[0].effect.harmful, true);
});
test('unknown ingredient value is not free; pagination counts all pairs deterministically', async () => {
  const { findAlchemyPairs } = await engine;
  const data = [ingredient('a', [health], null), ingredient('b', [health], 4), ingredient('c', [health], 3), ingredient('d', [health], NaN)];
  const result = findAlchemyPairs(data, ['75'], 1);
  assert.equal(result.total, 6);
  assert.deepEqual(result.pairs[0].ingredients.map(i => i.id), ['b', 'c']);
  assert.deepEqual(result, findAlchemyPairs([...data].reverse(), ['75'], 1));
});
test('four requested effects, sparse slots and frozen published records remain intact', async () => {
  const { findAlchemyPairs } = await engine;
  const effects = [health, null, fatigue, effect('0', 'Water Breathing'), effect('1', 'Swift Swim')];
  const a = Object.freeze(ingredient('a', Object.freeze(effects))), b = Object.freeze(ingredient('b', Object.freeze([...effects])));
  const result = findAlchemyPairs(Object.freeze([a, b]), ['75', '77', '0', '1']);
  assert.equal(result.total, 1);
  assert.equal(result.pairs[0].ingredients[0], a);
  assert.equal(findAlchemyPairs([a, b], ['75', '77', '0', '1', '2']).total, 0);
  assert.equal(findAlchemyPairs([a, b], ['75', '75']).total, 1);
});

test('finder searches effects, shows harmful extras, fills a pair and clears its selection', async () => {
  const React = require('react'), { JSDOM } = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Finder = require('./helpers/reverse-alchemy.cjs').default;
  const selected = [];
  const data = [ingredient('a', [health, damage]), ingredient('b', [health, damage])];
  try {
    await React.act(async () => root.render(React.createElement(Finder, { ingredients: data, onUsePair: pair => selected.push(pair) })));
    const input = document.getElementById('reverse-alchemy-search');
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'RESTORE');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const button = [...document.querySelectorAll('button')].find(b => b.textContent === 'Restore Health');
    assert.ok(button);
    await React.act(async () => button.click());
    assert.match(document.querySelector('[aria-label="Ingredient pairs"]').textContent, /Drain Health \(harmful\)/);
    assert.equal(document.activeElement, input);
    await React.act(async () => document.querySelector('[aria-label="Use a and b"]').click());
    assert.deepEqual(selected[0].map(i => i.id), ['a', 'b']);
    await React.act(async () => document.querySelector('[aria-label="Remove Restore Health"]').click());
    assert.equal(document.querySelector('[aria-label="Ingredient pairs"]'), null);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
});
