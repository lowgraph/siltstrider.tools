"use client";
import { memo, useState } from "react";
import EquipmentSlotCard from "./equipment-slot-card";
import {
  computeSlotArmorRating,
  computeTotalArmorRating,
  computeEncumbrance,
  isBeastRace,
  isClosedHelmet,
} from "../../lib/equipment-math.mjs";

const DEFENSE_SLOTS = [
  "Helmet",
  "LeftPauldron",
  "Cuirass",
  "RightPauldron",
  "LeftGauntlet",
  "RightGauntlet",
  "Greaves",
  "Boots",
  "CarriedLeft",
];

const OFFENSE_AND_ATTIRE_SLOTS = [
  "CarriedRight",
  "Ammunition",
  "Robe",
  "Shirt",
  "Pants",
  "Skirt",
  "LeftRing",
  "RightRing",
  "Amulet",
  "Belt",
];

/**
 * Tactical CRPG Paperdoll Grid
 */
export const PaperdollGrid = memo(function PaperdollGrid({
  character = {},
  loadout = {},
  skills = {},
  attributes = {},
  onSelectSlot,
  onUnequipSlot,
}) {
  const [mobileFilter, setMobileFilter] = useState("all"); // "all" | "defense" | "attire"
  const isBeast = isBeastRace(character.race);
  const totalAR = computeTotalArmorRating(loadout, skills);
  const strength = attributes?.Strength?.v ?? attributes?.Strength ?? 40;
  const enc = computeEncumbrance(loadout, strength);

  return (
    <div className="paperdoll-grid space-y-4">
      {/* Mobile Category Switcher (screens < 1024px) */}
      <div className="flex lg:hidden items-center gap-1.5 p-1 bg-[#100d08] border border-[#261f14]">
        <button
          type="button"
          onClick={() => setMobileFilter("all")}
          className={`flex-1 py-1.5 px-2 text-xs font-serif font-bold transition-all mw-btn ${
            mobileFilter === "all" ? "active" : ""
          }`}
        >
          All 19 Slots
        </button>
        <button
          type="button"
          onClick={() => setMobileFilter("defense")}
          className={`flex-1 py-1.5 px-2 text-xs font-serif font-bold transition-all mw-btn ${
            mobileFilter === "defense" ? "active" : ""
          }`}
        >
          Armor &amp; Shield (9)
        </button>
        <button
          type="button"
          onClick={() => setMobileFilter("attire")}
          className={`flex-1 py-1.5 px-2 text-xs font-serif font-bold transition-all mw-btn ${
            mobileFilter === "attire" ? "active" : ""
          }`}
        >
          Weapons &amp; Attire (10)
        </button>
      </div>

      {/* Main 3-Column Desktop Paperdoll Grid / Adaptive Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Defense & Armor Slots (9 slots) */}
        {(mobileFilter === "all" || mobileFilter === "defense") && (
          <div className="lg:col-span-4 space-y-2">
            <div className="text-[10px] uppercase font-serif font-bold text-[#8c7853] tracking-wider px-1 pb-1 border-b border-[#241c12] flex items-center justify-between">
              <span>Armor &amp; Defense</span>
              <span className="font-mono text-[#6e5d3f]">9 Slots</span>
            </div>

            <div className="space-y-1.5">
              {DEFENSE_SLOTS.map((slot) => {
                const item = loadout[slot] || null;
                const scaledAR = computeSlotArmorRating(slot, item, skills);

                let isRestricted = false;
                let restrictionReason = "";
                if (isBeast) {
                  if (slot === "Boots") {
                    isRestricted = true;
                    restrictionReason = "Beast races cannot wear boots";
                  } else if (slot === "Helmet" && item && isClosedHelmet(item)) {
                    isRestricted = true;
                    restrictionReason = "Closed helmets incompatible with beast races";
                  }
                }

                return (
                  <EquipmentSlotCard
                    key={slot}
                    slot={slot}
                    item={item}
                    scaledAR={scaledAR}
                    onSelectSlot={onSelectSlot}
                    onUnequipSlot={onUnequipSlot}
                    isRestricted={isRestricted}
                    restrictionReason={restrictionReason}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Center Column: Character Avatar Silhouette & Core Vitality Badges */}
        {(mobileFilter === "all") && (
          <div
            className="lg:col-span-4 p-5 bg-[#0f0c08] border border-[#2a2216] mw-groove-panel flex flex-col items-center justify-between min-h-[440px] text-center"
            style={{
              boxShadow: "inset 0 0 16px 2px rgba(0, 0, 0, 0.95)",
            }}
          >
            {/* Top Identity Plaque */}
            <div className="w-full pb-3 border-b border-[#221a10]">
              <h4 className="font-serif font-bold text-base text-[#f3e6c8] tracking-wide">
                {character.name || character.className || "Vvardenfell Adventurer"}
              </h4>
              <p className="text-xs font-serif text-[#8c7853] mt-0.5">
                {character.gender || "Male"} {character.race || "Dark Elf"} · {character.sign || "The Lady"}
              </p>
            </div>

            {/* Central CRPG Silhouette Artwork */}
            <div className="relative my-4 flex items-center justify-center">
              <div
                className="w-36 h-48 border border-[#332616] bg-[#090704] flex items-center justify-center relative overflow-hidden"
                style={{
                  boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9)",
                }}
              >
                {/* Tactical Silhouette Outline */}
                <svg
                  viewBox="0 0 100 160"
                  className="w-28 h-40 text-[#42321e] opacity-70"
                  fill="currentColor"
                >
                  {/* Head */}
                  <circle cx="50" cy="22" r="14" />
                  {/* Neck */}
                  <rect x="46" y="36" width="8" height="6" />
                  {/* Shoulders & Torso */}
                  <path d="M26 44 Q50 40 74 44 L70 94 Q50 98 30 94 Z" />
                  {/* Arms */}
                  <path d="M24 46 L14 86 Q14 96 20 96 L24 60 Z" />
                  <path d="M76 46 L86 86 Q86 96 80 96 L76 60 Z" />
                  {/* Legs */}
                  <path d="M33 96 L31 150 Q31 154 39 154 L44 98 Z" />
                  <path d="M67 96 L69 150 Q69 154 61 154 L56 98 Z" />
                </svg>

                {/* Ambient Rune / Gold Glow */}
                <div className="absolute inset-0 bg-radial from-[#d4b06a]/5 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Quick Defensive & Encumbrance Badges */}
            <div className="w-full pt-3 border-t border-[#221a10] grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-[#140f09] border border-[#22180e]">
                <div className="text-[10px] uppercase font-serif text-[#8c7853]">Total AR</div>
                <div className="text-base font-mono font-bold text-[#d4b06a]">{totalAR}</div>
              </div>
              <div className="p-2 bg-[#140f09] border border-[#22180e]">
                <div className="text-[10px] uppercase font-serif text-[#8c7853]">Encumbrance</div>
                <div className="text-base font-mono font-bold text-[#d4b06a]">
                  {enc.totalWeight} <span className="text-[10px] text-[#8c7853]">/ {enc.maxWeight}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Weapons, Ammunition, Clothing & Jewelry (10 slots) */}
        {(mobileFilter === "all" || mobileFilter === "attire") && (
          <div className="lg:col-span-4 space-y-2">
            <div className="text-[10px] uppercase font-serif font-bold text-[#8c7853] tracking-wider px-1 pb-1 border-b border-[#241c12] flex items-center justify-between">
              <span>Weapons, Attire &amp; Jewelry</span>
              <span className="font-mono text-[#6e5d3f]">10 Slots</span>
            </div>

            <div className="space-y-1.5">
              {OFFENSE_AND_ATTIRE_SLOTS.map((slot) => {
                const item = loadout[slot] || null;

                return (
                  <EquipmentSlotCard
                    key={slot}
                    slot={slot}
                    item={item}
                    scaledAR={null}
                    onSelectSlot={onSelectSlot}
                    onUnequipSlot={onUnequipSlot}
                    isRestricted={false}
                    restrictionReason=""
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PaperdollGrid;
