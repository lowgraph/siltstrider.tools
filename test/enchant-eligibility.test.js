const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=()=>import('../lib/enchant-eligibility.mjs');
test('FLOW-01 apparel excludes strike and respects the constant soul boundary',async()=>{
  const {eligibleEnchantTypes:types,enchantItemKind:kind}=await api();
  for(const type of ['Jewelry','Clothing','Shield','Armor']) {
    assert.deepEqual(types(kind({type}),399),['used']);
    assert.deepEqual(types(kind({type}),400),['used','const']);
  }
  assert.deepEqual(types('apparel',NaN),['used']);
  assert.deepEqual(types('apparel',500,600),['used']);
});
test('FLOW-01 weapon classes follow OpenMW strike, used and constant eligibility',async()=>{
  const {eligibleEnchantTypes:types}=await api();
  assert.deepEqual(types('melee',400),['used','strike','const']);
  assert.deepEqual(types('ranged',400),['used','const']);
  assert.deepEqual(types('thrown',400),['strike']);
  assert.deepEqual(types('ammo',400),['strike']);
  assert.deepEqual(types('book',400),['once']);
});
test('FLOW-01 changing kinds or souls normalizes stale styles; custom and unknown kinds are explicit',async()=>{
  const {eligibleEnchantTypes:types,enchantItemKind:kind,validEnchantType:valid}=await api();
  assert.equal(valid('strike',types('apparel',400)),'used');
  assert.equal(valid('const',types('melee',399)),'used');
  assert.equal(valid('used',types('ammo',400)),'strike');
  assert.equal(kind({type:'Custom'}),'apparel');
  assert.equal(kind({type:'Custom'},'ranged'),'ranged');
  assert.equal(valid('strike',types(kind(null),400)),null);
});
