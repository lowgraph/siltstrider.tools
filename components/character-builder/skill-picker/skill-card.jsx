"use client";
import React, { useState } from "react";
import { SKILL_GOV, ATTR_ABBR } from "../../../lib/character-math.mjs";

export default function SkillCard({
  skill,
  tier, // "Major" | "Minor" | "Misc"
  rating,
  isSpecBonus,
  raceBonus,
  onCycleTier,
  onSetTier,
  isPresetClass
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const govAttr = SKILL_GOV[skill] || "Strength";
  const abbr = ATTR_ABBR[govAttr] || govAttr.slice(0, 3).toUpperCase();

  const handleCardClick = (e) => {
    // Don't cycle if clicking inside the tier select menu
    if (e.target.closest(".skill-tier-selector")) return;
    onCycleTier(skill);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCycleTier(skill);
    }
  };

  const tierBg =
    tier === "Major"
      ? "border-[#d4b06a] bg-[#221a10] shadow-[inset_0_0_8px_rgba(212,176,106,0.18)]"
      : tier === "Minor"
      ? "border-[#8e7a50] bg-[#1a140d]"
      : "border-[#251d13] bg-[#120f0a] hover:border-[#423321] opacity-85 hover:opacity-100";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${skill}: ${tier} skill, rating ${rating}, governed by ${govAttr}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col justify-between p-2 sm:p-2.5 border transition-all cursor-pointer select-none text-left min-h-[64px] ${tierBg}`}
    >
      {/* Top Row: Skill Name & Rating */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          <span
            className={`font-serif font-bold text-sm truncate ${
              tier === "Major"
                ? "text-[#f3e6c8]"
                : tier === "Minor"
                ? "text-[#e2d3b3]"
                : "text-[#b8a785]"
            }`}
          >
            {skill}
          </span>
          {/* Governing Attribute Badge */}
          <span
            title={`Governed by ${govAttr}`}
            className="text-[10px] font-mono px-1 py-0.2 border border-[#3d301e] bg-[#0c0a07] text-[#9e8b6b] rounded-none"
          >
            {abbr}
          </span>
        </div>

        {/* Live Skill Rating */}
        <span
          className={`font-mono font-bold text-sm sm:text-base text-right shrink-0 ${
            tier === "Major"
              ? "text-[#d4b06a]"
              : tier === "Minor"
              ? "text-[#c2a662]"
              : "text-[#8a7b60]"
          }`}
        >
          {rating ?? 5}
        </span>
      </div>

      {/* Bottom Row: Bonus Badges & Tier Tag */}
      <div className="flex items-center justify-between gap-1.5 mt-1.5 pt-1 border-t border-[#1e170f]">
        {/* Badges: Spec (+5) & Race Bonus */}
        <div className="flex items-center gap-1 overflow-hidden">
          {isSpecBonus && (
            <span
              title="Class Specialization (+5)"
              className="text-[10px] font-mono font-semibold px-1 py-0.2 bg-[#2d2212] text-[#d4b06a] border border-[#523d21]"
            >
              +5 Spec
            </span>
          )}
          {raceBonus > 0 && (
            <span
              title={`Racial Bonus (+${raceBonus})`}
              className="text-[10px] font-mono font-semibold px-1 py-0.2 bg-[#1a2516] text-[#78c26d] border border-[#2b4424]"
            >
              +{raceBonus} Race
            </span>
          )}
        </div>

        {/* Tier Indicator Pill & Quick Menu */}
        <div className="relative skill-tier-selector">
          <button
            type="button"
            className={`text-[10px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 border transition-colors ${
              tier === "Major"
                ? "border-[#d4b06a] bg-[#3a2d18] text-[#f3e6c8]"
                : tier === "Minor"
                ? "border-[#7a643c] bg-[#261e12] text-[#d4b06a]"
                : "border-[#2a2217] bg-[#14100a] text-[#70634c] hover:border-[#523e25] hover:text-[#baa889]"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Click to change tier"
          >
            {tier} {tier === "Major" ? "(+25)" : tier === "Minor" ? "(+10)" : ""}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 z-50 w-28 bg-[#120f0a] border-2 border-[#d4b06a] shadow-xl p-1 flex flex-col gap-1">
                <button
                  type="button"
                  className={`text-xs px-2 py-1 text-left font-serif font-bold ${
                    tier === "Major" ? "bg-[#3a2d18] text-[#d4b06a]" : "text-[#f3e6c8] hover:bg-[#201910]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onSetTier(skill, "Major");
                  }}
                >
                  Major (+25)
                </button>
                <button
                  type="button"
                  className={`text-xs px-2 py-1 text-left font-serif font-bold ${
                    tier === "Minor" ? "bg-[#261e12] text-[#d4b06a]" : "text-[#f3e6c8] hover:bg-[#201910]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onSetTier(skill, "Minor");
                  }}
                >
                  Minor (+10)
                </button>
                <button
                  type="button"
                  className={`text-xs px-2 py-1 text-left font-serif font-bold ${
                    tier === "Misc" ? "bg-[#1d160e] text-[#a09070]" : "text-[#8a7b60] hover:bg-[#201910]"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onSetTier(skill, "Misc");
                  }}
                >
                  Misc (Base)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
