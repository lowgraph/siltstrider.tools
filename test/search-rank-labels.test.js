const {test}=require('node:test');const assert=require('node:assert/strict');
async function label(extra={}){const {factionEntries}=await import('../lib/site-search.mjs');return factionEntries([{key:'twin lamps',name:'Twin Lamps',...extra}])[0].subtitle;}
test('SS-10 exactly one catalog rank is singular',async()=>{assert.equal(await label({ranks:[{name:'Brother'}]}),'1 rank');});
test('SS-10 zero or missing ranks use the plural zero count',async()=>{assert.equal(await label({ranks:[]}), '0 ranks');assert.equal(await label(),'0 ranks');});
test('SS-10 multiple ranks and fallback counts use correct labels',async()=>{assert.equal(await label({ranks:[{},{}]}),'2 ranks');assert.equal(await label({rankCount:1}),'1 rank');assert.equal(await label({rankCount:10}),'10 ranks');for(const rankCount of [-1,NaN,1.5,'unknown'])assert.equal(await label({rankCount}),'0 ranks');});
