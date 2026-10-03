const {test}=require('node:test');const assert=require('node:assert/strict');
const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom');
const {ProgressionSheet,LevelItineraryCard}=require('./helpers/qa-render.cjs');
const character={level:1,health:50,attributes:{Strength:40,Intelligence:40,Willpower:40,Agility:40,Speed:40,Endurance:35,Personality:40,Luck:40},skills:{},maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
function label(Component,props,selector){const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component,props)));try{return dom.window.document.querySelector(selector).textContent.trim();}finally{dom.window.close();}}
for(const [initial,health,expected] of [[50,181.99999999999997,'+132'],[50,53.5,'+3.5'],[0,3.5,'+3.5'],[50,50,'+0'],[50,49.5,'+0']])test(`QA-41: total Health gain ${health} - ${initial} displays ${expected}`,()=>{
  const props={character,initialSheet:{...character,health:initial},currentState:{...character,level:2,health},mode:'stats_only',catalogs:{},targetLevel:2};const before=JSON.stringify(props);
  assert.equal(label(ProgressionSheet,props,'.vitals-section > div span'),`${expected} Total HP Gained`);
  assert.equal(JSON.stringify(props),before,'Rendering does not round or mutate character Health');
});
test('QA-41: a missing starting sheet does not invent accumulated Health',()=>{
  assert.equal(label(ProgressionSheet,{character,currentState:character,mode:'stats_only',catalogs:{},targetLevel:2},'.vitals-section > div span'),'+0 Total HP Gained');
});
for(const [healthGain,expected] of [[0.1+0.2,'+0.3'],[3.5,'+3.5'],[4.00000000000001,'+4'],[0,'+0'],[-0,'+0'],[Infinity,'—'],[NaN,'—']])test(`QA-41: itinerary Health gain ${healthGain} displays ${expected}`,()=>{
  const step={level:1,nextLevel:2,healthGain};const before=step.healthGain;
  assert.equal(label(LevelItineraryCard,{step,isStatsOnly:true},'.level-itinerary-card > div > div > span:nth-child(2)'),`${expected} HP Gain`);
  assert.equal(Object.is(step.healthGain,before),true,'Itinerary retains its unrounded gain');
});
test('QA-41: the completed itinerary keeps its existing empty state',()=>{
  assert.match(renderToStaticMarkup(React.createElement(LevelItineraryCard,{})),/No step itinerary available/);
});
