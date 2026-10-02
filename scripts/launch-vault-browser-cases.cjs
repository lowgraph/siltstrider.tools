const assert=require('node:assert/strict');
module.exports=async c=>{
 const user={id:'user_launch_polish',fullName:'QA Local',firstName:'QA',primaryEmailAddress:{emailAddress:'launch+clerk_test@example.com'}};
 const seed=name=>({saveType:'character_build',name,data:{version:1,name,race:'Nord',gender:'Male',className:'Warrior',sign:'The Warrior',maj:[],min:[]}});
 const cleanup=async()=>{const res=await c.request('GET','/api/saves',{user});for(const s of res.body?.saves||[])assert.equal((await c.request('DELETE',`/api/saves/${s.id}?revision=${s.revision}`,{user})).status,200);};
 const focus=()=>c.evaluate('document.activeElement?.textContent.trim()');
 const finish=async name=>{assert.ok(await c.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));c.assertAccessible(await c.audit(name),name);await c.screenshot(name);};
 for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])for(const surface of ['page','dialog'])await c.check(`F-7/${theme}/${width}/${surface}`,async()=>{
   await c.open('/about');await cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);
   for(const name of ['QA – Delete A','QA – Delete B'])assert.equal((await c.request('POST','/api/saves',{user,body:seed(name)})).status,201);
   try{
    await c.open(surface==='page'?'/vault':'/builder');
    if(surface==='dialog')await c.evaluate('window.dispatchEvent(new CustomEvent("silt-open-vault"))');
    await c.until(`${c.card('QA – Delete A')} && document.querySelectorAll('.vault-card').length===2 && !document.querySelector('[data-vault-delete]').disabled`);
    await c.pause(400);await c.until(`${c.card('QA – Delete A')} && document.querySelectorAll('.vault-card').length===2`);
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
   }finally{await cleanup();}
 });
};
