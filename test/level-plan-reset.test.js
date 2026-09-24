const {test}=require('node:test');
const assert=require('node:assert/strict');
for (const level of [1,4,100]) test('stats-only target reset retains planning range at level '+level,async()=>{
 const {simulateProgression}=await import('../lib/level-math.mjs');
 const sheet={level,attrs:{Strength:{v:40},Intelligence:{v:40},Willpower:{v:40},Agility:{v:40},Speed:{v:40},Endurance:{v:40},Personality:{v:40},Luck:{v:40}},skills:{},health:40,magicka:40,fatigue:160};
 const reset=simulateProgression(sheet,{mode:'stats_only',targetLevel:level});
 assert.equal(reset.levelCap,100);assert.equal(reset.steps.length,0);
});

