const {test}=require('node:test');
const assert=require('node:assert/strict');
const mod=import('../lib/permalink-codec.mjs');
test('current links round-trip all views and profiles',async()=>{
 const c=await mod;
 for(const view of c.KNOWN_VIEWS) for(const profile of ['vanilla','tr','tr_arce']) {
  const url=c.encodeShareUrl({view,profile});const back=c.decodeShareUrl(url);
  assert.equal(back.view,view);assert.equal(back.profile,profile);assert.ok(!url.includes('#'));
 }
});
test('build and challenge links preserve Unicode payloads',async()=>{
 const c=await mod;const payload={name:"Ba’Ta ⚔",race:'Khajiit',maj:['Alchemy']};
 for(const [view,key] of [['builder','build'],['challenge','run']]) {
  const url=c.encodeShareUrl({view,profile:'tr_arce',[key]:payload});
  assert.deepEqual(c.decodeShareUrl('https://siltstrider.tools'+url)[key],payload);
 }
});
test('retired fragments and aliases do not restore state',async()=>{
 const c=await mod;
 for(const raw of ['#TR','#ARCE','#optimizer','#builder&build=abc','/optimizer','/build']) {
  const result=c.decodeShareUrl(raw);assert.equal(result.view,'home');assert.equal(result.profile,'vanilla');assert.equal(result.build,null);
 }
});
test('malformed payloads and unrelated query text cannot choose a view',async()=>{
 const c=await mod;
 for(const raw of ['/alchemy?build=%%%','/alchemy?campaign=builder','/alchemy?campaign=TR&arce=1']) {
  const result=c.decodeShareUrl(raw);assert.equal(result.view,'alchemy');assert.equal(result.profile,'vanilla');assert.equal(result.build,null);
 }
 const decoded=c.safeJsonParse('{"__proto__":{"polluted":true},"constructor":{},"name":"safe"}');
 assert.deepEqual(decoded,{name:'safe'});
});
test('web base64 works when a Buffer polyfill lacks base64url',async()=>{
 const c=await mod, saved=globalThis.Buffer;
 try {globalThis.Buffer={from(){throw Error('wrong codec')}};const text='Dunmer · ⚔';assert.equal(c.fromBase64Url(c.toBase64Url(text)),text);}
 finally{globalThis.Buffer=saved;}
});
