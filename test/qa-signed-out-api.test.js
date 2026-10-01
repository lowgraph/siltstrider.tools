const {test}=require('node:test');const assert=require('node:assert/strict');
for(const [method,route] of [['GET','account'],['GET','settings'],['GET','saves'],['GET','entitlements'],['PUT','settings']]) test(`QA-19 anonymous ${method} /api/${route} is 401 without data or cookies`,async()=>{
  const worker=(await import('../cloudflare/worker.mjs')).default;
  const env={APP_ORIGIN:'http://localhost:8795',CLERK_SECRET_KEY:'sk_test_qa_no_session',DB:{prepare(){throw Error('Anonymous request reached account database');}}};
  const request=new Request(`http://localhost:8795/api/${route}`,{method,...(method==='PUT'?{headers:{'Content-Type':'application/json'},body:'{}'}:{})});
  const r=await worker.fetch(request,env,{});assert.equal(r.status,401);assert.equal(r.headers.get('Set-Cookie'),null);assert.deepEqual(Object.keys(await r.json()).sort(),['error','message']);
});
