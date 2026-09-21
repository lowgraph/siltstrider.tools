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
 * Tactical CRPG Equipment Ledger
 * Organizes equipped items into categorized equipment rosters without any paper doll representations.
 */
export const EquipmentLedger = memo(function EquipmentLedger({
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
    <div className="equipment-ledger space-y-4">
      {/* Tactical Character Identity & Rapid Readout Bar */}
      <div
        className="p-3 bg-surface-2 border border-line-11 mw-groove-panel flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        style={{
          boxShadow: "inset 0 0 10px 2px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-line-7 bg-surface-6 flex items-center justify-center font-serif font-bold text-sm text-accent">
            {(character.name || character.className || "C")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-serif font-bold text-sm text-fg-2 tracking-wide">
              {character.name || character.className || "Vvardenfell Adventurer"}
            </div>
            <div className="text-[11px] font-serif text-fg-14">
              {character.gender || "Male"} {character.race || "Dark Elf"} · {character.sign || "The Lady"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <div className="px-2.5 py-1 bg-surface-5 border border-line-11 flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-serif text-fg-14">Total AR:</span>
            <span className="font-bold text-accent text-sm">{totalAR}</span>
          </div>
          <div className="px-2.5 py-1 bg-surface-5 border border-line-11 flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-serif text-fg-14">Weight:</span>
            <span className="font-bold text-accent text-sm">
              {enc.totalWeight} <span className="text-[10px] text-fg-14">/ {enc.maxWeight} lbs</span>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Category Switcher (screens < 1024px) */}
      <div className="flex lg:hidden items-center gap-1.5 p-1 bg-surface-2 border border-line-11">
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

      {/* Categorized 2-Column Equipment Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left Column: Armor & Defensive Slots (9 slots) */}
        {(mobileFilter === "all" || mobileFilter === "defense") && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-serif font-bold text-fg-14 tracking-wider px-1 pb-1 border-b border-line-12 flex items-center justify-between">
              <span>Armor &amp; Defensive Gear</span>
              <span className="font-mono text-fg-16">9 Slots</span>
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

        {/* Right Column: Weapons, Attire & Jewelry Slots (10 slots) */}
        {(mobileFilter === "all" || mobileFilter === "attire") && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-serif font-bold text-fg-14 tracking-wider px-1 pb-1 border-b border-line-12 flex items-center justify-between">
              <span>Weapons, Attire &amp; Jewelry</span>
              <span className="font-mono text-fg-16">10 Slots</span>
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

export default EquipmentLedger;
