import { equipItem, createDefaultLoadoutPresets } from './equipment-math.mjs';

const slots = {helmet:'Helmet',cuirass:'Cuirass',greaves:'Greaves',boots:'Boots',shoes:'Boots',left_pauldron:'LeftPauldron',right_pauldron:'RightPauldron',left_hand:'LeftGauntlet',right_hand:'RightGauntlet',left_gauntlet:'LeftGauntlet',right_gauntlet:'RightGauntlet',left_glove:'LeftGauntlet',right_glove:'RightGauntlet',left_bracer:'LeftGauntlet',right_bracer:'RightGauntlet',shield:'CarriedLeft',weapon:'CarriedRight',shirt:'Shirt',pants:'Pants',skirt:'Skirt',robe:'Robe',belt:'Belt',amulet:'Amulet',ring:'LeftRing',ring_1:'LeftRing',ring_2:'RightRing'};

// Transfer the displayed primary choices, never alternate sets or fabricated copies.
export function recommendedLoadouts(groups, catalogs, build, {late=false}={}) {
  const index = new Map(['Weapons','Armor','Clothing'].flatMap(key=>catalogs[key]||[]).map(item=>[item.key.toLowerCase(),item]));
  let items = {};
  for (const group of groups) {
    if (!late && /^(Alternative set|Secondary viable option|Also invested)/.test(group.label)) continue;
    for (const row of group.rows) {
      const key = late ? row.picks?.[0]?.pick?.item : row.primary?.key;
      if (!key) continue;
      const slot = slots[row.slotKey || row.slot || row.category];
      const item = index.get(key.toLowerCase());
      if (!slot || !item) throw new Error('Recommended equipment is missing from this profile: '+key);
      const result = equipItem(items,slot,item,{race:build.race});
      if (!result.success) throw new Error(result.reason);
      items = result.loadout;
    }
  }
  if (!Object.keys(items).length) throw new Error('No eligible equipment recommendations to equip.');
  const presets = build.loadouts?.length ? build.loadouts : createDefaultLoadoutPresets();
  return presets.map((preset,i)=>i===0?{...preset,name:late?'Recommended late-game gear':'Recommended early gear',items}:preset);
}
