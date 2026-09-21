"use client";
import { useMemo } from "react";
import { joinableFactions, getMutualExclusionConflict, meetsRank, getHighestEligibleRank } from "../../lib/faction-math.mjs";

const CATEGORIES = [
  { id: "all", label: "All Factions" },
  { id: "guilds", label: "Guilds" },
  { id: "houses", label: "Great Houses" },
  { id: "imperial", label: "Imperial" },
  { id: "religion", label: "Religion & Cults" },
  { id: "ashlanders", label: "Native & Ashlanders" },
  { id: "vampires", label: "Vampire Clans" },
  { id: "joined", label: "My Memberships" }
];

function categorizeFaction(key) {
  const k = key.toLowerCase();
  if (["hlaalu", "redoran", "telvanni", "indoril", "dres"].some(h => k.includes(h))) return "houses";
  if (["fighters guild", "mages guild", "thieves guild", "morag tong"].includes(k)) return "guilds";
  if (["imperial legion", "imperial cult", "blades", "east empire company", "imperial knights", "royal guard", "census and excise"].includes(k)) return "imperial";
  if (["temple", "imperial cult", "talos cult"].includes(k)) return "religion";
  if (["ashlanders", "ahemmusa", "erabenimsun", "urshilaku", "zainab", "skaal"].some(a => k.includes(a))) return "ashlanders";
  if (["clan aundae", "clan berne", "clan quarra"].some(v => k.includes(v))) return "vampires";
  return "guilds";
}

export default function FactionRoster({
  factions = [],
  selectedFactionKey,
  onSelectFaction,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  joinedFactions = [],
  character
}) {
  const joinedMap = useMemo(() => {
    const map = new Map();
    for (const j of joinedFactions) {
      map.set(j.id.toLowerCase(), j);
    }
    return map;
  }, [joinedFactions]);

  const joinedKeys = useMemo(() => Array.from(joinedMap.keys()), [joinedMap]);

  const filteredFactions = useMemo(() => {
    return factions.filter(f => {
      const k = f.key.toLowerCase();
      const name = (f.name || f.key).toLowerCase();

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = name.includes(q);
        const matchesSkills = (f.skills || []).some(s => s.toLowerCase().includes(q));
        const matchesAttrs = (f.favouredAttributes || []).some(a => a.toLowerCase().includes(q));
        if (!matchesName && !matchesSkills && !matchesAttrs) return false;
      }

      // Category filter
      if (activeCategory === "joined") {
        return joinedMap.has(k);
      }
      if (activeCategory !== "all") {
        const cat = categorizeFaction(k);
        if (cat !== activeCategory) {
          // Special case: Imperial Cult is both imperial and religion
          if (k === "imperial cult" && (activeCategory === "imperial" || activeCategory === "religion")) {
            return true;
          }
          return false;
        }
      }

      return true;
    });
  }, [factions, searchQuery, activeCategory, joinedMap]);

  return (
    <aside className="faction-roster-pane flex flex-col h-full bg-surface-6 border-2 border-line-4 shadow-inner text-fg-2">
      {/* Search Bar */}
      <div className="p-3 border-b border-line-9 bg-surface-3">
        <label htmlFor="faction-search-input" className="sr-only">Search factions</label>
        <div className="relative">
          <input
            id="faction-search-input"
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search faction, skill, or attribute..."
            className="w-full bg-surface-12 border border-line-4 px-3 py-1.5 text-xs text-fg-2 placeholder-fg-14 focus:border-accent focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1.5 text-fg-14 hover:text-accent text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-2 py-2 flex flex-wrap gap-1 border-b border-line-9 bg-surface-3 overflow-x-auto">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === "joined" ? joinedKeys.length : null;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-2 py-1 text-[11px] font-serif uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-surface-22 text-accent font-bold border border-accent"
                  : "bg-transparent text-fg-10 hover:text-fg-2 border border-transparent"
              }`}
            >
              {cat.label} {count !== null ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Roster Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5" role="listbox" aria-label="Factions List">
        {filteredFactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-fg-14 italic">
            No factions found matching criteria.
          </div>
        ) : (
          filteredFactions.map(faction => {
            const isSelected = selectedFactionKey === faction.key;
            const membership = joinedMap.get(faction.key.toLowerCase());
            const hasRanks = Array.isArray(faction.ranks) && faction.ranks.length > 0;
            const conflict = getMutualExclusionConflict(faction.key, joinedKeys);
            const highestRankIdx = character ? getHighestEligibleRank(faction, character) : -1;
            const isEligibleToJoin = highestRankIdx >= 0;

            // Current rank label
            let rankLabel = null;
            if (membership) {
              const currentRankObj = faction.ranks.find(r => r.index === membership.rank);
              rankLabel = currentRankObj?.name || `Rank ${membership.rank}`;
            }

            return (
              <button
                key={faction.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectFaction(faction.key)}
                className={`faction-roster-item w-full text-left p-2.5 transition-all flex flex-col gap-1 border ${
                  isSelected
                    ? "bg-surface-18 border-accent shadow-md"
                    : "bg-surface-8 hover:bg-surface-12 border-line-9"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-serif text-sm font-semibold tracking-wide ${
                    isSelected ? "text-accent" : "text-fg-2"
                  }`}>
                    {faction.name || faction.key}
                  </span>
                  {faction.ownedPlacements > 0 && (
                    <span className="text-[10px] text-fg-14 font-mono shrink-0" title="Owned World Placements">
                      {faction.ownedPlacements.toLocaleString()} spots
                    </span>
                  )}
                </div>

                {/* Badges Row */}
                <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                  {membership ? (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-surface-22 text-accent border border-accent/50">
                      {membership.expelled ? "⚠ Expelled" : `Member · ${rankLabel}`}
                    </span>
                  ) : hasRanks ? (
                    isEligibleToJoin ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-serif text-success-4 bg-success-surface-2 border border-success-line-4">
                        Eligible to Join
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-serif text-fg-14 bg-surface-3 border border-line-11">
                        Unqualified
                      </span>
                    )
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-serif text-fg-15 bg-surface-3 border border-line-12">
                      Non-joinable
                    </span>
                  )}

                  {conflict && !membership && (
                    <span className="px-1.5 py-0.5 text-[10px] font-serif text-danger-7 bg-danger-surface-3 border border-danger-line-2" title={conflict.description}>
                      Rival Joined
                    </span>
                  )}

                  {faction.hidden && (
                    <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-fg-14 bg-surface-2">
                      Secret
                    </span>
                  )}
                </div>

                {/* Favoured Attributes Snippet */}
                {faction.favouredAttributes?.length > 0 && (
                  <div className="text-[10px] text-fg-14 font-serif truncate mt-0.5">
                    {faction.favouredAttributes.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(" · ")}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
