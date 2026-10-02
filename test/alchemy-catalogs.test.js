const {test}=require('node:test');
const assert=require('node:assert/strict');
const adapter=import('../lib/alchemy-catalogs.mjs');
test('apparatus hides every Secretmaster type without changing catalog provenance',async()=>{
 const {adaptAlchemy}=await adapter,f=fixture();
 for(const type of ['mortar_and_pestle','alembic','calcinator','retort']) f.catalogs.Apparatus.push({key:'apparatus_sm_'+type+'_01',name:"SecretMaster's "+type,type,quality:2});
 const out=adaptAlchemy(f);
 assert.equal(Object.values(out.apparatus).flat().length,1);
 assert.equal(f.catalogs.Apparatus.length,5);
});
test('apparatus sorts by effectiveness descending, with stable name ties',async()=>{
 const {adaptAlchemy}=await adapter,f=fixture();
 f.catalogs.Apparatus=[['z','Z Apprentice',0.5],['a','A Journeyman',1],['c','C Grandmaster',1.5],['b','B Master',1.2],['d','D Grandmaster',1.5]]
  .map(([key,name,quality])=>({key,name,quality,type:'mortar_and_pestle'}));
 assert.deepEqual(adaptAlchemy(f).apparatus.mortar.map(x=>x.id),['c','d','b','a','z']);
});
test('Secretmaster name variants are hidden even with a nonstandard catalog key',async()=>{
 const {adaptAlchemy}=await adapter,f=fixture();
 f.catalogs.Apparatus.push({key:'renamed',name:"secretmaster's Mortar",type:'mortar_and_pestle',quality:2});
 assert.deepEqual(adaptAlchemy(f).apparatus.mortar.map(x=>x.id),['apparatus_j_mortar_01']);
 f.catalogs.Apparatus=[];
 assert.deepEqual(adaptAlchemy(f).apparatus.mortar,[]);
});
for (const [name, change] of [
 ['missing rules', f=>delete f.catalogs.EffectRules],
 ['missing harmful flag', f=>delete f.catalogs.EffectRules[0].harmful],
 ['non-boolean magnitude flag', f=>f.catalogs.EffectRules[0].noMagnitude=0],
]) test(`canonical rules fail closed with ${name}`, async()=>{
 const {adaptAlchemy}=await adapter, f=fixture();change(f);
 assert.equal(adaptAlchemy(f).effects['1'].supported,false);
});
function fixture(){
 return {profile:'vanilla',snapshotId:'s',catalogs:{
  Attributes:[{id:'strength',name:'Strength'},{id:'intelligence',name:'Intelligence'}],Skills:[{skill:'alchemy',name:'Alchemy'}],
  EffectRules:[{key:'1',noMagnitude:false,noDuration:false,harmful:false},{key:'2',noMagnitude:false,noDuration:false,harmful:false}],
  MagicEffects:[{key:'1',name:'Restore Health',baseCost:2},{key:'2',name:'Fortify Attribute',baseCost:1}],
  Ingredients:[{key:'a',name:'Same',value:3,weight:.2,effects:[{slot:3,effectId:1},{slot:0,effectId:2,attribute:'strength'}]},{key:'b',name:'Same',value:4,weight:.4,effects:[{slot:0,effectId:1}]},{key:'c',name:'Third',value:1,weight:.1,effects:[{slot:0,effectId:2,attribute:'intelligence'}]}],
  Apparatus:[{key:'apparatus_j_mortar_01',name:'Mortar',type:'mortar_and_pestle',quality:1}],
  GameSettings:[['fPotionStrengthMult',.5],['iAlchemyMod',2],['fPotionT1MagMult',1.5],['fPotionT1DurMult',.5]].map(([name,value])=>({key:name.toLowerCase(),value}))
 }};
}
test('adapter preserves canonical identity, duplicate names, effect slots, targets and source values',async()=>{
 const {adaptAlchemy}=await adapter,f=fixture(),a=adaptAlchemy(f);
 assert.equal(a.ingredients[0].id,'a');assert.equal(a.ingredients[0].n,'Same (0.2 weight; Fortify Strength, Restore Health)');
 assert.equal(a.ingredients[0].effects[1],null);assert.equal(a.ingredients[0].effects[3].id,'1');
 assert.equal(a.ingredients[0].effects[0].arg,'Strength');assert.equal(a.ingredients[0].v,3);
 assert.equal(a.apparatus.mortar[0].q,1);assert.equal(a.settings.fPotionT1MagMult,1.5);
 assert.equal(a.effects['1'].b,2);assert.equal(a.ingredients[0].source,f.catalogs.Ingredients[0]);
 f.catalogs.MagicEffects[0].name='Renamed';assert.equal(adaptAlchemy(f).effects['1'].supported,true);
});
test('adapter rejects invalid targets, slots and missing formula settings',async()=>{
 const {adaptAlchemy}=await adapter;
 for(const change of [f=>f.catalogs.Ingredients[0].effects[0].slot=7,f=>f.catalogs.Ingredients[0].effects[1].attribute='unknown',f=>f.catalogs.GameSettings=[]]){
  const f=fixture();change(f);assert.throws(()=>adaptAlchemy(f));
 }
});

for (const type of ['mortar_and_pestle','alembic','calcinator','retort']) test(`QA-06 prefixed keys and spaced names: ${type}`,async()=>{
 const {adaptAlchemy}=await adapter,f=fixture();
 const blocked=[{key:'tr_m7_apparatus_sm_'+type+'_02',name:'Renamed tool'},
  {key:'renamed',name:"Secret Master's "+type}, {key:'curly',name:'Secret Master’s '+type},
  {key:'capital',name:'SECRETMASTER '+type}].map(r=>Object.freeze({...r,type,quality:2}));
 f.catalogs.Apparatus=Object.freeze([...blocked,Object.freeze({key:'normal',name:'Grandmaster tool',type,quality:1.5})]);
 const before=JSON.stringify(f.catalogs.Apparatus),out=adaptAlchemy(f);
 assert.deepEqual(Object.values(out.apparatus).flat().map(r=>r.id),['normal']);
 assert.equal(JSON.stringify(f.catalogs.Apparatus),before,'published provenance remains unchanged');
});
test('QA-06 ordinary Master tools and incidental name fragments stay available and sorted',async()=>{
 const {adaptAlchemy}=await adapter,f=fixture();
 f.catalogs.Apparatus=[{key:'mod_apparatus_master',name:'Master’s Mortar',quality:1.2},
  {key:'secretmastery',name:'Secret Mastery Mortar',quality:1.1},
  {key:'notapparatus_sm_x',name:'Journeyman Mortar',quality:1}].map(r=>({...r,type:'mortar_and_pestle'}));
 assert.deepEqual(adaptAlchemy(f).apparatus.mortar.map(r=>r.id),['mod_apparatus_master','secretmastery','notapparatus_sm_x']);
});
