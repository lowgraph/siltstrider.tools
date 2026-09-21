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
    <div className="major-objective-plaque border-2 border-accent/40 bg-surface-4 p-4 text-fg-2 relative shadow-md">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-line-9">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-accent inline-block transform rotate-45" />
          <h4 className="text-sm font-serif uppercase tracking-widest text-accent font-bold">
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
              isLocked ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
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
            <p className="text-base font-serif font-bold text-fg-2 leading-relaxed">
              {major}
            </p>
            {regions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-fg-11 font-serif uppercase">Region:</span>
                {regions.map((r) => (
                  <span key={r} className="region-tag text-xs px-2 py-0.5 bg-surface-14 border border-line-7 text-fg-4">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-fg-15 py-2">
            No major objective rolled yet. Click Generate Run to roll your victory condition.
          </p>
        )}
      </div>
    </div>
  );
}
