const assert=require('node:assert/strict');

async function setup(c,view,profile,width,theme) {
  await c.viewport(width);
  await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
  await c.navigate(view,profile);await c.waitForFonts();
}
async function finish(c,name) {
  assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'No page overflow');
  c.assertAccessible(await c.audit(name));await c.screenshot(name);
}

module.exports=async c=>{
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-42/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'travel',profile,width,theme);await c.until('document.querySelector(".transit-map svg[role=img]")');
    await c.evaluate('document.querySelector(".transit-map").scrollIntoView({block:"center"})');
    const state=await c.evaluate(`(()=>{const root=document.querySelector('.transit-map'),svg=root.querySelector('svg[role=img]'),texts=[...svg.querySelectorAll('text')],gaps=texts.filter(t=>t.textContent.trim().startsWith('≈')),others=texts.filter(t=>!gaps.includes(t)),overlaps=[];for(const gap of gaps){const a=gap.getBoundingClientRect();for(const other of others){const b=other.getBoundingClientRect();if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)overlaps.push({gap:gap.textContent,label:other.textContent});}}const legend=root.querySelector('.transit-map-gaps');return {overlaps,mapGapLabels:gaps.map(t=>t.textContent),legend:legend?.textContent.trim()||null,legendBelowMap:!legend||legend.getBoundingClientRect().top>=svg.getBoundingClientRect().bottom-1};})()`);
    assert.deepEqual(state.overlaps,[],'Gap annotations cannot cover region or settlement names: '+JSON.stringify(state.overlaps));
    assert.deepEqual(state.mapGapLabels,[],'Compressed-gap text belongs to the legend');
    if(profile!=='vanilla')assert.match(state.legend,/≈78 cells east–west/);
    assert.equal(state.legendBelowMap,true,'Gap explanation stays below the map');
    await finish(c,`QA-42-${profile}-${width}-${theme}`);return state;
  });
};
