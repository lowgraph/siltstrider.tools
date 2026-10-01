require('./helpers/pending-game-data.cjs');
const {test}=require('node:test');const assert=require('node:assert/strict');const React=require('react');
const {renderToString}=require('react-dom/server');const {hydrateRoot}=require('react-dom/client');const {JSDOM}=require('jsdom');
const {CharacterProvider,useActiveCharacter,ShellProvider,Sheet,HomeHero,ProgressionSheet}=require('./helpers/qa-render.cjs');const {loader}=require('./helpers/qa-staged-data.cjs');
test('QA-05 hydrated random-premade sheet labels the old title as a source after race/sign edits',async()=>{
  const l=await loader(),{adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs'),{computeSheet}=await import('../lib/character-math.mjs');
  const catalogs=adaptCharacterCatalogs(await l.loadFeature('vanilla','character'),await l.loadCatalog('vanilla','Spells'));
  const {characterSummary}=await import('../lib/home-data.mjs');const {normalizeCharacterState}=await import('../lib/level-math.mjs');
  let character;
  function Probe(){character=useActiveCharacter();const sheet=computeSheet(character.build,catalogs),state=normalizeCharacterState(sheet,catalogs);return React.createElement(React.Fragment,null,
    React.createElement(Sheet,{build:character.build,sheet,catalogs}),
    React.createElement(HomeHero,{character:characterSummary(character.build,sheet),profile:'vanilla',profileLabel:'Vanilla',ready:false}),
    React.createElement(ProgressionSheet,{character:character.build,currentState:state,initialSheet:state,mode:'stats_only',catalogs,targetLevel:2}));}
  const tree=()=>React.createElement(ShellProvider,null,React.createElement(CharacterProvider,null,React.createElement(Probe)));
  delete global.window;delete global.document;const html=renderToString(tree());const dom=new JSDOM('<div id="root">'+html+'</div>',{url:'http://localhost/builder'});
  Object.assign(global,{window:dom.window,document:dom.window.document,Event:dom.window.Event,IS_REACT_ACT_ENVIRONMENT:true});
  const realRandom=Math.random;Math.random=()=>0;let root;const errors=[];
  try {
    await React.act(async()=>{root=hydrateRoot(document.getElementById('root'),tree(),{onRecoverableError:e=>errors.push(String(e))});});
    assert.deepEqual(errors,[],'shell ready:false and deterministic first render hydrate cleanly');
    const source=character.build.name;assert.ok(source,'fresh draw selected a premade');
    await React.act(async()=>{character.updateField('race','Breton');character.updateField('gender','Female');character.updateField('sign','The Tower');});
    const heading=document.querySelector('.character-sheet h3').textContent;
    assert.match(heading,/Female Breton.*The Tower/);
    assert.ok(!heading.includes(source)||/source|based on|adapted from/i.test(heading),'retained premade name is explicitly a source: '+heading);
    assert.equal(document.getElementById('home-character-name').textContent,`Based on ${source}`);
    assert.equal(document.querySelector('.progression-sheet h3 > span').textContent,`Based on ${source}`);
    assert.match(document.querySelector('.progression-sheet h3').parentElement.textContent,/Female Breton.*The Tower/);
    assert.match(document.querySelector('.home-character-line').textContent,/Female Breton.*The Tower/);
    assert.deepEqual(errors,[],'edits preserve clean hydration');
  } finally {Math.random=realRandom;await React.act(async()=>root?.unmount());dom.window.close();}
});
