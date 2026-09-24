const {test}=require('node:test');
const assert=require('node:assert/strict');
test('catalog preserves duplicate names and provenance and renders extracted enchantments',async()=>{
 const {equipmentCatalog}=await import('../lib/equipment-catalog.mjs');
 const {aggregateConstantEffects}=await import('../lib/equipment-math.mjs');
 const items=['a','b'].map(key=>({key,name:'Ring',type:'ring',enchantmentId:'en',provenance:{winningPlugin:'Example.esp'}}));
 const data=equipmentCatalog({Clothing:items,Enchantments:[{key:'en',castType:'constant',effects:[{name:'Fortify Attribute',attribute:'strength',magnitude:{min:5,max:5}}]}]});
 assert.equal(data.items.length,2);assert.match(data.items[0].effectText,/Fortify Strength 5 pts/);
 assert.equal(data.items[1].provenance.winningPlugin,'Example.esp');
 assert.equal(aggregateConstantEffects({LeftRing:data.items[0]},data.enchantments).length,1);
});
test('empty catalogs and incompatible slots never invent equipment; open helmets use body parts',async()=>{
 const {equipmentCatalog,itemsForSlot}=await import('../lib/equipment-catalog.mjs');
 assert.deepEqual(equipmentCatalog().items,[]);
 const open={key:'open',type:'helmet',bodyParts:[{slot:1}]},closed={key:'closed',type:'helmet',bodyParts:[{slot:0}]};
 assert.deepEqual(itemsForSlot([open,closed],'Helmet','Khajiit'),[open]);
 assert.deepEqual(itemsForSlot([open,closed],'Cuirass',''),[]);
});
test('armor class uses per-slot game settings and sheet skill wrappers preserve zero',async()=>{
 const {equipmentCatalog}=await import('../lib/equipment-catalog.mjs');
 const {getSkillRating}=await import('../lib/equipment-math.mjs');
 const data=equipmentCatalog({Armor:[{key:'helm',type:'helmet',weight:5}],GameSettings:[{id:'iHelmWeight',value:5},{id:'fLightMaxMod',value:.6},{id:'fMedMaxMod',value:.9}]});
 assert.equal(data.items[0].armorClass,'heavy');
 assert.equal(getSkillRating({'Heavy Armor':{v:0}},'HeavyArmor'),0);
 assert.equal(getSkillRating({'Heavy Armor':{v:72}},'HeavyArmor'),72);
});
