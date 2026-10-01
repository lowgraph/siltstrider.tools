const {test}=require('node:test');const assert=require('node:assert/strict');
for(const query of [' ALD’RUHN ', 'Ald‑ruhn', 'Aldruhn']) test(`QA-07 canonical city and specific room spelling: ${query}`,async()=>{
 const {searchTravelOptions}=await import('../lib/travel-search.mjs');const {matchPlaces}=await import('../lib/travel-walk.mjs');
 const options=Object.freeze([Object.freeze({id:'Ald-ruhn',label:'Ald-ruhn',kind:'stop'}),Object.freeze({id:'place:interior:ald-ruhn, guild',label:'Ald-ruhn › Guild',kind:'interior',specificTown:'Ald-ruhn'})]);
 assert.deepEqual(searchTravelOptions(options,query).options.map(o=>o.id),['Ald-ruhn']);
 assert.equal(searchTravelOptions(options,query+' Guild').options[0].id,'place:interior:ald-ruhn, guild');
 const places=[{key:'exterior:-2,6',name:'Ald-ruhn',interior:false,grid:[-2,6]}];
 assert.deepEqual(matchPlaces(places,query,{stops:["Ald'ruhn"]}),[]);
 assert.deepEqual(searchTravelOptions(null,query).options,[]);assert.deepEqual(matchPlaces(places,null),[]);
});
