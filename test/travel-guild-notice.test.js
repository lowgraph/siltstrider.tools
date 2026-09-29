const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const graph = () => import('../lib/travel-graph.mjs');
const save = factions => ({ progress: { factions } });

test('a loaded save that is not in the Mages Guild is warned about Guild Guides', async () => {
  const { guildFromSave, guildGuideNotice } = await graph();
  const outsider = guildFromSave(save([{ id: 'Fighters Guild', rank: 2 }]));
  assert.deepEqual(outsider, { mageGuild: false, conjurer: false });
  const leftOut = guildGuideNotice(outsider, false);
  assert.match(leftOut, /not in the Mages Guild/);
  assert.match(leftOut, /leave out Guild Guides/);
  assert.match(leftOut, /only members, between Mages Guild halls/);
  // The player ticked "Mages Guild member" anyway: say what to untick instead.
  const ticked = guildGuideNotice(outsider, true);
  assert.match(ticked, /teleport only members/);
  assert.match(ticked, /Untick “Mages Guild member”/);
  assert.doesNotMatch(ticked, /leave out/, 'the routes do not leave them out while it is ticked');
});

test('no warning without a save, without a faction list, or for a member of any rank', async () => {
  const { guildFromSave, guildGuideNotice } = await graph();
  assert.equal(guildGuideNotice(null, true), null, 'no save: the page keeps its defaults');
  assert.equal(guildFromSave({ progress: {} }), null);
  assert.equal(guildGuideNotice(guildFromSave({ progress: {} }), true), null, 'a save with no faction list says nothing either way');
  for (const rank of [0, 3, 4, 9]) {
    const member = guildFromSave(save([{ id: 'Mages Guild', rank }]));
    assert.equal(member.mageGuild, true, `rank ${rank} is a member`);
    assert.equal(member.conjurer, rank >= 4, `Conjurer from rank 4 (rank ${rank})`);
    assert.equal(guildGuideNotice(member, true), null);
    assert.equal(guildGuideNotice(member, false), null, 'a member who unticked the box needs no warning');
  }
});

test('an expelled or malformed membership counts as not a member, and is warned', async () => {
  const { guildFromSave, guildGuideNotice } = await graph();
  for (const entry of [{ id: 'Mages Guild', rank: 5, expelled: true }, { id: 'mages guild', rank: -1 }, { id: 'Mages Guild', rank: 1.5 }, { id: 'Mages Guild' }]) {
    const guild = guildFromSave(save([entry]));
    assert.equal(guild.mageGuild, false, JSON.stringify(entry));
    assert.equal(guild.conjurer, false);
    assert.ok(guildGuideNotice(guild, false), `warned: ${JSON.stringify(entry)}`);
  }
  assert.equal(guildFromSave(save([{ id: 'MAGES GUILD', rank: 0 }])).mageGuild, true, 'the faction id is matched regardless of case');
});

test('the Travel page shows the warning with the options and labels Guild Guide legs', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'components', 'calculators', 'travel', 'travel-workstation.jsx'), 'utf8');
  assert.match(page, /const guildNotice = guildGuideNotice\(saveGuild, mageGuild\);/);
  assert.match(page, /\{guildNotice && \(\s*<p role="note" className="guild-guide-notice[^"]*">\{guildNotice\}<\/p>/);
  assert.match(page, /\{step\.kind === "Guild Guide" && \(\s*<div className="guild-guide-members[^"]*">Mages Guild members only\.<\/div>/);
  assert.match(page, /useState\(true\);\s*\n\s*const \[conjurer,setConjurer\] = useState\(false\);/, 'without a save: Mages Guild on, Conjurer off (owner decision)');
});
