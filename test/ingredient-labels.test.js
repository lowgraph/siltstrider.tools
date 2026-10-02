const {test}=require('node:test');const assert=require('node:assert/strict');
const qa=require('./helpers/qa-staged-data.cjs');
test('duplicate ingredients use actual weight, value and ordered targeted effects',async()=>{
 const {ingredientLabels}=await import('../lib/ingredient-labels.mjs');
 const records=[{key:'a',name:'Bread',weight:.20000000298,value:1},{key:'b',name:'Bread',weight:.4,value:3},
 {key:'c',name:'Crystal',weight:1,value:10,effects:[{slot:0,name:'Fortify Attribute',attribute:'strength'}]},
 {key:'d',name:'Crystal',weight:1,value:20,effects:[{slot:0,name:'Restore Health'}]}];
 const labels=ingredientLabels(records);assert.equal(labels.get('a'),'Bread (0.2 weight)');assert.equal(labels.get('b'),'Bread (0.4 weight)');
 assert.equal(labels.get('c'),'Crystal (10 gold value; Fortify Strength)');assert.equal(labels.get('d'),'Crystal (20 gold value; Restore Health)');
});
test('origin and attached scripts qualify variants without inferring a curse or quest from IDs',async()=>{
 const {ingredientLabels}=await import('../lib/ingredient-labels.mjs');
 const records=[{key:'cursed_unknown',name:'Emerald',script:null,provenance:{originPlugin:'Morrowind.esm'}},
 {key:'b',name:'Emerald',script:'unexplained',provenance:{originPlugin:'Morrowind.esm'}},
 {key:'c',name:'Emerald',script:'another',provenance:{originPlugin:'TR_Mainland.esm'}}];
 const labels=ingredientLabels(records);assert.equal(labels.get('cursed_unknown'),'Emerald (Morrowind)');assert.equal(labels.get('b'),'Emerald (Morrowind; scripted variant)');assert.equal(labels.get('c'),'Emerald (Tamriel Rebuilt; scripted variant)');
 assert.ok([...labels.values()].every(n=>!n.includes('cursed')));
});
test('identical and missing facts keep separate IDs without fabricated distinctions or mutation',async()=>{
 const {ingredientLabels}=await import('../lib/ingredient-labels.mjs');const {ingredientEntries}=await import('../lib/site-search.mjs');
 const records=Object.freeze([Object.freeze({key:'a',id:'a',name:'Pearl',weight:null,value:NaN}),Object.freeze({key:'b',id:'b',name:'Pearl',weight:null,value:NaN})]);
 const labels=ingredientLabels(records);assert.equal(labels.size,2);assert.deepEqual([...labels.values()],['Pearl','Pearl']);
 const entries=ingredientEntries(records);assert.equal(entries.length,2);assert.deepEqual(entries.map(e=>e.id),['ingredient:a','ingredient:b']);assert.ok(entries.every(e=>e.title==='Pearl'&&!e.subtitle.includes(e.ref.record.id)));
 assert.deepEqual([...ingredientLabels(null)],[]);assert.equal(ingredientLabels([null,{key:'x'}]).get('x'),'Unknown ingredient');assert.equal(records[0].name,'Pearl');
});
for(const profile of ['vanilla','tr','tr_arce'])test(`staged ${profile} labels retain every record, potion effects and acquisition keys`,qa.staged(),async()=>{
 const l=await qa.loader(),data=await l.loadFeature(profile,'alchemy');const {adaptAlchemy}=await import('../lib/alchemy-catalogs.mjs');const {ingredientEntries}=await import('../lib/site-search.mjs');
 const a=adaptAlchemy(data);assert.equal(a.ingredients.length,data.catalogs.Ingredients.length);assert.equal(new Set(a.ingredients.map(i=>i.id)).size,a.ingredients.length);
 const emeralds=a.ingredients.filter(i=>i.source.name==='Emerald');assert.ok(emeralds.length>=2);assert.ok(emeralds.every(i=>!i.n.includes('ingred_')&&!i.n.includes('tr_')));
 const ordinary=emeralds.find(i=>i.id==='ingred_emerald_01'),scripted=emeralds.find(i=>i.id==='ingred_dae_cursed_emerald_01');assert.match(scripted.n,/scripted variant/);assert.deepEqual(ordinary.effects,scripted.effects);
 for(const ingredient of a.ingredients){assert.equal(ingredient.source.key,ingredient.id);assert.equal(ingredient.w,ingredient.source.weight);assert.equal(ingredient.v,ingredient.source.value);assert.ok(!ingredient.n.includes('['+ingredient.id+']'));}
 assert.equal(ingredientEntries(data.catalogs.Ingredients).length,data.catalogs.Ingredients.filter(r=>r.name&&!/^s*<.*>s*$/.test(r.name)).length);
 if(profile!=='vanilla')assert.deepEqual(a.ingredients.filter(i=>i.source.name==='Braided Bread').map(i=>i.n),['Braided Bread (0.1 weight)','Braided Bread (0.2 weight)','Braided Bread (0.4 weight)','Braided Bread (0.8 weight)']);
 const sources=await l.loadFeature(profile,'ingredientSources');const byKey=new Set(sources.catalogs.IngredientSources.map(r=>r.key));assert.ok(byKey.has(ordinary.id));
 });
