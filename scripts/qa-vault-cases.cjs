/* Isolated signed-in QA. No real Clerk account or production connection. */
const assert=require('node:assert/strict');const fixture=require('../test/helpers/qa-staged-data.cjs');
module.exports=async c=>{
  const user={id:'user_qa_reproduction',fullName:'QA – Vault Reproduction',firstName:'QA',username:'QA_Reproduction',primaryEmailAddress:{emailAddress:'qa+clerk_test@example.com'}};
  const build={world:'tr',arce:true,name:'QA – Stored Cathay-raht',race:'Khajiit (Cathay-raht)',gender:'Female',className:'Mage',sign:'The Tower',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Alchemy','Enchant','Destruction','Restoration','Mysticism'],min:['Athletics','Spear','Heavy Armor','Armorer','Long Blade']};
  const raw=fixture.save();raw.identity.name='QA – Imported Cathay-raht';raw.identity.race='T_Els_Cathay-raht';raw.identity.gender='Female';raw.identity.birthsign='Hara';raw.contentFiles.push('Tamriel_Data.esm','TR_Mainland.esm','ARCE - All Races and Classes Enabled.esp');
  const l=await fixture.loader(),{adaptCharacterCatalogs}=await import('../lib/character-catalogs.mjs'),{buildFromSave}=await import('../lib/omwsave-import.mjs'),{decodeShareUrl}=await import('../lib/permalink-codec.mjs');
  const catalogs=adaptCharacterCatalogs(await l.loadFeature('tr_arce','character'),await l.loadCatalog('tr_arce','Spells'));
  const expected=buildFromSave(raw,catalogs,{profile:'tr_arce'}).build;
  try {
    for(const record of [{saveType:'character_build',name:build.name,data:build},{saveType:'openmw_save',name:raw.identity.name,data:raw}]) {const result=await c.request('POST','/api/saves',{user,body:record});assert.equal(result.status,201,JSON.stringify(result.body));}
    for(const width of [1366,375])for(const theme of ['ashfall','morrowind']) {
      await c.viewport(width);await c.signIn(user);await c.open('/about');await c.theme(theme);
      const settings=await c.request('GET','/api/settings',{user});assert.equal(settings.status,200);
      assert.equal((await c.request('PUT','/api/settings',{user,body:{...settings.body,settings:{...settings.body.settings,theme}}})).status,200);
      await c.check(`QA-21/Vault-world/${width}/${theme}`,async()=>{
        await c.open('/vault?world=vanilla');await c.until(c.card(build.name));await c.inCard(build.name,'Load Build →');await c.until(`document.querySelector('main').textContent.includes('Loaded "${build.name}"')`);await c.button('← Character Builder','main');
        await c.until('document.querySelector("#builder-race")');await c.pause(500);
        const actual=await c.evaluate(`({theme:document.documentElement.dataset.theme,world:[...document.querySelectorAll('.world-controls button')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent.trim()),race:document.querySelector('#builder-race').value,calculating:document.querySelector('main').textContent.includes('Calculating statistics')})`);
        assert.equal(actual.theme,theme,'the requested theme is actually active');await c.screenshot(`QA-21-${width}-${theme}`);assert.ok(actual.world.includes('TR + ARCE'),JSON.stringify(actual));assert.equal(actual.race,build.race);assert.equal(actual.calculating,false);return actual;
      });
      await c.check(`QA-22/save-permalink/${width}/${theme}`,async()=>{
        await c.open('/vault?world=vanilla');await c.until(c.card(raw.identity.name));await c.evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.__qaCopied=value}})`);await c.inCard(raw.identity.name,'Share Link');await c.until('window.__qaCopied');
        const decoded=decodeShareUrl(await c.evaluate('window.__qaCopied'));
        assert.deepEqual({world:decoded.world,arce:decoded.arce,race:decoded.build.race,gender:decoded.build.gender,className:decoded.build.className,maj:decoded.build.maj,min:decoded.build.min},{world:'tr',arce:true,race:expected.race,gender:'Female',className:expected.className,maj:expected.maj,min:expected.min});return decoded;
      });
    }
  } finally {
    const listed=await c.request('GET','/api/saves',{user});assert.equal(listed.status,200);
    for(const record of listed.body.saves){assert.ok(record.name.startsWith('QA – '),'delete only this suite’s QA records');assert.equal((await c.request('DELETE',`/api/saves/${record.id}?revision=${record.revision}`,{user})).status,200);}
    assert.deepEqual((await c.request('GET','/api/saves',{user})).body.saves,[],'all QA records removed');await c.signOut();
  }
};
