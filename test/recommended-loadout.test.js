const {test}=require('node:test');
const assert=require('node:assert/strict');
const sword={key:'sword',name:'Sword',recordType:'WEAP',type:'LB1H'};
const shield={key:'shield',name:'Shield',type:'shield'};
test('early transfer copies actual primary picks and preserves other loadouts',async()=>{
 const {recommendedLoadouts}=await import('../lib/recommended-loadout.mjs');
 const other={id:'second',items:{}};
 const groups=[{label:'Primary weapon',rows:[{category:'weapon',primary:{key:'sword'}}]},{label:'Secondary viable option',rows:[{category:'weapon',primary:{key:'missing'}}]}];
 const result=recommendedLoadouts(groups,{Weapons:[sword]},{loadouts:[{id:'first'},other]});
 assert.equal(result[0].items.CarriedRight,sword);assert.equal(result[1],other);
});
test('late transfer resolves full item records and enforces two-hand conflicts',async()=>{
 const {recommendedLoadouts}=await import('../lib/recommended-loadout.mjs');
 const weapon={...sword,type:'LB2H'};
 const groups=[{rows:[{slotKey:'shield',picks:[{pick:{item:'shield'}}]},{slotKey:'weapon',picks:[{pick:{item:'sword'}}]}]}];
 const result=recommendedLoadouts(groups,{Weapons:[weapon],Armor:[shield]},{},{late:true});
 assert.equal(result[0].items.CarriedRight,weapon);assert.equal(result[0].items.CarriedLeft,undefined);
});
test('missing or empty recommendations refuse to overwrite a loadout',async()=>{
 const {recommendedLoadouts}=await import('../lib/recommended-loadout.mjs');
 assert.throws(()=>recommendedLoadouts([],{},{}),/No eligible/);
 assert.throws(()=>recommendedLoadouts([{label:'Primary weapon',rows:[{category:'weapon',primary:{key:'missing'}}]}],{},{}),/missing from this profile/);
});
