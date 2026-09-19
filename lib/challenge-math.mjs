/**
 * Pure calculation and constraint logic for Morrowind Challenge Runs.
 * Supports deterministic seed-based roll derivation, slot pinning,
 * difficulty presets, and conflict validation.
 */

export const DIFFICULTY_PRESETS = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Balanced playthrough with moderate restrictions and standard objectives.",
    restrictionsCount: 3,
    objectivesCount: 2,
    bands: { Easy: true, Medium: true, Hard: false, Grind: false }
  },
  hardcore: {
    id: "hardcore",
    name: "Hardcore",
    description: "Demanding ruleset featuring Hard combat restrictions and survival limits.",
    restrictionsCount: 4,
    objectivesCount: 3,
    bands: { Easy: false, Medium: true, Hard: true, Grind: false }
  },
  cursed: {
    id: "cursed",
    name: "Cursed",
    description: "Brutal and grinding challenge with extreme limits and unforgiving endurance.",
    restrictionsCount: 5,
    objectivesCount: 4,
    bands: { Easy: false, Medium: false, Hard: true, Grind: true }
  },
  custom: {
    id: "custom",
    name: "Custom",
    description: "Fully customizable restriction dials, objectives counts, and difficulty pools.",
    restrictionsCount: 3,
    objectivesCount: 2,
    bands: { Easy: true, Medium: true, Hard: true, Grind: false }
  }
};

export const POOL = [
  "No potions",
  "No magic",
  "No melee",
  "Major skills only",
  "No custom class",
  "No alchemy",
  "No enchanting",
  "No restoration",
  "No conjuration",
  "No illusion",
  "No mysticism",
  "No alteration",
  "No destruction",
  "No armor",
  "No shields",
  "No ranged weapons",
  "No stealth",
  "No sneaking",
  "No lockpicking",
  "No speechcraft",
  "No merchants except to pay for training",
  "No fast travel except silt striders and boats",
  "No Divine Intervention",
  "No Almsivi Intervention",
  "No Recall or Mark",
  "No Daedric quests",
  "No Great House membership",
  "No thieves guild",
  "No fighters guild",
  "No mages guild",
  "No Tribunal Temple",
  "No Imperial Cult",
  "No Imperial Legion",
  "No Morag Tong",
  "No stolen goods",
  "No soul gems",
  "No constant-effect enchantments",
  "No artifacts",
  "No Daedric weapons or armor",
  "No glass or ebony gear",
  "No levitate",
  "No water walking",
  "No restore health spells",
  "Sleep outdoors only",
  "Never rest in towns",
  "Pacifist except scripted bosses",
  "Permadeath — one life",
  "Ironman — no reloading a save after a fight",
  "Ironman — no quicksaving",
  "No Boots of Blinding Speed",
  "No Creeper or Mudcrab merchant",
  "No console commands",
  "No Fortify Intelligence alchemy loop",
  "No fortify attribute on self via alchemy",
  "No sneak attacks",
  "No Bound weapons or Bound armor",
  "No summons in combat",
  "Unarmored only",
  "Clothing only — no armor pieces",
  "One weapon skill forever",
  "Only level one weapon skill",
  "Fists only — Hand-to-hand",
  "Marksman only",
  "No jumping",
  "Walk only — no running",
  "No Magicka",
  "No spending Magicka",
  "No shrines or altars",
  "No Tribunal or Bloodmoon DLC",
  "Tribunal and Bloodmoon allowed but main quest first",
  "No vampire or werewolf",
  "No stronghold",
  "No Hortator or Nerevarine titles until the end",
  "No stealing even if undetected",
  "Lawful — pay every bounty, never murder",
  "Outlaw — never pay a bounty",
  "No trainers — skills from use only",
  "No birthsign powers",
  "No activated birthsign powers",
  "No racial powers",
  "No activated racial powers",
  "No enchanted items at all",
  "Cast When Used items only — no Constant Effect",
  "No guild guides, recall or intervention",
  "Silt strider and boat only — no Guild Guide",
  "No flying (levitate or jump stacking)",
  "No water breathing items or spells",
  "Vegetarian — no meat or animal ingredients in alchemy",
  "Roleplay: never attack first",
  "Roleplay: never refuse a quest",
  "Join no factions until you have visited five settlements",
  "Encumbrance under 50 at all times",
  "No Strength above starting value",
  "No Intelligence above starting value",
  "Level 20 cap",
  "Level 10 cap",
  "Never sleep to level up — stay level 1",
  "No companions or summoned meatshields",
  "No looting the NPCs you kill",
  "Only use gear you enchanted yourself",
  "No fast travel of any kind — walk everywhere",
  "Found potions only — no Alchemy-made potions",
  "One save file — no extra manual saves"
];

export const EASY = [
  "No custom class", "No restoration", "No conjuration", "No illusion", "No mysticism", "No alteration", "No destruction",
  "No shields", "No ranged weapons", "No sneaking", "No lockpicking", "No speechcraft",
  "No thieves guild", "No fighters guild", "No mages guild", "No Tribunal Temple", "No Imperial Cult", "No Imperial Legion", "No Morag Tong",
  "No Divine Intervention", "No Almsivi Intervention",
  "No water walking", "No levitate",
  "No Boots of Blinding Speed", "No Creeper or Mudcrab merchant",
  "No vampire or werewolf", "No stronghold",
  "Silt strider and boat only — no Guild Guide",
  "No fast travel except silt striders and boats",
  "Tribunal and Bloodmoon allowed but main quest first",
  "Roleplay: never refuse a quest",
  "No birthsign powers", "No activated birthsign powers", "No racial powers", "No activated racial powers"
];

export const HARD = [
  "No potions", "No magic", "No melee", "Major skills only", "No armor", "No Magicka", "No spending Magicka",
  "No merchants except to pay for training",
  "Permadeath — one life", "Ironman — no reloading a save after a fight", "Ironman — no quicksaving",
  "Unarmored only", "Clothing only — no armor pieces", "Fists only — Hand-to-hand",
  "No enchanted items at all",
  "Pacifist except scripted bosses",
  "No Tribunal or Bloodmoon DLC", "No artifacts",
  "No looting the NPCs you kill", "Only use gear you enchanted yourself",
  "Found potions only — no Alchemy-made potions",
  "One save file — no extra manual saves",
  "No Strength above starting value", "No Intelligence above starting value", "Level 20 cap", "Level 10 cap"
];

export const GRIND = [
  "Walk only — no running",
  "Never sleep to level up — stay level 1",
  "Encumbrance under 50 at all times",
  "No fast travel of any kind — walk everywhere"
];

export const MAJORS = [
  "Complete the main quest",
  "Complete two faction questlines",
  "Complete Tribunal",
  "Complete Bloodmoon",
  "Bring 10 artifacts to the Museum of Artifacts in Mournhold",
  "Collect 10 different Daedric artifacts",
  "Become Master of the Fighters Guild",
  "Become Arch-Mage of the Mages Guild",
  "Become Master Thief of the Thieves Guild",
  "Become Grandmaster of the Morag Tong",
  "Become Knight of the Imperial Dragon in the Imperial Legion",
  "Become Patriarch of the Tribunal Temple",
  "Become Primate of the Imperial Cult",
  "Become leader of House Telvanni",
  "Become leader of House Hlaalu",
  "Become leader of House Redoran",
  "Build your stronghold to the last upgrade",
  "Complete all quests for one vampire clan",
  "Complete every Daedric Prince quest available on Vvardenfell",
  "Reach level 50",
  "Clear the four Red Mountain citadels: Endusal, Odrosal, Tureynulal and Vemynal",
  "Finish the main quest without joining any faction except the Blades, which it makes you join",
  "Kill Vivec"
];

export const TR_MAJORS = [
  "Fight your way to Ebony Scale in the Narsis Arena",
  "Complete all quests in five mainland cities for the Fighters Guild",
  "Complete all quests in five mainland cities for the Mages Guild",
  "Complete all quests in five mainland cities for the Thieves Guild",
  "Complete all quests in five mainland cities for the Imperial Legion",
  "Complete all quests in five mainland cities for the Tribunal Temple",
  "Complete all quests in five mainland cities for the Imperial Cult",
  "Finish the mainland House Hlaalu, Indoril or Telvanni questline you join",
  "Join the Ja-Natta Syndicate and finish its quests",
  "Finish the East Empire Company quests on the mainland",
  "Join the Ordinators and finish their quests",
  "Enroll at the College of Firewatch and finish its quests",
  "Become a ranking member of House Indoril on the mainland",
  "Complete every quest for one mainland vampire clan: Orlukh or Baluath",
  "Walk from Firewatch to Narsis without using intervention",
  "Finish Intrigue in Port Telvannis",
  "Finish Shadows Under Aimrah",
  "Finish Trouble Brewing in Bal Foyen",
  "Earn the Passwall spell from the Narsis Mages Guild (Anti-Magic; needs MWSE or OpenMW Lua, otherwise the reward is Antimagic Curse)"
];

export const OBJECTIVES = [
  { kind: "COLLECTION", text: "Collect a full matching armor set (helm through boots)" },
  { kind: "ROLEPLAY", text: "Take nothing in Seyda Neen except what the Census and Excise Office hands you" },
  { kind: "SOCIAL", text: "Pickpocket someone successfully without being caught" },
  { kind: "SOCIAL", text: "Sleep in a bed you paid for in three different towns" },
  { kind: "EXPLORATION", text: "Ride every silt strider route out of Balmora: Ald'ruhn, Seyda Neen, Suran and Vivec" },
  { kind: "EXPLORATION", text: "Take a boat from Hla Oad, Ebonheart, and Tel Branora" },
  { kind: "COLLECTION", text: "Find and wear a complete set of netch leather" },
  { kind: "COLLECTION", text: "Find and wear a complete set of chitin" },
  { kind: "COLLECTION", text: "Find and wear a complete set of bonemold" },
  { kind: "SOCIAL", text: "Buy a drink at the Six Fishes in Ebonheart, and at the South Wall and the Eight Plates in Balmora" },
  { kind: "ACTION", text: "Kill a slaughterfish bare-handed while underwater" },
  { kind: "COLLECTION", text: "Harvest 20 kwama eggs from any mine" },
  { kind: "COLLECTION", text: "Collect five different alchemy ingredients from the Bitter Coast" },
  { kind: "SOCIAL", text: "Bring a guar hide to a clothier" },
  { kind: "ACTION", text: "Steal exactly one cheap item from a shop without being caught" },
  { kind: "SOCIAL", text: "Pay a bounty you actually earned" },
  { kind: "EXPLORATION", text: "Find Fargoth's hiding place for Hrisskar Flat-Foot in Seyda Neen" },
  { kind: "ROLEPLAY", text: "Leave a gold piece on an altar in a shrine" },
  { kind: "ACTION", text: "Light a torch and explore a cave without magicka light" },
  { kind: "ROLEPLAY", text: "Spend one night outdoors without entering an inn or house" },
  { kind: "SOCIAL", text: "Win a persuasion check with Admire, not Intimidate" },
  { kind: "FLAVOR", text: "Fail a persuasion check and still finish the conversation politely" },
  { kind: "ACTION", text: "Fill a soul gem with a creature no larger than a rat" },
  { kind: "ACTION", text: "Summon a creature and let the spell expire without killing it" },
  { kind: "ACTION", text: "Jump from the top of the Vivec Foreign Quarter canton into the water" },
  { kind: "EXPLORATION", text: "Visit every level of Vivec's Foreign Quarter: Plaza, Upper and Lower Waistworks, Canalworks and Underworks" },
  { kind: "ACTION", text: "Find a locked chest in the wilderness and pick it" },
  { kind: "SOCIAL", text: "Give 100 gold to a beggar or poor NPC" },
  { kind: "ROLEPLAY", text: "Buy a full set of clothes from a clothier and wear them into a dungeon" },
  { kind: "FLAVOR", text: "Follow a scrib for 60 seconds without attacking it" },
  { kind: "COLLECTION", text: "Find a pearl in a kollop" },
  { kind: "COLLECTION", text: "Mine raw ebony or raw glass yourself and sell it" },
  { kind: "ACTION", text: "Taste (eat) five alchemy ingredients you have never used" },
  { kind: "ACTION", text: "Make one potion and never drink it — sell or drop it" },
  { kind: "ROLEPLAY", text: "Sleep in a tomb" },
  { kind: "ROLEPLAY", text: "Leave an offering in an ancestral tomb urn and take nothing" },
  { kind: "COLLECTION", text: "Find a unique named weapon that is not an artifact" },
  { kind: "COLLECTION", text: "Wear a helm, amulet, and two rings at the same time" },
  { kind: "EXPLORATION", text: "Go swimming from Ebonheart to Vivec without drowning" },
  { kind: "EXPLORATION", text: "Walk the shore of Lake Fjalding on Solstheim without levitating" },
  { kind: "EXPLORATION", text: "Enter a Daedric ruin and leave without killing anything" },
  { kind: "ROLEPLAY", text: "Sit through a full rest in the wilderness during a blight storm" },
  { kind: "ACTION", text: "Cure common disease at a shrine instead of a potion" },
  { kind: "SOCIAL", text: "Haggle a merchant down at least once" },
  { kind: "EXPLORATION", text: "Find the lighthouse at Seyda Neen and climb it" },
  { kind: "EXPLORATION", text: "Walk from Seyda Neen to Balmora with no silt strider" },
  { kind: "EXPLORATION", text: "Walk from Balmora to Ald'ruhn with no silt strider" },
  { kind: "EXPLORATION", text: "Visit Gnisis and look at the eggmine entrance without going in" },
  { kind: "EXPLORATION", text: "Visit Ald Velothi or Khuul and stay the night" },
  { kind: "ACTION", text: "Find a smuggler cave on the Bitter Coast and take only one crate's goods" },
  { kind: "ROLEPLAY", text: "Return stolen goods to a chest you looted" },
  { kind: "COLLECTION", text: "Collect five different flowers from the Ascadian Isles" },
  { kind: "COLLECTION", text: "Collect five pieces of raw glass or ebony — not both" },
  { kind: "COLLECTION", text: "Wear a full set of Imperial Steel for a town visit" },
  { kind: "SOCIAL", text: "Ask three NPCs for latest rumors in one town" },
  { kind: "FLAVOR", text: "Find an item hidden in an unusual piece of furniture" },
  { kind: "ACTION", text: "Pick a locked door, then cast a Lock effect on it" },
  { kind: "FLAVOR", text: "Sneak through a shop without stealing" },
  { kind: "ACTION", text: "Defeat a town guard using Hand-to-hand without killing them" },
  { kind: "ACTION", text: "Run from a fight you started" },
  { kind: "EXPLORATION", text: "Find a dead adventurer and take only their journal or a note" },
  { kind: "EXPLORATION", text: "Ride a gondola in Vivec" },
  { kind: "SOCIAL", text: "Buy a seafood or pearl-related item from a coastal merchant" },
  { kind: "ROLEPLAY", text: "Eat ash yam, scrib jelly, and kwama egg in one sitting" },
  { kind: "FLAVOR", text: "Stand at Ghostgate's Tower of Dawn and look at Red Mountain, then leave" },
  { kind: "EXPLORATION", text: "Visit three ancestral tombs without clearing them" },
  { kind: "ROLEPLAY", text: "Place a lit torch in a dark cave and leave it there" },
  { kind: "ROLEPLAY", text: "Name a custom enchanted item after a town" },
  { kind: "ACTION", text: "Obtain Mentor's Ring from Samarys Ancestral Tomb" },
  { kind: "SOCIAL", text: "Talk to Creeper in Caldera or the Mudcrab merchant and buy nothing" },
  { kind: "SOCIAL", text: "Donate gold to the Imperial Cult or Temple, not a quest" },
  { kind: "COLLECTION", text: "Find a copy of The Firmament and read the birthsign page" },
  { kind: "ACTION", text: "Pick a lock of 50 or higher" },
  { kind: "SOCIAL", text: "Raise an NPC from below Disposition 30 to 90 without bribing" },
  { kind: "SOCIAL", text: "Have the Thieves Guild clear a bounty for you" },
  { kind: "SOCIAL", text: "Get thrown out of a faction" },
  { kind: "EXPLORATION", text: "Visit the Puzzle Canal in Vivec and swim a loop" },
  { kind: "ACTION", text: "Flee a blighted creature rather than fight it" },
  { kind: "FLAVOR", text: "Stand at the Ebonheart docks at dusk for 30 seconds" },
  { kind: "ROLEPLAY", text: "Spend your first night on the bedroll in Seyda Neen's Census and Excise Office" }
];

export const PLACE_REGIONS = {
  "Aimrah": "Aanthirin",
  "Ald Daedroth": "Azura's Coast",
  "Ald Marak": "Coronati Basin",
  "Ald Redaynia": "Sheogorad",
  "Ald Velothi": "West Gash",
  "Ald'ruhn": "Ashlands",
  "Almas Thirr": "Aanthirin",
  "Alta Vathor": "Coronati Basin",
  "Ashurbalipal": "Shipal-Shin",
  "Ashurbalipal, Shrine": "Shipal-Shin",
  "Assemanu": "Bitter Coast",
  "Bal Dushal": "Boethiah's Spine",
  "Bal Fell": "Ascadian Isles",
  "Bal Fell, Inner Shrine": "Ascadian Isles",
  "Bal Foyen": "Roth Roryn",
  "Bal Ur": "Molag Amur",
  "Balmora": "West Gash",
  "Berandas": "West Gash",
  "Berantus": "Dagon Urul",
  "Caldera": "West Gash",
  "Dagon Fel": "Sheogorad",
  "Dagoth Ur": "Red Mountain",
  "Darvonis": "Sundered Scar",
  "Dren Plantation": "Ascadian Isles",
  "Drethan Ancestral Tomb": "Sheogorad",
  "Ebon Tower": "Old Ebonheart",
  "Ebonheart": "Ascadian Isles",
  "Endusal": "Red Mountain",
  "Firewatch": "Dagon Urul",
  "Firewatch, Ember Keep: Treasure Chamber": "Dagon Urul",
  "Fort Frostmoth": "Solstheim, Hirstaang Forest",
  "Galom Daeus": "Molag Amur",
  "Ghostgate": "Ashlands",
  "Gnaar Mok": "Bitter Coast",
  "Gnisis": "West Gash",
  "Helnim, Parjho: Used Armor and Weapons": "Dagon Urul",
  "Hla Oad": "Bitter Coast",
  "Hlan Oek": "Aanthirin",
  "Ibar-Dad": "Sheogorad",
  "Ilunibi": "Bitter Coast",
  "Khartag Point": "Bitter Coast",
  "Khuul": "West Gash",
  "Maar Gan": "Ashlands",
  "Maelkashishi": "West Gash",
  "Mandaran": "Dagon Urul",
  "Mandaran, Upper Level": "Dagon Urul",
  "Marog": "Sundered Scar",
  "Mephalan Vales": "Mephalan Vales",
  "Molag Mar": "Molag Amur",
  "Moonmoth Legion Fort": "West Gash",
  "Mount Assarnibibi": "Molag Amur",
  "Mudan, Central Vault": "Ascadian Isles",
  "Naemunbatashpi": "Coronati Basin",
  "Naemunbatashpi, Antechamber": "Coronati Basin",
  "Narsis": "Shipal-Shin",
  "Narsis, Second Family Manor": "Shipal-Shin",
  "Narsis Arena": "Shipal-Shin",
  "Necrom": "Sacred Lands",
  "Necrom, Catacombs: Ancient Burial": "Sacred Lands",
  "Number Rooms Temple": "Shipal-Shin",
  "Odrosal": "Red Mountain",
  "Odrosal, Tower": "Red Mountain",
  "Old Ebonheart": "Old Ebonheart",
  "Othrenis": "Orethan Fields",
  "Pelagiad": "Ascadian Isles",
  "Port Telvannis": "Telvanni Isles",
  "Raathim Ancestral Tomb": "Old Ebonheart",
  "Raathim Ancestral Tomb, Hall of Kings Past": "Old Ebonheart",
  "Rothan Ancestral Tomb": "Ashlands",
  "Sadrith Mora": "Azura's Coast",
  "Samarys Ancestral Tomb": "Bitter Coast",
  "Sanctus Shrine": "Sheogorad",
  "Saros Mine": "Saros Archipelago",
  "Senim Ancestral Tomb": "Sheogorad",
  "Seyda Neen": "Bitter Coast",
  "Suran": "Ascadian Isles",
  "Tel Aruhn, Tower Living Quarters": "Azura's Coast",
  "Tel Branora": "Azura's Coast",
  "Tel Fyr": "Azura's Coast",
  "Tel Mora": "Azura's Coast",
  "Tel Vos": "Grazelands",
  "Tel Vos, Services Tower": "Grazelands",
  "Tukushapal, Sepulcher": "Azura's Coast",
  "Tureynulal": "Red Mountain",
  "Urshilaku": "Ashlands",
  "Urshilaku Camp": "Ashlands",
  "Urshilaku, Fragile Burial": "Ashlands",
  "Uttumilk": "Aanthirin",
  "Vartalit Grotto": "Aanthirin",
  "Vemynal": "Red Mountain",
  "Veranzaris, Manic Library": "Roth Roryn",
  "Vivec": "Ascadian Isles",
  "Vorthas Uldun, Chambers of Methats Uldun": "Old Ebonheart",
  "Yamandalkal": "Sea of Ghosts",
  "Yamandalkal, Sanctum": "Sea of Ghosts",
  "Yamuninisharn, Shrine": "Sunad Mora",
  "Yashazmus": "Telvanni Isles",
  "Yashazmus, Shrine": "Telvanni Isles"
};

export const GRID_REGIONS = {
  "42,-8": "Sacred Lands",
  "0,-41": "Coronati Basin",
  "42,-31": "Padomaic Ocean",
  "6,-45": "Coronati Basin",
  "28,-12": "Mephalan Vales",
  "-3,-22": "Armun Ashlands"
};

const PLACE_KEYS = Object.keys(PLACE_REGIONS).sort((a, b) => b.length - a.length);
const PLACE_PATTERN = new RegExp(
  "(^|[^A-Za-z'])(" +
    PLACE_KEYS.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") +
    ")(?![A-Za-z])",
  "g"
);

export function regionsIn(text) {
  const t = String(text || "");
  const out = [];
  const add = (r) => {
    if (r && !out.includes(r) && !t.includes(r)) out.push(r);
  };
  t.replace(PLACE_PATTERN, (m, pre, name) => {
    add(PLACE_REGIONS[name]);
    return m;
  });
  t.replace(/\[(-?\d+), (-?\d+)\]/g, (m, x, y) => {
    add(GRID_REGIONS[x + "," + y]);
    return m;
  });
  return out;
}

export function band(item) {
  if (GRIND.includes(item)) return "Grind";
  if (HARD.includes(item)) return "Hard";
  if (EASY.includes(item)) return "Easy";
  return "Medium";
}

export function bandLive(item, characterSkills = []) {
  const b = band(item);
  const t = String(item || "").toLowerCase();
  const skills = characterSkills.map((s) => String(s).toLowerCase());
  if (/no destruction/.test(t) && skills.includes("destruction")) return "Hard";
  if (/no restoration/.test(t) && skills.includes("restoration")) return "Hard";
  if (/no alteration/.test(t) && skills.includes("alteration")) return "Hard";
  if (/no illusion/.test(t) && skills.includes("illusion")) return "Hard";
  if (/no mysticism/.test(t) && skills.includes("mysticism")) return "Hard";
  if (/no conjuration/.test(t) && skills.includes("conjuration")) return "Hard";
  if (/no great house/.test(t)) return "Medium";
  if (/no daedric quests/.test(t)) return "Medium";
  return b;
}

export function restClusters(item) {
  const t = String(item || "").toLowerCase();
  const groups = {
    travel: /interven|recall|\bmark\b|guild guide|fast travel|silt strider and boat|no levitate|no flying/,
    armor: /no armor|unarmored only|clothing only|no shields/,
    cheese: /alchemy loop|fortify attribute on self|sneak attack/,
    enchant: /enchant|cast when used|constant-effect|soul gems/,
    leveling: /level 20|level 10|never sleep to level|no strength above|no intelligence above/,
    stealth: /no sneaking|no stealth|sneak attack/,
    theft: /stolen|stealing/,
    companions: /no companions|no summons/,
    saves: /permadeath|ironman|one save file/,
    rest: /sleep outdoors|never rest in towns/,
    house: /great house|no stronghold/,
    magic: /^no magic$|no magicka|no spending magicka/,
    birthsignPowers: /birthsign powers/,
    racialPowers: /racial powers/,
    weapons: /weapon skill|fists only|marksman only/,
    potions: /no potions|found potions only/,
    alchemy: /^no alchemy$|found potions only|alchemy loop|via alchemy|in alchemy/,
    merchants: /no merchants|creeper or mudcrab/,
    artifacts: /no artifacts|boots of blinding speed/,
    dlc: /tribunal or bloodmoon dlc|tribunal and bloodmoon allowed/,
    pacifist: /pacifist|never attack first/,
    locks: /^no alteration$|no lockpicking/
  };
  return Object.keys(groups).filter((g) => groups[g].test(t));
}

export function tagsOf(text) {
  const t = String(text || "").toLowerCase();
  const tags = [];
  const add = (x) => {
    if (!tags.includes(x)) tags.push(x);
  };
  if (/great house|house telvanni|house hlaalu|house redoran|house indoril|house dres|andothren hlaalu|narsis great house|king of narsis/.test(t)) add("greathouse");
  if (/stronghold/.test(t)) add("stronghold");
  if (/main quest|hortator|nerevarine|wraithguard/.test(t)) add("mainquest");
  if (/daedric artifact|wraithguard tools|10 different daedric|mainland artifact|passwall/.test(t)) add("artifact");
  if (/museum of artifacts/.test(t)) { add("artifact"); add("tribunal"); }
  if (/daedric prince|daedric quest|daedric shrine|daedric ruin/.test(t)) add("daedra");
  if (/tribunal(?! temple)|mournhold/.test(t) && !/tribunal temple/.test(t)) add("tribunal");
  if (/bloodmoon|werewolf|solstheim/.test(t)) add("bloodmoon");
  if (/mages guild/.test(t)) add("magesguild");
  if (/fighters guild/.test(t)) add("fightersguild");
  if (/thieves guild/.test(t)) add("thievesguild");
  if (/morag tong/.test(t)) add("moragtong");
  if (/imperial legion/.test(t)) add("legion");
  if (/imperial cult/.test(t)) add("cult");
  if (/tribunal temple/.test(t)) add("temple");
  if (/vampire/.test(t)) add("vampire");
  if (/named npc|dagoth/.test(t)) add("namedkill");
  if (/steal|stolen|pickpocket|smuggler|indoril armor|raw ebony|raw glass/.test(t)) add("crime");
  if (/fists only|hand-to-hand/.test(t)) add("melee");
  if (/no melee/.test(t)) add("melee");
  if (/marksman only|no ranged/.test(t)) add("ranged");
  if (/no magic\b|no magicka/.test(t)) add("magic");
  if (/no potions/.test(t) || /atronach and no potions/.test(t)) add("potions");
  if (/reach level/i.test(t)) add("level");
  if (/no enchanted items|cast when used/.test(t)) add("enchant");
  if (/lawful|never murder|no stealing/.test(t)) add("lawful");
  if (/outlaw/.test(t)) add("outlaw");
  if (/no armor|unarmored only|clothing only/.test(t)) add("armor");
  if (/silt strider|boat from|gondola|walk from|no silt|fast travel|intervention|recall|guild guide/.test(t)) add("travel");
  if (/matching armor|netch leather|complete set of chitin|complete set of bonemold|imperial steel|indoril armor|without armor/.test(t)) add("armor");
  if (/mentor.s ring|enchanted item|soul gem|summon a creature/.test(t)) add("enchant");
  if (/potion|alchemy ingredient/.test(t)) add("potions");
  if (/bare-handed|hand-to-hand|club or chitin dagger/.test(t)) add("melee");
  if (/sneak through|without being caught/.test(t)) add("stealth");
  if (/locked chest|pick a lock|pick it|lock of 50/.test(t)) add("lock");
  if (/daedric ruin/.test(t)) add("daedra");
  if (/imperial cult or temple/.test(t)) { add("cult"); add("temple"); }
  if (/\bcreeper\b.*mudcrab/.test(t)) add("merchant");
  return tags;
}

export function restrictionBans(text) {
  const t = String(text || "").toLowerCase();
  const bans = tagsOf(text);
  if (/level 20 cap|level 10 cap|never sleep to level|stay level 1/.test(t)) bans.push("level");
  if (/no great house/.test(t)) return ["greathouse", "stronghold"];
  if (/no stronghold/.test(t)) return ["stronghold"];
  if (/no artifacts/.test(t)) return bans.concat(["artifact", "mainquest"]);
  if (/no daedric quests/.test(t)) return ["daedra"];
  if (/no tribunal or bloodmoon/.test(t)) return ["tribunal", "bloodmoon"];
  if (/no mages guild/.test(t)) return ["magesguild"];
  if (/no fighters guild/.test(t)) return ["fightersguild"];
  if (/no thieves guild/.test(t)) return ["thievesguild"];
  if (/no morag tong/.test(t)) return ["moragtong"];
  if (/no imperial legion/.test(t)) return ["legion"];
  if (/no imperial cult/.test(t)) return ["cult"];
  if (/no tribunal temple/.test(t)) return ["temple"];
  if (/no killing named/.test(t) || /pacifist/.test(t)) return ["namedkill", "mainquest"];
  if (/no vampire or werewolf/.test(t)) return ["vampire", "bloodmoon"];
  if (/lawful|no stealing|no stolen/.test(t)) return ["crime", "outlaw"];
  if (/outlaw/.test(t)) return ["lawful"];
  if (/no melee/.test(t)) return ["melee"];
  if (/fists only/.test(t)) return ["ranged", "magic"];
  if (/marksman only/.test(t)) return ["melee"];
  if (/no potions/.test(t) || /atronach and no potions/.test(t)) return ["potions"];
  if (/no magic\b|no magicka/.test(t)) return ["magic"];
  if (/no ranged/.test(t)) return ["ranged"];
  if (/no enchanted items/.test(t)) return ["enchant"];
  if (/no armor|unarmored only|clothing only/.test(t)) return ["armor"];
  if (/no stealth|no sneaking/.test(t)) return ["stealth"];
  if (/no lockpicking/.test(t)) return ["lock"];
  if (/no fast travel|walk only|walk everywhere|no interven|no recall|silt strider and boat only|guild guide/.test(t)) return ["travel"];
  if (/no creeper or mudcrab/.test(t)) return ["merchant"];
  if (/no alchemy/.test(t)) return ["potions"];
  return bans;
}

export function restrictionConflicts(a, b) {
  const A = restrictionBans(a), B = restrictionBans(b);
  const hit = (x, y) => A.includes(x) && B.includes(y);
  if (hit("lawful", "outlaw") || hit("outlaw", "lawful")) return true;
  if (hit("melee", "melee") && /no melee/i.test(a) && /fists only/i.test(b)) return true;
  if (hit("melee", "melee") && /fists only/i.test(a) && /no melee/i.test(b)) return true;
  if (/fists only/i.test(a) && /marksman only/i.test(b)) return true;
  if (/marksman only/i.test(a) && /fists only/i.test(b)) return true;
  if (/no enchanted items/i.test(a) && /cast when used/i.test(b)) return true;
  if (/cast when used/i.test(a) && /no enchanted items/i.test(b)) return true;
  if (/no tribunal or bloodmoon/i.test(a) && /werewolf|bloodmoon/i.test(b)) return true;
  if (/no tribunal or bloodmoon/i.test(b) && /werewolf|bloodmoon/i.test(a)) return true;
  const either = (x, y) => (x.test(a) && y.test(b)) || (x.test(b) && y.test(a));
  if (either(/marksman only/i, /no ranged/i) || either(/fists only/i, /no ranged/i) || either(/marksman only/i, /no melee/i) || either(/fists only/i, /no melee/i)) return true;
  // No magic, No Magicka and No spending Magicka already rule out any one school or kind of spell.
  if (either(/^no magic$|no magicka|no spending magicka/i, /^no (restoration|conjuration|illusion|mysticism|alteration|destruction)$|no restore health spells|no bound weapons|no summons in combat/i)) return true;
  return false;
}

export function restrictionOkForNeeds(rest, needs) {
  const bans = restrictionBans(rest);
  return !needs.some((n) => bans.includes(n));
}

export function restrictionsClash(a, b) {
  return restrictionConflicts(a, b) || restClusters(a).some((g) => restClusters(b).includes(g));
}

export const OBJECTIVE_CONFLICTS = [
  ["Find Fargoth's hiding place for Hrisskar Flat-Foot in Seyda Neen", "Take nothing in Seyda Neen except what the Census and Excise Office hands you"]
];

export function objectivesClash(a, b) {
  return OBJECTIVE_CONFLICTS.some((pair) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
}

/**
 * Mulberry32 PRNG for deterministic, reproducible challenge generation.
 */
export function createRng(seed) {
  let s = typeof seed === "number" ? seed : hashStringToSeed(String(seed));
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash >>> 0;
}

export function generateSeed(prefix = "SEED", world = "VANILLA") {
  const num = Math.floor(1000 + Math.random() * 9000);
  const w = world.toUpperCase().slice(0, 7);
  return `${prefix}-${num}-${w}`;
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickCompatibleRestrictions(n, pool, needs, rng = Math.random) {
  const ok = pool.filter((x) => restrictionOkForNeeds(x, needs));
  const picks = [];
  const bag = shuffle(ok, rng);
  for (let i = 0; i < bag.length && picks.length < n; i++) {
    const item = bag[i];
    if (picks.some((p) => restrictionsClash(p, item))) continue;
    const next = picks.concat([item]);
    const noDmg =
      next.filter((x) => /no magic\b/i.test(x)).length &&
      next.filter((x) => /no melee/i.test(x)).length &&
      next.filter((x) => /no ranged/i.test(x)).length;
    if (noDmg) continue;
    picks.push(item);
  }
  return picks;
}

export function pickMixedObjectives(n, currentRestrictions = [], rng = Math.random) {
  const bans = [];
  currentRestrictions.forEach((r) =>
    restrictionBans(r).forEach((b) => {
      if (!bans.includes(b)) bans.push(b);
    })
  );
  const allowed = OBJECTIVES.filter((o) => {
    const need = tagsOf(o.text);
    return !need.some((t) => bans.includes(t));
  });
  const buckets = { ACTION: [], EXPLORATION: [], SOCIAL: [], COLLECTION: [], ROLEPLAY: [], FLAVOR: [] };
  allowed.forEach((o) => {
    if (buckets[o.kind]) buckets[o.kind].push(o);
  });
  const order = shuffle(["EXPLORATION", "ACTION", "SOCIAL", "COLLECTION", "ROLEPLAY", "FLAVOR"], rng);
  const picks = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const preferred = order[i] || order[Math.floor(rng() * order.length)];
    const fits = (o) => !used.has(o.text) && !picks.some((p) => objectivesClash(p.text, o.text));
    let bag = (buckets[preferred] || []).filter(fits);
    if (!bag.length) bag = allowed.filter(fits);
    if (!bag.length) break;
    const item = bag[Math.floor(rng() * bag.length)];
    used.add(item.text);
    picks.push(item);
  }
  return picks;
}

export function formatRunMarkdown(run) {
  if (!run) return "";
  const lines = [
    `# Morrowind Challenge Run Dossier`,
    ``,
    `**Race & Identity:** ${run.race || "Any"} (${run.gender || "Any"}) · **Class:** ${run.cls || "Custom"} · **Sign:** ${run.sign || "Any"}`,
    run.vitals ? `**Vitals:** Health ${run.vitals.health} · Magicka ${run.vitals.magicka} · Fatigue ${run.vitals.fatigue}` : null,
    run.seed ? `**Seed:** \`${run.seed}\`` : null,
    ``,
    `## Major Objective`,
    `> **${run.major || "None"}**`,
    run.majorRegions && run.majorRegions.length ? `*(Regions: ${run.majorRegions.join(", ")})*` : null,
    ``,
    `## Active Restrictions (${run.rests?.length || 0})`,
    ...(run.rests && run.rests.length
      ? run.rests.map((r, i) => `${i + 1}. **[${band(r)}]** ${r}`)
      : [`*None selected*`]),
    ``,
    `## Minor Objectives (${run.minors?.length || 0})`,
    ...(run.minors && run.minors.length
      ? run.minors.map((m, i) => `${i + 1}. [ ] ${typeof m === "string" ? m : m.text}`)
      : [`*None selected*`]),
    ``,
    `---`,
    `*Generated via Silt Strider Challenge Run Generator*`
  ].filter(Boolean);
  return lines.join("\n");
}
