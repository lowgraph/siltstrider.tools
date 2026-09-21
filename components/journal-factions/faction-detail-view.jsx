"use client";
import { useMemo, useState } from "react";
import {
  solvePromotionGaps,
  getHighestEligibleRank,
  getFactionReactions,
  getMutualExclusionConflict,
  getStatValue
} from "../../lib/faction-math.mjs";

export default function FactionDetailView({
  faction,
  character,
  membership,
  joinedFactionKeys = [],
  quests = [],
  onUpdateMembership
}) {
  if (!faction) {
    return (
      <div className="faction-detail-pane flex-1 flex items-center justify-center p-8 text-fg-14 italic font-serif">
        Select a faction from the roster to inspect rank requirements and standing.
      </div>
    );
  }

  const hasRanks = Array.isArray(faction.ranks) && faction.ranks.length > 0;
  const currentRankIdx = membership?.rank ?? -1;
  const isExpelled = Boolean(membership?.expelled);

  // Target rank for inspection (defaults to next promotion rank or highest eligible or rank 0)
  const [selectedTargetRank, setSelectedTargetRank] = useState(() => {
    if (currentRankIdx >= 0 && currentRankIdx < (faction.ranks?.length ?? 0) - 1) {
      return currentRankIdx + 1;
    }
    return 0;
  });

  // Simulated reputation control state
  const [testReputation, setTestReputation] = useState(() => membership?.reputation ?? 0);

  // Effective character including simulated reputation
  const effectiveChar = useMemo(() => {
    return {
      attributes: character?.attributes ?? {},
      skills: character?.skills ?? {},
      factionReputation: testReputation
    };
  }, [character, testReputation]);

  // Highest eligible rank
  const highestEligibleRankIdx = useMemo(() => {
    return hasRanks ? getHighestEligibleRank(faction, effectiveChar) : -1;
  }, [hasRanks, faction, effectiveChar]);

  // Solved promotion gaps for target rank
  const solver = useMemo(() => {
    if (!hasRanks) return null;
    return solvePromotionGaps(faction, currentRankIdx, effectiveChar, selectedTargetRank);
  }, [hasRanks, faction, currentRankIdx, effectiveChar, selectedTargetRank]);

  // Diplomacy
  const { allies, hostile, neutral } = useMemo(() => {
    return getFactionReactions(faction);
  }, [faction]);

  // Mutual exclusion check
  const conflict = useMemo(() => {
    return getMutualExclusionConflict(faction.key, joinedFactionKeys);
  }, [faction.key, joinedFactionKeys]);

  return (
    <article className="faction-detail-pane flex-1 overflow-y-auto p-4 md:p-6 bg-surface-3 text-fg-2">
      {/* Header Banner */}
      <header className="border-b-2 border-line-4 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-accent tracking-wide">
              {faction.name || faction.key}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-fg-14 font-serif">
              {faction.ownedPlacements > 0 && (
                <span>Landlord: <strong className="text-fg-6">{faction.ownedPlacements.toLocaleString()}</strong> placements</span>
              )}
              <span>•</span>
              <span>{hasRanks ? `${faction.ranks.length} Named Ranks` : "Non-Joinable"}</span>
              {faction.hidden && (
                <>
                  <span>•</span>
                  <span className="text-accent-4">Hidden / Secret Society</span>
                </>
              )}
            </div>
          </div>

          {/* Membership Quick Status */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {membership ? (
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-xs uppercase font-bold bg-surface-22 text-accent border border-accent">
                  {isExpelled ? "⚠ Expelled Member" : `Member · Rank ${membership.rank}`}
                </span>
                <div className="text-[11px] text-fg-14 mt-0.5">
                  Standing: <strong className="text-fg-6">{membership.reputation}</strong> Rep
                </div>
              </div>
            ) : hasRanks ? (
              highestEligibleRankIdx >= 0 ? (
                <span className="px-2.5 py-1 text-xs font-serif text-success-4 bg-success-surface-2 border border-success-line-4">
                  Eligible for Rank {highestEligibleRankIdx}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-serif text-fg-14 bg-surface-12 border border-line-9">
                  Stats Under Threshold
                </span>
              )
            ) : null}
          </div>
        </div>

        {/* Expelled Warning */}
        {isExpelled && (
          <div className="mt-4 p-3 bg-danger-surface-3 border-2 border-danger-line-1 text-danger-2 text-xs leading-relaxed font-serif">
            <strong className="text-danger-1 block mb-1">⚠ Expelled From Faction</strong>
            You have violated faction rules or attacked fellow members. Guild services, training, and questgivers will refuse to assist you until you seek atonement from a ranking officer.
          </div>
        )}

        {/* Rival House / Conflict Warning */}
        {conflict && !membership && (
          <div className="mt-4 p-3 bg-surface-15 border-2 border-warning-line text-fg-3 text-xs leading-relaxed font-serif">
            <strong className="text-fg-2 block mb-1">⚠ Mutual Exclusivity Warning: {conflict.category}</strong>
            {conflict.description} In Morrowind, joining rival organizations permanently locks progression in this faction.
          </div>
        )}

        {/* Favoured Attributes & Skills Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-line-9">
          <div>
            <span className="text-[11px] font-serif uppercase tracking-wider text-fg-14 block mb-1.5">
              Favoured Attributes (Both Required)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(faction.favouredAttributes || []).map(attr => (
                <span key={attr} className="px-2 py-0.5 text-xs font-serif bg-surface-12 border border-line-4 text-fg-2">
                  {attr.charAt(0).toUpperCase() + attr.slice(1)}: <strong className="text-accent">{getStatValue(character?.attributes, attr)}</strong>
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-serif uppercase tracking-wider text-fg-14 block mb-1.5">
              Favoured Skills (1 Primary + 2 Favoured Required)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(faction.skills || []).map(sk => (
                <span key={sk} className="px-2 py-0.5 text-xs font-serif bg-surface-12 border border-line-4 text-fg-2">
                  {sk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: <strong className="text-accent">{getStatValue(character?.skills, sk)}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Ranks & Promotion Track */}
      {hasRanks ? (
        <section className="mb-8">
          <h3 className="text-base font-serif font-bold text-accent mb-3 flex items-center justify-between">
            <span>Rank Progression Track (0 to {faction.ranks.length - 1})</span>
            <span className="text-xs text-fg-14 font-normal">Click rank to inspect requirements</span>
          </h3>

          {/* Stepper Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
            {faction.ranks.map(r => {
              const isHeld = currentRankIdx === r.index;
              const isSelected = selectedTargetRank === r.index;
              const isEligible = highestEligibleRankIdx >= r.index;

              return (
                <button
                  key={r.index}
                  type="button"
                  onClick={() => setSelectedTargetRank(r.index)}
                  className={`rank-stepper-btn p-2.5 text-left border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-surface-19 border-accent shadow-lg scale-[1.02]"
                      : isHeld
                      ? "bg-surface-13 border-accent/70"
                      : isEligible
                      ? "bg-success-surface-2 border-success-line-4"
                      : "bg-surface-8 border-line-9 opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-fg-14">Rank {r.index}</span>
                    {isHeld && (
                      <span className="text-[9px] uppercase font-bold text-accent bg-surface-3 px-1 py-0.2 border border-accent/50">
                        Current
                      </span>
                    )}
                    {!isHeld && isEligible && (
                      <span className="text-[10px] text-success-4" title="Requirements Met">✓</span>
                    )}
                  </div>
                  <div className={`font-serif text-xs font-semibold leading-tight ${
                    isSelected ? "text-accent" : "text-fg-2"
                  }`}>
                    {r.name}
                  </div>
                  <div className="text-[10px] text-fg-14 mt-1 font-mono">
                    Rep: {r.reputation}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Solver Card */}
          {solver && solver.targetRank && (
            <div className={`p-4 md:p-5 border-2 ${
              solver.eligible
                ? "bg-success-surface-2 border-success-line-2"
                : "bg-surface-12 border-line-4"
            }`}>
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-line-9">
                <div>
                  <span className="text-xs uppercase font-serif tracking-wider text-fg-14">Target Rank Qualification</span>
                  <h4 className="text-lg font-serif font-bold text-accent">
                    Rank {solver.targetRank.index}: {solver.targetRank.name}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  {solver.eligible ? (
                    <span className="px-3 py-1 bg-success-surface-3 border border-success-line-1 text-success-1 font-serif font-bold text-xs uppercase tracking-wide shadow">
                      ✓ All Requirements Met
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-danger-surface-3 border border-danger-line-1 text-danger-4 font-serif font-bold text-xs uppercase tracking-wide">
                      ✕ Requirements Deficient
                    </span>
                  )}
                </div>
              </div>

              {/* Gaps List if not eligible */}
              {!solver.eligible && solver.deficits?.length > 0 && (
                <div className="mb-4 p-3 bg-surface-8 border border-line-5 text-xs font-serif text-warning-1">
                  <strong className="block text-fg-2 mb-1">Needed for Promotion:</strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {solver.deficits.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirement Meters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-serif">
                {/* 1. Favoured Attributes */}
                <div className="bg-surface-6 p-3 border border-line-9">
                  <span className="text-fg-14 uppercase text-[10px] tracking-wider block mb-2 font-bold">
                    Favoured Attributes
                  </span>
                  <div className="space-y-2">
                    {solver.attributes.map(a => (
                      <div key={a.name}>
                        <div className="flex justify-between mb-0.5">
                          <span>{a.name.charAt(0).toUpperCase() + a.name.slice(1)}</span>
                          <span className={a.met ? "text-success-4" : "text-danger-7"}>
                            {a.current} / {a.required} {a.met ? "✓" : `(Need +${a.gap})`}
                          </span>
                        </div>
                        <div className="w-full bg-surface-2 h-1.5 border border-line-9 overflow-hidden">
                          <div
                            className={`h-full ${a.met ? "bg-success-surface-6" : "bg-danger-surface-5"}`}
                            style={{ width: `${Math.min(100, Math.round((a.current / Math.max(1, a.required)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Favoured Skills */}
                <div className="bg-surface-6 p-3 border border-line-9">
                  <span className="text-fg-14 uppercase text-[10px] tracking-wider block mb-2 font-bold">
                    Skills Thresholds
                  </span>
                  <div className="space-y-2">
                    {/* Primary */}
                    {solver.skills.primary && (
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span>Primary ({solver.skills.primary.name})</span>
                          <span className={solver.skills.primary.met ? "text-success-4" : "text-danger-7"}>
                            {solver.skills.primary.current} / {solver.skills.primary.required} {solver.skills.primary.met ? "✓" : `(+${solver.skills.primary.gap})`}
                          </span>
                        </div>
                        <div className="w-full bg-surface-2 h-1.5 border border-line-9 overflow-hidden">
                          <div
                            className={`h-full ${solver.skills.primary.met ? "bg-success-surface-6" : "bg-danger-surface-5"}`}
                            style={{ width: `${Math.min(100, Math.round((solver.skills.primary.current / Math.max(1, solver.skills.primary.required)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Favoured Skills */}
                    {solver.skills.favoured.map((f, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-0.5">
                          <span>Favoured #{i+2} ({f.name})</span>
                          <span className={f.met ? "text-success-4" : "text-danger-7"}>
                            {f.current} / {f.required} {f.met ? "✓" : `(+${f.gap})`}
                          </span>
                        </div>
                        <div className="w-full bg-surface-2 h-1.5 border border-line-9 overflow-hidden">
                          <div
                            className={`h-full ${f.met ? "bg-success-surface-6" : "bg-danger-surface-5"}`}
                            style={{ width: `${Math.min(100, Math.round((f.current / Math.max(1, f.required)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Faction Reputation */}
                <div className="bg-surface-6 p-3 border border-line-9">
                  <span className="text-fg-14 uppercase text-[10px] tracking-wider block mb-2 font-bold">
                    Faction Reputation
                  </span>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>Reputation</span>
                      <span className={solver.reputation.met ? "text-success-4" : "text-danger-7"}>
                        {solver.reputation.current} / {solver.reputation.required} {solver.reputation.met ? "✓" : `(Need +${solver.reputation.gap})`}
                      </span>
                    </div>
                    <div className="w-full bg-surface-2 h-1.5 border border-line-9 overflow-hidden mb-3">
                      <div
                        className={`h-full ${solver.reputation.met ? "bg-success-surface-6" : "bg-danger-surface-5"}`}
                        style={{ width: `${Math.min(100, Math.round((solver.reputation.current / Math.max(1, solver.reputation.required)) * 100))}%` }}
                      />
                    </div>

                    {/* Test Reputation Input */}
                    <div className="mt-2 pt-2 border-t border-line-9">
                      <label htmlFor="test-rep-input" className="text-[10px] text-fg-14 block mb-1">
                        Test Reputation Value:
                      </label>
                      <input
                        id="test-rep-input"
                        type="number"
                        min="0"
                        max="250"
                        value={testReputation}
                        onChange={e => setTestReputation(Number(e.target.value) || 0)}
                        className="w-full bg-surface-12 border border-line-4 px-2 py-1 text-xs text-fg-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="p-6 text-center text-sm font-serif text-fg-14 bg-surface-8 border border-line-9 mb-8">
          This faction has no named ranks in game records and admits no player characters.
        </div>
      )}

      {/* Diplomatic Standing (Reactions Matrix) */}
      <section className="mb-8">
        <h3 className="text-base font-serif font-bold text-accent mb-2">
          Diplomatic Standing &amp; Inter-Faction Relations
        </h3>
        <p className="text-xs text-fg-14 font-serif mb-4 leading-relaxed">
          NPCs calculate their base disposition towards you using their faction&apos;s attitude towards your factions, amplified by your rank.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allied Reactions */}
          <div className="bg-surface-6 p-3 border border-line-9">
            <span className="text-[11px] font-serif uppercase tracking-wider text-success-4 font-bold block mb-2">
              Allies &amp; Friendly (+1 to +3)
            </span>
            {allies.length === 0 ? (
              <span className="text-xs text-fg-14 italic">No formal allies recorded.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allies.map((r, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-serif bg-success-surface-2 border border-success-line-4 text-success-1">
                    {r.faction.replace(/\b\w/g, c => c.toUpperCase())}: <strong className="text-success-4">+{r.adjustment}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hostile Reactions */}
          <div className="bg-surface-6 p-3 border border-line-9">
            <span className="text-[11px] font-serif uppercase tracking-wider text-danger-7 font-bold block mb-2">
              Rivals &amp; Hostile (-1 to -3)
            </span>
            {hostile.length === 0 ? (
              <span className="text-xs text-fg-14 italic">No active hostile rivals.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {hostile.map((r, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-serif bg-danger-surface-2 border border-danger-line-2 text-danger-2">
                    {r.faction.replace(/\b\w/g, c => c.toUpperCase())}: <strong className="text-danger-7">{r.adjustment}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Linked Faction Quests */}
      <section>
        <h3 className="text-base font-serif font-bold text-accent mb-2 flex items-center justify-between">
          <span>Associated Faction Quests ({quests.length})</span>
        </h3>
        {quests.length === 0 ? (
          <div className="p-4 text-xs font-serif text-fg-14 bg-surface-6 border border-line-9 italic">
            No specific journal quests found registered under this faction prefix.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {quests.map(q => {
              const status = q.progress?.status || 'unstarted';
              return (
                <div
                  key={q.key}
                  className="p-2.5 bg-surface-8 border border-line-9 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="font-serif text-xs font-medium text-fg-2 block truncate">
                      {q.name}
                    </span>
                    <span className="text-[10px] text-fg-14 font-mono">
                      {q.key} {q.finishesAt?.length > 0 ? `· Finishes: ${q.finishesAt.join(',')}` : ''}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-serif uppercase tracking-wider shrink-0 border ${
                    status === 'finished'
                      ? "bg-success-surface-2 text-success-4 border-success-line-4"
                      : status === 'active'
                      ? "bg-surface-19 text-accent border-warning-line"
                      : "bg-surface-3 text-fg-14 border-line-11"
                  }`}>
                    {status === 'finished' ? "Completed" : status === 'active' ? `Active (Stage ${q.progress.stage})` : "Available"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
}
