const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../lib/travel-tradeoff.mjs');
const route = (gold, seconds, hops = 1, flags = {}) => ({ isValid: true, hops,
  steps: Array.from({ length: hops }, (_, i) => i === 0 && seconds !== 0
    ? { walk: true, movementSeconds: seconds } : { kind: 'Boat' }),
  totals: { gold, hours: 1, goldKnown: true, hoursKnown: true, ...flags } });

test('Cheapest explains saved gold, real movement time and legs against Fewest legs', async () => {
  const { cheapestTradeoff } = await load();
  assert.equal(cheapestTradeoff(route(5, 146, 2), route(10, 0)),
    'Estimated comparison with Fewest legs: saves 5 gold, adds ~2 min 26 sec of movement, 1 more leg.');
  assert.match(cheapestTradeoff(route(0, 0), route(5, 60)), /saves 5 gold, avoids ~1 min of movement, 1 more transport\/spell transition/);
  assert.match(cheapestTradeoff(route(5, 60), route(5, 60)), /same fare, same outdoor movement time/);
});

test('unknown fares or movement times never turn partial totals into a claimed saving', async () => {
  const { cheapestTradeoff } = await load();
  const message = cheapestTradeoff(route(0, 120, 2, { goldKnown: false }), route(5, 60));
  assert.match(message, /fare comparison unavailable.*adds ~1 min of movement/);
  assert.doesNotMatch(message, /saves/);
  assert.match(cheapestTradeoff(route(0, undefined), route(5, 60)), /saves 5 gold, movement time comparison unavailable/);
  assert.match(cheapestTradeoff(route(0, 60), route(5, undefined)), /movement time comparison unavailable/);
  assert.match(cheapestTradeoff(route(0, 60, 1, { hoursKnown: false }), route(5, 0)),
    /saves 5 gold, adds ~1 min of movement/, 'unknown game-clock hours do not hide known movement seconds');
});

test('invalid routes, absent totals and malformed numeric fields do not invent comparisons', async () => {
  const { cheapestTradeoff } = await load();
  for (const invalid of [null, {}, { isValid: false }]) {
    assert.equal(cheapestTradeoff(invalid, route(5, 60)), null);
    assert.equal(cheapestTradeoff(route(5, 60), invalid), null);
  }
  assert.equal(cheapestTradeoff(route(0, 0, 0), route(0, 0, 0)), null);
  for (const bad of [NaN, Infinity, -1, '5', null]) {
    assert.match(cheapestTradeoff(route(bad, bad), route(5, 60)), /fare comparison unavailable.*movement time comparison unavailable/);
  }
  assert.match(cheapestTradeoff({ ...route(0, 60), totals: null }, route(5, 60)), /fare comparison unavailable/);
});

test('second rounding, zero movement and omitted indoor time remain explicit', async () => {
  const { cheapestTradeoff } = await load();
  assert.match(cheapestTradeoff(route(5, 60.0001), route(5, 60)), /same fare, same outdoor movement time/);
  assert.match(cheapestTradeoff(route(5, 0), route(5, 1)), /avoids ~1 sec of movement/);
  assert.match(cheapestTradeoff(route(5, 1), route(5, 0)), /adds ~1 sec of movement/);
  const inside = { ...route(5, 0), steps: [{ indoors: true }] };
  assert.match(cheapestTradeoff(inside, route(5, 0)), /time indoors not counted/);
});

test('comparison does not change routes or consume resources, and counts extra transitions separately', async () => {
  const { cheapestTradeoff } = await load();
  const cheapest = Object.freeze({ ...route(0, 60, 3), totals: Object.freeze(route(0, 60).totals) });
  const fewest = Object.freeze({ ...route(5, 0), totals: Object.freeze(route(5, 0).totals) });
  const before = JSON.stringify([cheapest, fewest]);
  assert.match(cheapestTradeoff(cheapest, fewest), /saves 5 gold, adds ~1 min of movement, 1 more transport\/spell transition, 2 more legs/);
  assert.equal(JSON.stringify([cheapest, fewest]), before);
});
