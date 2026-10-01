const { test } = require('node:test');
const assert = require('node:assert/strict');
const lib = import('../lib/ingredient-sources.mjs');

// CALC-4 where to get: the pipeline's IngredientSources records in player words.
const places = new Map([
  ['interior:balmora, guild of mages', { key: 'interior:balmora, guild of mages', interior: true, name: 'Balmora, Guild of Mages' }],
  ['interior:shulk eggmine', { key: 'interior:shulk eggmine', interior: true, name: 'Shulk Eggmine' }],
  ['exterior:3,-9', { key: 'exterior:3,-9', interior: false, region: "azura's coast region", grid: [3, -9] }],
]);

test('names: Places first, then the region of unnamed wilderness, then the bare key', async () => {
  const { placeName, regionLabel } = await lib;
  assert.equal(placeName(places, 'interior:balmora, guild of mages'), 'Balmora, Guild of Mages');
  assert.equal(placeName(places, 'exterior:3,-9'), "Azura's Coast Region");
  assert.equal(placeName(places, 'interior:a cell places does not have'), 'a cell places does not have');
  assert.equal(placeName(undefined, 'interior:no places at all'), 'no places at all');
  assert.equal(regionLabel("azura's coast region"), "Azura's Coast Region");
  assert.equal(regionLabel('red-mountain region'), 'Red-Mountain Region', 'each part of a hyphenated word');
  for (const empty of ['wilderness', '', undefined, null]) assert.equal(regionLabel(empty), 'the wilderness');
});

test('no record, or a record with nothing in it, says there is no dependable source', async () => {
  const { sourceLines, NO_SOURCE } = await lib;
  assert.deepEqual(sourceLines(undefined, places), [{ kind: 'none', text: NO_SOURCE }]);
  assert.deepEqual(sourceLines({ key: 'ingred_innocent_heart', name: 'Heart of an Innocent' }, places), [{ kind: 'none', text: NO_SOURCE }]);
  assert.deepEqual(sourceLines({ key: 'x', name: 'X', shops: [], plants: [], creatures: [], finds: [] }, places), [{ kind: 'none', text: NO_SOURCE }]);
});

test('shops: the first three with where they trade, one stock flagged, and how many in all', async () => {
  const { sourceLines } = await lib;
  const shop = (seller, name, restocks = true) => ({ seller, name, cellKey: 'interior:balmora, guild of mages', quantity: 5, restocks });
  const [line] = sourceLines({ key: 'k', name: 'K', shopCount: 37,
    shops: [shop('ajira', 'Ajira'), shop('banor seran', null, false), shop('c', 'C'), shop('d', 'D')] }, places);
  assert.equal(line.kind, 'buy');
  assert.equal(line.text, 'Buy from Ajira (Balmora, Guild of Mages; 5 in stock; restocks), '
    + 'banor seran (Balmora, Guild of Mages; 5 in stock; one stock only) '
    + 'or C (Balmora, Guild of Mages; 5 in stock; restocks); 37 shops in all.');
  const [single] = sourceLines({ key: 'k', name: 'K', shops: [shop('ajira', 'Ajira')] }, places);
  assert.equal(single.text, 'Buy from Ajira (Balmora, Guild of Mages; 5 in stock; restocks).', 'no count when every shop is named');
});

test('plants keep different draws separate, including level, chance, quantity and locations', async () => {
  const { sourceLines } = await lib;
  const [line] = sourceLines({ key: 'k', name: 'K', plants: [
    { name: 'Marshmerrow', containers: ['flora_marshmerrow_01'], chance: 0.9, quantity: 1, regrows: true, count: 2000,
      regions: [["azura's coast region", 1500]], near: [['Pelagiad', 73], ['Vivec', 36], ['Suran', 17], ['Balmora', 2]] },
    { name: 'Marshmerrow', containers: ['flora_marshmerrow_02'], chance: 0.8, quantity: 1, regrows: true, count: 655 },
    { name: 'Swamp Marshmerrow', containers: ['tr_flora_marsh'], chance: 1, quantity: 2, regrows: true, count: 5, fromLevel: 4 },
  ] }, places);
  assert.equal(line.kind, 'harvest');
  assert.match(line.text, /Marshmerrow \(2,000 plants; 90% of harvests; grows back\); around Pelagiad, Vivec and Suran; in Azura's Coast Region/);
  assert.match(line.text, /Marshmerrow \(655 plants; 80% of harvests; grows back\)/);
  assert.match(line.text, /Swamp Marshmerrow \(5 plants; 2 at a time; from player level 4; grows back\)/);
  assert.ok(!line.text.includes('2,655'), 'different harvest chances are not claimed for every plant');
  const [cave] = sourceLines({ key: 'k', name: 'K', plants: [{ name: 'Luminous Russula', containers: ['c'], chance: 1,
    quantity: 3, regrows: true, count: 12, fromLevel: 4, cells: [['interior:shulk eggmine', 12]] }] }, places);
  assert.equal(cave.text, 'Harvest: Luminous Russula (12 plants; 3 at a time; from player level 4; grows back); at Shulk Eggmine.');
});

test('creatures: one name once, level and chance, more kinds, and where most of them are', async () => {
  const { sourceLines } = await lib;
  const queen = (key) => ({ creature: key, name: 'Kwama Queen', level: 10, chance: 1, quantity: 1, placed: 1, spawnPoints: 0,
    cells: [['interior:shulk eggmine', 1]] });
  const [line] = sourceLines({ key: 'k', name: 'K', creatureCount: 20, creatures: [
    queen('kwama queen_shulk'), queen('kwama queen_gnisis'),
    { creature: 'kwama forager', name: 'Kwama Forager', level: 2, chance: 0.6, quantity: 1, placed: 1, spawnPoints: 2341 },
  ] }, places);
  assert.equal(line.kind, 'creatures');
  assert.equal(line.text, 'Dropped by Kwama Queen (creature level 10); at Shulk Eggmine. Also: Kwama Forager (creature level 2; 60% of kills); more creature varieties are listed in this world.');
  const [plain] = sourceLines({ key: 'k', name: 'K', creatures: [{ creature: 'x', name: 'Nix-Hound', level: null, chance: 1,
    quantity: 1, placed: 3, spawnPoints: 0, regions: [['west gash region', 3]] }] }, places);
  assert.equal(plain.text, 'Dropped by Nix-Hound; in West Gash Region.', 'no level, no brackets');
  const [rare] = sourceLines({ key: 'k', name: 'K', creatures: [{ creature: 'x', name: 'Ghost', level: 5, chance: 0.003,
    quantity: 1, placed: 1, spawnPoints: 0 }] }, places);
  assert.equal(rare.text, 'Dropped by Ghost (creature level 5; under 1% of kills).', 'never 0%');
});

test('finds: deposits with their draw, refilling containers, and loose places in the singular', async () => {
  const { sourceLines } = await lib;
  const [line] = sourceLines({ key: 'k', name: 'K', finds: [
    { name: 'Raw Ebony', chance: 0.5, quantity: 8, count: 67 },
    { name: 'Guild Supply Chest', chance: 1, quantity: 1, count: 2, refills: true },
    { loose: true, chance: 1, quantity: 1, count: 1 },
  ] }, places);
  assert.equal(line.kind, 'finds');
  assert.equal(line.text, 'Find: Raw Ebony ×67 (50% of searches; 8 at a time). Also: Guild Supply Chest ×2 (refills). Also: lying loose (1 pickup).');
});

test('every kind in one record comes out most practical first', async () => {
  const { sourceLines } = await lib;
  const record = { key: 'k', name: 'K',
    finds: [{ loose: true, chance: 1, quantity: 1, count: 4 }],
    creatures: [{ creature: 'c', name: 'Mudcrab', level: 1, chance: 1, quantity: 1, placed: 1, spawnPoints: 0 }],
    plants: [{ name: 'Comberry', containers: ['f'], chance: 1, quantity: 1, regrows: true, count: 9 }],
    shops: [{ seller: 's', name: 'S', cellKey: 'interior:balmora, guild of mages', quantity: 1, restocks: true }] };
  assert.deepEqual(sourceLines(record, places).map((line) => line.kind), ['buy', 'harvest', 'creatures', 'finds']);
});

test('the lazily loaded data: idle, loading, an error with its retry, a release without the catalog, ready', async () => {
  const { sourceIndex } = await lib;
  assert.deepEqual(sourceIndex(null), { status: 'idle' });
  assert.deepEqual(sourceIndex({ status: 'idle' }), { status: 'idle' });
  assert.deepEqual(sourceIndex({ status: 'loading', data: null }), { status: 'loading' });
  const retry = () => {};
  assert.deepEqual(sourceIndex({ status: 'error', retry }), { status: 'error', retry });
  assert.deepEqual(sourceIndex({ status: 'ready', data: { catalogs: { Places: [] } } }), { status: 'missing' }, 'an older bundle');
  const ready = sourceIndex({ status: 'ready', data: { catalogs: {
    IngredientSources: [{ key: 'ingred_a', name: 'A' }], Places: [{ key: 'interior:x', interior: true, name: 'X' }] } } });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.byKey.get('ingred_a').name, 'A');
  assert.equal(ready.places.get('interior:x').name, 'X');
});

test('the finder asks for the data when a pair opens, then shows each ingredient, an older bundle, or a retry', async () => {
  const React = require('react'), { JSDOM } = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const Finder = require('./helpers/reverse-alchemy.cjs').default;
  const health = { id: '75', n: 'Restore Health', arg: '', harmful: false };
  const data = [{ id: 'ingred_a', n: 'Ash Yam', effects: [health], v: 1 }, { id: 'ingred_b', n: 'Bread', effects: [health], v: 1 }];
  let wanted = 0, retried = 0;
  const render = (sources) => React.act(async () => root.render(React.createElement(Finder, {
    ingredients: data, onUsePair() {}, sources, onWantSources: () => { wanted += 1; } })));
  try {
    await render({ status: 'idle' });
    const input = document.getElementById('reverse-alchemy-search');
    await React.act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'restore');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    await React.act(async () => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Restore Health').click());
    const details = () => document.querySelector('.reverse-alchemy-sources');
    assert.equal(details().querySelector('summary').textContent, 'Where to get them: Ash Yam and Bread', 'each pair names itself to a screen reader');
    assert.equal(wanted, 0, 'nothing is loaded before anyone asks');
    // Opening it fires the element's own toggle event, as a browser does.
    await React.act(async () => { details().open = true; await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.equal(wanted, 1, 'opening a pair asks for the data');
    assert.match(details().textContent, /Loading ingredient sources/);
    await render({ status: 'ready', places: new Map(), byKey: new Map([['ingred_a', { key: 'ingred_a', name: 'Ash Yam',
      plants: [{ name: 'Ash Yam', containers: ['flora_ash_yam'], chance: 1, quantity: 1, regrows: true, count: 40,
        regions: [['ashlands region', 40]] }] }]]) });
    const text = details().textContent;
    assert.match(text, /Ash YamHarvest: Ash Yam \(40 plants; grows back\); in Ashlands Region\./);
    assert.match(text, /BreadNo dependable source is listed/, 'an ingredient the catalog does not have');
    await render({ status: 'missing' });
    assert.match(details().textContent, /comes with the next game data update/);
    await render({ status: 'error', retry: () => { retried += 1; } });
    assert.equal(details().querySelector('[role=alert]') !== null, true);
    await React.act(async () => [...details().querySelectorAll('button')].find((b) => b.textContent === 'Retry').click());
    assert.equal(retried, 1);
  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
});

test('selected ingredient button toggles its panel and replacement cannot keep stale sources open', async () => {
  const React = require('react'), { JSDOM } = require('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  const IngredientSources = require('./helpers/ingredient-sources.cjs').default;
  const sources = { status: 'ready', places, byKey: new Map([
    ['a', { key: 'a', shops: [{ seller: 'ajira', name: 'Ajira', cellKey: 'interior:balmora, guild of mages', quantity: 5, restocks: true }] }],
    ['b', { key: 'b', shops: [{ seller: 'nalcarya', name: 'Nalcarya', cellKey: 'interior:shop', quantity: 1, restocks: false }] }],
  ]) };
  let wanted = 0;
  const render = ingredient => React.act(async () => root.render(React.createElement(IngredientSources, {
    key: ingredient.id, ingredient, sources, onWantSources: () => { wanted++; },
  })));
  const button = () => document.querySelector('.alchemy-ingredient-sources > button');
  try {
    await render({ id: 'a', n: 'Ash Yam' });
    assert.equal(button().textContent, 'Where to get it');
    assert.equal(button().getAttribute('aria-label'), 'Where to get Ash Yam');
    assert.equal(button().getAttribute('aria-expanded'), 'false');
    assert.equal(wanted, 0);
    await React.act(async () => button().click());
    assert.equal(button().getAttribute('aria-expanded'), 'true');
    assert.equal(document.getElementById(button().getAttribute('aria-controls')).hidden, false);
    assert.match(document.body.textContent, /Buy from Ajira/); assert.ok(!document.body.textContent.includes('Nalcarya'));
    await React.act(async () => button().click());
    assert.equal(button().getAttribute('aria-expanded'), 'false');
    assert.equal(wanted, 1, 'closing does not ask for data');
    await React.act(async () => button().click());
    await render({ id: 'b', n: 'Bread' });
    assert.equal(button().getAttribute('aria-expanded'), 'false', 'a replacement starts folded');
    assert.ok(!document.body.textContent.includes('Ajira'));
    await React.act(async () => button().click());
    assert.match(document.body.textContent, /Buy from Nalcarya/);
    assert.ok(!document.body.textContent.includes('Ajira'));
  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
});

test('matching draws combine locations without mutating frozen catalog records', async () => {
  const { sourceLines } = await lib;
  const record = Object.freeze({ plants: Object.freeze([20, 30].map(n => Object.freeze({
    name: 'Comberry', chance: 0.8, quantity: 1, regrows: true, count: n,
    regions: Object.freeze([Object.freeze(['west gash region', n])]),
    cells: Object.freeze([Object.freeze(['interior:shulk eggmine', n])]),
  }))) });
  const before = JSON.stringify(record);
  const [line] = sourceLines(record, places);
  assert.match(line.text, /Comberry \(50 plants; 80% of harvests; grows back\); in West Gash Region; at Shulk Eggmine/);
  assert.equal(JSON.stringify(record), before);
});

test('find locations, locked containers and higher-level draws remain visible', async () => {
  const { sourceLines } = await lib;
  const [line] = sourceLines({ finds: [
    { name: 'Crate', chance: 0.5, quantity: 2, fromLevel: 8, count: 4, locked: 2,
      cells: [['interior:shulk eggmine', 4]] },
    { loose: true, chance: 1, quantity: 1, count: 2, near: [['Balmora', 2]],
      regions: [['west gash region', 2]] },
  ] }, places);
  assert.match(line.text, /Crate ×4 \(50% of searches; 2 at a time; from player level 8; 2 locked\); at Shulk Eggmine/);
  assert.match(line.text, /lying loose \(2 pickups\); around Balmora; in West Gash Region/);
});

test('different creature levels and drops are not hidden behind the same name', async () => {
  const { sourceLines } = await lib;
  const [line] = sourceLines({ creatures: [
    { name: 'Spriggan', level: 5, chance: 0.4, quantity: 1, placed: 2, cells: [['interior:shulk eggmine', 2]] },
    { name: 'Spriggan', level: 12, chance: 0.8, quantity: 2, spawnPoints: 9, regions: [['west gash region', 9]] },
  ] }, places);
  assert.match(line.text, /Spriggan \(creature level 5; 40% of kills\); at Shulk Eggmine/);
  assert.match(line.text, /Spriggan \(creature level 12; 80% of kills; 2 at a time\); in West Gash Region/);
});

test('malformed or impossible source entries cannot show NaN, zero drops or crash', async () => {
  const { sourceLines, sourceIndex, NO_SOURCE } = await lib;
  assert.deepEqual(sourceIndex({ status: 'ready', data: { catalogs: { IngredientSources: [null] } } }), { status: 'error' });
  assert.deepEqual(sourceIndex({ status: 'ready', data: { catalogs: { IngredientSources: {} } } }), { status: 'error' });
  const record = { shops: [null, { seller: 'x', cellKey: 'interior:x', quantity: NaN }], plants: {},
    creatures: [null, { name: 'Ghost', chance: 0, quantity: 1, placed: 1 },
      { name: 'Ghost', chance: Infinity, quantity: 1, placed: 1 }], finds: null };
  assert.deepEqual(sourceLines(record, places), [{ kind: 'none', text: NO_SOURCE }]);
  assert.match(sourceLines({ truncated: ['finds'] }, places)[1].text, /incomplete; other sources may exist/);
});
