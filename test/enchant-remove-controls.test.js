const {test}=require('node:test');const assert=require('node:assert/strict');
const {load,React,mount}=require('./helpers/launch-render.cjs');
const rules=['Restore Health','Fire Damage'].map((name,i)=>({key:String(i),name,baseCost:5,allowEnchanting:true,castSelf:true,castTouch:true,castTarget:true}));

async function fixture(check,effects=rules) {
  const Enchant=(await load('components/calculators/enchanting/enchanting-workstation.jsx',{
    '../../character-context':{useActiveCharacter:()=>({build:{},sheet:{}})},
    '../../shell-context':{useShell:()=>({world:'vanilla'})},
    '../../use-game-data':{useGameData:()=>({status:'ready',data:{profile:'vanilla',catalogs:{EffectRules:effects,GameSettings:[],Attributes:[],Skills:[]}}})},
    '../../active-character-link':require('./helpers/active-character-link.cjs'),
  })).default;
  await mount(Enchant,check);
}
const add=()=>React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add Effect').click());
const remove=n=>React.act(async()=>document.querySelector(`button[aria-label="Remove effect ${n}"]`).click());
const pick=(n,value)=>React.act(async()=>{const e=document.querySelector(`select[aria-label="Effect ${n}"]`);e.value=value;e.dispatchEvent(new window.Event('change',{bubbles:true}));});
const values=()=>[...document.querySelectorAll('.enchant-effect-header select')].map(s=>s.value);

test('QA-44: one effect has no removal control; adding creates two individually named controls',()=>fixture(async()=>{
  assert.equal(document.querySelector('[aria-label^="Remove effect "]'),null);
  await add();assert.deepEqual([...document.querySelectorAll('[aria-label^="Remove effect "]')].map(b=>b.getAttribute('aria-label')),['Remove effect 1','Remove effect 2']);
}));

test('QA-44: removing the middle of three effects preserves its neighbours and renumbers the controls',()=>fixture(async()=>{
  await pick(1,'0');await add();await pick(2,'1');await add();await pick(3,'0');
  await remove(2);assert.deepEqual(values(),['0','0']);
  assert.equal(document.querySelector('[aria-label="Remove effect 3"]'),null);
  await remove(2);assert.deepEqual(values(),['0']);assert.equal(document.querySelector('[aria-label^="Remove effect "]'),null);
}));

test('QA-44: removing the first effect retains the second choice rather than resetting it',()=>fixture(async()=>{
  await pick(1,'0');await add();await pick(2,'1');await remove(1);assert.deepEqual(values(),['1']);
  assert.equal(document.querySelector('[aria-label^="Remove effect "]'),null);
}));

test('QA-44: unselected effects can still be removed when the effect catalog is empty',()=>fixture(async()=>{
  await add();await add();await remove(2);assert.deepEqual(values(),['','']);await remove(1);assert.deepEqual(values(),['']);
},[]));
