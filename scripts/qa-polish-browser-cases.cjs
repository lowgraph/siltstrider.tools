const assert=require('node:assert/strict');
const build={race:'Dark Elf',gender:'Female',sign:'The Tower',name:'QA Health Precision',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
async function press(c,key,code,number){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:number,...(key==='Enter'?{text:'\r'}:key===' '?{text:' '}:{})});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:number});await c.pause(80);}
async function target(c,level){await c.click('#target-level-slider');await press(c,'Home','Home',36);for(let i=1;i<level;i++)await press(c,'ArrowRight','ArrowRight',39);await c.until(`document.querySelector('#target-level-slider').value==='${level}'`);await c.pause(150);}
async function finish(c,name){assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'No page overflow');c.assertAccessible(await c.audit(name));await c.screenshot(name);}
async function apparatus(c,id,value){await c.evaluate(`(()=>{const e=document.querySelector('#${id}');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await c.pause(150);}
async function health(c,profile,width,theme,cup=false){const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);await c.openDocument(c.base+encodeShareUrl({view:'leveler',world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',build:{...build,bitterCup:cup}}));await c.idle();await c.waitForFonts();await c.until('document.querySelector("#target-level-slider")');assert.equal(await c.evaluate('document.documentElement.dataset.theme'),theme);}
module.exports=async c=>{
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-30/${profile}/${width}/${theme}`,async()=>{
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);await c.navigate('alchemy',profile);await c.until('document.querySelector("#alc-mortar-select option[value=apparatus_j_mortar_01]")');const tools=[];
    for(const id of ['alc-mortar-select','alc-alembic-select','alc-calcinator-select','alc-retort-select']){
      const options=await c.evaluate(`[...document.querySelector('#${id}').options].map(o=>({id:o.value,label:o.textContent.trim()}))`);
      for(const option of options){await apparatus(c,id,option.id);const state=await c.evaluate(`(()=>{const e=document.querySelector('#${id}'),s=getComputedStyle(e),t=e.selectedOptions[0].textContent.trim(),ctx=document.createElement('canvas').getContext('2d');ctx.font=s.font;const textWidth=ctx.measureText(t).width+(t.length-1)*(parseFloat(s.letterSpacing)||0);return {value:e.value,label:t,textWidth,available:e.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)};})()`);assert.equal(state.value,option.id);assert.equal(state.label,option.label);assert.ok(state.textWidth<=state.available,`${id}: ${state.label} needs ${state.textWidth.toFixed(1)} px, has ${state.available} px`);tools.push(state);}
      await c.click('#'+id);await press(c,'Escape','Escape',27);await press(c,'Home','Home',36);await c.until(`document.querySelector('#${id}').selectedIndex===0`);await press(c,'End','End',35);await c.until(`document.querySelector('#${id}').selectedIndex===document.querySelector('#${id}').options.length-1`);assert.equal(await c.evaluate(`document.activeElement.id==='${id}'`),true,'Keyboard selection keeps focus');
    }
    await apparatus(c,'alc-mortar-select','apparatus_j_mortar_01');for(const id of ['alc-alembic-select','alc-calcinator-select','alc-retort-select'])await apparatus(c,id,'none');
    await c.evaluate('document.querySelector("#alc-mortar-select").parentElement.parentElement.scrollIntoView({block:"center"})');await finish(c,`QA-30-${profile}-${width}-${theme}`);return tools;
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375,390])for(const theme of ['ashfall','morrowind'])await c.check(`QA-29/${profile}/${width}/${theme}`,async()=>{
    await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);await c.navigate('builder',profile);await c.builderTab('premade');const modes=[];
    for(const mode of ['By Playstyle','By Race']){
      await c.button(mode);await c.button('Collapse All');
      const headers=await c.evaluate(`(()=>{return [...document.querySelectorAll('.category-block > button')].map(b=>{const br=b.getBoundingClientRect(),walker=document.createTreeWalker(b,NodeFilter.SHOW_TEXT),split=[],outside=[];while(walker.nextNode()){const n=walker.currentNode;for(const m of n.textContent.matchAll(/[\\p{L}\\p{N}]+(?:['’-][\\p{L}\\p{N}]+)*/gu)){const r=document.createRange();r.setStart(n,m.index);r.setEnd(n,m.index+m[0].length);const rects=[...r.getClientRects()];if(new Set(rects.map(x=>Math.round(x.top))).size>1)split.push(m[0]);if(rects.some(x=>x.left<br.left-1||x.right>br.right+1))outside.push(m[0]);}}return {text:b.textContent,split,outside};});})()`);
      assert.ok(headers.length>0);for(const h of headers){assert.deepEqual(h.split,[],h.text);assert.deepEqual(h.outside,[],h.text);assert.match(h.text,/\(\d+ builds?\)/);assert.match(h.text,/Expand/);}
      await c.evaluate('document.querySelector(".premade-browser").scrollIntoView({block:"start"})');await finish(c,`QA-29-${profile}-${width}-${theme}-${mode==='By Race'?'race':'playstyle'}`);
      await c.click('.category-block > button');await c.until('document.querySelector(".category-block > button").getAttribute("aria-expanded")==="true"');
      await press(c,'Enter','Enter',13);await c.until('document.querySelector(".category-block > button").getAttribute("aria-expanded")==="false"');
      await press(c,' ','Space',32);await c.until('document.querySelector(".category-block > button").getAttribute("aria-expanded")==="true"');assert.equal(await c.evaluate('document.activeElement===document.querySelector(".category-block > button")'),true,'Category retains keyboard focus');
      await c.button('Collapse All');modes.push({mode,headers});
    }return modes;
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-28/${profile}/${width}/${theme}`,async()=>{
    await health(c,profile,width,theme);const states=[];
    for(const level of [14,15,16]){
      if(width<1024&&level!==14)await c.button('Leveling Optimizer & Stepper');
      await target(c,level);if(width<1024)await c.button('Leveled Character Sheet');
      await c.until('document.querySelector(".health-growth-chart-wrap svg")');
      const state=await c.evaluate(`(()=>{const s=document.querySelector('.health-growth-chart-wrap svg'),b=s.getBoundingClientRect(),t=[...s.querySelectorAll('text')].find(t=>t.textContent.startsWith('Endurance 100 at'));if(!t)return null;const r=t.getBoundingClientRect();return {label:t.textContent,inside:r.left>=b.left-1&&r.right<=b.right+1}})()`);
      if(level===14)assert.equal(state,null);else{assert.ok(state,'Forecast includes its Endurance milestone');assert.equal(state.label,'Endurance 100 at Lv 15');assert.equal(state.inside,true,'Milestone label fits inside the chart');}
      states.push({level,state});if(level===15){await c.evaluate('document.querySelector(".health-growth-chart-wrap").scrollIntoView({block:"center"})');await finish(c,`QA-28-${profile}-${width}-${theme}`);}
    }return states;
  });
  for(const profile of ['vanilla','tr','tr_arce'])for(const width of [1366,375])for(const theme of ['ashfall','morrowind'])await c.check(`QA-27/${profile}/${width}/${theme}`,async()=>{
    await health(c,profile,width,theme,true);await target(c,55);if(width<1024)await c.button('Leveled Character Sheet');await c.until('document.querySelector(".health-growth-chart-wrap svg")');
    await c.evaluate('document.querySelector(".health-growth-chart-wrap").scrollIntoView({block:"center"})');
    const point=await c.evaluate(`(()=>{const s=document.querySelector('.health-growth-chart-wrap svg'),r=s.getBoundingClientRect();return {x:r.x+(s.viewBox.baseVal.width-46)*r.width/s.viewBox.baseVal.width,y:r.y+r.height/2}})()`);
    await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await c.until(`document.querySelector('.health-growth-chart-wrap svg').textContent.includes('Lv 55:')`);
    const state=await c.evaluate(`(()=>{const e=document.querySelector('.health-growth-chart-wrap'),w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),nodes=[];while(w.nextNode())nodes.push(w.currentNode.textContent);return {text:e.textContent,nodes,label:e.querySelector('svg').getAttribute('aria-label')}})()`);
    assert.match(state.text,/Delayed Endurance: 208 HP/);for(const value of [...state.nodes,state.label])assert.doesNotMatch(value,/\d+\.\d{2,}/,'Health displays at most one decimal');
    assert.equal(await c.evaluate(`(()=>{const s=document.querySelector('.health-growth-chart-wrap svg'),b=s.getBoundingClientRect();return [...s.querySelectorAll('g[pointer-events="none"] text')].every(t=>{const r=t.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1})})()`),true,'Hover health values remain inside the chart');
    await c.evaluate('document.querySelector(".health-growth-chart-wrap").scrollIntoView({block:"center"})');await finish(c,`QA-27-${profile}-${width}-${theme}`);return state;
  });
};
