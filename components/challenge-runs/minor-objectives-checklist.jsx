"use client";
import { useState, useEffect } from "react";
import { regionsIn } from "../../lib/challenge-math.mjs";

export default function MinorObjectivesChecklist({
  objectives = [],
  isLocked,
  onToggleLock,
  onRollObjectives
}) {
  const [completed, setCompleted] = useState({});

  // Reset or initialize completed states when objectives change
  useEffect(() => {
    setCompleted({});
  }, [objectives]);

  const toggleCheck = (idx) => {
    setCompleted((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="minor-objectives-checklist border border-line-9 bg-surface-3 p-4 text-fg-2">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-line-11">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
            Minor Objectives
          </span>
          <span className="text-xs px-2 py-0.5 bg-surface-14 border border-line-9 text-fg-7 font-mono">
            {objectives.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onRollObjectives && (
            <button
              type="button"
              className="mw-btn px-2 py-0.5 text-xs font-serif"
              onClick={onRollObjectives}
              title="Re-roll minor objectives"
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
            title={isLocked ? "Unlock Minor Objectives" : "Lock Minor Objectives"}
          >
            {isLocked ? "Locked" : "Lock"}
          </button>
        </div>
      </div>

      {/* Objectives List */}
      {objectives.length > 0 ? (
        <ul className="space-y-2">
          {objectives.map((obj, i) => {
            const text = typeof obj === "string" ? obj : obj.text;
            const isDone = !!completed[i];
            const regions = regionsIn(text);

            return (
              <li
                key={i}
                className={`p-2.5 bg-surface-5 border transition-colors flex items-start gap-3 cursor-pointer select-none ${
                  isDone ? "border-success-line-5 bg-success-surface-1/40 opacity-75" : "border-line-11 hover:border-line-7"
                }`}
                onClick={() => toggleCheck(i)}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleCheck(i)}
                  className="mt-1 accent-accent cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <span
                    className={`text-sm font-serif leading-relaxed block ${
                      isDone ? "line-through text-success-6" : "text-fg-4"
                    }`}
                  >
                    {text}
                  </span>
                  {regions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 items-center">
                      {regions.map((r) => (
                        <span
                          key={r}
                          className="region-tag text-[11px] px-1.5 py-0.5 bg-surface-14 border border-line-9 text-fg-7"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm italic text-fg-15 py-2">
          No minor objectives selected. Pick 1–5 optional world milestones.
        </p>
      )}
    </div>
  );
}
