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
