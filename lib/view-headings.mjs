/**
 * Each tool view's h1, matching its page. It is visually hidden (the tool is its own
 * visible heading) and the app shell renders it first inside <main> for the view on
 * screen, so it follows client-side view switches and the skip link lands on it.
 * Home, account and the legal pages show their own visible h1.
 */
export const VIEW_HEADINGS = Object.freeze({
  builder: 'Morrowind Character Builder & Build Optimizer',
  leveler: 'Morrowind Level Simulator & 5x Multiplier Progression Planner',
  alchemy: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool',
  enchanting: 'Morrowind Enchanting & Soul Gem Calculator',
  spellmaking: 'Morrowind Spellmaking & Casting Chance Calculator',
  travel: 'Morrowind Travel Map & Transport Route Planner',
  factions: 'Morrowind Faction Journal & Guild Rank Tracker',
  challenge: 'Morrowind Challenge Run Generator & Permalinks',
  vault: 'OpenMW Save File Inspector & Cloud Character Vault',
  about: 'About Silt Strider & Game Engine Mechanics',
  changelog: 'Silt Strider Tools Changelog & Version History',
});
