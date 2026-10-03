const assert=require('node:assert/strict');

module.exports=async c=>{
  for(const profile of ['vanilla','tr','tr_arce'])for(const view of ['home','builder','vault'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-46/${profile}/${view}/${width}/${theme}`,async()=>{
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
    const raw=require('../test/helpers/qa-staged-data.cjs').save();raw.identity.name='QA – Clear loaded save';
    if(profile!=='vanilla')raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm');
    if(profile==='tr_arce')raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
    const {rememberSave}=await import('../lib/active-save-store.mjs');const store={};assert.equal(await rememberSave(raw,{setItem:(k,v)=>store[k]=v}),true);
    await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);
    await c.navigate(view,profile);await c.until(view==='home'?'document.querySelector(".home-save--loaded")':'document.querySelector(".save-import-notice")');
    const label=view==='home'?'Clear the save':'Clear save';
    const opener=await c.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});b.dataset.qaClear='true';return '[data-qa-clear]';})()`);
    const kept=await c.evaluate('localStorage.getItem("silt-active-save")');assert.ok(kept);
    await c.click(opener);await c.until('document.querySelector("[role=alertdialog]")');
    const description=await c.evaluate('document.querySelector("[role=alertdialog]").textContent');assert.match(description,/QA – Clear loaded save/);assert.match(description,/original save file is unchanged/);
    assert.equal(await c.evaluate('document.activeElement.textContent.trim()'),'Cancel');
    assert.equal(await c.evaluate('localStorage.getItem("silt-active-save")'),kept);
    c.assertAccessible(await c.audit(`QA-46-dialog-${profile}-${view}-${width}-${theme}`));await c.screenshot(`QA-46-dialog-${profile}-${view}-${width}-${theme}`);
    await c.key('Escape','Escape',27);await c.until('!document.querySelector("[role=alertdialog]")');
    assert.equal(await c.evaluate('document.activeElement.matches("[data-qa-clear]")'),true);
    await c.click(opener);await c.button('Cancel');assert.equal(await c.evaluate('localStorage.getItem("silt-active-save")'),kept);
    assert.equal(await c.evaluate('document.activeElement.matches("[data-qa-clear]")'),true);
    await c.click(opener);await c.click('[role=alertdialog] button:last-child');
    await c.until('!localStorage.getItem("silt-active-save")&&!document.querySelector("[role=alertdialog]")');
    await c.until(view==='builder'?'document.activeElement.id==="main-content"':'document.activeElement.hasAttribute("data-open-save-file")');
    assert.equal(await c.evaluate('Boolean(document.querySelector(".save-import-notice,.home-save--loaded"))'),false);
    assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
    c.assertAccessible(await c.audit(`QA-46-cleared-${profile}-${view}-${width}-${theme}`));await c.screenshot(`QA-46-cleared-${profile}-${view}-${width}-${theme}`);
    return {cancel:true,escape:true,confirmed:true,focusRestored:true,world:profile};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-47/${profile}/${width}/${theme}`,async()=>{
    const {worldLabel}=await import('../lib/home-data.mjs');const label=worldLabel(profile),statuses={};
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
    for(const tool of ['enchanting','spellmaking','factions']) {
      await c.navigate(tool,profile);await c.until(`[...document.querySelectorAll('span')].some(s=>/Live:/.test(s.textContent))`);
      const status=await c.evaluate(`(()=>{const b=[...document.querySelectorAll('span')].find(s=>/Live:/.test(s.textContent));b.dataset.qaStatus='true';return b.textContent.trim()})()`);
      assert.ok(status.includes(`(${label})`),status);assert.doesNotMatch(status,/TR_ARCE|\(TR\)|\(VANILLA\)/);
      await c.evaluate('document.querySelector("[data-qa-status]").scrollIntoView({block:"center"})');await c.waitForFonts();
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'The world name fits at this width');
      c.assertAccessible(await c.audit(`QA-47-${tool}-${profile}-${width}-${theme}`));await c.screenshot(`QA-47-${tool}-${profile}-${width}-${theme}`);
      statuses[tool]=status;
    }
    return statuses;
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-43-remainder/${profile}/${width}/${theme}`,async()=>{
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
    await c.navigate('factions',profile);await c.until('[...document.querySelectorAll(".faction-roster-item")].some(b=>b.textContent.includes("Blades"))');
    await c.evaluate(`(()=>{const b=[...document.querySelectorAll('.faction-roster-item')].find(b=>b.textContent.includes('Blades'));b.dataset.qaBlades='true';document.querySelector('.journal-factions-root').scrollIntoView({block:'start'});})()`);
    const read=()=>c.evaluate(`(()=>{const row=document.querySelector('[data-qa-blades]'),list=row.parentElement,pane=document.querySelector('.faction-roster-pane'),label=document.querySelector('.faction-active-label'),badge=[...row.querySelectorAll('span')].find(s=>/Eligible to Join|Unqualified/.test(s.textContent));const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};return {row:rect(row),list:rect(list),pane:rect(pane),label:rect(label),badge:badge&&rect(badge),text:row.textContent.trim(),scrollTop:list.scrollTop,listStyle:{overflow:getComputedStyle(list).overflowY,minHeight:getComputedStyle(list).minHeight},rowFits:row.offsetHeight+16<=list.clientHeight};})()`);
    const initial=await read();(c.report.qa43RemainderStates ||= []).push({profile,width,theme,initial});await c.screenshot(`QA-43-remainder-initial-${profile}-${width}-${theme}`);
    if(width<768) {
      assert.ok(initial.rowFits,'The unfiltered roster must have room for a whole Blades row: '+JSON.stringify(initial));
      assert.ok(initial.row.top>=initial.list.top&&initial.row.bottom<=initial.list.bottom,'The initial Blades row and its badge must be whole above the Viewing bar: '+JSON.stringify(initial));
    }
    await c.evaluate('document.querySelector("[data-qa-blades]").scrollIntoView({block:"nearest"})');await c.waitForFonts();
    const visible=await read();
    assert.ok(visible.row.top>=visible.list.top-1&&visible.row.bottom<=visible.list.bottom+1,'The complete row is visible after revealing it: '+JSON.stringify(visible));
    const hit=await c.evaluate(`(()=>{const row=document.querySelector('[data-qa-blades]'),badge=[...row.querySelectorAll('span')].find(s=>/Eligible to Join|Unqualified/.test(s.textContent)),r=badge.getBoundingClientRect();return document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2)?.closest('.faction-roster-item')===row})()`);
    assert.equal(hit,true,'The Viewing bar and phone navigation cannot intercept the badge');
    await c.click('[data-qa-blades]');await c.until('document.querySelector(".faction-active-label").textContent.includes("Viewing Blades")');
    await c.evaluate('document.querySelector("[data-qa-blades]").scrollIntoView({block:"nearest"})');
    await c.evaluate(`(()=>{const list=document.querySelector('.faction-roster-pane [role=listbox]');list.scrollTop=list.scrollHeight;list.scrollIntoView({block:'center'});})()`);
    const last=await c.evaluate(`(()=>{const list=document.querySelector('.faction-roster-pane [role=listbox]'),row=list.lastElementChild,a=row.getBoundingClientRect(),b=list.getBoundingClientRect();return {text:row.textContent.trim(),inside:a.top>=b.top-1&&a.bottom<=b.bottom+1,hit:document.elementFromPoint((a.left+a.right)/2,(a.top+a.bottom)/2)?.closest('.faction-roster-item')===row};})()`);
    assert.equal(last.inside,true,'The last faction can be scrolled fully into view');assert.equal(last.hit,true);
    await c.type('#faction-search-input','not-a-faction');assert.equal(await c.evaluate('document.querySelector(\'.faction-roster-pane [aria-label="Factions List"]\').getAttribute("role")'),'status');
    assert.match(await c.evaluate('document.querySelector(".faction-active-label").textContent'),/Viewing Blades/);
    await c.type('#faction-search-input','Blades');await c.until('document.querySelector(".faction-roster-item")?.textContent.includes("Blades")');
    await c.evaluate('document.querySelector(".faction-roster-item").scrollIntoView({block:"center"})');
    assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
    c.assertAccessible(await c.audit(`QA-43-remainder-${profile}-${width}-${theme}`));await c.screenshot(`QA-43-remainder-${profile}-${width}-${theme}`);
    return {initial,visible,last,badgeHit:true,selection:true,emptySearch:true};
  });
};
