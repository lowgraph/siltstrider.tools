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
