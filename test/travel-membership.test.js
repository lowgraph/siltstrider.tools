const {test}=require('node:test');const assert=require('node:assert/strict');
const nodes={a:{name:'Vivec'},b:{name:'Old Ebonheart'},c:{name:'Balmora'}};
const records=[{from:'a',to:'b',mode:'guild_guide',requiresMageGuild:true,requiresConjurer:true},{from:'a',to:'c',mode:'guild_guide',requiresMageGuild:true},{from:'b',to:'c',mode:'boat'}];
test('membership off removes guides while preserving other transport and stops',async()=>{const {adaptTravelGraph}=await import('../lib/travel-graph.mjs');const g=adaptTravelGraph(records,nodes,{mageGuild:false,conjurer:true});assert.deepEqual(g.Vivec,[]);assert.equal(g['Old Ebonheart'].length,1);});
test('Conjurer edges are excluded by default and enabled explicitly',async()=>{const {adaptTravelGraph}=await import('../lib/travel-graph.mjs');assert.equal(adaptTravelGraph(records,nodes).Vivec.length,1);assert.equal(adaptTravelGraph(records,nodes,{conjurer:true}).Vivec.length,2);});
test('an empty filtered network does not resurrect fallback routes',async()=>{const {buildNetworkGraph}=await import('../lib/travel-graph.mjs');assert.deepEqual(buildNetworkGraph('tr',{}),{});});
