/** Select published policy rows; never infer new acquisition verdicts. */
export const DEFAULT_GEAR_TOGGLES=Object.freeze({theft:false,endgame:false,nearStart:false});
const normalize=value=>String(value).toLowerCase().replaceAll(' ','_').replace(/^blunt_weapon$/, 'blunt');
export function selectGearRows(records,build,toggles,{beast=false,allSkills=false}={}){
  const skills=new Set([...(build.maj||[]),...(build.min||[])].map(normalize));
  return records.filter(row=>{
    if(!['theft','endgame','nearStart'].every(k=>row.toggles?.[k]===toggles[k]))return false;
    // Rows do not identify open helmets. Omit helmets conservatively for beasts.
    if(beast&&['boots','shoes','helmet'].includes(row.slot))return false;
    if(allSkills||row.category==='clothing')return true;
    if(row.category==='weapon')return skills.has(row.skill);
    if(row.category==='armor'||row.category==='shield')return skills.has(row.armorClass+'_armor');
    return false;
  });
}
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
    picks.sort((a,b)=>Number(b.pick.nearStart)-Number(a.pick.nearStart)||b.pick.strength-a.pick.strength||a.pick.key.localeCompare(b.pick.key));
    const first=picks[0];if(!first)return options[0];
    const alt=picks.filter(p=>p.pick.key!==first.pick.key&&p.pick.strength>first.pick.strength).sort((a,b)=>b.pick.strength-a.pick.strength)[0];
    return {...first.row,slot:slotKey(first.row),primary:first.pick,alternative:alt?.pick||null};
  });
}
export function buildGearGroups(catalogs,build,toggles,ranking,{beast=false}={}){
  if(!ranking)return [];
  const items=new Map([...(catalogs.Armor||[]),...(catalogs.Clothing||[])].map(i=>[i.key.toLowerCase(),i]));
  const rows=catalogs.GearRows.filter(r=>Object.keys(DEFAULT_GEAR_TOGGLES).every(k=>r.toggles[k]===toggles[k])).map(row=>{
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
  const primaryWeapon=primaryOptions.find(r=>r.hands===preferredHands)||primaryOptions[0];
  const useShield=ranking.shield==='recommended'&&primaryWeapon?.hands===1;
  const primaryClass=normalize(ranking.primaryArmor).replace('_armor','');
  if(useShield)groups.push({label:'Shield',rows:rows.filter(r=>r.category==='shield'&&r.armorClass===primaryClass)});
  // Clothing must fit either displayed armor set. Visual body-part overlap is
  // not an equipment conflict (robes may cover armor); inventory slots are.
  const occupied=new Set(armorGroups.flatMap(g=>g.rows.filter(r=>r.primary).map(slotKey)));
  groups.push({label:'Clothing and jewelry',rows:mergeSlots(rows.filter(r=>r.category==='clothing'&&!occupied.has(slotKey(r))))});
  ranking.wepRanked.forEach((weapon,i)=>{
    const options=rows.filter(r=>r.category==='weapon'&&r.skill===normalize(weapon.n)&&(!useShield||r.hands===1));
    const preferred=i===0?primaryWeapon:options.find(r=>r.hands===preferredHands&&r.primary)||options.find(r=>r.primary)||options[0];
    if(preferred)groups.push({label:(i===0?'Primary weapon':i===1?'Secondary viable option':'Also invested')+` (${weapon.n})`,rows:[preferred]});
  });
  return groups;
}
