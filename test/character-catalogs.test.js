const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');const {extract}=require('../archive/legacy/scripts/extract-legacy.cjs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
async function setup(){
 const {adaptCharacterCatalogs,createCharacterCatalogService}=await import('../lib/character-catalogs.mjs');
 const old=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously'}),w=old.window;
 const attrs=w.eval('ATTRS'),skills=w.eval('SKILLS'),spec=w.eval('SPEC_SKILLS'),races=plain(w.eval('RACES')),signs=plain(w.eval('SIGNS')),classes=plain(w.eval('VANILLA_CLASS'));
 const slug=n=>n.toLowerCase().replaceAll('-','_').replaceAll(' ','_');
 const spells=[];
 function bonuses(id,mag,fortified={}){const effects=[];if(mag)effects.push({effectId:84,magnitude:{min:mag*10,max:mag*10}});for(const [n,v] of Object.entries(fortified))effects.push({effectId:79,attribute:slug(n),magnitude:{min:v,max:v}});spells.push({key:id.toLowerCase(),name:id,type:'ability',effects});return [id];}
 const catalogs={Attributes:attrs.map((n,i)=>({id:slug(n),name:n,index:i})),Skills:skills.map((n,i)=>({key:String(i),id:String(i),name:n,skill:slug(n),specialization:Object.keys(spec).find(k=>spec[k].includes(n)).toLowerCase()})),Races:Object.entries(races).map(([name,r])=>({key:name.toLowerCase(),id:name,name,description:'Fixture race',playable:true,beast:false,attributes:Object.fromEntries(attrs.map(n=>[slug(n),{male:r.M[n],female:r.F[n]}])),skillBonuses:Object.entries(r.skills).map(([n,bonus])=>({skill:slug(n),bonus})),spellIds:bonuses('race-'+name,r.mag)})),Classes:Object.entries(classes).map(([name,c])=>({key:name.toLowerCase(),id:name,name,playable:true,specialization:c.spec.toLowerCase(),favoredAttributes:c.fav.map(slug),majorSkills:c.maj.map(slug),minorSkills:c.min.map(slug)})),Birthsigns:Object.entries(signs).map(([name,s])=>({key:name.toLowerCase(),id:name,name,description:'Fixture sign',spellIds:bonuses('sign-'+name,s.mag,s.attrs)}))};
 const loader={async loadFeature(profile){return {profile,bundleId:'fixture',snapshotId:'fixture',catalogs};},async loadCatalog(){return spells;}};
 const service=createCharacterCatalogService(loader);await service.prepare('vanilla');service.activate('vanilla');service.profileFromLocation=()=> 'vanilla';
 const parts=extract(html),dom=new JSDOM('<meta name="clerk-publishable-key" content="">'+parts.body,{url:'http://localhost/',runScripts:'dangerously',beforeParse(win){win.siltCharacters=service;}});
 for(const code of [parts.data,parts.runtime]){const script=dom.window.document.createElement('script');script.textContent=code;dom.window.document.body.appendChild(script);}
 return {old,dom,catalogs,spells,service,loader,adaptCharacterCatalogs};
}
test('catalog-backed calculator preserves base attributes, skills, health and magicka',async()=>{
 const f=await setup();try{
  const b=plain(f.old.window.getCurrentCharacter());
  const a=f.old.window.computeSheet(b),c=f.dom.window.computeSheet(b);
  for(const key of ['attrs','skills','health','fatigue','magicka'])assert.deepEqual(plain(c[key]),plain(a[key]));
  const saved=plain(f.dom.window.getCurrentCharacter());f.dom.window.loadCharacter(saved);assert.deepEqual(plain(f.dom.window.getCurrentCharacter()),saved);
 }finally{f.old.window.close();f.dom.window.close();}
});
test('changed catalogue facts drive calculations and stable IDs resolve to compatible labels',async()=>{
 const f=await setup();try{
  const changed=structuredClone(f.catalogs);changed.Races[0].attributes.strength.male=77;
  const data=f.adaptCharacterCatalogs({profile:'vanilla',catalogs:changed},f.spells);f.service.active=data;
  const b=plain(f.dom.window.getCurrentCharacter());b.race=data.races.Argonian.key;
  const normalized=f.dom.window.normalizeCharacter(b);assert.equal(normalized.race,'Argonian');
  const sheet=f.dom.window.computeSheet(normalized);assert.equal(sheet.attrs.Strength.v,87);
  assert.equal(data.labelFor('skills','0'),'Block');assert.throws(()=>data.labelFor('races','missing'));
 }finally{f.old.window.close();f.dom.window.close();}
});
test('Khajiit aliases are distinct and unplayable definitions are excluded',async()=>{
 const {adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs');const f=await setup();try{
  const c=structuredClone(f.catalogs);c.Races.push({...c.Races[0],key:'t_els_suthay',id:'t_els_suthay',name:'Khajiit'});c.Classes.push({...c.Classes[0],key:'npc',name:'NPC only',playable:false});
  const a=adaptCharacterCatalogs({profile:'tr_arce',catalogs:c},f.spells);
  assert.ok(a.races['Khajiit (Suthay)']);assert.ok(a.races.Khajiit);assert.ok(!a.classes['NPC only']);
  assert.equal(a.labelFor('races','t_els_suthay'),'Khajiit (Suthay)');
 }finally{f.old.window.close();f.dom.window.close();}
});
test('failed profile downloads leave the active profile intact and retry succeeds',async()=>{
 const f=await setup();try{
  const original=f.loader.loadFeature;f.loader.loadFeature=async()=>{throw Error('network offline');};
  await assert.rejects(f.dom.window.siltShell.setProfile('tr'),/offline/);assert.equal(f.service.active.profile,'vanilla');assert.equal(f.dom.window.siltShell.getSnapshot().profile,'vanilla');
  f.loader.loadFeature=original;await f.dom.window.siltShell.setProfile('tr');assert.equal(f.service.active.profile,'tr');assert.equal(f.dom.window.siltShell.getSnapshot().profile,'tr');
 }finally{f.old.window.close();f.dom.window.close();}
});


test('late profile downloads cannot override a newer selection',async()=>{
 const f=await setup();try{
  const original=f.loader.loadFeature;let release;
  f.loader.loadFeature=profile=>new Promise(resolve=>{release=()=>resolve(original(profile));});
  const pending=f.dom.window.siltShell.setProfile('tr');
  f.dom.window.siltShell.setProfile('vanilla');
  release();await pending;
  assert.equal(f.service.active.profile,'vanilla');
  assert.equal(f.dom.window.siltShell.getSnapshot().profile,'vanilla');
 }finally{f.old.window.close();f.dom.window.close();}
});

test('invalid cross-profile saves leave controls and active catalogs unchanged',async()=>{
 const f=await setup();try{
  const before=plain(f.dom.window.getCurrentCharacter());let status;
  f.dom.window.addEventListener('silt-character-status',e=>status=e.detail.status);
  await assert.rejects(f.dom.window.loadCharacter({...before,world:'tr',race:'Missing race'}),/Unknown/);
  assert.equal(f.service.active.profile,'vanilla');
  assert.deepEqual(plain(f.dom.window.getCurrentCharacter()),before);
  assert.equal(status,'ready');
 }finally{f.old.window.close();f.dom.window.close();}
});

test('cross-profile character and challenge restores activate matching catalogs',async()=>{
 const f=await setup();try{
  const character=plain(f.dom.window.getCurrentCharacter());character.world='tr';
  await f.dom.window.loadCharacter(character);
  assert.equal(f.service.active.profile,'tr');
  assert.equal(f.dom.window.getCurrentCharacter().world,'tr');
  const run=plain(f.dom.window.getCurrentChallengeRun());run.character.world='vanilla';
  await f.dom.window.loadChallengeRun(run);
  assert.equal(f.service.active.profile,'vanilla');
  assert.equal(f.dom.window.getCurrentChallengeRun().character.world,'vanilla');
 }finally{f.old.window.close();f.dom.window.close();}
});
