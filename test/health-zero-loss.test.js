const {test}=require('node:test');const assert=require('node:assert/strict');
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const {HealthGrowthChart}=require('./helpers/qa-render.cjs');
const character={level:1,health:50,attributes:{Strength:40,Intelligence:40,Willpower:40,Agility:40,Speed:40,Endurance:100,Personality:40,Luck:40},skills:{},maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
function chart(c,level){return renderToStaticMarkup(React.createElement(HealthGrowthChart,{character:c,targetLevel:level,catalogs:{}}));}
test('QA-37: capped Endurance prints 0 HP lost at level 55, never -0',()=>{
  assert.match(chart(character,55),/Permanent HP lost if Endurance is delayed:.*?>0 HP</);
  assert.doesNotMatch(chart(character,55),/>-0 HP</);
});
test('QA-37: a short capped-Endurance forecast also prints unsigned zero',()=>{
  assert.match(chart(character,2),/Permanent HP lost if Endurance is delayed:.*?>0 HP</);
});
test('QA-37: nonzero losses retain their minus sign and the curve stays precise',async()=>{
  const {calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const c={...character,health:57.5,attributes:{...character.attributes,Endurance:35}},before=calculateHealthGrowthCurve(c,55,{});
  assert.match(chart(c,55),/Permanent HP lost if Endurance is delayed:.*?>-\d+(?:\.\d)? HP</);
  assert.deepEqual(calculateHealthGrowthCurve(c,55,{}),before);
});
