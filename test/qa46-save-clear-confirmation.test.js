const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {React,load}=require('./helpers/launch-render.cjs');
const {JSDOM}=require('jsdom');
const {createRoot}=require('react-dom/client');
const active={token:1,profile:'tr_arce',save:{identity:{name:'QA – Loaded traveller',level:3}}};
const action=label=>[...(document.querySelector('[role=alertdialog]')||document).querySelectorAll('button')].find(b=>b.textContent.trim()===label);
const click=b=>React.act(async()=>b.click());
const key=key=>React.act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})));

async function mount(check,{home=false,importer=true,save=active}={}) {
  const dom=new JSDOM('<main id="main-content" tabindex="-1"><div id="root"></div></main>',{url:'http://localhost/'});
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const storage=window.localStorage;storage.setItem('silt-active-save','original kept copy');storage.setItem('unrelated','keep');
  let current=save,clears=0,render;
  const clear=()=>{clears++;current=null;storage.removeItem('silt-active-save');render();};
  const hookPath='components/character-vault/use-save-clear-confirmation.jsx';
  const hook=fs.existsSync(hookPath)?await load(hookPath,{'../confirmation-dialog':await load('components/confirmation-dialog.jsx',{'./use-modal-dialog':await load('components/use-modal-dialog.js')})}):{};
  const Component=(await load(home?'components/home-hub/home-save-drop.jsx':'components/character-vault/save-import-notice.jsx',{
    '../character-context':{useActiveCharacter:()=>({activeSave:current,clearSave:clear})},
    './use-save-clear-confirmation':hook,'../character-vault/use-save-clear-confirmation':hook,
    '../compatibility-notice':{__esModule:true,default:()=>null},
  })).default;
  const root=createRoot(document.getElementById('root'));
  render=()=>root.render(React.createElement('div',{className:importer?'open-save-panel':undefined},
    importer&&React.createElement('button',{'data-open-save-file':true},'Open Save File…'),
    React.createElement(Component,home?{activeSave:current,onClear:clear,onLoad:()=>{},onNavigate:()=>{},ready:true}:{})));
  try {
    await React.act(async()=>render());
    await check({storage,clears:()=>clears,current:()=>current,replace:async next=>React.act(async()=>{current=next;render();})});
  }finally{await React.act(async()=>root.unmount());dom.window.close();}
}

for(const home of [false,true])test(`QA-46: ${home?'Home':'save notice'} Cancel and Escape preserve the loaded copy and return focus`,async()=>{
  await mount(async({storage,clears})=>{
    const opener=action(home?'Clear the save':'Clear save');opener.focus();await click(opener);
    assert.equal(clears(),0,'Opening must not clear the browser copy');
    const dialog=document.querySelector('[role=alertdialog]');assert.ok(dialog);
    assert.match(dialog.textContent,/QA – Loaded traveller/);assert.match(dialog.textContent,/original save file.*unchanged/i);
    assert.equal(document.activeElement,action('Cancel'));
    await key('Escape');assert.equal(document.querySelector('[role=alertdialog]'),null);assert.equal(document.activeElement,opener);
    await click(opener);await click(action('Cancel'));
    assert.equal(document.activeElement,opener);assert.equal(storage.getItem('silt-active-save'),'original kept copy');assert.equal(clears(),0);
  },{home});
});

for(const home of [false,true])test(`QA-46: confirmed ${home?'Home':'save notice'} clearing removes only the loaded copy and focuses the file opener`,async()=>{
  await mount(async({storage,clears,current})=>{
    const opener=action(home?'Clear the save':'Clear save');opener.focus();await click(opener);await click(action('Clear save'));
    assert.equal(clears(),1);assert.equal(current(),null);assert.equal(storage.getItem('silt-active-save'),null);assert.equal(storage.getItem('unrelated'),'keep');
    assert.equal(document.querySelector('[role=alertdialog]'),null);assert.equal(document.activeElement,action(home?'Choose a save file':'Open Save File…'));
  },{home});
});

test('QA-46: Builder clearing moves focus to the main content when its button disappears',async()=>{
  await mount(async()=>{action('Clear save').focus();await click(action('Clear save'));await click([...document.querySelectorAll('[role=alertdialog] button')].find(b=>b.textContent==='Clear save'));assert.equal(document.activeElement,document.getElementById('main-content'));},{importer:false});
});

test('QA-46: a replaced save cancels the old confirmation without clearing the new save',async()=>{
  await mount(async({replace,clears,current})=>{
    action('Clear save').focus();await click(action('Clear save'));assert.ok(document.querySelector('[role=alertdialog]'));
    const next={...active,token:2,save:{identity:{name:'QA – Replacement'}}};await replace(next);
    assert.equal(document.querySelector('[role=alertdialog]'),null);assert.equal(current(),next);assert.equal(clears(),0);
  });
});

test('QA-46: no loaded save has no clearing action or dialog',async()=>{
  await mount(async()=>{assert.equal(action('Clear save'),undefined);assert.equal(document.querySelector('[role=alertdialog]'),null);},{save:null});
});
