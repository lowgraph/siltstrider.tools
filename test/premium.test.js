const {test}=require('node:test');const assert=require('node:assert/strict');
const code='SS-'+'a'.repeat(32);
const valid={verification_token:'secret',type:'Tip',is_subscription_payment:false,currency:'USD',amount:'3.00',message:code,kofi_transaction_id:'payment-one'};

test('Tip and Donation accept a one-dollar payment',async()=>{
  const {paymentDetails}=await import('../cloudflare/routes/premium.mjs');
  for(const type of ['Tip','Donation']) assert.deepEqual(paymentDetails({...valid,type,amount:'1.00'}),{code,amount:'1.00',currency:'USD',transactionId:'payment-one'});
});

test('support code matching is case-insensitive and normalizes to lowercase',async()=>{
  const {paymentDetails}=await import('../cloudflare/routes/premium.mjs');
  const upperCode='SS-'+'A'.repeat(32);
  assert.deepEqual(paymentDetails({...valid,message:'Here is my code '+upperCode,type:'Donation'}),{code,amount:'3.00',currency:'USD',transactionId:'payment-one'});
});

test('numeric amount in payload is accepted and formatted',async()=>{
  const {paymentDetails}=await import('../cloudflare/routes/premium.mjs');
  assert.deepEqual(paymentDetails({...valid,amount:5.00,type:'Donation'}),{code,amount:'5.00',currency:'USD',transactionId:'payment-one'});
});

test('other Ko-fi event types and recurring tips do not qualify',async()=>{
  const {paymentDetails}=await import('../cloudflare/routes/premium.mjs');
  for(const type of ['Subscription','Commission','Shop Order','Unknown']) assert.equal(paymentDetails({...valid,type}),null);
  for(const is_subscription_payment of [true,undefined,'false']) assert.equal(paymentDetails({...valid,is_subscription_payment}),null);
});

test('private form-encoded dollar tip activates without retaining its message',async()=>{
  const {handleKofiWebhook}=await import('../cloudflare/routes/premium.mjs');
  let writes;
  const env={KOFI_VERIFICATION_TOKEN:'secret',DB:{prepare:sql=>({bind:(...args)=>({sql,args,first:async()=>({clerk_user_id:'owner'})})}),batch:async statements=>{writes=statements;}}};
  const data={...valid,amount:'1.00',is_public:false,message:'Private thank-you '+code};
  const response=await handleKofiWebhook(new Request('https://site/api/webhooks/kofi',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:JSON.stringify(data)})}),env);
  assert.equal(response.status,200);
  assert.deepEqual(writes[0].args.slice(0,4),['payment-one','owner','1.00','USD']);
  assert.equal(JSON.stringify(writes).includes('Private thank-you'),false);
});
test('Ko-fi secret and positive one-time payment required',async()=>{const {verifyKofi,paymentDetails}=await import('../cloudflare/routes/premium.mjs');assert.equal(verifyKofi(valid,'secret'),true);for(const token of ['', 'wrong',undefined])assert.equal(verifyKofi({...valid,verification_token:token},'secret'),false);assert.equal(verifyKofi(valid,''),false);assert.equal(paymentDetails(valid).amount,'3.00');assert.equal(paymentDetails({...valid,amount:'0.01'}).amount,'0.01');for(const changes of [{amount:'0'},{amount:'-3'},{amount:'Infinity'},{currency:''},{is_subscription_payment:true},{type:'Shop Order'},{message:null},{message:code+' SS-'+'b'.repeat(32)}])assert.equal(paymentDetails({...valid,...changes}),null);});
test('invalid notifications cannot write entitlements',async()=>{const {handleKofiWebhook}=await import('../cloudflare/routes/premium.mjs');let queries=0;const env={KOFI_VERIFICATION_TOKEN:'secret',DB:{prepare:()=>{queries++;throw Error('Unexpected database access');}}};for(const changes of [{verification_token:'fake'},{amount:'0'},{message:''}]){const r=await handleKofiWebhook(new Request('https://site/api/webhooks/kofi',{method:'POST',body:new URLSearchParams({data:JSON.stringify({...valid,...changes})})}),env);assert.ok([200,401].includes(r.status));}assert.equal(queries,0);});
test('verified payment upgrades recorded owner atomically without storing email',async()=>{const {handleKofiWebhook}=await import('../cloudflare/routes/premium.mjs');let batch;const env={KOFI_VERIFICATION_TOKEN:'secret',DB:{prepare:sql=>({bind:(...args)=>({sql,args,first:async()=>({clerk_user_id:'owner'})})}),batch:async statements=>{batch=statements;}}};const r=await handleKofiWebhook(new Request('https://site/api/webhooks/kofi',{method:'POST',body:new URLSearchParams({data:JSON.stringify({...valid,email:'private@example.test'})})}),env);assert.equal(r.status,200);assert.equal(batch.length,2);assert.deepEqual(batch[0].args.slice(0,4),['payment-one','owner','3.00','USD']);assert.match(batch[0].sql,/INSERT OR IGNORE/);assert.match(batch[1].sql,/FROM premium_payments WHERE transaction_id/);assert.equal(JSON.stringify(batch).includes('private@example.test'),false);});

test('currencies retain exact original amounts',async()=>{
 const {paymentDetails}=await import('../cloudflare/routes/premium.mjs');
 for(const [currency,amount] of [['BRL','1.00'],['EUR','0.01'],['JPY','1'],['KWD','0.001']]) assert.deepEqual(paymentDetails({...valid,currency,amount}),{code,amount,currency,transactionId:'payment-one'});
 for(const changes of [{currency:'usd'},{currency:null},{currency:'US'},{amount:'0.000000'},{amount:'1e3'},{amount:'-0.01'}]) assert.equal(paymentDetails({...valid,...changes}),null);
});
