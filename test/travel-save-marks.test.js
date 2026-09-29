const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const graph = () => import('../lib/travel-graph.mjs');

test('a save tells a known Intervention spell from a carried scroll, and the spell wins', async () => {
  const { interventionSources, interventionsFromSave } = await graph();
  const save = (spells, inventory) => ({ stuff: { spells, inventory } });
  assert.deepEqual(interventionSources(save(['Almsivi Intervention'], [])), { divine: null, almsivi: 'spell' });
  assert.deepEqual(interventionSources(save([], [{ id: 'sc_DivineIntervention', count: 1 }])), { divine: 'scroll', almsivi: null });
  assert.deepEqual(interventionSources(save(['divine intervention'], [{ id: 'sc_divineintervention' }])), { divine: 'spell', almsivi: null }, 'knowing the spell beats carrying the scroll');
  assert.deepEqual(interventionSources(null), { divine: null, almsivi: null });
  assert.deepEqual(interventionSources(save([42, null, {}], [null, {}, { id: 7 }])), { divine: null, almsivi: null }, 'malformed entries are ignored');
  // The booleans the page has always used are unchanged.
  assert.deepEqual(interventionsFromSave(save([], [{ id: 'sc_almsiviintervention' }])), { divine: false, almsivi: true });
});

test('an option keeps its "from your save" mark only while it holds the save\'s value', async () => {
  const { saveMarks } = await graph();
  const fromSave = { guild: { mageGuild: false, conjurer: false }, spells: { divine: false, almsivi: true } };
  assert.deepEqual(saveMarks(null, { mageGuild: true }), {}, 'no save, no marks');
  assert.deepEqual(saveMarks(fromSave, { mageGuild: false, conjurer: false, spells: { divine: false, almsivi: true } }),
    { mageGuild: true, conjurer: true, divine: true, almsivi: true }, 'everything as the save set it, unticked ones too');
  assert.deepEqual(saveMarks(fromSave, { mageGuild: true, conjurer: false, spells: { divine: true, almsivi: false } }),
    { mageGuild: false, conjurer: true, divine: false, almsivi: false }, 'the player changed three: those lose the mark');
  const noFactions = saveMarks({ guild: null, spells: { divine: true, almsivi: false } }, { mageGuild: true, spells: { divine: true } });
  assert.equal('mageGuild' in noFactions, false, 'a save without a faction list does not claim the guild box');
  assert.equal(noFactions.divine, true);
  assert.equal(noFactions.almsivi, true, 'missing current spells count as unticked');
});

test('a ticked Intervention from a scroll warns that it is spent on first use', async () => {
  const { interventionMarkText } = await graph();
  assert.equal(interventionMarkText('scroll', true), 'from your save: a scroll, one use');
  assert.equal(interventionMarkText('spell', true), 'from your save');
  assert.equal(interventionMarkText('scroll', false), 'from your save', 'an unticked box says nothing about the scroll');
  assert.equal(interventionMarkText(null, false), 'from your save', 'the save has neither: the unticked box still came from it');
});

test('the Travel page puts the marks beside the guild boxes, the spells and the carried items', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'components', 'calculators', 'travel', 'travel-workstation.jsx'), 'utf8');
  assert.match(page, /Mages Guild member\{marks\.mageGuild && <FromSave \/>\}/);
  assert.match(page, /Conjurer rank or higher\{marks\.conjurer && <FromSave \/>\}/);
  assert.match(page, /\{marks\[kind\] && <FromSave>\{interventionMarkText\(saveSources\?\.\[kind\], spells\[kind\]\)\}<\/FromSave>\}/);
  assert.match(page, /\{held\.has\(item\.id\) && savedItems\?\.has\(item\.id\) && <FromSave \/>\}/, 'only ticked items that came from the save');
});
