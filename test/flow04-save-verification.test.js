const {test}=require('node:test');const assert=require('node:assert/strict');
const fixture=require('./helpers/qa-staged-data.cjs');const inventory=require('./fixtures/flow04-inventory.cjs');
const lib=import('../lib/travel-teleports.mjs');
const carried={stuff:{inventory:inventory.ids.map(id=>({id,count:1}))},contentFiles:['master_index.esp']};
test('FLOW-04: original Pe.omwsave has 69 positive inventory records and matches the reduced fixture',{skip:!process.env.QA_FLOW04_SAVE_PATH},async()=>{
  const fs=require('node:fs'),crypto=require('node:crypto');const {parseOmwSave}=await import('../lib/omwsave-parser.mjs');
  const bytes=fs.readFileSync(process.env.QA_FLOW04_SAVE_PATH);const digest=()=>crypto.createHash('sha256').update(fs.readFileSync(process.env.QA_FLOW04_SAVE_PATH)).digest('hex');
  assert.equal(digest(),inventory.sha256);const save=parseOmwSave(bytes);
  assert.equal(save.formatVersion,37);assert.equal(save.stuff.inventory.length,69);assert.ok(save.stuff.inventory.every(i=>i.count>0));
  assert.deepEqual(save.stuff.inventory.map(i=>i.id),inventory.ids);assert.deepEqual(save.warnings,[]);
  for(const id of ['sc_almsiviintervention','sc_divineintervention'])assert.equal(save.stuff.inventory.find(i=>i.id===id).count,4);
  assert.equal(digest(),inventory.sha256,'The original file remains untouched');
});
for(const profile of ['vanilla','tr','tr_arce'])test(`FLOW-04: the actual carried IDs overlap none of the staged ${profile} teleport items`,fixture.staged(),async()=>{
  const data=await(await fixture.loader()).loadFeature(profile,'travel');const {heldFromSave,teleportItems}=await lib;
  const options=teleportItems({records:data.catalogs.Teleports,items:data.metadata.Teleports.items});
  assert.ok(options.length>0);if(profile!=='vanilla')assert.equal(options.length,39);
  assert.deepEqual(options.filter(i=>heldFromSave(carried).has(i.id)),[]);
});
test('FLOW-04: uppercase carried index IDs remain eligible; installing the Master Index plugin does not grant one',async()=>{
  const {heldFromSave,usableTeleport}=await lib;const teleport={requires:['index_andra'],unless:[],questGated:false};
  assert.equal(usableTeleport(teleport,heldFromSave(carried)),false);
  assert.equal(usableTeleport(teleport,heldFromSave({stuff:{inventory:[{id:'INDEX_ANDRA',count:1}]}})),true);
});
test('FLOW-04: missing, unrelated and malformed inventory IDs cannot tick a supported index',async()=>{
  const {heldFromSave}=await lib;
  for(const save of [null,{}, {stuff:{inventory:[]}}, {stuff:{inventory:[null,{id:42},{id:''},{id:'index-like mod token'}]}}])assert.equal(heldFromSave(save).has('index_andra'),false);
});
test('FLOW-04: resetting an edited checkbox restores an empty supported overlap without changing the save',async()=>{
  const {heldFromSave}=await lib;const {applyTravelOverrides}=await import('../lib/travel-options.mjs');const before=JSON.stringify(carried);
  const defaults={held:heldFromSave(carried)};assert.equal(applyTravelOverrides(defaults,{held:{index_andra:true}}).held.has('index_andra'),true);
  assert.equal(applyTravelOverrides(defaults,{}).held.has('index_andra'),false);assert.equal(JSON.stringify(carried),before);
});
