const assert=require('node:assert/strict');
async function setup(c,route,profile,width,theme,build){
  await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
  if(build){const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');await c.openDocument(c.base+encodeShareUrl({view:route,world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',build}));await c.idle();await c.waitForFonts();}
  else await c.navigate(route,profile);
}
async function finish(c,name){assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Page fits the viewport');c.assertAccessible(await c.audit(name));await c.screenshot(name);}
async function wholeWords(c,selector){return c.evaluate(`(()=>{const root=document.querySelector(${JSON.stringify(selector)}),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),broken=[];while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement.getClientRects().length)continue;for(const m of n.textContent.matchAll(/[A-Za-z]{3,}/g)){const range=document.createRange();range.setStart(n,m.index);range.setEnd(n,m.index+m[0].length);const boxes=[...range.getClientRects()].filter(r=>r.width>0);if(new Set(boxes.map(r=>Math.round(r.top))).size>1)broken.push(m[0]);}}return broken})()`);}
module.exports=async c=>{
  for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-37/vanilla/${width}/${theme}`,async()=>{
    await setup(c,'leveler','vanilla',width,theme);
    const raw=require('../test/helpers/qa-staged-data.cjs').save();raw.build.attributes.find(a=>a.id==='Endurance').base=100;raw.build.attributes.find(a=>a.id==='Endurance').value=100;
    const {rememberSave}=await import('../lib/active-save-store.mjs');const storage={};await rememberSave(raw,{setItem:(k,v)=>storage[k]=v});
    await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(storage)}))localStorage.setItem(k,v)`);
    await c.navigate('leveler');await c.until('document.querySelector("#target-level-slider")');
    await c.click('#target-level-slider');await c.key('Home','Home',36);for(let i=4;i<=55;i++)await c.key('ArrowRight','ArrowRight',39);
    if(width<1024)await c.button('Leveled Character Sheet');await c.until('document.querySelector(".health-growth-chart-wrap")');
    const text=await c.evaluate('document.querySelector(".health-growth-chart-wrap").textContent');
    assert.match(text,/Permanent HP lost if Endurance is delayed: 0 HP/);assert.doesNotMatch(text,/-0 HP/);
    await c.evaluate('document.querySelector(".health-growth-chart-wrap").scrollIntoView({block:"center"})');await finish(c,`QA-37-${width}-${theme}`);return {zeroLoss:true};
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [375,390,1366])for(const theme of ['ashfall','morrowind'])await c.check(`QA-36/${profile}/${width}/${theme}`,async()=>{
    await setup(c,'travel',profile,width,theme);await c.until('document.querySelector(".transit-map svg[role=img]")');
    await c.until(`(()=>{const s=document.querySelector('.transit-map svg[role=img]');return Math.abs(s.viewBox.baseVal.width-s.getBoundingClientRect().width)<3})()`);
    await c.evaluate('document.querySelector(".transit-map").scrollIntoView({block:"center"})');
    const state=await c.evaluate(`(()=>{const root=document.querySelector('.transit-map'),head=root.querySelector('.transit-map-heading'),title=head.firstElementChild.getBoundingClientRect(),count=head.lastElementChild.getBoundingClientRect(),svg=root.querySelector('svg[role=img]'),box=svg.getBoundingClientRect();return {separated:count.top>=title.bottom-1||count.left>=title.right+5,legendSize:parseFloat(getComputedStyle(root.querySelector('.transit-map-legend')).fontSize),labels:[...svg.querySelectorAll('text[letter-spacing]')].map(t=>{const b=t.getBoundingClientRect();return {text:t.textContent,inside:b.left>=box.left-1&&b.right<=box.right+1,size:parseFloat(getComputedStyle(t).fontSize)*box.width/svg.viewBox.baseVal.width}})}})()`);
    assert.equal(state.separated,true,'Map heading and counts remain separated');assert.ok(state.legendSize>=12);
    for(const label of state.labels){assert.equal(label.inside,true,`${label.text} stays inside SVG`);assert.ok(label.size>=11.5,`Region labels retain readable size: ${JSON.stringify(label)}`);}
    assert.deepEqual(await wholeWords(c,'.transit-map-heading'),[]);await finish(c,`QA-36-${profile}-${width}-${theme}`);return state;
  });
  for(const width of [375,390,1366])for(const theme of ['ashfall','morrowind'])await c.check(`QA-35/vanilla/${width}/${theme}`,async()=>{
    await setup(c,'home','vanilla',width,theme);
    assert.deepEqual(await wholeWords(c,'.home-character-stats-grid'),[],'Home identity labels stay whole');
    await c.evaluate('document.querySelector(".home-character").scrollIntoView({block:"center"})');await finish(c,`QA-35-home-${width}-${theme}`);
    await c.navigate('builder');await c.builderTab('equipment');
    assert.deepEqual(await wholeWords(c,'.loadout-actions'),[],'Loadout actions stay whole');
    await c.evaluate('document.querySelector(".loadout-actions").scrollIntoView({block:"center"})');await finish(c,`QA-35-actions-${width}-${theme}`);
    await c.button('Rename');assert.ok(await c.evaluate('Boolean(document.querySelector(".loadout-tabs-bar input"))'),'Rename still opens');
    await c.builderTab('premade');await c.button('Expand All');
    assert.deepEqual(await wholeWords(c,'.premade-footer'),[],'Specialization descriptions wrap at words');
    await c.evaluate('document.querySelector(".premade-footer").scrollIntoView({block:"center"})');await finish(c,`QA-35-premade-${width}-${theme}`);return {wholeWords:true};
  });
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
