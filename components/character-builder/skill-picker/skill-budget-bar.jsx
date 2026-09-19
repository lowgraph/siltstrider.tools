"use client";
import React from "react";

export default function SkillBudgetBar({
  majCount = 5,
  minCount = 5,
  viewMode = "matrix",
  onToggleViewMode
}) {
  const maxSlots = 5;

  const renderPips = (count, max, colorClass) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 border ${
              i < count
                ? `${colorClass} border-[#f3e6c8]`
                : "bg-[#18130c] border-[#382b1b]"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#120f0a] border border-[#2c2215] mw-groove-panel">
      {/* Allocation Counters */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Major Skills Budget */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#d4b06a]">
            Major:
          </span>
          {renderPips(majCount, maxSlots, "bg-[#d4b06a]")}
          <span
            className={`text-xs font-mono font-bold ${
              majCount === 5 ? "text-[#78c26d]" : "text-[#fca5a5]"
            }`}
          >
            [{majCount}/5]
          </span>
        </div>

        {/* Minor Skills Budget */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#d4b06a]">
            Minor:
          </span>
          {renderPips(minCount, maxSlots, "bg-[#9e8352]")}
          <span
            className={`text-xs font-mono font-bold ${
              minCount === 5 ? "text-[#78c26d]" : "text-[#fca5a5]"
            }`}
          >
            [{minCount}/5]
          </span>
        </div>
      </div>

      {/* View Switcher Toggle */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleViewMode("matrix")}
          className={`px-2.5 py-1 text-xs font-serif font-bold transition-all mw-btn ${
            viewMode === "matrix" ? "active text-[#f3e6c8]" : "text-[#9e8b6b]"
          }`}
          title="Switch to 27-skill Specialization Board"
        >
          ☷ Board
        </button>
        <button
          type="button"
          onClick={() => onToggleViewMode("slot")}
          className={`px-2.5 py-1 text-xs font-serif font-bold transition-all mw-btn ${
            viewMode === "slot" ? "active text-[#f3e6c8]" : "text-[#9e8b6b]"
          }`}
          title="Switch to 10-slot list view"
        >
          ☰ Slots
        </button>
      </div>
    </div>
  );
}
