const {test}=require('node:test');
const assert=require('node:assert/strict');
const sheet={level:1,attrs:Object.fromEntries(['Strength','Intelligence','Willpower','Agility','Speed','Endurance','Personality','Luck'].map(a=>[a,{v:40}])),skills:{},health:40,magicka:40,fatigue:160};
const manual={attributeBonuses:[{attribute:'Strength',bonus:5},{attribute:'Intelligence',bonus:5},{attribute:'Luck',bonus:1}],majorMinorIncreases:{},miscIncreases:{}};
test('manual picks replace a level and flow into later automatic levels',async()=>{
 const {simulateProgression}=await import('../lib/level-math.mjs');
 const result=simulateProgression(sheet,{mode:'stats_only',targetLevel:3,manualSteps:{1:manual}});
 assert.deepEqual(result.steps[0].attributeBonuses.map(({attribute,bonus})=>({attribute,bonus})),manual.attributeBonuses);
 assert.equal(result.steps[0].attributeBonuses[0].endValue,45);
 assert.equal(result.steps[0].stateAfter.attributes.Luck,41);
 assert.equal(result.steps[0].healthGain,4);
 assert.ok(result.finalState.attributes.Luck>=41);assert.equal(result.finalState.level,3);
});
test('manual override validation rejects duplicate attributes',async()=>{
 const {simulateProgression}=await import('../lib/level-math.mjs');
 assert.throws(()=>simulateProgression(sheet,{mode:'stats_only',targetLevel:2,manualSteps:{1:{...manual,attributeBonuses:[manual.attributeBonuses[0],manual.attributeBonuses[0],manual.attributeBonuses[2]]}}}));
});
test('future manual overrides do not change an earlier target',async()=>{
 const {simulateProgression}=await import('../lib/level-math.mjs');
 const options={mode:'stats_only',targetLevel:2};
 assert.deepEqual(simulateProgression(sheet,{...options,manualSteps:{9:manual}}),simulateProgression(sheet,options));
});
