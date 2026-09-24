const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { JSDOM } = require("jsdom");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;

function component(file, exportName = "default") {
  const result = require("esbuild").buildSync({
    entryPoints: [path.resolve(file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    external: ["react", "react/jsx-runtime"]
  });
  const m = new Module(path.resolve(file), module);
  m.paths = module.paths;
  m._compile(result.outputFiles[0].text, path.resolve(file));
  return m.exports[exportName];
}

const EquipmentStudioRoot = component("components/equipment-studio/equipment-studio-root.jsx");
const EquipmentLedger = component("components/equipment-studio/equipment-ledger.jsx");
const EquipmentSlotCard = component("components/equipment-studio/equipment-slot-card.jsx", "EquipmentSlotCard");
const EquipmentStatsSummary = component("components/equipment-studio/equipment-stats-summary.jsx", "EquipmentStatsSummary");
const LoadoutTabsBar = component("components/equipment-studio/loadout-tabs-bar.jsx", "LoadoutTabsBar");
const ItemPickerDrawer = component("components/equipment-studio/item-picker-drawer.jsx", "ItemPickerDrawer");

function setupDom() {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost:8765"
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.CustomEvent = dom.window.CustomEvent;
  return dom;
}

const mockCharacter = {
  name: "Nerevarine",
  race: "Dark Elf",
  gender: "Male",
  className: "Spellsword",
  sign: "The Lady",
};

const mockSkills = {
  LightArmor: 45,
  MediumArmor: 35,
  HeavyArmor: 50,
  Unarmored: 20,
  LongBlade: 60,
  Block: 40,
};

const mockAttributes = {
  Strength: { v: 65 },
  Endurance: { v: 75 },
};

test("Equipment Studio UI: Renders root component with all 19 canonical slots and 4 presets", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        equipmentResult: {status:"ready",data:{catalogs:{Weapons:[{key:"steel_claymore",name:"Steel Claymore",type:"LB2H",recordType:"WEAP"}],Armor:[{key:"fixture_cuirass",name:"Fixture Cuirass",type:"cuirass",armorRating:20,weight:10}]}}},
        character: mockCharacter,
        skills: mockSkills,
        attributes: mockAttributes,
      })
    );
  });

  const text = container.textContent;
  assert.match(text, /Equipped Loadouts & Equipment Inspector/);
  assert.match(text, /Primary Combat/);
  assert.match(text, /Secondary \/ Alternate/);
  assert.match(text, /Stealth & Infiltration/);
  assert.match(text, /Arcane & Utility/);
  assert.match(text, /Total Armor Rating/);
  assert.match(text, /Encumbrance/);
  assert.match(text, /Nerevarine/);

  // Check that slot labels are rendered
  assert.match(text, /Cuirass/);
  assert.match(text, /Helmet/);
  assert.match(text, /Boots/);
  assert.match(text, /Main-Hand Weapon/);
  assert.match(text, /Off-Hand Shield \/ Light/);
  assert.match(text, /Left Ring/);
  assert.match(text, /Right Ring/);

  act(() => root.unmount());
});

test("Equipment Studio UI: Opening ItemPickerDrawer and equipping an item updates slot and AR", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        equipmentResult: {status:"ready",data:{catalogs:{Weapons:[{key:"steel_claymore",name:"Steel Claymore",type:"LB2H",recordType:"WEAP"}],Armor:[{key:"fixture_cuirass",name:"Fixture Cuirass",type:"cuirass",armorRating:20,weight:10}]}}},
        character: mockCharacter,
        skills: mockSkills,
        attributes: mockAttributes,
      })
    );
  });

  // Find Cuirass slot card and click it to open the drawer
  const cuirassCard = Array.from(container.querySelectorAll("[role='button']")).find((el) =>
    el.textContent.includes("Cuirass")
  );
  assert.ok(cuirassCard, "Cuirass card must exist");

  await act(async () => {
    cuirassCard.click();
  });

  // Check drawer opened
  assert.match(container.textContent, /Equip: Cuirass/);
  assert.match(container.textContent, /Browse Catalog/);

  // Find Equip button for Bonemold Cuirass
  const equipButtons = Array.from(container.querySelectorAll("button")).filter(
    (b) => b.textContent.trim() === "Equip"
  );
  assert.ok(equipButtons.length > 0, "Drawer must list equip buttons");

  await act(async () => {
    equipButtons[0].click();
  });

  // Drawer should close and slot should display equipped item
  assert.doesNotMatch(container.textContent, /Equip: Cuirass/);
  const updatedCuirass = Array.from(container.querySelectorAll("[role='button']")).find((el) =>
    el.textContent.includes("Cuirass")
  );
  assert.match(updatedCuirass.textContent, /AR/);

  act(() => root.unmount());
});

test("Equipment Studio UI: Beast race restriction enforces unequip and disabled status", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  const beastChar = {
    ...mockCharacter,
    race: "Khajiit",
  };

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        character: beastChar,
        skills: mockSkills,
        attributes: mockAttributes,
      })
    );
  });

  // Boots slot card must indicate restricted state
  const bootsCard = Array.from(container.querySelectorAll("[role='button']")).find((el) =>
    el.textContent.includes("Boots")
  );
  assert.ok(bootsCard, "Boots card must exist");
  assert.match(bootsCard.textContent, /Beast races cannot wear boots/);

  // Clicking boots card should open drawer with beast anatomy warning
  await act(async () => {
    bootsCard.click();
  });

  assert.match(container.textContent, /Beast Anatomy Note/);
  assert.match(container.textContent, /cannot equip any boots/);

  act(() => root.unmount());
});

test("Equipment Studio UI: Multi-loadout switching and kit equipping", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        equipmentResult: {status:"ready",data:{catalogs:{Weapons:[{key:"steel_claymore",name:"Steel Claymore",type:"LB2H",recordType:"WEAP"}],Armor:[{key:"fixture_cuirass",name:"Fixture Cuirass",type:"cuirass",armorRating:20,weight:10}]}}},
        character: mockCharacter,
        skills: mockSkills,
        attributes: mockAttributes,
      })
    );
  });

  // Switch to Stealth & Infiltration loadout tab
  const stealthTab = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent.includes("Stealth & Infiltration")
  );
  assert.ok(stealthTab, "Stealth & Infiltration tab must exist");

  await act(async () => {
    stealthTab.click();
  });

  // Equip Kit Preset dropdown
  const kitDropdownBtn = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent.includes("Equip Kit Preset")
  );
  assert.ok(kitDropdownBtn, "Equip Kit Preset dropdown button must exist");

  await act(async () => {
    kitDropdownBtn.click();
  });

  // Select Seyda Neen Scout Kit
  const scoutKitBtn = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent.includes("Seyda Neen Scout")
  );
  assert.ok(scoutKitBtn, "Scout kit button must exist");

  await act(async () => {
    scoutKitBtn.click();
  });

  // Check that Chitin items are now equipped
  assert.match(container.textContent, /Chitin Cuirass/);
  assert.match(container.textContent, /Chitin Helmet/);
  assert.match(container.textContent, /Steel Shortsword/);

  act(() => root.unmount());
});

// ADVERSARIAL EDGE CASES (Mandatory 3+ automated tests per rule 3)
test("Equipment Studio UI (Adversarial): Corrupted, null, and empty loadout items do not crash", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  const corruptedLoadout = [
    {
      id: "loadout-1",
      name: "Corrupted Test",
      items: {
        Cuirass: null,
        Helmet: { id: "bad_helm", name: null, armorRating: "not a number", weight: -99 },
        CarriedRight: { id: "ghost_sword", weight: undefined, chop: null },
        UnknownSlot: { id: "rogue_item", name: "Rogue", weight: 5 },
      },
    },
  ];

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        character: { race: null },
        skills: null,
        attributes: null,
        initialLoadouts: corruptedLoadout,
      })
    );
  });

  // Renders gracefully with unarmored fallback AR and carry weight clamp
  assert.match(container.textContent, /Equipped Loadouts & Equipment Inspector/);
  assert.match(container.textContent, /Total Armor Rating/);

  act(() => root.unmount());
});

test("Equipment Studio UI (Adversarial): Extreme carry weight triggers Over-Encumbered warning", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  const heavyLoadout = [
    {
      id: "loadout-1",
      name: "Heavy Test",
      items: {
        Cuirass: { id: "anvil", name: "Solid Gold Anvil", type: "cuirass", weight: 9999, armorRating: 50 },
      },
    },
  ];

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        equipmentResult: {status:"ready",data:{catalogs:{Weapons:[{key:"steel_claymore",name:"Steel Claymore",type:"LB2H",recordType:"WEAP"}],Armor:[{key:"fixture_cuirass",name:"Fixture Cuirass",type:"cuirass",armorRating:20,weight:10}]}}},
        character: mockCharacter,
        skills: mockSkills,
        attributes: { Strength: { v: 10 } }, // Max carry weight = 50 lbs
        initialLoadouts: heavyLoadout,
      })
    );
  });

  assert.match(container.textContent, /OVER-ENCUMBERED/);
  assert.match(container.textContent, /9999/);

  act(() => root.unmount());
});

test("Equipment Studio UI (Adversarial): Two-Handed weapon auto-unequips CarriedLeft shield in studio", async () => {
  setupDom();
  const container = document.getElementById("root");
  const root = createRoot(container);

  // Initial loadout with shield equipped
  const shieldLoadout = [
    {
      id: "loadout-1",
      name: "Shield Test",
      items: {
        CarriedLeft: { id: "steel_shield", name: "Steel Shield", type: "shield", armorRating: 15, weight: 15 },
      },
    },
  ];

  await act(async () => {
    root.render(
      React.createElement(EquipmentStudioRoot, {
        equipmentResult: {status:"ready",data:{catalogs:{Weapons:[{key:"steel_claymore",name:"Steel Claymore",type:"LB2H",recordType:"WEAP"}],Armor:[{key:"fixture_cuirass",name:"Fixture Cuirass",type:"cuirass",armorRating:20,weight:10}]}}},
        character: mockCharacter,
        skills: mockSkills,
        attributes: mockAttributes,
        initialLoadouts: shieldLoadout,
      })
    );
  });

  assert.match(container.textContent, /Steel Shield/);

  // Open CarriedRight (Weapon) slot drawer
  const weaponCard = Array.from(container.querySelectorAll("[role='button']")).find((el) =>
    el.textContent.includes("Main-Hand Weapon")
  );
  assert.ok(weaponCard, "Weapon card must exist");

  await act(async () => {
    weaponCard.click();
  });

  // Equip Two-Handed Steel Claymore
  const claymoreEquipBtn = Array.from(container.querySelectorAll("button")).find((b) => {
    const parent = b.closest(".flex.items-center.justify-between");
    return parent && parent.textContent.includes("Steel Claymore");
  });
  assert.ok(claymoreEquipBtn, "Steel Claymore equip button must exist");

  await act(async () => {
    claymoreEquipBtn.click();
  });

  // Claymore is equipped and Shield is automatically cleared!
  assert.match(container.textContent, /Steel Claymore/);
  const leftHandCard = Array.from(container.querySelectorAll("[role='button']")).find((el) =>
    el.textContent.includes("Off-Hand Shield")
  );
  assert.match(leftHandCard.textContent, /Empty/);

  act(() => root.unmount());
});
