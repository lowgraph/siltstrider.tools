/**
 * OpenMW Enchanting Math & Barter Logic
 */

export const SOUL_GEMS = [
  { name: "Petty Soul Gem", soul: 9, capacity: 30 },
  { name: "Lesser Soul Gem", soul: 30, capacity: 60 },
  { name: "Common Soul Gem", soul: 60, capacity: 120 },
  { name: "Greater Soul Gem", soul: 180, capacity: 200 },
  { name: "Grand Soul Gem", soul: 400, capacity: 400, canCe: true },
  { name: "Azura's Star (Golden Saint)", soul: 400, capacity: 400, canCe: true },
  { name: "Azura's Star (Ascended Sleeper)", soul: 400, capacity: 400, canCe: true }
];

export const ENCHANT_BASE_ITEMS = [
  { name: "Exquisite Ring", capacity: 120, type: "Jewelry" },
  { name: "Exquisite Amulet", capacity: 120, type: "Jewelry" },
  { name: "Exquisite Shirt", capacity: 60, type: "Clothing" },
  { name: "Exquisite Pants", capacity: 60, type: "Clothing" },
  { name: "Exquisite Skirt", capacity: 60, type: "Clothing" },
  { name: "Exquisite Robe", capacity: 40, type: "Clothing" },
  { name: "Exquisite Shoes", capacity: 40, type: "Clothing" },
  { name: "Daedric Tower Shield", capacity: 225, type: "Shield" },
  { name: "Ebony Tower Shield", capacity: 150, type: "Shield" },
  { name: "Glass Tower Shield", capacity: 45, type: "Shield" },
  { name: "Telvanni Cephalopod Helm", capacity: 100, type: "Armor" },
  { name: "Ebony Staff", capacity: 90, type: "Weapon" },
  { name: "Silver Staff", capacity: 30, type: "Weapon" },
  { name: "Daedric Dai-katana", capacity: 21, type: "Weapon" },
  { name: "Daedric Claymore", capacity: 21, type: "Weapon" },
  { name: "Custom Item", capacity: 60, type: "Custom" }
];

export const F_EFFECT_COST_MULT = 0.5;
export const F_ENCHANTMENT_CONSTANT_DURATION_MULT = 100;
export const F_ENCHANTMENT_VALUE_MULT = 1000;

export function calcEffectCost(effect, type, min, max, dur, area, range, costSoFar = 0) {
  if (!effect) return 0;
  const magMin = effect.mag ? Math.max(1, min || 1) : 1;
  const magMax = effect.mag ? Math.max(1, max || 1) : 1;
  const ar = Math.max(1, type === "const" || range === "self" ? 0 : area || 0);

  let duration;
  if (type === "const") {
    duration = F_ENCHANTMENT_CONSTANT_DURATION_MULT;
  } else {
    duration = effect.dur ? Math.max(1, dur || 1) : 1;
  }

  let cost = costSoFar + ((magMin + magMax) * duration + ar) * effect.b * F_EFFECT_COST_MULT * 0.05;
  cost = Math.max(1, cost);
  if (type !== "const" && range === "target") {
    cost *= 1.5;
  }
  return cost;
}

export function calcEnchantmentTotalPoints(effects = [], type = "used") {
  let costSoFar = 0;
  for (let i = 0; i < effects.length; i++) {
    const eff = effects[i];
    if (!eff || !eff.effect) continue;
    costSoFar = calcEffectCost(
      eff.effect,
      type,
      eff.min,
      eff.max,
      eff.dur,
      eff.area,
      eff.range,
      costSoFar
    );
  }
  return Math.round(costSoFar);
}

export function calcSelfEnchantChance(skill = 50, intelligence = 40, luck = 40, totalPoints = 10) {
  // OpenMW formula for self-enchant success percentage:
  // Base chance = (Enchant * 0.75 + Int * 0.25 + Luck * 0.1 - Points * 2.5) * (Current Fatigue / Max Fatigue, standard 1.25)
  const baseTerm = (skill * 0.75) + (intelligence * 0.25) + (luck * 0.1) - (totalPoints * 2.5);
  const fatigueMult = 1.25;
  const chance = Math.round(baseTerm * fatigueMult);
  return Math.max(0, Math.min(100, chance));
}

export function calcEnchantGoldCost(points, type = "used") {
  if (type === "const") {
    return Math.max(1, Math.round(points * F_ENCHANTMENT_VALUE_MULT * 5));
  }
  return Math.max(1, Math.round(points * F_ENCHANTMENT_VALUE_MULT));
}

export function calcBarterBuyPrice(listPrice, npc, pc = { merc: 40, pers: 40, luck: 40, disp: 50 }) {
  const merc = Math.min(pc.merc || 0, 100);
  const pers = pc.pers || 0;
  const luck = pc.luck || 0;
  const disp = Math.max(0, Math.min(100, pc.disp !== undefined ? pc.disp : 50));

  const a = Math.min(merc, 100);
  const b = Math.min(0.1 * luck, 10);
  const c = Math.min(0.2 * pers, 10);

  const d = Math.min(npc.merc || 0, 100);
  const e = Math.min(0.1 * (npc.luck || 40), 10);
  const f = Math.min(0.2 * (npc.pers || 40), 10);

  const ft = 1.25;
  const pcTerm = (disp - 50 + a + b + c) * ft;
  const npcTerm = (d + e + f) * ft;
  const buyTerm = 0.01 * (100 - 0.5 * (pcTerm - npcTerm));

  return Math.max(1, Math.floor(listPrice * buyTerm));
}

export const ENCHANTERS = [
  { id: "janand", n: "Janand Maulinie (Vivec, Guild of Mages)", merc: 10, pers: 45, luck: 40 },
  { id: "ilen", n: "Ilen Faveran (Balmora, Temple)", merc: 10, pers: 38, luck: 40 },
  { id: "maren", n: "Maren Uvaren (Tel Aruhn, Maren Uvaren: Enchanter)", merc: 20, pers: 50, luck: 50 },
  { id: "sauleius", n: "Sauleius Cullian (Ebonheart, Imperial Chapels)", merc: 10, pers: 57, luck: 40 },
  { id: "ureso", n: "Ureso Drath (Ald'ruhn, Temple)", merc: 10, pers: 45, luck: 40 },
  { id: "dabienne", n: "Dabienne Mornardl (Wolverine Hall: Mage's Guild)", merc: 10, pers: 45, luck: 40 },
  { id: "miraso", n: "Miraso Seran (Sadrith Mora, Telvanni Council House, Entry)", merc: 10, pers: 45, luck: 40 },
  { id: "tanar", n: "Tanar Llervi (Ald'ruhn, Guild of Mages)", merc: 10, pers: 45, luck: 40 },
  { id: "audenian", n: "Audenian Valius (Vivec, Telvanni Enchanter)", merc: 16, pers: 58, luck: 40 },
  { id: "galar", n: "Galar Rothan (Sadrith Mora, Telvanni Council House, Entry)", merc: 10, pers: 51, luck: 40 },
  { id: "galbedir", n: "Galbedir (Balmora, Guild of Mages)", merc: 10, pers: 45, luck: 40 },
  { id: "llandris", n: "Llandris Thirandus (Vivec, High Fane)", merc: 10, pers: 40, luck: 40 },
  { id: "felayn", n: "Felayn Andral (Holamayan Monastery)", merc: 20, pers: 40, luck: 40 },
  { id: "folms", n: "Folms Mirel (Caldera, Guild of Mages)", merc: 10, pers: 43, luck: 40 },
  { id: "barusi", n: "Barusi Venim (Tel Aruhn, Tower Living Quarters)", merc: 10, pers: 39, luck: 40 },
  { id: "alenus", n: "Alenus Vendu (Tel Vos, Services Tower)", merc: 10, pers: 52, luck: 40 },
  { id: "crulius", n: "Crulius Pontanian (Moonmoth Legion Fort, Interior)", merc: 10, pers: 62, luck: 40 },
  { id: "faras", n: "Faras Thirano (Ghostgate, Tower of Dawn Lower Level)", merc: 10, pers: 54, luck: 40 },
  { id: "miungei", n: "Miun-Gei (Vivec, Miun-Gei: Enchanter)", merc: 7, pers: 46, luck: 40 },
  { id: "hlendrisa", n: "Hlendrisa Seleth (Tel Uvirith, Seleth's House)", merc: 10, pers: 54, luck: 40 },
  { id: "llether", n: "Llether Vari (Ald'ruhn, Llether Vari: Enchanter)", merc: 10, pers: 44, luck: 40 }
];

export const ENCHANTERS_TR = [
  { id: "adalerine", n: "Adalerine (Port Telvannis, Tel Thenim: Lower Tower)", merc: 6, pers: 54, luck: 40, tr: 1 },
  { id: "agha", n: "Agha (Dragonstar West, Guild of Mages)", merc: 7, pers: 45, luck: 40, tr: 1 },
  { id: "ainssa", n: "Ainssa (Firewatch, Guild of Mages)", merc: 6, pers: 49, luck: 40, tr: 1 },
  { id: "alvayah", n: "Alvayah (Arvs-Shadan)", merc: 8, pers: 62, luck: 40, tr: 1 },
  { id: "ararvyne", n: "Ararvyne Senim (Tansumiran)", merc: 6, pers: 38, luck: 40, tr: 1 },
  { id: "aravyn", n: "Aravyn Telonys (Tel Rivus, Andvaryon: Upper Level)", merc: 6, pers: 37, luck: 40, tr: 1 },
  { id: "armen", n: "Armen (Bosmora, Marketplace)", merc: 6, pers: 45, luck: 40, tr: 1 },
  { id: "aryadora", n: "Aryadora (Anvil, Aryadora: Enchanter)", merc: 40, pers: 49, luck: 40, tr: 1 },
  { id: "birahn", n: "Birahn (Hlerynhul, Chapel of Dibella)", merc: 50, pers: 40, luck: 40, tr: 1 },
  { id: "bralyn", n: "Bralyn Sidrethi (Enamor Dayn, Tradehouse)", merc: 34, pers: 49, luck: 40, tr: 1 },
  { id: "cerul", n: "Cerul Arnem (Port Telvannis, Cerul Arnem: Enchanter)", merc: 6, pers: 38, luck: 40, tr: 1 },
  { id: "curallo", n: "Curallo Callidus (Anvil, Curallo Callidus: Enchanter)", merc: 44, pers: 57, luck: 40, tr: 1 },
  { id: "dalami", n: "Dalami Ondos (Roa Dyr, Craftsmen's Hall)", merc: 6, pers: 54, luck: 40, tr: 1 },
  { id: "daravas", n: "Daravas (Anvil, Daravas: Enchanter and Soothsayer)", merc: 29, pers: 44, luck: 40, tr: 1 },
  { id: "dorash", n: "Dorash gro-Drethan (Firewatch, Dorash gro-Drethan: Enchanter)", merc: 5, pers: 34, luck: 40, tr: 1 },
  { id: "dradas", n: "Dradas Verelnim (Nanaav, Scriptorium)", merc: 18, pers: 42, luck: 40, tr: 1 },
  { id: "dreynis", n: "Dreynis Farvethi (Narsis, Sewers: Ja-Natta Syndicate Hideout)", merc: 6, pers: 42, luck: 40, tr: 1 },
  { id: "dridase", n: "Dridase Irano (Roa Dyr, Hall of Mystery)", merc: 35, pers: 54, luck: 40, tr: 1 },
  { id: "eancor", n: "Eancor (Karthwasten, Eancor: Enchanter)", merc: 15, pers: 52, luck: 40, tr: 1 },
  { id: "ervul", n: "Ervul Dranoth (Tel Gilan, Ervul Dranoth: Enchanter)", merc: 6, pers: 40, luck: 40, tr: 1 },
  { id: "estarrion", n: "Estarrion (Charach, Guild of Mages)", merc: 60, pers: 51, luck: 40, tr: 1 },
  { id: "firiquen", n: "Firiquen (Tel Muthada, Upper Tower)", merc: 6, pers: 53, luck: 40, tr: 1 },
  { id: "furan", n: "Furan of Akoma (Anvil, Goldenrod House: Services Wing)", merc: 12, pers: 54, luck: 40, tr: 1 },
  { id: "geroth", n: "Geroth Enlaris (Alt Bosara, Geroth Enlaris: Enchanter)", merc: 38, pers: 33, luck: 40, tr: 1 },
  { id: "grimdil", n: "Grimdil (Llothanis, Bal Gernak Manor)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "hessei", n: "Hessei-Lig (Helnim, Guild of Mages)", merc: 6, pers: 37, luck: 40, tr: 1 },
  { id: "hidesinstars", n: "Hides-In-Stars (Dragonstar West, Great Bazaar)", merc: 15, pers: 36, luck: 40, tr: 1 },
  { id: "ivramie", n: "Ivramie Mothryon (Narsis, Eight-Bones Temple)", merc: 60, pers: 53, luck: 40, tr: 1 },
  { id: "lleresia", n: "Lleresia Himnu (Othrenis, Lleresia Himnu: Enchanter)", merc: 7, pers: 55, luck: 40, tr: 1 },
  { id: "lorviel", n: "Lorviel (Almas Thirr, Guild of Mages)", merc: 18, pers: 50, luck: 40, tr: 1 },
  { id: "mabrilette", n: "Mabrilette Eusine (Ald Iuval, Abandoned Hut)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "marquand", n: "Marquand Lavalle (Anvil, Guild of Mages)", merc: 40, pers: 46, luck: 40, tr: 1 },
  { id: "belbetu", n: "Master Bel-Betu (Sehutu, Sanctum of Souls)", merc: 8, pers: 56, luck: 40, tr: 1 },
  { id: "melisan", n: "Melisan Endureth (Port Telvannis, Telvanni Council House: Entrance)", merc: 7, pers: 62, luck: 40, tr: 1 },
  { id: "milana", n: "Milana Eseroth (Tel Ouada, Tower)", merc: 32, pers: 47, luck: 40, tr: 1 },
  { id: "mindra", n: "Mindra (Karthwasten, Guild of Mages)", merc: 10, pers: 47, luck: 40, tr: 1 },
  { id: "naro", n: "Naro Marvani (Almas Thirr, Temple)", merc: 30, pers: 42, luck: 40, tr: 1 },
  { id: "neeshula", n: "Neeshula (Old Ebonheart, Grand Chapel of Talos: Towers)", merc: 6, pers: 36, luck: 40, tr: 1 },
  { id: "nelmyne", n: "Nelmyne Athones (Narsis, Nelmyne Athones: Enchanter)", merc: 46, pers: 53, luck: 40, tr: 1 },
  { id: "ondran", n: "Ondran Salobar (Rallabala)", merc: 8, pers: 55, luck: 40, tr: 1 },
  { id: "osyn", n: "Osyn Redola (Tel Ouada, Tower: West Wing)", merc: 58, pers: 54, luck: 40, tr: 1 },
  { id: "pisca", n: "Pisca Vribs (Gah Sadrith, Pisca Vribs: Enchanter)", merc: 6, pers: 46, luck: 40, tr: 1 },
  { id: "pyreiwe", n: "Pyreiwe (Bal Foyen, Chapel of Mara)", merc: 6, pers: 53, luck: 40, tr: 1 },
  { id: "ralsa", n: "Ralsa Ondusi (Narsis, Guild of Mages: Laboratories)", merc: 55, pers: 69, luck: 40, tr: 1 },
  { id: "ranosa", n: "Ranosa Orrels (Akamora, Guild of Mages)", merc: 56, pers: 52, luck: 40, tr: 1 },
  { id: "raylin", n: "Raylin Tevan (Akamora, Underground Bazaar)", merc: 6, pers: 40, luck: 40, tr: 1 },
  { id: "rexus", n: "Rexus Harsinia (Bal Foyen, Guild of Mages)", merc: 16, pers: 55, luck: 40, tr: 1 },
  { id: "seris", n: "Seris Athyon (Tel Mothrivra, Seris Athyon: Magic Supplies)", merc: 6, pers: 47, luck: 40, tr: 1 },
  { id: "shadowhound", n: "Shadow-Hound (Uddanu, Tower)", merc: 6, pers: 44, luck: 40, tr: 1 },
  { id: "sielle", n: "Sielle Eumand (Brina Cross, Guild of Mages)", merc: 30, pers: 60, luck: 40, tr: 1 },
  { id: "sodeen", n: "Sodeen (Vhul [10, -24])", merc: 6, pers: 51, luck: 40, tr: 1 },
  { id: "solas", n: "Solas Ilvu (Othrenis, Temple)", merc: 30, pers: 43, luck: 40, tr: 1 },
  { id: "tabad", n: "Tabad Vems (Tel Ouada, Tower)", merc: 6, pers: 40, luck: 40, tr: 1 },
  { id: "talvenyl", n: "Talvenyl Lerano (Almas Thirr, Talvenyl Lerano: Enchanter)", merc: 58, pers: 43, luck: 40, tr: 1 },
  { id: "tedri", n: "Tedri Adas (Bal Foyen, Temple)", merc: 6, pers: 36, luck: 40, tr: 1 },
  { id: "thorvora", n: "Thorvora Avani (Nanaav, Temple)", merc: 28, pers: 44, luck: 40, tr: 1 },
  { id: "torasa", n: "Torasa Fols (Bal Foyen, Torasa Fols: Enchanter)", merc: 6, pers: 50, luck: 40, tr: 1 },
  { id: "turosi", n: "Turosi Salvel (Port Telvannis, Turosi Salvel: Enchanter)", merc: 7, pers: 52, luck: 40, tr: 1 },
  { id: "ulvos", n: "Ulvos Braryn (Darvonis, Temple)", merc: 6, pers: 43, luck: 40, tr: 1 },
  { id: "uradas", n: "Uradas Vendal (Windmoth Legion Fort, Interior)", merc: 6, pers: 40, luck: 40, tr: 1 },
  { id: "varden", n: "Varden Alvis (Tel Muthada, Varden Alvis: Enchanter)", merc: 29, pers: 35, luck: 40, tr: 1 },
  { id: "waterfall", n: "Waterfall-Beneath-Cloudy-Sky (Narsis, Guild of Mages: Chambers of Summoning)", merc: 40, pers: 52, luck: 40, tr: 1 },
  { id: "wilgod", n: "Wilgod the Perennial (Narsis, Measurehall: Accomodations)", merc: 7, pers: 69, luck: 40, tr: 1 },
  { id: "yuaile", n: "Yuaile Phyroc (Old Ebonheart, Yuaile Phyroc: Enchanter)", merc: 18, pers: 44, luck: 40, tr: 1 },
  { id: "zissicheeiva", n: "Zissicheeiva (Old Ebonheart, Guild of Mages: Basement)", merc: 5, pers: 32, luck: 40, tr: 1 }
];

export function getActiveEnchanters(world = "vanilla") {
  return world === "tr" ? ENCHANTERS.concat(ENCHANTERS_TR) : ENCHANTERS;
}

