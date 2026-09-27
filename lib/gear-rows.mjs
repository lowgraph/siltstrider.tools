/** Select published policy rows; never infer new acquisition verdicts. */
export const DEFAULT_GEAR_TOGGLES=Object.freeze({theft:false,endgame:false,nearStart:false,darkBrotherhood:false});
const POLICY_TOGGLES=['theft','endgame','nearStart'];
// An ambush row names its own toggle instead of the policy's three: gear worn by an actor
// a script sends at the player, like the Dark Brotherhood assassin who comes while you
// sleep. It joins its slot only when that toggle is on, whatever the other three say.
const AMBUSH_TOGGLES=['darkBrotherhood'];
export function rowMatches(row,toggles){
  const ambush=AMBUSH_TOGGLES.filter(k=>row.toggles?.[k]);
  if(ambush.length)return ambush.every(k=>toggles[k]);
  return POLICY_TOGGLES.every(k=>row.toggles?.[k]===Boolean(toggles[k]));
}
const normalize=value=>String(value).toLowerCase().replaceAll(' ','_').replace(/^blunt_weapon$/, 'blunt');
export function selectGearRows(records,build,toggles,{beast=false,allSkills=false}={}){
  const skills=new Set([...(build.maj||[]),...(build.min||[])].map(normalize));
  return records.filter(row=>{
    if(!rowMatches(row,toggles))return false;
    // Rows do not identify open helmets. Omit helmets conservatively for beasts.
    if(beast&&['boots','shoes','helmet'].includes(row.slot))return false;
    if(allSkills||row.category==='clothing')return true;
    if(row.category==='weapon')return skills.has(row.skill);
    if(row.category==='armor'||row.category==='shield')return skills.has(row.armorClass+'_armor');
    return false;
  });
}
// Item records store enchant points ten times what the game shows: OpenMW's enchanting
// window multiplies them by fEnchantmentMult (0.1 unless a mod changes it).
export function enchantMultiplier(gameSettings){
  const setting=(gameSettings||[]).find(g=>String(g.key??g.id).toLowerCase()==='fenchantmentmult');
  const value=Number(setting?.value);
  return Number.isFinite(value)&&value>0?value:0.1;
}
export function enchantCapacity(points,multiplier=0.1){
  return Math.round(Number(points)*multiplier*10)/10;
}
// What an item's Cast When Used enchantment conjures, as the gear rows publish it: a
// Devil Tanto does 6 damage itself and conjures a Bound Dagger that does 20.
export function summonNotes(pick){
  return (pick?.summons||[]).map(s=>{
    const unit=s.recordType==='ARMO'?'armor rating':'damage';
    const kind=s.strength==null?'':` (${unit} ${s.strength})`;
    const time=s.seconds?` for ${s.seconds} s`:'';
    const uses=s.uses?`, ${s.uses} ${s.uses===1?'cast':'casts'} per charge`:'';
    return `Summons ${s.name}${kind}${time}${uses}.`;
  });
}
// Where a pick is and who holds it, as a player would say it. Newer releases name the
// place ("Ald-ruhn", not exterior:-2,6) and, on a purchase, the merchant rather than the
// crate their stock sits in; older ones fall back to the cell key and the holder.
export function sourceLabel(pick){
  if(!pick)return {where:'',who:''};
  const where=pick.place||String(pick.cellKey||'').replace(/^interior:/,'');
  const who=pick.acquisition==='purchase'&&pick.seller?`sold by ${pick.seller}`:pick.holder&&pick.holder!==pick.name?pick.holder:'';
  return {where,who};
}
// An item's own enchantment, as the gear rows publish it: Mentor's Ring reads
// "Enchanted (constant effect): Fortify Intelligence 10, Fortify Willpower 10."
const CAST_TYPES={constant_effect:'constant effect',when_used:'cast when used',when_strikes:'cast when strikes',cast_once:'cast once'};
const titled=value=>String(value).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export function effectLabel(effect){
  let name=String(effect.name||'');
  if(effect.attribute)name=name.replace(/Attribute$/,titled(effect.attribute));
  if(effect.skill)name=name.replace(/Skill$/,titled(effect.skill));
  const size=effect.min==null?'':effect.min===effect.max?` ${effect.min}`:` ${effect.min}-${effect.max}`;
  const time=effect.seconds?` for ${effect.seconds} s`:'';
  const reach=effect.range&&effect.range!=='self'?` on ${effect.range}`:'';
  return `${name}${size}${time}${reach}${effect.drawback?' (a curse)':''}`;
}
export function enchantmentNote(pick){
  const spell=pick?.enchanted;
  if(!spell?.effects?.length)return '';
  const kind=CAST_TYPES[spell.castType]||spell.castType;
  return `Enchanted (${kind}${spell.charges?`, ${spell.charges} charge`:''}): ${spell.effects.map(effectLabel).join(', ')}.`;
}
// What a slot compares, larger first, as the rows' power objective ranks. Clothing is for
// its enchantment: one already on it, then room for one a new character cannot yet
// afford to fill, then a curse. Armour and weapons are for protection or damage, and an
// enchantment settles a tie. Rows without `enchanted` rank exactly as before.
const worthOf=pick=>pick?.enchanted?.worth||0;
export function pickRank(pick,row){
  if(row.category==='clothing'){
    const tier=!pick.enchanted?1:worthOf(pick)>0?2:0;
    return [tier,tier===2?worthOf(pick):pick.strength];
  }
  return [pick.strength,worthOf(pick)];
}
const byRank=(a,b)=>{
  const x=pickRank(a.pick,a.row),y=pickRank(b.pick,b.row);
  for(let i=0;i<x.length;i++)if(x[i]!==y[i])return y[i]-x[i];
  return 0;
};
export function gearRowLabel(row){
  const title=value=>String(value).replaceAll('_',' ');
  if(row.category==='weapon')return `${title(row.skill)} (${row.hands} hands)`;
  return [row.armorClass,title(row.slot||row.category)].filter(Boolean).join(' ');
}


// OpenMW Armor::canBeEquipped / PartReferenceType: head=0, feet=15/16.
export function compatiblePick(pick,row,beast,items){
  if(!pick)return false;
  if(!beast||row.category==='weapon')return true;
  const item=items.get(pick.key.toLowerCase());
  return Array.isArray(item?.bodyParts)&&!item.bodyParts.some(part=>[0,15,16].includes(part.slot));
}
const slotKey=row=>(row.slot||row.category).replace('_bracer','_gauntlet').replace('_glove','_gauntlet').replace(/^shoes$/,'boots');
function mergeSlots(rows){
  const slots=new Map();
  for(const row of rows){const key=slotKey(row);if(!slots.has(key))slots.set(key,[]);slots.get(key).push(row);}
  return [...slots.values()].map(options=>{
    const picks=options.flatMap(row=>[row.primary,row.alternative].filter(Boolean).map(pick=>({pick,row})));
    picks.sort((a,b)=>Number(b.pick.nearStart)-Number(a.pick.nearStart)||byRank(a,b)||a.pick.key.localeCompare(b.pick.key));
    const first=picks[0];if(!first)return options[0];
    const alt=picks.filter(p=>p.pick.key!==first.pick.key&&byRank(p,first)<0).sort(byRank)[0];
    return {...first.row,slot:slotKey(first.row),primary:first.pick,alternative:alt?.pick||null};
  });
}
// Marksman's one-handed row is thrown weapons: darts and stars that are used up as you
// throw them. A bow is the weapon; thrown only fills in when no bow qualifies, whatever
// the one- or two-handed setup chosen for melee.
const handsFor=(skill,preferred)=>skill==='marksman'?2:preferred;
export function buildGearGroups(catalogs,build,toggles,ranking,{beast=false}={}){
  if(!ranking)return [];
  const items=new Map([...(catalogs.Armor||[]),...(catalogs.Clothing||[])].map(i=>[i.key.toLowerCase(),i]));
  const rows=catalogs.GearRows.filter(r=>rowMatches(r,toggles))
  .filter(r=>!ranking.weaponSetup || (r.category==='weapon' ? r.skill==='marksman' || r.hands===(ranking.weaponSetup==='two-handed'?2:1) : !(ranking.weaponSetup==='two-handed' && r.category==='shield'))).map(row=>{
    const picks=[row.primary,row.alternative].filter(p=>compatiblePick(p,row,beast,items));
    return {...row,primary:picks[0]||null,alternative:picks[1]||null};
  });
  const groups=[];
  const armorNames=ranking.armRanked.map(r=>r.n).filter((n,i)=>i===0||build.maj.includes(n)).slice(0,2);
  const armorGroups=armorNames.map((name,i)=>({label:(i?'Alternative set — choose one':'Primary armor')+` (${name})`,rows:mergeSlots(rows.filter(r=>r.category==='armor'&&r.armorClass===normalize(name).replace('_armor','')))}));
  groups.push(...armorGroups);
  const primarySkill=normalize(ranking.primaryWep);
  const primaryOptions=rows.filter(r=>r.category==='weapon'&&r.skill===primarySkill&&r.primary);
  const preferredHands=ranking.twoHand?2:1;
  const primaryWeapon=primaryOptions.find(r=>r.hands===handsFor(primarySkill,preferredHands))||primaryOptions[0];
  const useShield=ranking.shield==='recommended'&&primaryWeapon?.hands===1;
  const primaryClass=normalize(ranking.primaryArmor).replace('_armor','');
  // One shield row per objective is published; like the armour slots, show them as one.
  if(useShield)groups.push({label:'Shield',rows:mergeSlots(rows.filter(r=>r.category==='shield'&&r.armorClass===primaryClass))});
  // Clothing must fit either displayed armor set. Visual body-part overlap is
  // not an equipment conflict (robes may cover armor); inventory slots are.
  const occupied=new Set(armorGroups.flatMap(g=>g.rows.filter(r=>r.primary).map(slotKey)));
  groups.push({label:'Clothing and jewelry',rows:mergeSlots(rows.filter(r=>r.category==='clothing'&&!occupied.has(slotKey(r))))});
  ranking.wepRanked.forEach((weapon,i)=>{
    const skill=normalize(weapon.n);
    const options=rows.filter(r=>r.category==='weapon'&&r.skill===skill&&(!useShield||r.hands===1||skill==='marksman'));
    const preferred=i===0?primaryWeapon:options.find(r=>r.hands===handsFor(skill,preferredHands)&&r.primary)||options.find(r=>r.primary)||options[0];
    if(preferred)groups.push({label:(i===0?'Primary weapon':i===1?'Secondary viable option':'Also invested')+` (${weapon.n})`,rows:[preferred]});
  });
  return groups;
}
