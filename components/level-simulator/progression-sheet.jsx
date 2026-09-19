"use client";
import VitalsBar from "../character-builder/vitals-bar";
import HealthGrowthChart from "./health-growth-chart";
import SkillProgressionMatrix from "./skill-progression-matrix";
import { ATTRS, ATTR_ABBR } from "../../lib/level-math.mjs";

export default function ProgressionSheet({
  character,
  currentState,
  initialSheet,
  mode,
  catalogs,
  targetLevel
}) {
  const isStatsOnly = mode === "stats_only";
  const state = currentState || initialSheet;

  if (!state) {
    return (
      <div className="progression-sheet p-8 text-center bg-[#181510] border-6 border-transparent mw-border-panel text-xs text-[#9e8b6b]">
        Loading progression sheet…
      </div>
    );
  }

  const {
    level = 1,
    levelCap = 60,
    attributes = {},
    skills = {},
    health = 50,
    magicka = 40,
    fatigue = 180,
    race = "Dark Elf",
    gender = "Male",
    sign = "The Lady",
    className = "Custom",
    bitterCup = null,
    maj = [],
    min = []
  } = state;

  const initAttrs = initialSheet?.attributes || attributes;
  const initSkills = initialSheet?.skills || skills;

  return (
    <div
      className="progression-sheet px-6 sm:px-10 py-7 space-y-6 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Header Bar */}
      <div className="border-b border-[#2a2318] pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#f3e6c8] tracking-wide flex items-center gap-2">
            <span>{character?.name || className}</span>
            <span className="text-xs px-2 py-0.5 bg-[#251a0e] border border-[#4a341b] text-[#d4b06a] font-serif font-bold">
              Level {level}
            </span>
          </h3>
          <p className="text-xs text-[#9e8b6b] font-mono mt-0.5">
            {gender} {race} · {sign}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-serif text-[#9e8b6b]">
            Theoretical Cap: <strong className="font-mono text-[#f3e6c8]">Lvl {levelCap}</strong>
          </div>
          {bitterCup && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#2a1b0c] border border-[#4d3215] text-[#d4b06a] font-serif font-bold inline-block mt-1">
              Bitter Cup (+{bitterCup.highest} / -{bitterCup.lowest})
            </span>
          )}
        </div>
      </div>

      {/* Leveled Vitals */}
      <div className="vitals-section space-y-2 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
        <div className="flex items-center justify-between border-b border-[#221c13] pb-1.5 mb-2">
          <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Leveled Vitals (Level {level})
          </h4>
          <span className="text-[10px] font-mono text-[#d4b06a]">
            +{Math.max(0, health - (initialSheet?.health || health))} Total HP Gained
          </span>
        </div>
        <VitalsBar label="Health" kind="health" value={health} max={health} />
        <VitalsBar label="Magicka" kind="magicka" value={magicka} max={magicka} />
        <VitalsBar label="Fatigue" kind="fatigue" value={fatigue} max={fatigue} />
      </div>

      {/* Primary Attributes Grid */}
      <div className="attributes-section space-y-2 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
        <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#221c13] pb-1.5 mb-2">
          Primary Attributes
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ATTRS.map((attr) => {
            const baseVal = initAttrs[attr] ?? 40;
            const curVal = attributes[attr] ?? baseVal;
            const diff = curVal - baseVal;
            const isMaxed = curVal >= 100;

            return (
              <div
                key={attr}
                className="p-2 bg-[#16120b] border border-[#2f2518] flex items-center justify-between text-xs shadow-sm"
              >
                <div>
                  <span className="font-serif font-semibold text-[#f3e6c8] block">{attr}</span>
                  <span className="text-[10px] font-mono text-[#9e8b6b]">
                    base {baseVal}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-sm font-bold ${
                      isMaxed ? "text-[#d4b06a]" : "text-[#f3e6c8]"
                    }`}
                  >
                    {curVal}
                  </span>
                  {isMaxed ? (
                    <span className="block text-[8px] font-mono font-bold text-[#d4b06a] uppercase leading-none">
                      MAX
                    </span>
                  ) : diff > 0 ? (
                    <span className="block text-[9px] font-mono text-[#d4b06a] leading-none">
                      +{diff}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Growth Chart */}
      <HealthGrowthChart
        character={initialSheet}
        targetLevel={targetLevel || levelCap}
        catalogs={catalogs}
        options={{ bitterCup: Boolean(bitterCup) }}
      />

      {/* 27-Skill Progression Matrix (Only in Stats & Skills Mode) */}
      {!isStatsOnly && (
        <SkillProgressionMatrix
          initialSkills={initSkills}
          currentSkills={skills}
          maj={maj}
          min={min}
        />
      )}
    </div>
  );
}
