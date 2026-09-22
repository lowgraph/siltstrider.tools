const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function component(file, exportName = "default") {
  const result = require("esbuild").buildSync({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

const enginePromise = import('../lib/challenge-engine.mjs');
const AboutView = component('components/views/about-view.jsx');
const ChangelogView = component('components/views/changelog-view.jsx');

test('challenge-engine: rollCardAspect rolls valid identity aspects', async () => {
  const { rollCardAspect, createEmptyRun, DEFAULT_RACES, DEFAULT_SIGNS } = await enginePromise;

  let run = createEmptyRun();

  // 1. Race roll
  run = rollCardAspect('race', run);
  assert.ok(run.race, 'race should be rolled');
  assert.ok(DEFAULT_RACES.includes(run.race), `race ${run.race} must be in DEFAULT_RACES`);
  assert.notEqual(run.race, 'Hill Giant', 'Hill Giant must never roll');

  // 2. Gender roll
  run = rollCardAspect('gender', run);
  assert.ok(['Male', 'Female'].includes(run.gender), `gender ${run.gender} must be Male or Female`);

  // 3. Sign roll
  run = rollCardAspect('sign', run);
  assert.ok(run.sign, 'sign should be rolled');
  assert.ok(DEFAULT_SIGNS.includes(run.sign), `sign ${run.sign} must be in DEFAULT_SIGNS`);

  // 4. Class roll
  run = rollCardAspect('cls', run);
  assert.ok(run.cls, 'class should be rolled');
  if (run.cls === 'Custom') {
    assert.ok(run.maj.length === 5, 'custom class must have 5 major skills');
    assert.ok(run.min.length === 5, 'custom class must have 5 minor skills');
    assert.equal(new Set([...run.maj, ...run.min]).size, 10, 'must have 10 unique skills');
  }
});

test('challenge-engine: rollCardAspect rolls skills without overlapping', async () => {
  const { rollCardAspect, createEmptyRun } = await enginePromise;

  let run = createEmptyRun();
  run = rollCardAspect('maj', run);
  assert.equal(run.maj.length, 5);
  run = rollCardAspect('min', run);
  assert.equal(run.min.length, 5);

  const combined = [...run.maj, ...run.min];
  assert.equal(new Set(combined).size, 10, 'majors and minors must never share skills');
});

test('challenge-engine: randomizeFullRun respects locked slots and produces deterministic seeds', async () => {
  const { randomizeFullRun, createEmptyRun } = await enginePromise;

  const initial = {
    ...createEmptyRun(),
    race: 'Dunmer',
    gender: 'Female',
    sign: 'The Lady',
    cls: 'Assassin',
    major: 'Complete the main quest'
  };

  const locks = {
    race: true,
    gender: true,
    sign: true,
    major: true,
    cls: false,
    rest: false,
    obj: false
  };

  const seed = 'TEST-SEED-1234';
  const rolled = randomizeFullRun(initial, locks, { seed, world: 'vanilla' });

  // Pinned attributes remain unchanged
  assert.equal(rolled.race, 'Dunmer');
  assert.equal(rolled.gender, 'Female');
  assert.equal(rolled.sign, 'The Lady');
  assert.equal(rolled.major, 'Complete the main quest');

  // Unpinned attributes are populated
  assert.ok(rolled.cls, 'class should be populated');
  assert.ok(rolled.rests.length > 0, 'restrictions should be populated');
  assert.ok(rolled.minors.length > 0, 'minor objectives should be populated');
  assert.equal(rolled.seed, seed);

  // Determinism check: rerun with same seed must produce identical run
  const rerun = randomizeFullRun(initial, locks, { seed, world: 'vanilla' });
  assert.deepEqual(rerun, rolled, 'identical seeds must produce identical runs');
});

test('AboutView renders authentic legal, credits, colophon, and support links', () => {
  const html = renderToStaticMarkup(React.createElement(AboutView));

  assert.ok(html.includes('About Silt Strider'));
  assert.ok(html.includes('tmarcalferreira@gmail.com'), 'corrections mailto missing');
  assert.ok(html.includes('https://ko-fi.com/tmarcalferreira'), 'ko-fi link missing');
  assert.ok(html.includes('https://www.paypal.com/ncp/payment/CELX7C97ZJ2D6'), 'paypal link missing');
  assert.ok(html.includes('Pelagiad by Isak Larborn'), 'font credits missing');
  assert.ok(html.includes('Bethesda Softworks'), 'legal disclaimer missing');
});

test('ChangelogView renders timeline with timestamps and recent milestone updates', () => {
  const html = renderToStaticMarkup(React.createElement(ChangelogView));

  assert.ok(html.includes('Changelog'));
  assert.ok(html.includes('September 21, 2026'), 'September 21 milestone missing');
  assert.ok(html.includes('September 20, 2026'), 'September 20 milestone missing');
  assert.ok(html.includes('September 19, 2026'), 'September 19 milestone missing');
  assert.ok(html.includes('September 18, 2026'), 'September 18 milestone missing');
  assert.ok(html.includes('September 13, 2026'), 'First public release date missing');
});

// ---------------------------------------------------------------------------
// Adversarial QA Tests
// ---------------------------------------------------------------------------

test('Adversarial QA 1: Robust handling of missing, null, or corrupted inputs to rollCardAspect', async () => {
  const { rollCardAspect } = await enginePromise;

  // Null current run should not throw
  const r1 = rollCardAspect('race', null, {});
  assert.ok(r1.race);

  // Unknown aspect key should safely return unchanged run
  const r2 = rollCardAspect('NON_EXISTENT_KEY', { foo: 'bar' }, {});
  assert.equal(r2.foo, 'bar');

  // Corrupted catalogs object should safely fall back to default pools
  const r3 = rollCardAspect('cls', {}, { catalogs: { classes: null } });
  assert.ok(r3.cls);
});

test('Adversarial QA 2: Strict conflict avoidance under high restriction count', async () => {
  const { rollCardAspect, createEmptyRun } = await enginePromise;

  const runWithLevel50 = {
    ...createEmptyRun(),
    major: 'Reach level 50'
  };

  // Roll 6 restrictions under 'Reach level 50'
  const rolled = rollCardAspect('rest', runWithLevel50, { restrictionCount: 6 });
  for (const r of rolled.rests) {
    assert.ok(!/level 20 cap|level 10 cap|stay level 1/i.test(r), `clashing restriction rolled: ${r}`);
  }
});

test('Adversarial QA 3: Tamriel Rebuilt profile correctly unlocks mainland majors and excludes forbidden pool', async () => {
  const { getActiveMajors, getActivePool, TR_MAJORS } = await enginePromise;

  const vanillaMajors = getActiveMajors('vanilla');
  const trMajors = getActiveMajors('tr');
  assert.equal(trMajors.length, vanillaMajors.length + TR_MAJORS.length);

  const trPool = getActivePool('tr');
  assert.ok(!trPool.includes('No Tribunal or Bloodmoon DLC'), 'TR pool must exclude No Tribunal or Bloodmoon DLC');
});

test('unticked difficulty bands leave their restrictions, and Reach level 50, out of the pools', async () => {
  const { getActiveMajors, getActivePool, rollCardAspect } = await enginePromise;
  const { band, GRIND_MAJORS } = await import('../lib/challenge-math.mjs');
  const easyMedium = { Easy: true, Medium: true, Hard: false, Grind: false };
  const pool = getActivePool('vanilla', easyMedium);
  assert.ok(pool.length > 0);
  assert.deepEqual([...new Set(pool.map(band))].sort(), ['Easy', 'Medium']);
  assert.ok(!getActiveMajors('vanilla', easyMedium).some((m) => GRIND_MAJORS.includes(m)));
  assert.ok(getActiveMajors('vanilla', { ...easyMedium, Grind: true }).includes('Reach level 50'));
  assert.ok(getActiveMajors('vanilla').includes('Reach level 50'), 'without bands nothing is filtered');

  for (let i = 0; i < 200; i++) {
    const run = rollCardAspect('major', rollCardAspect('rest', { major: '' }, { allowedBands: easyMedium, restrictionCount: 5 }), { allowedBands: easyMedium });
    assert.ok(run.rests.every((r) => ['Easy', 'Medium'].includes(band(r))), run.rests.join(', '));
    assert.notEqual(run.major, 'Reach level 50');
  }
});
