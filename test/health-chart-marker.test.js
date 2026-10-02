const {test}=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom'),{HealthGrowthChart}=require('./helpers/qa-render.cjs');
const character={level:1,health:35,attributes:{Strength:40,Intelligence:40,Willpower:40,Agility:40,Speed:50,Endurance:30,Personality:40,Luck:40},skills:{},maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
function marker(targetLevel,base=character){const dom=new JSDOM(renderToStaticMarkup(React.createElement(HealthGrowthChart,{character:base,targetLevel,catalogs:{}})));try{return [...dom.window.document.querySelectorAll('svg text')].map(t=>t.textContent).filter(t=>t.startsWith('Endurance 100 at'));}finally{dom.window.close();}}
test('QA-28 shows the Endurance milestone at the exact forecast endpoint',()=>assert.deepEqual(marker(15),['Endurance 100 at Lv 15']));
test('QA-28 does not invent a milestone before Endurance reaches 100',()=>assert.deepEqual(marker(14),[]));
test('QA-28 retains the same milestone when the target extends beyond it',()=>assert.deepEqual(marker(16),['Endurance 100 at Lv 15']));
test('QA-28 already-maxed Endurance and a one-level forecast have no new milestone',()=>{assert.deepEqual(marker(15,{...character,attributes:{...character.attributes,Endurance:100}}),[]);assert.deepEqual(marker(1),[]);});
