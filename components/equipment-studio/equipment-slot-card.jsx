"use client";
import { memo } from "react";
import { SLOT_DISPLAY_NAMES, getEffectiveArmorCategory } from "../../lib/equipment-math.mjs";

/**
 * Procedural SVG icons for equipment slots.
 * Renders crisp, authentic CRPG line icons without emojis or raster bloat.
 */
function SlotGlyph({ slot }) {
  const stroke = "#8c7853";
  switch (slot) {
    case "Helmet":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a7 7 0 0 0-7 7v4c0 3 3 6 7 7s7-4 7-7v-4a7 7 0 0 0-7-7z" />
          <path d="M5 11h14" />
          <path d="M12 11v8" />
          <path d="M9 14h6" />
        </svg>
      );
    case "Cuirass":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4l3 2h6l3-2v4l-2 3v9H8v-9L6 8V4z" />
          <path d="M12 6v14" />
          <path d="M8 12h8" />
        </svg>
      );
    case "LeftPauldron":
    case "RightPauldron":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14c0-5 3-8 8-8s8 3 8 8" />
          <path d="M6 14v4l6 2 6-2v-4" />
          <path d="M8 10l4 3 4-3" />
        </svg>
      );
    case "LeftGauntlet":
    case "RightGauntlet":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 11V5a2 2 0 0 1 4 0v6" />
          <path d="M11 7a2 2 0 0 1 4 0v4" />
          <path d="M15 9a2 2 0 0 1 4 0v6a6 6 0 0 1-12 0v-4" />
          <path d="M7 16v5h10v-5" />
        </svg>
      );
    case "Greaves":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12v4l-2 14h-3l-1-10-1 10H8L6 7V3z" />
          <path d="M9 9h6" />
        </svg>
      );
    case "Boots":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4h7v9l4 2v5H6v-6l1-1V4z" />
          <path d="M6 16h12" />
        </svg>
      );
    case "CarriedLeft": // Shield / Offhand
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 4v6c0 5-4 8-8 9-4-1-8-4-8-9V7l8-4z" />
          <path d="M12 7v10" />
          <path d="M8 11h8" />
        </svg>
      );
    case "CarriedRight": // Weapon / Mainhand
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 3l3 3-10 10-2-1-1-2L18 3z" />
          <path d="M7 15l-3 3 1 1 1-1 1 1 3-3" />
          <path d="M14 7l3 3" />
        </svg>
      );
    case "Ammunition":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 5h-2v14h-2V7H9l3-5z" />
          <path d="M9 18l3 3 3-3" />
        </svg>
      );
    case "Robe":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3l5 3 5-3 3 6-3 2v10H7V11L4 9l3-6z" />
          <path d="M12 6v14" />
        </svg>
      );
    case "Shirt":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 4l5 2 5-2 3 4-2 2v11H6V10L4 8l3-4z" />
          <path d="M12 6v5" />
        </svg>
      );
    case "Pants":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12v6l-2 12h-3l-1-9-1 9H8L6 9V3z" />
        </svg>
      );
    case "Skirt":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4h8l4 16H4L8 4z" />
          <path d="M12 4v16" />
        </svg>
      );
    case "LeftRing":
    case "RightRing":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="14" r="6" />
          <path d="M10 5l2-2 2 2-1 3h-2l-1-3z" />
        </svg>
      );
    case "Amulet":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3c2 6 5 9 6 9s4-3 6-9" />
          <circle cx="12" cy="16" r="4" />
          <circle cx="12" cy="16" r="1" fill="#8c7853" />
        </svg>
      );
    case "Belt":
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="9" width="18" height="6" rx="1" />
          <rect x="10" y="8" width="4" height="8" rx="0.5" />
          <line x1="16" y1="12" x2="18" y2="12" strokeDasharray="1 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="1.6">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/**
 * Individual Tactile Slot Card
 */
export const EquipmentSlotCard = memo(function EquipmentSlotCard({
  slot,
  item = null,
  scaledAR = null,
  onSelectSlot,
  onUnequipSlot,
  isRestricted = false,
  restrictionReason = "",
}) {
  const displayName = SLOT_DISPLAY_NAMES[slot] || slot;
  const isEquipped = Boolean(item);
  const armorCategory = item ? getEffectiveArmorCategory(item) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectSlot(slot)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSlot(slot);
        }
      }}
      className={`group relative flex items-center justify-between p-2.5 transition-all text-left cursor-pointer select-none mw-groove-panel ${
        isRestricted
          ? "opacity-50 cursor-not-allowed bg-[#170e0e] border-[#552020]"
          : isEquipped
          ? "bg-[#18140e] border-[#4a3a24] hover:border-[#d4b06a] hover:bg-[#1f1911]"
          : "bg-[#100d08] border-[#221c13] hover:border-[#3d3221] hover:bg-[#14100b]"
      }`}
      style={{
        boxShadow: isEquipped
          ? "inset 0 0 8px 1px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4)"
          : "inset 0 0 6px 1px rgba(0, 0, 0, 0.9)",
      }}
      title={isRestricted ? restrictionReason : isEquipped ? `Equipped: ${item.name || item.id}` : `Click to equip ${displayName}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Slot Icon Container */}
        <div
          className={`flex items-center justify-center w-8 h-8 flex-shrink-0 border transition-colors ${
            isEquipped
              ? "bg-[#251d12] border-[#5c4728] text-[#d4b06a] group-hover:border-[#d4b06a]"
              : "bg-[#0d0a06] border-[#1f180f] text-[#5a4c33]"
          }`}
        >
          <SlotGlyph slot={slot} />
        </div>

        {/* Slot Info & Item Name */}
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[10px] uppercase font-serif font-bold tracking-wider text-[#8c7853]">
              {displayName}
            </span>
            {armorCategory && (
              <span className="text-[9px] uppercase px-1 py-0.2 bg-[#1f180f] border border-[#3d2e1b] text-[#c4b998]">
                {armorCategory}
              </span>
            )}
            {item?.enchantmentId && (
              <span className="text-[9px] text-[#d4b06a] font-serif" title="Enchanted Item">
                ✦
              </span>
            )}
          </div>

          <div className="mt-1 truncate">
            {isEquipped ? (
              <span className="font-serif text-xs font-semibold text-[#f3e6c8] group-hover:text-[#ffffff] transition-colors">
                {item.name || item.id}
              </span>
            ) : isRestricted ? (
              <span className="font-serif text-xs italic text-[#a35e5e]">
                {restrictionReason || "Beast Restricted"}
              </span>
            ) : (
              <span className="font-serif text-xs italic text-[#5a4c33]">
                Empty
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Badges / Action Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isEquipped && (
          <div className="text-right flex flex-col items-end">
            {scaledAR !== null && (
              <span className="text-[11px] font-mono font-bold text-[#d4b06a] leading-none" title="Armor Rating for this piece scaled by your armor skill">
                AR {scaledAR}
              </span>
            )}
            {item.weight !== undefined && (
              <span className="text-[9px] font-mono text-[#8c7853] mt-0.5 leading-none" title="Weight">
                {item.weight} w
              </span>
            )}
          </div>
        )}

        {/* 1-Click Unequip Button */}
        {isEquipped && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnequipSlot(slot);
            }}
            className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#8c7853] hover:text-[#ff8888] hover:bg-[#2b1010] border border-transparent hover:border-[#662222] transition-colors"
            title={`Unequip ${displayName}`}
            aria-label={`Unequip ${displayName}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
});

export default EquipmentSlotCard;
