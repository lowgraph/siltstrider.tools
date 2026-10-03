const {test}=require('node:test');
const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');

for(const [value,rating] of [['82',273.333333],['50.1',167],['0',null]])test(`QA-52: Inspector retains the calculated Armor Rating ${value}`,async()=>{
  const Stats=(await load('components/equipment-studio/equipment-stats-summary.jsx')).default;
  const loadout=rating===null?{}:{Cuirass:{name:'QA armor',type:'cuirass',armorClass:'heavy',armorRating:rating,weight:20}};
  const skills={HeavyArmor:30,Unarmored:0},before=structuredClone({loadout,skills});
  await mount(Stats,async()=>{
    assert.equal(document.querySelector('.equipment-stats-summary .text-3xl').textContent.trim(),value);
    assert.match(document.querySelector('.equipment-stats-summary').textContent,/Cuirass 30% · Shield 10%/);
    assert.deepEqual({loadout,skills},before);
  },{loadout,skills,attributes:{Strength:40}});
});
