"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import PaperdollGrid from "./paperdoll-grid";
import EquipmentStatsSummary from "./equipment-stats-summary";
import LoadoutTabsBar from "./loadout-tabs-bar";
import ItemPickerDrawer from "./item-picker-drawer";
import {
  createDefaultLoadoutPresets,
  equipItem,
} from "../../lib/equipment-math.mjs";

/**
 * Root Paperdoll Studio & Equipped Loadout Inspector
 */
export default function EquipmentStudioRoot({
  character = {},
  skills = {},
  attributes = {},
  initialLoadouts = null,
  onLoadoutsChange = null,
}) {
  const [loadouts, setLoadouts] = useState(() => {
    if (initialLoadouts && Array.isArray(initialLoadouts) && initialLoadouts.length > 0) {
      return initialLoadouts;
    }
    return createDefaultLoadoutPresets();
  });

  const [activeLoadoutId, setActiveLoadoutId] = useState("loadout-1");
  const [activePickerSlot, setActivePickerSlot] = useState(null);

  // Active Loadout
  const activeLoadout = useMemo(() => {
    return loadouts.find((l) => l.id === activeLoadoutId) || loadouts[0];
  }, [loadouts, activeLoadoutId]);

  const activeItems = activeLoadout?.items || {};

  // Notify parent / update state helper
  const commitLoadouts = useCallback(
    (nextLoadouts) => {
      setLoadouts(nextLoadouts);
      if (typeof onLoadoutsChange === "function") {
        onLoadoutsChange(nextLoadouts);
      }
    },
    [onLoadoutsChange]
  );

  // Select Loadout
  const handleSelectLoadout = useCallback((id) => {
    setActiveLoadoutId(id);
  }, []);

  // Rename Loadout
  const handleRenameLoadout = useCallback(
    (id, newName) => {
      const next = loadouts.map((l) => (l.id === id ? { ...l, name: newName } : l));
      commitLoadouts(next);
    },
    [loadouts, commitLoadouts]
  );

  // Copy Loadout to next slot
  const handleCopyLoadout = useCallback(
    (sourceId) => {
      const source = loadouts.find((l) => l.id === sourceId);
      if (!source) return;

      // Find first other slot or duplicate into next available
      const otherIdx = loadouts.findIndex((l) => l.id !== sourceId);
      if (otherIdx !== -1) {
        const target = loadouts[otherIdx];
        const next = loadouts.map((l) =>
          l.id === target.id
            ? { ...l, items: { ...source.items }, name: `${source.name} (Copy)` }
            : l
        );
        commitLoadouts(next);
        setActiveLoadoutId(target.id);
      }
    },
    [loadouts, commitLoadouts]
  );

  // Clear Loadout
  const handleClearLoadout = useCallback(
    (id) => {
      const next = loadouts.map((l) => (l.id === id ? { ...l, items: {} } : l));
      commitLoadouts(next);
    },
    [loadouts, commitLoadouts]
  );

  // Equip Kit to Active Loadout
  const handleEquipKit = useCallback(
    (targetLoadoutId, kitItems) => {
      const next = loadouts.map((l) =>
        l.id === targetLoadoutId ? { ...l, items: { ...kitItems } } : l
      );
      commitLoadouts(next);
    },
    [loadouts, commitLoadouts]
  );

  // Listen for kit equipping events from Gear Advisor
  useEffect(() => {
    const handleKitEvent = (e) => {
      if (e.detail?.kitItems) {
        handleEquipKit(activeLoadoutId, e.detail.kitItems);
      }
    };
    window.addEventListener("silt-equip-kit", handleKitEvent);
    return () => window.removeEventListener("silt-equip-kit", handleKitEvent);
  }, [activeLoadoutId, handleEquipKit]);

  // Equip single item to slot
  const handleEquipItem = useCallback(
    (slot, item) => {
      const result = equipItem(activeItems, slot, item, { race: character.race });
      if (result.success) {
        const next = loadouts.map((l) =>
          l.id === activeLoadoutId ? { ...l, items: result.loadout } : l
        );
        commitLoadouts(next);
      }
    },
    [activeItems, character.race, loadouts, activeLoadoutId, commitLoadouts]
  );

  // Unequip single slot
  const handleUnequipSlot = useCallback(
    (slot) => {
      const nextItems = { ...activeItems };
      delete nextItems[slot];
      const next = loadouts.map((l) =>
        l.id === activeLoadoutId ? { ...l, items: nextItems } : l
      );
      commitLoadouts(next);
    },
    [activeItems, loadouts, activeLoadoutId, commitLoadouts]
  );

  return (
    <div
      className="equipment-studio-root px-6 sm:px-10 py-6 space-y-6 text-sm w-full"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header & Subtitle */}
      <div className="border-b border-[#2a2318] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#f3e6c8] tracking-wide flex items-center gap-2">
            <span>Equipped Loadouts &amp; Paperdoll Studio</span>
          </h3>
          <p className="text-sm text-[#b8a078] mt-1">
            Canonical 19-slot equipment inspector with weighted armor ratings, encumbrance capacity, and multi-loadout presets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#8c7853]">
            {character.race ? `${character.race} · ` : ""}{character.className || "Custom Build"}
          </span>
        </div>
      </div>

      {/* Loadout Preset Selector Bar */}
      <LoadoutTabsBar
        loadouts={loadouts}
        activeLoadoutId={activeLoadoutId}
        onSelectLoadout={handleSelectLoadout}
        onRenameLoadout={handleRenameLoadout}
        onCopyLoadout={handleCopyLoadout}
        onClearLoadout={handleClearLoadout}
        onEquipKit={handleEquipKit}
      />

      {/* 2-Pane Studio: Left = 19-Slot Paperdoll Grid, Right = Combat & Armor Stats Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <PaperdollGrid
            character={character}
            loadout={activeItems}
            skills={skills}
            attributes={attributes}
            onSelectSlot={(slot) => setActivePickerSlot(slot)}
            onUnequipSlot={handleUnequipSlot}
          />
        </div>

        <div className="xl:col-span-4">
          <EquipmentStatsSummary
            loadout={activeItems}
            skills={skills}
            attributes={attributes}
          />
        </div>
      </div>

      {/* Item Picker Drawer Modal */}
      {activePickerSlot && (
        <ItemPickerDrawer
          slot={activePickerSlot}
          race={character.race}
          currentLoadout={activeItems}
          onEquipItem={handleEquipItem}
          onUnequipSlot={handleUnequipSlot}
          onClose={() => setActivePickerSlot(null)}
        />
      )}
    </div>
  );
}
