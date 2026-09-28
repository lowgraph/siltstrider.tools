const {test}=require('node:test');const assert=require('node:assert/strict');
const mod=import('../lib/character-catalogs.mjs');
function fixture(){return {profile:'vanilla',catalogs:{
 Attributes:[{id:'strength',name:'Strength'}],Skills:[{id:0,skill:'block',specialization:'combat'}],
 Races:[{key:'khajiit',id:'khajiit',name:'Khajiit',playable:true,attributes:{strength:{male:40,female:35}},skillBonuses:[{skill:'block',bonus:5}],spellIds:[]}],
 Classes:[{key:'warrior',name:'Warrior',playable:true,specialization:'combat',favoredAttributes:['strength'],majorSkills:['block'],minorSkills:[]}],
 Birthsigns:[{key:'lady',name:'The Lady',spellIds:['lady_ability']}]}};}
const spells=[{key:'lady_ability',name:'Lady',type:'ability',effects:[{effectId:79,attribute:'strength',magnitude:{min:10,max:10}}]}];
test('canonical facts and stable IDs drive the native character tables',async()=>{
 const {adaptCharacterCatalogs}=await mod;const f=fixture(),a=adaptCharacterCatalogs(f,spells);
 assert.equal(a.races.Khajiit.M.Strength,40);assert.equal(a.races.Khajiit.F.Strength,35);
 assert.equal(a.races.Khajiit.skills.Block,5);assert.equal(a.signs['The Lady'].attrs.Strength,10);
 assert.equal(a.labelFor('races','khajiit'),'Khajiit');assert.throws(()=>a.labelFor('races','missing'));
 f.catalogs.Races[0].attributes.strength.male=77;assert.equal(adaptCharacterCatalogs(f,spells).races.Khajiit.M.Strength,77);
});
test('Khajiit variants remain distinct and NPC classes are excluded',async()=>{
 const {adaptCharacterCatalogs}=await mod;const f=fixture();f.catalogs.Races.push({...f.catalogs.Races[0],key:'t_els_suthay',id:'t_els_suthay'});f.catalogs.Classes.push({...f.catalogs.Classes[0],key:'npc',name:'NPC',playable:false});
 const a=adaptCharacterCatalogs(f,spells);assert.ok(a.races['Khajiit (Suthay)']);assert.ok(a.races.Khajiit);assert.equal(a.classes.NPC,undefined);
});
test('invalid spell references, duplicate labels and unknown attributes fail explicitly',async()=>{
 const {adaptCharacterCatalogs}=await mod;
 for(const change of [f=>f.catalogs.Races[0].spellIds=['missing'],f=>f.catalogs.Races.push(f.catalogs.Races[0]),f=>f.catalogs.Races[0].attributes.unknown={male:1,female:1}]){
  const f=fixture();change(f);assert.throws(()=>adaptCharacterCatalogs(f,spells));
 }
});
test('catalog service deduplicates downloads and preserves active data on failure',async()=>{
 const {createCharacterCatalogService}=await mod;let calls=0,fail=false;
 const service=createCharacterCatalogService({async loadFeature(profile){calls++;if(fail)throw Error('offline');return {...fixture(),profile}},async loadCatalog(){return spells}});
 await Promise.all([service.prepare('vanilla'),service.prepare('vanilla')]);service.activate('vanilla');assert.equal(calls,1);
 fail=true;await assert.rejects(service.prepare('tr'),/offline/);assert.equal(service.active.profile,'vanilla');
 fail=false;await service.prepare('tr');assert.equal(service.active.profile,'vanilla');service.activate('tr');assert.equal(service.active.profile,'tr');
});
