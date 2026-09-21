"use client";
import { band } from "../../lib/challenge-math.mjs";

export default function RestrictionsTablet({
  restrictions = [],
  restNote = "",
  isLocked,
  onToggleLock,
  onRollRestrictions
}) {
  return (
    <div className="restrictions-tablet border border-line-9 bg-surface-3 p-4 text-fg-2">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-line-11">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
            Active Restrictions
          </span>
          <span className="text-xs px-2 py-0.5 bg-surface-14 border border-line-9 text-fg-7 font-mono">
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
              Roll
            </button>
          )}

          <button
            type="button"
            className={`px-2 py-0.5 text-xs border rounded-none font-serif ${
              isLocked ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
            }`}
            onClick={onToggleLock}
            title={isLocked ? "Unlock Restrictions" : "Lock Restrictions"}
          >
            {isLocked ? "Locked" : "Lock"}
          </button>
        </div>
      </div>

      {/* Restrictions List */}
      {restrictions.length > 0 ? (
        <ul className="space-y-2.5">
          {restrictions.map((r, i) => {
            const b = band(r);
            return (
              <li
                key={i}
                className="flex items-start gap-2.5 p-2 bg-surface-5 border border-line-11 hover:border-line-7 transition-colors"
              >
                <span
                  className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 border shrink-0 mt-0.5 font-mono bg-surface-14 border-line-9 text-accent"
                >
                  {b}
                </span>
                <span className="text-sm font-serif text-fg-4 leading-relaxed">
                  {r}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm italic text-fg-15 py-2">
          No restrictions rolled. Use Generate Run to pick active challenge modifiers.
        </p>
      )}

      {/* Note or warnings */}
      {restNote && (
        <div className="mt-3 p-2 bg-surface-13 border border-line-4 text-xs text-fg-4">
          {restNote}
        </div>
      )}
    </div>
  );
}
