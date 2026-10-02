const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderToStaticMarkup}=require('react-dom/server');
const {React,load,mount}=require('./helpers/launch-render.cjs');

test('Beginner clarity: race mechanics use the selected sex and precede lore without changing catalog facts',async()=>{
  const {choiceHelp}=await import('../lib/choice-help.mjs');
  const race=Object.freeze({M:Object.freeze({Strength:40}),F:Object.freeze({Strength:30}),skills:Object.freeze({Alchemy:10,Sneak:0}),abilities:'Ancestor Guardian',tip:'Lore about this race.'});
  for(const [gender,n] of [['Male',40],['Female',30]]){
    const text=choiceHelp('race',race,gender);
    assert.match(text,new RegExp(`Strength ${n}`));assert.match(text,/Alchemy \+10/);assert.doesNotMatch(text,/Sneak \+0/);
    assert.ok(text.indexOf('Skill bonuses:')<text.indexOf('Lore:'));assert.match(text,/Ancestor Guardian/);
  }
  assert.equal(race.F.Strength,30);
});
test('Beginner clarity: birthsign help retains numeric bonuses, powers and no-bonus signs',async()=>{
  const {choiceHelp}=await import('../lib/choice-help.mjs');
  const text=choiceHelp('sign',{attrs:{Endurance:25},mag:0.5,abil:'Wombburn',tip:'Birthsign lore.'});
  assert.match(text,/Endurance \+25/);assert.match(text,/50% of Intelligence/);assert.ok(text.indexOf('Abilities')<text.indexOf('Lore:'));
  assert.match(choiceHelp('sign',{attrs:{},mag:0,abil:'Beggar’s Nose'}),/Beggar’s Nose/);
  assert.doesNotMatch(choiceHelp('sign',{attrs:{},mag:0}),/Extra Magicka/);
});
test('Beginner clarity: missing and nonnumeric facts get a usable explanation without invented numbers',async()=>{
  const {choiceHelp}=await import('../lib/choice-help.mjs');
  for(const record of [undefined,null,{}, {M:{Strength:NaN},skills:{Alchemy:'10'},mag:Infinity}]){
    for(const kind of ['race','sign']){const text=choiceHelp(kind,record);assert.match(text,/See the Sheet/);assert.doesNotMatch(text,/NaN|Infinity|undefined|Alchemy \+10/);}
  }
});
test('Beginner clarity: game-entry checklist carries the actual custom build and handles presets and missing choices',async()=>{
  const {default:Checklist}=await load('components/character-builder/game-entry-checklist.jsx');
  const build=Object.freeze({race:'Breton',gender:'Female',className:'Custom',spec:'Magic',fav1:'Intelligence',fav2:'Endurance',maj:Object.freeze(['Alchemy','Restoration']),min:Object.freeze(['Sneak']),sign:'The Tower'});
  const html=renderToStaticMarkup(React.createElement(Checklist,{build}));
  for(const text of ['Female','Breton','Magic','Intelligence','Endurance','Alchemy, Restoration','Minor skills: Sneak','The Tower','does not edit your game'])assert.ok(html.includes(text),text);
  assert.match(renderToStaticMarkup(React.createElement(Checklist,{build:{className:'Mage'}})),/Select the Mage preset class/);
  assert.match(renderToStaticMarkup(React.createElement(Checklist,{build:{maj:null,min:42}})),/choose five different skills/);
});
test('Beginner clarity: unsupported-save manual route invokes only the requested Builder navigation',async()=>{
  const {default:Notice}=await load('components/compatibility-notice.jsx');let visits=0;
  await mount(Notice,async()=>{
    assert.match(document.body.textContent,/\.ess.*not supported/);assert.match(document.body.textContent,/manually/);
    await React.act(async()=>document.querySelector('button').click());assert.equal(visits,1);
  },{onConfigure:()=>visits++});
});
test('Beginner clarity: save differences distinguish site fallbacks from damage and preserve the imported record',async()=>{
  let activeSave=null;
  const {default:Notice}=await load('components/character-vault/save-import-notice.jsx',{'../character-context':{useActiveCharacter:()=>({activeSave,clearSave(){}})}});
  assert.equal(renderToStaticMarkup(React.createElement(Notice)), '');
  activeSave=Object.freeze({save:Object.freeze({identity:Object.freeze({name:'QA Imported'})}),profile:'vanilla',unresolved:Object.freeze([{field:'race',value:'Extra race',why:'not in this world',kept:'Breton'}]),rules:Object.freeze({differences:Object.freeze([{what:'Health',save:70,rules:65}])})});
  const text=renderToStaticMarkup(React.createElement(Notice));
  assert.match(text,/not damage to your save/);assert.match(text,/original file is unchanged/);assert.match(text,/kept Breton/);
  assert.equal(activeSave.save.identity.name,'QA Imported');
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Notice,{compact:true})),/save-difference-help/);
});
