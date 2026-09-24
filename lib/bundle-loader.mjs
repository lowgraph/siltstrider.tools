/** On-demand bundle schema 1.0.0 reader. A loader pins one release for its lifetime. */
export const FEATURE_CATALOGS = Object.freeze({
  character: Object.freeze(['Races','Classes','Birthsigns','Skills','Attributes']),
  spells: Object.freeze(['Spells','MagicEffects']),
  gear: Object.freeze(['GearRows','Armor','Clothing','GameSettings']),
  bestInSlot: Object.freeze(['BestInSlot','Armor','Clothing','Weapons']),
  equipment: Object.freeze(['Weapons','Armor','Clothing','Lights','Enchantments','GameSettings']),
  alchemy: Object.freeze(['Ingredients','Apparatus','MagicEffects','GameSettings','Attributes','Skills','EffectRules']),
  enchanting: Object.freeze(['MagicEffects','GameSettings','Enchantments','EffectRules','Merchants']),
  spellmaking: Object.freeze(['MagicEffects','GameSettings','EffectRules','Merchants']),
  travel: Object.freeze(['Travel','Places']),
  factions: Object.freeze(['Factions','Quests','Skills','Attributes']),
  inventory: Object.freeze(['Weapons','Armor','Clothing','Books','Potions','Ingredients','Apparatus','Lockpicks','Probes','RepairTools','Lights','Miscellaneous'])
});
const profiles = ['vanilla','tr','tr_arce'];
function check(ok,message) { if (!ok) throw new Error('Game data: '+message); }
function freeze(value) {
  if (value && typeof value==='object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function safePath(path) {
  check(typeof path==='string' && path.split('/').every(p=>/^[A-Za-z0-9_.-]+$/.test(p)&&p!=='.'&&p!=='..'),'invalid asset path');
  return path;
}
function key(row) {
  const id=row?.key ?? row?.id;
  check(typeof id==='string' && id.length>0,'record missing key/id'); return id;
}
function index(rows) {
  check(Array.isArray(rows),'records must be an array');
  const result=new Map();
  for(const row of rows){const id=key(row);check(!result.has(id),'duplicate record '+id);result.set(id,row);}
  return result;
}
export function applyDelta(base,changed,removed) {
  const rows=index(base), updates=index(changed);
  check(Array.isArray(removed)&&removed.every(k=>typeof k==='string')&&new Set(removed).size===removed.length,'invalid removed keys');
  for(const id of removed){check(rows.has(id)&&!updates.has(id),'invalid removal '+id);rows.delete(id);}
  for(const [id,row] of updates)rows.set(id,row);
  return [...rows.values()];
}
export function createBundleLoader({baseUrl='/game-data/',fetcher=globalThis.fetch?.bind(globalThis),cacheStorage=globalThis.caches,crypto=globalThis.crypto}={}) {
  const origin=globalThis.location?.href || 'http://localhost/';
  const root=new URL(baseUrl.endsWith('/')?baseUrl:baseUrl+'/',origin);
  check(['http:','https:'].includes(root.protocol),'HTTP(S) bundle URL required');
  const pending=new Map();
  let manifestPromise;
  function once(id,load){
    if(!pending.has(id)){
      const request=Promise.resolve().then(load).catch(error=>{pending.delete(id);throw error;});
      pending.set(id,request);
    }
    return pending.get(id);
  }
  async function request(url,options){
    const response=await fetcher(url,{credentials:'omit',...options});
    check(response.ok,'HTTP '+response.status+' loading '+new URL(url).pathname);
    return response;
  }
  async function manifest(){
    if(!manifestPromise)manifestPromise=(async()=>{
      const pointer=await (await request(new URL('current.json',root).href,{cache:'no-cache'})).json();
      check(typeof pointer.bundleId==='string'&&/^[a-f0-9]+$/.test(pointer.bundleId),'invalid bundle ID');
      check(pointer.manifest===pointer.bundleId+'/manifest.json','invalid manifest path');
      const m=await (await request(new URL(safePath(pointer.manifest),root).href,{cache:'no-cache'})).json();
      check(m.schemaVersion==='1.0.0'&&m.bundleId===pointer.bundleId&&m.snapshotId===pointer.snapshotId,'manifest version/snapshot mismatch');
      check(Array.isArray(m.profiles)&&Array.isArray(m.catalogs)&&new Set(m.catalogs).size===m.catalogs.length,'invalid manifest');
      check(new Set(m.profiles.map(p=>p.id)).size===m.profiles.length,'duplicate profiles');
      for(const p of m.profiles){
        check(profiles.includes(p.id)&&p.files&&Array.isArray(p.inherits),'invalid profile');
        if(p.base!==null){
          const base=m.profiles.find(b=>b.id===p.base);
          check(p.id==='tr_arce'&&p.base==='tr'&&base?.base===null&&base.world===p.world&&base.version===p.version,'invalid profile base');
        }
        for(const [name,f] of Object.entries(p.files)){
          check(m.catalogs.includes(name)&&!p.inherits.includes(name),'unexpected catalog');
          safePath(f.path);
          check(f.path===p.id+'/'+name+'.json','catalog path mismatch');
          check(Number.isSafeInteger(f.bytes)&&f.bytes>0&&Number.isSafeInteger(f.records)&&f.records>=0&&/^[a-f0-9]{64}$/.test(f.sha256),'invalid file metadata');
          check((f.kind==='full'&&p.base===null)||(f.kind==='delta'&&f.base===p.base&&p.base!==null),'invalid file kind/base');
        }
        for(const name of m.catalogs)check(Boolean(p.files[name])!==p.inherits.includes(name),'missing/ambiguous catalog '+name);
        for(const name of p.inherits)check(p.base!==null&&m.catalogs.includes(name)&&m.profiles.find(b=>b.id===p.base).files[name]?.kind==='full','invalid inheritance');
      }
      return freeze(m);
    })().catch(error=>{manifestPromise=undefined;throw error;});
    return manifestPromise;
  }
  async function payload(m,p,name,f){
    const url=new URL(m.bundleId+'/'+safePath(f.path),root).href;
    let cache;
    try{cache=await cacheStorage?.open('silt-game-data-v1');}catch{/* Storage unavailable: memory cache still works. */}
    async function decode(response){
      const bytes=await response.arrayBuffer();
      check(bytes.byteLength===f.bytes,'size mismatch for '+name);
      check(crypto?.subtle,'secure context required for data integrity');
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
      check(digest===f.sha256,'hash mismatch for '+name);
      const data=JSON.parse(new TextDecoder().decode(bytes));
      check(data.schemaVersion==='1.0.0'&&data.snapshotId===m.snapshotId&&data.catalog===name&&data.kind===f.kind,'payload identity mismatch');
      check(['id','world','version','arce'].every(k=>data.profile?.[k]===p[k]),'payload profile mismatch');
      if(f.kind==='full'){index(data.records);check(data.records.length===f.records,'record count mismatch');}
      else {index(data.changed);check(data.base===p.base&&Array.isArray(data.removed)&&data.changed.length===f.changed&&data.removed.length===f.removed,'delta metadata mismatch');}
      return data;
    }
    let cached;try{cached=await cache?.match(url);}catch{}
    if(cached){try{return await decode(cached);}catch{try{await cache.delete(url);}catch{}}}
    const response=await request(url,{cache:'no-cache'}), copy=response.clone();
    const data=await decode(response);
    try{await cache?.put(url,copy);}catch{/* Quota failures must not prevent use. */}
    return data;
  }
  async function loadCatalog(profileId,name){
    check(profiles.includes(profileId),'unknown profile '+profileId);
    const m=await manifest(),p=m.profiles.find(p=>p.id===profileId);
    check(p&&m.catalogs.includes(name),'catalog/profile unavailable');
    return once(profileId+':'+name,async()=>{
      if(p.inherits.includes(name))return loadCatalog(p.base,name);
      const f=p.files[name];
      const data=await once('payload:'+profileId+':'+name,()=>payload(m,p,name,f));
      const records=f.kind==='full'?data.records:applyDelta(await loadCatalog(p.base,name),data.changed,data.removed);
      check(records.length===f.records,'resolved record count mismatch');
      return freeze(records);
    });
  }
  async function loadCatalogMetadata(profileId,name){
    const m=await manifest(),p=m.profiles.find(p=>p.id===profileId);
    check(p&&m.catalogs.includes(name),'catalog/profile unavailable');
    if(p.inherits.includes(name))return loadCatalogMetadata(p.base,name);
    const data=await once('payload:'+profileId+':'+name,()=>payload(m,p,name,p.files[name]));
    const {records,changed,removed,...metadata}=data;
    return freeze(metadata);
  }
  async function loadFeature(profile,feature){
    const names=FEATURE_CATALOGS[feature];check(names,'unknown feature '+feature);
    const values=await Promise.all(names.map(name=>loadCatalog(profile,name)));
    const metadata=Object.fromEntries(await Promise.all(names.map(async name=>[name,await loadCatalogMetadata(profile,name)])));
    const m=await manifest();
    return freeze({metadata,bundleId:m.bundleId,snapshotId:m.snapshotId,profile,catalogs:Object.fromEntries(names.map((name,i)=>[name,values[i]]))});
  }
  return Object.freeze({manifest,loadCatalog,loadCatalogMetadata,loadFeature});
}
