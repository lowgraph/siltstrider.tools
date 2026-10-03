const assert=require('node:assert/strict');
module.exports=async c=>{
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-40/${profile}/${width}/${theme}`,async()=>{
    const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
    const build=premadeToBuild(BUILDS.find(b=>b.name==='Nord Warrior Spearman'));
    await c.openDocument(c.base+encodeShareUrl({view:'builder',world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',build}));await c.idle();await c.waitForFonts();
    // Select the intended section explicitly, even if the linked build matches the random starter.
    await c.builderTab('builder');await c.until('document.querySelector(\'#builder-maj-0 option[value="Long Blade"]\')');
    const skillLabel=await c.evaluate('document.querySelector(\'#builder-maj-0 option[value="Long Blade"]\').textContent.trim()');
    await c.select('#builder-maj-0',skillLabel);
    if(width<1024)await c.button('Sheet');await c.until('document.querySelector("#gear-advisor")');
    await c.evaluate('document.querySelector("#gear-advisor").scrollIntoView({block:"center"})');
    await c.button('Optimize Gear');await c.until('document.querySelector("#gear-advisor .best-in-slot-recommendations table")');
    const table='[aria-label="Endgame equipment: Optimized Weapons"]';await c.until(`document.querySelector('${table} .weapon-score-explanation')`);
    const row=await c.evaluate(`document.querySelector('${table} tbody tr').textContent`);
    if(profile==='vanilla'){
      assert.match(row,/Goldbrand/);assert.match(row,/Score: 6\.67/);assert.match(row,/Long Blade — Major skill\. Damage score 6\.67; bonus score 0/);
      assert.match(row,/Mournhold, Museum of Artifacts/);
    }else{assert.match(row,/Neb-Crescen/);assert.match(row,/Score: 15\.47/);assert.match(row,/Long Blade — Major skill\. Damage score 7\.73; bonus score 7\.74/);}
    await c.evaluate(`document.querySelector('${table} button').click()`);await c.until(`document.querySelectorAll('${table} .weapon-score-explanation').length===3`);
    assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
    assert.doesNotMatch(await c.evaluate('document.querySelector(".weapon-score-help").textContent'),/Strong bonuses can outweigh|Check the skill fit/);
    await c.evaluate(`document.querySelector('${table}').scrollIntoView({block:'center'})`);c.assertAccessible(await c.audit(`QA-40-${profile}-${width}-${theme}`));await c.screenshot(`QA-40-${profile}-${width}-${theme}`);
    return {winner:profile==='vanilla'?'Goldbrand':'Neb-Crescen',rankingChanged:true,majorSkill:true};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-41/${profile}/${width}/${theme}`,async()=>{
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
    const raw=require('../test/helpers/qa-staged-data.cjs').save();raw.identity.name='QA – Fractional Health';
    if(profile!=='vanilla')raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm');
    if(profile==='tr_arce')raw.contentFiles.push('ARCE - All Races and Classes Enabled.esp');
    const endurance=raw.build.attributes.find(a=>a.id==='Endurance');endurance.base=33;endurance.value=33;
    const {rememberSave}=await import('../lib/active-save-store.mjs');const storage={};assert.equal(await rememberSave(raw,{setItem:(k,v)=>storage[k]=v}),true);
    await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(storage)}))localStorage.setItem(k,v)`);
    await c.navigate('leveler',profile);await c.until('document.querySelector(".level-itinerary-card")');
    const itinerary=await c.evaluate('document.querySelector(".level-itinerary-card > div > div > span:nth-child(2)").textContent.trim()');
    assert.equal(itinerary,'+3.8 HP Gain');
    await c.click('[aria-label="Next level step"]');
    if(width<1024)await c.button('Leveled Character Sheet');
    await c.until('document.querySelector(".vitals-section > div span")');
    const total=await c.evaluate('document.querySelector(".vitals-section > div span").textContent.trim()');
    assert.equal(total,'+3.8 Total HP Gained');
    assert.match(total,/^\+\d+(?:\.\d)? Total HP Gained$/);assert.doesNotMatch(total,/\d+\.\d{2,}|NaN|Infinity/);
    await c.evaluate('document.querySelector(".vitals-section").scrollIntoView({block:"center"})');
    assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);c.assertAccessible(await c.audit(`QA-41-${profile}-${width}-${theme}`));await c.screenshot(`QA-41-${profile}-${width}-${theme}`);
    return {itinerary,total,fractionRetained:true};
  });
};
