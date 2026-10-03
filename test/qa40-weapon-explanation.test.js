const {test}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom');
const {createRoot}=require('react-dom/client');
const Module=require('node:module');
const path=require('node:path');
const fixture=require('./helpers/qa-staged-data.cjs');
const math=import('../lib/best-in-slot.mjs');
const model={weapons:{major:8,minor:5,misc:1,damageCap:60},derived:{'Fortify Attribute':{favoured:8,floor:2,luck:3,cap:25}},effects:{'Fortify Attack':{tier:'strong',cap:30}},tiers:{strong:6}};
const build={race:'Nord',maj:['Long Blade'],min:['Axe'],fav1:'Strength',fav2:'Endurance'};
const sword={key:'sword',name:'Class sword',slot:'weapon',type:'LB1H',weaponSkill:'long_blade',damage:60,beastWearable:true,source:{kind:'placed',easiestLevel:0},effects:[]};
const hammer={...sword,key:'hammer',name:'Bonus hammer',type:'BL1H',weaponSkill:'blunt_weapon',damage:70,effects:[{name:'Fortify Attribute',attribute:'strength',magnitude:20},{name:'Fortify Attribute',attribute:'endurance',magnitude:20},{name:'Fortify Attribute',attribute:'luck',magnitude:20},{name:'Fortify Attack',magnitude:30}]};
const data={catalogs:{BestInSlot:[]},metadata:{BestInSlot:{model,items:{sword,hammer}}}};
const compiled=require('esbuild').buildSync({entryPoints:[path.resolve('components/character-builder/best-in-slot-view.jsx')],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const component=new Module(path.resolve('test/qa40-view.cjs'),module);component.paths=module.paths;component._compile(compiled.outputFiles[0].text,component.id);
const View=component.exports.BestInSlotView;

for(const [skill,tier,points] of [['long_blade','Major',8],['axe','Minor',5],['blunt_weapon','Miscellaneous',1]])test(`QA-40: ${tier} weapon damage follows the existing tier weight and cap`,async()=>{
  const {weaponScoreDetails}=await math;
  assert.deepEqual(weaponScoreDetails({...sword,weaponSkill:skill,damage:70},build,model,points+2),{skill:skill.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),tier,damageScore:points,bonusScore:2});
});
test('QA-40: bonuses can win without disguising a Miscellaneous weapon as a class skill',async()=>{
  const {scoreItem,deriveBuildTraits,resolveBestInSlotPicks,weaponScoreDetails}=await math;
  const score=scoreItem(hammer,deriveBuildTraits(build),model);
  assert.equal(score.score,22.2);
  assert.deepEqual(weaponScoreDetails(hammer,build,model,score.score),{skill:'Blunt Weapon',tier:'Miscellaneous',damageScore:1,bonusScore:21.2});
  const picks=resolveBestInSlotPicks(data,build,{weaponSetup:'one-handed'}).groups[0].rows[0].picks;
  assert.deepEqual(picks.map(p=>p.item.key),['hammer','sword'],'Existing score order is retained');
});
test('QA-40: zero and fractional damage have finite, additive explanations',async()=>{
  const {weaponScoreDetails}=await math;
  assert.equal(weaponScoreDetails({...sword,damage:0},build,model,2).damageScore,0);
  const detail=weaponScoreDetails({...sword,damage:17},build,model,4.67);
  assert.equal(detail.damageScore,2.27);assert.equal(detail.bonusScore,2.4);
  assert.equal(Math.round((detail.damageScore+detail.bonusScore)*100)/100,4.67);
});
test('QA-40: missing model, invalid score/damage, unknown skill and incompatible legacy score do not invent a breakdown',async()=>{
  const {weaponScoreDetails}=await math;
  for(const args of [[sword,build,null,8],[null,build,model,8],[sword,build,model,NaN],[{...sword,damage:Infinity},build,model,8],[{...sword,damage:null},build,model,8],[{...sword,weaponSkill:'unknown'},build,model,8],[sword,build,model,1]])assert.equal(weaponScoreDetails(...args),null);
});
test('QA-40: the visible primary row explains the off-skill score and avoids a DPS claim',()=>{
  const html=renderToStaticMarkup(React.createElement(View,{featureData:data,build,weaponSetup:'one-handed'}));
  assert.match(html,/Blunt Weapon — Miscellaneous skill\. Damage score 1; bonus score 21\.2/);
  assert.match(html,/not a damage-per-second estimate/);assert.match(html,/Strong bonuses can outweigh/);
});
test('QA-40: expanded runner-ups show their own skill fit and score rather than the winner’s',async()=>{
  const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const root=createRoot(document.getElementById('root'));
  try{
    await React.act(async()=>root.render(React.createElement(View,{featureData:data,build,weaponSetup:'one-handed'})));
    await React.act(async()=>document.querySelector('button').click());
    assert.match(document.querySelector('tbody').textContent,/Long Blade — Major skill\. Damage score 8; bonus score 0/);
  }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
for(const profile of ['vanilla','tr','tr_arce'])test(`QA-40: staged ${profile} reproduces the edited Nord’s existing winner and explains it`,fixture.staged(),async()=>{
  const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {defaultWeaponSetup}=await import('../lib/gear-rows.mjs');
  const original=premadeToBuild(BUILDS.find(b=>b.name==='Nord Warrior Spearman'));
  const edited={...original,maj:original.maj.map((s,i)=>i===0?'Long Blade':s)};
  assert.equal(defaultWeaponSetup(original),'two-handed');assert.equal(defaultWeaponSetup(edited),'one-handed');
  const {resolveBestInSlotPicks,weaponScoreDetails}=await math;const data=await (await fixture.loader()).loadFeature(profile,'bestInSlot');
  const pick=resolveBestInSlotPicks(data,edited,{weaponSetup:'one-handed'}).groups.find(g=>g.label==='Optimized Weapons').rows[0].picks[0];
  assert.equal(pick.item.name,profile==='vanilla'?'Sunder':'Neb-Crescen');
  assert.equal(pick.pick.score,profile==='vanilla'?22.2:23.73);
  const detail=weaponScoreDetails(pick.item,edited,data.metadata.BestInSlot.model,pick.pick.score);
  assert.equal(detail.tier,profile==='vanilla'?'Miscellaneous':'Major');
  assert.equal(detail.damageScore,profile==='vanilla'?1:7.73);assert.equal(detail.bonusScore,profile==='vanilla'?21.2:16);
});
