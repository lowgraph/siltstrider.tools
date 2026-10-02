const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
for(const length of [100,101,120])test(`F-17: Vault rename keeps all ${length} characters and the current revision`,async()=>{
  const renamed=[];const Card=(await load('components/character-vault/cloud-vault-card.jsx',{
    '../confirmation-dialog':()=>null,'../use-game-data':{getGameDataLoader:()=>null}
  })).default;
  await mount(Card,async()=>{
    await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Rename').click());
    const input=document.querySelector('[aria-label="New name for this save"]');assert.equal(input.maxLength,120);
    const name='QA – '.padEnd(length,'a');
    await React.act(async()=>{
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,name);
      input.dispatchEvent(new window.Event('input',{bubbles:true}));
    });
    await React.act(async()=>document.querySelector('form button[type=submit]').click());
    assert.deepEqual(renamed,[['qa-rename',name,7]]);
  },{save:{id:'qa-rename',name:'QA – Initial',save_type:'character_build',revision:7},onRename:(...args)=>renamed.push(args)});
});
