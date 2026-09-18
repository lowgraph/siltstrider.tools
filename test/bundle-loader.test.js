const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
const modulePromise=import('../lib/bundle-loader.mjs');
function fixture(){
 const bundleId='abcdef',snapshotId='snapshot',root='https://data.example/';
 const profiles=[{id:'vanilla',world:'vanilla',version:'1',arce:false,base:null,files:{},inherits:[]},{id:'tr',world:'tamriel_rebuilt',version:'2',arce:false,base:null,files:{},inherits:[]},{id:'tr_arce',world:'tamriel_rebuilt',version:'2',arce:true,base:'tr',files:{},inherits:['Skills']}];
 const routes=new Map(),hits=[];
 const m={schemaVersion:'1.0.0',bundleId,snapshotId,catalogs:['Races','Skills'],profiles};
 function add(profile,name,records,delta){
  const p=profiles.find(p=>p.id===profile),path=profile+'/'+name+'.json';
  const data={schemaVersion:'1.0.0',snapshotId,profile:{id:p.id,world:p.world,version:p.version,arce:p.arce},catalog:name,kind:delta?'delta':'full',...(delta?{base:'tr',changed:records,removed:['old']}:{records})};
  const body=JSON.stringify(data);
  p.files[name]={path,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex'),records:delta?2:records.length,kind:data.kind,...(delta?{base:'tr',changed:records.length,removed:1}:{})};
  routes.set(root+bundleId+'/'+path,body);
 }
 for(const p of ['vanilla','tr']){add(p,'Races',[{key:'old',name:p},{key:'keep',name:p,nested:{value:1}}]);add(p,'Skills',[{id:'skill'}]);}
 add('tr_arce','Races',[{key:'keep',name:'changed'},{key:'new',name:'added'}],true);
 const refresh=()=>{routes.set(root+'current.json',JSON.stringify({bundleId,snapshotId,manifest:bundleId+'/manifest.json'}));routes.set(root+bundleId+'/manifest.json',JSON.stringify(m));};refresh();
 const cache=new Map();
 const cacheStorage={async open(){return {async match(url){return cache.get(url)?.clone();},async put(url,r){cache.set(url,r.clone());},async delete(url){return cache.delete(url);}};}};
 const fetcher=async url=>{hits.push(url);return new Response(routes.get(url)||'missing',{status:routes.has(url)?200:404});};
 const options={baseUrl:root,fetcher,cacheStorage,crypto:webcrypto};
 return {m,root,routes,hits,cache,options,refresh};
}
test('loader is lazy, deduplicates requests and preserves profile provenance',async()=>{
 const {createBundleLoader}=await modulePromise,f=fixture(),loader=createBundleLoader(f.options);
 assert.equal(f.hits.length,0);
 const [a,b]=await Promise.all([loader.loadCatalog('tr','Races'),loader.loadCatalog('tr','Races')]);
 assert.equal(a,b);assert.equal(f.hits.length,3);assert.equal(a[0].name,'tr');
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a[1].nested));
 const vanilla=await loader.loadCatalog('vanilla','Races');assert.equal(vanilla[0].name,'vanilla');
 assert.equal(f.hits.filter(x=>x.endsWith('current.json')).length,1);
});
test('ARCE upserts/removes without modifying base, inherits identical catalogs',async()=>{
 const {createBundleLoader}=await modulePromise,f=fixture(),loader=createBundleLoader(f.options);
 const arce=await loader.loadCatalog('tr_arce','Races'),base=await loader.loadCatalog('tr','Races');
 assert.deepEqual(arce.map(r=>r.key),['keep','new']);assert.equal(base[0].key,'old');assert.equal(base[1].name,'tr');
 const skills=await loader.loadCatalog('tr_arce','Skills');assert.equal(skills,await loader.loadCatalog('tr','Skills'));
 assert.ok(!f.hits.some(u=>u.endsWith('tr_arce/Skills.json')));
});
test('verified persistent cache survives a new loader and heals corrupted entries',async()=>{
 const {createBundleLoader}=await modulePromise,f=fixture();
 await createBundleLoader(f.options).loadCatalog('tr','Races');
 f.hits.length=0;await createBundleLoader(f.options).loadCatalog('tr','Races');assert.equal(f.hits.length,2);
 const url=f.root+'abcdef/tr/Races.json';f.cache.set(url,new Response('broken'));
 f.hits.length=0;await createBundleLoader(f.options).loadCatalog('tr','Races');assert.ok(f.hits.includes(url));
});
test('network/hash failures can retry and never enter persistent cache',async()=>{
 const {createBundleLoader}=await modulePromise,f=fixture(),url=f.root+'abcdef/tr/Races.json',original=f.routes.get(url),loader=createBundleLoader(f.options);
 f.routes.delete(url);await assert.rejects(loader.loadCatalog('tr','Races'),/HTTP 404/);
 f.routes.set(url,original.replace('old','bad'));await assert.rejects(loader.loadCatalog('tr','Races'),/hash mismatch/);assert.equal(f.cache.size,0);
 f.routes.set(url,original);assert.equal((await loader.loadCatalog('tr','Races')).length,2);
});
test('rejects traversal, unsupported manifests and invalid profile dependencies',async()=>{
 const {createBundleLoader}=await modulePromise;
 for(const change of [f=>f.m.schemaVersion='9',f=>f.m.profiles[1].files.Races.path='../Races.json',f=>f.m.profiles[2].base='tr_arce']){
  const f=fixture();change(f);f.refresh();await assert.rejects(createBundleLoader(f.options).loadCatalog('tr','Races'),/Game data:/);
 }
});
test('cache denial does not prevent loading; unknown feature/profile is rejected',async()=>{
 const {createBundleLoader}=await modulePromise,f=fixture();f.options.cacheStorage={open:async()=>{throw Error('denied');}};
 const loader=createBundleLoader(f.options);assert.equal((await loader.loadCatalog('tr','Races')).length,2);
 await assert.rejects(loader.loadFeature('tr','unknown'),/unknown feature/);await assert.rejects(loader.loadCatalog('bad','Races'),/unknown profile/);
});
test('feature groups load only their own catalogs and keep one snapshot',async()=>{
 const {createBundleLoader}=await modulePromise,f=fixture();
 // Use the spell feature with a small dedicated manifest.
 f.m.catalogs=['Spells','MagicEffects'];
 // This test uses an independent minimal full profile to avoid unrelated deltas.
 const p={id:'vanilla',world:'vanilla',version:'1',arce:false,base:null,files:{},inherits:[]};f.m.profiles=[p];
 for(const name of f.m.catalogs){const body=JSON.stringify({schemaVersion:'1.0.0',snapshotId:'snapshot',profile:{id:p.id,world:p.world,version:p.version,arce:p.arce},catalog:name,kind:'full',records:[{id:name}]});p.files[name]={path:'vanilla/'+name+'.json',kind:'full',records:1,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')};f.routes.set(f.root+'abcdef/'+p.files[name].path,body);}
 f.refresh();const result=await createBundleLoader(f.options).loadFeature('vanilla','spells');
 assert.deepEqual(Object.keys(result.catalogs),['Spells','MagicEffects']);assert.equal(result.bundleId,'abcdef');assert.equal(f.hits.length,4);
});
