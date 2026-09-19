"use client";
import { useState, useMemo } from "react";
import { ALL_SKILLS, SKILL_SPEC, SKILL_GOV, ATTR_ABBR } from "../../lib/level-math.mjs";

export default function SkillProgressionMatrix({ initialSkills, currentSkills, maj = [], min = [] }) {
  const [selectedSpec, setSelectedSpec] = useState("all"); // "all" | "Combat" | "Magic" | "Stealth"

  const majSet = useMemo(() => new Set(maj), [maj]);
  const minSet = useMemo(() => new Set(min), [min]);

  const skillEntries = useMemo(() => {
    return ALL_SKILLS.map((skill) => {
      const spec = SKILL_SPEC[skill] || "Combat";
      const gov = SKILL_GOV[skill] || "Luck";
      const startVal = Number(initialSkills?.[skill] ?? 5);
      const curVal = Number(currentSkills?.[skill] ?? startVal);
      const gained = Math.max(0, curVal - startVal);
      const tier = majSet.has(skill) ? "Major" : minSet.has(skill) ? "Minor" : "Misc";

      return {
        skill,
        spec,
        gov,
        govAbbr: ATTR_ABBR[gov] || gov.slice(0, 3).toUpperCase(),
        startVal,
        curVal,
        gained,
        tier
      };
    });
  }, [initialSkills, currentSkills, majSet, minSet]);

  const filteredSkills = useMemo(() => {
    if (selectedSpec === "all") return skillEntries;
    return skillEntries.filter((s) => s.spec === selectedSpec);
  }, [skillEntries, selectedSpec]);

  return (
    <div className="skill-progression-matrix space-y-3 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#221c13] pb-2">
        <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
          27-Skill Progression Matrix
        </h4>

        {/* Category Tabs */}
        <div className="inline-flex rounded-none p-0.5 bg-[#18140e] border border-[#3a3020] text-xs">
          {["all", "Combat", "Magic", "Stealth"].map((spec) => (
            <button
              key={spec}
              type="button"
              className={`mw-btn py-1 px-2.5 text-[11px] font-serif font-bold transition-all ${
                selectedSpec === spec ? "active ring-1 ring-[#d4b06a]" : "text-[#9e8b6b]"
              }`}
              onClick={() => setSelectedSpec(spec)}
            >
              {spec === "all" ? "All (27)" : spec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Skill Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {filteredSkills.map((s) => {
          const isMaxed = s.curVal >= 100;
          const tierClass =
            s.tier === "Major"
              ? "border-[#8e7436] bg-[#1a150c]"
              : s.tier === "Minor"
              ? "border-[#5c4220] bg-[#16120b]"
              : "border-[#2a2318] bg-[#120f0a]";

          const badgeBg =
            s.tier === "Major"
              ? "bg-[#382b13] text-[#fde047]"
              : s.tier === "Minor"
              ? "bg-[#2d1e0d] text-[#fdba74]"
              : "bg-[#1f1911] text-[#9e8b6b]";

          return (
            <div
              key={s.skill}
              className={`p-2 border ${tierClass} flex items-center justify-between gap-2 text-xs shadow-sm`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-serif font-semibold text-[#f3e6c8] truncate" title={s.skill}>
                    {s.skill}
                  </span>
                  <span className="font-mono text-[9px] px-1 py-0.2 bg-[#241c12] text-[#d4b06a] border border-[#3e301f] shrink-0">
                    {s.govAbbr}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] px-1 py-0.2 uppercase font-serif font-bold ${badgeBg}`}>
                    {s.tier}
                  </span>
                  {s.gained > 0 && (
                    <span className="text-[10px] font-mono text-[#4ade80]">
                      +{s.gained} trained
                    </span>
                  )}
                </div>
              </div>

              {/* Stat Rating */}
              <div className="text-right shrink-0">
                <span
                  className={`font-mono text-sm font-bold ${
                    isMaxed ? "text-[#fde047]" : s.gained > 0 ? "text-[#4ade80]" : "text-[#f3e6c8]"
                  }`}
                >
                  {s.curVal}
                </span>
                {isMaxed && (
                  <span className="block text-[8px] font-mono font-bold text-[#fde047] uppercase leading-none">
                    MAX
                  </span>
                )}
                {!isMaxed && s.startVal !== s.curVal && (
                  <span className="block text-[9px] font-mono text-[#9e8b6b] leading-none">
                    base {s.startVal}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
