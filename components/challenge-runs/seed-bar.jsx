"use client";
import { useState } from "react";
import { DIFFICULTY_PRESETS } from "../../lib/challenge-math.mjs";

export default function SeedBar({
  seed,
  onSeedChange,
  onApplySeed,
  activePreset,
  onSelectPreset,
  onCopyLink,
  copiedLink
}) {
  const [inputSeed, setInputSeed] = useState(seed || "");

  const handleSubmitSeed = (e) => {
    e.preventDefault();
    if (inputSeed.trim() && onApplySeed) {
      onApplySeed(inputSeed.trim());
    }
  };

  return (
    <div className="seed-bar-panel w-full p-3 sm:p-4 mb-5 border border-[#3a2e1d] bg-[#14100a] text-[#f3e6c8]">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Difficulty Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs uppercase tracking-wider text-[#d4b06a] font-serif font-bold mr-1">
            Preset:
          </span>
          {Object.values(DIFFICULTY_PRESETS).map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`mw-btn px-2.5 sm:px-3 py-1.5 text-xs font-serif font-bold tracking-wide transition-all whitespace-nowrap ${
                  isActive ? "active ring-1 ring-[#d4b06a] text-[#d4b06a]" : "text-[#c2b291]"
                }`}
                onClick={() => onSelectPreset(p.id)}
                title={p.description}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Deterministic Seed Input & Share Link */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#2a2215]">
          <form onSubmit={handleSubmitSeed} className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-0">
            <label htmlFor="challenge-seed-input" className="text-xs uppercase tracking-wider text-[#9b8b6a] font-serif whitespace-nowrap">
              Seed:
            </label>
            <input
              id="challenge-seed-input"
              type="text"
              className="bg-[#0c0906] border border-[#4a3b26] px-2 py-1 text-xs font-mono text-[#d4b06a] w-32 sm:w-36 uppercase tracking-wider min-w-0"
              value={inputSeed}
              onChange={(e) => setInputSeed(e.target.value)}
              placeholder="SEED-XXXX-WORLD"
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
            className="mw-btn px-3 py-1 text-xs font-serif font-bold text-[#d4b06a] flex items-center gap-1 whitespace-nowrap shrink-0"
            onClick={onCopyLink}
            title="Copy shareable challenge link"
          >
            {copiedLink ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
