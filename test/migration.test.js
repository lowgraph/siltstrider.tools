const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {extract}=require('../scripts/extract-legacy.cjs');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
function loadExtracted() {
  const parts=extract(html);
  const dom=new JSDOM('<!doctype html><html><head><meta name="clerk-publishable-key" content=""></head><body>'+parts.body+'</body></html>',{url:'http://localhost:8765/',runScripts:'dangerously',pretendToBeVisual:true});
  // Separate classic scripts preserve the lexical environment across files.
  for(const code of [parts.data,parts.runtime]) {
    const script=dom.window.document.createElement('script');script.textContent=code;dom.window.document.body.appendChild(script);
  }
  return dom;
}
test('extraction separates assets and data, preserving licences and literals',()=>{
  const result=extract(html);
  assert.ok(result.assets.size>0);
  assert.ok(result.manifest.tables.includes('RACES'));
  assert.ok(result.manifest.tables.includes('EARLY_GEAR'));
  assert.doesNotMatch(result.body,/<script|<style|data:(?:font|image)/i);
  assert.doesNotMatch(result.css,/base64,/);
  assert.match(result.css,/SIL OPEN FONT LICENSE/);
  assert.ok(Buffer.byteLength(result.body)<50000);
  assert.deepEqual(extract(html).manifest,result.manifest);
});
test('extracted code retains optimizer, state and profile behavior',async()=>{
  const legacy=new JSDOM(html,{url:'http://localhost:8765/',runScripts:'dangerously',pretendToBeVisual:true});
  const migrated=loadExtracted();
  try {
    await new Promise(r=>setTimeout(r,60));
    const a=legacy.window,b=migrated.window;
    assert.deepEqual(plain(b.runOptimizerTests()),plain(a.runOptimizerTests()));
    assert.equal(b.runOptimizerTests().all,true);
    assert.deepEqual(plain(b.getCurrentCharacter()),plain(a.getCurrentCharacter()));
    for(const world of ['tr','vanilla']) {
      a.setWorld(world);b.setWorld(world);
      assert.deepEqual(plain(b.getCurrentCharacter()),plain(a.getCurrentCharacter()));
      assert.deepEqual(plain(b.getCurrentChallengeRun()),plain(a.getCurrentChallengeRun()));
    }
    const saved=plain(a.getCurrentCharacter());b.loadCharacter(saved);
    assert.deepEqual(plain(b.getCurrentCharacter()),saved);
    assert.equal(b.location.hash,a.location.hash);
  } finally { legacy.window.close();migrated.window.close(); }
});

test('shared shell profiles and navigation follow legacy restores without replacing editor state',async()=>{
 const dom=loadExtracted();
 try{
  await new Promise(r=>setTimeout(r,60));
  const w=dom.window,shell=w.siltShell;
  assert.ok(shell.getSnapshot().ready);
  assert.equal(w.document.getElementById('btn-world-tr'),null);
  let calls=0;const unsubscribe=shell.subscribe(()=>calls++);
  shell.setProfile('tr_arce');
  assert.equal(calls,1);assert.equal(shell.getSnapshot().profile,'tr_arce');
  assert.equal(w.getCurrentCharacter().world,'tr');
  shell.setProfile('vanilla');
  assert.equal(shell.getSnapshot().arce,false);
  shell.navigate('alchemy');assert.equal(shell.getSnapshot().view,'alchemy');
  assert.ok(w.document.getElementById('panel-alchemy').classList.contains('show'));
  const character=plain(w.getCurrentCharacter());
  shell.setProfile('tr_arce');w.loadCharacter(character);
  assert.equal(shell.getSnapshot().profile,'vanilla');
  w.location.hash='#home&world=tr&arce=1';w.readShareHash();
  assert.equal(shell.getSnapshot().profile,'tr_arce');assert.equal(shell.getSnapshot().view,'home');
  const before=shell.getSnapshot();assert.throws(()=>shell.setProfile('bad'));assert.equal(shell.getSnapshot(),before);
  unsubscribe();const count=calls;shell.navigate('travel');assert.equal(calls,count);
 }finally{dom.window.close();}
});
