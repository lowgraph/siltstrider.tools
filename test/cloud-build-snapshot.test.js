const {test}=require('node:test'); const assert=require('node:assert/strict');
const build={version:1,world:'tr',arce:true,className:'Mage',race:'Breton',gender:'Female',sign:'The Mage',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy'],min:[]};
test('wrapped builds are rejected',async()=>{const c=await import('../lib/cloud-save-codec.mjs');assert.throws(()=>c.packCloudSave(c.SAVE_TYPES.CHARACTER_BUILD,{build,version:1}),/Wrapped/);});

test('full snapshot retains gear factions and Bitter Cup',async()=>{const c=await import('../lib/cloud-save-codec.mjs');const data={...build,bitterCup:true,loadouts:[{id:'one',items:{}}],factionMemberships:[{id:'mages guild',rank:2}],name:'Test'};assert.deepEqual(c.unpackCloudSave(c.packCloudSave(c.SAVE_TYPES.CHARACTER_BUILD,data).packed).data,data);});
test('current canonical snapshots still round trip',async()=>{const c=await import('../lib/cloud-save-codec.mjs');assert.deepEqual(c.deserializeCharacterBuild(c.serializeCharacterBuild(build)),build);});
