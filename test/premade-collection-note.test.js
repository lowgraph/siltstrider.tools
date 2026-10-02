const {test}=require('node:test');const assert=require('node:assert/strict');
const {React}=require('./helpers/launch-render.cjs');
const {Premades}=require('./helpers/qa-render.cjs');const {mount}=require('./helpers/launch-render.cjs');
for(const profile of ['vanilla','tr','tr_arce'])test(`F04/F11: collection counts and first-visit hints follow ${profile} grouping without changing picks`,async()=>{
  const {BUILDS,RACE_BUILDS,ARCE_BUILDS}=await import('../lib/premade-data.mjs');let selected;
  await mount(Premades,async()=>{
    const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
    const note=()=>document.querySelector('.premade-collection-note').textContent;
    assert.match(note(),new RegExp(`Showing ${BUILDS.length} of ${BUILDS.length} playstyle`));
    assert.match(document.querySelector('.premade-welcome').textContent,/Pick a playstyle/);
    await React.act(async()=>button('By Race').click());
    const pool=profile==='tr_arce'?[...RACE_BUILDS,...ARCE_BUILDS]:RACE_BUILDS;
    assert.match(note(),new RegExp(`Showing ${pool.length} of ${pool.length} race-themed`));assert.match(note(),/separate collection, not a filter/);
    assert.match(document.querySelector('.premade-welcome').textContent,/Pick a race/);
    await React.act(async()=>button('Expand All').click());
    assert.equal(document.querySelectorAll('.premade-build-card').length,pool.length);
    await React.act(async()=>document.querySelector('.premade-build-card button').click());
    assert.deepEqual(selected,pool.find(b=>b.name===selected.name));
    await React.act(async()=>button('By Playstyle').click());assert.match(document.querySelector('.premade-welcome').textContent,/Pick a playstyle/);
  },{activeProfile:profile,onBuildOwn(){},onSelectBuild:build=>selected=build});
});
