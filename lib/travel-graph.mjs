/**
 * Morrowind Transit Network Graph & Shortest Path Routing Engine
 */

export const SERVICE_LABELS = {
  "t_mw_riverstriderservice": "River Strider",
  "t_glb_fisherman": "Fisherman",
  "Mage Guide": "Guild Guide",
  "Boat": "Boat",
  "Silt Strider": "Silt Strider",
  "Gondolier": "Gondolier",
  "Rogue": "Boat",
  "Slave": "Boat"
};

export const VANILLA_STOPS = new Set([
  "Ald-ruhn", "Balmora", "Caldera", "Dagon Fel", "Ebonheart",
  "Fort Frostmoth", "Gnaar Mok", "Gnisis", "Hla Oad", "Khuul",
  "Maar Gan", "Molag Mar", "Raven Rock", "Sadrith Mora", "Seyda Neen",
  "Suran", "Tel Aruhn", "Tel Branora", "Tel Mora", "Vivec", "Vos"
]);

export const RAW_GRAPH = {
  "Aimrah": [{ service: "Boat", to: "Maar-Bani Crossing" }, { service: "Silt Strider", to: "Almas Thirr" }, { service: "Silt Strider", to: "Othrenis" }, { service: "Silt Strider", to: "Vhul" }, { service: "Slave", to: "Nanaav" }],
  "Akamora": [{ service: "Mage Guide", to: "Almas Thirr" }, { service: "Mage Guide", to: "Bal Foyen" }, { service: "Mage Guide", to: "Old Ebonheart" }, { service: "Silt Strider", to: "Darvonis" }, { service: "Silt Strider", to: "Necrom" }, { service: "Silt Strider", to: "Sailen" }, { service: "Silt Strider", to: "Tel Muthada" }],
  "Ald Iuval": [{ service: "Silt Strider", to: "Ald Marak" }, { service: "t_mw_riverstriderservice", to: "Hlerynhul" }, { service: "t_mw_riverstriderservice", to: "Narsis" }, { service: "t_mw_riverstriderservice", to: "Othmura" }, { service: "t_mw_riverstriderservice", to: "Sadrathim" }],
  "Ald Marak": [{ service: "Silt Strider", to: "Ald Iuval" }],
  "Ald-ruhn": [{ service: "Mage Guide", to: "Balmora" }, { service: "Mage Guide", to: "Caldera" }, { service: "Mage Guide", to: "Sadrith Mora" }, { service: "Mage Guide", to: "Vivec" }, { service: "Silt Strider", to: "Balmora" }, { service: "Silt Strider", to: "Gnisis" }, { service: "Silt Strider", to: "Khuul" }, { service: "Silt Strider", to: "Maar Gan" }],
  "Almas Thirr": [{ service: "Boat", to: "Bal Foyen" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Mage Guide", to: "Akamora" }, { service: "Mage Guide", to: "Bal Foyen" }, { service: "Mage Guide", to: "Old Ebonheart" }, { service: "Silt Strider", to: "Aimrah" }, { service: "Silt Strider", to: "Bal Foyen" }, { service: "Silt Strider", to: "Hlan Oek" }, { service: "Silt Strider", to: "Necrom" }, { service: "Silt Strider", to: "Othrenis" }, { service: "Silt Strider", to: "Vhul" }, { service: "Slave", to: "Roa Dyr" }, { service: "t_mw_riverstriderservice", to: "Hlan Oek" }, { service: "t_mw_riverstriderservice", to: "Maar-Bani Crossing" }, { service: "t_mw_riverstriderservice", to: "Narsis" }],
  "Alt Bosara": [{ service: "Boat", to: "Llothanis" }, { service: "Boat", to: "Necrom" }, { service: "t_mw_riverstriderservice", to: "Llothanis" }, { service: "t_mw_riverstriderservice", to: "Port Telvannis" }, { service: "t_mw_riverstriderservice", to: "Tel Mothrivra" }],
  "Anvil": [{ service: "Boat", to: "Archad" }, { service: "Boat", to: "Charach" }, { service: "Boat", to: "Ebonheart" }, { service: "Boat", to: "Karthwasten" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Boat", to: "Thresvy" }, { service: "Gondolier", to: "Anvil" }, { service: "Mage Guide", to: "Brina Cross" }, { service: "Mage Guide", to: "Charach" }, { service: "Silt Strider", to: "Brina Cross" }, { service: "Silt Strider", to: "Hal Sadek" }],
  "Archad": [{ service: "Boat", to: "Anvil" }],
  "Arvud": [{ service: "Merchant", to: "Ushu-Kur" }, { service: "Silt Strider", to: "Hlan Oek" }, { service: "Silt Strider", to: "Menaan" }],
  "Bahrammu": [{ service: "Boat", to: "Bal Oyra" }, { service: "Boat", to: "Nivalis" }],
  "Bal Foyen": [{ service: "Boat", to: "Almas Thirr" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Boat", to: "Teyn" }, { service: "Boat", to: "Vivec" }, { service: "Mage Guide", to: "Akamora" }, { service: "Mage Guide", to: "Almas Thirr" }, { service: "Mage Guide", to: "Old Ebonheart" }, { service: "Silt Strider", to: "Almas Thirr" }, { service: "Silt Strider", to: "Hlan Oek" }, { service: "Silt Strider", to: "Menaan" }, { service: "Silt Strider", to: "Omaynis" }],
  "Bal Oyra": [{ service: "Boat", to: "Bahrammu" }, { service: "Boat", to: "Nivalis" }, { service: "Boat", to: "Tel Ouada" }],
  "Balmora": [{ service: "Mage Guide", to: "Ald-ruhn" }, { service: "Mage Guide", to: "Caldera" }, { service: "Mage Guide", to: "Sadrith Mora" }, { service: "Mage Guide", to: "Vivec" }, { service: "Silt Strider", to: "Ald-ruhn" }, { service: "Silt Strider", to: "Seyda Neen" }, { service: "Silt Strider", to: "Suran" }, { service: "Silt Strider", to: "Vivec" }],
  "Bodrum": [{ service: "Silt Strider", to: "Omaynis" }],
  "Bosmora": [{ service: "Silt Strider", to: "Sailen" }],
  "Brina Cross": [{ service: "Mage Guide", to: "Anvil" }, { service: "Mage Guide", to: "Charach" }, { service: "Silt Strider", to: "Anvil" }],
  "Caldera": [{ service: "Mage Guide", to: "Ald-ruhn" }, { service: "Mage Guide", to: "Balmora" }, { service: "Mage Guide", to: "Sadrith Mora" }, { service: "Mage Guide", to: "Vivec" }],
  "Charach": [{ service: "Boat", to: "Anvil" }, { service: "Boat", to: "Thresvy" }, { service: "Mage Guide", to: "Anvil" }, { service: "Mage Guide", to: "Brina Cross" }],
  "Dagon Fel": [{ service: "Boat", to: "Firewatch" }, { service: "Boat", to: "Karthwasten" }, { service: "Boat", to: "Khuul" }, { service: "Boat", to: "Nivalis" }, { service: "Boat", to: "Sadrith Mora" }, { service: "Boat", to: "Tel Aruhn" }, { service: "Boat", to: "Tel Mora" }],
  "Darvonis": [{ service: "Boat", to: "Gorne" }, { service: "Boat", to: "Helnim" }, { service: "Boat", to: "Marog" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Silt Strider", to: "Akamora" }, { service: "Silt Strider", to: "Othrenis" }, { service: "Silt Strider", to: "Varon" }, { service: "Silt Strider", to: "Vhul" }],
  "Dragonstar East": [{ service: "Silt Strider", to: "Karthwasten" }],
  "Dragonstar West": [{ service: "Mage Guide", to: "Karthwasten" }],
  "Ebonheart": [{ service: "Boat", to: "Hla Oad" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Boat", to: "Sadrith Mora" }, { service: "Boat", to: "Tel Branora" }, { service: "Boat", to: "Teyn" }, { service: "Boat", to: "Vivec" }],
  "Enamor Dayn": [{ service: "Boat", to: "Nan Iban" }, { service: "Boat", to: "Necrom" }],
  "Firewatch": [{ service: "Boat", to: "Dagon Fel" }, { service: "Boat", to: "Helnim" }, { service: "Boat", to: "Nivalis" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Boat", to: "Sadrith Mora" }, { service: "Mage Guide", to: "Helnim" }, { service: "Mage Guide", to: "Nivalis" }],
  "Fort Frostmoth": [{ service: "Boat", to: "Khuul" }, { service: "Boat", to: "Raven Rock" }],
  "Gah Sadrith": [{ service: "Boat", to: "Llothanis" }, { service: "t_mw_riverstriderservice", to: "Port Telvannis" }],
  "Gnaar Mok": [{ service: "Boat", to: "Hla Oad" }, { service: "Boat", to: "Khuul" }],
  "Gnisis": [{ service: "Silt Strider", to: "Ald-ruhn" }, { service: "Silt Strider", to: "Khuul" }, { service: "Silt Strider", to: "Maar Gan" }, { service: "Silt Strider", to: "Seyda Neen" }],
  "Gorne": [{ service: "Boat", to: "Darvonis" }, { service: "Boat", to: "Marog" }, { service: "Boat", to: "Tel Branora" }, { service: "Boat", to: "Vivec" }],
  "Hal Sadek": [{ service: "Silt Strider", to: "Anvil" }],
  "Helnim": [{ service: "Boat", to: "Darvonis" }, { service: "Boat", to: "Firewatch" }, { service: "Boat", to: "Marog" }, { service: "Boat", to: "Sadrith Mora" }, { service: "Mage Guide", to: "Firewatch" }, { service: "Mage Guide", to: "Nivalis" }],
  "Hla Oad": [{ service: "Boat", to: "Ebonheart" }, { service: "Boat", to: "Gnaar Mok" }, { service: "Boat", to: "Molag Mar" }, { service: "Boat", to: "Vivec" }],
  "Hlan Oek": [{ service: "Silt Strider", to: "Almas Thirr" }, { service: "Silt Strider", to: "Arvud" }, { service: "Silt Strider", to: "Bal Foyen" }, { service: "Silt Strider", to: "Hlerynhul" }, { service: "t_mw_riverstriderservice", to: "Almas Thirr" }, { service: "t_mw_riverstriderservice", to: "Idathren" }, { service: "t_mw_riverstriderservice", to: "Maar-Bani Crossing" }],
  "Hlerynhul": [{ service: "Silt Strider", to: "Hlan Oek" }, { service: "Silt Strider", to: "Narsis" }, { service: "Silt Strider", to: "Shipal-Sharai" }, { service: "t_mw_riverstriderservice", to: "Ald Iuval" }, { service: "t_mw_riverstriderservice", to: "Narsis" }, { service: "t_mw_riverstriderservice", to: "Othmura" }, { service: "t_mw_riverstriderservice", to: "Sadrathim" }],
  "Idathren": [{ service: "t_mw_riverstriderservice", to: "Hlan Oek" }, { service: "t_mw_riverstriderservice", to: "Maar-Bani Crossing" }],
  "Karthgad": [{ service: "Boat", to: "Karthwasten" }],
  "Karthwasten": [{ service: "Boat", to: "Anvil" }, { service: "Mage Guide", to: "Dragonstar West" }, { service: "Silt Strider", to: "Dragonstar East" }],
  "Kemel-Ze": [{ service: "Boat", to: "Marog" }],
  "Khuul": [{ service: "Boat", to: "Dagon Fel" }, { service: "Boat", to: "Fort Frostmoth" }, { service: "Boat", to: "Gnaar Mok" }, { service: "Silt Strider", to: "Ald-ruhn" }, { service: "Silt Strider", to: "Gnisis" }, { service: "Silt Strider", to: "Maar Gan" }],
  "Llothanis": [{ service: "Boat", to: "Alt Bosara" }, { service: "Boat", to: "Gah Sadrith" }, { service: "Silt Strider", to: "Ranyon-ruhn" }, { service: "Silt Strider", to: "Tel Ouada" }, { service: "t_mw_riverstriderservice", to: "Alt Bosara" }, { service: "t_mw_riverstriderservice", to: "Port Telvannis" }, { service: "t_mw_riverstriderservice", to: "Tel Mothrivra" }],
  "Maar Gan": [{ service: "Silt Strider", to: "Ald-ruhn" }, { service: "Silt Strider", to: "Gnisis" }, { service: "Silt Strider", to: "Khuul" }],
  "Maar-Bani Crossing": [{ service: "Gondolier", to: "Aimrah" }, { service: "t_mw_riverstriderservice", to: "Almas Thirr" }, { service: "t_mw_riverstriderservice", to: "Hlan Oek" }, { service: "t_mw_riverstriderservice", to: "Idathren" }, { service: "t_mw_riverstriderservice", to: "Othmura" }],
  "Marog": [{ service: "Boat", to: "Darvonis" }, { service: "Boat", to: "Gorne" }, { service: "Boat", to: "Helnim" }, { service: "Boat", to: "Kemel-Ze" }, { service: "Boat", to: "Tel Branora" }],
  "Menaan": [{ service: "Silt Strider", to: "Arvud" }, { service: "Silt Strider", to: "Bal Foyen" }],
  "Molag Mar": [{ service: "Rogue", to: "Hla Oad" }, { service: "Rogue", to: "Tel Branora" }, { service: "Rogue", to: "Vivec" }, { service: "Silt Strider", to: "Suran" }, { service: "Silt Strider", to: "Vivec" }],
  "Narsis": [{ service: "Mage Guide", to: "Firewatch" }, { service: "Mage Guide", to: "Old Ebonheart" }, { service: "Mage Guide", to: "Othmura" }, { service: "Mage Guide", to: "Vivec" }, { service: "Silt Strider", to: "Hlerynhul" }, { service: "Silt Strider", to: "Shipal-Sharai" }, { service: "Silt Strider", to: "Stormgate Pass" }, { service: "t_mw_riverstriderservice", to: "Ald Iuval" }, { service: "t_mw_riverstriderservice", to: "Almas Thirr" }, { service: "t_mw_riverstriderservice", to: "Hlerynhul" }, { service: "t_mw_riverstriderservice", to: "Othmura" }, { service: "t_mw_riverstriderservice", to: "Sadrathim" }],
  "Necrom": [{ service: "Boat", to: "Alt Bosara" }, { service: "Boat", to: "Enamor Dayn" }, { service: "Boat", to: "Port Telvannis" }, { service: "Silt Strider", to: "Akamora" }, { service: "Silt Strider", to: "Almas Thirr" }, { service: "Silt Strider", to: "Sailen" }],
  "Nivalis": [{ service: "Boat", to: "Bahrammu" }, { service: "Boat", to: "Bal Oyra" }, { service: "Boat", to: "Dagon Fel" }, { service: "Boat", to: "Firewatch" }, { service: "Mage Guide", to: "Firewatch" }, { service: "Mage Guide", to: "Helnim" }],
  "Old Ebonheart": [{ service: "Boat", to: "Almas Thirr" }, { service: "Boat", to: "Anvil" }, { service: "Boat", to: "Bal Foyen" }, { service: "Boat", to: "Darvonis" }, { service: "Boat", to: "Ebonheart" }, { service: "Boat", to: "Firewatch" }, { service: "Boat", to: "Vivec" }, { service: "Mage Guide", to: "Akamora" }, { service: "Mage Guide", to: "Almas Thirr" }, { service: "Mage Guide", to: "Bal Foyen" }, { service: "Mage Guide", to: "Firewatch" }, { service: "Mage Guide", to: "Narsis" }, { service: "Mage Guide", to: "Vivec" }],
  "Omaynis": [{ service: "Silt Strider", to: "Bal Foyen" }, { service: "Silt Strider", to: "Bodrum" }],
  "Othmura": [{ service: "Mage Guide", to: "Narsis" }, { service: "t_mw_riverstriderservice", to: "Ald Iuval" }, { service: "t_mw_riverstriderservice", to: "Hlerynhul" }, { service: "t_mw_riverstriderservice", to: "Maar-Bani Crossing" }, { service: "t_mw_riverstriderservice", to: "Sadrathim" }],
  "Othrenis": [{ service: "Silt Strider", to: "Aimrah" }, { service: "Silt Strider", to: "Almas Thirr" }, { service: "Silt Strider", to: "Darvonis" }, { service: "Silt Strider", to: "Varon" }, { service: "Silt Strider", to: "Vhul" }, { service: "Slave", to: "Nanaav" }, { service: "Slave", to: "Roa Dyr" }, { service: "Slave", to: "Tilmeth" }],
  "Port Telvannis": [{ service: "t_mw_riverstriderservice", to: "Alt Bosara" }, { service: "t_mw_riverstriderservice", to: "Gah Sadrith" }, { service: "t_mw_riverstriderservice", to: "Llothanis" }, { service: "t_mw_riverstriderservice", to: "Necrom" }, { service: "t_mw_riverstriderservice", to: "Sadas Plantation" }, { service: "t_mw_riverstriderservice", to: "Tel Ouada" }],
  "Ranyon-ruhn": [{ service: "Silt Strider", to: "Llothanis" }, { service: "Silt Strider", to: "Tel Gilan" }, { service: "Silt Strider", to: "Tel Ouada" }],
  "Raven Rock": [{ service: "Boat", to: "Fort Frostmoth" }],
  "Roa Dyr": [{ service: "Slave", to: "Almas Thirr" }, { service: "Slave", to: "Nanaav" }, { service: "Slave", to: "Othrenis" }, { service: "Slave", to: "Tilmeth" }],
  "Sadrathim": [{ service: "Boat", to: "Ald Iuval" }, { service: "Boat", to: "Hlerynhul" }, { service: "Boat", to: "Narsis" }, { service: "Boat", to: "Othmura" }],
  "Sadrith Mora": [{ service: "Boat", to: "Dagon Fel" }, { service: "Boat", to: "Ebonheart" }, { service: "Boat", to: "Firewatch" }, { service: "Boat", to: "Helnim" }, { service: "Boat", to: "Tel Branora" }, { service: "Boat", to: "Tel Mora" }, { service: "Mage Guide", to: "Ald-ruhn" }, { service: "Mage Guide", to: "Balmora" }, { service: "Mage Guide", to: "Caldera" }, { service: "Mage Guide", to: "Vivec" }],
  "Sailen": [{ service: "Silt Strider", to: "Akamora" }, { service: "Silt Strider", to: "Bosmora" }, { service: "Silt Strider", to: "Necrom" }],
  "Septim's Gate Pass": [{ service: "Silt Strider", to: "Shipal-Sharai" }],
  "Seyda Neen": [{ service: "Silt Strider", to: "Balmora" }, { service: "Silt Strider", to: "Gnisis" }, { service: "Silt Strider", to: "Suran" }, { service: "Silt Strider", to: "Vivec" }],
  "Shipal-Sharai": [{ service: "Silt Strider", to: "Hlerynhul" }, { service: "Silt Strider", to: "Narsis" }, { service: "Silt Strider", to: "Septim's Gate Pass" }],
  "Stormgate Pass": [{ service: "Silt Strider", to: "Narsis" }],
  "Suran": [{ service: "Silt Strider", to: "Balmora" }, { service: "Silt Strider", to: "Molag Mar" }, { service: "Silt Strider", to: "Seyda Neen" }, { service: "Silt Strider", to: "Vivec" }],
  "Tel Branora": [{ service: "Boat", to: "Ebonheart" }, { service: "Boat", to: "Gorne" }, { service: "Boat", to: "Marog" }, { service: "Boat", to: "Molag Mar" }, { service: "Boat", to: "Sadrith Mora" }, { service: "Boat", to: "Vivec" }],
  "Tel Gilan": [{ service: "Silt Strider", to: "Ranyon-ruhn" }, { service: "Silt Strider", to: "Tel Mothrivra" }, { service: "Silt Strider", to: "Tel Muthada" }, { service: "Silt Strider", to: "Tel Onoria" }],
  "Tel Mora": [{ service: "Boat", to: "Dagon Fel" }, { service: "Boat", to: "Sadrith Mora" }, { service: "Boat", to: "Tel Aruhn" }, { service: "Boat", to: "Vos" }],
  "Tel Mothrivra": [{ service: "Silt Strider", to: "Tel Gilan" }, { service: "Silt Strider", to: "Tel Onoria" }, { service: "t_mw_riverstriderservice", to: "Alt Bosara" }, { service: "t_mw_riverstriderservice", to: "Llothanis" }],
  "Tel Onoria": [{ service: "Silt Strider", to: "Tel Gilan" }, { service: "Silt Strider", to: "Tel Muthada" }],
  "Tel Ouada": [{ service: "Boat", to: "Bal Oyra" }, { service: "Silt Strider", to: "Llothanis" }, { service: "Silt Strider", to: "Ranyon-ruhn" }, { service: "t_mw_riverstriderservice", to: "Port Telvannis" }],
  "Teyn": [{ service: "Boat", to: "Bal Foyen" }, { service: "Boat", to: "Ebonheart" }],
  "Thresvy": [{ service: "Boat", to: "Anvil" }, { service: "Boat", to: "Charach" }],
  "Tilmeth": [{ service: "Slave", to: "Nanaav" }, { service: "Slave", to: "Othrenis" }, { service: "Slave", to: "Roa Dyr" }],
  "Ushu-Kur": [{ service: "Silt Strider", to: "Arvud" }],
  "Varon": [{ service: "Silt Strider", to: "Darvonis" }, { service: "Silt Strider", to: "Othrenis" }],
  "Vhul": [{ service: "Silt Strider", to: "Aimrah" }, { service: "Silt Strider", to: "Almas Thirr" }, { service: "Silt Strider", to: "Darvonis" }, { service: "Silt Strider", to: "Othrenis" }],
  "Vivec": [{ service: "Boat", to: "Bal Foyen" }, { service: "Boat", to: "Ebonheart" }, { service: "Boat", to: "Gorne" }, { service: "Boat", to: "Hla Oad" }, { service: "Boat", to: "Molag Mar" }, { service: "Boat", to: "Old Ebonheart" }, { service: "Boat", to: "Tel Branora" }, { service: "Mage Guide", to: "Ald-ruhn" }, { service: "Mage Guide", to: "Balmora" }, { service: "Mage Guide", to: "Caldera" }, { service: "Mage Guide", to: "Firewatch" }, { service: "Mage Guide", to: "Narsis" }, { service: "Mage Guide", to: "Old Ebonheart" }, { service: "Mage Guide", to: "Sadrith Mora" }, { service: "Silt Strider", to: "Balmora" }, { service: "Silt Strider", to: "Molag Mar" }, { service: "Silt Strider", to: "Seyda Neen" }, { service: "Silt Strider", to: "Suran" }],
  "Vos": [{ service: "Boat", to: "Sadrith Mora" }, { service: "Boat", to: "Tel Aruhn" }, { service: "Boat", to: "Tel Mora" }]
};

/**
 * The stop a travel node belongs to: guild halls fold into their town and every Vivec
 * canton into "Vivec". Shared by the router and the transit map so both name stops alike.
 */
export function cleanStopName(name) {
  if (typeof name !== "string" || !name.trim()) return null;
  let n = name;
  if (/, Guild of Mages/i.test(n) || /, Wolverine Hall/i.test(n)) {
    n = n.replace(/, Guild of Mages.*$/i, '').replace(/, Wolverine Hall.*$/i, '');
  } else if (/^Vivec, /i.test(n)) {
    n = "Vivec";
  }
  return n.trim();
}

const GRID_KEY = /^exterior:(-?\d+),(-?\d+)$/;
const titleCase = text => text.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/**
 * The stop a travel node belongs to. Releases since travel policy 2026.09.27.2 name the
 * town ("Old Ebonheart, Docks" is Old Ebonheart); older ones only name the cell, so
 * guild halls and cantons are folded by name. A stop with neither — an unnamed dock no
 * town claims — is labelled by its region and grid square rather than dropped.
 */
export function stopNameFor(node, cellKey) {
  if (!node) return null;
  if (typeof node.town === "string" && node.town.trim()) return node.town.trim();
  const named = cleanStopName(node.name);
  if (named) return named;
  const grid = GRID_KEY.exec(cellKey || node.key || "");
  if (grid && typeof node.region === "string" && node.region.trim()) {
    return `${titleCase(node.region.trim())} (${grid[1]}, ${grid[2]})`;
  }
  return null;
}

export function adaptTravelGraph(records = [], nodes = {}, {mageGuild=true,conjurer=false,providers=null}={}) {
  const graph = {};
  const stopFor = (cellKey) => stopNameFor(nodes[cellKey], cellKey);

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const from = stopFor(record.from);
    const to = stopFor(record.to);
    if (!from || !to || from === to) continue;
    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];
    if ((record.requiresMageGuild || record.mode === 'guild_guide') && !mageGuild) continue;
    if (record.requiresConjurer && !conjurer) continue;

    // Tamriel Rebuilt's overland operators share one class; the data release reads the
    // vehicle at each stop, so a pack guar caravan or a sky lamp is not a silt strider.
    // No mode means a one-off: a slave, a fisherman, a monk rowing to Holamayan. Not a boat line.
    let modeLabel = "Other Transport";
    if (record.mode === "boat") modeLabel = "Boat";
    else if (record.mode === "silt_strider") modeLabel = "Silt Strider";
    else if (record.mode === "pack_guar") modeLabel = "Pack Guar";
    else if (record.mode === "sky_lamp") modeLabel = "Sky Lamp";
    else if (record.mode === "carriage") modeLabel = "Carriage";
    else if (record.mode === "guild_guide") modeLabel = "Guild Guide";
    else if (record.mode === "gondola") modeLabel = "Gondolier";
    else if (record.mode === "riverstrider" || record.mode === "t_mw_riverstriderservice") modeLabel = "River Strider";
    else if (SERVICE_LABELS[record.mode]) modeLabel = SERVICE_LABELS[record.mode];

    if (!graph[from]) graph[from] = [];
    // One edge per provider: each haggles with its own stats, so two boats between the
    // same towns can cost different amounts. Older releases carry no provider.
    const provider = typeof record.provider === "string" ? record.provider : undefined;
    if (!graph[from].some(e => e.to === to && e.kind === modeLabel && e.provider === provider)) {
      const edge = { to, kind: modeLabel };
      if (provider !== undefined) {
        edge.provider = provider;
        const info = providers?.[provider];
        if (info?.name) edge.providerName = info.name;
        if (info?.barter) edge.barter = info.barter;
      }
      if (record.price !== undefined) edge.price = record.price;
      if (record.hours !== undefined) edge.hours = record.hours;
      const board = nodes[record.from]?.district, alight = nodes[record.to]?.district;
      if (typeof board === "string" && board) edge.board = board;
      if (typeof alight === "string" && alight) edge.alight = alight;
      graph[from].push(edge);
    }
    if (!graph[to]) graph[to] = [];
  }
  return graph;
}

export const INTERVENTION_KINDS = Object.freeze({
  divine: "Divine Intervention",
  almsivi: "Almsivi Intervention"
});

/** The stop a marker lands you at, named the way travel names stops. */
function markerStop(marker) {
  if (!marker) return null;
  if (typeof marker.town === "string" && marker.town.trim()) return marker.town.trim();
  return cleanStopName(marker.name) || null;
}

/** "Vivec, Temple" lands at the Temple. */
function markerDistrict(marker) {
  const name = typeof marker?.name === "string" ? marker.name : "";
  const comma = name.indexOf(",");
  return comma >= 0 ? name.slice(comma + 1).trim() || null : null;
}

/**
 * Add Divine and Almsivi Intervention as legs that cost nothing and take no time,
 * from every travel stop and every landing spot, to where the Intervention catalog
 * says the engine puts you. `enabled` says which spells the character can cast.
 * Returns a new graph; the travel graph is not changed. A stop whose cells land in
 * different places gets one leg per landing, naming the district to cast from.
 */
export function addInterventionEdges(graph = {}, intervention = null, nodes = {}, enabled = {}) {
  const kinds = Object.keys(INTERVENTION_KINDS).filter(kind => enabled?.[kind]);
  const out = Object.fromEntries(Object.entries(graph || {}).map(([stop, edges]) => [stop, [...edges]]));
  if (!kinds.length || !intervention || !Array.isArray(intervention.records) || !intervention.markers) return out;
  const byKey = new Map(intervention.records.map(record => [record.key, record]));
  const origins = new Map();
  for (const [cellKey, node] of Object.entries(nodes || {})) {
    const stop = stopNameFor(node, cellKey);
    if (stop) origins.set(cellKey, { stop, district: typeof node?.district === "string" ? node.district : null });
  }
  for (const kind of kinds) {
    for (const marker of intervention.markers[kind] || []) {
      const stop = markerStop(marker);
      if (stop && marker.cell && !origins.has(marker.cell)) origins.set(marker.cell, { stop, district: markerDistrict(marker) });
    }
  }
  for (const [cellKey, origin] of origins) {
    const record = byKey.get(cellKey);
    if (!record) continue;
    for (const kind of kinds) {
      const index = record[kind];
      if (!Number.isInteger(index)) continue;
      const marker = intervention.markers[kind]?.[index];
      const to = markerStop(marker);
      if (!to || to === origin.stop) continue;
      if (!out[origin.stop]) out[origin.stop] = [];
      if (!out[to]) out[to] = [];
      const label = INTERVENTION_KINDS[kind];
      const existing = out[origin.stop].find(e => e.to === to && e.kind === label);
      const ambiguous = Boolean(record.ambiguous?.[kind]?.length);
      if (existing) {
        if (ambiguous) existing.ambiguous = true;
        continue;
      }
      const edge = { to, kind: label, spell: kind, free: true, price: 0, hours: 0 };
      if (origin.district) edge.board = origin.district;
      const alight = markerDistrict(marker);
      if (alight) edge.alight = alight;
      if (ambiguous) edge.ambiguous = true;
      out[origin.stop].push(edge);
    }
  }
  return out;
}

/** What a loaded save says the character can cast: the spell, or a scroll carried. */
export function interventionsFromSave(save) {
  const sources = interventionSources(save);
  return { divine: Boolean(sources.divine), almsivi: Boolean(sources.almsivi) };
}

/**
 * Where each Intervention comes from in a loaded save: "spell" when the character knows
 * it (castable again), "scroll" when it is only carried (one use), or null. A spell wins
 * over a scroll of the same kind.
 */
export function interventionSources(save) {
  const squash = id => (typeof id === "string" ? id.toLowerCase().replace(/[^a-z]/g, "") : "");
  const spells = (save?.stuff?.spells || []).map(squash);
  const items = (save?.stuff?.inventory || []).map(item => squash(item?.id));
  const source = key => (spells.some(id => id.includes(key)) ? "spell" : items.some(id => id.includes(key)) ? "scroll" : null);
  return { divine: source("divineintervention"), almsivi: source("almsiviintervention") };
}

/**
 * Which Travel options still hold what a loaded save set, to label them "from your save":
 * `mageGuild`, `conjurer` (when the save has a faction list) and each Intervention kind.
 * `fromSave` is { guild: guildFromSave(save), spells: interventionsFromSave(save) }; an
 * option the player has changed since is false. Empty without a save.
 */
export function saveMarks(fromSave, current = {}) {
  if (!fromSave) return {};
  const marks = {};
  if (fromSave.guild) {
    marks.mageGuild = Boolean(current.mageGuild) === Boolean(fromSave.guild.mageGuild);
    marks.conjurer = Boolean(current.conjurer) === Boolean(fromSave.guild.conjurer);
  }
  for (const kind of Object.keys(fromSave.spells || {})) {
    marks[kind] = Boolean(current.spells?.[kind]) === Boolean(fromSave.spells[kind]);
  }
  return marks;
}

/** The label beside a save-set Intervention box: a ticked scroll is spent on first use. */
export function interventionMarkText(source, ticked) {
  return ticked && source === "scroll" ? "from your save: a scroll, one use" : "from your save";
}

/** The Mages Guild rank of Conjurer, counting Associate as 0, as the Factions catalog does. */
export const CONJURER_RANK = 4;

/**
 * What a loaded save says about the guild guides: a member who has not been expelled
 * may use them, and from Conjurer the Tamriel Rebuilt long-distance network opens.
 * Null when the save has no faction list, so the page keeps its own settings.
 */
export function guildFromSave(save) {
  const factions = save?.progress?.factions;
  if (!Array.isArray(factions)) return null;
  const guild = factions.find(f => typeof f?.id === "string" && f.id.toLowerCase() === "mages guild");
  const member = Boolean(guild) && !guild.expelled && Number.isInteger(guild.rank) && guild.rank >= 0;
  return { mageGuild: member, conjurer: member && guild.rank >= CONJURER_RANK };
}

/**
 * What to tell a loaded save's character about the guild guides, or null. Every Guild
 * Guide belongs to the Mages Guild, whose Service Refusal lines turn away anyone outside
 * the faction (the "same faction" condition), so a character who is not a member cannot
 * use them. Null without a save's faction list (`saveGuild` from guildFromSave) or for a
 * member. `ticked` is the page's "Mages Guild member" box, which the player may override.
 */
export function guildGuideNotice(saveGuild, ticked) {
  if (!saveGuild || saveGuild.mageGuild) return null;
  return ticked
    ? "Your character is not in the Mages Guild, and Guild Guides teleport only members. Untick “Mages Guild member” to plan without them."
    : "Your character is not in the Mages Guild, so these routes leave out Guild Guides: they teleport only members, between Mages Guild halls. Join the guild to use them.";
}

const setting = (settings, name, fallback) => {
  const value = Number(settings?.[name]);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * The provider's disposition toward the player, from OpenMW 0.51.0's
 * getDerivedDisposition, for a provider with no faction and a player with no bounty,
 * no disease and no weapon drawn: base disposition, plus fDispRaceMod when you share a
 * race, plus fDispPersonalityMult × (your Personality − fDispPersonalityBase), truncated
 * and clamped to 0–100. Faction standing moves it further; the page says so.
 */
export function travelDisposition(barter, player = {}, settings = {}) {
  let x = Number.isFinite(barter?.disposition) ? barter.disposition : 50;
  const race = typeof barter?.race === "string" ? barter.race.toLowerCase() : null;
  const mine = (player.races || []).filter(r => typeof r === "string").map(r => r.toLowerCase());
  if (race && mine.includes(race)) x += setting(settings, "fDispRaceMod", 5);
  x += setting(settings, "fDispPersonalityMult", 0.5)
    * ((Number(player.personality) || 0) - setting(settings, "fDispPersonalityBase", 50));
  return Math.min(100, Math.max(0, Math.trunc(x)));
}

/**
 * What one journey costs this player, as OpenMW 0.51.0 charges it: the published base
 * price times one plus followers, at least 1, then getBarterOffer with both sides at
 * full fatigue. `player.disposition` overrides the estimate. Null when the release or
 * the provider carries no price.
 */
export function journeyGold(edge, player = {}, settings = {}) {
  if (edge?.free) return 0; // a spell or scroll the character already has
  if (!edge || !Number.isFinite(edge.price)) return null;
  const base = Math.max(1, edge.price * (1 + Math.max(0, Math.trunc(Number(player.followers) || 0))));
  const barter = edge.barter;
  if (!barter) return null;
  if (barter.haggles === false) return base;
  if (!barter.priceable) return null;
  const f = Math.fround;
  const fatigue = f(setting(settings, "fFatigueBase", 1.25));
  const disposition = Number.isFinite(player.disposition) ? player.disposition : travelDisposition(barter, player, settings);
  const a = f(Math.min(Number(player.mercantile) || 0, 100));
  const b = f(Math.min(f(0.1 * (Number(player.luck) || 0)), 10));
  const c = f(Math.min(f(0.2 * (Number(player.personality) || 0)), 10));
  const d = f(Math.min(barter.mercantile, 100));
  const e = f(Math.min(f(0.1 * barter.luck), 10));
  const g = f(Math.min(f(0.2 * barter.personality), 10));
  const pcTerm = f(f(disposition - 50 + a + b + c) * fatigue);
  const npcTerm = f(f(d + e + g) * fatigue);
  const buyTerm = f(0.01 * f(100 - f(0.5 * f(pcTerm - npcTerm))));
  return Math.max(1, Math.trunc(base * buyTerm));
}

export const ROUTE_OBJECTIVES = Object.freeze({
  hops: { label: "Fewest legs", order: ["legs", "gold", "hours"] },
  gold: { label: "Cheapest", order: ["gold", "legs", "hours"] },
  time: { label: "Fastest", order: ["hours", "legs", "gold"] },
  real: { label: "Least real time", order: ["movementSeconds", "transitions", "legs", "gold", "hours"] }
});

/**
 * The best route between two stops for one objective: fewest legs, least gold, or
 * fewest in-game hours, or estimated outdoor movement seconds. Real-time ties
 * prefer fewer transport/spell transitions; unknown movement is not zero time.
 * `goldOf(edge)`
 * prices a leg for this player; a leg with no known price or hours counts as zero
 * towards that total, and the route says its total is incomplete.
 * `resources` bounds legs carrying a resource ID and positive `uses`. States at
 * the same stop remain distinct when they retain different scrolls or Magicka.
 */
export function planRoute(start, destination, graph = {}, { objective = "hops", goldOf = () => null, resources = {} } = {}) {
  const empty = { isValid: false, hops: 0, path: [], steps: [], totals: null };
  if (!start || !destination) return { ...empty, message: "Choose an origin and destination." };
  // A city is a choice of starting/ending platforms, never a connection that can
  // be used halfway through a route. Seed those boundaries without phantom legs.
  const starts = [...new Set(Array.isArray(start) ? start : [start])].filter(id => typeof id === 'string' && graph[id]);
  const destinations = new Set((Array.isArray(destination) ? destination : [destination]).filter(id => typeof id === 'string' && graph[id]));
  if (!starts.length || !destinations.size) {
    return { ...empty, message: "One of the chosen stops is not in the active network." };
  }
  const zero = { gold: 0, hours: 0, goldKnown: true, hoursKnown: true };
  const already = starts.find(id => destinations.has(id));
  if (already) {
    return { isValid: true, hops: 0, path: [already], steps: [], totals: zero, message: "You are already there." };
  }
  const order = (ROUTE_OBJECTIVES[objective] || ROUTE_OBJECTIVES.hops).order;
  const vector = state => order.map(key => state[key]);
  const better = (x, y) => {
    const a = vector(x), b = vector(y);
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  };
  const budgets = Object.entries(resources || {}).filter(([, count]) => Number.isFinite(count) && count >= 0);
  const resourceIndex = new Map(budgets.map(([key], index) => [key, index]));
  const stateKey = (stop, spent) => JSON.stringify([stop, spent]);
  const unused = budgets.map(() => 0);
  const best = new Map(starts.map(stop => [stateKey(stop, unused),
    { stop, spent: unused, legs: 0, movementSeconds: 0, transitions: 0, ...zero, prev: null, edge: null }]));
  const done = new Set();
  // More than one state may reach a stop: a longer path can retain the scroll
  // needed later. A cheaper state dominates only if it spent no more resources.
  const dominates = (a, b) => !better(b, a) && a.spent.every((spent, index) => spent <= b.spent[index]);
  let last = null;
  for (;;) {
    let current = null;
    for (const [key, state] of best) {
      if (!done.has(key) && (current === null || better(state, best.get(current)) ||
          (!better(best.get(current), state) && key < current))) current = key;
    }
    if (current === null) break;
    const here = best.get(current);
    if (destinations.has(here.stop)) { last = current; break; }
    done.add(current);
    for (const edge of graph[here.stop] || []) {
      const spent = [...here.spent];
      let remaining = null;
      if (edge.resource) {
        const index = resourceIndex.get(edge.resource);
        if (index === undefined || !Number.isFinite(edge.uses) || edge.uses <= 0) continue;
        spent[index] += edge.uses;
        if (spent[index] > budgets[index][1]) continue;
        remaining = budgets[index][1] - spent[index];
      }
      const gold = goldOf(edge);
      const hours = Number.isFinite(edge.hours) ? edge.hours : null;
      const next = {
        stop: edge.to, spent, legs: here.legs + 1,
        movementSeconds: here.movementSeconds + (edge.walk && !edge.indoors
          ? Number.isFinite(edge.movementSeconds) && edge.movementSeconds >= 0 ? edge.movementSeconds : Infinity
          : 0),
        transitions: here.transitions + (!edge.walk && !edge.indoors ? 1 : 0),
        gold: here.gold + (Number.isFinite(gold) ? gold : 0),
        hours: here.hours + (hours ?? 0),
        goldKnown: here.goldKnown && Number.isFinite(gold),
        hoursKnown: here.hoursKnown && hours !== null,
        prev: current, edge: { ...edge, gold: Number.isFinite(gold) ? gold : null, ...(edge.resource ? { remaining } : {}) }
      };
      const key = stateKey(edge.to, spent);
      if (done.has(key)) continue;
      if ([...best.values()].some(state => state.stop === edge.to && dominates(state, next))) continue;
      const seen = best.get(key);
      if (!seen || better(next, seen)) best.set(key, next);
    }
  }
  if (last === null) return { ...empty, message: "No route available between these locations with these options and remaining uses." };
  const end = best.get(last);
  const legs = [];
  for (let key = last; best.get(key).prev !== null; key = best.get(key).prev) {
    const state = best.get(key);
    legs.unshift({ from: best.get(state.prev).stop, ...state.edge });
  }
  const steps = legs.map((leg, i) => ({
    stepNumber: i + 1, from: leg.from, to: leg.to, kind: leg.kind,
    gold: leg.gold, hours: Number.isFinite(leg.hours) ? leg.hours : null,
    board: leg.board || null, alight: leg.alight || null,
    providerName: leg.providerName || null,
    spell: leg.spell || null, ambiguous: Boolean(leg.ambiguous),
    walk: Boolean(leg.walk), distance: Number.isFinite(leg.distance) ? leg.distance : null,
    ...(leg.walk ? { movementSeconds: Number.isFinite(leg.movementSeconds) && leg.movementSeconds >= 0 ? leg.movementSeconds : null } : {}),
    ...(leg.walk && Number.isFinite(leg.walkingSeconds) && Number.isFinite(leg.swimmingSeconds)
      ? { walkingSeconds: leg.walkingSeconds, swimmingSeconds: leg.swimmingSeconds } : {}),
    direction: leg.direction || null,
    // A walk over the walkable grid: its straight-line distance and how much of it is swum.
    terrain: Boolean(leg.terrain),
    straight: Number.isFinite(leg.straight) ? leg.straight : null,
    water: Number.isFinite(leg.water) ? leg.water : null,
    // Through the doors of rooms with no way outside: the rooms passed, first to last.
    indoors: Boolean(leg.indoors), doors: Array.isArray(leg.doors) ? leg.doors : null,
    // Flown with Levitate, or across water walked with Water Walking.
    levitate: Boolean(leg.levitate), waterWalk: Boolean(leg.waterWalk),
    teleport: leg.teleport || null, label: leg.label || null,
    questGated: Boolean(leg.questGated), conditions: leg.conditions || null,
    ...(leg.resource ? { resource: leg.resource, uses: leg.uses, remaining: leg.remaining, scroll: Boolean(leg.scroll) } : {}),
    ...(Number.isFinite(leg.castChance) ? { castChance: leg.castChance } : {})
  }));
  return {
    isValid: true, hops: steps.length,
    path: [steps[0].from, ...steps.map(step => step.to)], steps,
    totals: { gold: end.gold, hours: end.hours, goldKnown: end.goldKnown, hoursKnown: end.hoursKnown },
    message: `${steps.length} ${steps.length === 1 ? "hop" : "hops"}`
  };
}

export function buildNetworkGraph(world = "vanilla", customGraph = null) {
  if (customGraph) {
    return customGraph;
  }
  const isTr = world === "tr";
  const graph = {};

  for (const [from, edges] of Object.entries(RAW_GRAPH)) {
    if (!isTr && !VANILLA_STOPS.has(from)) continue;

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (!isTr && !VANILLA_STOPS.has(e.to)) continue;

      const service = e.service || "";
      if (!isTr && service === "t_mw_riverstriderservice") continue;

      if (!graph[from]) graph[from] = [];
      graph[from].push({
        to: e.to,
        kind: SERVICE_LABELS[service] || service
      });

      if (!graph[e.to]) graph[e.to] = [];
    }
  }

  return graph;
}

export function getAvailableTransitStops(world = "vanilla", customGraph = null) {
  const graph = buildNetworkGraph(world, customGraph);
  return Object.keys(graph).sort();
}

/**
 * Breadth-first search for fewest transit hops, with no fares. The home page's example
 * route uses it; the travel workstation plans with planRoute.
 */
export function findFewestHopsRoute(start, destination, world = "vanilla", customGraph = null) {
  if (!start || !destination) {
    return { isValid: false, hops: 0, path: [], steps: [], message: "Choose an origin and destination." };
  }
  if (start === destination) {
    return { isValid: true, hops: 0, path: [start], steps: [], message: "You are already there." };
  }

  const graph = buildNetworkGraph(world, customGraph);
  if (!graph[start] || !graph[destination]) {
    return { isValid: false, hops: 0, path: [], steps: [], message: "One of the chosen stops is not in the active network." };
  }

  const queue = [[start]];
  const seen = new Set([start]);
  const via = new Map();

  while (queue.length > 0) {
    const path = queue.shift();
    const cur = path[path.length - 1];
    const edges = graph[cur] || [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);

      via.set(`${cur}->${edge.to}`, edge.kind);
      const nextPath = [...path, edge.to];

      if (edge.to === destination) {
        const steps = [];
        for (let j = 0; j < nextPath.length - 1; j++) {
          const fromNode = nextPath[j];
          const toNode = nextPath[j + 1];
          const kind = via.get(`${fromNode}->${toNode}`) || "Transport";
          steps.push({
            stepNumber: j + 1,
            from: fromNode,
            to: toNode,
            kind
          });
        }
        return {
          isValid: true,
          hops: steps.length,
          path: nextPath,
          steps,
          message: `${steps.length} ${steps.length === 1 ? "hop" : "hops"}`
        };
      }

      queue.push(nextPath);
    }
  }

  return {
    isValid: false,
    hops: 0,
    path: [],
    steps: [],
    message: "No fast-travel transit route available between these locations."
  };
}
