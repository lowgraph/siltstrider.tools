const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
async function card(){const dialog=await load('components/confirmation-dialog.jsx',{'./use-modal-dialog':await load('components/use-modal-dialog.js')});return (await load('components/character-vault/cloud-vault-card.jsx',{'../confirmation-dialog':dialog.default,'../use-game-data':{getGameDataLoader:()=>null}})).default;}
const click=el=>React.act(async()=>el.click());
const key=(key,shiftKey=false)=>React.act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key,shiftKey,bubbles:true,cancelable:true})));
const b=text=>[...document.querySelectorAll('[role=alertdialog] button')].find(b=>b.textContent===text);
const save={id:'a',name:'QA – Delete',save_type:'character_build',revision:1};
test('delete confirmation is named, focuses Cancel, traps Tab and returns focus after Escape',async()=>{
 const Card=await card();let calls=0;
 await mount(Card,async()=>{const opener=document.querySelector('[data-vault-delete]');opener.focus();await click(opener);
 assert.equal(document.activeElement,b('Cancel'));
 const dialog=document.querySelector('[role=alertdialog]');assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent,'Delete save?');
 await key('Tab',true);assert.equal(document.activeElement,b('Confirm'));await key('Tab');assert.equal(document.activeElement,b('Cancel'));
 await key('Escape');assert.equal(document.querySelector('[role=alertdialog]'),null);assert.equal(document.activeElement,opener);assert.equal(calls,0);
 },{save,onDelete:()=>{calls++;},onLoad:()=>{},onExport:()=>{}});
});
test('failed deletion stays announced and retryable, with focus kept in the confirmation',async()=>{
 const Card=await card();for(const failure of [()=>({success:false,error:'Revision changed.'}),()=>{throw Error('Network unavailable.');}])await mount(Card,async()=>{
 const opener=document.querySelector('[data-vault-delete]');opener.focus();await click(opener);await click(b('Confirm'));
 assert.match(document.querySelector('[role=alertdialog] [role=alert]').textContent,/Revision changed|Network unavailable/);
 assert.equal(document.activeElement,b('Cancel'));await click(b('Cancel'));assert.equal(document.activeElement,opener);
 },{save,onDelete:failure,onLoad:()=>{},onExport:()=>{}});
});
test('successful deletion focuses a remaining save or the save-name field after removing the last card',async()=>{
 const Card=await card();for(const last of [false,true]){
 function Vault(){const [saves,setSaves]=React.useState(last?[save]:[save,{...save,id:'b',name:'QA – Remaining'}]);return React.createElement('main',null,React.createElement('input',{placeholder:'Name (e.g. QA)'}),saves.map(s=>React.createElement(Card,{key:s.id,save:s,onLoad:()=>{},onExport:()=>{},onDelete:async id=>{setSaves(v=>v.filter(s=>s.id!==id));return {success:true};}})));}
 const frames=[];global.requestAnimationFrame=cb=>frames.push(cb);
 try{await mount(Vault,async()=>{await click(document.querySelector('[data-vault-delete]'));await click(b('Confirm'));while(frames.length)await React.act(async()=>frames.shift()());
 assert.equal(document.querySelector('[role=alertdialog]'),null);assert.notEqual(document.activeElement,document.body);
 assert.equal(document.activeElement,last?document.querySelector('input'):document.querySelector('[data-vault-delete]'));
 });}finally{delete global.requestAnimationFrame;}
 }
});
test('deferred deletion focus does nothing after the Vault is detached',async()=>{
 const Card=await card(),frames=[];global.requestAnimationFrame=cb=>frames.push(cb);
 function Vault(){return React.createElement('main',null,React.createElement(Card,{save,onLoad:()=>{},onExport:()=>{},onDelete:async()=>({success:true})}));}
 try{await mount(Vault,async root=>{await click(document.querySelector('[data-vault-delete]'));await click(b('Confirm'));await React.act(async()=>root.render(null));while(frames.length)await React.act(async()=>frames.shift()());assert.equal(document.querySelector('main'),null);});}finally{delete global.requestAnimationFrame;}
});
