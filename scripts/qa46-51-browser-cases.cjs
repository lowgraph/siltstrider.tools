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
};
