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
    <aside className="faction-roster-pane flex flex-col h-full bg-[#1b1610] border-2 border-[#5c4827] shadow-inner text-[#f3e6c8]">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#3d301b] bg-[#14100a]">
        <label htmlFor="faction-search-input" className="sr-only">Search factions</label>
        <div className="relative">
          <input
            id="faction-search-input"
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search faction, skill, or attribute..."
            className="w-full bg-[#241c13] border border-[#5c4827] px-3 py-1.5 text-xs text-[#f3e6c8] placeholder-[#8c7853] focus:border-[#d4b06a] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1.5 text-[#8c7853] hover:text-[#d4b06a] text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-2 py-2 flex flex-wrap gap-1 border-b border-[#3d301b] bg-[#17120c] overflow-x-auto">
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
                  ? "bg-[#3d301b] text-[#d4b06a] font-bold border border-[#d4b06a]"
                  : "bg-transparent text-[#a6926d] hover:text-[#f3e6c8] border border-transparent"
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
          <div className="p-6 text-center text-xs text-[#8c7853] italic">
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
                    ? "bg-[#2c2216] border-[#d4b06a] shadow-md"
                    : "bg-[#201811] hover:bg-[#271e15] border-[#3d301b]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-serif text-sm font-semibold tracking-wide ${
                    isSelected ? "text-[#d4b06a]" : "text-[#f3e6c8]"
                  }`}>
                    {faction.name || faction.key}
                  </span>
                  {faction.ownedPlacements > 0 && (
                    <span className="text-[10px] text-[#8c7853] font-mono shrink-0" title="Owned World Placements">
                      {faction.ownedPlacements.toLocaleString()} spots
                    </span>
                  )}
                </div>

                {/* Badges Row */}
                <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                  {membership ? (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-[#3d301b] text-[#d4b06a] border border-[#d4b06a]/50">
                      {membership.expelled ? "⚠ Expelled" : `Member · ${rankLabel}`}
                    </span>
                  ) : hasRanks ? (
                    isEligibleToJoin ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-serif text-[#9bc37e] bg-[#1a2916] border border-[#3e5f2e]">
                        Eligible to Join
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-serif text-[#8c7853] bg-[#17120c] border border-[#2b2014]">
                        Unqualified
                      </span>
                    )
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-serif text-[#78664a] bg-[#14100a] border border-[#261c12]">
                      Non-joinable
                    </span>
                  )}

                  {conflict && !membership && (
                    <span className="px-1.5 py-0.5 text-[10px] font-serif text-[#d67373] bg-[#331414] border border-[#662020]" title={conflict.description}>
                      Rival Joined
                    </span>
                  )}

                  {faction.hidden && (
                    <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#8c7853] bg-[#120e0a]">
                      Secret
                    </span>
                  )}
                </div>

                {/* Favoured Attributes Snippet */}
                {faction.favouredAttributes?.length > 0 && (
                  <div className="text-[10px] text-[#8c7853] font-serif truncate mt-0.5">
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
