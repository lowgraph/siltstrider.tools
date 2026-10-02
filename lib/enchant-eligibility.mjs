// OpenMW 0.51 enchanting.cpp nextCastStyle: apparel, weapon classes and books.
export const CUSTOM_ENCHANT_KINDS = Object.freeze([
  {id:'apparel',label:'Armor or clothing'},
  {id:'melee',label:'Melee weapon'},
  {id:'ranged',label:'Bow or crossbow'},
  {id:'thrown',label:'Thrown weapon'},
  {id:'ammo',label:'Ammunition'},
  {id:'book',label:'Book or scroll'}
]);
export function enchantItemKind(item, customKind = 'apparel') {
  if (item?.type === 'Custom') return customKind;
  if (item?.type === 'Weapon') return item.weaponClass || 'melee';
  if (['Jewelry','Clothing','Shield','Armor'].includes(item?.type)) return 'apparel';
  if (item?.type === 'Book') return 'book';
  return null;
}
export function eligibleEnchantTypes(kind, soul, threshold = 400) {
  const constant = Number.isFinite(soul) && soul >= threshold;
  if (kind === 'book') return ['once'];
  if (kind === 'ammo' || kind === 'thrown') return ['strike'];
  if (kind === 'melee') return ['used','strike',...(constant ? ['const'] : [])];
  if (kind === 'apparel' || kind === 'ranged') return ['used',...(constant ? ['const'] : [])];
  return [];
}
export function validEnchantType(requested, allowed) {
  return allowed.includes(requested) ? requested : allowed[0] ?? null;
}
