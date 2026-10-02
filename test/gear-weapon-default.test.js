const {test}=require('node:test');
const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');

test('QA-33: Spear and Marksman use two hands; other weapons and missing builds use one',async()=>{
  const {defaultWeaponSetup}=await import('../lib/gear-rows.mjs');
  for(const skill of ['Spear','Marksman'])assert.equal(defaultWeaponSetup({maj:[skill],min:[]}), 'two-handed');
  for(const skill of ['Long Blade','Short Blade','Axe','Blunt Weapon','Hand-to-hand'])assert.equal(defaultWeaponSetup({maj:[skill]}), 'one-handed');
  for(const build of [null,undefined,{}, {maj:'Spear',min:42}])assert.equal(defaultWeaponSetup(build),'one-handed');
});
test('QA-33: major weapon outranks a minor weapon and frozen inputs are unchanged',async()=>{
  const {defaultWeaponSetup}=await import('../lib/gear-rows.mjs');
  const build=Object.freeze({maj:Object.freeze(['Spear']),min:Object.freeze(['Long Blade'])});
  assert.equal(defaultWeaponSetup(build),'two-handed');
  assert.equal(defaultWeaponSetup({maj:['Long Blade'],min:['Spear']}),'one-handed');
});
test('QA-33: restored and edited builds change the default until the player chooses',async()=>{
  const Empty=()=>null;
  const {GearAdvisorView}=await load('components/character-builder/gear-advisor.jsx',{
    '../account-settings-context':{useAccountSettings:()=>null},'../shell-context':{useShell:()=>({profile:'vanilla'})},
    '../use-game-data':{},'./gear-sources':{GearSourcesView:Empty},'./best-in-slot-view':{BestInSlotView:Empty}
  });
  const props={build:{maj:['Spear']},result:{status:'idle'},bisResult:{status:'idle'}};
  const selected=()=>document.querySelector('[aria-label="Weapon setup"] [aria-pressed="true"]').textContent;
  await mount(GearAdvisorView,async root=>{
    assert.equal(selected(),'Two-handed');
    await React.act(async()=>root.render(React.createElement(GearAdvisorView,{...props,build:{maj:['Long Blade']}})));
    assert.equal(selected(),'One-handed + shield');
    await React.act(async()=>document.querySelector('[aria-label="Weapon setup"] button:last-child').click());
    await React.act(async()=>root.render(React.createElement(GearAdvisorView,{...props,build:{maj:['Short Blade'],name:'Edited'}})));
    assert.equal(selected(),'Two-handed','An explicit choice survives later build changes');
    await React.act(async()=>document.querySelector('[aria-label="Weapon setup"] button:first-child').click());
    await React.act(async()=>root.render(React.createElement(GearAdvisorView,props)));
    assert.equal(selected(),'One-handed + shield','The player can override a Spear default');
  },props);
});
