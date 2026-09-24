"use client";
import { memo, useState, useMemo } from "react";
import {itemsForSlot} from '../../lib/equipment-catalog.mjs';
import {
  SLOT_DISPLAY_NAMES,
  getEffectiveArmorCategory,
  isBeastRace,
  isClosedHelmet,
  TWO_HANDED_WEAPON_TYPES,
} from "../../lib/equipment-math.mjs";

/**
 * Item Selection and Custom Item Creation Drawer
 */
export const ItemPickerDrawer = memo(function ItemPickerDrawer({
  catalogItems = [],
  catalogStatus = "loading",
  onRetry,
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
  const baselineList = useMemo(() => itemsForSlot(catalogItems, slot, race), [catalogItems, slot, race]);

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
        const matchesId = String(item.key || item.id || "").toLowerCase().includes(q);
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
          background: "var(--color-surface-3)",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.95), inset 0 0 12px 2px rgba(0, 0, 0, 0.9)",
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-line-11 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-fg-2 flex items-center gap-2">
              <span>Equip: {slotName}</span>
            </h3>
            <p className="text-xs text-fg-14 mt-0.5">
              Select an authentic game item or forge a custom equipment record.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center mw-btn font-bold text-sm text-fg-14 hover:text-fg-2"
            title="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Catalog vs Custom Builder */}
        <div className="flex items-center gap-2 border-b border-line-12 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`mw-btn px-4 py-1.5 font-serif text-xs font-bold ${
              activeTab === "catalog" ? "active ring-1 ring-accent" : ""
            }`}
          >
            Browse Catalog ({filteredItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`mw-btn px-4 py-1.5 font-serif text-xs font-bold ${
              activeTab === "custom" ? "active ring-1 ring-accent" : ""
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
              className="mw-btn px-3 py-1.5 font-serif text-xs font-bold text-danger-8 hover:text-danger-3"
            >
              Unequip Slot
            </button>
          </div>
        </div>

        {/* Content: Browse Catalog */}
        {activeTab === "catalog" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            {catalogStatus === "loading" && <p role="status">Loading profile equipment...</p>}
            {catalogStatus === "error" && <p role="alert">Equipment could not be loaded. <button onClick={onRetry}>Retry</button></p>}
            {filteredItems.length > 100 && <p>Showing the first 100 matches. Search to narrow the list.</p>}
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${slotName} items...`}
                className="mw-input flex-1 min-w-[180px] px-3 py-1.5 text-xs bg-surface-1 border border-line-11 text-fg-2 focus:border-accent"
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
              <div className="p-2.5 bg-danger-surface-2 border border-danger-line-3 text-xs text-danger-2">
                <strong className="font-serif">Beast Anatomy Note: </strong>
                {slot === "Boots"
                  ? "Argonians and Khajiit cannot equip any boots or footwear."
                  : "Beast races cannot equip closed helmets that fully enclose the head and muzzle."}
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[350px]">
              {filteredItems.length > 0 ? (
                filteredItems.slice(0, 100).map((item) => {
                  const armorCat = getEffectiveArmorCategory(item);
                  const is2H = TWO_HANDED_WEAPON_TYPES.has(String(item.type).toUpperCase());

                  return (
                    <div
                      key={item.key || item.id}
                      className="flex items-center justify-between p-2.5 bg-surface-2 border border-line-12 hover:border-line-7 hover:bg-surface-6 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-xs text-fg-2">
                            {item.name}
                          </span>
                          {armorCat && (
                            <span className="text-[9px] uppercase px-1 py-0.2 bg-surface-9 border border-line-9 text-fg-5">
                              {armorCat}
                            </span>
                          )}
                          {is2H && (
                            <span className="text-[9px] uppercase px-1 py-0.2 bg-danger-surface-2 border border-danger-line-3 text-warning-3">
                              Two-Handed
                            </span>
                          )}
                          {item.enchantmentId && (
                            <span className="text-[10px] text-accent" title="Enchanted">
                              ✦
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-fg-14">{item.key} · {item.provenance?.winningPlugin || item.sourcePlugin}</p>
                        {item.effectText && <p className="text-xs text-accent">{item.effectText}</p>}
                        <div className="text-[11px] font-mono text-fg-14 mt-0.5 flex items-center gap-3">
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
                        className="mw-btn px-4 py-1.5 font-serif font-bold text-xs text-accent hover:text-fg-1 whitespace-nowrap"
                      >
                        Equip
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs font-serif italic text-fg-16">
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
              <label className="text-xs uppercase font-serif font-bold text-fg-14">
                Item Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Custom Daedric Plate of Fortitude"
                required
                className="mw-input w-full px-3 py-2 text-xs bg-surface-1 border border-line-11 text-fg-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs uppercase font-serif font-bold text-fg-14">
                  {slot === "CarriedRight" ? "Max Strike Damage" : "Base Armor Rating"}
                </label>
                <input
                  type="number"
                  value={customAR}
                  onChange={(e) => setCustomAR(e.target.value)}
                  min="0"
                  max="1000"
                  className="mw-input w-full px-3 py-1.5 text-xs bg-surface-1 border border-line-11 text-fg-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-serif font-bold text-fg-14">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  min="0"
                  step="0.1"
                  className="mw-input w-full px-3 py-1.5 text-xs bg-surface-1 border border-line-11 text-fg-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mw-btn py-2.5 font-serif font-bold text-xs tracking-wide text-accent"
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
