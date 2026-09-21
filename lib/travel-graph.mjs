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

export function adaptTravelGraph(records = [], nodes = {}) {
  const graph = {};
  const cleanStopName = (cellKey) => {
    const node = nodes[cellKey];
    if (!node || !node.name) return null;
    let n = node.name;
    if (/, Guild of Mages/i.test(n) || /, Wolverine Hall/i.test(n)) {
      n = n.replace(/, Guild of Mages.*$/i, '').replace(/, Wolverine Hall.*$/i, '');
    } else if (/^Vivec, /i.test(n)) {
      n = "Vivec";
    }
    return n.trim();
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const from = cleanStopName(record.from);
    const to = cleanStopName(record.to);
    if (!from || !to || from === to) continue;

    let modeLabel = "Boat";
    if (record.mode === "silt_strider") modeLabel = "Silt Strider";
    else if (record.mode === "guild_guide") modeLabel = "Guild Guide";
    else if (record.mode === "gondola") modeLabel = "Gondolier";
    else if (record.mode === "riverstrider" || record.mode === "t_mw_riverstriderservice") modeLabel = "River Strider";
    else if (SERVICE_LABELS[record.mode]) modeLabel = SERVICE_LABELS[record.mode];

    if (!graph[from]) graph[from] = [];
    if (!graph[from].some(e => e.to === to && e.kind === modeLabel)) {
      graph[from].push({ to, kind: modeLabel });
    }
    if (!graph[to]) graph[to] = [];
  }
  return graph;
}

export function buildNetworkGraph(world = "vanilla", customGraph = null) {
  if (customGraph && Object.keys(customGraph).length > 0) {
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
 * Breadth-First Search for fewest transit hops.
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
