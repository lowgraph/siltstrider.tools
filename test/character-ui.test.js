const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const Module=require('node:module');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot}=require('react-dom/client');
const {act}=React;
function component(file){
 const result=require('esbuild').buildSync({entryPoints:[path.resolve(file)],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
 const m=new Module(path.resolve(file),module);m.paths=module.paths;m._compile(result.outputFiles[0].text,path.resolve(file));return m.exports.default;
}
test('React builder locks preset fields, names every dropdown, and enables custom edits',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const Configurator=component('components/character-builder/configurator.jsx');
 const root=createRoot(document.getElementById('root'));
 const build={race:'Breton',className:'Mage',gender:'Male',sign:'The Mage',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['A','B','C','D','E'],min:['F','G','H','I','J']};
 const catalogs={races:{Breton:{}},classes:{Mage:{}},signs:{'The Mage':{}},specSkills:{Combat:[],Magic:['A','B','C','D','E','F','G','H','I','J'],Stealth:[]}};
 const props={build,catalogs,onUpdateField(){},onSwapSkill(){},onSelectClassPreset(){}};
 try{
  await act(async()=>root.render(React.createElement(Configurator,props)));
  const selects=[...document.querySelectorAll('select')];
  assert.equal(selects.length,16);
  assert.ok(selects.every(el=>el.getAttribute('aria-label')));
  assert.equal(selects.filter(el=>el.disabled).length,13);
  await act(async()=>root.render(React.createElement(Configurator,{...props,build:{...build,className:'Custom'}})));
  assert.equal(document.querySelectorAll('select:disabled').length,0);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});
test('React gear results clear on character changes and endgame follows theft',async()=>{
 const dom=new JSDOM('<div id="root"></div><input id="gear-steal" type="checkbox" checked><input id="gear-endgame" type="checkbox"><button id="btn-gear"></button><div id="gear-box"></div>',{url:'http://localhost/'});
 global.window=dom.window;global.document=dom.window.document;global.Event=dom.window.Event;global.MutationObserver=dom.window.MutationObserver;global.IS_REACT_ACT_ENVIRONMENT=true;
 const Gear=component('components/character-builder/gear-advisor.jsx');
 const root=createRoot(document.getElementById('root'));
 document.getElementById('btn-gear').onclick=()=>document.getElementById('gear-box').innerHTML='<p>Argonian equipment</p>';
 try{
  await act(async()=>root.render(React.createElement(Gear,{build:{race:'Argonian'}})));
  await act(async()=>document.querySelector('#root button').click());
  assert.match(document.getElementById('root').textContent,/Argonian equipment/);
  await act(async()=>root.render(React.createElement(Gear,{build:{race:'Breton'}})));
  assert.doesNotMatch(document.getElementById('root').textContent,/Argonian equipment/);
  assert.equal(document.getElementById('gear-box').innerHTML,'');
  const [steal,endgame]=document.querySelectorAll('#root input');
  await act(async()=>endgame.click());assert.equal(document.getElementById('gear-endgame').checked,true);
  await act(async()=>steal.click());assert.equal(endgame.disabled,true);assert.equal(endgame.checked,false);
  await act(async()=>steal.click());assert.equal(endgame.disabled,false);assert.equal(endgame.checked,true);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});
