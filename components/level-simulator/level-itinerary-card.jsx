"use client";
import { ATTR_ABBR } from "../../lib/level-math.mjs";

export default function LevelItineraryCard({ step, isStatsOnly = false }) {
  if (!step) {
    return (
      <div className="level-itinerary-card bg-[#100d08] p-4 border border-[#2a2318] text-center text-xs text-[#9e8b6b]">
        No step itinerary available for this level.
      </div>
    );
  }

  const {
    level,
    nextLevel,
    attributeBonuses = [],
    majorMinorIncreases = {},
    miscTraining = [],
    totalTrainingCost = 0,
    healthGain = 0,
    newEndurance = 0,
    newHealth = 0
  } = step;

  const mmEntries = Object.entries(majorMinorIncreases);

  return (
    <div className="level-itinerary-card space-y-3 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#221c13] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif text-sm font-bold text-[#f3e6c8]">
            Level {level} → <span className="text-[#d4b06a]">Level {nextLevel}</span>
          </span>
          <span className="text-xs px-2 py-0.5 bg-[#1b2a12] border border-[#2d471e] text-[#4ade80] font-mono font-bold">
            +{healthGain} HP Gain
          </span>
        </div>
        {totalTrainingCost > 0 && !isStatsOnly && (
          <div className="text-xs font-mono font-bold text-[#fde047] flex items-center gap-1">
            <span>🪙 ~{totalTrainingCost.toLocaleString()} Septims training cost</span>
          </div>
        )}
      </div>

      {/* 3 Attribute Level-Up Bonuses */}
      <div className="attribute-bonuses-block space-y-1.5">
        <h5 className="text-[11px] uppercase tracking-wider text-[#d4b06a] font-serif font-bold">
          Attribute Level-Up Picks ({attributeBonuses.length}/3)
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {attributeBonuses.map((b) => {
            const isMaxed = b.endValue >= 100;
            return (
              <div
                key={b.attribute}
                className="p-2 bg-[#16120b] border border-[#2f2518] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-serif font-bold text-[#f3e6c8] block">{b.attribute}</span>
                  <span className="text-[10px] font-mono text-[#9e8b6b]">
                    {b.startValue} → <strong className="text-[#f3e6c8]">{b.endValue}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-[#4ade80]">+{b.bonus}</span>
                  {isMaxed && (
                    <span className="block text-[8px] font-mono font-bold text-[#fde047] uppercase leading-none">
                      MAX
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {attributeBonuses.length === 0 && (
            <p className="text-xs text-[#9e8b6b] italic col-span-3">All attributes capped at 100.</p>
          )}
        </div>
      </div>

      {/* Major / Minor Skills Trigger (Stats & Skills Mode) */}
      {!isStatsOnly && (
        <div className="major-minor-block space-y-1">
          <h5 className="text-[11px] uppercase tracking-wider text-[#d4b06a] font-serif font-bold flex items-center justify-between">
            <span>Major / Minor Skill Allocation (10 Points to Level Up)</span>
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {mmEntries.map(([skill, pts]) => (
              <span
                key={skill}
                className="text-xs px-2 py-1 bg-[#1a140d] border border-[#3e301f] text-[#f3e6c8] font-serif flex items-center gap-1.5"
              >
                <span>{skill}:</span>
                <strong className="font-mono text-[#4ade80]">+{pts}</strong>
              </span>
            ))}
            {mmEntries.length === 0 && (
              <span className="text-xs text-[#9e8b6b] italic">No Major/Minor points allocated.</span>
            )}
          </div>
        </div>
      )}

      {/* Miscellaneous Skills To Train (Crucial Feature for 5x Multipliers) */}
      {!isStatsOnly && (
        <div className="misc-training-block space-y-1.5 p-3 bg-[#130f09] border border-[#3d2f19]">
          <div className="flex items-center justify-between gap-2 border-b border-[#2a2012] pb-1.5">
            <h5 className="text-xs uppercase tracking-wider text-[#fde047] font-serif font-bold flex items-center gap-1.5">
              <span>🎯 Miscellaneous Skills to Train (for 5x Multipliers)</span>
            </h5>
          </div>

          {miscTraining.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {miscTraining.map((m, idx) => (
                <div
                  key={`${m.skill}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-[#18130b] border border-[#332515] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#fde047] font-mono font-bold">•</span>
                    <span className="font-serif font-bold text-[#f3e6c8]">{m.skill}</span>
                    <span className="text-[10px] font-mono text-[#9e8b6b]">({m.startValue} → {m.endValue})</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#2a1c0d] border border-[#4a3219] text-[#fdba74] font-serif">
                      Gov: {m.attribute} (5x bonus)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-bold text-[#4ade80]">Train +{m.points} pts</span>
                    {m.cost > 0 && <span className="text-[#d4b06a]">~{m.cost}g</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9e8b6b] italic m-0 pt-1">
              ✓ No Miscellaneous training required for this level (all multipliers satisfied by Major/Minor increases or Luck +1).
            </p>
          )}
        </div>
      )}

      {isStatsOnly && (
        <div className="text-[11px] text-[#9e8b6b] italic">
          Stats Only mode simulates attribute and vitals progression directly without micromanaging skill training. Switch to Stats &amp; Skills mode for exact trainer recommendations.
        </div>
      )}
    </div>
  );
}
