"use client";
import { useState, useMemo, useEffect } from "react";
import { useGameData } from "../use-game-data";
import { useActiveCharacter } from "../character-context";
import { useShell } from "../shell-context";
import FactionRoster from "./faction-roster";
import FactionDetailView from "./faction-detail-view";
import { getFactionQuests } from "../../lib/faction-math.mjs";

const FALLBACK_FACTIONS = [
  {
    key: "fighters guild",
    name: "Fighters Guild",
    favouredAttributes: ["strength", "endurance"],
    skills: ["axe", "long_blade", "blunt_weapon", "heavy_armor", "armorer", "block"],
    ranks: [
      { index: 0, name: "Associate", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: "Apprentice", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: "Journeyman", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: "Swordsman", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
      { index: 4, name: "Protector", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 35 },
      { index: 5, name: "Defender", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
      { index: 6, name: "Warder", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
      { index: 7, name: "Guardian", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 90 },
      { index: 8, name: "Champion", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 110 },
      { index: 9, name: "Master", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
    ],
    reactions: [
      { faction: "fighters guild", adjustment: 3 },
      { faction: "imperial legion", adjustment: 2 },
      { faction: "imperial cult", adjustment: 1 },
      { faction: "mages guild", adjustment: 1 },
      { faction: "hlaalu", adjustment: 1 },
      { faction: "redoran", adjustment: 1 },
      { faction: "camonna tong", adjustment: -1 },
      { faction: "ashlanders", adjustment: -2 },
      { faction: "sixth house", adjustment: -3 }
    ],
    ownedPlacements: 186
  },
  {
    key: "mages guild",
    name: "Mages Guild",
    favouredAttributes: ["intelligence", "willpower"],
    skills: ["alchemy", "mysticism", "illusion", "alteration", "destruction", "enchant"],
    ranks: [
      { index: 0, name: "Associate", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: "Apprentice", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: "Journeyman", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: "Evoker", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
      { index: 4, name: "Conjurer", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 30 },
      { index: 5, name: "Magician", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
      { index: 6, name: "Warlock", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
      { index: 7, name: "Wizard", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 80 },
      { index: 8, name: "Master Wizard", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 100 },
      { index: 9, name: "Arch-Mage", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
    ],
    reactions: [
      { faction: "mages guild", adjustment: 3 },
      { faction: "fighters guild", adjustment: 1 },
      { faction: "imperial cult", adjustment: 1 },
      { faction: "imperial legion", adjustment: 1 },
      { faction: "thieves guild", adjustment: 1 },
      { faction: "hlaalu", adjustment: 1 },
      { faction: "redoran", adjustment: -1 },
      { faction: "temple", adjustment: -2 },
      { faction: "telvanni", adjustment: -3 }
    ],
    ownedPlacements: 198
  },
  {
    key: "thieves guild",
    name: "Thieves Guild",
    favouredAttributes: ["agility", "personality"],
    skills: ["marksman", "short_blade", "light_armor", "acrobatics", "sneak", "security"],
    ranks: [
      { index: 0, name: "Toad", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: "Wet Ear", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: "Footpad", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: "Blackcap", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
      { index: 4, name: "Operative", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 30 },
      { index: 5, name: "Bandit", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
      { index: 6, name: "Captain", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
      { index: 7, name: "Ringleader", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 80 },
      { index: 8, name: "Mastermind", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 100 },
      { index: 9, name: "Master Thief", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
    ],
    reactions: [
      { faction: "thieves guild", adjustment: 3 },
      { faction: "imperial cult", adjustment: 1 },
      { faction: "mages guild", adjustment: 1 },
      { faction: "hlaalu", adjustment: -1 },
      { faction: "redoran", adjustment: -1 },
      { faction: "fighters guild", adjustment: -2 },
      { faction: "camonna tong", adjustment: -3 }
    ],
    ownedPlacements: 194
  },
  {
    key: "hlaalu",
    name: "Great House Hlaalu",
    favouredAttributes: ["speed", "agility"],
    skills: ["speechcraft", "mercantile", "marksman", "short_blade", "light_armor", "security"],
    ranks: [
      { index: 0, name: "Hireling", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: "Retainer", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: "Oathman", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: "Lawman", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
      { index: 4, name: "Kinsman", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 30 },
      { index: 5, name: "House Cousin", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
      { index: 6, name: "House Brother", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
      { index: 7, name: "House Father", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 80 },
      { index: 8, name: "Councilman", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 100 },
      { index: 9, name: "Grandmaster", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
    ],
    reactions: [
      { faction: "hlaalu", adjustment: 3 },
      { faction: "fighters guild", adjustment: 1 },
      { faction: "imperial legion", adjustment: 1 },
      { faction: "temple", adjustment: 1 },
      { faction: "redoran", adjustment: -1 },
      { faction: "telvanni", adjustment: -1 }
    ],
    ownedPlacements: 349
  },
  {
    key: "redoran",
    name: "Great House Redoran",
    favouredAttributes: ["endurance", "strength"],
    skills: ["athletics", "spear", "long_blade", "heavy_armor", "medium_armor", "armorer"],
    ranks: [
      { index: 0, name: "Hireling", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: "Retainer", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: "Oathman", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: "Lawman", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
      { index: 4, name: "Kinsman", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 30 },
      { index: 5, name: "House Cousin", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
      { index: 6, name: "House Brother", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
      { index: 7, name: "House Father", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 80 },
      { index: 8, name: "Councilman", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 100 },
      { index: 9, name: "Archmaster", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
    ],
    reactions: [
      { faction: "redoran", adjustment: 3 },
      { faction: "temple", adjustment: 2 },
      { faction: "fighters guild", adjustment: 1 },
      { faction: "imperial legion", adjustment: 1 },
      { faction: "hlaalu", adjustment: -1 },
      { faction: "telvanni", adjustment: -1 }
    ],
    ownedPlacements: 586
  },
  {
    key: "telvanni",
    name: "Great House Telvanni",
    favouredAttributes: ["willpower", "intelligence"],
    skills: ["mysticism", "conjuration", "illusion", "alteration", "destruction", "enchant"],
    ranks: [
      { index: 0, name: "Hireling", attribute1: 30, attribute2: 30, primarySkill: 0, favouredSkill: 0, reputation: 0 },
      { index: 1, name: "Retainer", attribute1: 30, attribute2: 30, primarySkill: 10, favouredSkill: 0, reputation: 5 },
      { index: 2, name: "Oathman", attribute1: 30, attribute2: 30, primarySkill: 20, favouredSkill: 0, reputation: 10 },
      { index: 3, name: "Lawman", attribute1: 30, attribute2: 30, primarySkill: 30, favouredSkill: 5, reputation: 20 },
      { index: 4, name: "Mouth", attribute1: 30, attribute2: 30, primarySkill: 40, favouredSkill: 10, reputation: 30 },
      { index: 5, name: "Spellwright", attribute1: 31, attribute2: 31, primarySkill: 50, favouredSkill: 15, reputation: 45 },
      { index: 6, name: "Wizard", attribute1: 32, attribute2: 32, primarySkill: 60, favouredSkill: 20, reputation: 60 },
      { index: 7, name: "Master", attribute1: 33, attribute2: 33, primarySkill: 70, favouredSkill: 25, reputation: 80 },
      { index: 8, name: "Magister", attribute1: 34, attribute2: 34, primarySkill: 80, favouredSkill: 30, reputation: 100 },
      { index: 9, name: "Archmagister", attribute1: 35, attribute2: 35, primarySkill: 90, favouredSkill: 35, reputation: 125 }
    ],
    reactions: [
      { faction: "telvanni", adjustment: 3 },
      { faction: "hlaalu", adjustment: -1 },
      { faction: "redoran", adjustment: -1 },
      { faction: "temple", adjustment: -1 },
      { faction: "imperial legion", adjustment: -1 },
      { faction: "mages guild", adjustment: -3 }
    ],
    ownedPlacements: 551
  }
];

export default function JournalFactionsRoot({ initialFactions, initialQuests } = {}) {
  let shell = null;
  try {
    shell = useShell();
  } catch {
    shell = { profile: "vanilla", ready: false };
  }
  const { sheet, build } = useActiveCharacter();
  const gameData = useGameData('factions', { enabled: Boolean(shell?.ready) });

  const isLive = Boolean(initialFactions) || (gameData.status === 'ready' && gameData.data?.catalogs?.Factions);
  const factionsList = initialFactions || (isLive ? gameData.data.catalogs.Factions : FALLBACK_FACTIONS);
  const questCatalog = initialQuests ? { records: initialQuests } : (isLive ? { records: gameData.data?.catalogs?.Quests || [] } : { records: [] });

  const [selectedFactionKey, setSelectedFactionKey] = useState("fighters guild");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Ingested save / character vault factions
  const [joinedFactions, setJoinedFactions] = useState(() => {
    if (typeof window !== "undefined" && window.siltVaultActiveSave?.progress?.factions) {
      return window.siltVaultActiveSave.progress.factions;
    }
    return [
      { id: "fighters guild", rank: 1, reputation: 10, expelled: false }
    ];
  });

  // Keep joinedFactions synced if a cloud save or vault save is loaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkSave = () => {
        if (window.siltVaultActiveSave?.progress?.factions) {
          setJoinedFactions(window.siltVaultActiveSave.progress.factions);
        }
      };
      window.addEventListener("silt-character-status", checkSave);
      return () => window.removeEventListener("silt-character-status", checkSave);
    }
  }, []);

  const joinedFactionKeys = useMemo(() => {
    return joinedFactions.map(j => j.id.toLowerCase());
  }, [joinedFactions]);

  const selectedFaction = useMemo(() => {
    return factionsList.find(f => f.key.toLowerCase() === selectedFactionKey.toLowerCase()) || factionsList[0];
  }, [factionsList, selectedFactionKey]);

  const currentMembership = useMemo(() => {
    return joinedFactions.find(j => j.id.toLowerCase() === selectedFactionKey.toLowerCase()) || null;
  }, [joinedFactions, selectedFactionKey]);

  // Quests for the selected faction
  const factionQuests = useMemo(() => {
    const saveQuests = typeof window !== "undefined" ? window.siltVaultActiveSave?.progress?.quests || [] : [];
    return getFactionQuests(selectedFactionKey, questCatalog, saveQuests);
  }, [selectedFactionKey, questCatalog]);

  const handleUpdateMembership = (updatedMembership) => {
    setJoinedFactions(prev => {
      const idx = prev.findIndex(j => j.id.toLowerCase() === updatedMembership.id.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedMembership;
        return next;
      }
      return [...prev, updatedMembership];
    });
  };

  const handleToggleJoin = (factionKey) => {
    setJoinedFactions(prev => {
      const norm = factionKey.toLowerCase();
      const existing = prev.find(j => j.id.toLowerCase() === norm);
      if (existing) {
        return prev.filter(j => j.id.toLowerCase() !== norm);
      }
      return [...prev, { id: norm, rank: 0, reputation: 0, expelled: false }];
    });
  };

  return (
    <div className="journal-factions-root max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-[#14100a] text-[#f3e6c8] border-4 border-[#5c4827] shadow-2xl">
      {/* Top Bar / Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#1b1610] border-b-2 border-[#5c4827]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-[#d4b06a] tracking-wide">
            Faction Journal
          </h1>
          {/* Live Bundle Status Badge */}
          {isLive ? (
            <span className="px-2 py-0.5 text-[11px] font-mono uppercase bg-[#182614] border border-[#3e5f2e] text-[#9bc37e]" title="Loaded from verified game data bundle">
              • Live: {factionsList.length} Factions ({shell?.profile?.toUpperCase() || "VANILLA"})
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[11px] font-mono text-[#8c7853] bg-[#241c13] border border-[#3d301b]">
              Loading bundle data…
            </span>
          )}
        </div>

        {/* Active Character Build Summary & Membership Toggle */}
        <div className="flex items-center gap-3 text-xs font-serif">
          {sheet && (
            <div className="hidden sm:block text-right">
              <span className="text-[#8c7853] block text-[10px] uppercase">Active Character:</span>
              <strong className="text-[#c9b88e]">{build.name || "Adventurer"}</strong> ({build.race} {build.className})
            </div>
          )}

          {selectedFaction && Array.isArray(selectedFaction.ranks) && selectedFaction.ranks.length > 0 && (
            <button
              type="button"
              onClick={() => handleToggleJoin(selectedFaction.key)}
              className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider font-bold transition-all border ${
                currentMembership
                  ? "bg-[#3d1a1a] text-[#f0a8a8] border-[#8c2a2a] hover:bg-[#522222]"
                  : "bg-[#28401e] text-[#b4e698] border-[#5fa33e] hover:bg-[#345427]"
              }`}
            >
              {currentMembership ? "Leave Faction" : "+ Join Faction"}
            </button>
          )}
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Roster (320px on desktop) */}
        <div className="w-full md:w-80 md:min-w-[300px] h-64 md:h-full border-b-2 md:border-b-0 md:border-r-2 border-[#5c4827] flex flex-col">
          <FactionRoster
            factions={factionsList}
            selectedFactionKey={selectedFactionKey}
            onSelectFaction={setSelectedFactionKey}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            joinedFactions={joinedFactions}
            character={sheet}
          />
        </div>

        {/* Right Pane: Dossier Detail View */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          <FactionDetailView
            faction={selectedFaction}
            character={sheet}
            membership={currentMembership}
            joinedFactionKeys={joinedFactionKeys}
            quests={factionQuests}
            onUpdateMembership={handleUpdateMembership}
          />
        </div>
      </div>
    </div>
  );
}
