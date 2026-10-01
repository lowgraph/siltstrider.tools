const {test} = require('node:test');
const assert = require('node:assert/strict');
const {todo,loader} = require('./helpers/qa-staged-data.cjs');
const effect = (extra={}) => ({effect:{b:1,mag:1,dur:1},min:5,max:5,dur:5,area:0,range:'self',...extra});
// Pinned OpenMW 0.51 getEffectCosts/getEnchantPoints: each cost is cumulative;
// capacity adds each floor. Area has a minimum of one even for Self/Constant.
const pointCases = [
  ['one Constant effect', [effect()], 'const',25],
  ['two Constant effects', [effect(),effect()], 'const',75],
  ['three Constant effects', [effect(),effect(),effect()], 'const',150],
  ['Target followed by Self', [effect({range:'target'}),effect()], 'used',4],
  ['area 20 followed by area 10', [effect({range:'target',area:20}),effect({range:'touch',area:10})], 'used',6]
];
for(const [name,rows,type,expected] of pointCases) test(`QA-01 accumulated points: ${name}`,async()=>{
  const {calcEnchantmentTotalPoints}=await import('../lib/enchant-math.mjs');assert.equal(calcEnchantmentTotalPoints(rows,type),expected);
});
for(const [name,row,expected] of [
  ['Common Ring Target',effect({range:'target'}),1],
  ['Target area 20',effect({range:'target',area:20}),2],
  ['Target magnitude 2 duration 20',effect({min:2,max:2,dur:20,range:'target'}),3],
  ['Self magnitude 5 duration 10',effect({dur:10}),2]
]) test(`QA-02 per-effect floor: ${name}`,async()=>{
  const {calcEnchantmentTotalPoints}=await import('../lib/enchant-math.mjs');assert.equal(calcEnchantmentTotalPoints([row]),expected);
});
test('QA-02 chance uses OpenMW skill + 0.2 Intelligence + 0.1 Luck, points multiplier 3 and truncation',async()=>{
  const {calcSelfEnchantChance}=await import('../lib/enchant-math.mjs');
  // Full fatigue (1.25), one point, no constant multiplier.
  assert.equal(calcSelfEnchantChance(10,40,40,1),23);
  assert.equal(calcSelfEnchantChance(50,40,40,1),73);
  assert.equal(calcSelfEnchantChance(50,40,40,4),62);
});
test('QA-02 base price truncates the final running cost and has no Constant price multiplier',async()=>{
  const {calcEnchantGoldCost}=await import('../lib/enchant-math.mjs');
  assert.equal(calcEnchantGoldCost(1.9125,'used'),1912);
  assert.equal(calcEnchantGoldCost(50.05,'const'),50050);
  assert.equal(calcEnchantGoldCost(1.5,'used'),1500);
});
for(const endurance of [35,45,55]) test(`QA-03 fractional Health: Endurance ${endurance}`,async()=>{
  const {calculateHealthGain}=await import('../lib/level-math.mjs');assert.equal(calculateHealthGain(endurance),endurance/10);
});
test('QA-03 five level gains preserve 22.5 Health',async()=>{
  const {calculateHealthGain}=await import('../lib/level-math.mjs');assert.equal([35,40,45,50,55].reduce((sum,e)=>sum+calculateHealthGain(e),0),22.5);
});
async function character() {
  const l=await loader();const {adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs');
  const catalogs=adaptCharacterCatalogs(await l.loadFeature('vanilla','character'),await l.loadCatalog('vanilla','Spells'));
  const {computeSheet}=await import('../lib/character-math.mjs');
  const build={race:'Dark Elf',gender:'Female',sign:'The Tower',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
  return {catalogs,build,sheet:computeSheet(build,catalogs)};
}
for(const hp of [35,45,67.5]) test(`QA-04 chart starts at character Health ${hp}`,async()=>{
  const {catalogs,sheet}=await character();const {normalizeCharacterState,calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const normalized=normalizeCharacterState({...sheet,health:hp},catalogs);const chart=calculateHealthGrowthCurve(normalized,20,catalogs);assert.equal(chart.optimalHealth[0],hp);
});
test('QA-04 Endurance 30 takes fourteen +5 steps to level 15',async()=>{
  const {catalogs,sheet}=await character();const {normalizeCharacterState,calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const chart=calculateHealthGrowthCurve(normalizeCharacterState(sheet,catalogs),20,catalogs);assert.equal(chart.optimalEndurance[0],30);assert.equal(chart.enduranceMaxLevel,15);
});
test('QA-04 Bitter Cup outside Strength/Endurance leaves one-step Health forecast alone',async()=>{
  const {catalogs,sheet}=await character();const {normalizeCharacterState,calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const raw={...sheet,attrs:{...sheet.attrs,Personality:{v:80},Willpower:{v:20}}};
  const base=normalizeCharacterState(raw,catalogs);
  const ordinary=calculateHealthGrowthCurve(base,2,catalogs);
  const cup=calculateHealthGrowthCurve(base,2,catalogs,{bitterCup:true});
  assert.deepEqual(cup.optimalHealth,ordinary.optimalHealth);assert.deepEqual(cup.delayedHealth,ordinary.delayedHealth);
});
test('QA-05 Simulator sheet keeps configured race, gender and birthsign',async()=>{
  const {catalogs,build}=await character();const {computeSheet}=await import('../lib/character-math.mjs');const {normalizeCharacterState}=await import('../lib/level-math.mjs');
  const n=normalizeCharacterState(computeSheet({...build,race:'Breton'},catalogs),catalogs);
  assert.deepEqual([n.race,n.gender,n.sign],['Breton','Female','The Tower']);
});
