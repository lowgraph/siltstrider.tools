const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
async function harness(){const {defaultAccountSettings}=await import('../lib/account-settings.mjs');
 const custom={...defaultAccountSettings(),world:'tr_arce',worldChosen:true,theme:'morrowind',overrideSaveToggles:true,toolDefaults:{travel:{objective:'gold'},gear:{theft:true},challenge:{preset:'cursed'}}};
 const calls=[];const state={settings:custom,owner:'user_qa',ready:true,revision:2,update:edit=>{calls.push(edit);state.settings=edit(state.settings);}};
 const dialog=await load('components/confirmation-dialog.jsx',{'./use-modal-dialog':await load('components/use-modal-dialog.js')});
 const profiles=[];const Panel=(await load('components/account-settings-panel.jsx',{'./confirmation-dialog':dialog.default,'./account-settings-context':{useAccountSettings:()=>state},'./shell-context':{useShell:()=>({profile:'tr_arce',setProfile:v=>profiles.push(v)})}})).default;
 return {Panel,state,calls,profiles,custom,defaults:defaultAccountSettings()};
}
const b=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const click=el=>React.act(async()=>el.click());
test('opening and cancelling reset preserves the entire document and keyboard focus',async()=>{const h=await harness();await mount(h.Panel,async()=>{
 const opener=b('Reset all settings');opener.focus();await click(opener);assert.equal(document.activeElement,b('Cancel'));assert.equal(h.calls.length,0);
 await React.act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
 assert.equal(document.activeElement,opener);assert.deepEqual(h.state.settings,h.custom);assert.deepEqual(h.profiles,[]);
 await click(opener);await click(b('Cancel'));assert.equal(h.calls.length,0);assert.equal(document.activeElement,opener);
 });});
test('confirmation applies the documented defaults exactly once and clears scoped overrides',async()=>{const h=await harness();h.state.settings={...h.custom,defaultScope:'dataset',datasetOverrides:[{world:'tr_arce',modpackId:null,modVersionId:null,toolDefaults:{travel:{walking:false},gear:{},challenge:{}}}]};await mount(h.Panel,async()=>{
 const opener=b('Reset all settings');opener.focus();await click(opener);const d=document.querySelector('[role=alertdialog]');assert.match(document.getElementById(d.getAttribute('aria-describedby')).textContent,/Modern UI, Morrowind and tool defaults/);
 await click(b('Reset settings'));assert.deepEqual(h.state.settings,h.defaults);assert.equal(h.calls.length,1);assert.deepEqual(h.profiles,['vanilla']);assert.equal(document.activeElement,opener);
 });});
test('failed sync stays announced with recovery; account changes dismiss pending confirmation',async()=>{const h=await harness();await mount(h.Panel,async root=>{
 const opener=b('Reset all settings');opener.focus();await click(opener);await click(b('Reset settings'));
 h.state.error='Could not sync settings. Please retry.';h.state.dirty=true;h.state.retry=()=>{};await React.act(async()=>root.render(React.createElement(h.Panel)));
 assert.match(document.querySelector('.account-settings-panel [role=alert]').textContent,/Could not sync/);assert.ok(b('Retry sync'));assert.equal(document.activeElement,opener);
 h.state.conflict=true;h.state.error='Settings changed elsewhere.';document.activeElement.blur();await React.act(async()=>root.render(React.createElement(h.Panel)));
 assert.equal(document.activeElement,b('Discard unsaved preferences and reload saved settings'));
 h.state.conflict=false;await React.act(async()=>root.render(React.createElement(h.Panel)));
 await click(opener);h.state.owner='user_other';await React.act(async()=>root.render(React.createElement(h.Panel)));assert.equal(document.querySelector('[role=alertdialog]'),null);assert.equal(h.calls.length,1);
 });});
