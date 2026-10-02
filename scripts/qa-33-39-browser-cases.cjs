const assert=require('node:assert/strict');
async function setup(c,route,profile,width,theme,build){
  await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
  if(build){const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');await c.openDocument(c.base+encodeShareUrl({view:route,world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',build}));await c.idle();await c.waitForFonts();}
  else await c.navigate(route,profile);
}
async function finish(c,name){assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Page fits the viewport');c.assertAccessible(await c.audit(name));await c.screenshot(name);}
module.exports=async c=>{
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
