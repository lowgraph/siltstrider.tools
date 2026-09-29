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
const PROTO_NAMES=['constructor','__proto__','toString','hasOwnProperty','valueOf'];
function fullFixture(){const f=fixture();f.catalogs.Skills=['block','armorer','medium_armor','heavy_armor','blunt_weapon','long_blade','axe','spear','athletics','enchant','destruction','alteration','illusion','conjuration','mysticism','restoration','alchemy','unarmored','security','sneak','acrobatics','light_armor','short_blade','marksman','mercantile','speechcraft','hand_to_hand'].map((skill,id)=>({id,skill,specialization:id<9?'combat':id<18?'magic':'stealth'}));
 f.catalogs.Attributes=['strength','intelligence','willpower','agility','speed','endurance','personality','luck'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1)}));
 f.catalogs.Races[0].attributes=Object.fromEntries(f.catalogs.Attributes.map(a=>[a.id,{male:40,female:40}]));return f;}
test('a name that is a JavaScript built-in finds nothing in any character table',async()=>{
 const {adaptCharacterCatalogs}=await mod;const a=adaptCharacterCatalogs(fullFixture(),spells);
 for(const table of ['races','classes','signs','raceSpells','signSpells','raceMagic','specSkills'])for(const name of PROTO_NAMES)
  assert.equal(a[table][name],undefined,`${table}[${name}]`);
 assert.deepEqual(Object.keys(a.races),['Khajiit'],'real names still list');assert.deepEqual(Object.keys(a.specSkills),['Combat','Magic','Stealth']);
 assert.equal(JSON.parse(JSON.stringify(a.races)).Khajiit.M.Strength,40,'the tables still serialise');
});
test('a shared build naming a built-in computes no sheet and no spells instead of throwing',async()=>{
 const {adaptCharacterCatalogs}=await mod;const {computeSheet,startingSpells}=await import('../lib/character-math.mjs');
 const a=adaptCharacterCatalogs(fullFixture(),spells);
 const base={race:'Khajiit',sign:'The Lady',gender:'Male',className:'Warrior',spec:'Combat',fav1:'Strength',fav2:'Endurance',maj:['Block','Armorer','Medium Armor','Heavy Armor','Blunt Weapon'],min:['Long Blade','Axe','Spear','Athletics','Enchant']};
 assert.ok(computeSheet(base,a),'the untouched build still computes');
 for(const name of PROTO_NAMES)for(const field of ['race','sign']){
  const b={...base,[field]:name};
  assert.equal(computeSheet(b,a),null,`${field}=${name}`);
  const spellsFor=startingSpells(b,computeSheet(b,a),a);assert.deepEqual([...spellsFor.race,...spellsFor.sign],[],`spells for ${field}=${name}`);
 }
});
test('the crafted share link that crashed the builder now decodes to a build the maths can refuse',async()=>{
 const {adaptCharacterCatalogs}=await mod;const {decodeShareUrl}=await import('../lib/permalink-codec.mjs');const {sanitizeBuild}=await import('../lib/character-vault.mjs');
 const {computeSheet,startingSpells}=await import('../lib/character-math.mjs');const a=adaptCharacterCatalogs(fullFixture(),spells);
 for(const build of [{race:'constructor',sign:'The Lady',gender:'Male'},{race:'Khajiit',sign:'__proto__',className:'toString',gender:'Female'}]){
  const link='/builder?world=tr&arce=0&build='+Buffer.from(JSON.stringify(build)).toString('base64url');
  const decoded=sanitizeBuild(decodeShareUrl(link).build);assert.ok(decoded,'the link still decodes');
  // The builder fills in what the link leaves out, as a default Warrior would.
  const clean={spec:'Combat',fav1:'Strength',fav2:'Endurance',maj:['Block','Armorer','Medium Armor','Heavy Armor','Blunt Weapon'],min:['Long Blade','Axe','Spear','Athletics','Enchant'],...decoded};
  assert.doesNotThrow(()=>{const sheet=computeSheet(clean,a);startingSpells(clean,sheet,a);});
  assert.equal(computeSheet(clean,a),null);
 }
});
