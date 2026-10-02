const { test } = require('node:test');
const assert = require('node:assert/strict');

async function fixture() {
  const { BUILDS, premadeToBuild } = await import('../lib/premade-data.mjs');
  const build = premadeToBuild(BUILDS[0]);
  const item = (key, slot, extra) => ({
    key, name: key, slot, beastWearable: true,
    source: { kind: 'placed', easiestLevel: 1 }, effects: [], ...extra
  });
  const items = {
    mage_robe: item('mage_robe', 'robe', { effects: [{ name: 'Fortify Magicka', magnitude: 50 }] }),
    skill_robe: item('skill_robe', 'robe', { effects: [{ name: 'Fortify Skill', skill: 'light_armor', magnitude: 25 }] }),
    heavy: item('heavy', 'cuirass', { armorClass: 'heavy', armorRating: 80 }),
    light: item('light', 'cuirass', { armorClass: 'light', armorRating: 80 }),
    mage_ring: item('mage_ring', 'ring', { effects: [{ name: 'Fortify Magicka', magnitude: 50 }] }),
    skill_ring: item('skill_ring', 'ring', { effects: [{ name: 'Fortify Skill', skill: 'light_armor', magnitude: 25 }] }),
    sword: item('sword', 'weapon', { type: 'LB1H', weaponSkill: 'long_blade', damage: 60 }),
    spear: item('spear', 'weapon', { type: 'SP2H', weaponSkill: 'spear', damage: 60 }),
    shield: item('shield', 'shield', { armorClass: 'heavy', armorRating: 80 })
  };
  const slots = Object.fromEntries([['robe', 'mage_robe'], ['cuirass', 'heavy'], ['ring', 'mage_ring'], ['weapon', 'sword'], ['shield', 'shield']]
    .map(([slot, key]) => [slot, [{ item: key, score: 99, reasons: [['Published premade pick', 99]], warnings: [] }]]));
  const data = {
    catalogs: { BestInSlot: [false, true].map(allow => ({ build: build.name, toggles: { allowFormidableSources: allow }, slots })) },
    metadata: { BestInSlot: { items, model: {
      effects: { 'Fortify Magicka': { tier: 'strong', cap: 50, fit: 'caster' } },
      derived: { 'Fortify Skill': { major: 8, minor: 5, misc: 1, cap: 25 } }
    } } }
  };
  return { build, data };
}
const rows = result => result.groups.flatMap(group => group.rows);
const top = (result, slot) => rows(result).find(row => row.slotKey === slot).picks[0];

for (const weaponSetup of [null, 'one-handed', 'two-handed']) {
  test(`QA-26 unchanged premade retains published non-weapon picks (${weaponSetup})`, async () => {
    const { build, data } = await fixture();
    const { resolveBestInSlotPicks } = await import('../lib/best-in-slot.mjs');
    for (const allowFormidableSources of [false, true]) {
      const result = resolveBestInSlotPicks(data, build, { weaponSetup, allowFormidableSources });
      assert.equal(top(result, 'robe').pick.score, 99);
      assert.equal(top(result, 'cuirass').pick.score, 99);
      assert.equal(top(result, 'ring_1').pick.score, 99);
      if (weaponSetup) assert.equal(top(result, 'weapon').item.key, weaponSetup === 'two-handed' ? 'spear' : 'sword');
      if (weaponSetup === 'two-handed') assert.ok(!rows(result).some(row => row.slotKey === 'shield'));
    }
  });
  test(`QA-26 edited race scores the whole kit instead of restoring premade picks (${weaponSetup})`, async () => {
    const { build, data } = await fixture();
    const { resolveBestInSlotPicks } = await import('../lib/best-in-slot.mjs');
    const result = resolveBestInSlotPicks(data, { ...build, race: 'Argonian' }, { weaponSetup, beast: true });
    assert.equal(top(result, 'robe').pick.score, 6);
    assert.equal(top(result, 'cuirass').pick.score, 2);
    assert.equal(top(result, 'ring_1').pick.score, 6);
    assert.ok(rows(result).every(row => row.picks.every(pick => pick.pick.score !== 99)));
  });
  test(`QA-26 edited skills re-rank armor, clothing and jewelry (${weaponSetup})`, async () => {
    const { build, data } = await fixture();
    const { resolveBestInSlotPicks } = await import('../lib/best-in-slot.mjs');
    const edited = { ...build, maj: ['Light Armor', 'Long Blade'], min: ['Spear'] };
    const result = resolveBestInSlotPicks(data, edited, { weaponSetup });
    assert.equal(top(result, 'cuirass').item.key, 'light');
    assert.equal(top(result, 'robe').item.key, 'skill_robe');
    assert.equal(top(result, 'ring_1').item.key, 'skill_ring');
    assert.equal(top(result, 'robe').pick.score, 8);
    assert.ok(!rows(result).some(row => row.picks.some(pick => pick.item.key === 'mage_robe')));
  });
}
test('QA-26 a custom character named like a premade cannot select its published kit', async () => {
  const { build, data } = await fixture();
  const { resolveBestInSlotPicks } = await import('../lib/best-in-slot.mjs');
  const { premadeSource, ...custom } = build;
  const result = resolveBestInSlotPicks(data, { ...custom, className: 'QA Custom', maj: ['Light Armor'], min: [] }, { weaponSetup: 'one-handed' });
  assert.equal(top(result, 'robe').item.key, 'skill_robe');
  assert.equal(top(result, 'cuirass').item.key, 'light');
});
test('QA-26 other character edits invalidate named picks and reverting restores them without mutating data', async () => {
  const { build, data } = await fixture();
  const { resolveBestInSlotPicks } = await import('../lib/best-in-slot.mjs');
  const original = JSON.stringify(data);
  for (const edit of [{ gender: 'Male' }, { sign: 'The Tower' }, { fav1: 'Luck' }, { spec: 'Combat' }, { bitterCup: true }]) {
    assert.equal(top(resolveBestInSlotPicks(data, { ...build, ...edit }), 'robe').pick.score, 6);
  }
  assert.equal(top(resolveBestInSlotPicks(data, build), 'robe').pick.score, 99);
  assert.equal(JSON.stringify(data), original);
});
test('QA-26 endgame explanation uses the shared edited character name', async () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Module = require('node:module');
  const path = require('node:path');
  const { build, data } = await fixture();
  const filename = path.resolve(__dirname, '../components/character-builder/best-in-slot-view.jsx');
  const bundled = require('esbuild').buildSync({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'] });
  const loaded = new Module(filename, module); loaded.paths = module.paths;
  loaded._compile(bundled.outputFiles[0].text, filename);
  for (const name of [build.name, 'QA Player']) {
    const html = renderToStaticMarkup(React.createElement(loaded.exports.BestInSlotView, { featureData: data, build: { ...build, race: 'Argonian', name }, beast: true, weaponSetup: 'one-handed' }));
    assert.ok(html.includes(name === build.name ? 'Based on '+name : '(QA Player)'));
  }
});
