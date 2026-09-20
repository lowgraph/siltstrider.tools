"use client";
import { memo } from "react";
import {
  computeTotalArmorRating,
  computeSlotArmorRating,
  computeEncumbrance,
  getWeaponCombatProfile,
  aggregateConstantEffects,
  ARMOR_SLOT_WEIGHTS,
  SLOT_DISPLAY_NAMES,
} from "../../lib/equipment-math.mjs";

/**
 * Tactical Equipment & Combat Statistics Display
 */
export const EquipmentStatsSummary = memo(function EquipmentStatsSummary({
  loadout = {},
  skills = {},
  attributes = {},
  enchantmentsMap = {},
}) {
  const strength = attributes?.Strength?.v ?? attributes?.Strength ?? 40;
  const totalAR = computeTotalArmorRating(loadout, skills);
  const encumbrance = computeEncumbrance(loadout, strength);
  const equippedWeapon = loadout.CarriedRight || null;
  const weaponProfile = getWeaponCombatProfile(equippedWeapon);
  const constantEffects = aggregateConstantEffects(loadout, enchantmentsMap);

  // Encumbrance gauge percentage & color tier
  const encRatio = encumbrance.ratio;
  let gaugeColor = "bg-[#d4b06a]";
  let gaugeTextColor = "text-[#d4b06a]";
  if (encumbrance.isOverEncumbered) {
    gaugeColor = "bg-[#b33a3a]";
    gaugeTextColor = "text-[#ff6b6b]";
  } else if (encRatio >= 85) {
    gaugeColor = "bg-[#c97d2e]";
    gaugeTextColor = "text-[#e89b4f]";
  }

  return (
    <div className="equipment-stats-summary space-y-4">
      {/* 1. Core Vitals & Defenses: Total AR & Encumbrance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Total Armor Rating Card */}
        <div
          className="p-4 bg-[#120e09] border border-[#2a2318] mw-groove-panel flex flex-col justify-between"
          style={{
            boxShadow: "inset 0 0 10px 2px rgba(0, 0, 0, 0.9)",
          }}
        >
          <div className="flex items-center justify-between border-b border-[#221c13] pb-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-serif font-bold text-[#8c7853]">
              Total Armor Rating
            </span>
            <span className="text-[10px] font-mono text-[#6e5d3f]">
              Morrowind Weighted
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-3xl sm:text-4xl font-mono font-bold text-[#f3e6c8]">
              {totalAR}
            </div>
            <div className="text-right text-[11px] text-[#8c7853]">
              <div>Cuirass 30% · Shield 10%</div>
              <div>Limbs 10% · Hands 5%</div>
            </div>
          </div>
        </div>

        {/* Encumbrance & Carry Capacity Card */}
        <div
          className="p-4 bg-[#120e09] border border-[#2a2318] mw-groove-panel flex flex-col justify-between"
          style={{
            boxShadow: "inset 0 0 10px 2px rgba(0, 0, 0, 0.9)",
          }}
        >
          <div className="flex items-center justify-between border-b border-[#221c13] pb-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-serif font-bold text-[#8c7853]">
              Encumbrance
            </span>
            <span className={`text-[10px] font-mono font-bold ${gaugeTextColor}`}>
              {encumbrance.isOverEncumbered ? "OVER-ENCUMBERED" : `${encRatio}% Cap`}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xl sm:text-2xl font-mono font-bold text-[#f3e6c8]">
                {encumbrance.totalWeight} <span className="text-xs font-serif text-[#8c7853]">/ {encumbrance.maxWeight} lbs</span>
              </span>
              <span className="text-[11px] text-[#8c7853] font-serif">
                STR ({strength}) × 5
              </span>
            </div>

            {/* Progress Bar Gauge */}
            <div className="w-full h-2 bg-[#0d0a06] border border-[#2a2014] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${gaugeColor}`}
                style={{ width: `${Math.min(100, encRatio)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Weapon Combat Profile */}
      <div
        className="p-4 bg-[#120e09] border border-[#2a2318] mw-groove-panel space-y-3"
        style={{
          boxShadow: "inset 0 0 10px 2px rgba(0, 0, 0, 0.9)",
        }}
      >
        <div className="flex items-center justify-between border-b border-[#221c13] pb-2">
          <span className="text-xs uppercase tracking-wider font-serif font-bold text-[#8c7853]">
            Main-Hand Weapon Combat Rating
          </span>
          {weaponProfile && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-[#1a140d] border border-[#3d2f1c] text-[#d4b06a]">
              {weaponProfile.isTwoHanded ? "Two-Handed" : "One-Handed"}
            </span>
          )}
        </div>

        {weaponProfile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-[#f3e6c8]">
                {weaponProfile.name}
              </span>
              <span className="text-xs font-mono text-[#8c7853]">
                Spd {weaponProfile.speed} · Rch {weaponProfile.reach}
              </span>
            </div>

            {/* Min-Max Strike Ratings */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 bg-[#17120a] border border-[#261e12] text-center">
                <div className="text-[10px] uppercase font-serif text-[#8c7853]">Chop</div>
                <div className="text-sm font-mono font-bold text-[#d4b06a] mt-0.5">
                  {weaponProfile.chop}
                </div>
              </div>
              <div className="p-2 bg-[#17120a] border border-[#261e12] text-center">
                <div className="text-[10px] uppercase font-serif text-[#8c7853]">Slash</div>
                <div className="text-sm font-mono font-bold text-[#d4b06a] mt-0.5">
                  {weaponProfile.slash}
                </div>
              </div>
              <div className="p-2 bg-[#17120a] border border-[#261e12] text-center">
                <div className="text-[10px] uppercase font-serif text-[#8c7853]">Thrust</div>
                <div className="text-sm font-mono font-bold text-[#d4b06a] mt-0.5">
                  {weaponProfile.thrust}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 text-center text-xs font-serif italic text-[#6e5d3f]">
            No weapon equipped in main hand (Hand-to-Hand active).
          </div>
        )}
      </div>

      {/* 3. Constant Effect Passive Enchantments */}
      <div
        className="p-4 bg-[#120e09] border border-[#2a2318] mw-groove-panel space-y-2"
        style={{
          boxShadow: "inset 0 0 10px 2px rgba(0, 0, 0, 0.9)",
        }}
      >
        <div className="flex items-center justify-between border-b border-[#221c13] pb-2">
          <span className="text-xs uppercase tracking-wider font-serif font-bold text-[#8c7853]">
            Active Constant Effects
          </span>
          <span className="text-[10px] font-mono text-[#6e5d3f]">
            {constantEffects.length} Passive{constantEffects.length === 1 ? "" : "s"}
          </span>
        </div>

        {constantEffects.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {constantEffects.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-[#17120a] border border-[#261e12] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#d4b06a] font-serif">✦</span>
                  <span className="font-serif font-semibold text-[#f3e6c8]">
                    {item.itemName}
                  </span>
                  <span className="text-[10px] font-serif text-[#8c7853]">
                    ({SLOT_DISPLAY_NAMES[item.slot] || item.slot})
                  </span>
                </div>
                <div className="text-right font-mono text-[#c4b998]">
                  {item.effects.map((ef) => `${ef.effect || "Enchantment"} ${ef.magnitude ? `${ef.magnitude} pts` : ""}`).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center text-xs font-serif italic text-[#6e5d3f]">
            No constant effect enchanted items currently equipped.
          </div>
        )}
      </div>
    </div>
  );
});

export default EquipmentStatsSummary;
