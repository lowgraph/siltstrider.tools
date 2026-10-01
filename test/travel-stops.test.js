const { test } = require('node:test');
const assert = require('node:assert/strict');
const lib = () => import('../lib/travel-stops.mjs');
const a = 'exterior:0,0', b = 'interior:balmora, guild of mages', c = 'interior:caldera, guild of mages';
const nodes = { [a]: { name: 'Balmora', town: 'Balmora' }, [b]: { name: 'Balmora, Guild of Mages', town: 'Balmora' },
  [c]: { name: 'Caldera, Guild of Mages', town: 'Caldera' } };
const records = [{ from: a, to: 'exterior:9,0', mode: 'silt_strider', provider: 'driver', fromPos: [100,100], toPos: [75000,100], price: 5, hours: 1 },
  { from: b, to: c, mode: 'guild_guide', provider: 'guide', requiresMageGuild: true, price: 10, hours: 0 }];
const access = { records: [{ key: b, exits: [[1100,100]], depth: 0 }] };
const land = { [a]: 'ffffffffffffffff' };

test('strider to guild hall requires a timed walk before the guild guide', async () => {
  const { buildTransitStops, transitStopId } = await lib();
  const { addStopWalks } = await import('../lib/travel-walk.mjs');
  const { planRoute } = await import('../lib/travel-graph.mjs');
  const network = buildTransitStops(records, nodes, { access });
  const graph = addStopWalks(network.graph, network.points, land, 100);
  const route = planRoute(transitStopId(a,[100,100]), transitStopId(c), graph, { objective: 'real' });
  assert.equal(route.isValid, true);
  assert.deepEqual(route.steps.map(s => s.kind), ['Walk','Guild Guide']);
  assert.equal(route.steps[0].movementSeconds, 10);
  assert.equal(route.steps[0].hours, 1/12);
  assert.equal(network.graph.Balmora, undefined, 'no town shortcut');
  assert.equal(planRoute(transitStopId(a,[100,100]),transitStopId(c),network.graph).isValid,false,'walking off prevents transfer');
});

test('arrivals and different operators in one exterior cell cannot bypass the walk', async () => {
  const { buildTransitStops, transitStopId } = await lib();
  const network = buildTransitStops([...records,
    { from: 'exterior:9,0', to: a, mode: 'boat', fromPos:[75000,100], toPos:[500,100] },
    { from: a, to:'exterior:8,0', mode:'boat', provider:'boat', fromPos:[900,100],toPos:[68000,100] }],nodes,{access});
  assert.notEqual(transitStopId(a,[500,100]),transitStopId(a,[100,100]));
  assert.equal(network.graph[transitStopId(a,[500,100])].length,0);
  assert.deepEqual(network.points.get(transitStopId(a,[900,100])),[[900,100]]);
});

test('indoor positions are local coordinates; only published exits time the outdoor transfer', async () => {
  const { buildTransitStops, transitStopId } = await lib();
  const network = buildTransitStops(records.map(r=>({...r, ...(r.from===b?{fromPos:[999999,999999]}:{})})),nodes,{access});
  assert.deepEqual(network.points.get(transitStopId(b)),[[1100,100]]);
});

test('null, malformed and missing coordinates never invent free transfers; inputs stay frozen',async()=>{
  const {buildTransitStops,transitStopId}=await lib();
  const input=Object.freeze([null,{},Object.freeze({...records[0],fromPos:null}),{from:42,to:a}, {from:a,to:undefined}]);
  const n=buildTransitStops(input,nodes);
  assert.equal(n.points.get(transitStopId(a,null,'departure:driver')).length,0);
  assert.equal(transitStopId(a,[NaN,1]),transitStopId(a,null));
  assert.equal(transitStopId(a,[,1]),transitStopId(a,null));
  assert.equal(transitStopId(a,[1,Infinity]),transitStopId(a,null));
  assert.equal(transitStopId(null,[0,0]),null);
  assert.equal(input[2].fromPos,null);
});

test('interventions preserve the exact landing and originate in each specific cell',async()=>{
  const {buildTransitStops,addTransitInterventions,transitStopId}=await lib();
  const intervention={records:[{key:b,almsivi:0},{key:a,almsivi:0}],markers:{almsivi:[{cell:a,pos:[2100,100],town:'Balmora',name:'Balmora, Temple'}]}};
  const n=buildTransitStops(records,nodes,{access,intervention});
  const g=addTransitInterventions(n,intervention,{almsivi:true});
  const landing=transitStopId(a,[2100,100]);
  assert.equal(g[transitStopId(b)].find(e=>e.spell).to,landing);
  assert.notEqual(landing,transitStopId(a,[100,100]));
  assert.equal(g[landing].length,0);
  assert.ok(!g.Balmora);
});

test('old town links stay merged and specific stop IDs survive',async()=>{
  const {buildTransitStops,resolveTransitEndpoint,transitStopId}=await lib();
  const n=buildTransitStops(records,nodes,{access});
  assert.equal(resolveTransitEndpoint('Balmora',n),'Balmora');
  assert.equal(resolveTransitEndpoint('BALMORA',n),'Balmora');
  assert.equal(resolveTransitEndpoint('place:'+b,n),transitStopId(b));
  assert.equal(resolveTransitEndpoint(transitStopId(b),n),transitStopId(b));
});

test('city search stays merged until a specific hall or platform is searched',async()=>{
  const {buildTravelSearchOptions,searchTravelOptions}=await import('../lib/travel-search.mjs');
  const {buildTransitStops}=await lib();
  const n=buildTransitStops(records,nodes,{access});
  const places=[{key:a,name:'Balmora',interior:false,grid:[0,0]},
    {key:'exterior:0,1',name:'Balmora',interior:false,grid:[0,1]}, {key:b,name:'Balmora, Guild of Mages',interior:true}];
  const options=buildTravelSearchOptions({stops:Object.keys(n.graph),graph:n.graph,transitStops:n.stops,places});
  const found=searchTravelOptions(options,'Balmora').options;
  assert.deepEqual(found.map(o=>[o.id,o.label]),[['Balmora','Balmora']]);
  assert.equal(searchTravelOptions(options,'bal').options.filter(o=>o.specificTown).length,0);
  assert.equal(searchTravelOptions(options,'Balmora Guild').options[0].id,'stop:'+b);
  assert.equal(searchTravelOptions(options,'Balmora strider').options[0].id,'stop:exterior:0,0@100,100');
  assert.equal(searchTravelOptions(options,'').options.filter(o=>o.specificTown).length,0);
});

test('unspecified cities choose the best boundary platforms without creating transfer shortcuts', async()=>{
  const {buildTransitStops,transitStopId,transitEndpointStops}=await lib();
  const {addStopWalks}=await import('../lib/travel-walk.mjs');
  const {planRoute}=await import('../lib/travel-graph.mjs');
  const arrival=transitStopId(a,[100,100]);
  const n=buildTransitStops([...records,{from:'exterior:9,0',to:a,mode:'silt_strider',fromPos:[75000,100],toPos:[100,100],hours:1}],
    {...nodes,['exterior:9,0']:{name:'Seyda Neen',town:'Seyda Neen'}},{access});
  const g=addStopWalks(n.graph,n.points,land,100);
  const plan=(from,to,graph=g)=>planRoute(transitEndpointStops(from,n),transitEndpointStops(to,n),graph);
  assert.deepEqual(plan('Balmora','Caldera').steps.map(s=>s.kind),['Guild Guide'],'no specific starting point was requested');
  assert.deepEqual(plan('Seyda Neen','Caldera').steps.map(s=>s.kind),['Silt Strider','Walk','Guild Guide']);
  assert.equal(plan('Seyda Neen','Caldera').steps[1].from,arrival);
  assert.equal(plan('Seyda Neen','Caldera',n.graph).isValid,false,'merged city choices cannot be used during transfers');
  assert.equal(plan(arrival,'stop:'+b).steps[0].movementSeconds,10,'specific places require the walk');
  assert.equal(n.graph.Balmora,undefined);
});

test('city boundaries preserve objective, resource budgets and actual path IDs',async()=>{
  const {planRoute}=await import('../lib/travel-graph.mjs');
  const graph={strider:[{to:'arrival',kind:'Silt Strider',price:5,hours:1}],
    hall:[{to:'arrival',kind:'Guild Guide',price:2,hours:0}],arrival:[{to:'finish',kind:'Divine Intervention',resource:'scroll',uses:1,free:true,hours:0}],finish:[]};
  const options={goldOf:e=>e.free?0:e.price,resources:{scroll:1},objective:'gold'};
  const p=planRoute(['strider','hall'],'finish',graph,options);
  assert.deepEqual(p.path,['hall','arrival','finish']);
  assert.equal(p.hops,2);assert.equal(p.totals.gold,2);
  assert.equal(p.steps[1].remaining,0);
  assert.equal(planRoute(['strider','hall'],'finish',graph,{...options,resources:{scroll:0}}).isValid,false);
});

test('Vivec cantons stay under one city until a specific district is searched',async()=>{
  const {buildTravelSearchOptions,searchTravelOptions}=await import('../lib/travel-search.mjs');
  const stop={id:'stop:interior:vivec, guild of mages',cell:'interior:vivec, guild of mages',
    label:'Vivec › Guild of Mages',town:'Vivec',interior:true,services:new Set(['Guild Guide']),points:[]};
  const options=buildTravelSearchOptions({stops:[stop.id],transitStops:new Map([[stop.id,stop]]),
    places:[{key:'exterior:3,-10',name:'Vivec, Foreign Quarter',interior:false,grid:[3,-10]},
      {key:'exterior:4,-10',name:'Vivec, Foreign Quarter',interior:false,grid:[4,-10]},
      {key:'interior:vivec, temple',name:'Vivec, Temple',interior:true}]});
  assert.deepEqual(searchTravelOptions(options,'Vivec').options.map(o=>o.id),['Vivec']);
  assert.deepEqual(searchTravelOptions(options,'Vivec Foreign Quarter').options.map(o=>o.label),['Vivec, Foreign Quarter']);
  assert.equal(searchTravelOptions(options,'Vivec Temple').options[0].id,'place:interior:vivec, temple');
});

test('empty, duplicate and unknown boundary candidates do not create routes or mutate frozen input',async()=>{
  const {planRoute}=await import('../lib/travel-graph.mjs');
  const graph={a:[{to:'b',kind:'Boat'}],b:[]};
  const starts=Object.freeze(['missing',null,'a','a']);
  assert.deepEqual(planRoute(starts,['b','missing'],graph).path,['a','b']);
  assert.equal(planRoute([],['b'],graph).isValid,false);
  assert.equal(planRoute(['a'],[],graph).isValid,false);
  assert.deepEqual(planRoute(starts,['a','b'],graph).path,['a']);
  assert.equal(starts.length,4);
});

test('missing arrival and departure coordinates cannot invent a free city transfer',async()=>{
  const {buildTransitStops,transitEndpointStops}=await lib();
  const {planRoute}=await import('../lib/travel-graph.mjs');
  const n=buildTransitStops([
    {from:'exterior:9,0',to:a,mode:'silt_strider',fromPos:[75000,100],toPos:null},
    {from:a,to:c,mode:'boat',fromPos:null}
  ],{...nodes,['exterior:9,0']:{name:'Seyda Neen',town:'Seyda Neen'}},{access});
  const inCity=n.cities.get('Balmora');
  assert.equal(inCity.length,2,'unknown arrival and departure are separate stops');
  assert.ok(inCity.every(id=>!n.points.get(id).length));
  assert.equal(planRoute(transitEndpointStops('Seyda Neen',n),transitEndpointStops('Caldera',n),n.graph).isValid,false);
});

test('membership gates and missing door access still prevent unavailable journeys',async()=>{
  const {buildTransitStops,transitStopId}=await lib();
  const n=buildTransitStops(records,nodes,{mageGuild:false});
  assert.equal(n.graph[transitStopId(b)].length,0);
  assert.deepEqual(n.points.get(transitStopId(b)),[]);
});

test('scripted teleport landing points stay separate from a town platform', async()=>{
  const {buildTransitStops,transitStopId}=await lib();
  const {addTeleports}=await import('../lib/travel-teleports.mjs');
  const teleports=[{kind:'item',to:a,toPos:[2100,100],requires:['ring']}];
  const n=buildTransitStops(records,nodes,{access,teleports});
  const g=addTeleports(n.graph,{records:teleports},{held:new Set(['ring']),endpointFor:transitStopId}).graph;
  assert.equal(g[transitStopId(b)].find(e=>e.teleport).to,transitStopId(a,[2100,100]));
  assert.notEqual(transitStopId(a,[2100,100]),transitStopId(a,[100,100]));
  assert.equal(g[transitStopId(a,[2100,100])].some(e=>e.to===transitStopId(a,[100,100])),false);
});
