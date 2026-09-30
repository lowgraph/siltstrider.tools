const { test } = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../lib/travel-search.mjs');
const cell = (x, y, name, region = 'west gash region') => ({ key: `exterior:${x},${y}`, name, region, interior: false, grid: [x, y] });
const room = name => ({ key: `interior:${name.toLowerCase()}`, name, interior: true });

test('Pelagiad without transit has one central town result instead of an empty stop list', async () => {
  const { buildTravelSearchOptions, searchTravelOptions } = await load();
  const places = [cell(0, -8, 'Pelagiad'), cell(0, -7, 'Pelagiad')];
  const options = buildTravelSearchOptions({ stops: ['Balmora'], places, settlements: [{ name: 'Pelagiad' }] });
  const result = searchTravelOptions(options, ' PELAGIAD ');
  assert.equal(result.total, 1);
  assert.deepEqual(result.options.map(p => [p.id, p.kind, p.badge]), [['place:exterior:0,-7', 'town', 'walk']]);
});

test('Balmora is one transit result followed by grouped interiors, with original routing IDs', async () => {
  const { buildTravelSearchOptions, searchTravelOptions } = await load();
  const places = [cell(-3, -2, 'Balmora'), cell(-2, -2, 'Balmora'), room('Balmora, Council Club'), room('Balmora, Guild of Mages')];
  const options = buildTravelSearchOptions({ stops: ['Balmora', 'BALMORA'], places });
  const result = searchTravelOptions(options, 'balmora');
  assert.equal(result.total, 3);
  assert.deepEqual(result.options.map(p => p.label), ['Balmora', 'Balmora › Council Club', 'Balmora › Guild of Mages']);
  assert.deepEqual(result.options.map(p => p.id), ['Balmora', 'place:interior:balmora, council club', 'place:interior:balmora, guild of mages']);
  assert.equal(searchTravelOptions(options, 'council balmora').options[0].id, 'place:interior:balmora, council club');
});

test('same-named places in different regions and distinct interior keys remain selectable', async () => {
  const { buildTravelSearchOptions, searchTravelOptions } = await load();
  const places = [cell(0, 0, 'Fort', 'west gash region'), cell(9, 9, 'Fort', 'ashlands region'), room('Fort, Hall'), { ...room('Fort, Hall'), key: 'interior:fort, second hall' }];
  const result = searchTravelOptions(buildTravelSearchOptions({ stops: ['Fort'], places }), 'fort');
  assert.equal(result.total, 5, 'an ambiguous stop name cannot swallow two different towns');
  assert.equal(new Set(result.options.map(p => p.id)).size, 5);
  const outdoors = result.options.filter(p => p.record?.interior === false);
  assert.notEqual(outdoors[0].detail, outdoors[1].detail);
  const rooms = result.options.filter(p => p.kind === 'interior');
  assert.equal(rooms[0].label, rooms[1].label);
  assert.notEqual(rooms[0].detail, rooms[1].detail, 'distinct room IDs need visibly distinct location details');
  assert.ok(rooms.every(p => p.detail && !p.detail.includes('interior:')), 'disambiguation shows names rather than routing prefixes');
});

test('towns and transit precede named exteriors and rooms before limiting the combined list', async () => {
  const { buildTravelSearchOptions, searchTravelOptions } = await load();
  const places = [room('Ash Cave'), cell(0, 0, 'Ash Cave'), cell(2, 2, 'Ash Village')];
  const options = buildTravelSearchOptions({ stops: ['Ash Port'], places, settlements: [{ name: 'Ash Village' }] });
  const result = searchTravelOptions(options, 'ash', { limit: 3 });
  assert.equal(result.total, 4);
  assert.deepEqual(result.options.map(p => p.kind), ['stop', 'town', 'exterior']);
  assert.equal(searchTravelOptions(options, 'a').total, 4, 'one letter searches all kinds');
  assert.equal(searchTravelOptions(options, '').total, 4, 'empty search offers the unified catalog');
  assert.equal(searchTravelOptions(options, 'not found').total, 0);
});

test('ranking puts an exact town match ahead of a prefix match within the same group', async () => {
  const { searchTravelOptions } = await load();
  const options = ['New Balmora', 'Balmora Heights', 'Balmora'].map(label => ({ id: label, label, kind: 'stop', badge: 'transit' }));
  assert.deepEqual(searchTravelOptions(options, 'balmora').options.map(p => p.id), ['Balmora', 'Balmora Heights', 'New Balmora']);
  assert.equal(searchTravelOptions(options, 'balmora', { limit: -1 }).options.length, 0);
  assert.equal(searchTravelOptions(options, '', { limit: NaN }).options.length, 3);
});

test('malformed catalogs are ignored, frozen input stays unchanged, and Access gates place routing', async () => {
  const { buildTravelSearchOptions, searchTravelOptions } = await load();
  const valid = Object.freeze({ ...cell(0, 0, 'Town'), grid: Object.freeze([0, 0]) });
  const places = Object.freeze([valid, null, {}, { key: 'exterior:1,1', name: '', grid: [1, 1], interior: false }, { ...cell(2, 2, 'Bad'), grid: [NaN, 2] }, { ...room('Hall'), key: '' }]);
  const options = buildTravelSearchOptions({ stops: ['Balmora', null, '', 'place:interior:hall'], places });
  assert.deepEqual(options.map(p => p.id), ['Balmora', 'place:exterior:0,0']);
  assert.deepEqual(buildTravelSearchOptions({ places: new Map([[valid.key, valid]]), includePlaces: false, stops: ['Balmora'] }).map(p => p.id), ['Balmora']);
  assert.deepEqual(buildTravelSearchOptions({ places: null, stops: null, settlements: null, graph: null }), []);
  assert.deepEqual(searchTravelOptions(null, null), { options: [], total: 0 });
  assert.equal(valid.name, 'Town');
});

test('badges reflect actual transport including arrivals, without calling a walk a boat', async () => {
  const { buildTravelSearchOptions } = await load();
  const options = buildTravelSearchOptions({ stops: ['Balmora', 'Vivec', 'Fort'], graph: {
    Balmora: [{ to: 'Vivec', kind: 'Silt Strider' }, { to: 'Fort', kind: 'Walking', walk: true }, { to: 'Fort', kind: 'Divine Intervention', spell: 'divine' }],
    Vivec: [], Fort: []
  } });
  const byId = new Map(options.map(p => [p.id, p]));
  assert.equal(byId.get('Balmora').badge, 'Silt Strider');
  assert.equal(byId.get('Vivec').badge, 'Silt Strider');
  assert.equal(byId.get('Fort').badge, 'transit');
});
