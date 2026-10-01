const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const Module=require('node:module');
const {JSDOM}=require('jsdom');
const React=require('react');
const {createRoot,hydrateRoot}=require('react-dom/client');
const {renderToString}=require('react-dom/server');
const compiled=require('esbuild').buildSync({entryPoints:[path.resolve('components/character-builder/configurator.jsx')],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react-dom']});
const fixturePath=path.resolve('test/configuration-fixture.cjs');
const fixture=new Module(fixturePath,module);fixture.paths=module.paths;fixture._compile(compiled.outputFiles[0].text,fixturePath);
const Configurator=fixture.exports.default;
const build={race:'Breton',gender:'Female',sign:'The Mage',className:'Custom',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:[],min:[]};
const props=(text='Race mechanics explanation.')=>({build,catalogs:{races:{Breton:{tip:text}},signs:{'The Mage':{tip:'Birthsign explanation.'}},classes:{},specSkills:{Magic:['Alchemy']}},onUpdateField(){},onSwapSkill(){},onSelectClassPreset(){}});
const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});

async function page(options,run){
  const saved={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};
  const dom=new JSDOM('<div class="topbar"></div><div id="root"></div><nav class="phone-tabs"></nav><button id="outside">Outside</button>',{url:'http://localhost/builder'});
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  Object.defineProperties(window,{innerWidth:{value:options.width||375,writable:true},innerHeight:{value:options.height||844,writable:true}});
  const state={anchor:options.anchor||rect(350,300,24,24),contentHeight:options.contentHeight||100};
  if(options.visual)Object.defineProperty(window,'visualViewport',{value:Object.assign(new window.EventTarget(),options.visual)});
  dom.window.HTMLElement.prototype.getBoundingClientRect=function(){
    if(this.matches('.topbar'))return rect(0,0,window.innerWidth,60);
    if(this.matches('.phone-tabs'))return window.innerWidth<768?rect(0,window.innerHeight-58,window.innerWidth,58):rect(0,0,0,0);
    if(this.matches('button[aria-label="Information"]'))return state.anchor;
    if(this.matches('.configuration-info-popover, span.absolute')){
      const modern=this.classList.contains('configuration-info-popover');
      const limit=parseFloat(this.style.maxHeight);
      return rect(modern?parseFloat(this.style.left)||0:state.anchor.x,modern?parseFloat(this.style.top)||0:state.anchor.bottom+7,
        parseFloat(this.style.width)||256,Math.min(state.contentHeight,Number.isFinite(limit)?limit:Infinity));
    }
    return rect(0,0,0,0);
  };
  const root=createRoot(document.getElementById('root'));
  const tree=(text)=>React.createElement(Configurator,props(text));
  try{
    await React.act(async()=>root.render(tree(options.text)));
    const buttons=[...document.querySelectorAll('button[aria-label="Information"]')];assert.equal(buttons.length,5);
    const popup=()=>document.querySelector('.configuration-info-popover, span.absolute');
    const toggle=async(index=0)=>React.act(async()=>buttons[index].click());
    await run({state,root,tree,buttons,popup,toggle,dom});
  }finally{
    await React.act(async()=>root.unmount());dom.window.close();
    for(const [key,value] of Object.entries(saved)){if(value===undefined)delete global[key];else global[key]=value;}
  }
}
function within(popup,left=8,top=68,right=window.innerWidth-8,bottom=window.innerHeight-66){
  assert.ok(popup,'Explanation opened');const r=popup.getBoundingClientRect();
  assert.ok(r.left>=left&&r.right<=right&&r.top>=top&&r.bottom<=bottom,JSON.stringify(r));
}

test('QA-09 every Configure explanation shifts left at the phone right edge',()=>page({},async({toggle,popup})=>{
  for(let i=0;i<5;i++){await toggle(i);within(popup());await toggle(i);assert.equal(popup(),null);}
}));
test('QA-09 Race explanation flips above a button just above the phone tab bar',()=>page({anchor:rect(90,744,24,24)},async({toggle,popup,state})=>{
  await toggle();within(popup());assert.ok(popup().getBoundingClientRect().bottom<state.anchor.top);
}));
test('QA-09 long explanations scroll in a short viewport without covering navigation',()=>page({height:320,anchor:rect(90,170,24,24),contentHeight:640,text:'Long explanation. '.repeat(120)},async({toggle,popup})=>{
  await toggle();within(popup());assert.equal(popup().style.overflowY,'auto');assert.ok(parseFloat(popup().style.maxHeight)<640);
}));
test('QA-09 placement respects the smaller, offset visual viewport',()=>page({anchor:rect(218,205,24,24),contentHeight:600,visual:{offsetLeft:12,offsetTop:80,width:240,height:240}},async({toggle,popup})=>{
  await toggle();within(popup(),20,88,244,312);assert.ok(popup().getBoundingClientRect().width<=224);
}));
test('QA-09 open explanation follows resize and closes when its button scrolls out of view',()=>page({width:1366,anchor:rect(1100,300,24,24)},async({toggle,popup,state,buttons})=>{
  await toggle();assert.ok(popup().getBoundingClientRect().left>=1000);
  await React.act(async()=>{window.innerWidth=375;state.anchor=rect(350,300,24,24);window.dispatchEvent(new window.Event('resize'));});within(popup());
  await React.act(async()=>{state.anchor=rect(350,-80,24,24);window.dispatchEvent(new window.Event('scroll'));});
  assert.equal(popup(),null);assert.equal(buttons[0].getAttribute('aria-expanded'),'false');
}));
test('QA-09 explanation links to its trigger, keeps inside clicks, and dismisses outside or with Escape',()=>page({},async({toggle,popup,buttons})=>{
  await toggle();const panel=popup();assert.ok(panel.id);assert.equal(buttons[0].getAttribute('aria-controls'),panel.id);
  await React.act(async()=>panel.dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true})));assert.equal(popup(),panel);
  panel.focus();await React.act(async()=>panel.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(popup(),null);assert.equal(document.activeElement,buttons[0]);
  await toggle();await React.act(async()=>document.getElementById('outside').dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true})));
  assert.equal(popup(),null);
}));
test('QA-09 popup content changes resize the open explanation without losing its trigger',()=>page({anchor:rect(90,650,24,24)},async({toggle,popup,state,root,tree,buttons})=>{
  await toggle();const id=buttons[0].getAttribute('aria-controls');
  await React.act(async()=>{state.contentHeight=600;root.render(tree('Updated explanation. '.repeat(100)));});
  within(popup());assert.equal(popup().id,id);assert.match(popup().textContent,/Updated explanation/);
}));
test('QA-09 Configure hydrates with closed help and stable trigger IDs',async()=>{
  const html=renderToString(React.createElement(Configurator,props()));
  const saved={window:global.window,document:global.document,IS_REACT_ACT_ENVIRONMENT:global.IS_REACT_ACT_ENVIRONMENT};
  const dom=new JSDOM('<div id="root">'+html+'</div>',{url:'http://localhost/builder'});
  Object.assign(global,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const triggers=()=>[...document.querySelectorAll('button[aria-label="Information"]')].map(b=>b.id);
  const before=triggers();
  let root;const errors=[];
  try{
    await React.act(async()=>{root=hydrateRoot(document.getElementById('root'),React.createElement(Configurator,props()),{onRecoverableError:e=>errors.push(String(e))});});
    assert.deepEqual(errors,[]);assert.equal(document.querySelector('.configuration-info-popover'),null);
    assert.equal(before.length,5);assert.ok(before.every(Boolean));assert.deepEqual(triggers(),before);
  }finally{await React.act(async()=>root?.unmount());dom.window.close();for(const [key,value] of Object.entries(saved)){if(value===undefined)delete global[key];else global[key]=value;}}
});
