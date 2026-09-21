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
    <div className="skill-progression-matrix space-y-3 bg-surface-2 p-4 border border-line-11 mw-groove-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-12 pb-2">
        <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
          27-Skill Progression Matrix
        </h4>

        {/* Category Tabs */}
        <div className="inline-flex rounded-none p-0.5 bg-surface-7 border border-line-9 text-xs">
          {["all", "Combat", "Magic", "Stealth"].map((spec) => (
            <button
              key={spec}
              type="button"
              className={`mw-btn py-1 px-2.5 text-[11px] font-serif font-bold transition-all ${
                selectedSpec === spec ? "active ring-1 ring-accent" : "text-fg-11"
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
              ? "border-accent-5 bg-surface-5"
              : s.tier === "Minor"
              ? "border-line-5 bg-surface-4"
              : "border-line-11 bg-surface-2";

          const badgeBg =
            s.tier === "Major"
              ? "bg-surface-20 text-accent"
              : s.tier === "Minor"
              ? "bg-surface-15 text-fg-8"
              : "bg-surface-9 text-fg-11";

          return (
            <div
              key={s.skill}
              className={`p-2 border ${tierClass} flex items-center justify-between gap-2 text-xs shadow-sm`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-serif font-semibold text-fg-2 truncate" title={s.skill}>
                    {s.skill}
                  </span>
                  <span className="font-mono text-[9px] px-1 py-0.2 bg-surface-12 text-accent border border-line-9 shrink-0">
                    {s.govAbbr}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] px-1 py-0.2 uppercase font-serif font-bold ${badgeBg}`}>
                    {s.tier}
                  </span>
                  {s.gained > 0 && (
                    <span className="text-[10px] font-mono text-accent">
                      +{s.gained} trained
                    </span>
                  )}
                </div>
              </div>

              {/* Stat Rating */}
              <div className="text-right shrink-0">
                <span
                  className={`font-mono text-sm font-bold ${
                    isMaxed ? "text-accent" : "text-fg-2"
                  }`}
                >
                  {s.curVal}
                </span>
                {isMaxed && (
                  <span className="block text-[8px] font-mono font-bold text-accent uppercase leading-none">
                    MAX
                  </span>
                )}
                {!isMaxed && s.startVal !== s.curVal && (
                  <span className="block text-[9px] font-mono text-fg-11 leading-none">
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
