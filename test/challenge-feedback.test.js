const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
async function fixture(check){
  const actions={};let currentRun;let profile='vanilla';
  const noop=()=>null;
  const Component=(await load('components/challenge-runs/challenge-runs-root.jsx',{
    '../shell-context':{useShell:()=>({world:profile==='vanilla'?'vanilla':'tr',profile,setProfile:p=>profile=p})},
    '../character-context':{useActiveCharacter:()=>({catalogs:{},setBuild(){},clearSave(){}})},
    '../challenge-run-context':{useChallengeRun:()=>{
      const [run,setRun]=React.useState({seed:'',rests:[],minors:[]});currentRun=run;
      return {run,setRun,locks:{},setLocks(){},settings:{preset:'standard',restrictionCount:'3',objectiveCount:'2',allowedBands:{Easy:true,Medium:true}},updateSettings(){},restorePreferred(){}};
    }},
    './seed-bar':{__esModule:true,default:p=>{actions.load=p.onApplySeed;return React.createElement('p',{id:'feedback'},p.seedError)}},
    './run-configurator':{__esModule:true,default:p=>{actions.generate=p.onGenerateRun;return null}},
    './run-summary-sheet':{__esModule:true,default:noop},'./pool-browser-modal':{__esModule:true,default:noop}
  })).default;
  await mount(Component,async(root)=>check(actions,()=>currentRun,root,Component));
}
test('UI-03 successful generation clears an invalid-seed alert',()=>fixture(async(a,run)=>{
  await React.act(async()=>a.load('NOT-A-VALID-SEED'));assert.match(document.querySelector('#feedback').textContent,/not a Silt Strider seed/);
  await React.act(async()=>a.generate());assert.equal(document.querySelector('#feedback').textContent,'');assert.ok(run().seed);
}));
test('UI-03 a valid same-world load clears feedback and preserves deterministic seed',()=>fixture(async(a,run)=>{
  await React.act(async()=>a.load('garbage'));
  await React.act(async()=>a.load('K7Q2M-VANILLA-EM-R3O2'));
  assert.equal(document.querySelector('#feedback').textContent,'');assert.equal(run().seed,'K7Q2M-VANILLA-EM-R3O2');
}));
test('UI-03 repeated bad input still reports an error after a successful roll',()=>fixture(async(a,run)=>{
  await React.act(async()=>a.generate());const seed=run().seed;
  for(const text of ['bad','NOT-A-VALID-SEED']){await React.act(async()=>a.load(text));assert.match(document.querySelector('#feedback').textContent,/not a Silt Strider seed/);assert.equal(run().seed,seed);}
  await React.act(async()=>a.load('K7Q2M-TR-EM-R3O2'));assert.equal(document.querySelector('#feedback').textContent,'');
}));
