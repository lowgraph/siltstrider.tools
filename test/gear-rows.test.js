const {test}=require('node:test');
const assert=require('node:assert/strict');
const mod=import('../lib/gear-rows.mjs');
const toggles={theft:false,endgame:false,nearStart:false};
const row=(overrides={})=>({category:'armor',slot:'boots',armorClass:'heavy',toggles,...overrides});
test('gear policy combinations are independent and exact',async()=>{
 const {selectGearRows}=await mod;
 const rows=Array.from({length:8},(_,i)=>row({key:String(i),toggles:{theft:!!(i&4),endgame:!!(i&2),nearStart:!!(i&1)}}));
 for(const r of rows)assert.deepEqual(selectGearRows(rows,{maj:['Heavy Armor']},r.toggles),[r]);
});
test('gear filters major and minor skills, retains clothing, and excludes beast slots',async()=>{
 const {selectGearRows}=await mod;
 const rows=[row(),row({slot:'helmet'}),row({slot:'cuirass'}),row({armorClass:'light'}),row({category:'weapon',slot:null,skill:'long_blade'}),row({category:'clothing',slot:'robe'})];
 const build={maj:['Long Blade'],min:['Heavy Armor']};
 assert.equal(selectGearRows(rows,build,toggles).length,5);
 assert.deepEqual(selectGearRows(rows,build,toggles,{beast:true}),[rows[2],rows[4],rows[5]]);
 assert.equal(selectGearRows(rows,{},toggles,{allSkills:true}).length,6);
});
test('empty source rows and stronger alternatives are retained without claiming a complete loadout',async()=>{
 const {selectGearRows}=await mod;
 const rows=[row({primary:null}),row({primary:{key:'near'},alternative:{key:'far',strength:60}})];
 assert.deepEqual(selectGearRows(rows,{maj:['Heavy Armor']},toggles),rows);
});

test('Blunt Weapon display name maps to the published blunt skill',async()=>{
 const {selectGearRows}=await mod;const r=row({category:'weapon',skill:'blunt'});
 assert.deepEqual(selectGearRows([r],{maj:['Blunt Weapon']},toggles),[r]);
});

const profile={armRanked:[{n:'Heavy Armor'},{n:'Light Armor'},{n:'Medium Armor'}],primaryArmor:'Heavy Armor',wepRanked:[{n:'Long Blade'},{n:'Spear'}],primaryWep:'Long Blade',twoHand:false,shield:'recommended'};
const pick=(key,strength=20,nearStart=true)=>({key,name:key,strength,nearStart});
const gear=(slot,extra={})=>row({key:slot,slot,primary:pick(slot),alternative:null,...extra});
test('ranking chooses primary and one major alternative set, merges bracer slots and excludes gloves and shoes',async()=>{
 const {buildGearGroups}=await mod;
 const data={GearRows:[gear('boots'),gear('left_gauntlet'),gear('left_bracer',{primary:pick('bracer',30)}),gear('cuirass',{armorClass:'light'}),gear('cuirass',{armorClass:'medium'}),gear('left_glove',{category:'clothing'}),gear('shoes',{category:'clothing'}),gear('robe',{category:'clothing'})]};
 const groups=buildGearGroups(data,{maj:['Heavy Armor','Light Armor']},toggles,profile);
 assert.match(groups[0].label,/Primary armor/);assert.match(groups[1].label,/Alternative set/);
 assert.equal(groups[0].rows.filter(r=>r.slot==='left_gauntlet').length,1);
 assert.equal(groups[0].rows.find(r=>r.slot==='left_gauntlet').primary.key,'bracer');
 assert.deepEqual(groups.find(g=>g.label==='Clothing and jewelry').rows.map(r=>r.slot),['robe']);
 assert.ok(!groups.some(g=>g.label.includes('Medium Armor')));
});
test('one-handed primary retains shield and rejects two-handed secondary; two-handed fallback removes shield',async()=>{
 const {buildGearGroups}=await mod;
 const sword=gear(null,{category:'weapon',skill:'long_blade',hands:1});
 const two=gear(null,{category:'weapon',skill:'long_blade',hands:2});
 const spear=gear(null,{category:'weapon',skill:'spear',hands:2});
 const shield=gear(null,{category:'shield'});
 let groups=buildGearGroups({GearRows:[sword,two,spear,shield]}, {maj:['Heavy Armor']},toggles,profile);
 assert.ok(groups.some(g=>g.label==='Shield'));
 assert.ok(groups.flatMap(g=>g.rows).filter(r=>r.category==='weapon').every(r=>r.hands===1));
 groups=buildGearGroups({GearRows:[two,spear,shield]}, {maj:['Heavy Armor']},toggles,profile);
 assert.ok(!groups.some(g=>g.label==='Shield'));
 assert.equal(groups.find(g=>g.label.startsWith('Primary weapon')).rows[0].hands,2);
});
test('beast checks actual head and foot parts, promotes compatible alternative and never guesses missing records',async()=>{
 const {buildGearGroups}=await mod;
 const rows=[gear('helmet',{primary:pick('closed'),alternative:pick('open')}),gear('boots'),gear('cuirass',{primary:pick('missing')})];
 const Armor=[{key:'closed',bodyParts:[{slot:0}]},{key:'open',bodyParts:[{slot:1}]},{key:'boots',bodyParts:[{slot:15}]}];
 const groups=buildGearGroups({GearRows:rows,Armor},{maj:['Heavy Armor']},toggles,profile,{beast:true});
 assert.equal(groups[0].rows.find(r=>r.slot==='helmet').primary.key,'open');
 assert.equal(groups[0].rows.find(r=>r.slot==='boots').primary,null);
 assert.equal(groups[0].rows.find(r=>r.slot==='cuirass').primary,null);
});
test('unarmored and unarmed ranking emits no armor, shield or weapon',async()=>{
 const {buildGearGroups}=await mod;
 const groups=buildGearGroups({GearRows:[gear('boots'),gear('robe',{category:'clothing'})]}, {maj:['Unarmored']},toggles,{armRanked:[{n:'Unarmored'}],primaryArmor:'Unarmored',wepRanked:[{n:'Hand-to-hand'}],primaryWep:'Hand-to-hand',twoHand:true,shield:'none'});
 assert.deepEqual(groups.flatMap(g=>g.rows).map(r=>r.category),['clothing']);
});

test('enchant capacity is shown on the game\'s scale: points times fEnchantmentMult',async()=>{
 const {enchantMultiplier,enchantCapacity}=await mod;
 const vanilla=[{key:'fenchantmentmult',value:0.10000000149011612},{key:'fother',value:3}];
 assert.equal(enchantCapacity(600,enchantMultiplier(vanilla)),60,'Exquisite Shirt: 600 points, 60 in game');
 assert.equal(enchantCapacity(1200,enchantMultiplier(vanilla)),120);
 assert.equal(enchantCapacity(56,enchantMultiplier(vanilla)),5.6,'Silver Staff keeps its decimal');
 assert.equal(enchantCapacity(600,enchantMultiplier([{id:'fEnchantmentMult',value:0.2}])),120,'a mod that changes the setting is followed');
 assert.equal(enchantMultiplier(undefined),0.1,'the vanilla value until settings load');
});
