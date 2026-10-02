/* Assigned launch-polish regressions against the staged local bundle. */
const assert = require('node:assert/strict');
module.exports = async c => {
  const read = expression => c.evaluate(expression);
  const finish = async name => {
    assert.ok(await read('document.documentElement.scrollWidth <= innerWidth + 1'), 'No page overflow');
    c.assertAccessible(await c.audit(name));
    await c.screenshot(name);
  };
  for(const profile of ['vanilla','tr','tr_arce'])for(const saved of [false,true])for(const theme of ['ashfall','morrowind'])for(const width of [1366,375]){
    await c.check(`UI-05/${profile}/${saved?'save':'manual'}/${theme}/${width}`,async()=>{
      const storage={'silt-theme':theme};
      if(saved){
        const raw=require('../test/helpers/qa-staged-data.cjs').save();
        raw.progress.factions=[];
        if(profile!=='vanilla')raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm');
        if(profile==='tr_arce')raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
        await (await import('../lib/active-save-store.mjs')).rememberSave(raw,{setItem:(k,v)=>storage[k]=v});
      }
      const script=await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();for(const [k,v]of Object.entries(${JSON.stringify(storage)}))localStorage.setItem(k,v);`});
      try{
        await c.viewport(width);await c.navigate('travel',profile);await c.until('document.querySelector(".transit-map-count")');
        const status=await read('document.querySelector("#travel-network-status").textContent');
        const map=await read('document.querySelector(".transit-map-count").textContent');
        assert.match(status,/\d+ routing stops?/);assert.match(map,/\d+ mapped locations?/);
        assert.match(await read('document.querySelector(".transit-map-scope").textContent'),/group stops in the same town/);
        if(saved){
          await c.click('#travel-options > summary');
          await read(`(()=>{const l=[...document.querySelectorAll('#travel-options label')].find(l=>l.textContent.includes('Mages Guild member'));l.querySelector('input').dataset.launchGuild='true';})()`);
          await c.click('[data-launch-guild]');await c.pause(200);
          assert.match(await read('document.querySelector("#travel-network-status").textContent'),/\d+ routing stops?/);
          assert.match(await read('document.querySelector(".transit-map-count").textContent'),/\d+ mapped locations?/);
          await c.button('Use save defaults');await c.click('#travel-options > summary');
        }
        await c.screenshot(`UI-05-${profile}-${saved}-${theme}-${width}-status`);
        await read('document.querySelector(".transit-map-count").scrollIntoView({block:"center"})');
        await finish(`UI-05-${profile}-${saved}-${theme}-${width}`);
        return {status,map,saved};
      }finally{await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});}
    });
  }
  for (const theme of ['ashfall','morrowind']) for (const width of [1366,375]) {
    await c.check(`UI-04/${theme}/${width}`,async()=>{
      await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('alchemy');
      await c.until(`document.querySelector('[aria-label="Crucible 1 ingredient"]:not([disabled])')`);
      await c.click('#alc-toggle-custom-stats');
      for(const stat of ['skill','int','luck'])await c.type('#alc-'+stat+'-input','0');
      await c.choose('[aria-label="Crucible 1 ingredient"]','Saltrice');await c.choose('[aria-label="Crucible 2 ingredient"]','Marshmerrow');
      const chance=()=>read(`[...document.querySelectorAll('span')].find(s=>s.textContent==='Brew Success Chance').nextElementSibling.textContent`);
      assert.equal(await chance(),'0%');
      assert.match(await read('document.querySelector(".alchemy-workstation").textContent'),/All shared effects round to zero/);
      await c.click('[title="Clear Slot 2"]');
      assert.match(await chance(),/not calculated yet/);
      await c.choose('[aria-label="Crucible 2 ingredient"]','Marshmerrow');
      await read('document.querySelector("#alchemy-potion-output").scrollIntoView({block:"center"})');
      await finish(`UI-04-${theme}-${width}`);return {zeroVisible:true,incompleteEmpty:true};
    });
    await c.check(`UI-03/${theme}/${width}`,async()=>{
      await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('challenge');
      await c.type('#challenge-seed-input','NOT-A-VALID-SEED');await c.button('Load');
      assert.match(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      await c.button('Generate Run');
      assert.doesNotMatch(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      const seed=await read('document.querySelector("#challenge-seed-input").value');
      await c.type('#challenge-seed-input','garbage');await c.button('Load');
      assert.match(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      await c.type('#challenge-seed-input',seed);await c.button('Load');
      assert.doesNotMatch(await read('document.querySelector("#challenge-seed-note").textContent'),/not a Silt Strider seed/);
      await finish(`UI-03-${theme}-${width}`);return {generateClears:true,validLoadClears:true,invalidStillReported:true};
    });
    const name=`FLOW-01/${theme}/${width}`;
    await c.check(name,async()=>{
      await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('enchanting');
      await c.until(`document.querySelector('[aria-label="Effect 1"] option[value]:not([value=""])')`);
      const item=async value=>c.evaluate(`(()=>{const s=document.querySelector('#enchant-item-select');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
      const pressed=()=>read(`document.querySelector('[aria-labelledby="enchant-type-label"] [aria-pressed="true"]').textContent.trim()`);
      await item('Common Ring');await c.pause(100);
      assert.equal(await read(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='On Strike').disabled`),true);
      await item('Ebony Staff');await c.pause(100);await c.button('On Strike');assert.equal(await pressed(),'On Strike');
      await item('Common Shirt');await c.pause(100);assert.equal(await pressed(),'When Used');
      await item('Custom Item');await c.pause(100);
      assert.ok(await read('Boolean(document.querySelector("#enchant-custom-kind"))'),'Custom item declares its kind');
      await c.select('#enchant-custom-kind','Melee weapon');await c.button('On Strike');
      await finish(name.replaceAll('/','-'));return {apparel:true,weapon:true,switch:true,custom:true};
    });
  }
};
