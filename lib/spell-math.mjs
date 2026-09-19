/**
 * OpenMW Spellmaking Math & Casting Mechanics
 */

export const MAGIC_SCHOOLS = [
  "All",
  "Alteration",
  "Conjuration",
  "Destruction",
  "Illusion",
  "Mysticism",
  "Restoration"
];

export const F_SPELL_MAKING_GOLD_MULT = 5;

export function calcSingleSpellEffectCost(effect, min = 1, max = 1, dur = 1, area = 0, range = "self") {
  if (!effect) return 0;
  const magMin = effect.mag ? Math.max(1, min || 1) : 1;
  const magMax = effect.mag ? Math.max(1, max || 1) : 1;
  const duration = effect.dur ? Math.max(1, dur || 1) : 1;
  const ar = range === "self" ? 0 : Math.max(0, area || 0);

  let cost = ((magMin + magMax) * duration + ar) * (effect.b || 1) * 0.05;
  cost = Math.max(1, cost);
  if (range === "target") {
    cost *= 1.5;
  }
  return cost;
}

export function calcTotalSpellMagickaCost(effects = []) {
  if (!effects.length) return 0;
  let total = 0;
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (!e || !e.effect) continue;
    total += calcSingleSpellEffectCost(e.effect, e.min, e.max, e.dur, e.area, e.range);
  }
  return Math.max(1, Math.floor(total));
}

export function calcSpellCastChance(magickaCost, governingSkill = 50, willpower = 40, luck = 40, fatigueRatio = 1.0) {
  // OpenMW cast chance formula:
  // castChance = (Skill * 2 + Willpower / 5 + Luck / 10 - MagickaCost) * (0.75 + 0.5 * FatigueRatio)
  if (magickaCost <= 0) return 100;
  const skillTerm = governingSkill * 2;
  const statTerm = (willpower / 5) + (luck / 10);
  const fatigueTerm = 0.75 + (0.5 * Math.max(0, Math.min(1.25, fatigueRatio)));
  const baseChance = (skillTerm + statTerm - magickaCost) * fatigueTerm;

  return Math.max(0, Math.min(100, Math.round(baseChance)));
}

export function calcSpellmakerBaseGold(magickaCost) {
  return Math.max(1, Math.round(magickaCost * F_SPELL_MAKING_GOLD_MULT * 2));
}

export function calcSpellmakerBarterPrice(listPrice, npc, pc = { merc: 40, pers: 40, luck: 40, disp: 50 }) {
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

export const SPELLMAKERS = [
  { id: "sinnammu", n: "Sinnammu Mirpal (Ahemmusa Camp, Wise Woman's Yurt)", merc: 7, pers: 84, luck: 40 },
  { id: "heemla", n: "Heem-La (Ald'ruhn, Guild of Mages)", merc: 10, pers: 38, luck: 40 },
  { id: "guls", n: "Guls Llervu (Ald'ruhn, Guls Llervu's House)", merc: 10, pers: 48, luck: 40 },
  { id: "lloros", n: "Lloros Sarano (Ald'ruhn, Temple)", merc: 10, pers: 55, luck: 40 },
  { id: "leles", n: "Leles Birian (Ascadian Isles Region [4,-8])", merc: 40, pers: 74, luck: 40 },
  { id: "estirdalin", n: "Estirdalin (Balmora, Guild of Mages)", merc: 10, pers: 48, luck: 40 },
  { id: "llarara", n: "Llarara Omayn (Balmora, Temple)", merc: 10, pers: 55, luck: 40 },
  { id: "llathyno", n: "Llathyno Hlaalu (Balmora, Temple)", merc: 10, pers: 64, luck: 40 },
  { id: "dulian", n: "Dulian (Buckmoth Legion Fort, Interior)", merc: 10, pers: 57, luck: 40 },
  { id: "nebia", n: "Nebia Amphia (Ebonheart, Hawkmoth Legion Garrison)", merc: 10, pers: 76, luck: 40 },
  { id: "lalatia", n: "Lalatia Varian (Ebonheart, Imperial Chapels)", merc: 10, pers: 76, luck: 40 },
  { id: "manirai", n: "Manirai (Erabenimsun Camp, Wise Woman's Yurt)", merc: 10, pers: 76, luck: 40 },
  { id: "mehra", n: "Mehra Drora (Gnisis, Temple)", merc: 10, pers: 55, luck: 40 },
  { id: "nilvyn", n: "Nilvyn Drothan (Ghostgate, Temple)", merc: 10, pers: 60, luck: 40 },
  { id: "uvele", n: "Uvele Berendas (Indarys Manor, Berendas' House)", merc: 10, pers: 54, luck: 40 },
  { id: "sedris", n: "Sedris Omalen (Maar Gan, Outpost)", merc: 10, pers: 57, luck: 40 },
  { id: "salen", n: "Salen Ravel (Maar Gan, Shrine)", merc: 10, pers: 47, luck: 40 },
  { id: "somutis", n: "Somutis Vunnis (Moonmoth Legion Fort, Interior)", merc: 16, pers: 71, luck: 40 },
  { id: "erer", n: "Erer Darothril (Sadrith Mora, Dirty Muriel's Cornerclub)", merc: 40, pers: 64, luck: 40 },
  { id: "niras", n: "Niras Farys (Sadrith Mora, Telvanni Council House, Chambers)", merc: 10, pers: 50, luck: 40 },
  { id: "nelso", n: "Nelso Salenim (Sadrith Mora, Telvanni Council House, Entry)", merc: 10, pers: 51, luck: 40 },
  { id: "urtiso", n: "Urtiso Faryon (Sadrith Mora, Urtiso Faryon: Sorcerer)", merc: 10, pers: 45, luck: 40 },
  { id: "elynu", n: "Elynu Saren (Suran, Temple)", merc: 10, pers: 58, luck: 40 },
  { id: "felen", n: "Felen Maryon (Tel Branora, Upper Tower: Therana's Chamber)", merc: 7, pers: 47, luck: 40 },
  { id: "diren", n: "Diren Vendu (Tel Mora, Tower Services)", merc: 10, pers: 53, luck: 40 },
  { id: "tinaso", n: "Tinaso Alan (Tel Mora, Tower Services)", merc: 10, pers: 48, luck: 40 },
  { id: "farena", n: "Farena Arelas (Tel Uvirith, Arelas' House)", merc: 10, pers: 57, luck: 40 },
  { id: "nibani", n: "Nibani Maesa (Urshilaku Camp, Wise Woman's Yurt)", merc: 10, pers: 79, luck: 40 },
  { id: "malven", n: "Malven Romori (Vivec, Guild of Mages)", merc: 10, pers: 53, luck: 40 },
  { id: "dileno", n: "Dileno Lloran (Vivec, High Fane)", merc: 10, pers: 64, luck: 40 },
  { id: "rirnas", n: "Rirnas Athren (Vivec, Hlaalu Temple)", merc: 10, pers: 47, luck: 40 },
  { id: "relms", n: "Relms Gilvilo (Vivec, Redoran Temple Shrine)", merc: 10, pers: 45, luck: 40 },
  { id: "fevyn", n: "Fevyn Ralen (Vivec, Telvanni Mage)", merc: 10, pers: 48, luck: 40 },
  { id: "salver", n: "Salver Lleran (Vivec, Telvanni Waistworks)", merc: 10, pers: 45, luck: 40 },
  { id: "ferise", n: "Ferise Varo (Vos, Varo Tradehouse)", merc: 15, pers: 48, luck: 40 },
  { id: "eldrilu", n: "Eldrilu Dalen (Vos Chapel)", merc: 10, pers: 55, luck: 40 },
  { id: "aunius", n: "Aunius Autrus (Wolverine Hall, Imperial Shrine)", merc: 16, pers: 64, luck: 40 },
  { id: "uleni", n: "Uleni Heleran (Wolverine Hall, Mage's Guild)", merc: 10, pers: 48, luck: 40 }
];

export const SPELLMAKERS_TR = [
  { id: "adalerine", n: "Adalerine (Port Telvannis, Tel Thenim: Lower Tower)", merc: 6, pers: 54, luck: 40, tr: 1 },
  { id: "adasifuron", n: "Adasi Furon (Marog, Adasi Furon: Priest)", merc: 6, pers: 57, luck: 40, tr: 1 },
  { id: "aelidanym", n: "Aeli Danym (Tel Ouada, Tower)", merc: 6, pers: 57, luck: 40, tr: 1 },
  { id: "ahasousaravyn", n: "Ahasou Saravyn (Bosmora, Temple)", merc: 6, pers: 50, luck: 40, tr: 1 },
  { id: "anaryan", n: "Anaryan (Anvil, Port Quarter)", merc: 40, pers: 62, luck: 40, tr: 1 },
  { id: "andrielnienne", n: "Andriel Nienne (Fort Telodrach, Barracks)", merc: 30, pers: 59, luck: 40, tr: 1 },
  { id: "aphorvacnistula", n: "Aphorva Cnistula (Sadrathim, Chapel of Stendarr)", merc: 66, pers: 95, luck: 40, tr: 1 },
  { id: "arasothran", n: "Aras Othran (Necrom Lighthouse, Entrance Hall)", merc: 38, pers: 58, luck: 40, tr: 1 },
  { id: "athenimadri", n: "Athenim Adri (Sadas Plantation, Tel Sadas)", merc: 49, pers: 62, luck: 40, tr: 1 },
  { id: "barnsdorom", n: "Barns Dorom (Nanaav, Beroth House: Spire)", merc: 7, pers: 56, luck: 40, tr: 1 },
  { id: "barusifareleth", n: "Barusi Fareleth (Narsis, Barusi Fareleth: Mage)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "berethenolameth", n: "Berethen Olameth (Necrom, Sacellum of St. Llothis)", merc: 39, pers: 53, luck: 40, tr: 1 },
  { id: "camilliachora", n: "Camillia Chora (Narsis, Guild of Mages)", merc: 16, pers: 65, luck: 40, tr: 1 },
  { id: "cantoriustramel", n: "Cantorius Tramel (Helnim, Chapel of Kynareth)", merc: 16, pers: 71, luck: 40, tr: 1 },
  { id: "cassandraverach", n: "Cassandra Verach (Anvil, Temple of Dibella Estetica: Auditorium)", merc: 40, pers: 69, luck: 40, tr: 1 },
  { id: "cellitara", n: "Cellitara (Old Ebonheart, Guild of Mages)", merc: 6, pers: 45, luck: 40, tr: 1 },
  { id: "corvusvalentinus", n: "Corvus Valentinus (Kemel-Ze, Aster)", merc: 16, pers: 65, luck: 40, tr: 1 },
  { id: "culennemair", n: "Culenne Mair (Firewatch, Dustmoth Legion Garrison: West Tower)", merc: 6, pers: 55, luck: 40, tr: 1 },
  { id: "dolordraven", n: "Dolor Draven (Marog, Dolor Draven: Mage)", merc: 6, pers: 44, luck: 40, tr: 1 },
  { id: "domusterrinus", n: "Domus Terrinus (Helnim, Fort Servas)", merc: 39, pers: 66, luck: 40, tr: 1 },
  { id: "dovorandroth", n: "Dovor Androth (Muld)", merc: 45, pers: 68, luck: 40, tr: 1 },
  { id: "drarynberathi", n: "Draryn Berathi (Ministry of Doctrine, Temple)", merc: 7, pers: 54, luck: 40, tr: 1 },
  { id: "drathyngalvith", n: "Drathyn Galvith (Felms Ithul, Drathyn Galvith's House)", merc: 6, pers: 44, luck: 40, tr: 1 },
  { id: "dridaseirano", n: "Dridase Irano (Roa Dyr, Hall of Mystery)", merc: 35, pers: 54, luck: 40, tr: 1 },
  { id: "drorayniomayn", n: "Drorayni Omayn (Monastery of St. Aralor, Abbey)", merc: 6, pers: 55, luck: 40, tr: 1 },
  { id: "drurilevayas", n: "Drurile Vayas (Narsis, Eight-Bones Temple: Lower Level)", merc: 7, pers: 66, luck: 40, tr: 1 },
  { id: "dyrosofeguame", n: "Dyros of Eguame (Narsis, Guild of Mages: Commons)", merc: 7, pers: 74, luck: 40, tr: 1 },
  { id: "endrailvuthi", n: "Endra Ilvuthi (Tahvel, Endra Ilvuthi's Shack)", merc: 34, pers: 56, luck: 40, tr: 1 },
  { id: "enolacolus", n: "Enola Colus (Anvil, Guild of Mages)", merc: 40, pers: 70, luck: 40, tr: 1 },
  { id: "eranthos", n: "Eranthos (Dragonstar West, Guild of Mages)", merc: 7, pers: 65, luck: 40, tr: 1 },
  { id: "ernestcergelle", n: "Ernest Cergelle (Hlerynhul, Ernest Cergelle's Apartment)", merc: 6, pers: 54, luck: 40, tr: 1 },
  { id: "erverdrinith", n: "Erver Drinith (Narsis, Shrine of the Hidden Saints)", merc: 6, pers: 53, luck: 40, tr: 1 },
  { id: "eyjar", n: "Eyjar (Anvil, Imperial Astrological Society)", merc: 20, pers: 37, luck: 40, tr: 1 },
  { id: "faldrusnedalor", n: "Faldrus Nedalor (Narsis, Morag Tong Guildhall: Basement)", merc: 6, pers: 43, luck: 40, tr: 1 },
  { id: "farasomayn", n: "Faras Omayn (Necrom Lighthouse, Entrance Hall)", merc: 39, pers: 62, luck: 40, tr: 1 },
  { id: "fedasthalothen", n: "Fedas Thalothen (Tilmeth, Manor)", merc: 19, pers: 66, luck: 40, tr: 1 },
  { id: "fedurantharen", n: "Feduran Tharen (Verulas Pass, Tunnels)", merc: 6, pers: 62, luck: 40, tr: 1 },
  { id: "francinealdard", n: "Francine Aldard (Akamora, Guild of Mages)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "furenhlavel", n: "Furen Hlavel (Othmura, Temple)", merc: 7, pers: 57, luck: 40, tr: 1 },
  { id: "fusathrelyan", n: "Fusath Relyan (Sadas Plantation, Tel Sadas)", merc: 7, pers: 52, luck: 40, tr: 1 },
  { id: "garrickusald", n: "Garrick Usald (Almas Thirr, Guild of Mages)", merc: 35, pers: 51, luck: 40, tr: 1 },
  { id: "gilenmalvayn", n: "Gilen Malvayn (Othmura, Guild of Mages)", merc: 34, pers: 51, luck: 40, tr: 1 },
  { id: "halanmacrinus", n: "Halan Macrinus (Firewatch, Guild of Mages)", merc: 16, pers: 60, luck: 40, tr: 1 },
  { id: "hervildolomas", n: "Hervil Dolomas (Narsis, Eight-Bones Temple: Lower Level)", merc: 7, pers: 59, luck: 40, tr: 1 },
  { id: "idesagilvani", n: "Idesa Gilvani (Bal Foyen, Guild of Mages)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "illeneedryn", n: "Illene Edryn (Roa Dyr, Ilvi House)", merc: 6, pers: 57, luck: 40, tr: 1 },
  { id: "ilmenibendalos", n: "Ilmeni Bendalos (Akamora, Temple)", merc: 45, pers: 53, luck: 40, tr: 1 },
  { id: "indrasidovayn", n: "Indrasi Dovayn (Rallabala)", merc: 7, pers: 64, luck: 40, tr: 1 },
  { id: "jitavarad", n: "Ji'Tavarad (Karthwasten, Guild of Mages)", merc: 12, pers: 70, luck: 40, tr: 1 },
  { id: "kuhloga", n: "Kuhloga (Anvil, Temple of Dibella Estetica: Frigidarium)", merc: 38, pers: 70, luck: 40, tr: 1 },
  { id: "llaldir", n: "Llaldir (Charach, Guild of Mages)", merc: 30, pers: 46, luck: 40, tr: 1 },
  { id: "llerusamanel", n: "Llerusa Manel (Tel Onoria, Tower)", merc: 6, pers: 61, luck: 40, tr: 1 },
  { id: "llorynllaram", n: "Lloryn Llaram (Gah Sadrith, Lloryn Llaram's House)", merc: 6, pers: 47, luck: 40, tr: 1 },
  { id: "llorynonorom", n: "Lloryno Norom (Vhul, Temple)", merc: 7, pers: 67, luck: 40, tr: 1 },
  { id: "lysimavenitus", n: "Lysima Venitus (Narsis, Chapel of Zenithar)", merc: 54, pers: 70, luck: 40, tr: 1 },
  { id: "mariaafrana", n: "Maria Afrana (Hlerynhul, Chapel of Dibella)", merc: 65, pers: 81, luck: 40, tr: 1 },
  { id: "medralasadus", n: "Medrala Sadus (Othrenis, Temple)", merc: 11, pers: 56, luck: 40, tr: 1 },
  { id: "meliasimerius", n: "Melia Simerius (Brina Cross, Chapel of Crimson Strings)", merc: 40, pers: 64, luck: 40, tr: 1 },
  { id: "merynsarano", n: "Meryn Sarano ((Unnamed exterior cell) [-7, -15])", merc: 5, pers: 44, luck: 40, tr: 1 },
  { id: "musaashadallit", n: "Musa Ashadallit (Obainat Camp, Wise Woman's Yurt)", merc: 6, pers: 60, luck: 40, tr: 1 },
  { id: "mutunambabud", n: "Mutu Nambabud (Gan-Ettu Camp, Saharkhan's Tent)", merc: 7, pers: 52, luck: 65, tr: 1 },
  { id: "myrvonaarothan", n: "Myrvona Arothan (Hlan Oek, Temple)", merc: 7, pers: 64, luck: 40, tr: 1 },
  { id: "nalmendrinith", n: "Nalmen Drinith (Surpu)", merc: 7, pers: 54, luck: 40, tr: 1 },
  { id: "naureen", n: "Naureen ((Unnamed exterior cell) [-8, -11])", merc: 6, pers: 59, luck: 40, tr: 1 },
  { id: "nelmynegavos", n: "Nelmyne Gavos (Narsis, Nelmyne Gavos' Apartment)", merc: 6, pers: 51, luck: 40, tr: 1 },
  { id: "nevusalakasyn", n: "Nevusa Lakasyn (Ranyon-ruhn, Nevusa Lakasyn: Healer)", merc: 7, pers: 81, luck: 40, tr: 1 },
  { id: "nilenaothril", n: "Nilena Othril (Gah Sadrith, Market)", merc: 38, pers: 55, luck: 40, tr: 1 },
  { id: "niramindra", n: "Niramindra (Narsis, Guild of Mages)", merc: 6, pers: 48, luck: 50, tr: 1 },
  { id: "ondruhalethran", n: "Ondru Halethran (Narsis, Measurehall: Accomodations)", merc: 7, pers: 69, luck: 40, tr: 1 },
  { id: "onuseareyas", n: "Onusea Reyas (Darvonis, Temple)", merc: 7, pers: 64, luck: 40, tr: 1 },
  { id: "orevishlan", n: "Orevis Hlan (Vurdural)", merc: 7, pers: 48, luck: 40, tr: 1 },
  { id: "osynredola", n: "Osyn Redola (Tel Ouada, Tower: West Wing)", merc: 58, pers: 54, luck: 40, tr: 1 },
  { id: "plutusceno", n: "Plutus Ceno (Narsis, Chapel of Zenithar)", merc: 42, pers: 75, luck: 40, tr: 1 },
  { id: "protiocalvisus", n: "Protio Calvisus (Firewatch, Grand Chapel of Akatosh)", merc: 16, pers: 65, luck: 40, tr: 1 },
  { id: "punibirindo", n: "Punibi Rindo (Ranyon-ruhn, Temple)", merc: 6, pers: 44, luck: 40, tr: 1 },
  { id: "qowenfaareverelnim", n: "Qowenfaare Verelnim (Nanaav, Scriptorium)", merc: 6, pers: 51, luck: 40, tr: 1 },
  { id: "raltenaffinia", n: "Ralten Affinia (Helnim, Guild of Mages)", merc: 16, pers: 58, luck: 40, tr: 1 },
  { id: "ramoraatheron", n: "Ramora Atheron (Ussiran Camp, Communal Tent)", merc: 6, pers: 59, luck: 40, tr: 1 },
  { id: "ranisandren", n: "Ranis Andren (Almas Thirr, Monastery of St. Veloth: Dome)", merc: 7, pers: 64, luck: 40, tr: 1 },
  { id: "ransovirian", n: "Ranso Virian (Bal Foyen, Temple)", merc: 6, pers: 44, luck: 40, tr: 1 },
  { id: "rarunsitervthi", n: "Rarunsi Tervthi (Khalaan, Sewers)", merc: 6, pers: 74, luck: 40, tr: 1 },
  { id: "relmeriadrados", n: "Relmeria Drados (Tel Muthada, Upper Tower)", merc: 6, pers: 57, luck: 40, tr: 1 },
  { id: "renixiavedius", n: "Renixia Vedius ((Unnamed exterior cell) [-3, -49])", merc: 43, pers: 68, luck: 40, tr: 1 },
  { id: "riluvasovoras", n: "Riluva Sovoras (Almas Thirr, Monastery of St. Veloth)", merc: 6, pers: 62, luck: 40, tr: 1 },
  { id: "rirayneaomayn", n: "Riraynea Omayn (Narsis, Catacombs: Steps of Reverence)", merc: 7, pers: 72, luck: 40, tr: 1 },
  { id: "salaruandalen", n: "Salaru Andalen (Aimrah, Salaru Andalen: Healer)", merc: 21, pers: 53, luck: 40, tr: 1 },
  { id: "saturius", n: "Saturius (Ebon Tower, Julianos' Tower)", merc: 16, pers: 54, luck: 40, tr: 1 },
  { id: "saylenusramaril", n: "Saylenus Ramaril ((Unnamed exterior cell) [-3, -17])", merc: 6, pers: 35, luck: 40, tr: 1 },
  { id: "selenya", n: "Selenya (Dragonstar East, Selenya: Mage)", merc: 7, pers: 67, luck: 40, tr: 1 },
  { id: "serisathyon", n: "Seris Athyon (Tel Mothrivra, Seris Athyon: Magic Supplies)", merc: 6, pers: 47, luck: 40, tr: 1 },
  { id: "sigillahparate", n: "Sigillah Parate (Alta Vathor, Shrine)", merc: 8, pers: 66, luck: 40, tr: 1 },
  { id: "simonemegale", n: "Simone Megale (Firemoth Legion Fort, Keep)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "swirlytongue", n: "Swirly-Tongue (Vhul, Moss Market)", merc: 6, pers: 48, luck: 40, tr: 1 },
  { id: "taldasimenguren", n: "Taldasi Menguren (Port Telvannis, Tel Thenim: Upper Tower)", merc: 42, pers: 65, luck: 40, tr: 1 },
  { id: "taynabaren", n: "Tayna Baren (Gorne, Spiritual Seeker's Hall)", merc: 25, pers: 61, luck: 40, tr: 1 },
  { id: "tilisukelarven", n: "Tilisu Kelarven (Narsis, Eight-Bones Temple)", merc: 7, pers: 59, luck: 40, tr: 1 },
  { id: "tireleedri", n: "Tirele Edri (Tel Oren, Tower)", merc: 28, pers: 38, luck: 40, tr: 1 },
  { id: "trendilvas", n: "Trendil Vas (Sadas Plantation, Tel Sadas)", merc: 6, pers: 43, luck: 40, tr: 1 },
  { id: "tureyvendil", n: "Tureyvendil (Idathren [5, -34])", merc: 6, pers: 46, luck: 40, tr: 1 },
  { id: "ulynellothas", n: "Ulyne Llothas (Sailen, Temple)", merc: 41, pers: 63, luck: 40, tr: 1 },
  { id: "urvasvaren", n: "Urvas Varen (Nanaav, Temple)", merc: 6, pers: 47, luck: 40, tr: 1 },
  { id: "usmallinefros", n: "Usmalli Nefros (Port Telvannis, Tel Thenim: Lower Tower)", merc: 7, pers: 52, luck: 40, tr: 1 },
  { id: "vadennerath", n: "Vaden Nerath (Hlersis, Temple)", merc: 7, pers: 64, luck: 40, tr: 1 },
  { id: "valaccaprontia", n: "Valacca Prontia (Old Ebonheart, Grand Chapel of Talos)", merc: 16, pers: 66, luck: 40, tr: 1 },
  { id: "valarafilansi", n: "Valara Filansi (Ald Iuval, Temple)", merc: 54, pers: 79, luck: 40, tr: 1 },
  { id: "valrikbirdcaller", n: "Valrik Bird-Caller (Bal Foyen, Chapel of Mara)", merc: 6, pers: 50, luck: 40, tr: 1 },
  { id: "vendiltras", n: "Vendil Tras (Gah Sadrith, Vendil Tras: Sorcerer)", merc: 6, pers: 47, luck: 40, tr: 1 },
  { id: "vilraniredothan", n: "Vilrani Redothan (Almas Thirr, Temple)", merc: 30, pers: 70, luck: 40, tr: 1 },
  { id: "vistiennagalnacius", n: "Vistienna Galnacius (Septim's Gate Pass, Northern Gatehouse)", merc: 17, pers: 75, luck: 40, tr: 1 },
  { id: "vonaklimonith", n: "Vonak Limonith (Tel Ouada [25, 18])", merc: 35, pers: 38, luck: 40, tr: 1 },
  { id: "vonosarando", n: "Vono Sarando (Nan Iban, Temple)", merc: 7, pers: 56, luck: 40, tr: 1 },
  { id: "wearagaldan", n: "Weara Galdan (Thresvy, Chapel of Persisting Sustenance)", merc: 26, pers: 62, luck: 40, tr: 1 },
  { id: "yanahhe", n: "Yan-Ahhe (Ishanuran Camp, Wise Woman's Yurt)", merc: 6, pers: 62, luck: 40, tr: 1 },
  { id: "zhirasha", n: "Zhirasha (Sadrathim, Chapel of Stendarr)", merc: 42, pers: 69, luck: 40, tr: 1 }
];

export function getActiveSpellmakers(world = "vanilla") {
  return world === "tr" ? SPELLMAKERS.concat(SPELLMAKERS_TR) : SPELLMAKERS;
}

