const {test}=require('node:test');
const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
const priority=['Endurance','Strength','Agility','Speed','Willpower','Personality','Intelligence','Luck'];

for(const [label,index,direction] of [['first down',0,1],['middle up',4,-1],['last up',7,-1]])test(`QA-48: ${label} swaps only the neighboring attributes`,async()=>{
  const Ranker=(await load('components/level-simulator/attribute-priority-ranker.jsx')).default;
  let next;
  await mount(Ranker,async()=>{
    assert.equal(document.querySelectorAll('.priority-list span[title]').length,8);
    assert.equal(document.querySelector('.priority-list button').disabled,true);
    assert.equal([...document.querySelectorAll('.priority-list button')].at(-1).disabled,true);
    await React.act(async()=>document.querySelector(`button[aria-label="Move ${priority[index]} ${direction===1?'down':'up'}"]`).click());
    const expected=[...priority];[expected[index],expected[index+direction]]=[expected[index+direction],expected[index]];
    assert.deepEqual(next,expected);
    assert.deepEqual(priority,['Endurance','Strength','Agility','Speed','Willpower','Personality','Intelligence','Luck']);
  },{priority,archetypeId:'custom',onReorderPriority:value=>next=value,onSelectArchetype:()=>{}});
});
