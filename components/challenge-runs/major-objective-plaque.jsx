"use client";
import { regionsIn } from "../../lib/challenge-math.mjs";

export default function MajorObjectivePlaque({
  major,
  isLocked,
  onToggleLock,
  onRollMajor
}) {
  const regions = major ? regionsIn(major) : [];

  return (
    <div className="major-objective-plaque border-2 border-[#d4b06a]/40 bg-[#16120b] p-4 text-[#f3e6c8] relative shadow-md">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3a2e1d]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#d4b06a] inline-block transform rotate-45" />
          <h4 className="text-sm font-serif uppercase tracking-widest text-[#d4b06a] font-bold">
            Major Objective
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          {onRollMajor && (
            <button
              type="button"
              className="mw-btn px-2 py-0.5 text-xs font-serif"
              onClick={onRollMajor}
              title="Roll another major objective"
              disabled={isLocked}
            >
              Roll
            </button>
          )}

          <button
            type="button"
            className={`px-2 py-0.5 text-xs border rounded-none font-serif ${
              isLocked ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "bg-[#14100a] border-[#3a2e1d] text-[#8e7e65]"
            }`}
            onClick={onToggleLock}
            title={isLocked ? "Unlock Major Objective" : "Lock Major Objective"}
          >
            {isLocked ? "Locked" : "Lock"}
          </button>
        </div>
      </div>

      {/* Main Goal Banner */}
      <div className="py-2">
        {major ? (
          <div>
            <p className="text-base font-serif font-bold text-[#fce8bb] leading-relaxed">
              {major}
            </p>
            {regions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-[#9b8b6a] font-serif uppercase">Region:</span>
                {regions.map((r) => (
                  <span key={r} className="region-tag text-xs px-2 py-0.5 bg-[#251e13] border border-[#4a3b26] text-[#e0cfab]">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-[#7a6b52] py-2">
            No major objective rolled yet. Click Generate Run to roll your victory condition.
          </p>
        )}
      </div>
    </div>
  );
}
