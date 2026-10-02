const {test}=require('node:test');const assert=require('node:assert/strict');
const {React,load,mount}=require('./helpers/launch-render.cjs');
for(const username of ['', 'QA-invalid', 'QA_Tester'])test(`F-11: required profile help and icon save with ${username||'no username'}`,async()=>{
  const writes=[];const account={user:{id:'qa_profile_help'},profile:{username:null,iconId:0},save:async p=>writes.push(p)};
  const Account=(await load('components/account-page.jsx',{
    './account-context':{useAccount:()=>account},
    './shell-context':{useShell:()=>({navigate(){}})},
    './profile-icon':()=>null,'./account-settings-panel':()=>null
  })).default;
  await mount(Account,async()=>{
    const input=document.querySelector('input[autocomplete=username]');
    assert.equal(input.required,true);assert.equal(input.getAttribute('aria-describedby'),'username-help');
    assert.match(document.getElementById('username-help').textContent,/username is required.*including your icon/);
    await React.act(async()=>{
      document.querySelector('input[name=profile-icon][value="4"]').click();
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,username);
      input.dispatchEvent(new window.Event('input',{bubbles:true}));
    });
    assert.equal(document.querySelector('input[name=profile-icon][value="4"]').checked,true);
    assert.equal(input.checkValidity(),username==='QA_Tester');
    await React.act(async()=>document.querySelector('button[type=submit]').click());
    assert.deepEqual(writes,username==='QA_Tester'?[{username,iconId:4}]:[]);
    if(writes.length)assert.match(document.querySelector('[role=status]').textContent,/Profile saved/);
  });
});
