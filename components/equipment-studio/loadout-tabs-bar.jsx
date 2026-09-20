"use client";
import { memo, useState } from "react";

/**
 * Curated Starter & Endgame Loadout Templates for quick equipping
 */
export const QUICK_LOADOUT_KITS = [
  {
    id: "kit-starter-light",
    name: "Seyda Neen Scout (Light)",
    description: "Chitin armor and steel shortblade suited for early agility and stealth.",
    items: {
      Helmet: { id: "chitin_helmet", name: "Chitin Helmet", type: "helmet", armorRating: 10, weight: 2 },
      Cuirass: { id: "chitin_cuirass", name: "Chitin Cuirass", type: "cuirass", armorRating: 10, weight: 9 },
      LeftPauldron: { id: "chitin_pauldron_left", name: "Chitin Left Pauldron", type: "left_pauldron", armorRating: 10, weight: 2 },
      RightPauldron: { id: "chitin_pauldron_right", name: "Chitin Right Pauldron", type: "right_pauldron", armorRating: 10, weight: 2 },
      LeftGauntlet: { id: "chitin_gauntlet_left", name: "Chitin Left Gauntlet", type: "left_gauntlet", armorRating: 10, weight: 1 },
      RightGauntlet: { id: "chitin_gauntlet_right", name: "Chitin Right Gauntlet", type: "right_gauntlet", armorRating: 10, weight: 1 },
      Greaves: { id: "chitin_greaves", name: "Chitin Greaves", type: "greaves", armorRating: 10, weight: 5 },
      Boots: { id: "chitin_boots", name: "Chitin Boots", type: "boots", armorRating: 10, weight: 4 },
      CarriedLeft: { id: "chitin_shield", name: "Chitin Shield", type: "shield", armorRating: 10, weight: 3 },
      CarriedRight: { id: "steel_shortsword", name: "Steel Shortsword", type: "SB1H", weight: 12, chop: { min: 2, max: 14 }, slash: { min: 2, max: 14 }, thrust: { min: 4, max: 18 }, speed: 1.8, reach: 1.0, recordType: "WEAP" },
    },
  },
  {
    id: "kit-starter-medium",
    name: "Dunmer Bonemold Warrior (Medium)",
    description: "Traditional Resdayn carapace plate with balanced defense.",
    items: {
      Helmet: { id: "bonemold_helm", name: "Bonemold Helm", type: "helmet", armorRating: 16, weight: 5 },
      Cuirass: { id: "bonemold_cuirass", name: "Bonemold Cuirass", type: "cuirass", armorRating: 16, weight: 24 },
      LeftPauldron: { id: "bonemold_pauldron_l", name: "Bonemold Left Pauldron", type: "left_pauldron", armorRating: 16, weight: 6 },
      RightPauldron: { id: "bonemold_pauldron_r", name: "Bonemold Right Pauldron", type: "right_pauldron", armorRating: 16, weight: 6 },
      LeftGauntlet: { id: "bonemold_gauntlet_l", name: "Bonemold Left Gauntlet", type: "left_gauntlet", armorRating: 16, weight: 4 },
      RightGauntlet: { id: "bonemold_gauntlet_r", name: "Bonemold Right Gauntlet", type: "right_gauntlet", armorRating: 16, weight: 4 },
      Greaves: { id: "bonemold_greaves", name: "Bonemold Greaves", type: "greaves", armorRating: 16, weight: 14 },
      Boots: { id: "bonemold_boots", name: "Bonemold Boots", type: "boots", armorRating: 16, weight: 12 },
      CarriedLeft: { id: "bonemold_shield", name: "Bonemold Shield", type: "shield", armorRating: 16, weight: 9 },
      CarriedRight: { id: "silver_longsword", name: "Silver Longsword", type: "LB1H", weight: 18, chop: { min: 2, max: 20 }, slash: { min: 2, max: 18 }, thrust: { min: 2, max: 20 }, speed: 1.35, reach: 1.0, recordType: "WEAP" },
    },
  },
  {
    id: "kit-starter-heavy",
    name: "Imperial Legionnaire (Heavy)",
    description: "Standard Cyrodiilic steel plate offering resilient physical protection.",
    items: {
      Helmet: { id: "steel_helmet", name: "Steel Helmet", type: "helmet", armorRating: 15, weight: 5 },
      Cuirass: { id: "steel_cuirass", name: "Steel Cuirass", type: "cuirass", armorRating: 15, weight: 32 },
      LeftPauldron: { id: "steel_pauldron_l", name: "Steel Left Pauldron", type: "left_pauldron", armorRating: 15, weight: 10 },
      RightPauldron: { id: "steel_pauldron_r", name: "Steel Right Pauldron", type: "right_pauldron", armorRating: 15, weight: 10 },
      LeftGauntlet: { id: "steel_gauntlet_l", name: "Steel Left Gauntlet", type: "left_gauntlet", armorRating: 15, weight: 5 },
      RightGauntlet: { id: "steel_gauntlet_r", name: "Steel Right Gauntlet", type: "right_gauntlet", armorRating: 15, weight: 5 },
      Greaves: { id: "steel_greaves", name: "Steel Greaves", type: "greaves", armorRating: 15, weight: 16 },
      Boots: { id: "steel_boots", name: "Steel Boots", type: "boots", armorRating: 15, weight: 20 },
      CarriedLeft: { id: "steel_shield", name: "Steel Shield", type: "shield", armorRating: 15, weight: 15 },
      CarriedRight: { id: "steel_broadsword", name: "Steel Broadsword", type: "LB1H", weight: 16, chop: { min: 2, max: 18 }, slash: { min: 2, max: 16 }, thrust: { min: 2, max: 16 }, speed: 1.3, reach: 1.0, recordType: "WEAP" },
    },
  },
  {
    id: "kit-endgame-daedric",
    name: "Daedric Champion (Endgame Heavy)",
    description: "Peak Vvardenfell defense forged in ebony and bound with Daedric spirits.",
    items: {
      Helmet: { id: "daedric_helm", name: "Daedric Face of Inspiration", type: "helmet", armorRating: 80, weight: 15 },
      Cuirass: { id: "daedric_cuirass", name: "Daedric Cuirass", type: "cuirass", armorRating: 80, weight: 90 },
      LeftPauldron: { id: "daedric_pauldron_l", name: "Daedric Left Pauldron", type: "left_pauldron", armorRating: 80, weight: 30 },
      RightPauldron: { id: "daedric_pauldron_r", name: "Daedric Right Pauldron", type: "right_pauldron", armorRating: 80, weight: 30 },
      LeftGauntlet: { id: "daedric_gauntlet_l", name: "Daedric Left Gauntlet", type: "left_gauntlet", armorRating: 80, weight: 15 },
      RightGauntlet: { id: "daedric_gauntlet_r", name: "Daedric Right Gauntlet", type: "right_gauntlet", armorRating: 80, weight: 15 },
      Greaves: { id: "daedric_greaves", name: "Daedric Greaves", type: "greaves", armorRating: 80, weight: 54 },
      Boots: { id: "daedric_boots", name: "Daedric Boots", type: "boots", armorRating: 80, weight: 60 },
      CarriedLeft: { id: "daedric_shield", name: "Daedric Shield", type: "shield", armorRating: 80, weight: 45 },
      CarriedRight: { id: "daedric_crescent", name: "Daedric Crescent", type: "LB2H", weight: 35, chop: { min: 20, max: 50 }, slash: { min: 20, max: 50 }, thrust: { min: 20, max: 40 }, speed: 1.25, reach: 1.2, recordType: "WEAP" },
    },
  },
];

/**
 * Loadout Selector and Multi-Preset Management Bar
 */
export const LoadoutTabsBar = memo(function LoadoutTabsBar({
  loadouts = [],
  activeLoadoutId,
  onSelectLoadout,
  onRenameLoadout,
  onCopyLoadout,
  onClearLoadout,
  onEquipKit,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [showKitMenu, setShowKitMenu] = useState(false);

  const startRename = (loadout) => {
    setEditingId(loadout.id);
    setEditingName(loadout.name);
  };

  const submitRename = () => {
    if (editingId && editingName.trim()) {
      onRenameLoadout(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="loadout-tabs-bar space-y-3">
      {/* Top Bar: Tabs & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2a2318] pb-3">
        {/* Preset Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {loadouts.map((loadout, index) => {
            const isActive = loadout.id === activeLoadoutId;
            const itemCount = Object.keys(loadout.items || {}).length;

            if (editingId === loadout.id) {
              return (
                <div key={loadout.id} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="mw-input px-2 py-1 text-xs font-serif font-bold text-[#f3e6c8] bg-[#120e09] border border-[#d4b06a]"
                  />
                  <button
                    type="button"
                    onClick={submitRename}
                    className="mw-btn px-2 py-1 text-xs font-bold"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="mw-btn px-2 py-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              );
            }

            return (
              <button
                key={loadout.id}
                type="button"
                onClick={() => onSelectLoadout(loadout.id)}
                className={`group flex items-center gap-2 px-3.5 py-2 text-xs font-serif font-bold tracking-wide transition-all mw-btn ${
                  isActive
                    ? "active ring-1 ring-[#d4b06a] text-[#ffffff]"
                    : "text-[#c4b998] hover:text-[#f3e6c8]"
                }`}
              >
                <span>{loadout.name}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 border ${
                    isActive
                      ? "bg-[#2b1f11] border-[#5c4728] text-[#d4b06a]"
                      : "bg-[#17120a] border-[#292014] text-[#8c7853]"
                  }`}
                >
                  {itemCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loadout Actions & Fast Kits */}
        <div className="flex items-center gap-2 relative">
          {/* Rename Active Loadout */}
          <button
            type="button"
            onClick={() => {
              const active = loadouts.find((l) => l.id === activeLoadoutId);
              if (active) startRename(active);
            }}
            className="mw-btn px-2.5 py-1.5 text-xs font-serif text-[#c4b998] hover:text-[#f3e6c8]"
            title="Rename current loadout"
          >
            Rename
          </button>

          {/* Duplicate to next slot */}
          <button
            type="button"
            onClick={() => onCopyLoadout(activeLoadoutId)}
            className="mw-btn px-2.5 py-1.5 text-xs font-serif text-[#c4b998] hover:text-[#f3e6c8]"
            title="Duplicate active loadout to next available slot"
          >
            Copy
          </button>

          {/* Clear Current Loadout */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to unequip all items in this loadout?")) {
                onClearLoadout(activeLoadoutId);
              }
            }}
            className="mw-btn px-2.5 py-1.5 text-xs font-serif text-[#a35e5e] hover:text-[#ff8888]"
            title="Clear all equipped items from this loadout"
          >
            Clear
          </button>

          {/* Fast Preset Kits Menu Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowKitMenu(!showKitMenu)}
              className="mw-btn px-3 py-1.5 text-xs font-serif font-bold text-[#d4b06a] hover:text-[#ffffff] flex items-center gap-1.5"
            >
              <span>Equip Kit Preset ▾</span>
            </button>

            {showKitMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 p-2 bg-[#14100b] border border-[#4a3924] shadow-2xl z-30 space-y-1"
                style={{
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.9), inset 0 0 8px 1px rgba(0, 0, 0, 0.8)",
                }}
              >
                <div className="text-[10px] uppercase font-serif font-bold text-[#8c7853] px-2 py-1 border-b border-[#241c12]">
                  Select Pre-Configured Kit
                </div>
                {QUICK_LOADOUT_KITS.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => {
                      onEquipKit(activeLoadoutId, kit.items);
                      setShowKitMenu(false);
                    }}
                    className="w-full p-2 text-left hover:bg-[#221a10] border border-transparent hover:border-[#423420] transition-colors group"
                  >
                    <div className="font-serif font-bold text-xs text-[#f3e6c8] group-hover:text-[#d4b06a]">
                      {kit.name}
                    </div>
                    <div className="text-[10px] text-[#8c7853] leading-snug mt-0.5">
                      {kit.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default LoadoutTabsBar;
