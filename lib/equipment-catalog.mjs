import { armorClass } from './site-search.mjs';
import { validateSlotEquip } from './equipment-math.mjs';
import { describeEffect } from './effect-text.mjs';

export function equipmentCatalog(catalogs = {}) {
 const gmst = new Map((catalogs.GameSettings || []).map(r=>[r.id,r.value]));
 const enchantments = Object.fromEntries((catalogs.Enchantments || []).map(r=>[r.key,r]));
 const items = ['Weapons','Armor','Clothing','Lights'].flatMap(name=>(catalogs[name]||[]).map(item=>({
   ...item, ...(name==='Armor'?{armorClass:armorClass(item,gmst)?.toLowerCase()}:{}),
   effectText:(enchantments[item.enchantmentId]?.effects||[]).map(effect=>describeEffect(effect,null,{}, {constant:enchantments[item.enchantmentId]?.castType==='constant'})).join(' · ')
 })));
 return {items,enchantments};
}
export function itemsForSlot(items,slot,race) {
 return items.filter(item=>!(slot==='CarriedRight' && ['ARROW','BOLT'].includes(item.type)) && validateSlotEquip(item,slot,{race}).allowed);
}
