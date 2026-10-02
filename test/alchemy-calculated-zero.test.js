const {test}=require('node:test');const assert=require('node:assert/strict');
const effects=[{id:'75',n:'Restore Health',b:1,mag:1,dur:1,supported:true}];
const ingredients=[{id:'a',effects},{id:'b',effects}];
const calculate=async extra=>(await import('../lib/alchemy-math.mjs')).calculatePotion({ingredients,alchemySkill:0,intelligence:0,luck:0,...extra});
test('UI-04 a calculated zero has a zero chance without claiming a usable potion',async()=>{
  const zero=await calculate();assert.equal(zero.isCalculated,true);assert.equal(zero.brewChance,0);assert.equal(zero.isValid,false);assert.deepEqual(zero.effects,[]);assert.match(zero.message,/round to zero/);
  const positive=await calculate({alchemySkill:50});assert.equal(positive.isCalculated,true);assert.equal(positive.isValid,true);assert.equal(positive.brewChance,50);
});
test('UI-04 incomplete, unmatched and duplicate selections are not calculated results',async()=>{
  for(const selection of [[],[ingredients[0]],[ingredients[0],{id:'c',effects:[]}],[ingredients[0],ingredients[0]]])assert.equal(Boolean((await calculate({ingredients:selection})).isCalculated),false);
});
test('UI-04 unavailable rules, bad settings and invalid stats never become calculated zero',async()=>{
  for(const extra of [{settings:null},{mortarQuality:0},{luck:NaN},{ingredients:ingredients.map(i=>({...i,effects:[{...effects[0],supported:false}]}))}]){
    const result=await calculate(extra);assert.equal(result.isValid,false);assert.equal(Boolean(result.isCalculated),false);
  }
});
