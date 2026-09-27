const {test} = require('node:test');
const assert = require('node:assert/strict');
const modulePromise = import('../lib/vault-identity.mjs');
const table = {Races: [{key:'t_cnq_chimeriquey', id:'T_Cnq_ChimeriQuey', name:'Chimeri-quey'}], Birthsigns:[{key:'wombburned',name:'The Atronach'}]};

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
