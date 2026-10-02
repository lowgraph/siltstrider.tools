const {test} = require('node:test');
const assert = require('node:assert/strict');
const modules = Promise.all([import('../lib/best-in-slot.mjs'), import('../lib/recommended-loadout.mjs')]);
const {loader,staged}=require('./helpers/qa-staged-data.cjs');

function fixture({model=true}={}) {
  const item = (key, slot, beastWearable=true, extra={}) => ({key, name:key, slot, type:slot, beastWearable, effects:[], armorClass:'heavy', armorRating:40, source:{kind:'placed', easiestLevel:0}, ...extra});
  const items = {
    boots:item('boots','boots',false), closed:item('closed','helmet',false),
    open:item('open','helmet'), ring:item('ring','ring'),
    sword:item('sword','weapon',true,{type:'LB1H',recordType:'WEAP',weaponSkill:'long_blade',damage:20}),
    spear:item('spear','weapon',true,{type:'SP2H',recordType:'WEAP',weaponSkill:'spear',damage:30})
  };
  const picks = keys => keys.map(item => ({item, score:10, reasons:[], warnings:[]}));
  const record = {key:'premade',build:'QA Non-beast premade',race:'high elf',toggles:{allowFormidableSources:false},slots:{
    boots:picks(['boots']), helmet:picks(['closed','open']), ring:picks(['ring']), weapon:picks(['sword','spear'])
  }};
  const scoring = {tiers:{},effects:{},armour:{major:8,minor:5,misc:2,ratingCap:80},weapons:{major:8,minor:5,misc:1,damageCap:60}};
  return {catalogs:{BestInSlot:[record],Armor:[{...items.closed,bodyParts:[{slot:0}]},{...items.open,bodyParts:[{slot:1}]}],Clothing:[items.ring],Weapons:[items.sword,items.spear]},metadata:{BestInSlot:{items,...(model?{model:scoring}:{})}}};
}
const allPicks = result => result.groups.flatMap(g => g.rows.flatMap(r => r.picks));

for(const path of ['named','dynamic','fallback']) for(const weaponSetup of [null,'one-handed','two-handed']) {
  test(`QA-10 ${path} recommendations and every runner-up stay wearable with ${weaponSetup||'no hand preference'}`, async()=>{
    const [{resolveBestInSlotPicks},{recommendedLoadouts}] = await modules;
    const data=fixture({model:path!=='fallback'}), before=JSON.stringify(data);
    for(const race of ['Argonian','Khajiit','Khajiit (Cathay-raht)']) {
      const build={name:path==='named'?'QA Non-beast premade':'QA Custom',race,maj:['Long Blade','Spear'],min:[]};
      const result=resolveBestInSlotPicks(data,build,{beast:true,weaponSetup});
      const picks=allPicks(result);
      assert.ok(picks.length>0,'eligible recommendations remain');
      assert.ok(picks.some(p=>p.item.key==='open'),'open helmet remains');
      assert.ok(picks.every(p=>p.item.beastWearable===true),race+' has no forbidden primary or runner-up');
      const equipped=recommendedLoadouts(result.groups,data.catalogs,build,{late:true,beast:true})[0].items;
      assert.equal(equipped.Helmet.key,'open');assert.equal(equipped.Boots,undefined);
      if(weaponSetup)assert.equal(equipped.CarriedRight.key,weaponSetup==='one-handed'?'sword':'spear');
    }
    assert.equal(JSON.stringify(data),before,'filtering never mutates the pinned catalog');
  });
}

test('QA-10 catalog non-beast ARCE Khajiit keeps footwear in display and equipped recommendations',async()=>{
  const [{resolveBestInSlotPicks},{recommendedLoadouts}]=await modules;
  const data=fixture(),build={name:'QA Non-beast premade',race:'Khajiit (Suthay)',maj:[],min:[]};
  const result=resolveBestInSlotPicks(data,build,{beast:false,weaponSetup:'one-handed'});
  assert.ok(allPicks(result).some(p=>p.item.key==='boots'));
  const items=recommendedLoadouts(result.groups,{...data.catalogs,Armor:[...data.catalogs.Armor,data.metadata.BestInSlot.items.boots]},build,{late:true,beast:false})[0].items;
  assert.equal(items.Boots.key,'boots');assert.equal(items.Helmet.key,'closed');
});

test('QA-10 missing item metadata, null picks and missing wearable flags cannot leak into beast kits',async()=>{
  const [{resolveBestInSlotPicks}]=await modules;
  const data=fixture();data.catalogs.BestInSlot[0].slots.helmet.unshift(null,{item:'missing'}, {item:'unknown'});
  data.metadata.BestInSlot.items.unknown={key:'unknown',name:'Unknown helmet',slot:'helmet'};
  const result=resolveBestInSlotPicks(data,{name:'QA Non-beast premade',race:'Argonian'});
  assert.deepEqual(allPicks(result).filter(p=>p.item.slot==='helmet').map(p=>p.item.key),['open']);
});

test('QA-10 published head body part and footwear slot override an inconsistent wearable flag',async()=>{
  const [{resolveBestInSlotPicks}]=await modules;
  const data=fixture();data.metadata.BestInSlot.items.closed.beastWearable=true;data.metadata.BestInSlot.items.boots.beastWearable=true;
  const result=resolveBestInSlotPicks(data,{name:'QA Non-beast premade',race:'Argonian'},{beast:true});
  assert.ok(allPicks(result).every(p=>!['closed','boots'].includes(p.item.key)));
  assert.ok(allPicks(result).some(p=>p.item.key==='open'));
});

test('QA-10 catalog beast flags govern real kits and equipped transfers in every profile',staged(),async()=>{
  const [{resolveBestInSlotPicks},{recommendedLoadouts}]=await modules;
  const l=await loader();const {raceDisplayName}=await import('../lib/character-catalogs.mjs');
  for(const profile of ['vanilla','tr','tr_arce']) {
    const data=await l.loadFeature(profile,'bestInSlot'),races=await l.loadCatalog(profile,'Races');
    const bearclaw=Object.values(data.metadata.BestInSlot.items).find(i=>i.name==='Helm of Oreyn Bearclaw');
    assert.ok(bearclaw, 'The open-helmet example exists in this world');
    assert.equal(bearclaw.beastWearable,true,'The named open helmet remains eligible');
    for(const key of ['argonian','khajiit',...(profile==='tr_arce'?['t_els_cathay-raht','t_bkm_naga','t_els_suthay']:[])]) {
      const source=races.find(r=>r.key===key);assert.ok(source);
      const build={name:'Altmer Atronach Spellweaver',race:raceDisplayName(source),maj:['Long Blade'],min:['Heavy Armor']};
      for(const weaponSetup of ['one-handed','two-handed']) {
        const result=resolveBestInSlotPicks(data,build,{beast:source.beast,weaponSetup});
        assert.ok(allPicks(result).length>0);
        if(source.beast)assert.ok(allPicks(result).every(p=>p.item.beastWearable===true));
        const items=recommendedLoadouts(result.groups,data.catalogs,build,{late:true,beast:source.beast})[0].items;
        if(source.beast)assert.equal(items.Boots,undefined);else assert.ok(items.Boots);
      }
    }
  }
});

test('QA-10 explicit catalog flags and legacy race inference agree when equipping',async()=>{
  const {equipItem}=await import('../lib/equipment-math.mjs');
  const {itemsForSlot}=await import('../lib/equipment-catalog.mjs');
  const boots={key:'qa_boots',type:'boots'};
  assert.equal(equipItem({},'Boots',boots,{race:'QA Beast',beast:true}).success,false);
  assert.equal(equipItem({},'Boots',boots,{race:'Khajiit (Suthay)',beast:false}).success,true);
  assert.deepEqual(itemsForSlot([boots],'Boots','Khajiit (Suthay)',{beast:false}),[boots]);
  assert.deepEqual(itemsForSlot([boots],'Boots','QA Beast',{beast:true}),[]);
  for(const beast of [undefined,null,'false'])assert.equal(equipItem({},'Boots',boots,{race:'Argonian',beast}).success,false);
});
