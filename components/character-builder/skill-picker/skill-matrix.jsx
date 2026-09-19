"use client";
import React, { useState } from "react";
import SkillCard from "./skill-card";
import { SPECIALIZATIONS, SKILL_SPEC } from "../../../lib/character-math.mjs";

export default function SkillMatrix({
  skillsBySpec = { Combat: [], Magic: [], Stealth: [] },
  maj = [],
  min = [],
  activeSpec = "Combat",
  raceSkills = {},
  sheet,
  onCycleTier,
  onSetTier,
  isPresetClass
}) {
  const [mobileTab, setMobileTab] = useState("Combat");

  const getTier = (skill) => {
    if (maj.includes(skill)) return "Major";
    if (min.includes(skill)) return "Minor";
    return "Misc";
  };

  const renderColumn = (spec) => {
    const skills = skillsBySpec[spec] || [];
    const isSpecializationActive = activeSpec === spec;

    return (
      <div
        key={spec}
        className="flex flex-col flex-1 min-w-0 bg-[#120f0a] border border-[#2b2216] p-2.5 space-y-2"
      >
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#251c12]">
          <h4 className="font-serif font-bold text-sm tracking-wider uppercase text-[#d4b06a]">
            {spec} Skills ({skills.length})
          </h4>
          {isSpecializationActive ? (
            <span
              title="All 9 skills receive +5 from your class specialization"
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#3a2d18] text-[#f3e6c8] border border-[#d4b06a]"
            >
              +5 Active
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#786a52]">
              Base 5
            </span>
          )}
        </div>

        {/* 9 Skill Cards */}
        <div className="flex flex-col gap-1.5">
          {skills.map((skill) => (
            <SkillCard
              key={skill}
              skill={skill}
              tier={getTier(skill)}
              rating={sheet?.skills?.[skill]?.v ?? 5}
              isSpecBonus={isSpecializationActive}
              raceBonus={raceSkills[skill] || 0}
              onCycleTier={onCycleTier}
              onSetTier={onSetTier}
              isPresetClass={isPresetClass}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Mobile Specialization Segmented Tabs (< 1024px) */}
      <div className="flex lg:hidden items-center gap-1.5 p-1 bg-[#0e0c08] border border-[#261d13]">
        {SPECIALIZATIONS.map((spec) => (
          <button
            key={spec}
            type="button"
            className={`flex-1 py-1.5 px-2 text-xs font-serif font-bold transition-all mw-btn ${
              mobileTab === spec ? "active text-[#f3e6c8]" : "text-[#9e8b6b]"
            }`}
            onClick={() => setMobileTab(spec)}
          >
            {spec} {activeSpec === spec ? "★" : ""}
          </button>
        ))}
      </div>

      {/* Desktop 3-Column Grid / Mobile Active Column */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-3">
        {SPECIALIZATIONS.map((spec) => renderColumn(spec))}
      </div>

      <div className="block lg:hidden">
        {renderColumn(mobileTab)}
      </div>
    </div>
  );
}
