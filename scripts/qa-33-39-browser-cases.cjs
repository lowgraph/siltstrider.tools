const assert=require('node:assert/strict');
async function setup(c,route,profile,width,theme,build){
  await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
  if(build){const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');await c.openDocument(c.base+encodeShareUrl({view:route,world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',build}));await c.idle();await c.waitForFonts();}
  else await c.navigate(route,profile);
}
async function finish(c,name){assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Page fits the viewport');c.assertAccessible(await c.audit(name));await c.screenshot(name);}
module.exports=async c=>{
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-34/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'alchemy',profile,width,theme);
    await c.until('document.querySelector("#reverse-alchemy-search")');
    await c.type('#reverse-alchemy-search','restore health');await c.button('Restore Health');
    await c.until('document.querySelector(".reverse-alchemy-pair")');const states=[];
    for(const count of [12,24]){
      const state=await c.evaluate(`(()=>{const list=document.querySelector('[aria-label="Ingredient pairs"]'),button=[...document.querySelectorAll('.reverse-alchemy button')].find(b=>b.textContent==='Show more pairs'),a=list.getBoundingClientRect(),b=button?.getBoundingClientRect(),s=getComputedStyle(list);return {count:list.children.length,list:{top:a.top,bottom:a.bottom,height:a.height,overflow:s.overflowY,display:s.display},button:b&&{top:b.top,bottom:b.bottom},scrollHeight:list.scrollHeight,clientHeight:list.clientHeight}})()`);
      if(state.button)assert.ok(state.button.top>=state.list.bottom+8,`Show more needs a visible gap below clipped pairs: ${JSON.stringify(state)}`);
      assert.equal(state.list.overflow,'auto','Pairs retain their own scrolling area');
      states.push(state);
      await c.evaluate(`document.querySelector('[aria-label="Ingredient pairs"]').scrollTop=0;document.querySelector('[aria-label="Ingredient pairs"]').scrollIntoView({block:'center'})`);
      await finish(c,`QA-34-${profile}-${width}-${theme}-${count}`);
      if(count===12&&state.button)await c.button('Show more pairs');
    }
    await c.evaluate(`const list=document.querySelector('[aria-label="Ingredient pairs"]');list.scrollTop=list.scrollHeight`);
    await c.click('.reverse-alchemy-pair:last-child > button');
    assert.equal(await c.evaluate('document.activeElement.id'),'alchemy-potion-output');return states;
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-33/${profile}/${width}/${theme}`,async()=>{
    const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');
    const build=premadeToBuild(BUILDS.find(b=>/Spear scout/i.test(b.name)));
    await setup(c,'builder',profile,width,theme,build);
    await c.evaluate('document.querySelector("#gear-advisor").scrollIntoView({block:"center"})');
    const selected=`document.querySelector('[aria-label="Weapon setup"] [aria-pressed="true"]')`;
    await c.until(selected);
    assert.equal(await c.evaluate(selected+'.textContent'),'Two-handed');
    await c.until('document.querySelector("#gear-advisor").textContent.includes("Optimized Weapons")');
    const kit=await c.evaluate('document.querySelector("#gear-advisor").textContent');
    assert.doesNotMatch(kit,/Keening|Darksun Shield/);
    await c.button('One-handed + shield');
    assert.equal(await c.evaluate(selected+'.textContent'),'One-handed + shield');
    await c.button('Two-handed');await finish(c,`QA-33-${profile}-${width}-${theme}`);return {default:'two-handed',manualChoice:true};
  });
};
