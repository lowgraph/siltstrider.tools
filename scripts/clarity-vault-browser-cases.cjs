const assert=require('node:assert/strict');
module.exports=async c=>{
  const user={id:'user_qa_clarity',fullName:'QA – Clarity',firstName:'QA',username:'qa_clarity'};
  for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])await c.check(`Clarity-F12/${theme}/${width}`,async()=>{
    await c.open('/about');await c.cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);
    try{
      const raw=require('../test/helpers/qa-staged-data.cjs').save();raw.identity.name='QA – Recorded Place';raw.identity.cell='Old Ebonheart';raw.identity.class={id:'qa-class',name:'QA – Saved Mage',custom:true};
      assert.equal((await c.request('POST','/api/saves',{user,body:{saveType:'openmw_save',name:raw.identity.name,data:raw}})).status,201);
      assert.equal((await c.request('POST','/api/saves',{user,body:{saveType:'character_build',name:'QA – No Location',data:{version:1,name:'QA – No Location',race:'Nord',gender:'Male',className:'Warrior',sign:'The Warrior',maj:[],min:[]}}})).status,201);
      await c.open('/vault');await c.until(c.card(raw.identity.name));
      const card=await c.evaluate(`${c.card(raw.identity.name)}.textContent`);assert.match(card,/Lvl 3 QA – Saved Mage/);assert.match(card,/Old Ebonheart/);assert.doesNotMatch(card,/Vvardenfell/);
      assert.match(await c.evaluate(`${c.card('QA – No Location')}.textContent`),/Not recorded/);
      const saved=(await c.request('GET','/api/saves',{user})).body.saves.find(s=>s.name===raw.identity.name);assert.equal(saved.cell,raw.identity.cell);assert.equal(saved.class_name,raw.identity.class.name);
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
      c.assertAccessible(await c.audit(`location-${theme}-${width}`));
      await c.evaluate(`${c.card(raw.identity.name)}.scrollIntoView({block:'center'})`);
      await c.screenshot(`location-${theme}-${width}`);
      return {recordedLocation:true,recordedClassName:true,noInventedLocation:true};
    }finally{await c.open('/about');await c.cleanup();}
  });
  for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])await c.check(`Clarity-F17/${theme}/${width}`,async()=>{
    await c.open('/about');await c.cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);
    try{
      await c.open('/account');await c.until('document.querySelector(".account-settings-panel fieldset")?.disabled===false');
      await c.evaluate(`[...document.querySelectorAll('.account-settings-panel details')].find(d=>d.querySelector('summary').textContent==='Future datasets').open=true`);
      const version=await c.evaluate(`(()=>{const e=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Mod version')).querySelector('select');return {disabled:e.disabled,text:e.textContent}})()`);
      assert.deepEqual(version,{disabled:true,text:'Not available yet'});
      await c.screenshot(`versions-${theme}-${width}`);
      const seeded=await c.request('POST','/api/saves',{user,body:{saveType:'character_build',name:'QA – Rename',data:{version:1,name:'QA – Rename',race:'Nord',gender:'Male',className:'Warrior',sign:'The Warrior',maj:[],min:[]}}});
      assert.equal(seeded.status,201);await c.open('/vault');await c.until(c.card('QA – Rename'));await c.inCard('QA – Rename','Rename');
      const selector='[aria-label="New name for this save"]';assert.equal(await c.evaluate(`document.querySelector('${selector}').maxLength`),120);
      const name='QA – '.padEnd(120,'a');await c.type(selector,name+'x');assert.equal(await c.evaluate(`document.querySelector('${selector}').value`),name,'Typing the 121st character is blocked');
      await c.button('Save','main .vault-card form');await c.until(c.card(name));
      const records=(await c.request('GET','/api/saves',{user})).body.saves;assert.equal(records.length,1);assert.equal(records[0].name,name);
      const rejected=await c.request('PUT',`/api/saves/${records[0].id}`,{user,body:{name:name+'x',revision:records[0].revision}});assert.equal(rejected.status,400);
      assert.equal((await c.request('GET','/api/saves',{user})).body.saves[0].name,name,'Rejected rename keeps the stored name');
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
      c.assertAccessible(await c.audit(`rename-${theme}-${width}`));await c.screenshot(`rename-${theme}-${width}`);
      return {versionUnavailable:true,rename120:true,reject121:true};
    }finally{await c.open('/about');await c.cleanup();}
  });
  for(const theme of ['ashfall','morrowind'])for(const width of [1366,375])await c.check(`Clarity-F11/${theme}/${width}`,async()=>{
    await c.open('/about');await c.cleanup();await c.signIn(user);await c.viewport(width);await c.theme(theme);await c.open('/account');
    try{
      await c.until('document.querySelector("input[autocomplete=username]")');
      const before=(await c.request('GET','/api/account',{user})).body;
      assert.match(await c.evaluate('document.querySelector("#username-help").textContent'),/username is required.*including your icon/);
      await c.click('input[name=profile-icon][value="4"]');await c.button('Save profile');
      assert.equal(await c.evaluate('document.querySelector("input[autocomplete=username]").validity.valueMissing'),true);
      assert.deepEqual((await c.request('GET','/api/account',{user})).body,before,'Required-field validation leaves the account unchanged');
      await c.type('input[autocomplete=username]','QA_Clarity');await c.button('Save profile');
      await c.until('document.querySelector(".account-page [role=status]")?.textContent.includes("Profile saved")');
      const profile=(await c.request('GET','/api/account',{user})).body;
      assert.equal(profile.username,'QA_Clarity');assert.equal(profile.iconId,4);
      assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
      c.assertAccessible(await c.audit(`profile-${theme}-${width}`));await c.screenshot(`profile-${theme}-${width}`);
      return {requiredExplained:true,emptySaveBlocked:true,iconSaved:true};
    }finally{await c.open('/about');await c.cleanup();}
  });
};
