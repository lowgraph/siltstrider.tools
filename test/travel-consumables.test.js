const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../lib/travel-intervention-access.mjs');
const sheet = skill => ({ skills: { Mysticism: { v: skill } }, attrs: { Willpower: { v: 40 }, Luck: { v: 40 } } });
const spells = [{ key: 'divine intervention', type: 'spell', cost: 8 }, { key: 'almsivi intervention', type: 'spell', cost: 8 }];
const save = (known = [], inventory = [], magicka = 40) => ({ stuff: { spells: known, inventory }, vitals: { magicka: { current: magicka, max: 40 }, fatigue: { current: 100, max: 100 } } });
const scroll = (kind = 'divine', count = 1) => ({ id: `sc_${kind}intervention`, count });
const leg = (to, fields = {}) => ({ to, kind: 'Boat', hours: 1, price: 1, ...fields });

test('scrolls start unticked, count positive stacks only, and cannot fabricate uses from unrelated items', async () => {
  const { interventionAccess } = await load();
  const access = interventionAccess(save([], [scroll('divine', 2), scroll(), scroll('divine', 0), scroll('divine', -1), scroll('divine', 1.5),
    { id: 'amulet_divineintervention', count: 100 }, null, { id: 5, count: 3 }]));
  assert.equal(access.divine.source, 'scroll');
  assert.equal(access.divine.scrolls, 3);
  assert.equal(access.divine.defaultEnabled, false);
  assert.match(access.divine.note, /3 uses per journey/);
  assert.equal(access.almsivi.available, false);
  assert.equal(interventionAccess(save([], [scroll('divine', 0)])).divine.available, false);
  assert.equal(interventionAccess(null).divine.available, true, 'without a save, manual planning is retained');
});

test('known spells show saved fatigue and low cast chance; zero chance and insufficient Magicka are blocked', async () => {
  const { interventionAccess } = await load();
  const good = interventionAccess(save(['divine intervention']), { spellRecords: spells, sheet: sheet(40) }).divine;
  assert.equal(good.chance, 100); assert.equal(good.defaultEnabled, true);
  const low = interventionAccess(save(['divine intervention']), { spellRecords: spells, sheet: sheet(8) }).divine;
  assert.equal(low.chance, 25); assert.equal(low.defaultEnabled, false); assert.equal(low.available, true);
  const tiredSave = save(['divine intervention']); tiredSave.vitals.fatigue.current = 0;
  assert.equal(interventionAccess(tiredSave, { spellRecords: spells, sheet: sheet(8) }).divine.chance, 15);
  const zeroSheet = { skills: { Mysticism: { v: 0 } }, attrs: { Willpower: { v: 0 }, Luck: { v: 0 } } };
  assert.equal(interventionAccess(save(['divine intervention']), { spellRecords: spells, sheet: zeroSheet }).divine.available, false);
  const short = interventionAccess(save(['divine intervention'], [], 7), { spellRecords: spells, sheet: sheet(40) }).divine;
  assert.equal(short.available, false); assert.match(short.note, /Needs 8 Magicka/);
  const fallback = interventionAccess(save(['divine intervention'], [scroll()], 7), { spellRecords: spells, sheet: sheet(40) }).divine;
  assert.equal(fallback.source, 'scroll'); assert.equal(fallback.defaultEnabled, false);
});

test('missing catalogs or stats cannot claim reliable casting, but an explicit unknown-chance choice remains possible', async () => {
  const { interventionAccess } = await load();
  const unknown = interventionAccess(save(['divine intervention'])).divine;
  assert.equal(unknown.chance, null); assert.equal(unknown.defaultEnabled, false); assert.equal(unknown.available, true);
  assert.match(unknown.note, /unavailable/);
  const raw = save(['divine intervention']);
  raw.build = { skills: [{ id: 'Mysticism', value: 40 }], attributes: [{ id: 'Willpower', value: 40 }, { id: 'Luck', value: 40 }] };
  assert.equal(interventionAccess(raw, { spellRecords: spells }).divine.defaultEnabled, true);
  assert.equal(interventionAccess({ stuff: { spells: {}, inventory: null } }, { spellRecords: null }).divine.available, false);
  assert.equal(interventionAccess({ ...raw, build: { skills: {}, attributes: null } }, { spellRecords: spells }).divine.chance, null);
  const always = interventionAccess(save(['divine intervention']), { spellRecords: [{ ...spells[0], alwaysSucceeds: true }] }).divine;
  assert.equal(always.chance, 100); assert.equal(always.defaultEnabled, true);
});

test('one scroll cannot be used twice; each recomputed route starts from the same unchanged save budget', async () => {
  const { interventionAccess, withInterventionResources } = await load();
  const { planRoute } = await import('../lib/travel-graph.mjs');
  const original = { A: [leg('B', { spell: 'divine' })], B: [leg('C', { spell: 'divine' })], C: [] };
  const one = withInterventionResources(original, interventionAccess(save([], [scroll()])));
  assert.equal(planRoute('A', 'C', one.graph, { resources: one.resources }).isValid, false);
  const two = withInterventionResources(original, interventionAccess(save([], [scroll('divine', 2)])));
  const first = planRoute('A', 'C', two.graph, { resources: two.resources });
  assert.equal(first.isValid, true);
  assert.deepEqual(first.steps.map(step => step.remaining), [1, 0]);
  assert.ok(first.steps.every(step => step.scroll));
  assert.deepEqual(planRoute('A', 'C', two.graph, { resources: two.resources }), first);
  assert.equal(two.resources['scroll:divine'], 2);
  assert.equal(original.A[0].resource, undefined);
});

test('a more expensive arrival that preserves a scroll must remain available for a later leg', async () => {
  const { planRoute } = await import('../lib/travel-graph.mjs');
  const use = to => leg(to, { resource: 'scroll:divine', uses: 1, spell: 'divine', scroll: true, price: 0, hours: 0 });
  const graph = { A: [use('B'), leg('X')], X: [leg('B')], B: [use('C')], C: [] };
  for (const objective of ['hops', 'gold', 'time']) {
    const result = planRoute('A', 'C', graph, { objective, resources: { 'scroll:divine': 1 }, goldOf: edge => edge.price });
    assert.equal(result.isValid, true);
    assert.deepEqual(result.path, ['A', 'X', 'B', 'C']);
    assert.equal(result.steps.at(-1).remaining, 0);
  }
});

test('named-place Intervention edges use the same journey budget as network stops', async () => {
  const { interventionAccess, withInterventionResources } = await load();
  const { addPlaces } = await import('../lib/travel-walk.mjs');
  const { planRoute } = await import('../lib/travel-graph.mjs');
  const key = 'exterior:1,1';
  const placed = addPlaces({ B: [leg('C', { spell: 'divine' })], C: [] }, [key], {
    spells: { divine: true }, intervention: { records: [{ key, divine: 0 }], markers: { divine: [{ town: 'B' }] } }
  });
  const one = withInterventionResources(placed, interventionAccess(save([], [scroll()])));
  assert.equal(planRoute(`place:${key}`, 'C', one.graph, { resources: one.resources }).isValid, false);
  const two = withInterventionResources(placed, interventionAccess(save([], [scroll('divine', 2)])));
  assert.equal(planRoute(`place:${key}`, 'C', two.graph, { resources: two.resources }).isValid, true);
});

test('both Intervention kinds spend a shared Magicka budget and independent scroll budgets', async () => {
  const { interventionAccess, withInterventionResources } = await load();
  const { planRoute } = await import('../lib/travel-graph.mjs');
  const graph = { A: [leg('B', { spell: 'divine' })], B: [leg('C', { spell: 'almsivi' })], C: [] };
  const known = withInterventionResources(graph, interventionAccess(save(['divine intervention', 'almsivi intervention'], [], 8), { spellRecords: spells, sheet: sheet(40) }));
  assert.equal(planRoute('A', 'C', known.graph, { resources: known.resources }).isValid, false);
  const both = withInterventionResources(graph, interventionAccess(save([], [scroll(), scroll('almsivi')])));
  assert.equal(planRoute('A', 'C', both.graph, { resources: both.resources }).isValid, true);
  assert.deepEqual(planRoute('A', 'C', both.graph, { resources: both.resources }).steps.map(step => step.remaining), [0, 0]);
});

test('missing, negative and malformed consumable budgets fail closed, while normal paid edges remain usable', async () => {
  const { planRoute } = await import('../lib/travel-graph.mjs');
  for (const resources of [{}, { scroll: -1 }, { scroll: NaN }, { scroll: '2' }]) {
    const graph = { A: [leg('B', { resource: 'scroll', uses: 1 })], B: [] };
    assert.equal(planRoute('A', 'B', graph, { resources }).isValid, false);
  }
  for (const uses of [0, -1, NaN, undefined]) {
    assert.equal(planRoute('A', 'B', { A: [leg('B', { resource: 'scroll', uses })], B: [] }, { resources: { scroll: 2 } }).isValid, false);
  }
  assert.equal(planRoute('A', 'B', { A: [leg('B')], B: [] }).isValid, true);
});
