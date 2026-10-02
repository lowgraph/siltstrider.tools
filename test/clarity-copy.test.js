const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
for(const [gold,fare,remaining] of [[50,12,38],[12,12,0],[0,12,-12],[50,0,50]])test(`U18: saved ${gold} gold minus ${fare} fare gives ${remaining}`,async()=>{
  const {routeGoldBalance}=await import('../lib/travel-budget.mjs');
  const route=Object.freeze({isValid:true,totals:Object.freeze({goldKnown:true,gold:fare})});
  assert.deepEqual(routeGoldBalance(route,gold),{fare,remaining});assert.equal(route.totals.gold,fare);
});
test('U18: missing, unknown, malformed or negative money never claims a remaining balance',async()=>{
  const {routeGoldBalance}=await import('../lib/travel-budget.mjs');
  for(const gold of [undefined,null,'50',NaN,Infinity,-1])assert.equal(routeGoldBalance({isValid:true,totals:{goldKnown:true,gold:10}},gold),null);
  for(const route of [null,{}, {isValid:false,totals:{goldKnown:true,gold:1}}, {isValid:true,totals:{goldKnown:false,gold:10}}, ...[undefined,null,'10',NaN,Infinity,-1].map(gold=>({isValid:true,totals:{goldKnown:true,gold}}))])assert.equal(routeGoldBalance(route,50),null);
});
for(const profile of ['vanilla','tr','tr_arce'])test(`U09: Clear search restores the ${profile} race collection and returns focus`,async()=>{
  const {Premades}=require('./helpers/qa-render.cjs');const {RACE_BUILDS,ARCE_BUILDS}=await import('../lib/premade-data.mjs');
  const pool=profile==='tr_arce'?[...RACE_BUILDS,...ARCE_BUILDS]:RACE_BUILDS;const picked=[];
  await mount(Premades,async()=>{
    const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
    await React.act(async()=>button('By Race').click());const input=document.querySelector('[aria-label="Filter premade classes"]');
    await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'NoSuchQABuild');input.dispatchEvent(new window.Event('input',{bubbles:true}));});
    assert.match(document.querySelector('.premade-collection-note').textContent,/Showing 0 of/);
    await React.act(async()=>button('Clear search').click());assert.equal(input.value,'');assert.equal(document.activeElement,input);
    assert.match(document.querySelector('.premade-collection-note').textContent,new RegExp(`Showing ${pool.length} of ${pool.length} race-themed`));
    assert.deepEqual(picked,[],'Clearing search does not load a different character');
  },{activeProfile:profile,onSelectBuild:b=>picked.push(b)});
});
test('U15: content-file help describes game plugins in full and compact imported-save notices',async()=>{
  const {renderToStaticMarkup}=require('react-dom/server');const activeSave=Object.freeze({contentFileCount:7,profile:'tr',save:{identity:{name:'QA – Save'}}});
  const Notice=(await load('components/character-vault/save-import-notice.jsx',{'../character-context':{useActiveCharacter:()=>({activeSave,clearSave(){}})}})).default;
  for(const compact of [false,true]){const html=renderToStaticMarkup(React.createElement(Notice,{compact}));assert.match(html,/game, expansion and mod files.*not extra save files/);assert.match(html,/7 content files/);}
});
