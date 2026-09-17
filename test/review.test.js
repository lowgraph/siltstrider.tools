const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('node:path');
async function load(t, hash='', storage={}) {
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
  const dom=await JSDOM.fromFile(path.join(__dirname,'../index.html'),{url:'https://review.test/'+hash,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){for(const [k,v] of Object.entries(storage))w.localStorage.setItem(k,v);}});
  t.after(()=>dom.window.close());assert.deepEqual(errors,[]);return dom.window;
}
const plain=x=>JSON.parse(JSON.stringify(x));
function set(w,selector,value,event='change'){const el=w.document.querySelector(selector);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));return el;}
test('all planner deep links restore their visible view',async t=>{
  for(const [hash,id] of [['builder','build'],['challenge','challenge'],['alchemy','alchemy'],['travel','travel'],['enchanting','enchant'],['spellmaking','spell']]){
    const w=await load(t,'#'+hash);assert.equal(w.document.querySelector('.panel.show').id,'panel-'+id);
  }
});
test('ARCE builder and challenge round trips preserve identities',async t=>{
  const w=await load(t);w.setWorld('tr');w.setArce(true);w.showView('builder');set(w,'#c-race','Naga');set(w,'#c-class','Farmer');
  const before=plain(w.collectBuild()), restored=await load(t,w.location.hash);
  assert.deepEqual(plain(restored.collectBuild()),before);assert.equal(restored.document.getElementById('custom').classList.contains('hidden'),false);
  w.applyRunPayload({race:'Naga',gender:'Female',cls:'Farmer',sign:'The Mage'});w.showView('challenge');
  const run=await load(t,w.location.hash);assert.equal(run.eval('challengeRun.race'),'Naga');assert.equal(run.eval('challengeRun.cls'),'Farmer');
});
test('explicit and legacy Vanilla links ignore recipient TR preference',async t=>{
  for(const hash of ['#challenge','#challenge&world=vanilla&arce=0']){
    const w=await load(t,hash,{'mw-world':'tr','mw-arce':'1'});assert.equal(w.worldMode,'vanilla');assert.equal(w.arceOn,false);
  }
});
test('restrictions retain compatibility with existing minor objectives',async t=>{
  const w=await load(t);w.eval('challengeRun.minors = [OBJECTIVES.find(o => /Steal exactly/.test(o.text))]');
  for(let i=0;i<100;i++){w.rollRestrictions();assert.equal(w.eval('challengeRun.rests.every(r=>restrictionOkForNeeds(r,tagsOf(challengeRun.minors[0].text)))'),true);}
});
test('major rerolls preserve locked restrictions and stay compatible',async t=>{
  const w=await load(t);w.eval('challengeRun.rests = ["No mages guild"]');w.setLock('rest',true);
  for(let i=0;i<100;i++){w.rollMajor();assert.deepEqual(plain(w.eval('challengeRun.rests')),['No mages guild']);assert.equal(w.eval('restrictionOkForNeeds(challengeRun.rests[0],tagsOf(challengeRun.major))'),true);}
});
test('constant effect ignores remembered Target range and area',async t=>{
  const w=await load(t);set(w,'.enc-range','target');set(w,'.enc-area','80','input');set(w,'#enc-type','const');const target=w.document.getElementById('enc-out').textContent;
  set(w,'#enc-type','use');set(w,'.enc-range','self');set(w,'#enc-type','const');assert.equal(w.document.getElementById('enc-out').textContent,target);
});
function ingredient(w,slot,name){let wrap=w.document.querySelectorAll('#alc-slots > .field')[slot];wrap.querySelector('input[type=checkbox]').click();wrap=w.document.querySelectorAll('#alc-slots > .field')[slot];const q=wrap.querySelector('input[list]');q.value=name;q.dispatchEvent(new w.Event('change'));}
test('ingredient search rejects duplicates and treats potion names as text',async t=>{
  const w=await load(t);ingredient(w,0,'Ash Yam');ingredient(w,1,'Ash Yam');assert.match(w.document.getElementById('alc-out').textContent,/two different/);
  const q=w.document.querySelectorAll('#alc-slots input[list]')[1];q.value='Bloat';q.dispatchEvent(new w.Event('change'));
  const payload='<em id="review-injection">test</em>';set(w,'#alc-name',payload,'input');assert.equal(w.document.getElementById('review-injection'),null);assert.ok(w.document.getElementById('alc-out').textContent.includes(payload));
});
test('spellmaker zero disposition and stats remain zero',async t=>{
  const w=await load(t);for(const id of ['spl-disp','spl-merc','spl-pers','spl-luck'])set(w,'#'+id,'0','input');
  assert.match(w.document.getElementById('spl-barter-out').textContent,/at 0 Disposition/);assert.equal(w.numberInput('spl-merc',40),0);
});
test('failed clipboard writes offer manual copy; successful writes report success',async t=>{
  const w=await load(t);const btn=w.document.getElementById('btn-copy-build-link');w.document.execCommand=()=>false;
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied')}}});
  await w.copyText(btn,'test link','Copy link','Copied link');assert.equal(btn.textContent,'Copy link');assert.equal(w.document.querySelector('#btn-copy-build-link-manual-copy textarea').value,'test link');
  w.navigator.clipboard.writeText=async()=>{};await w.copyText(btn,'test','Copy link','Copied link');assert.equal(btn.textContent,'Copied link');assert.equal(w.document.getElementById('btn-copy-build-link-manual-copy'),null);
});
test('calculator fields have associated labels and retain effect-picker focus',async t=>{
  const w=await load(t);for(const el of w.document.querySelectorAll('.enc-row input,.enc-row select'))assert.ok(el.labels.length,el.outerHTML);
  w.showView('spellmaking');const picker=w.document.querySelector('.spl-eff');picker.focus();const id=picker.id;set(w,'.spl-eff',picker.options[1].value);assert.equal(w.document.activeElement.id,id);
  ingredient(w,0,'Ash Yam');assert.ok(w.document.querySelector('#alc-slots input[list]').labels.length);
});
test('travel suggestions preserve apostrophes and invalid search reports an error',async t=>{
  const w=await load(t);w.setWorld('tr');w.document.getElementById('trv-to-search').click();
  const value=Array.from(w.document.getElementById('trv-to-dl').options).find(e=>/Septim/.test(e.value)).value;assert.equal(value,"Septim's Gate Pass");
  set(w,'#trv-to-q',value);assert.equal(w.document.getElementById('trv-to').value,value);set(w,'#trv-to-q','not a place');assert.match(w.document.getElementById('trv-out').textContent,/known start/);
});
test('invalid builds cannot partially overwrite the current sheet',async t=>{
  const w=await load(t);const before=plain(w.collectBuild());assert.throws(()=>w.applyBuild({...before,race:'Nord',spec:'invalid'}));assert.deepEqual(plain(w.collectBuild()),before);
});
test('Atronach notes allow Restore Magicka potions',async t=>{
  const w=await load(t);set(w,'#c-sign','The Atronach');w.optimizeGear();const text=w.document.getElementById('gear-box').textContent;
  assert.match(text,/Restore Magicka potions and Spell Absorption/);assert.doesNotMatch(text,/potions and loot do not refill|Atronach cannot/);
});
