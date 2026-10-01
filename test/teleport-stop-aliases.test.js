const {test}=require('node:test');
const assert=require('node:assert/strict');
const source='interior:ebonheart, grand council chambers';
const destination='interior:mournhold, royal palace: reception area';
const teleport={kind:'dialogue',from:[source],to:destination,speakerName:'Asciene Rane',topic:'transport to mournhold',requires:[],unless:[],questGated:false};
async function modules(){return {...await import('../lib/travel-stops.mjs'),...await import('../lib/travel-teleports.mjs'),...await import('../lib/travel-graph.mjs')};}

test('QA-16 teleport-only city boundaries reach the exact destination without walking',async()=>{
  const {buildTransitStops,transitEndpointStops,transitStopId,addTeleports,planRoute}=await modules();
  const n=buildTransitStops([],{}, {teleports:[teleport],places:[{key:source,name:'Ebonheart, Grand Council Chambers'},{key:destination,name:'Mournhold, Royal Palace: Reception Area'}]});
  const graph=addTeleports(n.graph,{records:[teleport]},{endpointFor:transitStopId}).graph;
  for(const objective of ['hops','time','gold','real']){
    const route=planRoute(transitEndpointStops('Ebonheart',n),transitEndpointStops('MOURNHOLD',n),graph,{objective});
    assert.equal(route.isValid,true);assert.equal(route.hops,1);assert.equal(route.steps[0].kind,'Dialogue Teleport');assert.equal(route.path.at(-1),transitStopId(destination));
  }
  assert.equal(n.graph.Mournhold,undefined);assert.match(n.stops.get(transitStopId(destination)).label,/Royal Palace/);
});
test('QA-16 missing Places still uses the interior naming convention and matches city case',async()=>{
  const {buildTransitStops,transitEndpointStops,resolveTransitEndpoint,transitStopId}=await modules();
  const n=buildTransitStops([],{}, {teleports:[teleport]});
  assert.deepEqual(transitEndpointStops('Mournhold',n),[transitStopId(destination)]);
  assert.equal(resolveTransitEndpoint('MOURNHOLD',n),'mournhold');
  assert.deepEqual(transitEndpointStops('Unknown',n),'Unknown');
  assert.equal(resolveTransitEndpoint(transitStopId(destination),n),transitStopId(destination));
});
test('QA-16 explicit Travel town metadata wins over a conflicting Places prefix',async()=>{
  const {buildTransitStops,transitEndpointStops,transitStopId}=await modules();
  const n=buildTransitStops([], {[destination]:{name:'Royal Palace',town:'Mournhold'}}, {teleports:[teleport],places:[{key:destination,name:'Other City, Palace'}]});
  assert.deepEqual(transitEndpointStops('Mournhold',n),[transitStopId(destination)]);assert.equal(n.cities.has('Other City'),false);
});
test('QA-16 shared city aliases do not connect separate rooms or join exterior positions',async()=>{
  const {buildTransitStops,transitEndpointStops,transitStopId,planRoute}=await modules();
  const second='interior:mournhold, temple';
  const n=buildTransitStops([],{}, {teleports:[teleport,{...teleport,to:second}]});
  assert.equal(transitEndpointStops('Mournhold',n).length,2);
  assert.equal(planRoute(transitStopId(destination),transitStopId(second),n.graph).isValid,false);
  const outdoors=buildTransitStops([],{}, {teleports:[{...teleport,to:'exterior:0,0',toPos:[1,2]},{...teleport,to:'exterior:0,0',toPos:[8,9]}],places:[{key:'exterior:0,0',name:'Region, wilderness'}]});
  assert.equal(outdoors.cities.has('Region'),false);assert.notEqual(transitStopId('exterior:0,0',[1,2]),transitStopId('exterior:0,0',[8,9]));
});
test('QA-16 malformed/frozen place labels cannot invent aliases or mutate catalogs',async()=>{
  const {buildTransitStops,transitStopId}=await modules();
  const places=Object.freeze([null,{},Object.freeze({key:destination,name:42}),{key:'not-a-cell',name:'Wrong, room'}]);
  const n=buildTransitStops([],{}, {teleports:[Object.freeze(teleport)],places});
  assert.equal(n.stops.get(transitStopId(destination)).town,'mournhold');assert.equal(places[2].name,42);
  assert.equal(n.cities.has('Wrong'),false);
});
test('QA-16 aliases cannot bypass quest or held-item teleport restrictions',async()=>{
  const {buildTransitStops,usableTeleport,addTeleports,transitStopId,transitEndpointStops,planRoute}=await modules();
  for(const record of [{...teleport,questGated:true},{...teleport,requires:['index']},{...teleport,unless:['blocked']}]){
    const held=new Set(['blocked']);const available=[record].filter(t=>usableTeleport(t,held,false));
    const n=buildTransitStops([],{}, {teleports:available});
    const graph=addTeleports(n.graph,{records:[record]},{held,endpointFor:transitStopId}).graph;
    assert.equal(n.cities.has('mournhold'),false);assert.equal(planRoute(transitEndpointStops('Ebonheart',n),transitEndpointStops('Mournhold',n),graph).isValid,false);
  }
});
