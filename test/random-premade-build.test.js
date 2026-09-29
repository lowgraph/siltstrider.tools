const { test } = require('node:test');
const assert = require('node:assert/strict');

test('getPremadeBuildPool returns correct pool conforming to settings', async () => {
  const { getPremadeBuildPool, CANONICAL_RACES, BUILDS, RACE_BUILDS, ARCE_BUILDS } = await import('../lib/premade-data.mjs');

  const vanillaPool = getPremadeBuildPool({ world: 'vanilla', arce: false });
  assert.equal(vanillaPool.length, 61, 'Vanilla pool must contain 41 playstyle + 20 race builds');
  for (const b of vanillaPool) {
    assert.ok(CANONICAL_RACES.includes(b.race), `Vanilla pool build ${b.name} has non-canonical race: ${b.race}`);
  }

  const trPool = getPremadeBuildPool({ world: 'tr', arce: false });
  assert.equal(trPool.length, 61, 'TR without ARCE pool must contain 61 canonical builds');
  for (const b of trPool) {
    assert.ok(CANONICAL_RACES.includes(b.race), `TR non-ARCE pool build ${b.name} has non-canonical race: ${b.race}`);
  }

  const arcePool = getPremadeBuildPool({ world: 'tr', arce: true });
  assert.equal(arcePool.length, 103, 'ARCE pool must contain all 103 builds');
});

test('premadeToBuild converts premade entries to full build structures', async () => {
  const { premadeToBuild, BUILDS } = await import('../lib/premade-data.mjs');

  const sample = BUILDS[0];
  const build = premadeToBuild(sample, { world: 'tr', arce: true });

  assert.equal(build.version, 1);
  assert.equal(build.world, 'tr');
  assert.equal(build.arce, true);
  assert.equal(build.name, sample.name);
  assert.equal(build.race, sample.race);
  assert.equal(build.gender, sample.gender);
  assert.equal(build.className, 'Custom');
  assert.equal(build.sign, sample.sign);
  assert.equal(build.spec, sample.spec);
  assert.equal(build.maj.length, 5);
  assert.equal(build.min.length, 5);
  assert.notEqual(build.fav1, build.fav2, 'Favored attributes must be distinct');
  assert.equal(build.bitterCup, false);

  // Edge cases
  assert.equal(premadeToBuild(null), null, 'null premade returns null');
  assert.equal(premadeToBuild(undefined), null, 'undefined premade returns null');
});

test('getRandomPremadeBuild selects conforming builds with deterministic and boundary RNG', async () => {
  const { getRandomPremadeBuild, getPremadeBuildPool, CANONICAL_RACES } = await import('../lib/premade-data.mjs');

  // Deterministic RNG: first item (rng = () => 0)
  const firstVanilla = getRandomPremadeBuild({ world: 'vanilla', arce: false, rng: () => 0 });
  const pool = getPremadeBuildPool({ arce: false });
  assert.equal(firstVanilla.name, pool[0].name);
  assert.equal(firstVanilla.world, 'vanilla');
  assert.equal(firstVanilla.arce, false);

  // Deterministic RNG: last item (rng = () => 0.99999)
  const lastVanilla = getRandomPremadeBuild({ world: 'vanilla', arce: false, rng: () => 0.99999 });
  assert.equal(lastVanilla.name, pool[pool.length - 1].name);

  // Boundary RNG: clamps negative and >= 1 values safely
  const clampedLow = getRandomPremadeBuild({ world: 'vanilla', arce: false, rng: () => -0.5 });
  assert.equal(clampedLow.name, pool[0].name);

  const clampedHigh = getRandomPremadeBuild({ world: 'vanilla', arce: false, rng: () => 1.5 });
  assert.equal(clampedHigh.name, pool[pool.length - 1].name);

  // 100 random draws in vanilla: 100% must have canonical races and world: 'vanilla'
  for (let i = 0; i < 100; i++) {
    const b = getRandomPremadeBuild({ world: 'vanilla', arce: false });
    assert.ok(CANONICAL_RACES.includes(b.race), `Random vanilla build ${b.name} has non-canonical race ${b.race}`);
    assert.equal(b.world, 'vanilla');
    assert.equal(b.arce, false);
    assert.notEqual(b.fav1, b.fav2);
    assert.equal(b.maj.length, 5);
    assert.equal(b.min.length, 5);
  }

  // 100 random draws in TR non-ARCE: 100% must have canonical races and world: 'tr'
  for (let i = 0; i < 100; i++) {
    const b = getRandomPremadeBuild({ world: 'tr', arce: false });
    assert.ok(CANONICAL_RACES.includes(b.race), `Random TR build ${b.name} has non-canonical race ${b.race}`);
    assert.equal(b.world, 'tr');
    assert.equal(b.arce, false);
  }

  // Missing options / defaults
  const def = getRandomPremadeBuild();
  assert.ok(def.name);
  assert.equal(def.world, 'vanilla');
  assert.equal(def.arce, false);
});
