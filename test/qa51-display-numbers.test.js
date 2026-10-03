const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load,React,mount}=require('./helpers/launch-render.cjs');
const {renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom');

async function text(file,props,selector,exportName='default') {
  const Component=(await load(file))[exportName];
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component,props)));
  try { return dom.window.document.querySelector(selector)?.textContent.trim() ?? null; }
  finally {dom.window.close();}
}

for(const [gain,expected] of [[33.400000000000034,'+33.4'],[0.1+0.2,'+0.3'],[12,'+12'],[0,'+0'],[-0,'+0'],[NaN,'+—'],[Infinity,'+—']])test(`QA-51: Home Health gain ${gain} displays ${expected} without rounding the forecast`,async()=>{
  const health=Object.freeze({gain,level:30,levels:Object.freeze([1,30]),optimal:Object.freeze([50,160]),delayed:Object.freeze([50,120])});
  const props={character:{name:'QA – Fractional forecast'},health,onNavigate(){}};
  assert.equal(await text('components/home-hub/home-tools.jsx',props,'.home-tool--leveler .home-big'),expected);
  assert.ok(Object.is(health.gain,gain));
});

for(const [weight,expected] of [[0.10000000149011612,'0.1 w'],[0.3,'0.3 w'],[12,'12 w'],[0,'0 w'],[-0,'0 w'],[NaN,'— w'],[Infinity,'— w'],[undefined,null]])test(`QA-51: ring weight ${weight} displays ${expected} without altering the item`,async()=>{
  const item=Object.freeze({id:'qa_ring',name:'QA – Ring',type:'CLOT',weight});
  assert.equal(await text('components/equipment-studio/equipment-slot-card.jsx',{slot:'LeftRing',item,onSelectSlot(){},onUnequipSlot(){}},'[title="Weight"]','EquipmentSlotCard'),expected);
  assert.ok(Object.is(item.weight,weight));
});

test('QA-51: an empty equipment slot has no invented weight',async()=>{
  assert.equal(await text('components/equipment-studio/equipment-slot-card.jsx',{slot:'RightRing',onSelectSlot(){}},'[title="Weight"]','EquipmentSlotCard'),null);
});
test('QA-51: an unavailable Home forecast remains absent',async()=>{
  assert.equal(await text('components/home-hub/home-tools.jsx',{character:{name:'QA – No forecast'},health:null,onNavigate(){}},'.home-tool--leveler .home-big'),null);
});

test('QA-51 equipped-kit audit: the slot chooser does not contain another focusable control',async()=>{
  const Component=(await load('components/equipment-studio/equipment-slot-card.jsx')).EquipmentSlotCard;
  await mount(Component,()=>assert.equal(document.querySelector('[role="button"] button'),null),{slot:'LeftRing',item:{id:'qa_ring',name:'QA – Ring',weight:.1},onSelectSlot(){},onUnequipSlot(){}});
});
test('QA-51 equipped-kit audit: keyboard activation of Unequip does not open the slot picker',async()=>{
  const Component=(await load('components/equipment-studio/equipment-slot-card.jsx')).EquipmentSlotCard;
  let picks=0,removes=0;
  await mount(Component,async()=>{
    const remove=document.querySelector('button[aria-label="Unequip Left Ring"]');remove.focus();
    await React.act(async()=>{remove.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));remove.click();});
    assert.equal(picks,0);assert.equal(removes,1);
  },{slot:'LeftRing',item:{id:'qa_ring',name:'QA – Ring',weight:.1},onSelectSlot(){picks++},onUnequipSlot(){removes++}});
});
for(const item of [null,{id:'qa_ring',name:'QA – Ring',weight:.1}])test(`QA-51 equipped-kit audit: ${item?'equipped':'empty'} slot supports click, Enter and Space`,async()=>{
  const Component=(await load('components/equipment-studio/equipment-slot-card.jsx')).EquipmentSlotCard;
  const picked=[];
  await mount(Component,async()=>{
    const choose=document.querySelector('[role="button"]');choose.focus();
    await React.act(async()=>{choose.click();for(const key of ['Enter',' '])choose.dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true}));});
    assert.deepEqual(picked,['LeftRing','LeftRing','LeftRing']);
  },{slot:'LeftRing',item,onSelectSlot(slot){picked.push(slot)},onUnequipSlot(){}});
});
