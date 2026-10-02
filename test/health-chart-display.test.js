const {test}=require('node:test'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {JSDOM}=require('jsdom');
const {HealthGrowthChart}=require('./helpers/qa-render.cjs');
const character={level:1,health:35,attributes:{Strength:40,Intelligence:40,Willpower:40,Agility:40,Speed:50,Endurance:10,Personality:40,Luck:40},skills:{},maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
test('QA-27 removes arithmetic noise and unnecessary decimal zeroes',async()=>{
  const {formatHealth}=await import('../lib/chart-scale.mjs');
  for(const value of [208.00000000000003,208,0,-0])assert.equal(formatHealth(value),String(Math.round(value)));
});
test('QA-27 keeps fractional gains and rounds only displayed values to one decimal',async()=>{
  const {formatHealth}=await import('../lib/chart-scale.mjs');
  assert.deepEqual([3.5,57.5,208.14,208.16,0.06].map(formatHealth),['3.5','57.5','208.1','208.2','0.1']);
});
test('QA-27 unavailable values do not masquerade as zero or print NaN',async()=>{
  const {formatHealth}=await import('../lib/chart-scale.mjs');
  for(const value of [null,undefined,NaN,Infinity,-Infinity,'35'])assert.equal(formatHealth(value),'—');
});
test('QA-27 actual chart labels, endpoints, accessible summary and table share formatting while math stays precise',async()=>{
  const {calculateHealthGrowthCurve}=await import('../lib/level-math.mjs');
  const before=calculateHealthGrowthCurve(character,55,{}),raw=before.delayedHealth.at(-1);
  assert.equal(raw,208.00000000000003);
  const dom=new JSDOM(renderToStaticMarkup(React.createElement(HealthGrowthChart,{character,targetLevel:55,catalogs:{}})));
  try{assert.match(dom.window.document.body.textContent,/Delayed Endurance: 208 HP/);
    const walker=dom.window.document.createTreeWalker(dom.window.document.body,dom.window.NodeFilter.SHOW_TEXT);
    while(walker.nextNode())assert.doesNotMatch(walker.currentNode.textContent,/\d+\.\d{2,}/);
    assert.doesNotMatch(dom.window.document.querySelector('svg').getAttribute('aria-label'),/\d+\.\d{2,}/);
    assert.equal(dom.window.document.querySelector('tbody tr:last-child td:last-child').textContent,'208');
    assert.deepEqual(calculateHealthGrowthCurve(character,55,{}),before);
  }finally{dom.window.close();}
});
