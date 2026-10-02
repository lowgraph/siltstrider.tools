const {test}=require('node:test');
const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
const staged=require('./helpers/qa-staged-data.cjs');
test('in-game estimates round independently while route totals keep precise costs',async()=>{
  const {formatDuration}=await import('../lib/travel-walk.mjs');
  const {planRoute}=await import('../lib/travel-graph.mjs');
  const hours=[81.45/60,1.03/60,3];
  const graph={a:[{to:'b',hours:hours[0],price:0}],b:[{to:'c',hours:hours[1],price:0}],c:[{to:'d',hours:hours[2],price:15}],d:[]};
  const route=planRoute('a','d',graph,{objective:'time'});
  assert.equal(route.totals.hours,hours.reduce((a,b)=>a+b,0));
  assert.equal(formatDuration(route.totals.hours),'4 h 22 min');
  assert.deepEqual(route.steps.map(s=>formatDuration(s.hours)),['1 h 21 min','1 min','3 h']);
  const mismatch=[81.01/60,1.51/60,3];
  assert.equal(formatDuration(mismatch.reduce((a,b)=>a+b,0)),'4 h 23 min');
  assert.deepEqual(mismatch.map(formatDuration),['1 h 21 min','2 min','3 h']);
  const original=[80.51/60,1.51/60,3];
  assert.equal(formatDuration(original.reduce((a,b)=>a+b,0)),'4 h 22 min');
  assert.deepEqual(original.map(formatDuration),['1 h 21 min','2 min','3 h']);
});
test('minute boundaries, zero and unavailable estimates retain their meanings',async()=>{
  const {formatDuration}=await import('../lib/travel-walk.mjs');
  assert.equal(formatDuration(59.49/60),'59 min');assert.equal(formatDuration(59.5/60),'1 h');
  assert.equal(formatDuration(0),'no time');assert.equal(formatDuration(0.49/60),'no time');
  for(const value of [null,undefined,NaN,Infinity])assert.equal(formatDuration(value),'');
});
test('staged Old Ebonheart journey explains rounding beside distinct real movement estimates',staged.staged(),async()=>{
  const data=await (await staged.loader()).loadFeature('tr','travel');let route;
  const Component=(await load('components/calculators/travel/travel-workstation.jsx',{
    '../../character-context':{useActiveCharacter:()=>({build:{race:'Breton'},sheet:{attrs:{Speed:{v:40}},skills:{Athletics:{v:40}}},activeSave:null})},
    '../../shell-context':{useShell:()=>({world:'tr',profile:'tr'})},
    '../../account-settings-context':{useAccountSettings:()=>null},
    '../../use-game-data':{useGameData:()=>({status:'ready',data})},
    '../../use-search-intent':{useSearchIntent:()=>null},
    '../../active-character-link':()=>null,
    './travel-location-picker':()=>null,
    './transit-map':props=>{route=props.route;return null;}
  })).default;
  function Journey(){React.useState(()=>{window.history.replaceState(null,'','/travel?from=Seyda%20Neen&to=Old%20Ebonheart&plan=gold');global.localStorage=window.localStorage;return true;});return React.createElement(Component);}
  try{await mount(Journey,async()=>{
    assert.match(document.querySelector('.travel-time-rounding').textContent,/total uses unrounded leg times/);
    assert.match(document.querySelector('.travel-real-time').textContent,/real/i);
    assert.ok(document.querySelector('#travel-results').textContent.includes('in-game'));
    // Map receives the original route steps, not rounded display costs.
    assert.ok(route?.steps.length>0);
    assert.ok(route.steps.every(s=>Number.isFinite(s.hours)));
    console.log('SUS-02 staged precise leg hours:',JSON.stringify({hours:route.totals.hours,legs:route.steps.map(s=>s.hours)}));
  });}finally{delete global.localStorage;}
});
