/**
 * The producer/consumer contract for app bundle schema 1.0.0.
 *
 * The data pipeline and this site are built in parallel by different agents, so the
 * rule in COORDINATION.md is that additive changes need no site change and everything
 * else must fail loudly. These tests pin that rule to the loader: if a future change
 * here starts rejecting an additive bundle, it breaks a data release, and this suite
 * says so before the release is blocked rather than after.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const modulePromise=import('../lib/bundle-loader.mjs');

const ROOT='https://contract.example/';
const ID='c0ffee00';
const SNAP='snapshot0';
const identity=p=>({id:p.id,world:p.world,version:p.version,arce:p.arce});

/** A minimal conforming bundle: two base profiles plus ARCE expressed over `tr`. */
function bundle(){
 const profiles=[
  {id:'vanilla',world:'vanilla',version:'1',arce:false,base:null,files:{},inherits:[]},
  {id:'tr',world:'tamriel_rebuilt',version:'2',arce:false,base:null,files:{},inherits:[]},
  {id:'tr_arce',world:'tamriel_rebuilt',version:'2',arce:true,base:'tr',files:{},inherits:[]}];
 const manifest={schemaVersion:'1.0.0',bundleId:ID,snapshotId:SNAP,catalogs:[],profiles};
 const routes=new Map();
 const profile=id=>profiles.find(p=>p.id===id);
 const self={
  manifest,routes,profile,
  /** Register one payload and its manifest entry. `records` is the resolved count. */
  put(id,name,data,records){
   const body=JSON.stringify(data);
   profile(id).files[name]={path:id+'/'+name+'.json',bytes:Buffer.byteLength(body),
    sha256:createHash('sha256').update(body).digest('hex'),records,kind:data.kind,
    ...(data.kind==='delta'?{base:data.base,changed:data.changed.length,removed:data.removed.length}:{})};
   routes.set(ROOT+ID+'/'+id+'/'+name+'.json',body);
   return self;
  },
  /** A full catalog on both base profiles, inherited by ARCE. */
  catalog(name,{rows=[{key:'a',value:1},{key:'b',value:2}],recordField,payloadField}={}){
   if(!manifest.catalogs.includes(name))manifest.catalogs.push(name);
   const records=recordField?rows.map(r=>({...r,[recordField]:'future'})):rows;
   for(const id of ['vanilla','tr'])self.put(id,name,{schemaVersion:'1.0.0',snapshotId:SNAP,
    profile:identity(profile(id)),catalog:name,kind:'full',records,
    ...(payloadField?{[payloadField]:'future'}:{})},records.length);
   profile('tr_arce').inherits.push(name);
   return self;
  },
  /** Replace ARCE's inheritance of `name` with a real delta over `tr`. */
  delta(name,changed,removed){
   const arce=profile('tr_arce');
   arce.inherits=arce.inherits.filter(n=>n!==name);
   const base=JSON.parse(routes.get(ROOT+ID+'/tr/'+name+'.json')).records;
   const keys=new Set(base.map(r=>r.key));
   removed.forEach(k=>keys.delete(k));
   changed.forEach(r=>keys.add(r.key));
   return self.put('tr_arce',name,{schemaVersion:'1.0.0',snapshotId:SNAP,
    profile:identity(arce),catalog:name,kind:'delta',base:'tr',changed,removed},keys.size);
  },
  publish(){
   routes.set(ROOT+'current.json',JSON.stringify({bundleId:ID,snapshotId:SNAP,manifest:ID+'/manifest.json'}));
   routes.set(ROOT+ID+'/manifest.json',JSON.stringify(manifest));
   return self;
  }};
 return self.catalog('Races');
}

/** Load every catalog of every profile, as `npm run data:stage` does before publishing. */
async function loadAll(b){
 const {createBundleLoader}=await modulePromise;
 const loader=createBundleLoader({baseUrl:ROOT,crypto:webcrypto,cacheStorage:null,
  fetcher:async url=>new Response(b.routes.get(url)??'missing',{status:b.routes.has(url)?200:404})});
 const m=await loader.manifest();
 const out={};
 for(const p of m.profiles)for(const name of m.catalogs)out[p.id+'/'+name]=await loader.loadCatalog(p.id,name);
 return out;
}

test('a conforming bundle loads, and ARCE resolves through inheritance and deltas',async()=>{
 const b=bundle().catalog('Classes').delta('Classes',[{key:'b',value:99},{key:'c',value:3}],['a']).publish();
 const loaded=await loadAll(b);
 assert.deepEqual(loaded['tr/Races'].map(r=>r.key),['a','b']);
 assert.equal(loaded['tr_arce/Races'],loaded['tr/Races'],'an inherited catalog is the same object');
 assert.deepEqual(loaded['tr_arce/Classes'].map(r=>r.key),['b','c']);
 assert.equal(loaded['tr_arce/Classes'].find(r=>r.key==='b').value,99);
 assert.equal(loaded['tr/Classes'].find(r=>r.key==='b').value,2,'the base is never mutated');
});

test('ACCEPTS an unknown field on every record',async()=>{
 const b=bundle().catalog('Skills',{recordField:'claudeAdded'}).publish();
 const loaded=await loadAll(b);
 assert.equal(loaded['tr/Skills'][0].claudeAdded,'future');
});

test('ACCEPTS an unknown top-level field in a payload',async()=>{
 await loadAll(bundle().catalog('Skills',{payloadField:'claudeNote'}).publish());
});

test('ACCEPTS an unknown field in the manifest',async()=>{
 const b=bundle();
 b.manifest.claudePolicyVersion='2026.09.18';
 await loadAll(b.publish());
});

test('ACCEPTS a wholly new catalog when every profile emits or inherits it',async()=>{
 // This is the forward-compatibility guarantee the data side relies on: GearRows and
 // the rules library must ship without any change here.
 const b=bundle().catalog('GearRows',{rows:[{key:'armor/helmet/light',strength:10}]}).publish();
 const loaded=await loadAll(b);
 assert.equal(loaded['vanilla/GearRows'][0].strength,10);
 assert.equal(loaded['tr_arce/GearRows'],loaded['tr/GearRows']);
});

test('REJECTS a schema version bump, which must be agreed on both sides',async()=>{
 const b=bundle();
 b.manifest.schemaVersion='1.1.0';
 await assert.rejects(loadAll(b.publish()),/version\/snapshot mismatch/);
});

test('REJECTS a catalog declared in the manifest but not emitted',async()=>{
 const b=bundle();
 b.manifest.catalogs.push('GearRows');
 await assert.rejects(loadAll(b.publish()),/missing\/ambiguous catalog GearRows/);
});

test('REJECTS a resolved record count that disagrees with the manifest',async()=>{
 const b=bundle();
 b.profile('tr').files.Races.records=99;
 await assert.rejects(loadAll(b.publish()),/record count mismatch/);
});

test('REJECTS a payload whose bytes do not match the manifest hash',async()=>{
 const b=bundle().publish();
 const url=ROOT+ID+'/tr/Races.json';
 const tampered=JSON.parse(b.routes.get(url));
 tampered.records[0].value=9; // Same byte length, so this exercises the hash, not the size.
 const body=JSON.stringify(tampered);
 assert.equal(Buffer.byteLength(body),b.profile('tr').files.Races.bytes);
 b.routes.set(url,body);
 await assert.rejects(loadAll(b),/hash mismatch/);
});

test('REJECTS an ARCE delta that claims a base other than its profile base',async()=>{
 const b=bundle().catalog('Classes').delta('Classes',[{key:'c',value:3}],[]);
 b.profile('tr_arce').files.Classes.base='vanilla';
 await assert.rejects(loadAll(b.publish()),/invalid file kind\/base/);
});


test('gear feature preserves verified policy metadata and ARCE inheritance without duplicate downloads',async()=>{
 const b=bundle().catalog('GearRows',{payloadField:'coverage'}).catalog('Armor').catalog('Clothing').catalog('GameSettings').publish(),hits=[];
 const {createBundleLoader}=await modulePromise;
 const loader=createBundleLoader({baseUrl:ROOT,crypto:webcrypto,cacheStorage:null,fetcher:async url=>{
   hits.push(url);return new Response(b.routes.get(url));
 }});
 const data=await loader.loadFeature('tr_arce','gear');
 assert.equal(data.profile,'tr_arce');assert.equal(data.metadata.GearRows.profile.id,'tr');
 assert.equal(data.metadata.GearRows.coverage,'future');
 assert.equal(data.metadata.GearRows.records,undefined);
 assert.ok(Object.isFrozen(data.metadata.GearRows));
 assert.equal(hits.filter(u=>u.endsWith('/GearRows.json')).length,1);
 assert.ok(!hits.some(u=>u.endsWith('/Races.json')));
 assert.equal((await loader.loadFeature('vanilla','gear')).metadata.GearRows.profile.id,'vanilla');
});

test('travel, enchanting, and spellmaking features load matching catalogs according to contract', async () => {
  const b = bundle()
    .catalog('Travel', { rows: [{ key: 'travel_1', from: 'interior:balmora, guild of mages', to: 'interior:caldera, guild of mages', mode: 'guild_guide' }] })
    .catalog('Places')
    .catalog('MagicEffects', { rows: [{ key: 'fire_damage', name: 'Fire Damage' }] })
    .catalog('GameSettings')
    .catalog('Enchantments')
    .catalog('EffectRules', { rows: [{ key: 'fire_damage', allowEnchanting: true, allowSpellmaking: true }] })
    .catalog('Merchants', { rows: [{ id: 'galbedir', servicesRaw: 65536 | 32768, cell: 'Balmora, Guild of Mages' }] })
    .publish();

  const { createBundleLoader } = await modulePromise;
  const loader = createBundleLoader({
    baseUrl: ROOT,
    crypto: webcrypto,
    cacheStorage: null,
    fetcher: async url => new Response(b.routes.get(url))
  });

  const travelData = await loader.loadFeature('vanilla', 'travel');
  assert.equal(travelData.catalogs.Travel.length, 1);
  assert.equal(travelData.catalogs.Places.length, 2);

  const enchData = await loader.loadFeature('vanilla', 'enchanting');
  assert.equal(enchData.catalogs.EffectRules.length, 1);
  assert.equal(enchData.catalogs.Merchants.length, 1);

  const spellData = await loader.loadFeature('vanilla', 'spellmaking');
  assert.equal(spellData.catalogs.EffectRules.length, 1);
  assert.equal(spellData.catalogs.Merchants.length, 1);
});

test('factions feature loads Factions, Quests, Skills, and Attributes catalogs', async () => {
  const b = bundle()
    .catalog('Factions', { rows: [{ key: 'mages guild', name: 'Mages Guild', ranks: [] }] })
    .catalog('Quests', { rows: [{ key: 'mg_flowers', name: 'Flowers', trackable: true }] })
    .catalog('Skills', { rows: [{ key: 'alchemy', name: 'Alchemy' }] })
    .catalog('Attributes', { rows: [{ key: 'intelligence', name: 'Intelligence' }] })
    .publish();

  const { createBundleLoader } = await modulePromise;
  const loader = createBundleLoader({
    baseUrl: ROOT,
    crypto: webcrypto,
    cacheStorage: null,
    fetcher: async url => new Response(b.routes.get(url))
  });

  const factionsData = await loader.loadFeature('vanilla', 'factions');
  assert.equal(factionsData.catalogs.Factions.length, 1);
  assert.equal(factionsData.catalogs.Quests.length, 1);
  assert.equal(factionsData.catalogs.Skills.length, 1);
  assert.equal(factionsData.catalogs.Attributes.length, 1);
});

test('bestInSlot feature loads BestInSlot, Armor, Clothing, and Weapons catalogs', async () => {
  const b = bundle()
    .catalog('BestInSlot', { rows: [{ key: 'build/0', build: 'Spellsword' }] })
    .catalog('Armor', { rows: [{ key: 'ebon_plate', name: 'Ebony Mail' }] })
    .catalog('Clothing', { rows: [{ key: 'robe_drake', name: "Robe of the Drake's Pride" }] })
    .catalog('Weapons', { rows: [{ key: 'keening', name: 'Keening' }] })
    .publish();

  const { createBundleLoader } = await modulePromise;
  const loader = createBundleLoader({
    baseUrl: ROOT,
    crypto: webcrypto,
    cacheStorage: null,
    fetcher: async url => new Response(b.routes.get(url))
  });

  const bisData = await loader.loadFeature('vanilla', 'bestInSlot');
  assert.equal(bisData.catalogs.BestInSlot.length, 1);
  assert.equal(bisData.catalogs.Armor.length, 1);
  assert.equal(bisData.catalogs.Clothing.length, 1);
  assert.equal(bisData.catalogs.Weapons.length, 1);
});



