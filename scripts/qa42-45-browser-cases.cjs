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
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-45/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'travel',profile,width,theme);await c.until('document.querySelector(".travel-beginner-help")');
    const help=await c.evaluate('document.querySelector(".travel-beginner-help").textContent.replace(/\\s+/g," ").trim()');
    assert.match(help,/Mark records a place.*Recall returns.*not included/s);assert.match(help,/Propylons are teleporters.*indices.*keys/s);
    const cheapest='Cheapest prioritizes estimated fares. Its comparison with Fewest legs shows fare and outdoor movement time.';
    assert.ok(help.includes(cheapest));assert.ok(await c.evaluate(`document.querySelector('.calculation-notes').textContent.includes(${JSON.stringify(cheapest)})`));
    await c.evaluate('document.querySelector(".travel-beginner-help").scrollIntoView({block:"center"})');await finish(c,`QA-45-travel-${profile}-${width}-${theme}`);
    await c.navigate('alchemy',profile);await c.until('document.querySelector("#reverse-alchemy-search")');
    const badge=await c.evaluate('[...document.querySelectorAll(".alchemy-workstation span")].find(s=>s.textContent.startsWith("Live:"))?.textContent');
    assert.match(badge,new RegExp(profile==='tr_arce'?'TR \\+ ARCE':profile==='tr'?'Tamriel Rebuilt':'Vanilla'));assert.doesNotMatch(badge,/TR_ARCE/);
    await c.type('#reverse-alchemy-search','Restore Health');await c.button('Restore Health');await c.until('document.querySelector(".reverse-alchemy-pair")');
    const order=await c.evaluate('document.querySelector(".reverse-alchemy-order-help").textContent');
    assert.match(order,/Additional effects are other potion effects shared by both ingredients/);assert.match(order,/Ingredient value is their combined base gold value.*not a shop price/s);
    await c.evaluate('document.querySelector(".reverse-alchemy-order-help").scrollIntoView({block:"center"})');await finish(c,`QA-45-alchemy-${profile}-${width}-${theme}`);
    const raw=require('../test/helpers/qa-staged-data.cjs').save();raw.identity.name='QA – Rival House';raw.progress.factions=[{id:'hlaalu',rank:0,reputation:0,expelled:false}];
    if(profile!=='vanilla')raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm');if(profile==='tr_arce')raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
    const {rememberSave}=await import('../lib/active-save-store.mjs'),store={};await rememberSave(raw,{setItem:(k,v)=>store[k]=v});
    await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);
    await c.navigate('factions',profile);await c.type('#faction-search-input','Redoran');await c.until('document.querySelector(".faction-roster-item")');
    const rival=await c.evaluate('document.querySelector(".faction-roster-item").textContent');assert.match(rival,/Rival Joined/);assert.doesNotMatch(rival,/Eligible to Join|Unqualified/);
    await c.evaluate('document.querySelector(".faction-roster-pane").scrollIntoView({block:"center"})');await finish(c,`QA-45-factions-${profile}-${width}-${theme}`);
    await c.evaluate('localStorage.removeItem("silt-active-save")');await c.navigate('builder',profile);await c.builderTab('builder');
    await c.until('document.querySelector("#gear-advisor")');
    const gear=await c.evaluate('document.querySelector("#gear-advisor > div > div > p").textContent');assert.match(gear,/closest archetype:/);assert.doesNotMatch(gear,/\(.* archetype\)/);
    // The header arrives before the lazy catalogs and automatic ranking finish.
    // Audit the ready controls after their disabled-opacity transition settles.
    await c.evaluate('document.querySelector("#gear-advisor").scrollIntoView({block:"start"})');
    await c.until(`(()=>{const buttons=[...document.querySelectorAll('#gear-advisor button')],controls=['Optimize Gear','Equip early recommendations →','Equip late-game recommendations →'].map(label=>buttons.find(b=>b.textContent.trim()===label));return document.querySelector('#gear-advisor .best-in-slot-recommendations table')&&controls.every(b=>b&&!b.disabled&&Number(getComputedStyle(b).opacity)>=.99);})()`);
    await finish(c,`QA-45-gear-${profile}-${width}-${theme}`);
    return {help,badge,order,rival,gear};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-44/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'enchanting',profile,width,theme);await c.until('document.querySelector(\'select[aria-label="Effect 1"]\')?.options.length>20');
    await c.select('select[aria-label="Effect 1"]','Restore Health (base 5)');
    const first=await c.evaluate('document.querySelector(\'select[aria-label="Effect 1"]\').value');
    const layouts=[];
    for(const count of [2,3]) {
      await c.button('Add Effect');await c.until(`document.querySelectorAll('button[title="Remove effect from stack"]').length===${count}`);
      const state=await c.evaluate(`[...document.querySelectorAll('button[title="Remove effect from stack"]')].map(b=>{const r=document.createRange();r.selectNodeContents(b);const text=[...r.getClientRects()].filter(r=>r.width>0),button=b.getBoundingClientRect(),card=b.parentElement.parentElement.getBoundingClientRect(),select=b.parentElement.querySelector('select').getBoundingClientRect();return {label:b.textContent.trim(),lines:new Set(text.map(r=>Math.round(r.top))).size,inside:button.left>=card.left&&button.right<=card.right&&text.every(r=>r.left>=button.left-1&&r.right<=button.right+1),separated:select.right<=button.left+1,buttonWidth:button.width};})`);
      assert.equal(state.length,count);for(const row of state){assert.equal(row.label,'Remove');assert.equal(row.lines,1,'Remove remains on one line: '+JSON.stringify(row));assert.equal(row.inside,true,'Remove text and button fit inside the card');assert.equal(row.separated,true,'The effect picker leaves space for Remove');}
      layouts.push({count,state});
    }
    await c.evaluate('document.querySelector(\'button[title="Remove effect from stack"]\').scrollIntoView({block:"center"})');
    await finish(c,`QA-44-${profile}-${width}-${theme}`);
    await c.click('button[aria-label="Remove effect 2"]');await c.until('document.querySelectorAll(\'select[aria-label^="Effect "]\').length===2');
    assert.equal(await c.evaluate('document.querySelector(\'select[aria-label="Effect 1"]\').value'),first,'Removing another effect preserves the first effect');
    await c.click('button[aria-label="Remove effect 2"]');await c.until('document.querySelectorAll(\'button[title="Remove effect from stack"]\').length===0');
    assert.equal(await c.evaluate('document.querySelector(\'select[aria-label="Effect 1"]\').value'),first);return {layouts,removePreservesFirst:true,lastEffectRetained:true};
  });
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
