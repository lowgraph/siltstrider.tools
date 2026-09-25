const {test}=require('node:test');const assert=require('node:assert/strict');
for(const [label,target,start,cap,want] of [['mode change',100,1,74,74],['imported start',20,30,60,30],['nonfinite',Infinity,4,100,4]]) test(label,async()=>{const {boundedLevel}=await import('../lib/level-bounds.mjs');assert.equal(boundedLevel(target,start,cap),want);});
