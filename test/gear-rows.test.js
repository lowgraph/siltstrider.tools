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
test('explicit weapon setup never falls back to the wrong number of hands',async()=>{
 const {buildGearGroups}=await mod;
 const data={GearRows:[gear(null,{category:'weapon',skill:'long_blade',hands:2}),gear('shield',{category:'shield'})]};
 const groups=buildGearGroups(data,{maj:['Long Blade','Heavy Armor']},toggles,{...profile,weaponSetup:'one-handed'});
 assert.ok(!groups.some(g=>g.rows.some(r=>r.category==='weapon')));
 const two=buildGearGroups(data,{maj:['Long Blade','Heavy Armor']},toggles,{...profile,weaponSetup:'two-handed',twoHand:true});
 assert.ok(two.some(g=>g.rows.some(r=>r.hands===2)));
 assert.ok(!two.some(g=>g.rows.some(r=>r.category==='shield')));
});
test('marksman recommends a bow, not thrown weapons that are used up, whatever the melee setup',async()=>{
 const {buildGearGroups}=await mod;
 const darts=gear('darts',{category:'weapon',skill:'marksman',hands:1});
 const bow=gear('bow',{category:'weapon',skill:'marksman',hands:2});
 const sword=gear('sword',{category:'weapon',skill:'long_blade',hands:1});
 const archer={...profile,wepRanked:[{n:'Marksman'}],primaryWep:'Marksman',twoHand:false};
 const primary=groups=>groups.find(g=>g.label.startsWith('Primary weapon')).rows[0];
 assert.equal(primary(buildGearGroups({GearRows:[darts,bow]},{maj:['Marksman']},toggles,archer)).key,'bow');
 assert.equal(primary(buildGearGroups({GearRows:[darts,bow]},{maj:['Marksman']},toggles,{...archer,weaponSetup:'one-handed'})).key,'bow',
  'a one-handed melee setup does not turn the bow into darts');
 assert.equal(primary(buildGearGroups({GearRows:[darts]},{maj:['Marksman']},toggles,archer)).key,'darts','thrown fills in when no bow qualifies');
 const fighter={...profile,wepRanked:[{n:'Long Blade'},{n:'Marksman'}],primaryWep:'Long Blade'};
 const groups=buildGearGroups({GearRows:[sword,darts,bow,gear(null,{category:'shield'})]},{maj:['Long Blade','Marksman']},toggles,fighter);
 assert.ok(groups.some(g=>g.label==='Shield'),'sword and board up front');
 assert.equal(groups.find(g=>g.label.startsWith('Secondary')).rows[0].key,'bow','and a bow for range, not darts');
});
test('a summoner says what it conjures, in the unit of the conjured piece',async()=>{
 const {summonNotes}=await mod;
 const tanto={strength:20,baseStrength:6,summons:[{key:'bound_dagger',name:'Bound Dagger',recordType:'WEAP',strength:20,seconds:60,uses:5,sameRow:true}]};
 assert.deepEqual(summonNotes(tanto),['Summons Bound Dagger (damage 20) for 60 s, 5 casts per charge.']);
 const gauntlet={summons:[{key:'bound_longbow',name:'Bound Longbow',recordType:'WEAP',strength:50,seconds:30,uses:1,sameRow:false}]};
 assert.deepEqual(summonNotes(gauntlet),['Summons Bound Longbow (damage 50) for 30 s, 1 cast per charge.'],'armor that conjures a bow still speaks of damage');
 const helm={summons:[{key:'bound_gauntlet_left',name:'Bound Gauntlet',recordType:'ARMO',strength:80,seconds:60,uses:5,sameRow:false}]};
 assert.match(summonNotes(helm)[0],/armor rating 80/);
 assert.deepEqual(summonNotes({strength:30}),[],'ordinary picks say nothing extra');
 assert.deepEqual(summonNotes(null),[]);
});
test('a source reads as a place and a merchant, not a grid key and a crate',async()=>{
 const {sourceLabel}=await mod;
 assert.deepEqual(sourceLabel({name:'Domina Helmet',cellKey:'exterior:-2,6',place:'Ald-ruhn',acquisition:'purchase',holder:'Crate',seller:'Dandera Selaro'}),
  {where:'Ald-ruhn',who:'sold by Dandera Selaro'});
 assert.deepEqual(sourceLabel({name:'Wenbone Bow',cellKey:'interior:glisterpike',place:'Glisterpike',acquisition:'take',holder:'Chest'}),
  {where:'Glisterpike',who:'Chest'},'a container you take from is still named');
 assert.deepEqual(sourceLabel({name:'Dwemer Helm',cellKey:'interior:old ebonheart, briricca private bank',acquisition:'direct',holder:'Dwemer Helm'}),
  {where:'old ebonheart, briricca private bank',who:''},'an older release falls back to the key, and a loose item is not its own holder');
 assert.deepEqual(sourceLabel({name:'X',cellKey:'interior:shop',acquisition:'purchase',holder:'Crate'}),{where:'shop',who:'Crate'},'no seller published: the holder, as before');
});
test('Dark Brotherhood rows join their slot only under their own toggle',async()=>{
 const {selectGearRows,buildGearGroups,rowMatches}=await mod;
 const ambush=row({key:'db',slot:'helmet',armorClass:'light',toggles:{darkBrotherhood:true},
  primary:{...pick('darkbrotherhood helm',30),acquisition:'ambush',note:'Worn by the assassin.'}});
 const plain=row({key:'chitin',slot:'helmet',armorClass:'light',primary:pick('chitin helm',10)});
 assert.equal(rowMatches(ambush,toggles),false,'off by default');
 assert.equal(rowMatches(ambush,{...toggles,theft:true,darkBrotherhood:true}),true,'whatever the policy toggles');
 assert.equal(rowMatches(plain,{...toggles,darkBrotherhood:true}),true,'policy rows stay');
 assert.equal(rowMatches(plain,{theft:false,endgame:false,nearStart:false}),true,'callers without the new toggle still match');
 assert.deepEqual(selectGearRows([plain,ambush],{maj:['Light Armor']},toggles),[plain]);
 const light={...profile,armRanked:[{n:'Light Armor'}],primaryArmor:'Light Armor'};
 const helm=on=>buildGearGroups({GearRows:[plain,ambush]},{maj:['Light Armor']},{...toggles,darkBrotherhood:on},light)[0].rows[0].primary;
 assert.equal(helm(false).key,'chitin helm');
 assert.equal(helm(true).key,'darkbrotherhood helm','30 armor beats 10, both come to hand early');
});
test('a ring already enchanted is recommended before a blank one with more room',async()=>{
 const {buildGearGroups}=await mod;
 const ring=(key,strength,enchanted,extra={})=>row({key:key+extra.objective,category:'clothing',slot:'ring',armorClass:null,objective:'power',...extra,
  primary:{...pick(key,strength),...(enchanted===undefined?{}:{enchanted:{castType:'constant_effect',worth:enchanted,charges:null,effects:[]}})}});
 const mentor=ring('mentor',100,100.1),exquisite=ring('exquisite',1200,undefined,{objective:'enchantment'}),cursed=ring('cursed',5000,-12.5);
 const unarmored={...profile,armRanked:[{n:'Unarmored'}],primaryArmor:'Unarmored'};
 const slot=rows=>buildGearGroups({GearRows:rows},{maj:['Unarmored']},toggles,unarmored).find(g=>g.label==='Clothing and jewelry').rows[0];
 assert.equal(slot([exquisite,mentor,cursed]).primary.key,'mentor');
 assert.equal(slot([exquisite,mentor,cursed]).alternative,null,'room for an enchantment is not stronger than one');
 assert.equal(slot([exquisite,cursed]).primary.key,'exquisite','a curse is worse than nothing');
});
test('an enchantment reads as its effects, in the game\'s words',async()=>{
 const {enchantmentNote}=await mod;
 const fortify=(attribute,n)=>({name:'Fortify Attribute',attribute,skill:null,min:n,max:n,seconds:null,range:'self',drawback:false});
 assert.equal(enchantmentNote({enchanted:{castType:'constant_effect',charges:null,worth:100.1,effects:[fortify('intelligence',10),fortify('willpower',10)]}}),
  'Enchanted (constant effect): Fortify Intelligence 10, Fortify Willpower 10.');
 assert.equal(enchantmentNote({enchanted:{castType:'when_used',charges:50,worth:3.6,effects:[
  {name:'Frost Damage',attribute:null,skill:null,min:2,max:4,seconds:3,range:'target',drawback:false},
  {name:'Recall',attribute:null,skill:null,min:null,max:null,seconds:null,range:'self',drawback:false}]}}),
  'Enchanted (cast when used, 50 charge): Frost Damage 2-4 for 3 s on target, Recall.');
 assert.equal(enchantmentNote({enchanted:{castType:'constant_effect',charges:null,worth:-12.5,effects:[
  {name:'Drain Skill',attribute:null,skill:'long_blade',min:5,max:5,seconds:null,range:'self',drawback:true}]}}),
  'Enchanted (constant effect): Drain Long Blade 5 (a curse).');
 assert.equal(enchantmentNote({}),'');
});
test('the shield shows once, not once per objective',async()=>{
 const {buildGearGroups}=await mod;
 const shield=(objective,p)=>row({key:'shield/-/heavy/000/'+objective,category:'shield',slot:null,armorClass:'heavy',objective,primary:p,alternative:null});
 const tower=pick('tower',12),capacious={...pick('capacious',5),enchantment:900};
 const groups=buildGearGroups({GearRows:[shield('power',tower),shield('enchantment',capacious),row({key:'sword',category:'weapon',slot:null,skill:'long_blade',hands:1,primary:pick('sword')})]},
  {maj:['Heavy Armor','Long Blade']},toggles,{...profile,armRanked:[{n:'Heavy Armor'}],wepRanked:[{n:'Long Blade'}]});
 const rows=groups.find(g=>g.label==='Shield').rows;
 assert.equal(rows.length,1);
 assert.equal(rows[0].primary.key,'tower','the stronger shield leads');
});
