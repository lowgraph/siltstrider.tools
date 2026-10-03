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
      assert.match(row,/Sunder/);assert.match(row,/Score: 22\.2/);assert.match(row,/Blunt Weapon — Miscellaneous skill\. Damage score 1; bonus score 21\.2/);
      for(const reason of ['Fortify Strength 20','Fortify Endurance 20','Fortify Attack 30'])assert.ok(row.includes(reason));
    }else{assert.match(row,/Neb-Crescen/);assert.match(row,/Long Blade — Major skill\. Damage score 7\.73; bonus score 16/);}
    await c.evaluate(`document.querySelector('${table} button').click()`);await c.until(`document.querySelectorAll('${table} .weapon-score-explanation').length===3`);
    assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
    assert.match(await c.evaluate('document.querySelector(".weapon-score-help").textContent'),/not a damage-per-second estimate/);
    await c.evaluate(`document.querySelector('${table}').scrollIntoView({block:'center'})`);c.assertAccessible(await c.audit(`QA-40-${profile}-${width}-${theme}`));await c.screenshot(`QA-40-${profile}-${width}-${theme}`);
    return {winner:profile==='vanilla'?'Sunder':'Neb-Crescen',rankingUnchanged:true,explained:true};
  });
};
