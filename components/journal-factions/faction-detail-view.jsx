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
      <div className="faction-detail-pane flex-1 flex items-center justify-center p-8 text-[#8c7853] italic font-serif">
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
    <article className="faction-detail-pane flex-1 overflow-y-auto p-4 md:p-6 bg-[#17120c] text-[#f3e6c8]">
      {/* Header Banner */}
      <header className="border-b-2 border-[#5c4827] pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#d4b06a] tracking-wide">
              {faction.name || faction.key}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#8c7853] font-serif">
              {faction.ownedPlacements > 0 && (
                <span>Landlord: <strong className="text-[#c9b88e]">{faction.ownedPlacements.toLocaleString()}</strong> placements</span>
              )}
              <span>•</span>
              <span>{hasRanks ? `${faction.ranks.length} Named Ranks` : "Non-Joinable"}</span>
              {faction.hidden && (
                <>
                  <span>•</span>
                  <span className="text-[#a6824a]">Hidden / Secret Society</span>
                </>
              )}
            </div>
          </div>

          {/* Membership Quick Status */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {membership ? (
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-xs uppercase font-bold bg-[#3d301b] text-[#d4b06a] border border-[#d4b06a]">
                  {isExpelled ? "⚠ Expelled Member" : `Member · Rank ${membership.rank}`}
                </span>
                <div className="text-[11px] text-[#8c7853] mt-0.5">
                  Standing: <strong className="text-[#c9b88e]">{membership.reputation}</strong> Rep
                </div>
              </div>
            ) : hasRanks ? (
              highestEligibleRankIdx >= 0 ? (
                <span className="px-2.5 py-1 text-xs font-serif text-[#9bc37e] bg-[#1a2916] border border-[#3e5f2e]">
                  Eligible for Rank {highestEligibleRankIdx}
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-serif text-[#8c7853] bg-[#241c13] border border-[#3d301b]">
                  Stats Under Threshold
                </span>
              )
            ) : null}
          </div>
        </div>

        {/* Expelled Warning */}
        {isExpelled && (
          <div className="mt-4 p-3 bg-[#3d1a1a] border-2 border-[#8c2a2a] text-[#ffb3b3] text-xs leading-relaxed font-serif">
            <strong className="text-[#ffd6d6] block mb-1">⚠ Expelled From Faction</strong>
            You have violated faction rules or attacked fellow members. Guild services, training, and questgivers will refuse to assist you until you seek atonement from a ranking officer.
          </div>
        )}

        {/* Rival House / Conflict Warning */}
        {conflict && !membership && (
          <div className="mt-4 p-3 bg-[#332211] border-2 border-[#8c592a] text-[#ffd9b3] text-xs leading-relaxed font-serif">
            <strong className="text-[#ffebcc] block mb-1">⚠ Mutual Exclusivity Warning: {conflict.category}</strong>
            {conflict.description} In Morrowind, joining rival organizations permanently locks progression in this faction.
          </div>
        )}

        {/* Favoured Attributes & Skills Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#3d301b]">
          <div>
            <span className="text-[11px] font-serif uppercase tracking-wider text-[#8c7853] block mb-1.5">
              Favoured Attributes (Both Required)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(faction.favouredAttributes || []).map(attr => (
                <span key={attr} className="px-2 py-0.5 text-xs font-serif bg-[#241c13] border border-[#5c4827] text-[#f3e6c8]">
                  {attr.charAt(0).toUpperCase() + attr.slice(1)}: <strong className="text-[#d4b06a]">{getStatValue(character?.attributes, attr)}</strong>
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-serif uppercase tracking-wider text-[#8c7853] block mb-1.5">
              Favoured Skills (1 Primary + 2 Favoured Required)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(faction.skills || []).map(sk => (
                <span key={sk} className="px-2 py-0.5 text-xs font-serif bg-[#241c13] border border-[#5c4827] text-[#f3e6c8]">
                  {sk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: <strong className="text-[#d4b06a]">{getStatValue(character?.skills, sk)}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Ranks & Promotion Track */}
      {hasRanks ? (
        <section className="mb-8">
          <h3 className="text-base font-serif font-bold text-[#d4b06a] mb-3 flex items-center justify-between">
            <span>Rank Progression Track (0 to {faction.ranks.length - 1})</span>
            <span className="text-xs text-[#8c7853] font-normal">Click rank to inspect requirements</span>
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
                      ? "bg-[#332517] border-[#d4b06a] shadow-lg scale-[1.02]"
                      : isHeld
                      ? "bg-[#281f14] border-[#d4b06a]/70"
                      : isEligible
                      ? "bg-[#1c2617] border-[#3e5f2e]"
                      : "bg-[#201811] border-[#3d301b] opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono text-[#8c7853]">Rank {r.index}</span>
                    {isHeld && (
                      <span className="text-[9px] uppercase font-bold text-[#d4b06a] bg-[#14100a] px-1 py-0.2 border border-[#d4b06a]/50">
                        Current
                      </span>
                    )}
                    {!isHeld && isEligible && (
                      <span className="text-[10px] text-[#9bc37e]" title="Requirements Met">✓</span>
                    )}
                  </div>
                  <div className={`font-serif text-xs font-semibold leading-tight ${
                    isSelected ? "text-[#d4b06a]" : "text-[#f3e6c8]"
                  }`}>
                    {r.name}
                  </div>
                  <div className="text-[10px] text-[#8c7853] mt-1 font-mono">
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
                ? "bg-[#1d2918] border-[#4b7a35]"
                : "bg-[#241c13] border-[#5c4827]"
            }`}>
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#3d301b]">
                <div>
                  <span className="text-xs uppercase font-serif tracking-wider text-[#8c7853]">Target Rank Qualification</span>
                  <h4 className="text-lg font-serif font-bold text-[#d4b06a]">
                    Rank {solver.targetRank.index}: {solver.targetRank.name}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  {solver.eligible ? (
                    <span className="px-3 py-1 bg-[#28401e] border border-[#5fa33e] text-[#b4e698] font-serif font-bold text-xs uppercase tracking-wide shadow">
                      ✓ All Requirements Met
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-[#3d201b] border border-[#8c3d2e] text-[#f29a8a] font-serif font-bold text-xs uppercase tracking-wide">
                      ✕ Requirements Deficient
                    </span>
                  )}
                </div>
              </div>

              {/* Gaps List if not eligible */}
              {!solver.eligible && solver.deficits?.length > 0 && (
                <div className="mb-4 p-3 bg-[#1e1710] border border-[#5c3e27] text-xs font-serif text-[#e6b98d]">
                  <strong className="block text-[#f3e6c8] mb-1">Needed for Promotion:</strong>
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
                <div className="bg-[#19130c] p-3 border border-[#3d301b]">
                  <span className="text-[#8c7853] uppercase text-[10px] tracking-wider block mb-2 font-bold">
                    Favoured Attributes
                  </span>
                  <div className="space-y-2">
                    {solver.attributes.map(a => (
                      <div key={a.name}>
                        <div className="flex justify-between mb-0.5">
                          <span>{a.name.charAt(0).toUpperCase() + a.name.slice(1)}</span>
                          <span className={a.met ? "text-[#9bc37e]" : "text-[#d67373]"}>
                            {a.current} / {a.required} {a.met ? "✓" : `(Need +${a.gap})`}
                          </span>
                        </div>
                        <div className="w-full bg-[#120e0a] h-1.5 border border-[#3d301b] overflow-hidden">
                          <div
                            className={`h-full ${a.met ? "bg-[#5fa33e]" : "bg-[#a64a3d]"}`}
                            style={{ width: `${Math.min(100, Math.round((a.current / Math.max(1, a.required)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Favoured Skills */}
                <div className="bg-[#19130c] p-3 border border-[#3d301b]">
                  <span className="text-[#8c7853] uppercase text-[10px] tracking-wider block mb-2 font-bold">
                    Skills Thresholds
                  </span>
                  <div className="space-y-2">
                    {/* Primary */}
                    {solver.skills.primary && (
                      <div>
                        <div className="flex justify-between mb-0.5">
                          <span>Primary ({solver.skills.primary.name})</span>
                          <span className={solver.skills.primary.met ? "text-[#9bc37e]" : "text-[#d67373]"}>
                            {solver.skills.primary.current} / {solver.skills.primary.required} {solver.skills.primary.met ? "✓" : `(+${solver.skills.primary.gap})`}
                          </span>
                        </div>
                        <div className="w-full bg-[#120e0a] h-1.5 border border-[#3d301b] overflow-hidden">
                          <div
                            className={`h-full ${solver.skills.primary.met ? "bg-[#5fa33e]" : "bg-[#a64a3d]"}`}
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
                          <span className={f.met ? "text-[#9bc37e]" : "text-[#d67373]"}>
                            {f.current} / {f.required} {f.met ? "✓" : `(+${f.gap})`}
                          </span>
                        </div>
                        <div className="w-full bg-[#120e0a] h-1.5 border border-[#3d301b] overflow-hidden">
                          <div
                            className={`h-full ${f.met ? "bg-[#5fa33e]" : "bg-[#a64a3d]"}`}
                            style={{ width: `${Math.min(100, Math.round((f.current / Math.max(1, f.required)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Faction Reputation */}
                <div className="bg-[#19130c] p-3 border border-[#3d301b]">
                  <span className="text-[#8c7853] uppercase text-[10px] tracking-wider block mb-2 font-bold">
                    Faction Reputation
                  </span>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span>Reputation</span>
                      <span className={solver.reputation.met ? "text-[#9bc37e]" : "text-[#d67373]"}>
                        {solver.reputation.current} / {solver.reputation.required} {solver.reputation.met ? "✓" : `(Need +${solver.reputation.gap})`}
                      </span>
                    </div>
                    <div className="w-full bg-[#120e0a] h-1.5 border border-[#3d301b] overflow-hidden mb-3">
                      <div
                        className={`h-full ${solver.reputation.met ? "bg-[#5fa33e]" : "bg-[#a64a3d]"}`}
                        style={{ width: `${Math.min(100, Math.round((solver.reputation.current / Math.max(1, solver.reputation.required)) * 100))}%` }}
                      />
                    </div>

                    {/* Test Reputation Input */}
                    <div className="mt-2 pt-2 border-t border-[#3d301b]">
                      <label htmlFor="test-rep-input" className="text-[10px] text-[#8c7853] block mb-1">
                        Test Reputation Value:
                      </label>
                      <input
                        id="test-rep-input"
                        type="number"
                        min="0"
                        max="250"
                        value={testReputation}
                        onChange={e => setTestReputation(Number(e.target.value) || 0)}
                        className="w-full bg-[#241c13] border border-[#5c4827] px-2 py-1 text-xs text-[#f3e6c8]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="p-6 text-center text-sm font-serif text-[#8c7853] bg-[#201811] border border-[#3d301b] mb-8">
          This faction has no named ranks in game records and admits no player characters.
        </div>
      )}

      {/* Diplomatic Standing (Reactions Matrix) */}
      <section className="mb-8">
        <h3 className="text-base font-serif font-bold text-[#d4b06a] mb-2">
          Diplomatic Standing &amp; Inter-Faction Relations
        </h3>
        <p className="text-xs text-[#8c7853] font-serif mb-4 leading-relaxed">
          NPCs calculate their base disposition towards you using their faction&apos;s attitude towards your factions, amplified by your rank.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allied Reactions */}
          <div className="bg-[#1b1610] p-3 border border-[#3d301b]">
            <span className="text-[11px] font-serif uppercase tracking-wider text-[#9bc37e] font-bold block mb-2">
              Allies &amp; Friendly (+1 to +3)
            </span>
            {allies.length === 0 ? (
              <span className="text-xs text-[#8c7853] italic">No formal allies recorded.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allies.map((r, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-serif bg-[#182614] border border-[#3e5f2e] text-[#c9e8b0]">
                    {r.faction.replace(/\b\w/g, c => c.toUpperCase())}: <strong className="text-[#9bc37e]">+{r.adjustment}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hostile Reactions */}
          <div className="bg-[#1b1610] p-3 border border-[#3d301b]">
            <span className="text-[11px] font-serif uppercase tracking-wider text-[#d67373] font-bold block mb-2">
              Rivals &amp; Hostile (-1 to -3)
            </span>
            {hostile.length === 0 ? (
              <span className="text-xs text-[#8c7853] italic">No active hostile rivals.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {hostile.map((r, i) => (
                  <span key={i} className="px-2 py-1 text-xs font-serif bg-[#2b1616] border border-[#6b2c2c] text-[#f0b0b0]">
                    {r.faction.replace(/\b\w/g, c => c.toUpperCase())}: <strong className="text-[#d67373]">{r.adjustment}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Linked Faction Quests */}
      <section>
        <h3 className="text-base font-serif font-bold text-[#d4b06a] mb-2 flex items-center justify-between">
          <span>Associated Faction Quests ({quests.length})</span>
        </h3>
        {quests.length === 0 ? (
          <div className="p-4 text-xs font-serif text-[#8c7853] bg-[#1b1610] border border-[#3d301b] italic">
            No specific journal quests found registered under this faction prefix.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {quests.map(q => {
              const status = q.progress?.status || 'unstarted';
              return (
                <div
                  key={q.key}
                  className="p-2.5 bg-[#201811] border border-[#3d301b] flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="font-serif text-xs font-medium text-[#f3e6c8] block truncate">
                      {q.name}
                    </span>
                    <span className="text-[10px] text-[#8c7853] font-mono">
                      {q.key} {q.finishesAt?.length > 0 ? `· Finishes: ${q.finishesAt.join(',')}` : ''}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-serif uppercase tracking-wider shrink-0 border ${
                    status === 'finished'
                      ? "bg-[#1a2916] text-[#9bc37e] border-[#3e5f2e]"
                      : status === 'active'
                      ? "bg-[#332514] text-[#d4b06a] border-[#8c592a]"
                      : "bg-[#14100a] text-[#8c7853] border-[#2b2014]"
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
