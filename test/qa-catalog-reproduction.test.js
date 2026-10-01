const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loader,todo,staged}=require('./helpers/qa-staged-data.cjs');
for(const profile of ['tr','tr_arce']) test(`QA-06 obtainable apparatus only: ${profile}`,staged(todo('QA-06')),async()=>{
  const l=await loader();const {adaptAlchemy}=await import('../lib/alchemy-catalogs.mjs');const data=adaptAlchemy(await l.loadFeature(profile,'alchemy'));
  const leaked=Object.values(data.apparatus).flat().filter(r=>/secret\s*master/i.test(r.n)).map(r=>[r.id,r.n]);assert.deepEqual(leaked,[]);
});
for(const spelling of ["Ald'ruhn",'Ald’ruhn','Aldruhn']) test(`QA-07 town punctuation: ${spelling}`,todo('QA-07'),async()=>{
  const {buildTravelSearchOptions,searchTravelOptions}=await import('../lib/travel-search.mjs');const {matchPlaces}=await import('../lib/travel-walk.mjs');
  const options=buildTravelSearchOptions({stops:['Ald-ruhn'],includePlaces:false});assert.equal(searchTravelOptions(options,spelling).total,1);
  assert.equal(matchPlaces([{key:'exterior:-2,6',name:'Ald-ruhn',interior:false,grid:[-2,6]}],spelling).length,1);
});
for(const race of ['Argonian','Khajiit','Khajiit (Cathay-raht)']) test(`QA-10 premade endgame armor and runner-ups wearable: ${race}`,staged(),async()=>{
  const l=await loader();const data=await l.loadFeature(race.includes('(')?'tr_arce':'vanilla','bestInSlot');
  const {resolveBestInSlotPicks}=await import('../lib/best-in-slot.mjs');
  // Reproduce a premade whose race is edited: its original catalog name survives.
  const picks=resolveBestInSlotPicks(data,{name:'Altmer Atronach Spellweaver',race},{beast:true,weaponSetup:'one-handed'});
  const bad=picks.groups.flatMap(g=>g.rows.flatMap(r=>r.picks)).filter(p=>p.item.beastWearable===false).map(p=>p.item.name);assert.deepEqual(bad,[]);
});
test('QA-11 published faction names exist for all three reported raw IDs',staged(),async()=>{
  const l=await loader();for(const profile of ['tr','tr_arce']) {const factions=await l.loadCatalog(profile,'Factions');for(const [key,name] of [['t_cyr_fightersguild','Cyrodiil Fighters Guild'],['t_glb_archaeologicalsociety','Imperial Archaeological Society'],['t_mw_imperialnavy','East Navy']]) assert.equal(factions.find(f=>f.key===key)?.name,name);}
});
for(const profile of ['vanilla','tr','tr_arce']) test(`QA-16 Mournhold city choice expands to its everyday teleport stop: ${profile}`,staged(todo('QA-16')),async()=>{
  const l=await loader(),d=await l.loadFeature(profile,'travel');const {buildTransitStops,transitEndpointStops}=await import('../lib/travel-stops.mjs');const {usableTeleport,addTeleports}=await import('../lib/travel-teleports.mjs');
  const teleports=d.catalogs.Teleports.filter(t=>usableTeleport(t));const t=teleports.find(t=>t.source==='mhtransportscript');assert.ok(t);
  const network=buildTransitStops(d.catalogs.Travel,d.metadata.Travel.nodes,{providers:d.metadata.Travel.providers,access:{records:d.catalogs.Access},teleports});
  const graph=addTeleports(network.graph,{records:teleports},{nodes:network.cellNodes,endpointFor:(cell)=>'stop:'+cell}).graph;
  assert.ok(Object.values(graph).flat().some(e=>e.to==='stop:'+t.to&&/Asciene Rane/.test(e.label)),'usableTeleport and addTeleports retain the actual catalog route');
  assert.ok([transitEndpointStops('Mournhold',network)].flat().includes('stop:'+t.to),'city endpoint reaches its teleporter');
});
test('QA-20 every suggested Restore Health pair agrees with both published ingredient records',staged(),async()=>{
  const l=await loader();const {adaptAlchemy}=await import('../lib/alchemy-catalogs.mjs');const {findAlchemyPairs,alchemyEffectOptions}=await import('../lib/reverse-alchemy.mjs');
  for(const profile of ['vanilla','tr','tr_arce']) {
    const feature=await l.loadFeature(profile,'alchemy'),a=adaptAlchemy(feature),effect=alchemyEffectOptions(a.ingredients).find(e=>e.n==='Restore Health');assert.ok(effect);
    const found=findAlchemyPairs(a.ingredients,[effect.id],Number.MAX_SAFE_INTEGER);assert.ok(found.total>0);assert.equal(found.pairs.length,found.total);
    for(const pair of found.pairs) for(const ingredient of pair.ingredients) {
      const raw=feature.catalogs.Ingredients.find(i=>i.key===ingredient.id);assert.ok(raw.effects.some(e=>feature.catalogs.MagicEffects.find(m=>String(m.key)===String(e.effectId))?.name==='Restore Health'),`${profile}: ${raw.key}`);
    }
  }
});
