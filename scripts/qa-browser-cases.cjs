/* Reproduction only. All storage and synthetic saves belong to the isolated Chrome profile. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fixture = require('../test/helpers/qa-staged-data.cjs');

async function storedSave() {
  const {rememberSave} = await import('../lib/active-save-store.mjs');
  const storage = {};
  assert.equal(await rememberSave(fixture.save(), {setItem:(k,v)=>storage[k]=v}),true);
  return storage;
}
async function seed(c,storage,theme) {
  await c.send('Network.clearBrowserCookies');
  await c.send('Storage.clearDataForOrigin',{origin:c.base,storageTypes:'all'});
  return c.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(location.origin===${JSON.stringify(c.base)}){localStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify({...storage,'silt-theme':theme})}))localStorage.setItem(k,v);}`});
}
exports.hydration = async c => {
  const {encodeShareUrl} = await import('../lib/permalink-codec.mjs');
  const build = {race:'Breton',gender:'Female',sign:'The Tower',name:'QA Linked Breton',className:'Mage'};
  const withWorld = new URL(encodeShareUrl({view:'builder',world:'tr',arce:true,build}),c.base);
  const withoutWorld = new URL(withWorld);withoutWorld.searchParams.delete('world');withoutWorld.searchParams.delete('arce');
  const challenge = new URL(encodeShareUrl({view:'challenge',world:'tr',arce:true,run:{seed:'QA-FIRST-LOAD',race:'Nord',gender:'Male',cls:'Warrior',sign:'The Warrior',major:'Join the Fighters Guild and reach Master.'}}),c.base);
  const scenarios = [
    {name:'fresh',storage:{}},
    {name:'stored-tr-arce',storage:{'mw-world':'tr','mw-arce':'1'}},
    {name:'loaded-save',storage:await storedSave()},
    {name:'build-world',storage:{},query:withWorld.search},
    {name:'build-no-world',storage:{'mw-world':'tr','mw-arce':'1'},query:withoutWorld.search},
    {name:'challenge-link',storage:{},query:challenge.search}
  ];
  fs.writeFileSync(path.join(c.output,'qa-traveller.json'),JSON.stringify(fixture.save(),null,2));
  const routes = ['', 'builder','leveler','travel','alchemy','enchanting','spellmaking','factions','challenge','vault','account','about','changelog','privacy','terms','qa-missing-404'];
  for(const width of [1366,375]) for(const theme of ['ashfall','morrowind']) for(const scenario of scenarios) for(const route of routes) {
    const repeats = scenario.name==='fresh' && ['', 'builder'].includes(route) ? 10 : 1;
    for(let i=1;i<=repeats;i++) await c.check(`QA-17/${route||'home'}/${scenario.name}/${width}/${theme}/${i}`,async()=>{
      await c.viewport(width);
      const script = await seed(c,scenario.storage,theme);
      const start=(c.report.console||[]).length, exceptions=c.report.runtimeErrors.length;
      try {
        await c.openDocument(`${c.base}/${route}${scenario.query||''}`);await c.idle();await c.waitForFonts();await c.pause(250);
        const messages=(c.report.console||[]).slice(start);
        const errors=messages.filter(m=>m.type==='error'||/Hydration failed|did not match|Text content does not match|hydrated but some attributes/i.test(m.message));
        const thrown=c.report.runtimeErrors.slice(exceptions);
        const state=await c.evaluate(`({world:localStorage.getItem('mw-world'),arce:localStorage.getItem('mw-arce'),theme:document.documentElement.dataset.theme,url:location.href,save:!!localStorage.getItem('silt-active-save'),activeSaveSeen:document.querySelector('main').textContent.includes('QA Traveller')})`);
        (c.report.hydrationObservations ||= []).push({case:c.report.cases.length,route,scenario:scenario.name,width,theme,errors,thrown,state});
        assert.deepEqual(errors,[],'First-navigation console errors / hydration warnings');
        assert.deepEqual(thrown,[],'Uncaught exceptions');
        if(scenario.name==='loaded-save'&&['','builder'].includes(route)) assert.equal(state.activeSaveSeen,true,'Synthetic save restored in the visible character UI');
        return {messages:messages.length,state};
      } finally {await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});}
    });
  }
};

async function record(c,id,detail) {(c.report.observations ||= []).push({id,...detail});return detail;}
async function body(c) {return c.evaluate('document.querySelector("main").innerText');}
async function readyBuilder(c) {await c.until('document.querySelector(".builder-phone-tabs, #btn-tab-builder")');await c.builderTab('builder');await c.until('document.querySelector("#builder-race option[value=Breton]")');}
async function info(c,index) {
  await c.evaluate(`(()=>{const e=document.querySelectorAll('button[aria-label="Information"]')[${index}];if(!e)throw Error('Missing Configure popover');e.dataset.qaInfo='yes'})()`);
  await c.click('[data-qa-info=yes]');
  await c.pause(200);
  const result=await c.evaluate(`(()=>{const b=document.querySelector('[data-qa-info=yes]'),e=b.parentElement.querySelector('span.absolute'),r=e?.getBoundingClientRect(),bar=document.querySelector('.phone-tabs');return {text:e?.textContent,box:r?{x:r.x,y:r.y,right:r.right,bottom:r.bottom}:null,width:innerWidth,height:innerHeight,barTop:bar?.getBoundingClientRect().top}})()`);
  await c.click('[data-qa-info=yes]');await c.evaluate(`document.querySelector('[data-qa-info=yes]')?.removeAttribute('data-qa-info')`);
  return result;
}
function assertBox(detail) {assert.ok(detail.box && detail.box.x>=0 && detail.box.y>=0 && detail.box.right<=detail.width+1 && detail.box.bottom<=Math.min(detail.height,detail.barTop??detail.height),'Popover stays in the visible viewport: '+JSON.stringify(detail));}
exports.qa = async c => {
  const {encodeShareUrl}=await import('../lib/permalink-codec.mjs');
  const healthBuild={race:'Dark Elf',gender:'Female',sign:'The Tower',name:'QA Health Test',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
  for(const width of [1366,375]) for(const theme of ['ashfall','morrowind']) {
    await c.viewport(width);
    const script=await seed(c,{},theme);
    try {
      for(const id of ['QA-01','QA-02']) await c.check(`${id}/enchanting/${width}/${theme}`,async()=>{
        await c.navigate('enchanting');
        await c.until(`document.querySelector('select[aria-label="Effect 1"]')?.options.length>20`);
        await c.select('select[aria-label="Effect 1"]','Fortify Attribute (base 1)');
        if(id==='QA-01') {await c.type('#enchant-soul-size','400');await c.button('Constant');await c.button('Add Effect');await c.select('select[aria-label="Effect 2"]','Fortify Attribute (base 1)');}
        else {const ring=await c.evaluate(`[...document.querySelector('#enchant-item-select').options].find(o=>o.textContent.startsWith('Common Ring')).textContent.trim()`);await c.select('#enchant-item-select',ring);await c.select('select[id$="-range"]','Target');}
        const text=await body(c);await record(c,id,{width,theme,text});
        const points=await c.evaluate(`(()=>{const label=[...document.querySelectorAll('span,div,p')].find(e=>e.childElementCount===0&&e.textContent.trim()==='Enchantment Points');return label?.parentElement.textContent})()`);
        await c.screenshot(`${id}-${width}-${theme}`);
        if(id==='QA-02') assert.match(text,/1 \/ 1 Points/);else assert.match(text,/75\s*\/|75\s*points|75\/|75 of/i,points);
        return {points,text};
      });
      await c.check(`QA-05/title/${width}/${theme}`,async()=>{
        await c.navigate('builder');await readyBuilder(c);await c.builderTab('builder');
        await c.select('#builder-race','Breton');await c.select('#builder-sign','The Tower');await c.button('Female');
        const configured=await body(c);
        const nav=async route=>{const phone=await c.evaluate('innerWidth<900');if(phone){await c.evaluate(`(()=>{const e=[...document.querySelectorAll('.phone-tabs button')].find(e=>e.textContent.trim()===${JSON.stringify(route==='home'?'Home':'Level')});e.dataset.qaNav='yes'})()`);await c.click('[data-qa-nav=yes]');await c.evaluate(`document.querySelector('[data-qa-nav=yes]').removeAttribute('data-qa-nav')`);}else await c.click(route==='home'?'.brand-home':'#react-nav-leveler');await c.until(`location.pathname===${JSON.stringify(route==='home'?'/':'/'+route)}`);await c.idle();await c.pause(200);};
        await nav('home');const home=await body(c);await nav('leveler');const simulator=await body(c);
        await record(c,'QA-05',{width,theme,configured,home,simulator});
        assert.doesNotMatch(simulator,/Male Dark Elf\s*·\s*The Lady/);return {configured,home,simulator};
      });
      await c.check(`QA-03/fractional-level-gain/${width}/${theme}`,async()=>{
        await c.openDocument(c.base+encodeShareUrl({view:'leveler',world:'vanilla',build:healthBuild}));await c.idle();await c.until('document.querySelector("main").textContent.includes("QA Health Test")');
        const text=await body(c);await record(c,'QA-03',{width,theme,text});assert.match(text,/\+3\.5 HP Gain/);return text;
      });
      for(const race of ['Argonian','Khajiit','Khajiit (Cathay-raht)']) await c.check(`QA-10/endgame/${race}/${width}/${theme}`,async()=>{
        const arce=race.includes('(');await c.openDocument(c.base+encodeShareUrl({view:'builder',world:arce?'tr':'vanilla',arce,build:{...healthBuild,name:'Altmer Atronach Spellweaver',race}}));await c.idle();await readyBuilder(c);
        await c.evaluate(`document.getElementById('gear-advisor').scrollIntoView({block:'start'})`);await c.idle();await c.button('Optimize Gear');await c.until('document.querySelector(".best-in-slot-recommendations table")');
        const buttons=await c.evaluate(`[...document.querySelectorAll('.best-in-slot-recommendations button')].filter(b=>/Show alternatives/.test(b.textContent)).map((b,i)=>{b.dataset.qaAlternative=i;return '[data-qa-alternative="'+i+'"]'})`);
        for(const b of buttons) await c.click(b);
        const text=await c.evaluate(`document.querySelector('.best-in-slot-recommendations').innerText`);
        const l=await fixture.loader(),data=await l.loadFeature(arce?'tr_arce':'vanilla','bestInSlot');const forbidden=Object.values(data.metadata.BestInSlot.items).filter(i=>i.beastWearable===false&&text.includes(i.name)).map(i=>i.name);
        await record(c,'QA-10',{width,theme,race,text,forbidden});assert.deepEqual(forbidden,[]);return text;
      });
      for(const profile of ['vanilla','tr','tr_arce']) await c.check(`QA-06/apparatus/${profile}/${width}/${theme}`,async()=>{
        await c.navigate('alchemy',profile);await c.until('document.querySelector("#alc-mortar-select option")?.parentElement.options.length>1');
        const tools=await c.evaluate(`['mortar','alembic','calcinator','retort'].map(t=>({type:t,options:[...document.querySelector('#alc-'+t+'-select').options].map(o=>({key:o.value,name:o.textContent}))}))`);
        await record(c,'QA-06',{width,theme,profile,tools});assert.ok(tools.every(g=>g.options.every(o=>!/secret\s*master/i.test(o.name))));return tools;
      });
      await c.check(`QA-07/search/${width}/${theme}`,async()=>{
        await c.navigate('travel','vanilla','&from=Seyda%20Neen&to=Balmora');await c.until('document.querySelector("#travel-results").textContent.includes("Take the Silt Strider")');
        const before=await body(c);await c.type('#travel-destination',"Ald'ruhn");await c.pause(300);
        const options=await c.evaluate(`[...document.querySelectorAll('[role=listbox] [role=option]')].map(e=>e.textContent)`),after=await body(c);
        await record(c,'QA-07',{width,theme,options,stale:after.includes('Take the Silt Strider'),before,after});assert.ok(options.some(o=>/Ald.ruhn/i.test(o)),'Apostrophe search matches Ald-ruhn');return {options,after};
      });
      for(const profile of ['tr','tr_arce']) await c.check(`QA-11/factions/${profile}/${width}/${theme}`,async()=>{
        await c.navigate('factions',profile);await c.until('document.querySelectorAll(".faction-roster-root button").length>0 || document.querySelector("main").textContent.includes("<Deprecated>")');
        const text=await body(c);await record(c,'QA-11',{width,theme,profile,text});assert.doesNotMatch(text,/<Deprecated>/);return {text};
      });
      await c.check(`QA-12/premade-copy/${width}/${theme}`,async()=>{
        await c.navigate('builder');await readyBuilder(c);await c.builderTab('premade');await c.button('Expand All');const text=await body(c);await record(c,'QA-12',{width,theme,text});assert.match(text,/plays like/i);assert.match(text,/trade.off/i);assert.doesNotMatch(text,/\bMaj:|\bMin:/);return text;
      });
      await c.check(`QA-15/about/${width}/${theme}`,async()=>{
        await c.navigate('about');const text=await body(c),links=await c.evaluate(`[...document.querySelectorAll('main a')].map(a=>a.href)`);await record(c,'QA-15',{width,theme,text,links});assert.match(text,/open source/i);assert.match(text,/AGPL-3.0/);assert.match(text,/LowGraph/);assert.ok(links.includes('https://github.com/lowgraph/siltstrider.tools'));return text;
      });
      await c.check(`QA-22/challenge-permalink/${width}/${theme}`,async()=>{
        const {formatRunSeed,generateSeededRun}=await import('../lib/challenge-engine.mjs'),{decodeShareUrl}=await import('../lib/permalink-codec.mjs');
        const seed=formatRunSeed({code:'QA222',profile:'vanilla',allowedBands:{Easy:true},restrictionCount:1,objectiveCount:1}),run=generateSeededRun(seed,{world:'vanilla'}).run;
        await c.openDocument(c.base+encodeShareUrl({view:'challenge',world:'vanilla',run}));await c.idle();await c.until('document.querySelector("#challenge-seed-input")?.value==='+JSON.stringify(seed));
        if(width<600) await c.click('.hamburger');await c.click('#react-world-tr');await c.until('document.querySelector("#react-world-tr").getAttribute("aria-pressed")==="true"');
        await c.evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.__qaCopied=value}})`);await c.click('button[title="Copy shareable challenge link"]');await c.until('window.__qaCopied');
        const decoded=decodeShareUrl(await c.evaluate('window.__qaCopied'));await record(c,'QA-22',{width,theme,seed,decoded});assert.equal(decoded.run.seed,seed);assert.equal(decoded.world,'vanilla','run world wins over the current visitor world');return decoded;
      });
      for(const profile of ['vanilla','tr','tr_arce']) await c.check(`QA-20/Restore-Health/${profile}/${width}/${theme}`,async()=>{
        await c.navigate('alchemy',profile);await c.until('document.querySelector("#reverse-alchemy-search")');
        await c.type('#reverse-alchemy-search','Restore Health');await c.until('document.querySelector("#reverse-alchemy-effects button")');await c.click('#reverse-alchemy-effects button');
        await c.until('document.querySelector(".reverse-alchemy-pair")');
        const l=await fixture.loader(),feature=await l.loadFeature(profile,'alchemy');const {adaptAlchemy}=await import('../lib/alchemy-catalogs.mjs');const {findAlchemyPairs,alchemyEffectOptions}=await import('../lib/reverse-alchemy.mjs');
        const a=adaptAlchemy(feature),effect=alchemyEffectOptions(a.ingredients).find(e=>e.n==='Restore Health'),expected=findAlchemyPairs(a.ingredients,[effect.id],12);
        const shown=await c.evaluate(`[...document.querySelectorAll('.reverse-alchemy-pair > p:first-child')].map(e=>e.textContent)`);
        assert.deepEqual(shown,expected.pairs.map(p=>p.ingredients.map(i=>i.n).join(' + ')));return record(c,'QA-20',{width,theme,profile,total:expected.total,shown});
      });
      for(const key of ['fighters guild','mages guild']) await c.check(`QA-20/ranks/${key}/${width}/${theme}`,async()=>{
        await c.navigate('factions','vanilla');await c.until('document.querySelector("#faction-search-input")');await c.type('#faction-search-input',key);
        await c.until('document.querySelector(".faction-roster-item")');await c.click('.faction-roster-item');await c.until('document.querySelectorAll(".rank-stepper-btn").length===10');
        const l=await fixture.loader(),faction=(await l.loadCatalog('vanilla','Factions')).find(f=>f.key===key),rows=[];
        for(const rank of faction.ranks) {
          await c.click(`.rank-stepper-btn:nth-child(${rank.index+1})`);
          const shown=await c.evaluate(`(()=>{const pane=document.querySelector('.faction-detail-pane'),labels=['Favoured Attributes','Favoured Skills','Faction Reputation'];return {title:pane.querySelector('h4').textContent,groups:labels.map(label=>{const e=[...pane.querySelectorAll('span')].find(e=>e.textContent.trim()===label&&e.classList.contains('uppercase'));return [...e.parentElement.querySelectorAll('span')].map(e=>e.textContent).filter(t=>/^\\d+(?:\\.\\d+)? \\/ \\d+/.test(t)).map(t=>Number(t.match(/\\/ (\\d+)/)[1]));})}})()`);
          assert.ok(shown.title.startsWith(rank.name+','));assert.deepEqual(shown.groups,[[rank.attribute1,rank.attribute2],[rank.primarySkill,...Array(2).fill(rank.favouredSkill)],[rank.reputation]]);rows.push({rank,shown});
        }
        return record(c,'QA-20',{width,theme,key,rows});
      });
      for(const profile of ['vanilla','tr','tr_arce']) for(const walk of [true,false]) await c.check(`QA-16/Mournhold/${profile}/${walk?'walking':'no-walking'}/${width}/${theme}`,async()=>{
        await c.navigate('travel',profile,`&from=Ebonheart&to=Mournhold${walk?'':'&walk=0'}`);await c.until('document.getElementById("travel-results").textContent.includes("No Route") || document.getElementById("travel-results").textContent.includes("Fares for your character:")');
        const text=await body(c);await record(c,'QA-16',{width,theme,profile,walk,text});assert.doesNotMatch(text,/No Route/);assert.match(text,/Asciene Rane|transport to mournhold/i);return text;
      });
      // A loaded save isolates the Health chart from random premades.
      await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
      for(const health of [35,45]) await c.check(`QA-04/chart-start/${health}/${width}/${theme}`,async()=>{
        const s=fixture.save();s.vitals.health={current:health,max:health};const {rememberSave}=await import('../lib/active-save-store.mjs');const store={};await rememberSave(s,{setItem:(k,v)=>store[k]=v});
        await c.evaluate(`for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);
        await c.navigate('leveler');await c.until('document.querySelector("main").textContent.includes("QA Traveller")');await c.until('document.querySelector(".health-growth-chart-wrap svg")');
        if(width<1024) await c.button('Leveled Character Sheet');
        await c.evaluate(`(()=>{const s=document.querySelector('.health-growth-chart-wrap svg'),r=s.getBoundingClientRect();s.dataset.qaChart='yes';})()`);
        await c.evaluate(`document.querySelector('[data-qa-chart=yes]').scrollIntoView({block:'center'})`);
        const point=await c.evaluate(`(()=>{const s=document.querySelector('[data-qa-chart=yes]'),r=s.getBoundingClientRect(),v=s.viewBox.baseVal;return {x:r.x+38*r.width/v.width,y:r.y+r.height/2}})()`);
        await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await c.pause(200);
        const charts=await c.evaluate(`[...document.querySelectorAll('.health-growth-chart-wrap')].map(s=>({label:s.querySelector('svg').getAttribute('aria-label'),text:s.textContent,html:s.outerHTML}))`);
        await record(c,'QA-04',{width,theme,health,charts});assert.ok(charts.some(s=>s.text.includes('Lv 3: '+health+' vs '+health+' HP')),'Chart preserves loaded Health');return charts;
      });
    } finally {await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier}).catch(()=>{});}
  }
  if(c.filter && !['QA-08','QA-09'].some(id=>id.includes(c.filter)||c.filter.startsWith(id))) return;
  for(const width of [375,390]) for(const theme of ['ashfall','morrowind']) {
    await c.viewport(width);await c.evaluate(`localStorage.removeItem('silt-active-save');localStorage.setItem('silt-theme',${JSON.stringify(theme)})`);
    await c.navigate('builder');await readyBuilder(c);await c.builderTab('builder');
    for(let index=0;index<5;index++) await c.check(`QA-09/popover-${index+1}/${width}/${theme}`,async()=>{const d=await info(c,index);await record(c,'QA-09',{width,theme,index,...d});assertBox(d);return d;});
    await c.builderTab('builder');await c.evaluate(`document.getElementById('gear-advisor').scrollIntoView({block:'start'})`);await c.idle();await c.button('Optimize Gear');await c.until('document.querySelector("#gear-advisor table tbody tr")');await c.idle();
    for(const phase of ['Early','Late']) await c.check(`QA-08/${phase}/${width}/${theme}`,async()=>{
      await c.until('document.querySelector("main table tbody tr")');
      const d=await c.evaluate(`(()=>{const tables=[...document.querySelectorAll('#gear-advisor table')].filter(t=>${JSON.stringify(phase)}==='Early'?t.closest('details')?.querySelector('summary')?.textContent==='Early game':t.closest('.best-in-slot-recommendations'));return tables.map(t=>{const r=t.getBoundingClientRect(),bad=[];for(const td of t.querySelectorAll('td:last-child')){const walker=document.createTreeWalker(td,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode;for(const m of n.textContent.matchAll(/[A-Za-z]{4,}/g)){const range=document.createRange();range.setStart(n,m.index);range.setEnd(n,m.index+m[0].length);const lines=[...range.getClientRects()].filter(r=>r.width>0);if(new Set(lines.map(r=>Math.round(r.y))).size>1)bad.push(m[0]);}}}return {heading:t.querySelector('thead').textContent,box:{x:r.x,right:r.right},width:innerWidth,brokenWords:bad};})})()`);
      await record(c,'QA-08',{width,theme,phase,tables:d});assert.ok(d.length,'Gear tables exist');assert.ok(d.every(t=>t.box.x>=0&&t.box.right<=t.width+1&&t.brokenWords.length===0),'Gear stays inside viewport with whole words: '+JSON.stringify(d));return d;
    });
  }
};

exports.touch = async c => {
  assert.ok(c.touch,'Use --touch for actual touch input');await c.viewport(375);
  const capabilities=await c.evaluate(`({points:navigator.maxTouchPoints,coarse:matchMedia('(pointer: coarse)').matches,hover:matchMedia('(hover: none)').matches,ua:navigator.userAgent})`);
  assert.ok(capabilities.points>0&&capabilities.coarse&&capabilities.hover,JSON.stringify(capabilities));c.report.touchCapabilities=capabilities;
  for(const route of ['home','builder','travel','alchemy']) await c.check(`QA-18/no-keyboard-hint/${route}`,async()=>{await c.navigate(route);const text=await c.evaluate('document.body.innerText');assert.doesNotMatch(text,/Ctrl\s*K|⌘\s*K/);return {route};});
  await c.check('QA-18/tap-header-search-and-phone-navigation',async()=>{
    await c.navigate('home');await c.click('.search-trigger');await c.until('document.querySelector("[role=dialog]")');assert.doesNotMatch(await c.evaluate('document.querySelector("[role=dialog]").innerText'),/Ctrl\s*K|⌘\s*K/);
    const close=await c.evaluate(`(()=>{const e=document.querySelector('[role=dialog] button[aria-label*="Close"]');if(!e)throw Error('Missing search close');e.dataset.qaClose='yes';return '[data-qa-close=yes]'})()`);await c.click(close);await c.until('!document.querySelector("[role=dialog]")');
    for(const label of ['Build','Level','Travel','Home']) {await c.evaluate(`(()=>{const e=[...document.querySelectorAll('.phone-tabs button')].find(e=>e.textContent.trim()===${JSON.stringify(label)});e.dataset.qaTab='yes'})()`);await c.click('[data-qa-tab=yes]');await c.evaluate(`document.querySelector('[data-qa-tab=yes]').removeAttribute('data-qa-tab')`);await c.idle();}
    for(const selector of ['.hamburger','.phone-tabs button[aria-controls="react-menu-drawer"]']) {await c.click(selector);assert.equal(await c.evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-expanded')`),'true');await c.click(selector);assert.equal(await c.evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-expanded')`),'false');}
    return {searchTap:true,tabTaps:true,menuTaps:true};
  });
  await c.navigate('builder');await readyBuilder(c);await c.builderTab('builder');
  for(let i=0;i<5;i++) await c.check(`QA-18/tap-popover-${i+1}`,async()=>{const d=await info(c,i);assert.ok(d.text,'Tap opens info');return d;});
  await c.check('QA-18/ingredient-and-reverse-picker',async()=>{
    await c.navigate('alchemy');await c.until(`document.querySelector('[aria-label="Crucible 1 ingredient"]')`);await c.choose('[aria-label="Crucible 1 ingredient"]','Marshmerrow');
    await c.type('#reverse-alchemy-search','Restore Health');await c.until('document.querySelector("#reverse-alchemy-effects button")');await c.click('#reverse-alchemy-effects button');assert.match(await body(c),/Marshmerrow|Restore Health/);return {ingredientTap:true,effectTap:true};
  });
  const store=await storedSave();
  for(let i=1;i<=20;i++) await c.check(`QA-18/saved-Travel/tap/${i}`,async()=>{
    await c.evaluate(`localStorage.clear();for(const [k,v] of Object.entries(${JSON.stringify(store)}))localStorage.setItem(k,v)`);
    await c.navigate('travel');await c.click('#travel-options > summary');
    const names=['Mages Guild member','Divine Intervention','Almsivi Intervention'];
    for(let n=0;n<names.length;n++) {
      const selector=await c.evaluate(`(()=>{const e=[...document.querySelectorAll('#travel-options label')].find(e=>e.textContent.includes(${JSON.stringify(names[n])}))?.querySelector('input');if(!e)throw Error('Missing save option');e.id='qa-save-${n}';return '#'+e.id})()`);
      await c.until(`document.querySelector(${JSON.stringify(selector)}).checked===${n!==1}`);await c.click(selector);assert.equal(await c.evaluate(`document.querySelector(${JSON.stringify(selector)}).checked`),n===1,'Tap changed the checkbox before leaving');
    }
    const carrying=await c.evaluate(`(()=>{const e=[...document.querySelectorAll('#travel-options label')].find(e=>e.textContent.includes('Carrying')).querySelector('input');e.id='qa-carrying';return '#qa-carrying'})()`);await c.type(carrying,'12.5');
    const before=await c.evaluate(`JSON.parse(localStorage.getItem('silt-travel-options-v1'))`);
    assert.ok(Object.values(before.saves).some(e=>e.values.mageGuild===false&&e.values.divine===true&&e.values.almsivi===false&&e.values.carried===12.5),'Tap choices stored before navigation');
    await c.navigate('leveler');await c.navigate('travel');await c.click('#travel-options > summary');const after=await c.evaluate(`JSON.parse(localStorage.getItem('silt-travel-options-v1'))`);assert.deepEqual(after,before);return {applied:true,stored:true,restored:true};
  });
  await c.check('QA-18/touchscreen-laptop-retains-shortcut',async()=>{
    await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
    await c.send('Emulation.setEmitTouchEventsForMouse',{enabled:false,configuration:'desktop'});
    await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5,configuration:'desktop'});
    await c.send('Emulation.setEmulatedMedia',{features:[{name:'pointer',value:'fine'},{name:'hover',value:'hover'}]});
    await c.navigate('home');const device=await c.evaluate(`({touch:navigator.maxTouchPoints,fine:matchMedia('(pointer: fine)').matches,coarse:matchMedia('(pointer: coarse)').matches})`);
    (c.report.laptopCapabilities ||= []).push(device);assert.ok(device.touch>0&&device.fine,'Actual CDP touchscreen laptop capabilities: '+JSON.stringify(device));assert.match(await c.evaluate('document.body.innerText'),/Ctrl\s*K|⌘\s*K/);return device;
  });
};
