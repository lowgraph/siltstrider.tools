"use client";
import { PROGRESSION_MODES } from "../../lib/level-math.mjs";

export default function LevelModeToggle({ mode, onModeChange }) {
  const isStatsOnly = mode === PROGRESSION_MODES.STATS_ONLY;

  return (
    <div className="level-mode-toggle-wrap bg-[#100d08] p-3 border border-[#2a2318] mw-groove-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
          Progression View:
        </span>
        <div className="inline-flex rounded-none p-0.5 bg-[#18140e] border border-[#3a3020]">
          <button
            type="button"
            className={`mw-btn py-1 px-3 text-xs font-serif font-bold transition-all ${
              isStatsOnly ? "active ring-1 ring-[#d4b06a]" : "text-[#9e8b6b]"
            }`}
            onClick={() => onModeChange(PROGRESSION_MODES.STATS_ONLY)}
            aria-pressed={isStatsOnly}
          >
            Stats Only
          </button>
          <button
            type="button"
            className={`mw-btn py-1 px-3 text-xs font-serif font-bold transition-all ${
              !isStatsOnly ? "active ring-1 ring-[#d4b06a]" : "text-[#9e8b6b]"
            }`}
            onClick={() => onModeChange(PROGRESSION_MODES.STATS_AND_SKILLS)}
            aria-pressed={!isStatsOnly}
          >
            Stats &amp; Skills
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#9e8b6b] italic font-sans m-0">
        {isStatsOnly
          ? "Focuses on the 8 Primary Attributes, Vitals, and Health Growth projection."
          : "Full 27-skill matrix tracking Major, Minor, and Misc training points up to 100."}
      </p>
    </div>
  );
}
