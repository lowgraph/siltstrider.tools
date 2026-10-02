const assert=require('node:assert/strict');
const build={race:'Dark Elf',gender:'Female',sign:'The Tower',name:'QA Health Precision',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
async function press(c,key,code,number){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:number,...(key==='Enter'?{text:'\r'}:{})});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:number});}
async function target(c,level){await c.click('#target-level-slider');await press(c,'Home','Home',36);for(let i=1;i<level;i++)await press(c,'ArrowRight','ArrowRight',39);await c.until(`document.querySelector('#target-level-slider').value==='${level}'`);await c.pause(150);}
async function finish(c,name){assert.equal(await c.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'No page overflow');c.assertAccessible(await c.audit(name));await c.screenshot(name);}
async function health(c,profile,width,theme,cup=false){const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');await c.viewport(width);await c.evaluate(`localStorage.clear();localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);await c.openDocument(c.base+encodeShareUrl({view:'leveler',world:profile==='vanilla'?'vanilla':'tr',arce:profile==='tr_arce',build:{...build,bitterCup:cup}}));await c.idle();await c.waitForFonts();await c.until('document.querySelector("#target-level-slider")');assert.equal(await c.evaluate('document.documentElement.dataset.theme'),theme);}
module.exports=async c=>{
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
