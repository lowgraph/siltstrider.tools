const { test } = require("node:test");
const assert = require("node:assert/strict");

const scale = () => import("../lib/chart-scale.mjs");
const levels = () => import("../lib/level-math.mjs");

test("niceTicks reaches the maximum in round steps from zero", async () => {
  const { niceTicks } = await scale();
  assert.deepEqual(niceTicks(534), [0, 200, 400, 600]);
  assert.deepEqual(niceTicks(294), [0, 100, 200, 300]);
  assert.deepEqual(niceTicks(1000), [0, 250, 500, 750, 1000]);
  for (const bad of [0, -5, NaN, undefined]) {
    const ticks = niceTicks(bad);
    assert.equal(ticks[0], 0);
    assert.ok(ticks[ticks.length - 1] > 0, `a usable axis even for ${bad}`);
  }
});

test("levelTicks keeps both ends and never crowds the last label", async () => {
  const { levelTicks } = await scale();
  assert.deepEqual(levelTicks(1, 50), [1, 10, 20, 30, 40, 50]);
  assert.deepEqual(levelTicks(1, 30), [1, 5, 10, 15, 20, 25, 30]);
  assert.deepEqual(levelTicks(1, 72), [1, 10, 20, 30, 40, 50, 60, 72], "70 would sit on top of 72");
  assert.deepEqual(levelTicks(1, 13), [1, 2, 4, 6, 8, 10, 13]);
  assert.deepEqual(levelTicks(5, 5), [5]);
  assert.deepEqual(levelTicks(1, 2), [1, 2]);
  assert.deepEqual(levelTicks(9, 3), [], "an inverted range has no ticks");
  assert.deepEqual(levelTicks(NaN, 10), []);
  for (const [a, b] of [[1, 50], [1, 72], [3, 40], [1, 100]]) {
    assert.ok(levelTicks(a, b, 8).length <= 8, `${a}-${b} stays within the tick budget`);
  }
});

const nightblade = {
  level: 1,
  attributes: { Strength: 40, Intelligence: 40, Willpower: 40, Agility: 40, Speed: 60, Endurance: 40, Personality: 30, Luck: 40 },
  skills: {},
  maj: ["Mysticism", "Illusion", "Alteration", "Sneak", "Short Blade"],
  min: ["Light Armor", "Unarmored", "Destruction", "Marksman", "Security"],
  health: 40
};

test("the health curve reports Endurance per level and when the rushed path maxes it", async () => {
  const { calculateHealthGrowthCurve } = await levels();
  const curve = calculateHealthGrowthCurve(nightblade, 30);
  assert.equal(curve.optimalEndurance.length, curve.levels.length);
  assert.equal(curve.delayedEndurance.length, curve.levels.length);
  assert.equal(curve.optimalEndurance[0], 40);
  assert.equal(curve.enduranceMaxLevel, 13, "40 Endurance plus 5 a level reaches 100 at level 13");
  assert.equal(curve.optimalEndurance[curve.levels.indexOf(13)], 100);
  assert.equal(curve.delayedEndurance[curve.levels.indexOf(20)], 40, "the delayed path holds Endurance until level 20");
  assert.equal(curve.optimalHealth.at(-1), 294);
  assert.equal(curve.delayedHealth.at(-1), 161);
});

test("a character already at Endurance 100 is maxed from the start", async () => {
  const { calculateHealthGrowthCurve } = await levels();
  const tank = { ...nightblade, attributes: { ...nightblade.attributes, Endurance: 100 }, health: 70 };
  const curve = calculateHealthGrowthCurve(tank, 10);
  assert.equal(curve.enduranceMaxLevel, 1);
  assert.ok(curve.optimalEndurance.every((e) => e === 100));
});
