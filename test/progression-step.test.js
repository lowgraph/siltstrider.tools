const {test}=require('node:test');const assert=require('node:assert/strict');
const plan={initialSheet:{level:4,health:50},steps:[{nextLevel:5,stateAfter:{health:55}},{nextLevel:6,stateAfter:{health:61}}]};
for(const [index,level,health] of [[0,4,50],[1,5,55],[2,6,61],[99,6,61],[-1,4,50]])test('step cursor '+index,async()=>{
 const {progressionState}=await import('../lib/progression-step.mjs');const state=progressionState(plan,index);assert.equal(state.level,level);assert.equal(state.health,health);
});
