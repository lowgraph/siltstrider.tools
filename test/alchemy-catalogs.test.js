const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const connect=require('../archive/legacy/scripts/connect-alchemy-runtime.cjs');
const adapter=import('../lib/alchemy-catalogs.mjs');
function fixture(){
 return {profile:'vanilla',snapshotId:'s',catalogs:{
  Attributes:[{id:'strength',name:'Strength'},{id:'intelligence',name:'Intelligence'}],Skills:[{skill:'alchemy',name:'Alchemy'}],
  MagicEffects:[{key:'1',name:'Restore Health',baseCost:2},{key:'2',name:'Fortify Attribute',baseCost:1}],
  Ingredients:[{key:'a',name:'Same',value:3,weight:.2,effects:[{slot:3,effectId:1},{slot:0,effectId:2,attribute:'strength'}]},{key:'b',name:'Same',value:4,weight:.4,effects:[{slot:0,effectId:1}]},{key:'c',name:'Third',value:1,weight:.1,effects:[{slot:0,effectId:2,attribute:'intelligence'}]}],
  Apparatus:[{key:'apparatus_j_mortar_01',name:'Mortar',type:'mortar_and_pestle',quality:1}],
  GameSettings:[['fPotionStrengthMult',.5],['iAlchemyMod',2],['fPotionT1MagMult',1.5],['fPotionT1DurMult',.5]].map(([name,value])=>({key:name.toLowerCase(),value}))
 }};
}
const rules=[{n:'Restore Health',mag:1,dur:1},{n:'Fortify Attribute',mag:1,dur:1}];
test('adapter preserves canonical identity, duplicate names, effect slots, targets and source values',async()=>{
 const {adaptAlchemy}=await adapter,f=fixture(),a=adaptAlchemy(f,rules);
 assert.equal(a.ingredients[0].id,'a');assert.equal(a.ingredients[0].n,'Same [a]');
 assert.equal(a.ingredients[0].effects[1],null);assert.equal(a.ingredients[0].effects[3].id,'1');
 assert.equal(a.ingredients[0].effects[0].arg,'Strength');assert.equal(a.ingredients[0].v,3);
 assert.equal(a.apparatus.mortar[0].q,1);assert.equal(a.settings.fPotionT1MagMult,1.5);
 assert.equal(a.effects['1'].b,2);assert.equal(a.ingredients[0].source,f.catalogs.Ingredients[0]);
 f.catalogs.MagicEffects[0].name='Unrecognized';assert.equal(adaptAlchemy(f,rules).effects['1'].supported,false);
});
test('adapter rejects invalid targets, slots and missing formula settings',async()=>{
 const {adaptAlchemy}=await adapter;
 for(const change of [f=>f.catalogs.Ingredients[0].effects[0].slot=7,f=>f.catalogs.Ingredients[0].effects[1].attribute='unknown',f=>f.catalogs.GameSettings=[]]){
  const f=fixture();change(f);assert.throws(()=>adaptAlchemy(f,rules));
 }
});
function runtime(){
 const html=fs.readFileSync('index.html','utf8');
 const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
 const generated=connect(script),start=generated.indexOf('(function setupAlchemy() {'),end=generated.indexOf('(function setupTravel()',start);
 return generated.slice(start,end);
}
test('connected controls filter by effect/first ingredient, brew from catalogs, and clear stale profile selections',async()=>{
 const {adaptAlchemy}=await adapter;
 const dom=new JSDOM(`<div id="alc-slots"></div><input id="alc-match-first" type="checkbox"><div id="alc-out"></div>${['mortar','alembic','calcinator','retort'].map(n=>`<select id="alc-${n}"></select>`).join('')}<input id="alc-skill" value="50"><input id="alc-int" value="40"><input id="alc-luck" value="40"><input id="alc-name">`,{runScripts:'outside-only'});
 try{
  dom.window.worldMode='vanilla';dom.window.arceOn=false;
  dom.window.eval(runtime());const {document}=dom.window;
  assert.equal(document.querySelectorAll('.alc-dd-item').length,0);
  dom.window.siltAlchemyRuntime.install(adaptAlchemy(fixture(),rules));
  const select=(slot,label)=>{const field=document.querySelectorAll('#alc-slots .field')[slot];[...field.querySelectorAll('.alc-dd-item')].find(b=>b.textContent.startsWith(label)).click();};
  select(0,'Same [a]');document.getElementById('alc-match-first').click();
  assert.ok(!document.querySelectorAll('#alc-slots .field')[1].textContent.includes('Third'));
  select(1,'Same [b]');assert.match(document.getElementById('alc-out').textContent,/Gold value 58/);
  assert.match(document.getElementById('alc-out').textContent,/magnitude 10, 29s/);
  dom.window.siltAlchemyRuntime.clear();assert.equal(document.getElementById('alc-slots').children.length,0);
  const f=fixture();f.profile='tr';f.catalogs.Ingredients=f.catalogs.Ingredients.filter(r=>r.key!=='b');
  dom.window.siltAlchemyRuntime.install(adaptAlchemy(f,rules));assert.match(document.getElementById('alc-out').textContent,/at least two different ingredients/);
  assert.ok(!document.getElementById('alc-slots').textContent.includes('Same [b]'));
 }finally{dom.window.close();}
});
