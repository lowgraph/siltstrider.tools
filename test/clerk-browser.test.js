const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const key='pk_live_Y2xlcmsuc2lsdHN0cmlkZXIudG9vbHMk';
test('rejects missing and malformed Clerk configuration',async()=>{
 const {clerkDomain}=await import('../lib/clerk-browser.mjs');
 for(const value of ['', 'sk_live_secret', 'pk_live_%%%%', 'pk_live_'+Buffer.from('evil.test/path$').toString('base64')]) assert.throws(()=>clerkDomain(value));
 assert.equal(clerkDomain(key),'clerk.siltstrider.tools');
});
test('concurrent callers initialize once and signal readiness after load',async()=>{
 const {ensureClerk}=await import('../lib/clerk-browser.mjs');
 const dom=new JSDOM(`<meta name="clerk-publishable-key" content="${key}">`);const w=dom.window;let scripts=0,loads=0,ready=0;
 w.addEventListener('silt-auth-ready',()=>ready++);
 w.document.head.appendChild=el=>{scripts++;if(scripts===2){assert.equal(el.getAttribute('data-clerk-publishable-key'),key);w.Clerk={load:async()=>{loads++;}};}queueMicrotask(()=>el.onload());return el;};
 try{const a=ensureClerk(w);assert.equal(ensureClerk(w),a);await a;assert.equal(scripts,2);assert.equal(loads,1);assert.equal(ready,1);}finally{w.close();}
});
test('script failure is reported and permits retry',async()=>{
 const {ensureClerk}=await import('../lib/clerk-browser.mjs');
 const dom=new JSDOM(`<meta name="clerk-publishable-key" content="${key}">`);let attempts=0;
 dom.window.document.head.appendChild=el=>{attempts++;queueMicrotask(()=>el.onerror());return el;};
 try{await assert.rejects(ensureClerk(dom.window),/Unable to load/);await assert.rejects(ensureClerk(dom.window),/Unable to load/);assert.equal(attempts,2);}finally{dom.window.close();}
});
test('only a live Clerk sign-in counts as a session',async()=>{
 const {hasClerkSession}=await import('../lib/clerk-browser.mjs');
 const doc=cookie=>({cookie});
 for(const cookie of ['','__client_uat=0','__client_uat=0; __client_uat_2pr8DbJx=0','__client_uat=','__client_uat=abc','__client_uat=-5','x__client_uat=1790000000','__client_uat_bad!=1790000000','theme=dark'])
  assert.equal(hasClerkSession(doc(cookie)),false,cookie||'no cookies');
 for(const cookie of ['__client_uat=1790000000','theme=dark; __client_uat_2pr8DbJx=1790000000','__client_uat=0; __client_uat_2pr8DbJx=1790000000'])
  assert.equal(hasClerkSession(doc(cookie)),true,cookie);
 assert.equal(hasClerkSession(null),false);assert.equal(hasClerkSession({}),false);
});
test('a signed-out browser does not load Clerk; a signed-in one does',async()=>{
 const {ensureClerkIfSignedIn}=await import('../lib/clerk-browser.mjs');
 const outDom=new JSDOM(`<meta name="clerk-publishable-key" content="${key}">`,{url:'https://siltstrider.tools/'});let injected=0;
 outDom.window.document.head.appendChild=el=>{injected++;return el;};
 try{assert.equal(await ensureClerkIfSignedIn(outDom.window),null);assert.equal(injected,0,'no script, so no cookies');}finally{outDom.window.close();}
 const inDom=new JSDOM(`<meta name="clerk-publishable-key" content="${key}">`,{url:'https://siltstrider.tools/'});const w=inDom.window;let scripts=0;
 w.document.cookie='__client_uat=1790000000';
 w.document.head.appendChild=el=>{scripts++;if(scripts===2)w.Clerk={load:async()=>{}};queueMicrotask(()=>el.onload());return el;};
 try{assert.equal(await ensureClerkIfSignedIn(w),w.Clerk);assert.equal(scripts,2);}finally{w.close();}
});
