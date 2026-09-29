"use client";
import { useEffect, useState } from "react";

export default function SeedBar({
  seed,
  seedExact = true,
  seedError = null,
  onApplySeed,
  onCopyLink,
  copiedLink,
  shareLink = null
}) {
  const [inputSeed, setInputSeed] = useState(seed || "");
  // Show the seed of whatever run is on screen, rolled or loaded.
  useEffect(() => { setInputSeed(seed || ""); }, [seed]);

  const handleSubmitSeed = (e) => {
    e.preventDefault();
    if (inputSeed.trim() && onApplySeed) {
      onApplySeed(inputSeed.trim());
    }
  };

  return (
    <div className="seed-bar-panel w-full p-3 sm:p-4 mb-5 border border-line-9 bg-surface-3 text-fg-2">
      {/* The difficulty presets live with the other roll settings in RunConfigurator (CHL-1). */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Deterministic Seed Input & Share Link */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSubmitSeed} className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-0">
            <label htmlFor="challenge-seed-input" className="text-xs uppercase tracking-wider text-fg-11 font-serif whitespace-nowrap">
              Seed:
            </label>
            <input
              id="challenge-seed-input"
              type="text"
              className="bg-surface-1 border border-line-7 px-2 py-1 text-xs font-mono text-accent w-48 sm:w-52 uppercase tracking-wider min-w-0"
              value={inputSeed}
              onChange={(e) => setInputSeed(e.target.value)}
              placeholder="K7Q2M-TR-EM-R3O2"
              aria-describedby="challenge-seed-note"
            />
            <button
              type="submit"
              className="mw-btn px-2.5 py-1 text-xs font-serif whitespace-nowrap shrink-0"
              title="Apply deterministic seed"
            >
              Load
            </button>
          </form>

          <button
            type="button"
            className="mw-btn px-3 py-1 text-xs font-serif font-bold text-accent flex items-center gap-1 whitespace-nowrap shrink-0"
            onClick={onCopyLink}
            title="Copy shareable challenge link"
          >
            {copiedLink ? "Copied" : "Share"}
          </button>
        </div>
      </div>
      <p id="challenge-seed-note" className="text-[11px] font-serif mt-2 mb-0 text-fg-11" role={seedError ? "alert" : undefined}>
        {seedError
          ? seedError
          : seed && !seedExact
            ? "Some cards were locked or rerolled, so this seed alone rolls a different run. Share the link to pass on this exact run."
            : "The seed carries the world, difficulty bands and counts: load it anywhere to roll the same run."}
      </p>
      {shareLink && (
        <label className="block text-[11px] font-serif mt-2 text-fg-7">
          Copy this link to share the run:
          <input
            type="text"
            readOnly
            className="mt-1 w-full bg-surface-1 border border-line-7 px-2 py-1 text-xs font-mono text-fg-4"
            value={shareLink}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
    </div>
  );
}
