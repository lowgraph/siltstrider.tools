// The early-game gear benchmark, run against the staged game bundle: every spellcaster
// is shown Mentor's Ring, the ring in Samarys Ancestral Tomb near Seyda Neen that
// fortifies Intelligence and Willpower. Skipped when no bundle is staged.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const gearRows = import('../lib/gear-rows.mjs');
const characterCatalogs = import('../lib/character-catalogs.mjs');

const root = join(__dirname, '../public/game-data');
function staged(profile) {
  try {
    const { bundleId } = JSON.parse(readFileSync(join(root, 'current.json'), 'utf-8'));
    const read = name => {
      const path = join(root, bundleId, profile, `${name}.json`);
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')).records : null;
    };
    const catalogs = Object.fromEntries(['GearRows', 'Armor', 'Clothing', 'Races', 'Classes', 'Birthsigns',
      'Skills', 'Attributes', 'Spells'].map(name => [name, read(name)]));
    return Object.values(catalogs).every(Boolean) ? catalogs : null;
  } catch {
    return null;
  }
}

const MENTOR = 'ring_mentor_unique';
const CASTERS = ['Mage', 'Sorcerer', 'Healer', 'Battlemage', 'Nightblade', 'Spellsword'];
// A caster whose favoured attributes are neither Intelligence nor Willpower: the class
// alone must be enough, not a lucky favoured attribute.
const CUSTOM_CASTER = {
  spec: 'Magic', fav: ['Endurance', 'Personality'],
  maj: ['Destruction', 'Restoration', 'Alteration', 'Mysticism', 'Conjuration'],
  min: ['Illusion', 'Enchant', 'Alchemy', 'Unarmored', 'Speechcraft']
};
// Rows built before candidate shortlists publish only each slot's winner: Tamriel
// Rebuilt's ring row kept Ring of Toxic Cloud out of 172 eligible rings, so Mentor's
// Ring never reached the site there. Once the staged rows carry shortlists, TR is held
// to the benchmark like vanilla.
const pending = (profile, catalogs) => profile !== 'vanilla' && catalogs
  && !catalogs.GearRows.some(row => Array.isArray(row.candidates))
  ? 'the staged rows predate candidate shortlists; rebuild the gear rows' : undefined;

for (const profile of ['vanilla', 'tr']) {
  const catalogs = staged(profile);
  test(`every spellcaster is shown Mentor's Ring (${profile})`,
    { skip: !catalogs && 'no staged game bundle', todo: pending(profile, catalogs) }, async () => {
      const { buildGearGroups, gearRanking } = await gearRows;
      const { adaptCharacterCatalogs } = await characterCatalogs;
      const { classes } = adaptCharacterCatalogs({ catalogs }, catalogs.Spells);
      const builds = [...CASTERS.map(name => [name, classes[name]]), ['a custom caster', CUSTOM_CASTER]];
      const missing = [];
      const { buildTraits } = await import('../lib/build-traits.mjs');
      const casters = Object.entries(classes).filter(([, c]) => buildTraits(c).caster).map(([n]) => n).sort();
      assert.deepEqual(casters, [...CASTERS].sort(), 'the caster classes are exactly the benchmark\'s');
      for (const [name, cls] of builds) {
        assert.ok(cls, `${name} is a playable class in ${profile}`);
        const build = { race: 'Breton', sign: 'The Mage', className: name, spec: cls.spec,
          fav1: cls.fav[0], fav2: cls.fav[1], maj: cls.maj, min: cls.min };
        for (const theft of [false, true]) {
          const toggles = { theft, endgame: false, nearStart: false, darkBrotherhood: false };
          const groups = buildGearGroups(catalogs, build, toggles, gearRanking(build));
          // Two hands, two ring rows: either may carry it.
          const rings = groups.find(g => g.label === 'Clothing and jewelry')?.rows.filter(r => r.slot === 'ring') || [];
          const shown = rings.flatMap(r => [r.primary, r.alternative]).filter(Boolean);
          if (!shown.some(p => p.key === MENTOR)) {
            missing.push(`${name}${theft ? ' (steal on)' : ''}: ${shown.map(p => p.name).join(', ') || 'no ring'}`);
          }
        }
      }
      assert.deepEqual(missing, [], `ring slot without Mentor's Ring in ${profile}`);
    });
}
