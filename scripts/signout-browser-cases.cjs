/* QA-24 against the real local pages/Worker; only the Clerk redirect is synthetic. */
const assert = require('node:assert/strict');
module.exports = async c => {
  const user = { id: 'user_qa_signout', fullName: 'QA – Sign-out', username: 'QA_Signout' };
  const { ACTIVE_SAVE_KEY, rememberSave } = await import('../lib/active-save-store.mjs');
  const { SIGN_OUT_HANDOFF_KEY } = await import('../lib/sign-in-handoff.mjs');
  const { defaultAccountSettings } = await import('../lib/account-settings.mjs');
  const { GUEST_SETTINGS_KEY } = await import('../lib/account-settings-client.mjs');
  const raw = require('../test/helpers/qa-staged-data.cjs').save();
  raw.identity.name = 'QA – Loaded sign-out control';
  let storedSave;
  assert.equal(await rememberSave(raw, { setItem: (key, value) => { assert.equal(key, ACTIVE_SAVE_KEY); storedSave = value; } }), true);
  for (const width of [1366, 375]) for (const theme of ['ashfall', 'morrowind']) {
    for (const loaded of [false, true]) await c.check(`QA-24/${loaded ? 'loaded-save' : 'unsaved-ARCE'}/${width}/${theme}`, async () => {
      await c.viewport(width);
      await c.signIn(user, { reloadOnSignOut: true });
      await c.open('/about');
      await c.evaluate('localStorage.clear();sessionStorage.clear()');
      await c.theme(theme);
      await c.evaluate(`localStorage.setItem(${JSON.stringify(GUEST_SETTINGS_KEY)},${JSON.stringify(JSON.stringify({ ...defaultAccountSettings(), theme }))})`);
      const settings = await c.request('GET', '/api/settings', { user });
      assert.equal(settings.status, 200);
      assert.equal((await c.request('PUT', '/api/settings', { user,
        body: { ...settings.body, settings: { ...settings.body.settings, theme } } })).status, 200);
      if (loaded) await c.evaluate(`localStorage.setItem(${JSON.stringify(ACTIVE_SAVE_KEY)},${JSON.stringify(storedSave)})`);
      await c.open(loaded ? '/builder' : '/builder?world=tr&arce=1');
      if (loaded) await c.until(`document.querySelector('main').textContent.includes(${JSON.stringify(raw.identity.name)})`);
      else {
        await c.until('document.querySelector("main button")');
        await c.button(width < 1024 ? 'Configure' : 'Custom Class Builder', 'main');
        await c.until(`Array.from(document.querySelector('#builder-race').options).some(o=>o.value==='Khajiit (Cathay-raht)')`);
        await c.evaluate(`for(const [id,value] of [['builder-race','Khajiit (Cathay-raht)'],['builder-sign','The Tower']]){const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}`);
        await c.button('Female', 'main');
      }
      await c.until('document.querySelector(".character-sheet h3")');
      const before = await c.evaluate(`({race:document.querySelector('#builder-race').value,sign:document.querySelector('#builder-sign').value,identity:document.querySelector('.character-sheet h3').textContent,theme:document.documentElement.dataset.theme})`);
      assert.equal(before.theme, theme);
      if (!loaded) { assert.equal(before.race, 'Khajiit (Cathay-raht)'); assert.equal(before.sign, 'The Tower'); }
      // The actual account control invokes the application's sign-out event before
      // the stand-in removes the session and performs a full Home navigation.
      await c.click('[aria-label="Your account"]');
      await c.until(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent==='Sign out')`);
      await c.button('Sign out', 'main');
      await c.until(`location.pathname==='/'&&document.querySelector('main')&&window.Clerk?.user===null`);
      if (width < 900) await c.button('Build', '.phone-tabs');
      else await c.click('#react-nav-build');
      await c.until('document.querySelector(".character-sheet h3")');
      if (loaded) await c.until(`document.querySelector('main').textContent.includes(${JSON.stringify(raw.identity.name)})`);
      const after = await c.evaluate(`({race:document.querySelector('#builder-race').value,sign:document.querySelector('#builder-sign').value,identity:document.querySelector('.character-sheet h3').textContent,theme:document.documentElement.dataset.theme,marker:sessionStorage.getItem(${JSON.stringify(SIGN_OUT_HANDOFF_KEY)}),saved:!!localStorage.getItem(${JSON.stringify(ACTIVE_SAVE_KEY)})})`);
      assert.deepEqual({ race: after.race, sign: after.sign, identity: after.identity, theme: after.theme }, before);
      assert.equal(after.marker, null, 'return marker consumed, or skipped for a save');
      assert.equal(after.saved, loaded);
      if (width < 1024) await c.button('Sheet', 'main');
      await c.screenshot(`QA-24-${loaded ? 'loaded' : 'unsaved'}-${width}-${theme}`);
      if (!loaded) {
        await c.open('/builder');
        await c.until('document.querySelector(".character-sheet h3")');
        assert.notEqual(await c.evaluate(`document.querySelector('.character-sheet h3').textContent`), before.identity, 'a later ordinary refresh starts afresh');
      }
      return { before, after };
    });
  }
  await c.signOut();
};
