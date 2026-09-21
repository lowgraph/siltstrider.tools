"use client";
import { PROGRESSION_MODES } from "../../lib/level-math.mjs";

export default function LevelModeToggle({ mode, onModeChange }) {
  const isStatsOnly = mode === PROGRESSION_MODES.STATS_ONLY;

  return (
    <div className="level-mode-toggle-wrap bg-surface-2 p-3 border border-line-11 mw-groove-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
          Progression View:
        </span>
        <div className="inline-flex rounded-none p-0.5 bg-surface-7 border border-line-9">
          <button
            type="button"
            className={`mw-btn py-1 px-3 text-xs font-serif font-bold transition-all ${
              isStatsOnly ? "active ring-1 ring-accent" : "text-fg-11"
            }`}
            onClick={() => onModeChange(PROGRESSION_MODES.STATS_ONLY)}
            aria-pressed={isStatsOnly}
          >
            Stats Only
          </button>
          <button
            type="button"
            className={`mw-btn py-1 px-3 text-xs font-serif font-bold transition-all ${
              !isStatsOnly ? "active ring-1 ring-accent" : "text-fg-11"
            }`}
            onClick={() => onModeChange(PROGRESSION_MODES.STATS_AND_SKILLS)}
            aria-pressed={!isStatsOnly}
          >
            Stats &amp; Skills
          </button>
        </div>
      </div>
      <p className="text-[11px] text-fg-11 italic font-sans m-0">
        {isStatsOnly
          ? "Focuses on the 8 Primary Attributes, Vitals, and Health Growth projection."
          : "Full 27-skill matrix tracking Major, Minor, and Misc training points up to 100."}
      </p>
    </div>
  );
}
