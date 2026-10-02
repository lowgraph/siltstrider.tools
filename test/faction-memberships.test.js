const {test}=require('node:test');const assert=require('node:assert/strict');
test('fresh characters have no invented guild membership',async()=>{const {saveMemberships}=await import('../lib/faction-memberships.mjs');assert.deepEqual(saveMemberships(null),[]);});
test('save memberships keep expelled factions but exclude unjoined mentions',async()=>{const {saveMemberships}=await import('../lib/faction-memberships.mjs');const result=saveMemberships({factions:[{id:'Guild',rank:0},{id:'Other',rank:-1},{id:'Exiled',rank:-1,expelled:true}]});assert.deepEqual(result.map(f=>f.id),['guild','exiled']);});
test('membership edits replace case-insensitive matches and preserve other factions',async()=>{const {updateMembership}=await import('../lib/faction-memberships.mjs');const previous=[{id:'Guild',rank:1},{id:'other',rank:0}];const next=updateMembership(previous,{id:'GUILD',rank:4,reputation:35});assert.equal(next.length,2);assert.equal(next.find(f=>f.id==='guild').rank,4);assert.equal(previous[0].rank,1);});

for(const house of ['hlaalu','redoran','telvanni'])test(`FLOW-03: ${house} blocks each rival through both joins and rank updates`,async()=>{
 const {toggleMembership,updateMembership,membershipConflict}=await import('../lib/faction-memberships.mjs');
 const previous=Object.freeze([Object.freeze({id:house.toUpperCase(),rank:0,reputation:5})]);
 for(const rival of ['hlaalu','redoran','telvanni'].filter(h=>h!==house)){
  assert.ok(membershipConflict(rival,previous));assert.equal(toggleMembership(previous,rival),previous);
  assert.equal(updateMembership(previous,{id:rival,rank:0}),previous);
 }
 assert.equal(previous[0].reputation,5);
});
test('FLOW-03: leaving remains available, unrelated guilds coexist and an unjoined mention does not block',async()=>{
 const {toggleMembership,membershipConflict}=await import('../lib/faction-memberships.mjs');
 const list=[{id:'HLAALU',rank:0},{id:'mages guild',rank:2}];
 const left=toggleMembership(list,'hlaalu');assert.deepEqual(left,[list[1]]);
 assert.equal(toggleMembership(left,'redoran').length,2);
 assert.equal(toggleMembership(list,'fighters guild').length,3);
 assert.equal(membershipConflict('redoran',[{id:'hlaalu',rank:-1},null,{}]),null);
 assert.ok(membershipConflict('redoran',[{id:'hlaalu',rank:-1,expelled:true}]));
 assert.equal(toggleMembership(list,null),list);assert.equal(toggleMembership(list,''),list);
});
test('FLOW-03: imported conflicting memberships are preserved and editable until the player leaves one',async()=>{
 const {saveMemberships,updateMembership,toggleMembership}=await import('../lib/faction-memberships.mjs');
 const loaded=saveMemberships({factions:[{id:'hlaalu',rank:1},{id:'redoran',rank:2}]});assert.equal(loaded.length,2);
 const edited=updateMembership(loaded,{id:'redoran',rank:3});assert.equal(edited.length,2);assert.equal(edited[0].rank,1);
 assert.equal(toggleMembership(edited,'telvanni'),edited);assert.equal(toggleMembership(edited,'redoran').length,1);
 assert.equal(loaded[1].rank,2);
});
