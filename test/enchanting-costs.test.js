const { test } = require('node:test');
const assert = require('node:assert/strict');
const math = import('../lib/enchant-math.mjs');
const row = (overrides = {}) => ({ effect: { b: 1, mag: 1, dur: 1 }, min: 5, max: 5, dur: 5, area: 0, range: 'self', ...overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.0001, `${actual} ≈ ${expected}`);

// OpenMW 0.51.0 enchanting.cpp: sum floors for capacity, sum float running
// costs for chance, and take only the final float cost for the base price.
test('QA-01 one, two and three Constant effects keep capacity, chance and price inputs separate', async () => {
  const m = await math;
  for (const [count, capacity, precise, final, price] of [
    [1, 25, 25.025, 25.025, 25025], [2, 75, 75.075, 50.05, 50050], [3, 150, 150.15, 75.075, 75075]
  ]) {
    const effects = Array.from({ length: count }, () => row());
    const costs = m.calcEnchantmentCosts(effects, 'const');
    assert.equal(costs.effectCosts.length, count); assert.equal(costs.capacityPoints, capacity);
    near(costs.precisePoints, precise); near(costs.finalEffectCost, final);
    near(m.calcEnchantmentTotalPoints(effects, 'const', true), precise);
    assert.equal(m.calcEnchantGoldCost(costs.finalEffectCost, 'const'), price);
  }
});

test('QA-02 a Common Ring uses one Target capacity point while chance and price retain its fraction', async () => {
  const m = await math, costs = m.calcEnchantmentCosts([row({ range: 'target' })]);
  const ring = m.ENCHANT_BASE_ITEMS.find(item => item.name === 'Common Ring');
  assert.equal(costs.capacityPoints, ring.capacity); near(costs.precisePoints, 1.9125);
  assert.equal(m.calcSelfEnchantChance(50, 40, 40, costs.precisePoints), 70);
  assert.equal(m.calcSelfEnchantChance(10, 40, 40, costs.precisePoints), 20);
  assert.equal(m.calcEnchantGoldCost(costs.finalEffectCost), 1912);
});

test('QA-01 Target multiplies the entire running cost and effect order can change the final price', async () => {
  const m = await math;
  const first = m.calcEnchantmentCosts([row({ range: 'target' }), row()]);
  const last = m.calcEnchantmentCosts([row(), row({ range: 'target' })]);
  assert.equal(first.capacityPoints, 4); assert.equal(last.capacityPoints, 4);
  near(first.effectCosts[0], 1.9125); near(first.effectCosts[1], 3.1875);
  near(last.effectCosts[0], 1.275); near(last.effectCosts[1], 3.825);
  assert.equal(m.calcEnchantGoldCost(first.finalEffectCost), 3187);
  // The float running cost is just below 3.825; multiplying and truncating
  // follows the engine's 3,824 result rather than decimal rounding to 3,825.
  assert.equal(m.calcEnchantGoldCost(last.finalEffectCost), 3824);
});

test('QA-01 area minimum, explicit area and Constant duration follow the source order', async () => {
  const m = await math;
  near(m.calcEffectCost(row().effect, 'used', 5, 5, 5, 0, 'self'), 1.275);
  near(m.calcEffectCost(row().effect, 'used', 5, 5, 5, 20, 'target'), 2.625);
  near(m.calcEffectCost(row().effect, 'const', 5, 5, 5, 20, 'self'), 25.5);
  // The editor forces Constant to Self; the engine's cost function still applies
  // a Target multiplier if a raw effect record contains that range.
  near(m.calcEffectCost(row().effect, 'const', 5, 5, 5, 0, 'target'), 37.5375);
});

test('QA-02 floor each running cost, rather than floor their sum or round the final cost', async () => {
  const m = await math;
  const effects = [row({ range: 'target', min: 1, max: 1, dur: 1 }), row({ min: 1, max: 1, dur: 1 })];
  const costs = m.calcEnchantmentCosts(effects);
  near(costs.precisePoints, 3.075); assert.equal(costs.capacityPoints, 2);
  assert.notEqual(costs.capacityPoints, Math.floor(costs.precisePoints));
  assert.equal(m.calcEnchantGoldCost(costs.finalEffectCost), 1575);
});

test('QA-02 fatigue, Constant multiplier and truncation affect the precise-point chance', async () => {
  const m = await math;
  for (const [fatigueRatio, chance] of [[0, 42], [0.5, 56], [1, 70], [1.5, 84]]) {
    assert.equal(m.calcSelfEnchantChance(50, 40, 40, 1.9125, { fatigueRatio }), chance);
  }
  const two = m.calcEnchantmentCosts([row(), row()], 'const');
  assert.equal(m.calcSelfEnchantChance(300, 40, 40, two.precisePoints, { type: 'const' }), 54);
  assert.equal(m.calcSelfEnchantChance(100, 40, 40, two.precisePoints, { type: 'const' }), 0);
  assert.equal(m.calcSelfEnchantChance(50, 40, 40, 1.9125, { itemCount: 2 }), 63);
  assert.equal(m.calcSelfEnchantChance(50, 40, 40, 1.9125, { typeMultiplier: 0.125 }), 76);
});

test('QA-01/02 each staged world supplies the relevant enchantment settings', async () => {
  const m = await math, loader = await require('./helpers/qa-staged-data.cjs').loader();
  for (const profile of ['vanilla', 'tr', 'tr_arce']) {
    const settings = m.enchantingSettings(await loader.loadCatalog(profile, 'GameSettings'));
    assert.deepEqual(settings, m.enchantingSettings());
    const costs = m.calcEnchantmentCosts([row(), row()], 'const', settings);
    assert.equal(costs.capacityPoints, 75); assert.equal(m.calcEnchantGoldCost(costs.finalEffectCost, 'const', settings), 50050);
  }
});

test('QA-01/02 synthetic changed settings are consumed, with missing and malformed rows retaining defaults', async () => {
  const m = await math;
  const settings = m.enchantingSettings([
    { key: 'fenchantmentconstantdurationmult', value: 50 }, { id: 'fEnchantmentValueMult', value: 200 },
    { id: 'fEnchantmentChanceMult', value: 2 }, { id: 'fEnchantmentConstantChanceMult', value: 0.25 },
    { id: 'fEffectCostMult', value: NaN }, { id: 'fFatigueBase', value: 'bad' }
  ]);
  const costs = m.calcEnchantmentCosts([row()], 'const', settings);
  near(costs.precisePoints, 12.525); assert.equal(costs.capacityPoints, 12);
  assert.equal(m.calcEnchantGoldCost(costs.finalEffectCost, 'const', settings), 2505);
  assert.equal(m.calcSelfEnchantChance(50, 40, 40, costs.precisePoints, { type: 'const', settings }), 11);
});

test('QA-01/02 empty effects, unavailable rows and minimum values stay finite', async () => {
  const m = await math;
  assert.deepEqual(m.calcEnchantmentCosts([null, {}]), { effectCosts: [], capacityPoints: 0, precisePoints: 0, finalEffectCost: 0 });
  near(m.calcEffectCost({ b: 0, mag: 0, dur: 0 }, 'used', 0, 0, 0, 0, 'target'), 1.5);
  assert.equal(m.calcEnchantmentTotalPoints([row({ min: 0, max: 0, dur: 0 })]), 1);
});
