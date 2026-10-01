const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loader,staged} = require('./helpers/qa-staged-data.cjs');
const attrs = {Strength:40,Intelligence:40,Willpower:20,Agility:40,Speed:40,Endurance:30,Personality:80,Luck:40};
const state = (extra={}) => ({level:1,attributes:{...attrs},skills:{Alchemy:35},health:35,magicka:67,fatigue:140,magMult:0.5,maj:[...build.maj],min:[...build.min],...extra});
const build = {race:'Dark Elf',gender:'Female',sign:'The Tower',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
async function catalogs(profile='vanilla') {
  const l=await loader();const {adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs');
  return adaptCharacterCatalogs(await l.loadFeature(profile,'character'),await l.loadCatalog(profile,'Spells'));
}
for(const health of [0,35,67.5]) test(`QA-04 normalized state survives catalogs and repeat normalization at Health ${health}`,staged(),async()=>{
  const {normalizeCharacterState,calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const c=await catalogs(),raw=state({level:12,health});
  const normalized=normalizeCharacterState(raw,c);
  assert.deepEqual(normalizeCharacterState(normalized,c),normalized);
  assert.deepEqual(normalized.attributes,raw.attributes);assert.equal(normalized.health,health);
  assert.equal(normalized.magicka,67);assert.equal(normalized.fatigue,140);assert.equal(normalized.magMult,0.5);
  const curve=calculateHealthGrowthCurve(normalized,14,c);
  assert.equal(curve.levels[0],12);assert.equal(curve.optimalHealth[0],health);assert.equal(curve.delayedHealth[0],health);
});
test('QA-04 Bitter Cup is applied once and a complete unchanged one-step plan retains Health',staged(),async()=>{
  const {normalizeCharacterState,simulateProgression,calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const c=await catalogs(),base=normalizeCharacterState(state(),c);
  const cup=normalizeCharacterState(base,c,{bitterCup:true});
  assert.equal(cup.attributes.Personality,100);assert.equal(cup.attributes.Willpower,0);
  assert.equal(cup.health,35);assert.deepEqual(normalizeCharacterState(cup,c,{bitterCup:true}),cup);
  const ordinary=simulateProgression(base,{targetLevel:2,catalogs:c});
  const changed=simulateProgression(cup,{targetLevel:2,catalogs:c});
  assert.deepEqual(changed.steps[0].attributeBonuses,ordinary.steps[0].attributeBonuses);
  assert.equal(changed.finalState.health,38.5);assert.equal(changed.finalState.health,ordinary.finalState.health);
  assert.deepEqual(calculateHealthGrowthCurve(cup,2,c).optimalHealth,[35,38.5]);
});
test('QA-03 Strength and Bitter Cup Endurance changes never recalculate starting Health',async()=>{
  const {normalizeCharacterState,applyLevelStep}=await import('../lib/level-math.mjs');
  const base=normalizeCharacterState(state({attributes:{...attrs,Endurance:80,Personality:40},health:53.5}));
  const cup=normalizeCharacterState(base,undefined,{bitterCup:true});
  assert.equal(cup.attributes.Endurance,100);assert.equal(cup.health,53.5);
  const step=applyLevelStep(cup,{attributeBonuses:[{attribute:'Strength',bonus:5}],majorMinorIncreases:{},miscTraining:[]});
  assert.equal(step.health,63.5);assert.equal(step.lastStep.healthGain,10);
});
test('QA-03 five actual level steps retain 22.5 gained Health without a new base half',async()=>{
  const {normalizeCharacterState,applyLevelStep}=await import('../lib/level-math.mjs');
  let current=normalizeCharacterState(state());
  for(const expectedEndurance of [35,40,45,50,55]) {
    current=applyLevelStep(current,{attributeBonuses:[{attribute:'Endurance',bonus:5},{attribute:'Strength',bonus:5}],majorMinorIncreases:{},miscIncreases:{}});
    assert.equal(current.attributes.Endurance,expectedEndurance);assert.equal(current.lastStep.healthGain,expectedEndurance/10);
  }
  assert.equal(current.health,57.5);assert.equal(current.level,6);
});
for(const [endurance,start,max] of [[30,1,15],[95,8,9],[100,3,3]]) test(`QA-04 Endurance ${endurance} reaches 100 at level ${max}`,async()=>{
  const {calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const curve=calculateHealthGrowthCurve(state({level:start,attributes:{...attrs,Endurance:endurance}}),20);
  assert.equal(curve.enduranceMaxLevel,max);assert.equal(curve.optimalEndurance[0],endurance);
});
for(const profile of ['vanilla','tr','tr_arce']) test(`QA-03 Bitter Cup keeps creation Health in ${profile}`,staged(),async()=>{
  const {computeSheet}=await import('../lib/character-math.mjs');const c=await catalogs(profile);
  const options={...build,sign:'The Lady',fav1:'Endurance',fav2:'Strength'};
  const ordinary=computeSheet(options,c),cup=computeSheet({...options,bitterCup:true},c);
  assert.equal(cup.bitterCup.highest,'Endurance');assert.ok(cup.attrs.Endurance.v>ordinary.attrs.Endurance.v);
  assert.equal(cup.health,ordinary.health);assert.equal(cup.strForHp,ordinary.strForHp);assert.equal(cup.endForHp,ordinary.endForHp);
});
