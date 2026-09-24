const {test}=require('node:test');const assert=require('node:assert/strict');
test('Recall removes illegal target range, magnitude, duration and area',async()=>{
 const {allowedRanges,effectDraft}=await import('../lib/effect-editor.mjs');
 const effect={castSelf:true,castTarget:false,castTouch:false,mag:0,dur:0};
 assert.deepEqual(allowedRanges(effect),['self']);
 const draft=effectDraft({range:'target',min:40,max:50,dur:30,area:100},effect);
 assert.equal(draft.range,'self');assert.equal(draft.area,0);assert.equal(draft.dur,1);assert.equal(draft.max,1);
});
test('attribute and skill targets are checked against catalogs',async()=>{
 const {effectDraft}=await import('../lib/effect-editor.mjs');const catalogs={Attributes:[{id:'strength'}],Skills:[{id:'2'},{id:'3'}]};
 assert.equal(effectDraft({target:'missing'},{targetsAttribute:true},catalogs).target,'strength');
 assert.equal(effectDraft({target:'3'},{targetsSkill:true},catalogs).target,'3');
 assert.equal(effectDraft({target:'strength'},{targetsSkill:true},catalogs).target,'2');
});
test('constant effects clear area and duration; unknown range flags grant no permissions',async()=>{
 const {allowedRanges,effectDraft}=await import('../lib/effect-editor.mjs');
 assert.deepEqual(allowedRanges({castSelf:null}),[]);
 const draft=effectDraft({range:'target',min:20,max:5,dur:40,area:30},{mag:1,dur:1,castTarget:true},{},true);
 assert.equal(draft.range,'self');assert.equal(draft.max,20);assert.equal(draft.dur,1);assert.equal(draft.area,0);
});
