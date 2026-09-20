"use client";
import { useShell } from "../shell-context";

export default function WorldProfilesGuide() {
  let shell = null;
  try { shell = useShell(); } catch {}

  const currentProfile = shell?.profile || "vanilla";

  const handleSetProfile = (profile) => {
    if (typeof window !== "undefined" && window.siltShell?.setProfile) {
      window.siltShell.setProfile(profile);
    }
  };

  const profiles = [
    {
      id: "vanilla",
      title: "Vanilla Vvardenfell",
      era: "TES III: Morrowind, Tribunal, Bloodmoon",
      desc: "Authentic 2002 game data extracted directly from Bethesda ESM files. Covers Vvardenfell island and Solstheim with vanilla item placements, enchanters, and formulas.",
    },
    {
      id: "tr",
      title: "Tamriel Rebuilt Mainland",
      era: "Version 26.08 Poison Song",
      desc: "Massive community expansion adding the Morrowind mainland. Ingests Tamriel_Data, mainland enchanters, unique flora ingredients, river strider transit, and guild quests.",
    },
    {
      id: "tr_arce",
      title: "TR + ARCE Rebalance",
      era: "ARCE 4.1 Expansion",
      desc: "Enhanced roleplay balancing with 21 races (including seven Khajiit furstocks, Naga, Ayleid, and Reachman), 67 balanced classes, and reworked skill modifiers.",
    },
  ];

  return (
    <section
      className="home-hub-profiles-guide mw-master-window p-4 sm:p-6 mb-8 text-[#f3e6c8]"
      style={{
        background: "var(--surface, #181510)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(0, 0, 0, 0.8)",
      }}
      aria-label="Game World Profiles Guide"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4 pb-3 border-b border-[#2a2215]">
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#d4b06a] tracking-wide">
            Game World Profiles
          </h2>
          <p className="text-xs text-[#a09070] font-serif mt-0.5">
            Switch your active world at any time. All calculators, gear advisors, and travel paths adapt in real time.
          </p>
        </div>
        <span className="text-xs font-serif text-[#c9b88e] shrink-0">
          Active: <strong className="text-[#ffd700] uppercase font-mono">{currentProfile.replace("_", " + ")}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isActive = currentProfile === p.id;
          return (
            <div
              key={p.id}
              className={`p-3.5 sm:p-4 rounded border transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-[#281f13] border-[#d4b06a] shadow-[0_0_12px_rgba(212,176,106,0.2)]"
                  : "bg-[#14100b] border-[#382b19] hover:border-[#6e5833]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#d4b06a]">
                    {p.title}
                  </h3>
                  {isActive && (
                    <span className="text-[10px] uppercase font-serif font-bold px-1.5 py-0.5 bg-[#453218] border border-[#d4b06a] text-[#ffd700] rounded-sm">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8c7853] font-serif mb-2">{p.era}</p>
                <p className="text-xs text-[#dcd0b4] leading-relaxed font-serif mb-3">
                  {p.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSetProfile(p.id)}
                disabled={isActive}
                className={`mw-btn w-full py-1.5 px-3 text-xs font-serif font-bold tracking-wide transition-all ${
                  isActive
                    ? "opacity-60 cursor-default text-[#ffd700]"
                    : "text-[#d4b06a] hover:text-[#fff]"
                }`}
              >
                {isActive ? "✓ Selected Profile" : `Switch to ${p.title} →`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
