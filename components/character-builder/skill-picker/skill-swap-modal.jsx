"use client";
import React from "react";
import { SKILL_GOV, ATTR_ABBR } from "../../../lib/character-math.mjs";

export default function SkillSwapModal({
  isOpen,
  targetTier = "Major", // "Major" | "Minor"
  candidateSkill,
  currentSkills = [],
  sheet,
  onConfirmSwap,
  onClose
}) {
  if (!isOpen || !candidateSkill) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#16120b] border-4 border-transparent p-5 shadow-2xl space-y-4 mw-groove-panel">
        <div className="border-b border-[#302416] pb-2">
          <h3
            id="swap-modal-title"
            className="text-base sm:text-lg font-serif font-bold text-[#d4b06a]"
          >
            {targetTier} Slots Full (5/5)
          </h3>
          <p className="text-xs text-[#c2b293] mt-1">
            Choose an existing {targetTier} skill to replace with{" "}
            <span className="font-bold text-[#f3e6c8]">"{candidateSkill}"</span>:
          </p>
        </div>

        {/* Existing 5 Skills */}
        <div className="space-y-2">
          {currentSkills.map((skill, idx) => {
            const gov = SKILL_GOV[skill] || "Strength";
            const abbr = ATTR_ABBR[gov] || gov.slice(0, 3).toUpperCase();
            const rating = sheet?.skills?.[skill]?.v ?? 5;

            return (
              <button
                key={skill}
                type="button"
                className="w-full flex items-center justify-between p-2.5 bg-[#1a140d] hover:bg-[#281f13] border border-[#382b1b] hover:border-[#d4b06a] transition-all text-left group"
                onClick={() => onConfirmSwap(idx, skill)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#d4b06a] font-bold">
                    {idx + 1}.
                  </span>
                  <span className="font-serif font-bold text-sm text-[#f3e6c8] group-hover:text-[#d4b06a]">
                    {skill}
                  </span>
                  <span className="text-[10px] font-mono px-1 py-0.2 border border-[#3d301e] bg-[#0c0a07] text-[#9e8b6b]">
                    {abbr}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-[#d4b06a]">
                    {rating}
                  </span>
                  <span className="text-xs uppercase font-serif font-bold text-[#baa267] group-hover:underline">
                    Replace →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end pt-2 border-t border-[#302416]">
          <button
            type="button"
            className="mw-btn px-4 py-1.5 font-serif font-bold text-xs"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
