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

test('an enchantment ranks on its useful value when the rows carry one, and its cost when not', async () => {
  const { pickRank } = await import('../lib/gear-rows.mjs');
  const row = { category: 'clothing' };
  const feather = { strength: 0, enchanted: { worth: 120, value: 24, effects: [] } };
  const fortify = { strength: 0, enchanted: { worth: 60, value: 60, effects: [] } };
  assert.ok(pickRank(fortify, row)[1] > pickRank(feather, row)[1], 'a Fortify ring over a costlier Feather one');
  assert.deepEqual(pickRank({ strength: 0, enchanted: { worth: 120, effects: [] } }, row), [2, 120], 'older rows: the cost');
  assert.deepEqual(pickRank({ strength: 0, enchanted: { worth: 5, value: 0, effects: [] } }, row), [0, 0],
    'a value of 0 (only none-tier effects) ranks with the curses, as the builder ranks it, not on its cost');
});
test('an Assassin fights with the short blade it majors in, not its minor long blade',async()=>{
 const {gearRanking,buildGearGroups}=await mod;
 const assassin={maj:['Sneak','Marksman','Light Armor','Short Blade','Acrobatics'],min:['Security','Long Blade','Alchemy','Block','Athletics']};
 const ranking=gearRanking(assassin);
 assert.equal(ranking.primaryWep,'Short Blade');
 assert.deepEqual(ranking.wepRanked.map(w=>w.n),['Short Blade','Marksman','Long Blade'],'majors first, then minors');
 assert.deepEqual(ranking.wepRanked.map(w=>w.s),[50,50,30]);
 const weapon=(skill)=>row({key:skill,category:'weapon',slot:null,armorClass:null,skill,hands:1,primary:pick(skill)});
 const groups=buildGearGroups({GearRows:[weapon('long_blade'),weapon('short_blade')]},assassin,toggles,{...ranking,weaponSetup:'one-handed'});
 assert.equal(groups.find(g=>/Primary weapon/.test(g.label)).label,'Primary weapon (Short Blade)');
});
test('a major armour skill leads, and a minor one never becomes the alternative set',async()=>{
 const {gearRanking,buildGearGroups}=await mod;
 const scout={maj:['Light Armor','Long Blade'],min:['Heavy Armor','Block']};
 const ranking=gearRanking(scout);
 assert.equal(ranking.primaryArmor,'Light Armor');
 assert.deepEqual(ranking.armRanked.map(a=>a.n),['Light Armor','Heavy Armor']);
 const labels=buildGearGroups({GearRows:[gear('cuirass',{armorClass:'light'}),gear('cuirass',{armorClass:'heavy'})]},scout,toggles,ranking).map(g=>g.label);
 assert.ok(labels.includes('Primary armor (Light Armor)'));
 assert.ok(!labels.some(l=>/Alternative set/.test(l)),'heavy armour is only a minor skill');
});
test('within majors the order stays fixed, and two major armour skills still give an alternative set',async()=>{
 const {gearRanking}=await mod;
 const ranking=gearRanking({maj:['Axe','Long Blade','Medium Armor','Heavy Armor'],min:[]});
 assert.deepEqual(ranking.wepRanked.map(w=>w.n),['Long Blade','Axe']);
 assert.deepEqual(ranking.armRanked.map(a=>a.n),['Heavy Armor','Medium Armor']);
});
test('a build without weapon or armour skills, or without a build, falls back as before',async()=>{
 const {gearRanking}=await mod;
 for(const build of [undefined,null,{},{maj:'Destruction',min:null},{maj:['Destruction','Alteration'],min:['Illusion']}]){
  const ranking=gearRanking(build);
  assert.equal(ranking.primaryWep,'Long Blade');
  assert.equal(ranking.primaryArmor,'Light Armor');
  assert.deepEqual(ranking.wepRanked,[{n:'Long Blade',s:30}]);
  assert.equal(ranking.shield,'optional');
  assert.deepEqual(ranking.maj,Array.isArray(build?.maj)?build.maj:[]);
 }
 assert.equal(gearRanking({maj:['Block'],min:[]}).shield,'recommended');
 assert.deepEqual(gearRanking({maj:[]},{attrs:{Strength:40}}).attrs,{Strength:40});
});
const share=(name,target,value,extra={})=>({name,attribute:target,skill:null,value,worth:value,range:'self',drawback:false,...extra});
const jewel=(key,value,effects,near=true)=>({...pick(key,100,near),enchantment:100,beastWearable:true,enchanted:{castType:'constant_effect',value,worth:value,effects}});
const MENTOR_PICK=jewel('ring_mentor_unique',100,[share('Fortify Attribute','intelligence',50),share('Fortify Attribute','willpower',50)]);
const POISON_PICK=jewel('ring of toxic cloud',144,[share('Poison',null,144,{range:'touch'})]);
const STRENGTH_PICK=jewel('ring of might',60,[share('Fortify Attribute','strength',60)]);
const MAGE_BUILD={className:'Mage',spec:'Magic',fav1:'Intelligence',fav2:'Willpower',maj:['Mysticism','Destruction','Alteration','Illusion','Restoration'],min:['Enchant','Alchemy','Unarmored','Conjuration','Short Blade']};
const WARRIOR_BUILD={className:'Warrior',spec:'Combat',fav1:'Strength',fav2:'Endurance',maj:['Long Blade','Medium Armor','Heavy Armor','Athletics','Block'],min:['Armorer','Spear','Blunt Weapon','Axe','Hand-to-hand']};
const ringRow=(extra={})=>row({key:'clothing/ring/-/000/power',category:'clothing',slot:'ring',armorClass:null,objective:'power',primary:POISON_PICK,alternative:null,candidates:[POISON_PICK,MENTOR_PICK,STRENGTH_PICK],...extra});
const rings=(build,rows,options)=>{
 return mod.then(({buildGearGroups,gearRanking})=>buildGearGroups({GearRows:rows},build,toggles,gearRanking(build),options)
  .find(g=>g.label==='Clothing and jewelry').rows.filter(r=>r.slot==='ring'));
};
test('the ring slot is ranked for the build from the shortlist, two rings for two hands',async()=>{
 const mage=await rings(MAGE_BUILD,[ringRow()]);
 assert.deepEqual(mage.map(r=>r.primary.key),['ring_mentor_unique','ring of toxic cloud'],'a mage wears the Intelligence ring first');
 const warrior=await rings(WARRIOR_BUILD,[ringRow()]);
 assert.deepEqual(warrior.map(r=>r.primary.key),['ring of toxic cloud','ring of might']);
 assert.equal(warrior[1].slotKey,'ring_2','the second ring goes on the other hand');
 const {gearRowLabel}=await mod;
 assert.equal(gearRowLabel(warrior[1]),'second ring');
 assert.notEqual(warrior[0].key,warrior[1].key,'each row has its own key');
});
test('a far ring that beats the close one is an "or", never also the second ring',async()=>{
 const far=jewel('far ring',500,[share('Fortify Attribute','intelligence',500)],false);
 const mage=await rings(MAGE_BUILD,[ringRow({candidates:[POISON_PICK,MENTOR_PICK,far]})]);
 assert.equal(mage[0].primary.key,'ring_mentor_unique');
 assert.equal(mage[0].alternative.key,'far ring');
 assert.equal(mage[1].primary.key,'ring of toxic cloud');
});
test('rows without a shortlist still give one ring and rank as before',async()=>{
 const old=await rings(MAGE_BUILD,[ringRow({candidates:undefined})]);
 assert.equal(old.length,1);
 assert.equal(old[0].primary.key,'ring of toxic cloud');
 const lone=await rings(MAGE_BUILD,[ringRow({candidates:[POISON_PICK]})]);
 assert.equal(lone.length,1,'no second ring when the only one is already worn');
});
test('a shortlist is filtered for beast races like the rows are',async()=>{
 const {buildGearGroups,gearRanking}=await mod;
 const shoes=(key,value)=>({...jewel(key,value,[share('Fortify Attribute','speed',value)]),beastWearable:false});
 const Clothing=[{key:'open sandals',bodyParts:[{slot:3}]},{key:'boots of speed',bodyParts:[{slot:15}]}];
 const sandals={...jewel('open sandals',5,[share('Fortify Attribute','speed',5)])};
 const shoeRow=row({key:'clothing/shoes/-/000/power',category:'clothing',slot:'shoes',armorClass:null,primary:sandals,alternative:null,candidates:[shoes('boots of speed',90),sandals]});
 const build={maj:['Hand-to-hand','Unarmored'],min:[]};
 const clothing=buildGearGroups({GearRows:[shoeRow],Clothing},build,toggles,{...gearRanking(build),armRanked:[{n:'Unarmored'}],primaryArmor:'Unarmored'},{beast:true}).find(g=>g.label==='Clothing and jewelry');
 assert.deepEqual(clothing.rows.map(r=>r.primary.key),['open sandals'],'boots cover a foot');
});
