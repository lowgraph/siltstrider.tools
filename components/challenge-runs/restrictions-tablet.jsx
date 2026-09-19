"use client";
import { band } from "../../lib/challenge-math.mjs";

const BADGE_STYLES = {
  Easy: "bg-[#18301c] border-[#2d6136] text-[#7de091]",
  Medium: "bg-[#332b13] border-[#7d6520] text-[#eed072]",
  Hard: "bg-[#381614] border-[#7d2922] text-[#f28e85]",
  Grind: "bg-[#251d2f] border-[#573a78] text-[#c9a7f5]"
};

export default function RestrictionsTablet({
  restrictions = [],
  restNote = "",
  isLocked,
  onToggleLock,
  onRollRestrictions
}) {
  return (
    <div className="restrictions-tablet border border-[#3a2e1d] bg-[#14100a] p-4 text-[#f3e6c8]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2a2215]">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Active Restrictions
          </span>
          <span className="text-xs px-2 py-0.5 bg-[#251e13] border border-[#3d301e] text-[#c2b291] font-mono">
            {restrictions.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onRollRestrictions && (
            <button
              type="button"
              className="mw-btn px-2 py-0.5 text-xs font-serif"
              onClick={onRollRestrictions}
              title="Re-roll active restrictions"
              disabled={isLocked}
            >
              🎲 Roll
            </button>
          )}

          <button
            type="button"
            className={`px-2 py-0.5 text-xs border rounded-none font-serif ${
              isLocked ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "border-[#3a2e1d] text-[#8e7e65]"
            }`}
            onClick={onToggleLock}
            title={isLocked ? "Unlock Restrictions" : "Lock Restrictions"}
          >
            {isLocked ? "🔒 Locked" : "🔓 Lock"}
          </button>
        </div>
      </div>

      {/* Restrictions List */}
      {restrictions.length > 0 ? (
        <ul className="space-y-2.5">
          {restrictions.map((r, i) => {
            const b = band(r);
            const style = BADGE_STYLES[b] || BADGE_STYLES.Medium;
            return (
              <li
                key={i}
                className="flex items-start gap-2.5 p-2 bg-[#19140c] border border-[#2a2114] hover:border-[#4a3920] transition-colors"
              >
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 border shrink-0 mt-0.5 font-mono ${style}`}
                >
                  {b}
                </span>
                <span className="text-sm font-serif text-[#ebd9b2] leading-relaxed">
                  {r}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm italic text-[#7a6b52] py-2">
          No restrictions rolled. Use Generate Run to pick active challenge modifiers.
        </p>
      )}

      {/* Note or warnings */}
      {restNote && (
        <div className="mt-3 p-2 bg-[#261d12] border border-[#523e20] text-xs text-[#d9c49c]">
          {restNote}
        </div>
      )}
    </div>
  );
}
