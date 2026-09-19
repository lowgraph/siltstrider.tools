"use client";
import React, { useState, useMemo, useCallback } from "react";
import SkillBudgetBar from "./skill-budget-bar";
import SkillAttributeSummary from "./skill-attribute-summary";
import SkillMatrix from "./skill-matrix";
import SkillSwapModal from "./skill-swap-modal";
import { swapSkill, SKILL_SPEC } from "../../../lib/character-math.mjs";

export default function SkillPicker({
  build,
  catalogs,
  sheet,
  onUpdateField,
  onSwapSkill
}) {
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "slot"
  const [swapModal, setSwapModal] = useState({
    isOpen: false,
    targetTier: "Major",
    candidateSkill: null
  });

  const maj = Array.isArray(build.maj) ? build.maj : [];
  const min = Array.isArray(build.min) ? build.min : [];
  const isPresetClass = build.className !== "Custom";

  // Group all 27 skills by specialization from catalogs or canonical mapping
  const skillsBySpec = useMemo(() => {
    if (catalogs?.specSkills) {
      return catalogs.specSkills;
    }
    const grouped = { Combat: [], Magic: [], Stealth: [] };
    const all = catalogs?.skills || Object.keys(SKILL_SPEC);
    all.forEach((s) => {
      const spec = SKILL_SPEC[s] || "Combat";
      if (!grouped[spec]) grouped[spec] = [];
      grouped[spec].push(s);
    });
    return grouped;
  }, [catalogs]);

  // Race bonuses from active race catalog
  const raceSkills = useMemo(() => {
    if (!build?.race || !catalogs?.races) return {};
    return catalogs.races[build.race]?.skills || {};
  }, [build.race, catalogs]);

  // Helper to ensure custom modifications detach from preset class
  const ensureCustomClass = useCallback(() => {
    if (build.className !== "Custom") {
      onUpdateField("className", "Custom");
    }
  }, [build.className, onUpdateField]);

  // Handle direct tier assignment
  const handleSetTier = useCallback(
    (skill, targetTier) => {
      ensureCustomClass();
      const inMaj = maj.includes(skill);
      const inMin = min.includes(skill);

      if (targetTier === "Major") {
        if (inMaj) return;
        if (maj.length >= 5) {
          setSwapModal({
            isOpen: true,
            targetTier: "Major",
            candidateSkill: skill
          });
          return;
        }
        // Add to majors, remove from minors if present
        const nextMin = min.filter((s) => s !== skill);
        const nextMaj = [...maj, skill];
        onUpdateField("maj", nextMaj);
        onUpdateField("min", nextMin);
      } else if (targetTier === "Minor") {
        if (inMin) return;
        if (min.length >= 5) {
          setSwapModal({
            isOpen: true,
            targetTier: "Minor",
            candidateSkill: skill
          });
          return;
        }
        // Add to minors, remove from majors if present
        const nextMaj = maj.filter((s) => s !== skill);
        const nextMin = [...min, skill];
        onUpdateField("maj", nextMaj);
        onUpdateField("min", nextMin);
      } else {
        // Demote to Misc
        if (inMaj) {
          setSwapModal({
            isOpen: true,
            targetTier: "Major",
            candidateSkill: skill
          });
        } else if (inMin) {
          setSwapModal({
            isOpen: true,
            targetTier: "Minor",
            candidateSkill: skill
          });
        }
      }
    },
    [maj, min, ensureCustomClass, onUpdateField]
  );

  // Cycle tier: Misc -> Minor -> Major -> Misc
  const handleCycleTier = useCallback(
    (skill) => {
      ensureCustomClass();
      if (maj.includes(skill)) {
        // Demote Major to Minor if Minor has room, else trigger swap
        if (min.length < 5) {
          const nextMaj = maj.filter((s) => s !== skill);
          const nextMin = [...min, skill];
          onUpdateField("maj", nextMaj);
          onUpdateField("min", nextMin);
        } else {
          setSwapModal({
            isOpen: true,
            targetTier: "Minor",
            candidateSkill: skill
          });
        }
      } else if (min.includes(skill)) {
        // Promote Minor to Major
        if (maj.length < 5) {
          const nextMin = min.filter((s) => s !== skill);
          const nextMaj = [...maj, skill];
          onUpdateField("maj", nextMaj);
          onUpdateField("min", nextMin);
        } else {
          setSwapModal({
            isOpen: true,
            targetTier: "Major",
            candidateSkill: skill
          });
        }
      } else {
        // Misc -> Minor (or Major if minor is full)
        if (min.length < 5) {
          onUpdateField("min", [...min, skill]);
        } else if (maj.length < 5) {
          onUpdateField("maj", [...maj, skill]);
        } else {
          // Both are full, prompt to swap into Major or Minor
          setSwapModal({
            isOpen: true,
            targetTier: "Major",
            candidateSkill: skill
          });
        }
      }
    },
    [maj, min, ensureCustomClass, onUpdateField]
  );

  // Confirm replacement in modal
  const handleConfirmSwap = useCallback(
    (targetIndex, replacedSkill) => {
      ensureCustomClass();
      const isMajor = swapModal.targetTier === "Major";
      const candidate = swapModal.candidateSkill;
      const { maj: nextMaj, min: nextMin } = swapSkill(
        maj,
        min,
        isMajor,
        targetIndex,
        candidate
      );
      onUpdateField("maj", nextMaj);
      onUpdateField("min", nextMin);
      setSwapModal({ isOpen: false, targetTier: "Major", candidateSkill: null });
    },
    [maj, min, swapModal, ensureCustomClass, onUpdateField]
  );

  return (
    <div className="space-y-3">
      {/* Sticky Budget Status Bar & View Mode Switcher */}
      <SkillBudgetBar
        majCount={maj.length}
        minCount={min.length}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Governing Attribute Distribution Counter */}
      <SkillAttributeSummary maj={maj} min={min} />

      {/* 1. Interactive 27-Skill Specialization Board */}
      <div className={viewMode === "matrix" ? "block" : "hidden"}>
        <SkillMatrix
          skillsBySpec={skillsBySpec}
          maj={maj}
          min={min}
          activeSpec={build.spec}
          raceSkills={raceSkills}
          sheet={sheet}
          onCycleTier={handleCycleTier}
          onSetTier={handleSetTier}
          isPresetClass={isPresetClass}
        />
      </div>

      {/* 2. Classic Slot View (Always mounted in DOM for JSDOM test suite & accessibility) */}
      <div className={viewMode === "slot" ? "block space-y-4" : "hidden"}>
        {/* Major Skills (5) */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#2a2318] pb-1">
            Major Skills (+25)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {maj.map((skillName, idx) => (
              <div
                key={`maj-${idx}`}
                className={`flex items-center gap-2 p-1.5 border border-[#2a2216] ${
                  idx % 2 === 0 ? "bg-[#14100a]" : "bg-[#1d170f]"
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#d4b06a] w-5 text-right">
                  {idx + 1}.
                </span>
                <select
                  className="mw-select flex-1 h-9 px-2 py-1 text-sm focus:outline-none"
                  disabled={build.className !== "Custom"}
                  value={skillName}
                  aria-label={"Major skill " + (idx + 1)}
                  onChange={(e) => onSwapSkill(true, idx, e.target.value)}
                >
                  {["Combat", "Magic", "Stealth"].map((spec) => (
                    <optgroup key={spec} label={spec}>
                      {(skillsBySpec[spec] || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Minor Skills (5) */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#2a2318] pb-1">
            Minor Skills (+10)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {min.map((skillName, idx) => (
              <div
                key={`min-${idx}`}
                className={`flex items-center gap-2 p-1.5 border border-[#2a2216] ${
                  idx % 2 === 0 ? "bg-[#14100a]" : "bg-[#1d170f]"
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#d4b06a] w-5 text-right">
                  {idx + 1}.
                </span>
                <select
                  className="mw-select flex-1 h-9 px-2 py-1 text-sm focus:outline-none"
                  disabled={build.className !== "Custom"}
                  value={skillName}
                  aria-label={"Minor skill " + (idx + 1)}
                  onChange={(e) => onSwapSkill(false, idx, e.target.value)}
                >
                  {["Combat", "Magic", "Stealth"].map((spec) => (
                    <optgroup key={spec} label={spec}>
                      {(skillsBySpec[spec] || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conflict Resolution Swap Modal */}
      <SkillSwapModal
        isOpen={swapModal.isOpen}
        targetTier={swapModal.targetTier}
        candidateSkill={swapModal.candidateSkill}
        currentSkills={swapModal.targetTier === "Major" ? maj : min}
        sheet={sheet}
        onConfirmSwap={handleConfirmSwap}
        onClose={() =>
          setSwapModal({ isOpen: false, targetTier: "Major", candidateSkill: null })
        }
      />
    </div>
  );
}
