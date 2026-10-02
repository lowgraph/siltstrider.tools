/* Assigned launch-polish regressions against the staged local bundle. */
const assert = require('node:assert/strict');
module.exports = async c => {
  const read = expression => c.evaluate(expression);
  const finish = async name => {
    assert.ok(await read('document.documentElement.scrollWidth <= innerWidth + 1'), 'No page overflow');
    c.assertAccessible(await c.audit(name));
    await c.screenshot(name);
  };
  const wholeWords=async selector=>read(`(()=>{
    const broken=[],root=document.querySelector(${JSON.stringify(selector)}),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.getClientRects().length)continue;for(const m of n.textContent.matchAll(/[A-Za-z]{3,}/g)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);const ys=[...r.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top));if(new Set(ys).size>1)broken.push(m[0]);}}
    return broken;
  })()`);
  for(const theme of ['ashfall','morrowind'])for(const width of [1366,375,390]){
    await c.check(`SS-09/${theme}/${width}`,async()=>{
      await read(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      const build={race:'Nord',gender:'Male',sign:'The Warrior',className:'Custom',name:'QA – Training',spec:'Combat',fav1:'Strength',fav2:'Endurance',maj:['Heavy Armor','Medium Armor','Spear','Alchemy','Enchant'],min:['Destruction','Conjuration','Mysticism','Alteration','Illusion']};
      const url=new URL((await import('../lib/permalink-codec.mjs')).encodeShareUrl({view:'leveler',world:'vanilla',build}),c.base);
      await c.viewport(width);await c.navigate('leveler','vanilla','&build='+encodeURIComponent(url.searchParams.get('build')));await c.until('document.querySelector(".level-itinerary-card")');
      for(const mode of ['Stats Only','Stats & Skills']){
        await c.button(mode);await c.pause(150);
        if(mode==='Stats & Skills')assert.match(await read('document.querySelector(".misc-training-block").textContent'),/Acrobatics/);
        assert.deepEqual(await wholeWords('.step-stepper-section'),[],'Itinerary words stay whole');
        await c.click('[aria-label="Next level step"]');
        assert.ok(await read(`!document.querySelector('[aria-label="Previous level step"]').disabled`));
        await c.click('[aria-label="Previous level step"]');
        await read('document.querySelector(".step-stepper-section").scrollIntoView({block:"start"})');
        await finish(`SS-09-${theme}-${width}-${mode.replaceAll(' ','-')}`);
      }
      return {wholeWords:true,navigation:true,modes:2};
    });
  }
  for(const theme of ['ashfall','morrowind'])for(const width of [1366,375,390]){
    await c.check(`SS-08/${theme}/${width}`,async()=>{
      await read(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('factions');await c.until('document.querySelector(".faction-detail-pane")');
      const active=()=>read('document.querySelector(".faction-active-label")?.textContent');
      assert.match(await active(),/Viewing Fighters Guild/);
      await c.type('#faction-search-input','Ashlanders');await c.click('.faction-roster-item');
      assert.match(await active(),/Viewing Ashlanders/);
      await c.type('#faction-search-input','not-a-faction');assert.match(await active(),/Viewing Ashlanders/);
      await c.screenshot(`SS-08-${theme}-${width}-empty-search`);
      await c.type('#faction-search-input','Mages');assert.match(await active(),/Viewing Ashlanders/);
      await read('document.querySelector(".faction-detail-pane").scrollTop=500');
      await read('document.querySelector(".faction-active-label").scrollIntoView({block:"center"})');
      assert.ok(await read(`(()=>{const r=document.querySelector('.faction-active-label').getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight-55;})()`));
      await finish(`SS-08-${theme}-${width}-search`);
      await c.navigate('factions');assert.match(await active(),/Viewing Fighters Guild/);
      await finish(`SS-08-${theme}-${width}-refresh`);return {initial:true,selection:true,search:true,scroll:true,refresh:true};
    });
  }
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
    await c.check(`SS-10/${theme}/${width}`,async()=>{
      await read(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
      await c.viewport(width);await c.navigate('home');await c.click('.search-trigger');
      await c.until('document.querySelector(".search-dialog input")');
      await c.type('.search-dialog input','Twin Lamps');
      await c.until(`document.querySelector('.search-dialog [role="option"]')?.textContent.includes('Twin Lamps')`);
      const result=await read(`document.querySelector('.search-dialog [role="option"]').textContent`);
      assert.match(result,/1 rank\b/);assert.doesNotMatch(result,/1 ranks/);
      await finish(`SS-10-${theme}-${width}`);
      await c.key('Escape','Escape',27);assert.equal(await read('Boolean(document.querySelector(".search-dialog"))'),false);
      return {result,keyboardDismiss:true};
    });
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
