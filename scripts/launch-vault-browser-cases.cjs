const assert=require('node:assert/strict');
module.exports=async c=>{
 const user={id:'user_launch_polish',fullName:'QA Local',firstName:'QA',primaryEmailAddress:{emailAddress:'launch+clerk_test@example.com'}};
 const seed=name=>({saveType:'character_build',name,data:{version:1,name,race:'Nord',gender:'Male',className:'Warrior',sign:'The Warrior',maj:[],min:[]}});
 const cleanup=async()=>{const res=await c.request('GET','/api/saves',{user});for(const s of res.body?.saves||[])assert.equal((await c.request('DELETE',`/api/saves/${s.id}?revision=${s.revision}`,{user})).status,200);};
 const focus=()=>c.evaluate('document.activeElement?.textContent.trim()');
 const finish=async name=>{assert.ok(await c.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));c.assertAccessible(await c.audit(name),name);await c.screenshot(name);};
 for(const theme of ['ashfall','morrowind'])for(const width of [1366,375,390])for(const surface of ['page','dialog'])await c.check(`F-13/${theme}/${width}/${surface}`,async()=>{
   await c.open('/about');await cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);
   const created=await c.request('POST','/api/saves',{user,body:seed('QA – Layout')});assert.equal(created.status,201);
   try{
    await c.open(surface==='page'?'/vault':'/builder');if(surface==='dialog')await c.evaluate('window.dispatchEvent(new CustomEvent("silt-open-vault"))');
    await c.until(c.card('QA – Layout'));await c.pause(400);await c.until(c.card('QA – Layout'));
    await c.until(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);
    const broken=await c.evaluate(`(()=>{const broken=[];for(const el of document.querySelectorAll('.vault-card button,[aria-label="Close Cloud Vault"]')){if(!el.getClientRects().length)continue;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;for(const m of n.textContent.matchAll(/[A-Za-z]{3,}/g)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);const boxes=[...r.getClientRects()].filter(b=>b.width);if(new Set(boxes.map(b=>Math.round(b.top))).size>1)broken.push(m[0]);}}const p=el.closest('.vault-card')||el.closest('[role=dialog]');const a=el.getBoundingClientRect(),b=p.getBoundingClientRect();if(a.left<b.left-1||a.right>b.right+1)broken.push('outside '+el.textContent.trim());}return broken;})()`);
    assert.deepEqual(broken,[],'Vault control words stay whole and within their container');
    await c.evaluate(`${c.card('QA – Layout')}.scrollIntoView({block:'center'})`);await finish(`F-13-${theme}-${width}-${surface}-controls`);
    await c.evaluate(`${c.card('QA – Layout')}.querySelector('[title^="Duplicate"]').focus()`);await c.key('Enter','Enter',13);
    await c.until('document.querySelectorAll(".vault-card").length===2');
    const saves=(await c.request('GET','/api/saves',{user})).body.saves;assert.equal(saves.length,2);assert.equal(new Set(saves.map(s=>s.id)).size,2);
    if(surface==='dialog'){await c.click('[aria-label="Close Cloud Vault"]');assert.equal(await c.evaluate('Boolean(document.querySelector("[role=dialog]"))'),false);}
    return {wholeLabels:true,duplicateByKeyboard:true,reachable:true};
   }finally{await c.open('/about');await cleanup();await c.cleanupSettings();}
 });
 for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])await c.check(`F-10/${theme}/${width}`,async()=>{
   const defaults=(await import('../lib/account-settings.mjs')).defaultAccountSettings();
   const custom={...defaults,world:'tr_arce',worldChosen:true,theme,overrideSaveToggles:true,toolDefaults:{travel:{objective:'gold',walking:false},gear:{theft:true},challenge:{preset:'cursed'}}};
   const write=async settings=>{const before=(await c.request('GET','/api/settings',{user})).body;const r=await c.request('PUT','/api/settings',{user,body:{settings,revision:before.revision}});assert.equal(r.status,200);return r.body;};
   await c.open('/about');await write(custom);await c.signIn(user);await c.viewport(width);await c.open('/account');
   try{
    await c.until(`document.querySelector('.account-settings-panel select')?.value==='tr_arce'`);
    const before=(await c.request('GET','/api/settings',{user})).body;
    await c.button('Reset all settings','.account-settings-panel');await c.until('document.querySelector("[role=alertdialog]")');
    assert.equal(await focus(),'Cancel');assert.match(await c.text('[role=alertdialog]'),/Modern UI.*Morrowind.*tool defaults/);
    await finish(`F-10-${theme}-${width}-confirmation`);
    await c.key('Escape','Escape',27);assert.equal(await focus(),'Reset all settings');
    assert.deepEqual((await c.request('GET','/api/settings',{user})).body,before,'cancel preserves every stored field and revision');
    await c.button('Reset all settings','.account-settings-panel');await c.key('Tab','Tab',9);assert.equal(await focus(),'Reset settings');await c.key('Enter','Enter',13);
    await c.until(`document.querySelector('.account-settings-panel [role=status]')?.textContent.includes('saved to your account') && document.querySelector('.account-settings-panel select').value==='browser'`);
    assert.deepEqual((await c.request('GET','/api/settings',{user})).body.settings,defaults);assert.equal(await focus(),'Reset all settings');
    await write(custom);await c.open('/account');await c.until(`document.querySelector('.account-settings-panel select')?.value==='tr_arce'`);
    await c.button('Reset all settings','.account-settings-panel');await write({...custom,toolDefaults:{...custom.toolDefaults,travel:{objective:'time'}}});
    await c.button('Reset settings','[role=alertdialog]');await c.until('document.querySelector(".account-settings-panel [role=alert]")');
    assert.match(await c.text('.account-settings-panel [role=alert]'),/reload saved settings/);
    assert.equal(await c.evaluate('document.activeElement===document.body'),false);
    assert.equal((await c.request('GET','/api/settings',{user})).body.settings.toolDefaults.travel.objective,'time','failed reset did not overwrite the server');
    await finish(`F-10-${theme}-${width}-conflict`);return {cancelPreserved:true,defaultsSaved:true,keyboard:true,conflictAnnounced:true};
   }finally{await c.open('/about');await c.cleanupSettings();}
 });
 for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])for(const surface of ['page','dialog'])await c.check(`F-7/${theme}/${width}/${surface}`,async()=>{
   await c.open('/about');await cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);
   for(const name of ['QA – Delete A','QA – Delete B'])assert.equal((await c.request('POST','/api/saves',{user,body:seed(name)})).status,201);
   try{
    await c.open(surface==='page'?'/vault':'/builder');
    if(surface==='dialog')await c.evaluate('window.dispatchEvent(new CustomEvent("silt-open-vault"))');
    await c.until(`${c.card('QA – Delete A')} && document.querySelectorAll('.vault-card').length===2 && !document.querySelector('[data-vault-delete]').disabled`);
    await c.pause(400);await c.until(`${c.card('QA – Delete A')} && document.querySelectorAll('.vault-card').length===2`);
    await c.until(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`);
    const parent=surface==='dialog'?'[role=dialog]':'main';
    await c.inCard('QA – Delete A','Delete');await c.until('document.querySelector("[role=alertdialog]")');
    assert.equal(await focus(),'Cancel');
    const title=await c.evaluate(`(()=>{const d=document.querySelector('[role=alertdialog]');return document.getElementById(d.getAttribute('aria-labelledby')).textContent})()`);assert.equal(title,'Delete save?');
    await c.key('Tab','Tab',9,8);assert.equal(await focus(),'Confirm');await c.key('Tab','Tab',9);assert.equal(await focus(),'Cancel');
    await finish(`F-7-${theme}-${width}-${surface}-confirmation`);
    await c.key('Escape','Escape',27);assert.equal(await focus(),'Delete');assert.equal(await c.evaluate('Boolean(document.querySelector("[role=alertdialog]"))'),false);
    assert.ok(await c.evaluate(`Boolean(document.querySelector(${JSON.stringify(parent)}))`),'Escape preserves outer Vault');
    // Update the server revision behind the page, then exercise a genuine 409.
    const list=(await c.request('GET','/api/saves',{user})).body.saves;const stale=list.find(s=>s.name==='QA – Delete A');
    assert.equal((await c.request('PUT',`/api/saves/${stale.id}`,{user,body:{name:'QA – Delete A',revision:stale.revision}})).status,200);
    await c.inCard('QA – Delete A','Delete');await c.button('Confirm','[role=alertdialog]');await c.until('document.querySelector("[role=alertdialog] [role=alert]")');
    assert.equal(await focus(),'Cancel');await finish(`F-7-${theme}-${width}-${surface}-failure`);
    await c.key('Escape','Escape',27);assert.equal(await focus(),'Delete');
    await c.open(surface==='page'?'/vault':'/builder');if(surface==='dialog')await c.evaluate('window.dispatchEvent(new CustomEvent("silt-open-vault"))');await c.until(`${c.card('QA – Delete A')} && document.querySelectorAll('.vault-card').length===2 && !document.querySelector('[data-vault-delete]').disabled`);
    await c.pause(400);await c.until(`${c.card('QA – Delete A')} && document.querySelectorAll('.vault-card').length===2`);
    await c.inCard('QA – Delete A','Delete');await c.key('Tab','Tab',9);await c.key('Enter','Enter',13);
    await c.until(`!${c.card('QA – Delete A')} && document.activeElement?.hasAttribute('data-vault-delete')`);
    await c.inCard('QA – Delete B','Delete');await c.button('Confirm','[role=alertdialog]');
    await c.until(`!${c.card('QA – Delete B')} && document.activeElement?.matches('input[placeholder^="Name (e.g."]')`);
    await finish(`F-7-${theme}-${width}-${surface}-empty`);return {announcement:true,keyboard:true,cancel:true,conflict:true,delete:true,focusRestored:true};
   }finally{await c.open('/about');await cleanup();await c.cleanupSettings();}
 });
};
