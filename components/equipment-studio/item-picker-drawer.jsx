"use client";
import { memo, useState, useMemo } from "react";
import {
  SLOT_DISPLAY_NAMES,
  getEffectiveArmorCategory,
  isBeastRace,
  isClosedHelmet,
  TWO_HANDED_WEAPON_TYPES,
} from "../../lib/equipment-math.mjs";

/**
 * Embedded Baseline Items Catalog for immediate responsiveness across all slots
 */
const BASELINE_SLOT_ITEMS = {
  Helmet: [
    { id: "colovian_fur_helm", name: "Colovian Fur Helm", type: "helmet", armorRating: 5, weight: 2, value: 8 },
    { id: "chitin_helmet", name: "Chitin Helmet", type: "helmet", armorRating: 10, weight: 2, value: 25 },
    { id: "iron_helmet", name: "Iron Helmet", type: "helmet", armorRating: 10, weight: 5, value: 30, bodyParts: [{ slot: 0 }] },
    { id: "bonemold_helm", name: "Bonemold Helm", type: "helmet", armorRating: 16, weight: 5, value: 50 },
    { id: "steel_helmet", name: "Steel Helmet", type: "helmet", armorRating: 15, weight: 5, value: 60, bodyParts: [{ slot: 0 }] },
    { id: "glass_helm", name: "Glass Helm", type: "helmet", armorRating: 50, weight: 4.5, value: 12000, bodyParts: [{ slot: 0 }] },
    { id: "ebony_closed_helm", name: "Ebony Closed Helm", type: "helmet", armorRating: 60, weight: 10, value: 15000, bodyParts: [{ slot: 0 }] },
    { id: "daedric_helm", name: "Daedric Face of Inspiration", type: "helmet", armorRating: 80, weight: 15, value: 20000, bodyParts: [{ slot: 0 }] },
  ],
  Cuirass: [
    { id: "netch_cuirass", name: "Netch Leather Cuirass", type: "cuirass", armorRating: 5, weight: 6, value: 35 },
    { id: "chitin_cuirass", name: "Chitin Cuirass", type: "cuirass", armorRating: 10, weight: 9, value: 70 },
    { id: "iron_cuirass", name: "Iron Cuirass", type: "cuirass", armorRating: 10, weight: 30, value: 70 },
    { id: "bonemold_cuirass", name: "Bonemold Cuirass", type: "cuirass", armorRating: 16, weight: 24, value: 350 },
    { id: "steel_cuirass", name: "Steel Cuirass", type: "cuirass", armorRating: 15, weight: 32, value: 150 },
    { id: "indoril_cuirass", name: "Indoril Cuirass", type: "cuirass", armorRating: 45, weight: 21, value: 2800 },
    { id: "glass_cuirass", name: "Glass Cuirass", type: "cuirass", armorRating: 50, weight: 18, value: 28000 },
    { id: "ebony_cuirass", name: "Ebony Cuirass", type: "cuirass", armorRating: 60, weight: 60, value: 35000 },
    { id: "daedric_cuirass", name: "Daedric Cuirass", type: "cuirass", armorRating: 80, weight: 90, value: 70000 },
    { id: "savior_hide", name: "Cuirass of the Savior's Hide", type: "cuirass", armorRating: 80, weight: 15, value: 150000, enchantmentId: "savior_en" },
  ],
  LeftPauldron: [
    { id: "chitin_pauldron_left", name: "Chitin Left Pauldron", type: "left_pauldron", armorRating: 10, weight: 2, value: 14 },
    { id: "iron_pauldron_left", name: "Iron Left Pauldron", type: "left_pauldron", armorRating: 10, weight: 8, value: 14 },
    { id: "bonemold_pauldron_l", name: "Bonemold Left Pauldron", type: "left_pauldron", armorRating: 16, weight: 6, value: 60 },
    { id: "steel_pauldron_l", name: "Steel Left Pauldron", type: "left_pauldron", armorRating: 15, weight: 10, value: 30 },
    { id: "glass_pauldron_l", name: "Glass Left Pauldron", type: "left_pauldron", armorRating: 50, weight: 4.5, value: 9600 },
    { id: "daedric_pauldron_l", name: "Daedric Left Pauldron", type: "left_pauldron", armorRating: 80, weight: 30, value: 24000 },
  ],
  RightPauldron: [
    { id: "chitin_pauldron_right", name: "Chitin Right Pauldron", type: "right_pauldron", armorRating: 10, weight: 2, value: 14 },
    { id: "iron_pauldron_right", name: "Iron Right Pauldron", type: "right_pauldron", armorRating: 10, weight: 8, value: 14 },
    { id: "bonemold_pauldron_r", name: "Bonemold Right Pauldron", type: "right_pauldron", armorRating: 16, weight: 6, value: 60 },
    { id: "steel_pauldron_r", name: "Steel Right Pauldron", type: "right_pauldron", armorRating: 15, weight: 10, value: 30 },
    { id: "glass_pauldron_r", name: "Glass Right Pauldron", type: "right_pauldron", armorRating: 50, weight: 4.5, value: 9600 },
    { id: "daedric_pauldron_r", name: "Daedric Right Pauldron", type: "right_pauldron", armorRating: 80, weight: 30, value: 24000 },
  ],
  LeftGauntlet: [
    { id: "chitin_gauntlet_left", name: "Chitin Left Gauntlet", type: "left_gauntlet", armorRating: 10, weight: 1, value: 10 },
    { id: "iron_gauntlet_left", name: "Iron Left Gauntlet", type: "left_gauntlet", armorRating: 10, weight: 5, value: 10 },
    { id: "bonemold_gauntlet_l", name: "Bonemold Left Gauntlet", type: "left_gauntlet", armorRating: 16, weight: 4, value: 40 },
    { id: "steel_gauntlet_l", name: "Steel Left Gauntlet", type: "left_gauntlet", armorRating: 15, weight: 5, value: 20 },
    { id: "glass_gauntlet_l", name: "Glass Left Gauntlet", type: "left_gauntlet", armorRating: 50, weight: 2.5, value: 6000 },
    { id: "daedric_gauntlet_l", name: "Daedric Left Gauntlet", type: "left_gauntlet", armorRating: 80, weight: 15, value: 14000 },
    { id: "wraithguard", name: "Wraithguard", type: "right_gauntlet", armorRating: 100, weight: 15, value: 500000, enchantmentId: "wraithguard_en" },
  ],
  RightGauntlet: [
    { id: "chitin_gauntlet_right", name: "Chitin Right Gauntlet", type: "right_gauntlet", armorRating: 10, weight: 1, value: 10 },
    { id: "iron_gauntlet_right", name: "Iron Right Gauntlet", type: "right_gauntlet", armorRating: 10, weight: 5, value: 10 },
    { id: "bonemold_gauntlet_r", name: "Bonemold Right Gauntlet", type: "right_gauntlet", armorRating: 16, weight: 4, value: 40 },
    { id: "steel_gauntlet_r", name: "Steel Right Gauntlet", type: "right_gauntlet", armorRating: 15, weight: 5, value: 20 },
    { id: "glass_gauntlet_r", name: "Glass Right Gauntlet", type: "right_gauntlet", armorRating: 50, weight: 2.5, value: 6000 },
    { id: "daedric_gauntlet_r", name: "Daedric Right Gauntlet", type: "right_gauntlet", armorRating: 80, weight: 15, value: 14000 },
  ],
  Greaves: [
    { id: "chitin_greaves", name: "Chitin Greaves", type: "greaves", armorRating: 10, weight: 5, value: 50 },
    { id: "iron_greaves", name: "Iron Greaves", type: "greaves", armorRating: 10, weight: 16, value: 44 },
    { id: "bonemold_greaves", name: "Bonemold Greaves", type: "greaves", armorRating: 16, weight: 14, value: 220 },
    { id: "steel_greaves", name: "Steel Greaves", type: "greaves", armorRating: 15, weight: 16, value: 110 },
    { id: "glass_greaves", name: "Glass Greaves", type: "greaves", armorRating: 50, weight: 9, value: 18000 },
    { id: "daedric_greaves", name: "Daedric Greaves", type: "greaves", armorRating: 80, weight: 54, value: 44000 },
  ],
  Boots: [
    { id: "chitin_boots", name: "Chitin Boots", type: "boots", armorRating: 10, weight: 4, value: 25 },
    { id: "iron_boots", name: "Iron Boots", type: "boots", armorRating: 10, weight: 20, value: 20 },
    { id: "bonemold_boots", name: "Bonemold Boots", type: "boots", armorRating: 16, weight: 12, value: 120 },
    { id: "steel_boots", name: "Steel Boots", type: "boots", armorRating: 15, weight: 20, value: 50 },
    { id: "boots_of_blinding_speed", name: "Boots of Blinding Speed", type: "boots", armorRating: 5, weight: 8, value: 500, enchantmentId: "blinding_speed_en" },
    { id: "glass_boots", name: "Glass Boots", type: "boots", armorRating: 50, weight: 6, value: 8000 },
    { id: "daedric_boots", name: "Daedric Boots", type: "boots", armorRating: 80, weight: 60, value: 20000 },
  ],
  CarriedLeft: [
    { id: "chitin_shield", name: "Chitin Shield", type: "shield", armorRating: 10, weight: 3, value: 20 },
    { id: "iron_shield", name: "Iron Shield", type: "shield", armorRating: 10, weight: 12, value: 30 },
    { id: "bonemold_shield", name: "Bonemold Shield", type: "shield", armorRating: 16, weight: 9, value: 150 },
    { id: "steel_shield", name: "Steel Shield", type: "shield", armorRating: 15, weight: 15, value: 60 },
    { id: "glass_shield", name: "Glass Shield", type: "shield", armorRating: 50, weight: 7.5, value: 13600 },
    { id: "daedric_shield", name: "Daedric Shield", type: "shield", armorRating: 80, weight: 45, value: 34000 },
    { id: "eleidon_ward", name: "Eleidon's Ward", type: "shield", armorRating: 100, weight: 30, value: 200000, enchantmentId: "eleidon_en" },
  ],
  CarriedRight: [
    { id: "iron_dagger", name: "Iron Dagger", type: "SB1H", weight: 3, chop: { min: 4, max: 7 }, slash: { min: 4, max: 7 }, thrust: { min: 4, max: 8 }, speed: 2.0, reach: 1.0, recordType: "WEAP" },
    { id: "steel_shortsword", name: "Steel Shortsword", type: "SB1H", weight: 12, chop: { min: 2, max: 14 }, slash: { min: 2, max: 14 }, thrust: { min: 4, max: 18 }, speed: 1.8, reach: 1.0, recordType: "WEAP" },
    { id: "silver_longsword", name: "Silver Longsword", type: "LB1H", weight: 18, chop: { min: 2, max: 20 }, slash: { min: 2, max: 18 }, thrust: { min: 2, max: 20 }, speed: 1.35, reach: 1.0, recordType: "WEAP" },
    { id: "steel_claymore", name: "Steel Claymore", type: "LB2H", weight: 32, chop: { min: 2, max: 28 }, slash: { min: 2, max: 26 }, thrust: { min: 2, max: 18 }, speed: 1.25, reach: 1.0, recordType: "WEAP" },
    { id: "iron_warhammer", name: "Iron Warhammer", type: "BL2C", weight: 32, chop: { min: 1, max: 28 }, slash: { min: 1, max: 24 }, thrust: { min: 1, max: 2 }, speed: 1.0, reach: 1.5, recordType: "WEAP" },
    { id: "steel_battleaxe", name: "Steel Battleaxe", type: "AX2H", weight: 24, chop: { min: 2, max: 32 }, slash: { min: 2, max: 26 }, thrust: { min: 1, max: 4 }, speed: 1.0, reach: 1.0, recordType: "WEAP" },
    { id: "iron_spear", name: "Iron Spear", type: "SP2H", weight: 18, chop: { min: 1, max: 5 }, slash: { min: 1, max: 5 }, thrust: { min: 5, max: 15 }, speed: 1.0, reach: 1.8, recordType: "WEAP" },
    { id: "chitin_bow", name: "Chitin Short Bow", type: "BOW", weight: 2, chop: { min: 1, max: 15 }, slash: { min: 0, max: 1 }, thrust: { min: 0, max: 1 }, speed: 1.0, reach: 1.0, recordType: "WEAP" },
    { id: "daedric_crescent", name: "Daedric Crescent", type: "LB2H", weight: 35, chop: { min: 20, max: 50 }, slash: { min: 20, max: 50 }, thrust: { min: 20, max: 40 }, speed: 1.25, reach: 1.2, recordType: "WEAP" },
    { id: "trueflame", name: "Trueflame", type: "LB1H", weight: 15, chop: { min: 5, max: 45 }, slash: { min: 15, max: 45 }, thrust: { min: 10, max: 30 }, speed: 1.5, reach: 1.0, recordType: "WEAP" },
  ],
  Ammunition: [
    { id: "iron_arrow", name: "Iron Arrow", type: "arrow", weight: 0.1, chop: { min: 1, max: 3 }, count: 50 },
    { id: "steel_arrow", name: "Steel Arrow", type: "arrow", weight: 0.1, chop: { min: 1, max: 5 }, count: 50 },
    { id: "bonemold_arrow", name: "Bonemold Arrow", type: "arrow", weight: 0.15, chop: { min: 1, max: 4 }, count: 50 },
    { id: "silver_arrow", name: "Silver Arrow", type: "arrow", weight: 0.1, chop: { min: 1, max: 6 }, count: 50 },
    { id: "ebony_arrow", name: "Ebony Arrow", type: "arrow", weight: 0.2, chop: { min: 2, max: 10 }, count: 50 },
  ],
  Robe: [
    { id: "common_robe_01", name: "Common Robe", type: "robe", weight: 3, value: 5 },
    { id: "expensive_robe_01", name: "Expensive Robe", type: "robe", weight: 4, value: 40 },
    { id: "exquisite_robe", name: "Exquisite Robe", type: "robe", weight: 5, value: 120, enchantp: 400 },
    { id: "robe_of_drake_pride", name: "Robe of the Drake's Pride", type: "robe", weight: 2, value: 12000, enchantmentId: "drake_pride_en" },
  ],
  Shirt: [
    { id: "common_shirt_01", name: "Common Shirt", type: "shirt", weight: 2, value: 2 },
    { id: "expensive_shirt_01", name: "Expensive Shirt", type: "shirt", weight: 2.5, value: 20 },
    { id: "exquisite_shirt", name: "Exquisite Shirt", type: "shirt", weight: 3, value: 60, enchantp: 600 },
  ],
  Pants: [
    { id: "common_pants_01", name: "Common Pants", type: "pants", weight: 2, value: 2 },
    { id: "expensive_pants_01", name: "Expensive Pants", type: "pants", weight: 2.5, value: 20 },
    { id: "exquisite_pants", name: "Exquisite Pants", type: "pants", weight: 3, value: 60, enchantp: 600 },
  ],
  Skirt: [
    { id: "common_skirt_01", name: "Common Skirt", type: "skirt", weight: 1.5, value: 2 },
    { id: "exquisite_skirt", name: "Exquisite Skirt", type: "skirt", weight: 2, value: 60, enchantp: 600 },
  ],
  LeftRing: [
    { id: "common_ring_01", name: "Common Ring", type: "ring", weight: 0.1, value: 4 },
    { id: "exquisite_ring", name: "Exquisite Ring", type: "ring", weight: 0.1, value: 120, enchantp: 1200 },
    { id: "ring_of_phynaster", name: "Ring of Phynaster", type: "ring", weight: 0.1, value: 18000, enchantmentId: "phynaster_en" },
    { id: "ring_of_wind", name: "Ring of the Wind", type: "ring", weight: 0.1, value: 22000, enchantmentId: "wind_en" },
  ],
  RightRing: [
    { id: "common_ring_02", name: "Common Brass Ring", type: "ring", weight: 0.1, value: 4 },
    { id: "exquisite_ring_2", name: "Exquisite Gold Ring", type: "ring", weight: 0.1, value: 120, enchantp: 1200 },
    { id: "marara_ring", name: "Marara's Ring", type: "ring", weight: 0.1, value: 22000, enchantmentId: "marara_en" },
    { id: "vampiric_ring", name: "Vampiric Ring", type: "ring", weight: 0.1, value: 32000, enchantmentId: "vampiric_en" },
  ],
  Amulet: [
    { id: "common_amulet_01", name: "Common Amulet", type: "amulet", weight: 0.5, value: 5 },
    { id: "exquisite_amulet", name: "Exquisite Amulet", type: "amulet", weight: 1.0, value: 240, enchantp: 1200 },
    { id: "necromancers_amulet", name: "Necromancer's Amulet", type: "amulet", weight: 1.0, value: 24000, enchantmentId: "necro_amulet_en" },
  ],
  Belt: [
    { id: "common_belt_01", name: "Common Belt", type: "belt", weight: 1.0, value: 3 },
    { id: "exquisite_belt", name: "Exquisite Belt", type: "belt", weight: 1.0, value: 40, enchantp: 400 },
    { id: "belt_of_northern_knack", name: "Belt of Northern Knack", type: "belt", weight: 1.0, value: 800, enchantmentId: "northern_knack_en" },
  ],
};

/**
 * Item Selection and Custom Item Creation Drawer
 */
export const ItemPickerDrawer = memo(function ItemPickerDrawer({
  slot,
  race = "",
  currentLoadout = {},
  onEquipItem,
  onUnequipSlot,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "custom"
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Custom Item Form State
  const [customName, setCustomName] = useState("");
  const [customAR, setCustomAR] = useState(20);
  const [customWeight, setCustomWeight] = useState(10);
  const [customType, setCustomType] = useState(
    slot === "CarriedRight" ? "LB1H" : slot === "CarriedLeft" ? "shield" : "cuirass"
  );

  const slotName = SLOT_DISPLAY_NAMES[slot] || slot;
  const isBeast = isBeastRace(race);
  const baselineList = BASELINE_SLOT_ITEMS[slot] || [];

  // Filter items
  const filteredItems = useMemo(() => {
    return baselineList.filter((item) => {
      // Beast restriction filter
      if (isBeast) {
        if (slot === "Boots") return false;
        if (slot === "Helmet" && isClosedHelmet(item)) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = String(item.name || "").toLowerCase().includes(q);
        const matchesId = String(item.id || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      // Category filter for armor
      if (categoryFilter !== "all") {
        const itemCat = getEffectiveArmorCategory(item);
        if (itemCat && itemCat !== categoryFilter) return false;
      }

      return true;
    });
  }, [baselineList, searchQuery, categoryFilter, isBeast, slot]);

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const item = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      type: customType,
      armorRating: Number(customAR) || 0,
      weight: Number(customWeight) || 0,
      isCustom: true,
      recordType: slot === "CarriedRight" ? "WEAP" : "ARMO",
    };

    onEquipItem(slot, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col p-6 space-y-4 text-sm"
        style={{
          border: "6px solid transparent",
          borderImage: "var(--mw-border) 6 repeat",
          background: "var(--surface, #14100a)",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.95), inset 0 0 12px 2px rgba(0, 0, 0, 0.9)",
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#2a2318] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#f3e6c8] flex items-center gap-2">
              <span>Equip: {slotName}</span>
            </h3>
            <p className="text-xs text-[#8c7853] mt-0.5">
              Select an authentic game item or forge a custom equipment record.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center mw-btn font-bold text-sm text-[#8c7853] hover:text-[#f3e6c8]"
            title="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Catalog vs Custom Builder */}
        <div className="flex items-center gap-2 border-b border-[#241c12] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`mw-btn px-4 py-1.5 font-serif text-xs font-bold ${
              activeTab === "catalog" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
          >
            Browse Catalog ({filteredItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`mw-btn px-4 py-1.5 font-serif text-xs font-bold ${
              activeTab === "custom" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
          >
            + Forge Custom Item
          </button>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                onUnequipSlot(slot);
                onClose();
              }}
              className="mw-btn px-3 py-1.5 font-serif text-xs font-bold text-[#a35e5e] hover:text-[#ff8888]"
            >
              Unequip Slot
            </button>
          </div>
        </div>

        {/* Content: Browse Catalog */}
        {activeTab === "catalog" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${slotName} items...`}
                className="mw-input flex-1 min-w-[180px] px-3 py-1.5 text-xs bg-[#0d0a06] border border-[#2e2316] text-[#f3e6c8] focus:border-[#d4b06a]"
              />

              {["Cuirass", "Helmet", "Greaves", "LeftPauldron", "RightPauldron", "LeftGauntlet", "RightGauntlet", "CarriedLeft"].includes(slot) && (
                <div className="flex items-center gap-1">
                  {["all", "light", "medium", "heavy"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`mw-btn px-2.5 py-1 text-[11px] font-serif uppercase ${
                        categoryFilter === cat ? "active" : ""
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Beast Race Warning Note */}
            {isBeast && (slot === "Boots" || slot === "Helmet") && (
              <div className="p-2.5 bg-[#251010] border border-[#552020] text-xs text-[#e89b9b]">
                <strong className="font-serif">Beast Anatomy Note: </strong>
                {slot === "Boots"
                  ? "Argonians and Khajiit cannot equip any boots or footwear."
                  : "Beast races cannot equip closed helmets that fully enclose the head and muzzle."}
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[350px]">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const armorCat = getEffectiveArmorCategory(item);
                  const is2H = TWO_HANDED_WEAPON_TYPES.has(String(item.type).toUpperCase());

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-[#120e09] border border-[#241c12] hover:border-[#4d3a24] hover:bg-[#1a140d] transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-xs text-[#f3e6c8]">
                            {item.name}
                          </span>
                          {armorCat && (
                            <span className="text-[9px] uppercase px-1 py-0.2 bg-[#1f180f] border border-[#3d2e1b] text-[#c4b998]">
                              {armorCat}
                            </span>
                          )}
                          {is2H && (
                            <span className="text-[9px] uppercase px-1 py-0.2 bg-[#2a1711] border border-[#542a1f] text-[#d48b6a]">
                              Two-Handed
                            </span>
                          )}
                          {item.enchantmentId && (
                            <span className="text-[10px] text-[#d4b06a]" title="Enchanted">
                              ✦
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-[#8c7853] mt-0.5 flex items-center gap-3">
                          {item.armorRating !== undefined && <span>AR: {item.armorRating}</span>}
                          {item.chop && <span>Chop: {item.chop.min}-{item.chop.max}</span>}
                          {item.weight !== undefined && <span>Weight: {item.weight}</span>}
                          {item.value !== undefined && <span>Value: {item.value} gp</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onEquipItem(slot, item);
                          onClose();
                        }}
                        className="mw-btn px-4 py-1.5 font-serif font-bold text-xs text-[#d4b06a] hover:text-[#ffffff] whitespace-nowrap"
                      >
                        Equip
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs font-serif italic text-[#6e5d3f]">
                  No items found matching your filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content: Forge Custom Item */}
        {activeTab === "custom" && (
          <form onSubmit={handleCreateCustom} className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs uppercase font-serif font-bold text-[#8c7853]">
                Item Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Custom Daedric Plate of Fortitude"
                required
                className="mw-input w-full px-3 py-2 text-xs bg-[#0d0a06] border border-[#2e2316] text-[#f3e6c8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase font-serif font-bold text-[#8c7853]">
                  {slot === "CarriedRight" ? "Max Strike Damage" : "Base Armor Rating"}
                </label>
                <input
                  type="number"
                  value={customAR}
                  onChange={(e) => setCustomAR(e.target.value)}
                  min="0"
                  max="1000"
                  className="mw-input w-full px-3 py-1.5 text-xs bg-[#0d0a06] border border-[#2e2316] text-[#f3e6c8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-serif font-bold text-[#8c7853]">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  min="0"
                  step="0.1"
                  className="mw-input w-full px-3 py-1.5 text-xs bg-[#0d0a06] border border-[#2e2316] text-[#f3e6c8]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mw-btn py-2.5 font-serif font-bold text-xs tracking-wide text-[#d4b06a]"
            >
              Forge &amp; Equip to {slotName}
            </button>
          </form>
        )}
      </div>
    </div>
  );
});

export default ItemPickerDrawer;
