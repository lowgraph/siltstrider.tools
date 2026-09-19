const {test}=require('node:test');
const assert=require('node:assert/strict');
test('identical rebuilds accept timestamp and property-order differences',async()=>{
 const {sameBundleManifest}=await import('../lib/bundle-manifest.mjs');
 assert.equal(sameBundleManifest({bundleId:'abc',builtAtUnix:1,files:{a:{hash:'x',bytes:10}}},{files:{a:{bytes:10,hash:'x'}},builtAtUnix:2,bundleId:'abc'}),true);
});
test('manifest conflicts still reject data and identity changes',async()=>{
 const {sameBundleManifest}=await import('../lib/bundle-manifest.mjs');
 const original={bundleId:'abc',snapshotId:'snapshot',profiles:[{id:'tr',files:{GearRows:{sha256:'x',records:424}}}],catalogs:['GearRows']};
 for(const change of [b=>b.snapshotId='other',b=>b.bundleId='def',b=>b.profiles[0].files.GearRows.sha256='y',b=>b.profiles[0].files.GearRows.records=423,b=>b.catalogs.push('Skills'),b=>b.extra='unknown']){
  const changed=structuredClone(original);change(changed);assert.equal(sameBundleManifest(original,changed),false);
 }
});
