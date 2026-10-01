require('./helpers/pending-game-data.cjs');
const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');const {JSDOM}=require('jsdom');
const {createRoot}=require('react-dom/client');const {Premades}=require('./helpers/qa-render.cjs');
for(const profile of ['vanilla','tr','tr_arce']) for(const mode of ['By Playstyle','By Race']) test(`QA-12 explanations and unchanged build selection: ${profile} ${mode}`,async()=>{
 const {BUILDS,RACE_BUILDS,ARCE_BUILDS}=await import('../lib/premade-data.mjs');
 const expected=mode==='By Playstyle'?BUILDS:profile==='tr_arce'?[...RACE_BUILDS,...ARCE_BUILDS]:RACE_BUILDS;
 const before=JSON.stringify(expected),dom=new JSDOM('<div id="root"></div>');Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const root=createRoot(document.getElementById('root'));let selected;
 const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label);
 try{
  await React.act(async()=>root.render(React.createElement(Premades,{activeProfile:profile,onSelectBuild:b=>selected=b})));
  await React.act(async()=>button(mode).click());await React.act(async()=>button('Expand All').click());
  const cards=[...document.querySelectorAll('.premade-build-card')];assert.equal(cards.length,expected.length);
  for(const card of cards){assert.match(card.querySelector('.premade-plays').textContent,/Plays like: .+/);assert.match(card.querySelector('.premade-tradeoff').textContent,/Trade-off: .+/);assert.match(card.textContent,/Major skills:/);assert.match(card.textContent,/Minor skills:/);assert.match(card.textContent,/Specialization:.*start higher and improve faster/);assert.doesNotMatch(card.textContent,/\bMaj:|\bMin:/);}
  await React.act(async()=>cards[0].querySelector('button').click());assert.deepEqual(selected,expected.find(b=>b.name===selected.name),'loading preserves every original premade choice');assert.equal(JSON.stringify(expected),before);
  await React.act(async()=>button('Collapse All').click());assert.equal(document.querySelectorAll('.premade-build-card').length,0);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
for(const [label,build]of [['missing',null],['unknown',{cat:'unlisted',maj:null}],['frozen',Object.freeze({cat:'Archer',maj:'Marksman',sign:'The Atronach'})]])test(`QA-12 presentation copy handles ${label} without changing choices`,async()=>{
 const {premadeCopy}=await import('../lib/premade-copy.mjs');const before=JSON.stringify(build),copy=premadeCopy(build);assert.ok(copy.plays&&copy.tradeoff);assert.equal(JSON.stringify(build),before);
});
