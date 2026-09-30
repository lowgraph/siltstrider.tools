const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../lib/travel-real-time.mjs');
const route = steps => ({ isValid: true, hops: steps.length, steps });

test('real time sums movement and counts transport/spell transitions without converting clock jumps', async () => {
  const { approximateRealTime, realTimeText } = await load();
  const mixed = route([{ walk: true, movementSeconds: 146, hours: 73 / 60 },
    { kind: 'Boat', hours: 10 }, { spell: 'divine', hours: 0 }, { indoors: true, hours: 0 }]);
  assert.deepEqual(approximateRealTime(mixed), { seconds: 146, known: true, transitions: 2, indoors: 1 });
  assert.equal(realTimeText(mixed), 'Real Time Approximation: ~2 min 26 sec movement + 2 transport/spell transitions + uncounted indoor movement.');
  assert.match(realTimeText(route([{ kind: 'Boat', hours: 100 }])), /no outdoor movement \+ 1 transport\/spell transition/);
});

test('movement seconds survive graph routing and are independent of changed or frozen timescale', async () => {
  const { addStopWalks } = await import('../lib/travel-walk.mjs');
  const { planRoute } = await import('../lib/travel-graph.mjs');
  const { approximateRealTime } = await load();
  const points = new Map([['A', [[4096, 4096]]], ['B', [[12288, 4096]]]]);
  const land = { 'exterior:0,0': 'ffffffffffffffff', 'exterior:1,0': 'ffffffffffffffff' };
  const hours = [];
  for (const timescale of [0, 15, 30]) {
    const graph = addStopWalks({ A: [], B: [] }, points, land, 256, { timescale });
    const planned = planRoute('A', 'B', graph);
    assert.equal(planned.isValid, true);
    assert.equal(approximateRealTime(planned).seconds, 32);
    hours.push(planned.totals.hours);
  }
  assert.equal(hours[0], 0);
  assert.equal(hours[2], hours[1] * 2);
});

test('missing, negative, nonfinite and malformed movement records fail without a misleading partial estimate', async () => {
  const { approximateRealTime, realTimeText } = await load();
  for (const bad of [undefined, null, -1, NaN, Infinity, '60']) {
    const estimate = route([{ walk: true, movementSeconds: 10 }, { walk: true, movementSeconds: bad }]);
    assert.equal(approximateRealTime(estimate).known, false);
    assert.match(realTimeText(estimate), /movement time unavailable/);
    assert.doesNotMatch(realTimeText(estimate), /~10/);
  }
  assert.equal(approximateRealTime(route([null])).known, false);
  assert.equal(approximateRealTime(route([{ walk: true, movementSeconds: Number.MAX_VALUE }, { walk: true, movementSeconds: Number.MAX_VALUE }])).known, false);
  for (const invalid of [null, {}, { isValid: false }, { isValid: true, steps: {} }]) assert.equal(realTimeText(invalid), null);
});

test('real duration formats seconds and minute/hour boundaries without claiming zero for a short movement', async () => {
  const { formatRealDuration } = await load();
  for (const bad of [null, undefined, -1, NaN, Infinity, '60']) assert.equal(formatRealDuration(bad), '');
  assert.equal(formatRealDuration(0), '0 sec');
  assert.equal(formatRealDuration(0.01), '1 sec');
  assert.equal(formatRealDuration(59.6), '1 min');
  assert.equal(formatRealDuration(146), '2 min 26 sec');
  assert.equal(formatRealDuration(3661), '1 h 1 min 1 sec');
});

test('empty routes and indoor-only movement remain distinct from loading transitions, without mutating steps', async () => {
  const { approximateRealTime, realTimeText } = await load();
  assert.deepEqual(approximateRealTime(route([])), { seconds: 0, known: true, transitions: 0, indoors: 0 });
  const indoor = Object.freeze({ indoors: true, hours: 0 });
  const planned = Object.freeze({ ...route([indoor]), steps: Object.freeze([indoor]) });
  assert.equal(realTimeText(planned), 'Real Time Approximation: no outdoor movement + uncounted indoor movement.');
  assert.equal(planned.steps[0], indoor);
});
