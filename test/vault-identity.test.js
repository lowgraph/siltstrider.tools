const {test} = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../lib/vault-identity.mjs');
const table = {Races: [{key:'t_cnq_chimeriquey', id:'T_Cnq_ChimeriQuey', name:'Chimeri-quey'}], Birthsigns:[{key:'wombburned',name:'The Atronach'}]};

test('all seven Khajiit variants share the distinct builder labels', async()=>{
  const {vaultIdentityLabels}=await modulePromise;
  const {raceDisplayName}=await import('../lib/character-catalogs.mjs');
  for(const variant of ['Cathay','Cathay-raht','Dagi-raht','Ohmes','Ohmes-raht','Suthay','Tojay']) {
    const row={key:'t_els_'+variant.toLowerCase(),name:'Khajiit'};
    assert.equal(raceDisplayName(row),`Khajiit (${variant})`);
    assert.equal(vaultIdentityLabels({race:row.key.toUpperCase()},[{Races:[row]}]).race,`Khajiit (${variant})`);
  }
});
test('plain Khajiit and already labeled names do not acquire an invented subtype', async()=>{
  const {vaultIdentityLabels}=await modulePromise;
  const races=[{key:'khajiit',name:'Khajiit'},{key:'t_els_cathay',name:'Khajiit'}];
  assert.equal(vaultIdentityLabels({race:'Khajiit'},[{Races:races}]).race,'Khajiit');
  assert.equal(vaultIdentityLabels({race:'khajiit'},[{Races:races}]).race,'Khajiit');
  assert.equal(vaultIdentityLabels({race:'Khajiit (Cathay)'},[{Races:races}]).race,'Khajiit (Cathay)');
});
test('unknown race IDs and missing records retain their original fallback', async()=>{
  const {vaultIdentityLabels}=await modulePromise;
  const {raceDisplayName}=await import('../lib/character-catalogs.mjs');
  assert.equal(raceDisplayName({id:'T_Els_Ohmes',name:'Khajiit'}),'Khajiit (Ohmes)');
  assert.equal(raceDisplayName({key:'mod_cat',name:'Modded Khajiit'}),'Modded Khajiit');
  assert.equal(raceDisplayName(null),undefined);
  assert.equal(vaultIdentityLabels({race:'T_Els_Unknown'},[table]).race,'T_Els_Unknown');
});

test('vault resolves case-insensitive record IDs without modifying the save header', async()=>{
  const {vaultIdentityLabels} = await modulePromise;
  const save = Object.freeze({race:'T_Cnq_ChimeriQuey',birthsign:'Wombburned'});
  assert.deepEqual(vaultIdentityLabels(save,[table,table]), {race:'Chimeri-quey',birthsign:'The Atronach'});
  assert.equal(save.race,'T_Cnq_ChimeriQuey');
});
test('unknown, missing and ambiguous names are never invented', async()=>{
  const {vaultIdentityLabels} = await modulePromise;
  assert.deepEqual(vaultIdentityLabels({race:'Mod_Race',birthsign:null},[table]),{race:'Mod_Race',birthsign:null});
  assert.equal(vaultIdentityLabels({race:'t_cnq_chimeriquey'},[table,{Races:[{key:'t_cnq_chimeriquey',name:'Different name'}]}]).race,'t_cnq_chimeriquey');
  assert.equal(vaultIdentityLabels({birthsign:'The Atronach'},[table]).birthsign,'The Atronach');
});
test('cards share catalog requests and can retry after an unavailable bundle', async()=>{
  const {loadVaultIdentityLabels} = await modulePromise;
  let calls=0,fail=true;
  const loader={async loadCatalog(profile,kind){calls++;if(fail)throw Error('offline');return table[kind];}};
  await assert.rejects(loadVaultIdentityLabels(loader,{race:'T_Cnq_ChimeriQuey'}),/offline/);
  fail=false;
  const results=await Promise.all(Array.from({length:25},()=>loadVaultIdentityLabels(loader,{birthsign:'Wombburned'})));
  assert.equal(calls,12);
  assert.ok(results.every(r=>r.birthsign==='The Atronach'));
});
