const { test } = require('node:test');
const assert = require('node:assert/strict');

test('premade-data exports complete and valid handcrafted build datasets', async () => {
  const { BUILDS, RACE_BUILDS, ARCE_BUILDS } = await import('../lib/premade-data.mjs');

  assert.equal(BUILDS.length, 41, 'Expected 41 playstyle builds');
  assert.equal(RACE_BUILDS.length, 20, 'Expected 20 race builds (10 races x 2 genders)');
  assert.equal(ARCE_BUILDS.length, 42, 'Expected 42 ARCE builds (21 races x 2 genders)');

  const allBuilds = [...BUILDS, ...RACE_BUILDS, ...ARCE_BUILDS];

  for (const build of allBuilds) {
    assert.ok(build.name, 'Build must have a name');
    assert.ok(build.race, `Build ${build.name} must have a race`);
    assert.ok(build.gender === 'Male' || build.gender === 'Female', `Build ${build.name} must specify Male or Female`);
    assert.ok(['Combat', 'Magic', 'Stealth'].includes(build.spec), `Build ${build.name} has invalid spec: ${build.spec}`);
    assert.ok(build.sign, `Build ${build.name} must have a birthsign`);

    const favs = (build.fav || '').split(',').map((s) => s.trim());
    assert.equal(favs.length, 2, `Build ${build.name} must have 2 favored attributes, got: ${build.fav}`);

    const majs = (build.maj || '').split(',').map((s) => s.trim());
    assert.equal(majs.length, 5, `Build ${build.name} must have 5 major skills, got: ${build.maj}`);

    const mins = (build.min || '').split(',').map((s) => s.trim());
    assert.equal(mins.length, 5, `Build ${build.name} must have 5 minor skills, got: ${build.min}`);

    // Verify all 10 skills are unique
    const uniqueSkills = new Set([...majs, ...mins]);
    assert.equal(uniqueSkills.size, 10, `Build ${build.name} has duplicate skills among major/minor: ${[...majs, ...mins].join(', ')}`);
  }
});
