/** Presentation copy only; never changes a premade's character choices. */
const STYLES = {
  'Pure mage': ['Solve fights with spells and use magic to move, heal and explore.', 'Keep magicka supplied; a weapon and armor are usually backup skills.'],
  Battlemage: ['Mix weapon attacks and armor with spells for damage and support.', 'Training both fighting and magic spreads your early resources across more skills.'],
  'Pure melee': ['Stay in close combat, relying on weapons, armor and stamina.', 'You have fewer magical answers to distant enemies and difficult terrain.'],
  Assassin: ['Approach quietly, strike with a light blade and avoid drawn-out fights.', 'Being spotted can force a fight before you have the protection of a heavier warrior.'],
  Archer: ['Attack from range with a bow or crossbow and reposition between shots.', 'Carry ammunition and a backup plan when an enemy closes the distance.'],
  Thief: ['Use stealth, locks and light equipment to choose how to enter and escape.', 'Direct fights are less forgiving; stealing can bring a bounty.'],
  Healer: ['Use Restoration to stay alive while your other skills handle combat.', 'Healing does not finish a fight; you still need damage and enough magicka.'],
  Monk: ['Fight or move with little armor, using mobility and physical skills.', 'Less armor leaves little room for mistakes when you cannot avoid a hit.'],
  Spearman: ['Keep enemies at spear reach and use movement to control close combat.', 'Spears occupy both hands, so you cannot carry a shield with one equipped.'],
  Enchanter: ['Rely on enchanted items for repeatable effects, supported by spells and gear.', 'Useful items and filled soul gems take money or exploration to obtain.'],
  Alchemist: ['Gather ingredients and brew potions to support combat and exploration.', 'Your supplies and apparatus matter; early mixtures are less reliable.'],
  Conjurer: ['Summon allies or bound equipment to help you handle fights.', 'Summons are temporary and cost magicka, so keep a plan for when they expire.'],
  Diplomat: ['Use conversation and trade to get help, then lean on your combat skills.', 'Social skills do not replace protection and damage when a fight is unavoidable.']
};
const FIRST_SKILL = {
  Destruction: 'Pure mage', Mysticism: 'Pure mage', Spear: 'Spearman', Alchemy: 'Alchemist',
  'Short Blade': 'Assassin', 'Long Blade': 'Pure melee', Sneak: 'Thief', Axe: 'Pure melee',
  'Blunt Weapon': 'Pure melee', Marksman: 'Archer', Unarmored: 'Monk', Enchant: 'Enchanter',
  Athletics: 'Monk', Acrobatics: 'Monk', Restoration: 'Healer', Block: 'Pure melee',
  'Medium Armor': 'Pure melee', Speechcraft: 'Diplomat'
};
export function premadeCopy(build) {
  const first = typeof build?.maj === 'string' ? build.maj.split(',')[0].trim() : '';
  const style = Object.hasOwn(STYLES, build?.cat) ? build.cat : FIRST_SKILL[first];
  const [plays, tradeoff] = STYLES[style] || ['Start with your Major skills and use Minor skills for support.', 'Skills outside your class start lower and take more practice.'];
  return { plays, tradeoff };
}
export const SPECIALIZATION_COPY = {
  Combat: 'Combat skills start higher and improve faster.',
  Magic: 'Magic skills start higher and improve faster.',
  Stealth: 'Stealth skills start higher and improve faster.'
};
