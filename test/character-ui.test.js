const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const Module=require('node:module');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const {act}=React;
function component(file,exportName="default"){
 const result=require('esbuild').buildSync({entryPoints:[path.resolve(file)],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
 const m=new Module(path.resolve(file),module);m.paths=module.paths;m._compile(result.outputFiles[0].text,path.resolve(file));return m.exports[exportName];
}
test('React builder locks preset fields, names every dropdown, and enables custom edits',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const Configurator=component('components/character-builder/configurator.jsx');
 const root=createRoot(document.getElementById('root'));
 const build={race:'Breton',className:'Mage',gender:'Male',sign:'The Mage',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['A','B','C','D','E'],min:['F','G','H','I','J']};
 const catalogs={races:{Breton:{}},classes:{Mage:{}},signs:{'The Mage':{}},specSkills:{Combat:[],Magic:['A','B','C','D','E','F','G','H','I','J'],Stealth:[]}};
 const props={build,catalogs,onUpdateField(){},onSwapSkill(){},onSelectClassPreset(){}};
 try{
  await act(async()=>root.render(React.createElement(Configurator,props)));
  const selects=[...document.querySelectorAll('select')];
  assert.equal(selects.length,16);
  assert.ok(selects.every(el=>el.getAttribute('aria-label')));
  assert.equal(selects.filter(el=>el.disabled).length,13);
  await act(async()=>root.render(React.createElement(Configurator,{...props,build:{...build,className:'Custom'}})));
  assert.equal(document.querySelectorAll('select:disabled').length,0);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});
test('React optimizer uses one action, preserves endgame and clears results on character changes',async()=>{
 const dom=new JSDOM('<div id="root"></div><input id="gear-steal" type="checkbox" checked><input id="gear-endgame" type="checkbox"><button id="btn-gear"></button><div id="gear-box"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.Event=dom.window.Event;global.MutationObserver=dom.window.MutationObserver;global.IS_REACT_ACT_ENVIRONMENT=true;
 const Gear=component('components/character-builder/gear-advisor.jsx','GearAdvisorView');
 const root=createRoot(document.getElementById('root'));
 window.makeBuildProfile=()=>({armRanked:[],wepRanked:[]});
 document.getElementById('btn-gear').onclick=()=>document.getElementById('gear-box').innerHTML='<details><summary>Early game</summary>Old early rows</details><details><summary>Optimized endgame kit</summary>Argonian equipment</details>';
 try{
  await act(async()=>root.render(React.createElement(Gear,{build:{race:'Argonian'},result:{status:'loading'},onLoad(){}})));
  await act(async()=>document.querySelector('#root button').click());
  assert.match(document.getElementById('root').textContent,/Argonian equipment/);
  assert.doesNotMatch(document.getElementById('root').textContent,/Old early rows/);
  assert.equal(document.querySelectorAll('#root details').length,2);
  assert.equal(document.querySelectorAll('#root input').length,3);
  await act(async()=>root.render(React.createElement(Gear,{build:{race:'Breton'},result:{status:'loading'},onLoad(){}})));
  assert.doesNotMatch(document.getElementById('root').textContent,/Argonian equipment/);
  assert.equal(document.getElementById('gear-box').innerHTML,'');
  const [steal,endgame]=document.querySelectorAll('#root input');
  await act(async()=>endgame.click());assert.equal(document.getElementById('gear-endgame').checked,true);
  await act(async()=>steal.click());assert.equal(endgame.disabled,false);assert.equal(endgame.checked,true);
  await act(async()=>steal.click());assert.equal(endgame.disabled,false);assert.equal(endgame.checked,true);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});


test('early game uses optimizer table columns and warnings; clears during profile loading',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const View=component('components/character-builder/gear-sources.jsx','GearSourcesView');
 const root=createRoot(document.getElementById('root'));
 const pick={name:'Broken cuirass',cellKey:'interior:Test',strength:30,acquisition:'purchase',price:0,condition:{raw:0,maximum:100},needsRepair:true,evidenceTruncated:true};
 const row={key:'armor/cuirass/heavy/000',category:'armor',slot:'cuirass',armorClass:'heavy',toggles:{theft:false,endgame:false,nearStart:false},primary:pick};
 const result={status:'ready',data:{profile:'tr',catalogs:{GearRows:[row,{...row,key:'other',toggles:{...row.toggles,endgame:true},primary:{...pick,name:'Endgame cuirass'}}]},metadata:{GearRows:{policy:{version:'test-policy'},coverage:'Static evidence'}}}};
 try{
  const props={build:{maj:['Heavy Armor']},ranking:{armRanked:[{n:'Heavy Armor'}],primaryArmor:'Heavy Armor',wepRanked:[]},result,toggles:{theft:false,endgame:false,nearStart:false}};
  await act(async()=>root.render(React.createElement(View,props)));
  assert.match(document.body.textContent,/Broken: repair before use/);
  assert.deepEqual([...document.querySelectorAll('thead th')].map(el=>el.textContent),['Slot','Item','Where']);
  assert.match(document.body.textContent,/Source search was capped/);
  await act(async()=>root.render(React.createElement(View,{...props,toggles:{...props.toggles,endgame:true}})));assert.match(document.body.textContent,/Endgame cuirass/);
  await act(async()=>root.render(React.createElement(View,{...props,result:{status:'loading'}})));
  assert.doesNotMatch(document.body.textContent,/Endgame cuirass/);
  assert.match(document.body.textContent,/Loading early-game equipment/);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});

test('clothing sources show enchant capacity as the game does, not the record\'s points',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const View=component('components/character-builder/gear-sources.jsx','GearSourcesView');
 const root=createRoot(document.getElementById('root'));
 const shirt={key:'exquisite_shirt_01',name:'Exquisite Shirt',cellKey:'interior:Vivec',strength:600,acquisition:'purchase',price:120,nearStart:true};
 const row={key:'clothing/shirt',category:'clothing',slot:'shirt',toggles:{theft:false,endgame:false,nearStart:false},primary:shirt};
 const result={status:'ready',data:{profile:'vanilla',catalogs:{GearRows:[row],GameSettings:[{key:'fenchantmentmult',value:0.10000000149011612}]},metadata:{}}};
 try{
  const props={build:{maj:[]},ranking:{armRanked:[{n:'Heavy Armor'}],primaryArmor:'Heavy Armor',wepRanked:[]},result,toggles:{theft:false,endgame:false,nearStart:false}};
  await act(async()=>root.render(React.createElement(View,props)));
  assert.match(document.body.textContent,/Base enchant capacity: 60\./);
  assert.doesNotMatch(document.body.textContent,/capacity: 600/);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});

test('React SiteHeader toggles hamburger drawer and renders desktop dropdowns with all views',async()=>{
 const dom=new JSDOM('<div id="root"></div><div class="account-bar"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const navigated=[];
 const shell={
   ready:true,world:'vanilla',arce:false,profile:'vanilla',view:'home',
   navigate:(view)=>navigated.push(view),
   setProfile:()=>{}
 };
 const SiteHeader=component('components/site-header.jsx');
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(SiteHeader,{shell})));

  const hamburger=document.querySelector('.hamburger');
  const drawer=document.querySelector('#react-menu-drawer');
  assert.ok(hamburger);assert.ok(drawer);
  assert.equal(hamburger.textContent,'☰');
  assert.equal(drawer.classList.contains('open'),false);

  // Click hamburger opens drawer and sets drawer-open class on account-bar
  await act(async()=>hamburger.click());
  assert.equal(hamburger.textContent,'✕');
  assert.equal(drawer.classList.contains('open'),true);
  assert.equal(document.querySelector('.account-bar').classList.contains('drawer-open'),true);

  // Mobile drawer contains all sections; the everyday tools lead, the occasional ones follow
  assert.match(drawer.textContent,/^ToolsBuild OptimizerLevel SimulatorAlchemyTravelFaction Journal/);
  assert.match(drawer.textContent,/More CalculatorsEnchantingSpellmaking/);
  assert.match(drawer.textContent,/Extras & SiteHomeChallenge Runs/);
  assert.match(drawer.textContent,/Game World Profile/);
  assert.equal(document.querySelector('#react-nav-challenge'),null,'Challenge Runs is not in the nav row');
  assert.equal(document.querySelector('#react-nav-vault').getAttribute('aria-label'),'Cloud Vault: your saved characters');

  // Click a drawer calculator button (e.g. Enchanting)
  const enchantBtn=[...drawer.querySelectorAll('button')].find(b=>b.textContent==='Enchanting');
  assert.ok(enchantBtn);
  await act(async()=>enchantBtn.click());
  assert.deepEqual(navigated,['enchanting']);
  assert.equal(hamburger.textContent,'☰');
  assert.equal(drawer.classList.contains('open'),false);

  // Re-open drawer: clicking inside account-bar must NOT close the drawer
  await act(async()=>hamburger.click());
  assert.equal(drawer.classList.contains('open'),true);
  const accountBar=document.querySelector('.account-bar');
  await act(async()=>accountBar.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
  assert.equal(drawer.classList.contains('open'),true,'clicking inside account-bar preserves open drawer');

  // Clicking outside both drawer and accountBar closes the drawer
  await act(async()=>document.body.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
  assert.equal(drawer.classList.contains('open'),false,'clicking outside closes the drawer');

  // Desktop Calculators dropdown
  const calcDropdownBtn=document.querySelector('.nav-dropdown-wrap button');
  assert.ok(calcDropdownBtn);
  assert.match(calcDropdownBtn.textContent,/Calculators/);
  await act(async()=>calcDropdownBtn.click());
  let dropdownMenu=document.querySelector('.nav-dropdown-menu');
  assert.ok(dropdownMenu);
  assert.equal(dropdownMenu.textContent,'EnchantingSpellmaking');

  // Clicking brand (within topbar, but outside dropdown) closes dropdown
  const brand=document.querySelector('.brand');
  await act(async()=>brand.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));
  assert.equal(document.querySelector('.nav-dropdown-menu'),null,'clicking inside topbar outside dropdown closes it');

  // Re-open dropdown and test Escape restores focus to calcDropdownBtn
  await act(async()=>calcDropdownBtn.click());
  dropdownMenu=document.querySelector('.nav-dropdown-menu');
  assert.ok(dropdownMenu);
  const firstItem=dropdownMenu.querySelector('[role="menuitem"]');
  firstItem.focus();
  assert.equal(document.activeElement,firstItem);
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(document.querySelector('.nav-dropdown-menu'),null);
  assert.equal(document.activeElement,calcDropdownBtn,'Escape restores focus to dropdown button');
 }finally{await act(async()=>root.unmount());dom.window.close();assert.equal(document.querySelector?.('.account-bar')?.classList.contains('drawer-open')||false,false,'unmount removes drawer-open');}
});

