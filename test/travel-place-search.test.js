const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const walk = () => import('../lib/travel-walk.mjs');
const cell = (x, y, name, region = 'west gash region') => ({ key: `exterior:${x},${y}`, name, region, interior: false, grid: [x, y] });
const room = (name) => ({ key: `interior:${name.toLowerCase()}`, name, region: null, interior: true, grid: null });

test('a town spanning several cells is listed once, as its most central cell', async () => {
  const { matchPlaces } = await walk();
  const town = [cell(-3, -2, 'Gnisis'), cell(-2, -2, 'Gnisis'), cell(-1, -2, 'Gnisis')];
  assert.deepEqual(matchPlaces(town, 'gnis').map(p => p.key), ['exterior:-2,-2'], 'the middle of three');
  const square = [cell(0, 0, 'Tel Mora'), cell(1, 0, 'Tel Mora'), cell(0, 1, 'Tel Mora'), cell(1, 1, 'Tel Mora'), cell(5, 5, 'Tel Mora')];
  assert.deepEqual(matchPlaces(square, 'tel').map(p => p.key), ['exterior:1,1'], 'nearest the centre of a lopsided town');
  assert.deepEqual(matchPlaces([cell(0, -8, 'Pelagiad'), cell(0, -7, 'Pelagiad')], 'pelag').map(p => p.key), ['exterior:0,-7'], 'a tie goes to the first key, whatever the input order');
});

test('only the same name in the same region merges; rooms never do', async () => {
  const { matchPlaces } = await walk();
  const found = matchPlaces([
    cell(0, 0, 'Fort', 'ascadian isles region'), cell(9, 9, 'Fort', 'ashlands region'),
    room('Pelagiad, Halfway Tavern'), { ...room('Pelagiad, Halfway Tavern'), key: 'interior:pelagiad, halfway tavern (2)' }
  ], 'fort').concat(matchPlaces([room('Pelagiad, Halfway Tavern'), { ...room('Pelagiad, Halfway Tavern'), key: 'interior:copy' }], 'tavern'));
  assert.deepEqual(found.map(p => p.region || 'inside'), ['ascadian isles region', 'ashlands region', 'inside', 'inside'], 'two Forts in two regions, two rooms kept apart');
});

test('stops, short queries and nameless or malformed records are left out safely', async () => {
  const { matchPlaces } = await walk();
  const places = new Map([cell(-3, -2, 'Balmora'), room('Balmora, Council Club'), { key: 'exterior:7,7', name: '', grid: [7, 7] }, { key: 'x', name: 'Balmora Hills', grid: 'bad' }, null]
    .map((p, i) => [p?.key ?? String(i), p]));
  const found = matchPlaces(places, 'BALMORA', { stops: ['Balmora'] });
  assert.deepEqual(found.map(p => p.name), ['Balmora Hills', 'Balmora, Council Club'], 'the stop itself is in the stop list, not here; case does not matter');
  assert.deepEqual(matchPlaces(places, 'b'), [], 'one letter finds nothing');
  assert.deepEqual(matchPlaces(null, 'balmora'), []);
  assert.equal(matchPlaces(Array.from({ length: 50 }, (_, i) => room(`Cave ${i}`)), 'cave').length, 30, 'thirty at most');
});

test('with the staged bundle, Pelagiad appears once and Balmora only as its rooms', async (t) => {
  if (!fs.existsSync(path.join(ROOT, 'public', 'game-data', 'current.json'))) return t.skip('no staged game bundle');
  const { matchPlaces } = await walk();
  const { bundleId } = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'game-data', 'current.json'), 'utf8'));
  const read = name => { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'game-data', bundleId, 'vanilla', `${name}.json`), 'utf8')); return j.records || j; };
  const places = new Map(read('Places').map(p => [p.key, p]));
  const pelagiad = matchPlaces(places, 'Pelagiad').filter(p => p.name === 'Pelagiad');
  assert.equal(pelagiad.length, 1, 'the town, once');
  const balmora = matchPlaces(places, 'Balmora', { stops: ['Balmora'] });
  assert.ok(balmora.length > 0 && balmora.every(p => p.interior), 'the town is a stop; its rooms are places');
});

test('the Travel pickers use the shared search and plain buttons, not the browser grey', () => {
  const page = fs.readFileSync(path.join(ROOT, 'components', 'calculators', 'travel', 'travel-workstation.jsx'), 'utf8');
  assert.match(page, /matchPlaces\(places, query, \{ stops: availableStops \}\)/);
  assert.equal((page.match(/className="w-full text-left px-2 py-1\.5 text-xs font-serif text-fg-2 bg-transparent border-0 hover:bg-surface-9"/g) || []).length, 2, 'origin and destination');
});
