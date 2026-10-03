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
const primary=result=>result.groups.find(g=>g.label==='Optimized Weapons').rows[0].picks;
const weapon={key:'published',name:'Published sword',type:'LB1H',chop:{max:50},slash:{max:45},thrust:{max:25}};
const publishedPick={key:weapon.key,name:weapon.name,cellKey:'interior:qa shop',place:'QA Shop',acquisition:'purchase',seller:'QA Merchant',enchanted:{castType:'when_strikes',value:6,effects:[]}};
const rows=[{category:'weapon',objective:'power',skill:'long_blade',hands:1,primary:publishedPick}];
const onlyHammer={...data,catalogs:{BestInSlot:[],Weapons:[weapon]},metadata:{BestInSlot:{model,items:{hammer}}}};

for(const [skill,tier,damage,bonus] of [['long_blade','Major',8,2],['axe','Minor',5,1.25],['blunt_weapon','Miscellaneous',1,0.25]])test(`QA-40: ${tier} skill weights damage and passive weapon bonuses`,async()=>{
  const {weaponScoreDetails,scoreItem,deriveBuildTraits}=await math;
  const item={...sword,weaponSkill:skill,damage:70,effects:[{name:'Fortify Attribute',attribute:'agility',magnitude:25}]};
  const scored=scoreItem(item,deriveBuildTraits(build),model);
  assert.equal(scored.score,damage+bonus);
  assert.deepEqual(weaponScoreDetails(item,build,model,scored.score),{skill:skill.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),tier,damageScore:damage,bonusScore:bonus});
});
test('QA-40: stacking unrelated bonuses cannot displace a competent class weapon',async()=>{
  const {scoreItem,deriveBuildTraits,resolveBestInSlotPicks,weaponScoreDetails}=await math;
  assert.equal(scoreItem(hammer,deriveBuildTraits(build),model).score,2);
  assert.deepEqual(primary(resolveBestInSlotPicks(data,build,{weaponSetup:'one-handed'})).map(p=>p.item.key),['sword','hammer']);
  assert.equal(weaponScoreDetails(hammer,build,model,2).bonusScore,1);
});
test('QA-40: a Major artifact benefits from bonuses; a strong off-skill weapon can beat a weak Major',async()=>{
  const {scoreItem,deriveBuildTraits,resolveBestInSlotPicks}=await math;
  assert.equal(scoreItem({...hammer,weaponSkill:'long_blade'},deriveBuildTraits(build),model).score,16);
  const d={...data,metadata:{BestInSlot:{model,items:{sword:{...sword,damage:3},hammer}}}};
  assert.equal(primary(resolveBestInSlotPicks(d,build))[0].item.key,'hammer');
});
test('QA-40: zero, negative, invalid and unknown-skill weapons cannot win via buffs',async()=>{
  const {scoreItem,deriveBuildTraits}=await math;
  for(const damage of [0,-3,NaN,Infinity,null,undefined])assert.equal(scoreItem({...hammer,damage},deriveBuildTraits(build),model),null);
  assert.equal(scoreItem({...hammer,weaponSkill:'unknown'},deriveBuildTraits(build),model),null);
});
test('QA-40: finite fractional scores add up without rounding the underlying contributions',async()=>{
  const {weaponScoreDetails,scoreItem,deriveBuildTraits}=await math;
  const item={...hammer,weaponSkill:'long_blade',damage:17};const scored=scoreItem(item,deriveBuildTraits(build),model);
  const detail=weaponScoreDetails(item,build,model,scored.score);
  assert.equal(detail.damageScore,2.27);assert.equal(detail.bonusScore,2.26);assert.equal(scored.score,4.53);
  assert.equal(Math.round((detail.damageScore+detail.bonusScore)*100)/100,scored.score);
});
test('QA-40: missing and malformed metadata do not invent score explanations',async()=>{
  const {weaponScoreDetails}=await math;
  for(const args of [[sword,build,null,8],[null,build,model,8],[sword,build,model,NaN],[{...sword,damage:Infinity},build,model,8],[{...sword,damage:null},build,model,8],[{...sword,weaponSkill:'unknown'},build,model,8],[sword,build,model,1]])assert.equal(weaponScoreDetails(...args),null);
});
test('QA-40: only published acquisition candidates supplement the CE pool without mutation',async()=>{
  const {resolveBestInSlotPicks}=await math;const before=JSON.stringify({data:onlyHammer,rows});
  const picks=primary(resolveBestInSlotPicks(onlyHammer,build,{weaponSetup:'one-handed',gearRows:rows}));
  assert.equal(picks[0].item.name,weapon.name);assert.equal(picks[0].pick.score,6.67);assert.deepEqual(picks[0].item.effects,[]);
  assert.equal(JSON.stringify({data:onlyHammer,rows}),before);
  for(const edit of [{key:'missing'},{cellKey:null},{evidenceTruncated:true},{summons:[{name:'Bound Sword'}]},{enchanted:{castType:'constant_effect'}}]){
    assert.equal(primary(resolveBestInSlotPicks(onlyHammer,build,{gearRows:rows.map(r=>({...r,primary:{...r.primary,...edit}}))}))[0].item.key,'hammer');
  }
});
test('QA-40: malformed damage, wrong objective and wrong-handed candidates are rejected',async()=>{
  const {resolveBestInSlotPicks}=await math;
  for(const damage of [undefined,NaN,'50']){
    const d={...onlyHammer,catalogs:{...onlyHammer.catalogs,Weapons:[{...weapon,chop:{max:damage}}]}};
    assert.equal(primary(resolveBestInSlotPicks(d,build,{gearRows:rows}))[0].item.key,'hammer');
  }
  assert.equal(primary(resolveBestInSlotPicks(onlyHammer,build,{gearRows:rows.map(r=>({...r,objective:'enchantment'}))}))[0].item.key,'hammer');
  const two={...onlyHammer,catalogs:{...onlyHammer.catalogs,Weapons:[{...weapon,type:'LB2H'}]}};
  assert.equal(primary(resolveBestInSlotPicks(two,build,{weaponSetup:'one-handed',gearRows:rows}))[0].item.key,'hammer');
});
test('QA-40: unchanged premades rescore weapons but keep published non-weapon slots',async()=>{
  const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {resolveBestInSlotPicks}=await math;
  const premade=premadeToBuild(BUILDS.find(b=>b.name==='Nord Warrior Spearman'));
  const d={...onlyHammer,catalogs:{...onlyHammer.catalogs,BestInSlot:[{build:premade.name,slots:{weapon:[{item:'hammer',score:999}],robe:[{item:'robe',score:99}]}}]}};
  const result=resolveBestInSlotPicks(d,premade,{gearRows:rows});assert.notEqual(primary(result)[0].pick.score,999);
  assert.equal(result.groups.find(g=>g.label==='Constant-Effect Clothing & Jewelry').rows[0].picks[0].pick.score,99);
});
test('QA-40: visible recommendations use the new ranking and show the published source',()=>{
  const html=renderToStaticMarkup(React.createElement(View,{featureData:onlyHammer,build,gearRows:rows,weaponSetup:'one-handed'}));
  assert.match(html,/Long Blade — Major skill\. Damage score 6\.67; bonus score 0/);assert.match(html,/QA Shop · sold by QA Merchant/);
  assert.doesNotMatch(html,/Strong bonuses can outweigh|Check the skill fit below|damage-per-second/);
});
test('QA-40: runner-ups explain their own bounded scores',async()=>{
  const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const root=createRoot(document.getElementById('root'));
  try{
    await React.act(async()=>root.render(React.createElement(View,{featureData:data,build,weaponSetup:'one-handed'})));
    await React.act(async()=>document.querySelector('button').click());
    assert.match(document.querySelector('tbody').textContent,/Blunt Weapon — Miscellaneous skill\. Damage score 1; bonus score 1/);
  }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
for(const profile of ['vanilla','tr','tr_arce'])test(`QA-40: staged ${profile} selects a class weapon and equips the displayed winner`,fixture.staged(),async()=>{
  const {BUILDS,premadeToBuild}=await import('../lib/premade-data.mjs');const {defaultWeaponSetup}=await import('../lib/gear-rows.mjs');
  const original=premadeToBuild(BUILDS.find(b=>b.name==='Nord Warrior Spearman'));const edited={...original,maj:original.maj.map((s,i)=>i===0?'Long Blade':s)};
  assert.equal(defaultWeaponSetup(original),'two-handed');assert.equal(defaultWeaponSetup(edited),'one-handed');
  const {resolveBestInSlotPicks,weaponScoreDetails}=await math;const loader=await fixture.loader();const data=await loader.loadFeature(profile,'bestInSlot');const gear=await loader.loadFeature(profile,'gear');
  const resolved=resolveBestInSlotPicks(data,edited,{weaponSetup:'one-handed',gearRows:gear.catalogs.GearRows});const pick=primary(resolved)[0];
  assert.equal(pick.item.name,profile==='vanilla'?'Goldbrand':'Neb-Crescen');assert.equal(pick.pick.score,profile==='vanilla'?6.67:15.47);
  assert.equal(weaponScoreDetails(pick.item,edited,data.metadata.BestInSlot.model,pick.pick.score).tier,'Major');
  const {recommendedLoadouts}=await import('../lib/recommended-loadout.mjs');const loadout=recommendedLoadouts(resolved.groups,data.catalogs,edited,{late:true});
  assert.equal(loadout[0].items.CarriedRight.key,pick.item.key);
});
