const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const math=import('../lib/alchemy-math.mjs');
const adapter=import('../lib/alchemy-catalogs.mjs');
function fixture(){return {profile:'tr',catalogs:{Attributes:[{id:'strength',name:'Strength'},{id:'intelligence',name:'Intelligence'}],Skills:[],
 MagicEffects:[{key:'14',name:'Fire Damage',baseCost:2}],
 EffectRules:[{key:'14',noMagnitude:false,noDuration:false,harmful:true}],
 Ingredients:['a','b'].map(key=>({key,name:key,effects:[{slot:0,effectId:14}]})),Apparatus:[{key:'apparatus_j_mortar_01',type:'mortar_and_pestle',name:'Mortar',quality:1}],
 GameSettings:[['fPotionStrengthMult',.5],['iAlchemyMod',2],['fPotionT1MagMult',1.5],['fPotionT1DurMult',.5]].map(([key,value])=>({key:key.toLowerCase(),value}))}};}
async function brew(f=fixture(),extra={}){const {adaptAlchemy}=await adapter;const a=adaptAlchemy(f);return (await math).calculatePotion({ingredients:a.ingredients,settings:a.settings,...extra});}
test('live adapter supplies engine flags and costs to exact potion calculations',async()=>{
 let p=await brew();assert.equal(p.goldValue,58);assert.equal(p.effects[0].magnitude,10);assert.equal(p.effects[0].duration,29);assert.equal(p.effects[0].isBad,true);
 const f=fixture();f.catalogs.MagicEffects[0].baseCost=20;p=await brew(f);assert.equal(p.effects[0].magnitude,1);assert.equal(p.effects[0].duration,3);
 f.catalogs.GameSettings.find(x=>x.key==='fpotiont1magmult').value=3;f.catalogs.MagicEffects[0].baseCost=2;assert.equal((await brew(f)).effects[0].magnitude,5);
 assert.equal((await brew(fixture(),{alembicQuality:1})).effects[0].magnitude,5);
 assert.equal((await brew(fixture(),{retortQuality:1})).effects[0].magnitude,10);
});
test('unknown or null rules and invalid costs cannot fabricate a potion',async()=>{
 for(const mutate of [f=>f.catalogs.EffectRules=[],f=>f.catalogs.EffectRules[0].harmful=null,f=>f.catalogs.EffectRules[0].noDuration=undefined,f=>f.catalogs.MagicEffects[0].baseCost=0]){
  const f=fixture();mutate(f);assert.equal((await brew(f)).isValid,false);
 }
});
test('missing settings, duplicate ingredients and zero-rounded effects are rejected',async()=>{
 const f=fixture();f.catalogs.GameSettings=[];const {adaptAlchemy}=await adapter;assert.throws(()=>adaptAlchemy(f));
 const a=adaptAlchemy(fixture()),calculate=(await math).calculatePotion;assert.equal(calculate({ingredients:[a.ingredients[0],a.ingredients[0]],settings:a.settings}).isValid,false);
 assert.equal((await brew(fixture(),{alchemySkill:0,intelligence:0,luck:0})).isValid,false);
});
test('no-magnitude and no-duration flags suppress fields; cure effects are not strengthened',async()=>{
 const f=fixture();Object.assign(f.catalogs.EffectRules[0],{noMagnitude:true,noDuration:true,harmful:false});const p=await brew(f,{retortQuality:2});assert.equal(p.effects[0].magnitude,1);assert.equal(p.effects[0].duration,1);assert.equal(p.effects[0].hasMagnitude,false);assert.equal(p.effects[0].hasDuration,false);
});
test('effect matching distinguishes targets and uses canonical effect ids',async()=>{
 const {sharesAlchemyEffect}=await math;
 const a={effects:[null,{id:'79',n:'Fortify Attribute',arg:'Strength'}]};
 assert.equal(sharesAlchemyEffect(a,{effects:[{id:'79',n:'Fortify Attribute',arg:'Intelligence'}]}),false);
 assert.equal(sharesAlchemyEffect(a,{effects:[{id:'79',n:'Renamed',arg:'Strength'}]}),true);
 assert.equal(sharesAlchemyEffect(a,{effects:[null]}),false);
});
test('native workstation gates loading/errors and resets slots on profile change',async()=>{
 const {JSDOM}=require('jsdom'),React=require('react'),Module=require('node:module');
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=require('react-dom/client');const root=createRoot(document.getElementById('root'));
 let state={status:'loading'},profile='tr';
 const dependencies={'../../character-context':{useActiveCharacter:()=>({build:{},sheet:{}})},'../../shell-context':{useShell:()=>({profile})},'../../use-game-data':{useGameData:()=>state},'../../use-search-intent':{useSearchIntent:()=>null},'../../../lib/search-intent.mjs':{clearSearchIntent:()=>{}},'../../../lib/alchemy-catalogs.mjs':await adapter,'../../../lib/alchemy-math.mjs':await math};
 const file='components/calculators/alchemy/alchemy-workstation.jsx';const m=new Module(file,module);m.paths=module.paths;m.require=id=>dependencies[id]||require(id);m._compile(require('esbuild').transformSync(fs.readFileSync(file,'utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'}).code,file);const Workstation=m.exports.default;
 const render=()=>React.act(async()=>root.render(React.createElement(Workstation,{key:profile})));
 try{
  await render();assert.match(document.body.textContent,/Loading alchemy/);assert.equal(document.querySelectorAll('select').length,0);
  state={status:'ready',data:fixture()};await render();assert.equal(document.querySelector('[role=alert]'),null);
  const select=document.querySelectorAll('.alchemy-workstation select')[4];await React.act(async()=>{select.value='a';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.match(document.body.textContent,/Fire Damage/);
  profile='vanilla';state={status:'loading'};await render();assert.equal(document.querySelectorAll('select').length,0);
  const f=fixture();f.profile=profile;f.catalogs.Ingredients=f.catalogs.Ingredients.filter(i=>i.key!=='a');state={status:'ready',data:f};await render();assert.equal(document.querySelectorAll('.alchemy-workstation select')[4].value,'');
  state={status:'error',error:Error('Network failed'),retry:()=>{}};await render();assert.match(document.querySelector('[role=alert]').textContent,/Network failed/);assert.equal(document.querySelectorAll('select').length,0);
  const shell=fs.readFileSync('components/app-shell.jsx','utf8');assert.ok(shell.includes('<AlchemyWorkstation key={shell.profile} />'));assert.ok(!shell.includes('AlchemyDataBridge'));
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
