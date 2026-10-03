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
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-43/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'factions',profile,width,theme);await c.until('document.querySelector(".faction-roster-item")');
    const read=()=>c.evaluate(`(()=>{const pane=document.querySelector('.faction-roster-pane'),list=pane.querySelector('[aria-label="Factions List"]'),label=document.querySelector('.faction-active-label'),p=pane.getBoundingClientRect(),l=list.getBoundingClientRect(),b=label.getBoundingClientRect();return {paneBottom:p.bottom,listBottom:l.bottom,listHeight:l.height,labelTop:b.top,labelLeft:b.left,paneRight:p.right,overlap:l.left<b.right&&l.right>b.left&&l.top<b.bottom&&l.bottom>b.top,active:label.textContent.trim(),listScrollHeight:list.scrollHeight,listClientHeight:list.clientHeight};})()`);
    const initial=await read();(c.report.factionPaneStates ||= []).push({case:c.report.cases.length,...initial});
    assert.equal(initial.overlap,false,'The Viewing bar cannot cover the roster: '+JSON.stringify(initial));
    assert.ok(initial.listBottom<=initial.paneBottom+1,'Roster scrolling is contained by its pane');
    await c.type('#faction-search-input','Ashlanders');await c.until('document.querySelector(".faction-roster-item")?.textContent.includes("Ashlanders")');
    const room=await c.evaluate(`(()=>{const list=document.querySelector('.faction-roster-pane [role=listbox]'),row=list.querySelector('.faction-roster-item');return {height:list.clientHeight,rowHeight:row.getBoundingClientRect().height};})()`);
    (c.report.factionRowStates ||= []).push(room);await c.screenshot(`QA-43-${profile}-${width}-${theme}-row`);
    assert.ok(room.height>=room.rowHeight+4,'The roster must have room to show a whole row: '+JSON.stringify(room));
    await c.evaluate(`(()=>{const list=document.querySelector('.faction-roster-pane [role=listbox]');list.scrollTop=list.scrollHeight;list.scrollIntoView({block:'center'});})()`);
    const attributes=await c.evaluate(`(()=>{const list=document.querySelector('.faction-roster-pane [role=listbox]'),row=list.querySelector('.faction-roster-item'),snippet=row.lastElementChild,a=snippet.getBoundingClientRect(),b=list.getBoundingClientRect();return {text:snippet.textContent.trim(),inside:a.top>=b.top-1&&a.bottom<=b.bottom+1,hit:document.elementFromPoint((a.left+a.right)/2,(a.top+a.bottom)/2)?.closest('.faction-roster-item')===row};})()`);
    assert.equal(attributes.text,'Agility · Endurance');assert.equal(attributes.inside,true,'The full attribute line can be scrolled into view');assert.equal(attributes.hit,true,'The Viewing bar does not intercept the attribute line');
    await c.click('.faction-roster-item');assert.match((await read()).active,/Viewing Ashlanders/);
    await c.type('#faction-search-input','not-a-faction');assert.match((await read()).active,/Viewing Ashlanders/);
    assert.equal(await c.evaluate('document.querySelector(\'.faction-roster-pane [aria-label="Factions List"]\').getAttribute("role")'),'status');
    c.assertAccessible(await c.audit(`QA-43-${profile}-${width}-${theme}-empty`));
    await c.type('#faction-search-input','Ashlanders');await c.until('document.querySelector(".faction-roster-item")');
    await c.evaluate('document.querySelector(".faction-active-label").scrollIntoView({block:"center"})');
    await finish(c,`QA-43-${profile}-${width}-${theme}`);return {initial,attributes,selection:true,emptySearch:true};
  });
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
