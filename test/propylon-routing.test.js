const {test}=require('node:test');const assert=require('node:assert/strict');
const {loader,staged}=require('./helpers/qa-staged-data.cjs');
for(const profile of ['vanilla','tr','tr_arce'])for(const scenario of ['no-index','wrong-origin','adjacent-index','master-diversion'])test(`FLOW-04 ${profile}: ${scenario} uses only published Propylon connections`,staged(),async()=>{
  const l=await loader(),d=await l.loadFeature(profile,'travel');
  const {buildTransitStops,transitStopId}=await import('../lib/travel-stops.mjs');
  const {heldFromSave,usableTeleport,addTeleports}=await import('../lib/travel-teleports.mjs');const {planRoute}=await import('../lib/travel-graph.mjs');
  const items=scenario==='no-index'?[]:scenario==='master-diversion'?['INDEX_ANDRA','INDEX_MASTER']:['INDEX_ANDRA'];
  const held=heldFromSave({stuff:{inventory:items.map(id=>({id,count:1}))}});
  const catalog={records:d.catalogs.Teleports,items:d.metadata.Teleports.items};
  assert.equal(catalog.records.some(t=>t.kind==='propylon'&&t.from?.includes('interior:rotheran, propylon chamber')&&t.to==='interior:andasreth, propylon chamber'),false,'There is no direct Rotheran → Andasreth record');
  const n=buildTransitStops(d.catalogs.Travel,d.metadata.Travel.nodes,{providers:d.metadata.Travel.providers,places:d.catalogs.Places,teleports:catalog.records.filter(t=>usableTeleport(t,held)),access:{records:d.catalogs.Access}});
  const graph=addTeleports(n.graph,catalog,{held,nodes:n.cellNodes,endpointFor:transitStopId}).graph;
  const from=scenario==='wrong-origin'||scenario==='master-diversion'?'rotheran':'berandas';
  const route=planRoute(transitStopId(`interior:${from}, propylon chamber`),transitStopId('interior:andasreth, propylon chamber'),graph);
  if(scenario==='no-index'||scenario==='wrong-origin'){assert.equal(route.isValid,false);return;}
  assert.equal(route.isValid,true);assert.deepEqual(route.steps.map(s=>s.kind),scenario==='adjacent-index'?['Propylon']:['Propylon','Propylon']);
  if(scenario==='master-diversion')assert.match(route.path[1],/caldera, guild of mages/);
  assert.equal(route.totals.gold,0);
});
