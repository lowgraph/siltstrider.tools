/* QA-21/23 on real local pages and Worker; authentication is synthetic. */
const assert = require('node:assert/strict');
module.exports = async c => {
  const user = { id: 'user_qa_character_preservation', fullName: 'QA – Character preservation', username: 'QA_Character' };
  const {defaultAccountSettings} = await import('../lib/account-settings.mjs');
  const {HANDOFF_KEY} = await import('../lib/sign-in-handoff.mjs');
  const {GUEST_SETTINGS_KEY} = await import('../lib/account-settings-client.mjs');
  const build = {world:'tr',arce:true,name:'QA – Preserved Cathay-raht',race:'Khajiit (Cathay-raht)',gender:'Female',className:'Mage',sign:'The Tower',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
  const choose = async (value) => c.evaluate(`(()=>{const el=[...document.querySelectorAll('.account-settings-panel label')].find(l=>l.textContent.startsWith('Preferred world'))?.querySelector('select');if(!el)throw Error('No Preferred world control');el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const world = `Array.from(document.querySelectorAll('.world-controls button')).filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent.trim())`;
  const put = async settings => {
    const existing=await c.request('GET','/api/settings',{user});assert.equal(existing.status,200);
    const result=await c.request('PUT','/api/settings',{user,body:{settings,revision:existing.body.revision}});assert.equal(result.status,200);
    return result.body;
  };
  try {
    const created=await c.request('POST','/api/saves',{user,body:{saveType:'character_build',name:build.name,data:build}});assert.equal(created.status,201);
    for(const width of [1366,375]) for(const theme of ['ashfall','morrowind']) {
      await c.viewport(width);await c.signIn(user);await c.open('/about');
      await c.evaluate('localStorage.clear();sessionStorage.clear()');await c.theme(theme);
      await put({...defaultAccountSettings(),theme});
      await c.check(`QA-21/Vault-world/${width}/${theme}`,async()=>{
        await c.open('/vault?world=vanilla');await c.until(c.card(build.name));
        await c.inCard(build.name,'Load Build →');await c.until(`document.querySelector('main').textContent.includes('Loaded "${build.name}"')`);
        await c.button('← Character Builder','main');
        await c.until(`document.querySelector('#builder-race')?.value===${JSON.stringify(build.race)}&&document.querySelector('.character-sheet h3')`);
        const actual=await c.evaluate(`({theme:document.documentElement.dataset.theme,world:${world},race:document.querySelector('#builder-race').value,sign:document.querySelector('#builder-sign').value,calculating:document.querySelector('main').textContent.includes('Calculating statistics')})`);
        assert.equal(actual.theme,theme);assert.ok(actual.world.includes('TR + ARCE'));assert.equal(actual.sign,build.sign);assert.equal(actual.calculating,false);
        await c.screenshot(`QA-21-${width}-${theme}`);return actual;
      });
      await c.check(`QA-21/modal-world/${width}/${theme}`,async()=>{
        await c.open('/builder?world=vanilla');
        await c.evaluate("window.dispatchEvent(new Event('silt-open-vault'))");
        await c.until(c.card(build.name));
        // Move focus to the control before scrolling the nested dialog body;
        // this also exercises the modal's keyboard focus boundary.
        // Opening refreshes a prefetched list. Check and focus the same node,
        // then verify it survives paint; separate CDP reads can span that refresh.
        const focused = await c.evaluate(`(async()=>{const deadline=performance.now()+5000;while(performance.now()<deadline){const b=document.querySelector('[role="dialog"] .vault-card button[title="Load this build into Character Builder"]');if(b&&!b.disabled){b.focus();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(b.isConnected&&!b.disabled&&document.activeElement===b)return true;}await new Promise(r=>setTimeout(r,50));}return false;})()`);
        assert.equal(focused,true,'The enabled modal load control holds focus after refresh');
        await c.pause(150);
        await c.click('[role="dialog"] .vault-card button[title="Load this build into Character Builder"]');
        await c.until(`document.querySelector('#builder-race')?.value===${JSON.stringify(build.race)}&&document.querySelector('.character-sheet h3')`);
        assert.ok((await c.evaluate(world)).includes('TR + ARCE'));
        assert.equal(await c.evaluate("document.querySelector('#builder-sign').value"),build.sign);
        await c.screenshot(`QA-21-modal-${width}-${theme}`);return {race:build.race,profile:'tr_arce'};
      });
      await c.check(`QA-23/sign-in-handoff/${width}/${theme}`,async()=>{
        await c.evaluate(`localStorage.setItem('mw-world','tr');localStorage.setItem('mw-arce','1');sessionStorage.setItem(${JSON.stringify(HANDOFF_KEY)},JSON.stringify({at:Date.now(),build:${JSON.stringify(build)}}))`);
        const before=await c.request('GET','/api/settings',{user});
        await c.open('/builder');await c.until(`document.querySelector('#builder-race')?.value===${JSON.stringify(build.race)}&&document.querySelector('.character-sheet h3')`);
        await c.pause(500);
        assert.ok((await c.evaluate(world)).includes('TR + ARCE'));
        assert.equal(await c.evaluate(`sessionStorage.getItem(${JSON.stringify(HANDOFF_KEY)})`),null);
        const after=await c.request('GET','/api/settings',{user});assert.equal(after.body.revision,before.body.revision);assert.equal(after.body.settings.worldChosen,false);
        await c.screenshot(`QA-23-handoff-${width}-${theme}`);return {revision:after.body.revision,world:after.body.settings.world,worldChosen:false};
      });
      await c.check(`QA-23/explicit-preference/${width}/${theme}`,async()=>{
        await c.open('/account');await c.until('document.querySelector(".account-settings-panel fieldset")?.disabled===false');
        const guest=await c.evaluate(`localStorage.getItem(${JSON.stringify(GUEST_SETTINGS_KEY)})`);
        await choose('tr');
        await c.until(`document.querySelector('.account-settings-panel')?.textContent.includes('Preferences are saved to your account.')`);
        let stored=await c.request('GET','/api/settings',{user});assert.equal(stored.body.settings.worldChosen,true);assert.equal(stored.body.settings.world,'tr');
        // Header changes affect this session, without changing the account default.
        if(width<900) await c.click('.topbar button[aria-label="Open menu"]');
        await c.button('TR + ARCE','.world-controls');await c.pause(500);
        assert.ok((await c.evaluate(world)).includes('TR + ARCE'),'header changed the current session');
        stored=await c.request('GET','/api/settings',{user});assert.equal(stored.body.settings.world,'tr');assert.equal(stored.body.settings.worldChosen,true);
        assert.equal(await c.evaluate(`localStorage.getItem(${JSON.stringify(GUEST_SETTINGS_KEY)})`),guest);
        await c.open('/builder');await c.until(`(${world}).includes('Tamriel Rebuilt')&&document.querySelector('.character-sheet h3')`);
        assert.ok(!(await c.evaluate(world)).includes('TR + ARCE'),'explicit account world on a fresh page');
        await c.open('/account');await c.until('document.querySelector(".account-settings-panel fieldset")?.disabled===false');await choose('browser');
        await c.until(`document.querySelector('.account-settings-panel')?.textContent.includes('Preferences are saved to your account.')`);
        stored=await c.request('GET','/api/settings',{user});assert.equal(stored.body.settings.worldChosen,false);
        await c.open('/builder');await c.until(`(${world}).includes('TR + ARCE')&&document.querySelector('.character-sheet h3')`);
        await c.screenshot(`QA-23-preference-${width}-${theme}`);return {worldChosen:stored.body.settings.worldChosen};
      });
    }
  } finally {
    const listed=await c.request('GET','/api/saves',{user});assert.equal(listed.status,200);
    for(const record of listed.body.saves) {assert.ok(record.name.startsWith('QA – '));assert.equal((await c.request('DELETE',`/api/saves/${record.id}?revision=${record.revision}`,{user})).status,200);}
    assert.deepEqual((await c.request('GET','/api/saves',{user})).body.saves,[]);
    await c.signOut();
  }
};
