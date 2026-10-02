const assert=require('node:assert/strict');
async function setup(c,route,profile,width,theme){
  await c.viewport(width);
  await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
  await c.navigate(route,profile);
}
async function finish(c,name){
  assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Page fits viewport');
  c.assertAccessible(await c.audit(name));await c.screenshot(name);
}
module.exports=async c=>{
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`Clarity-FLOW03/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'factions',profile,width,theme);await c.until('document.querySelectorAll(".faction-roster-item").length>0');
    const select=async name=>{
      await c.type('#faction-search-input',name);
      await c.evaluate(`(()=>{const e=[...document.querySelectorAll('.faction-roster-item')].find(e=>e.textContent.includes(${JSON.stringify(name)}));if(!e)throw Error('Missing faction');e.dataset.clarityFaction='yes'})()`);
      await c.click('[data-clarity-faction=yes]');await c.until(`document.querySelector('.faction-detail-pane h2').textContent.includes(${JSON.stringify(name)})`);
    };
    await select('Hlaalu');await c.button('+ Join Faction');await c.until('document.querySelector(".faction-detail-pane").textContent.includes("Member")');
    for(const rival of ['Redoran','Telvanni']){
      await select(rival);
      assert.equal(await c.evaluate(`[...document.querySelectorAll('.journal-factions-root button')].find(b=>b.textContent.trim()==='+ Join Faction').disabled`),true);
      assert.match(await c.evaluate('document.querySelector("#faction-join-conflict").textContent'),/Great House Hlaalu.*one Great House/s);
    }
    await select('Hlaalu');await c.button('Leave Faction');await select('Redoran');await c.button('+ Join Faction');
    await select('Mages Guild');await c.button('+ Join Faction');await c.until('document.querySelector(".faction-detail-pane").textContent.includes("Member")');
    await select('Hlaalu');assert.match(await c.evaluate('document.querySelector("#faction-join-conflict").textContent'),/Great House Redoran/);
    await finish(c,`houses-${profile}-${width}-${theme}`);return {rivalsBlocked:true,leaveAvailable:true,guildCompatible:true};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`Clarity-FLOW04/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'travel',profile,width,theme);
    const {rememberSave}=await import('../lib/active-save-store.mjs');const raw=require('../test/helpers/qa-staged-data.cjs').save();
    if(profile!=='vanilla')raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm');if(profile==='tr_arce')raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
    const journeys=[];
    for(const index of ['index_andra','index_master']){
      raw.stuff.inventory=[{id:index,count:1}];const store={};await rememberSave(raw,{setItem:(k,v)=>store[k]=v});
      await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);
      const from=index==='index_andra'?'berandas':'rotheran';
      const link=`/travel?world=${profile==='vanilla'?'vanilla':'tr'}&arce=${profile==='tr_arce'?'1':'0'}&from=${encodeURIComponent('stop:interior:'+from+', propylon chamber')}&to=${encodeURIComponent('stop:interior:andasreth, propylon chamber')}&plan=hops&walk=0`;
      await c.openDocument(c.base+link);await c.idle();
      await c.until('document.querySelector("#travel-results").textContent.includes("Use the ") && document.querySelector("#travel-results").textContent.includes("Propylon")');
      const steps=await c.evaluate(`[...document.querySelectorAll('#travel-results div')].filter(e=>e.children.length===0&&/^Leg [0-9]+:/.test(e.textContent.trim())).map(e=>e.parentElement.parentElement.textContent)`);
      assert.equal(steps.length,index==='index_andra'?1:2);for(const step of steps)assert.match(step,/Propylon/);
      if(index==='index_master')assert.match(steps.join(' '),/Caldera.*Folms Mirel/s);
      journeys.push({index,steps});await c.evaluate('document.querySelector("#travel-results").scrollIntoView({block:"start"})');await c.screenshot(`propylon-${index}-${profile}-${width}-${theme}`);
    }
    await finish(c,`propylon-${profile}-${width}-${theme}`);return {directRotheranAndasreth:false,journeys};
  });
  for(const route of ['builder','home','travel','vault'])for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`Clarity-Copy/${route}/${profile}/${width}/${theme}`,async()=>{
    await setup(c,route,profile,width,theme);
    if(route==='builder'){
      await c.builderTab('builder');await c.select('#builder-className','Mage');await c.until('document.querySelector(".preset-custom-help")');
      assert.match(await c.evaluate('document.querySelector(".preset-custom-help").textContent'),/keeping your current choices/);
      const read=`[...document.querySelectorAll('.configurator select')].filter(e=>e.id!=='builder-className').map(e=>[e.id,e.value])`;
      const before=await c.evaluate(read);await c.button('✎ Customize Skills');
      await c.until('document.querySelector("#builder-className").value==="Custom"');assert.deepEqual(await c.evaluate(read),before);
      await c.builderTab('premade');await c.button('By Race');await c.type('[aria-label="Filter premade classes"]','NoSuchQABuild');
      await c.button('Clear search');assert.equal(await c.evaluate('document.activeElement.getAttribute("aria-label")'),'Filter premade classes');
      assert.match(await c.evaluate('document.querySelector(".premade-collection-note").textContent'),/race-themed/);
      await c.button('Expand All');await c.until('document.querySelector(".premade-build-card")');
    }else if(route==='home'){
      assert.match(await c.evaluate('document.querySelector(".phone-save-help").textContent'),/copy your .omwsave.*Files.*Downloads/);
      assert.doesNotMatch(await c.evaluate('document.querySelector(".home-tools").textContent'),/non-retroactive|formulaic/);
    }else{
      const {rememberSave}=await import('../lib/active-save-store.mjs');const fixture=require('../test/helpers/qa-staged-data.cjs');const raw=fixture.save();
      if(profile!=='vanilla')raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm');if(profile==='tr_arce')raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
      if(route==='vault'){
        const store={};await rememberSave(raw,{setItem:(k,v)=>store[k]=v});
        await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);await c.navigate('vault',profile);
        await c.until('document.querySelector(".content-files-help")');assert.match(await c.evaluate('document.querySelector(".content-files-help").textContent'),/not extra save files to upload/);
        assert.match(await c.evaluate('document.querySelector(".phone-save-help").textContent'),/Files.*Downloads/);
        await finish(c,`copy-vault-${profile}-${width}-${theme}`);return {phoneSaveHelp:true,contentFilesExplained:true};
      }
      for(const gold of [50,0]){
        raw.vitals.gold=gold;const store={};await rememberSave(raw,{setItem:(k,v)=>store[k]=v});
        await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);
        await c.openDocument(c.base+`/travel?world=${profile==='vanilla'?'vanilla':'tr'}&arce=${profile==='tr_arce'?'1':'0'}&from=Seyda%20Neen&to=Balmora&plan=hops`);await c.idle();
        await c.until('document.querySelector(".travel-gold-balance")');
        const text=await c.evaluate('document.querySelector(".travel-gold-balance").textContent');
        const fare=await c.evaluate(`Number([...document.querySelectorAll('#travel-results h3')].find(e=>e.textContent.trim()==='Route Dossier').parentElement.querySelector('span').textContent.match(/([0-9]+) gold/)[1])`);
        assert.equal(text.trim(),gold===50?`After this route: ${gold-fare} gold remaining from your save’s balance.`:`You need ${fare} more gold for this route.`);
      }
      await c.evaluate('document.querySelector(".travel-gold-balance").scrollIntoView({block:"center"})');
    }
    await finish(c,`copy-${route}-${profile}-${width}-${theme}`);return {route,profile,width,theme};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`Clarity-CALC4/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'alchemy',profile,width,theme);await c.until('document.querySelector("#reverse-alchemy-search")');
    assert.match(await c.evaluate('document.querySelector("#reverse-alchemy-help").textContent'),/two-ingredient pairs only.*three or four.*Changing worlds clears.*typed Alchemy/s);
    await c.click('#alc-toggle-custom-stats');await c.type('#alc-skill-input','60');
    await c.type('#reverse-alchemy-search','Restore Health');await c.until('document.querySelector("#reverse-alchemy-effects button")');await c.click('#reverse-alchemy-effects button');
    await c.until('document.querySelector(".reverse-alchemy-pair")');await c.click('.reverse-alchemy-pair button[aria-label^="Use "]');
    await c.until(`document.querySelector('[aria-label="Crucible 1 ingredient"]').value!==""`);
    assert.equal(await c.evaluate(`document.querySelector('[aria-label="Crucible 3 ingredient"]').value`),'');
    const target=profile==='vanilla'?'tr':'vanilla';if(width<600)await c.click('.hamburger');await c.click('#react-world-'+target);
    await c.until(`document.querySelector('#react-world-${target}').getAttribute('aria-pressed')==='true'`);await c.idle();
    await c.until('document.querySelector("#reverse-alchemy-search")');
    assert.equal(await c.evaluate(`document.querySelector('[aria-label="Desired potion effects"]')`),null);
    assert.deepEqual(await c.evaluate(`[...document.querySelectorAll('[aria-label^="Crucible "][aria-label$=" ingredient"]')].map(e=>e.value)`),['','','','']);
    if(!await c.evaluate('Boolean(document.querySelector("#alc-skill-input"))'))await c.click('#alc-toggle-custom-stats');
    assert.equal(await c.evaluate('document.querySelector("#alc-skill-input").value'),'60');
    await c.button('Reset to character sheet');assert.notEqual(await c.evaluate('document.querySelector("#alc-skill-input").value'),'60');
    await c.evaluate('document.querySelector("#reverse-alchemy-help").scrollIntoView({block:"center"})');
    await finish(c,`calc4-${profile}-${width}-${theme}`);return {pairsOnly:true,recipeCleared:true,typedStatsPreserved:true};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`Clarity-F04-F11/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'builder',profile,width,theme);await c.builderTab('premade');
    await c.until('document.querySelector(".premade-collection-note")');
    const {BUILDS,RACE_BUILDS,ARCE_BUILDS}=await import('../lib/premade-data.mjs');
    await c.button('By Race');const pool=profile==='tr_arce'?[...RACE_BUILDS,...ARCE_BUILDS]:RACE_BUILDS;
    assert.match(await c.evaluate('document.querySelector(".premade-collection-note").textContent'),new RegExp(`Showing ${pool.length} of ${pool.length} race-themed`));
    assert.match(await c.evaluate('document.querySelector(".premade-welcome").textContent'),/Pick a race/);
    await c.type('[aria-label="Filter premade classes"]','NoSuchQACollection');
    assert.match(await c.evaluate('document.querySelector(".premade-collection-note").textContent'),new RegExp(`Showing 0 of ${pool.length}`));
    await c.type('[aria-label="Filter premade classes"]','');await c.button('Expand All');
    assert.equal(await c.evaluate('document.querySelectorAll(".premade-build-card").length'),pool.length);
    await c.button('Collapse All');await c.button('By Playstyle');
    assert.match(await c.evaluate('document.querySelector(".premade-collection-note").textContent'),new RegExp(`Showing ${BUILDS.length} of ${BUILDS.length} playstyle`));
    assert.match(await c.evaluate('document.querySelector(".premade-welcome").textContent'),/Pick a playstyle/);
    await finish(c,`collections-${profile}-${width}-${theme}`);return {raceBuilds:pool.length,playstyleBuilds:BUILDS.length};
  });
  for(const route of ['home','builder','travel','alchemy','leveler'])for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind']){
    await c.check(`Clarity-Beginner/${route}/${profile}/${width}/${theme}`,async()=>{
      await setup(c,route,profile,width,theme);
      if(route==='home'){
        await c.until('document.querySelector(".home-world-help")');
        const text=await c.evaluate('document.querySelector(".home-hero").textContent');
        for(const copy of ['Start here:','All Races and Classes Enabled','Find gear in the Builder','Enter a character manually'])assert.ok(text.toLowerCase().includes(copy.toLowerCase()),copy);
        await c.button('Enter a character manually');await c.until('location.pathname==="/builder"');
        await c.navigate('home',profile);
      }else if(route==='builder'){
        await c.builderTab('builder');
        await c.until('document.querySelector(".configurator")');
        await c.click('.game-entry-checklist summary');
        const checklist=await c.evaluate('document.querySelector(".game-entry-checklist").textContent');
        assert.match(checklist,/Major skills:.*Minor skills:/);assert.match(checklist,/does not edit your game/);
        const tipButtons=await c.evaluate('[...document.querySelectorAll(".configurator button[aria-label=Information]")].map(b=>b.id)');
        for(const index of [0,1]){
          await c.click('#'+CSSescape(tipButtons[index]));await c.until('document.querySelector(".configuration-info-popover")');
          const text=await c.evaluate('document.querySelector(".configuration-info-popover").textContent');
          assert.ok(text.indexOf('See the Sheet')<text.indexOf('Lore:')||!text.includes('Lore:'));
          await c.key('Escape','Escape',27);
        }
        if(width<1024)await c.button('Sheet');
        await c.until('document.querySelector(".sheet-number-legend")');
        await c.evaluate('document.querySelector("#gear-advisor").scrollIntoView({block:"center"})');
        await c.until('document.querySelector(".gear-beginner-help")');
        await c.until('document.querySelector("#gear-advisor .gear-table") && document.querySelector(".best-in-slot-recommendations table")');
        assert.match(await c.evaluate('document.querySelector(".gear-beginner-help").textContent'),/alternatives.*does not give.*empty slot/s);
      }else if(route==='travel'){
        await c.openDocument(c.base+`/travel?world=${profile==='vanilla'?'vanilla':'tr'}&arce=${profile==='tr_arce'?'1':'0'}&from=Balmora&to=place%3Aexterior%3A-4%2C21&walk=0`);await c.idle();await c.waitForFonts();
        await c.until('document.querySelector(".travel-no-route-help")');
        const help=await c.evaluate('document.querySelector(".travel-no-route-help").textContent');assert.match(help,/Enable walking/);
        assert.match(await c.evaluate('document.querySelector(".travel-beginner-help").textContent'),/leg is one ride.*Recall/s);
        await c.evaluate('document.querySelector(".travel-no-route-help").scrollIntoView({block:"center"})');
      }else if(route==='alchemy'){
        await c.until('document.querySelector(".alchemy-recovery-help")');
        assert.match(await c.evaluate('document.querySelector(".alchemy-beginner-help").textContent'),/Magnitude means effect strength/);
        assert.match(await c.evaluate('document.querySelector(".alchemy-recovery-help").textContent'),/0% brew chance.*not that chance/s);
        await c.evaluate('document.querySelector(".alchemy-recovery-help").scrollIntoView({block:"center"})');
      }else{
        await c.until('document.querySelector(".level-beginner-help")');
        assert.match(await c.evaluate('document.querySelector(".level-beginner-help").textContent'),/Ten total Major.*\+5 attribute points/s);
        await c.button('Stats & Skills');assert.match(await c.evaluate('document.querySelector(".level-mode-toggle-wrap").textContent'),/remaining Major and Minor/);
      }
      await finish(c,`beginner-${route}-${profile}-${width}-${theme}`);return {route,profile,width,theme};
    });
  }
};
// useId contains punctuation; selector escaping must not depend on a browser global in Node.
function CSSescape(id){return id.replace(/[^a-zA-Z0-9_-]/g,ch=>'\\'+ch);}
