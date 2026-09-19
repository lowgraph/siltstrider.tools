"use client";
import { useState, useMemo } from "react";
import { BUILDS, RACE_BUILDS, ARCE_BUILDS } from "../../lib/premade-data.mjs";

export default function PremadeBrowser({ onSelectBuild, activeProfile = "vanilla" }) {
  const [groupBy, setGroupBy] = useState("cat"); // "cat" (Playstyle) or "race"
  const [filter, setFilter] = useState("");
  const [openCategories, setOpenCategories] = useState(() => new Set()); // Collapsed by default

  const builds = useMemo(() => {
    if (groupBy === "race") {
      return activeProfile === "tr_arce"
        ? RACE_BUILDS.concat(ARCE_BUILDS)
        : RACE_BUILDS;
    }
    return BUILDS;
  }, [groupBy, activeProfile]);

  const filteredBuilds = useMemo(() => {
    if (!filter.trim()) return builds;
    const term = filter.toLowerCase();
    return builds.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.race.toLowerCase().includes(term) ||
        (b.cat && b.cat.toLowerCase().includes(term)) ||
        (b.sign && b.sign.toLowerCase().includes(term)) ||
        (b.spec && b.spec.toLowerCase().includes(term)) ||
        (b.maj && b.maj.toLowerCase().includes(term))
    );
  }, [builds, filter]);

  const categories = useMemo(() => {
    return Array.from(new Set(filteredBuilds.map((b) => b.cat || "Other"))).sort();
  }, [filteredBuilds]);

  const toggleCategory = (cat) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const expandAll = () => setOpenCategories(new Set(categories));
  const collapseAll = () => setOpenCategories(new Set());

  return (
    <div
      className="premade-browser p-5 space-y-5 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-[#2a2318] pb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#f3e6c8] tracking-wide">
            Premade Character Builds ({filteredBuilds.length})
          </h3>
          <p className="text-sm text-[#b8a078] mt-0.5">
            Curated character builds designed for authentic playstyles, roleplay, and racial themes.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`mw-btn h-9 px-4 text-sm font-serif font-bold transition-colors ${
              groupBy === "cat" ? "active" : ""
            }`}
            onClick={() => {
              setGroupBy("cat");
              setOpenCategories(new Set());
            }}
          >
            By Playstyle
          </button>
          <button
            type="button"
            className={`mw-btn h-9 px-4 text-sm font-serif font-bold transition-colors ${
              groupBy === "race" ? "active" : ""
            }`}
            onClick={() => {
              setGroupBy("race");
              setOpenCategories(new Set());
            }}
          >
            By Race
          </button>
        </div>
      </div>

      {/* Search Input & Expand/Collapse Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="Filter by name, race, sign, or skill..."
          className="flex-1 h-10 bg-[#120f0a] text-[#f3e6c8] border-4 border-transparent px-3.5 py-2 text-sm focus:outline-none transition-colors"
          style={{
            borderImage: "var(--mw-bevel) 4 repeat"
          }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="mw-btn px-3 py-1.5 text-xs font-serif"
            onClick={expandAll}
          >
            Expand All
          </button>
          <button
            type="button"
            className="mw-btn px-3 py-1.5 text-xs font-serif"
            onClick={collapseAll}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Collapsible Build Categories */}
      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1.5">
        {categories.map((cat) => {
          const inCat = filteredBuilds.filter((b) => (b.cat || "Other") === cat);
          if (inCat.length === 0) return null;

          const isExpanded = filter.trim().length > 0 || openCategories.has(cat);

          return (
            <div key={cat} className="category-block bg-[#100d08] border border-[#251e14] rounded overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-3 bg-[#15100a] hover:bg-[#1f180f] border-b border-[#251e14] transition-colors text-left group"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-[#d4b06a] transition-transform duration-200">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                  <span className="font-serif text-sm uppercase tracking-wider text-[#d4b06a] font-bold group-hover:text-[#f3e6c8] transition-colors">
                    {cat}
                  </span>
                  <span className="text-xs font-mono text-[#8c7853]">
                    ({inCat.length} {inCat.length === 1 ? "build" : "builds"})
                  </span>
                </div>
                <span className="text-xs text-[#8c7853] font-serif group-hover:text-[#d4b06a] transition-colors">
                  {isExpanded ? "Collapse ▲" : "Expand ▼"}
                </span>
              </button>

              {isExpanded && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0d0a06]">
                  {inCat.map((b) => (
                    <div
                      key={b.name}
                      className="p-4 bg-[#14100a] border border-[#2a2318] hover:border-[#d4b06a] rounded transition-all cursor-pointer group flex flex-col justify-between"
                      onClick={() => onSelectBuild(b)}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <strong className="font-serif text-base font-bold text-[#f3e6c8] group-hover:text-[#d4b06a] transition-colors leading-tight">
                            {b.name}
                          </strong>
                          <span className="text-xs font-mono font-medium text-[#d4b06a] shrink-0">
                            {b.gender} {b.race}
                          </span>
                        </div>
                        <div className="text-xs text-[#b8a078] mt-1.5">
                          Sign: <span className="text-[#f3e6c8] font-medium">{b.sign}</span> · Favored:{" "}
                          <span className="text-[#f3e6c8] font-medium">{b.fav}</span>
                        </div>
                        <div className="text-xs text-[#cfc3aa] mt-1 line-clamp-1">
                          <strong className="text-[#d4b06a]">Maj:</strong> {b.maj}
                        </div>
                        <div className="text-xs text-[#8c7853] mt-0.5 line-clamp-1">
                          <strong className="text-[#a69677]">Min:</strong> {b.min}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#1f1a12] flex items-center justify-between">
                        <span className="text-xs text-[#8c7853] italic">{b.spec} Specialization</span>
                        <button
                          type="button"
                          className="mw-btn px-3 py-1 text-xs font-serif font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBuild(b);
                          }}
                        >
                          Load Build →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filteredBuilds.length === 0 && (
          <p className="text-center text-sm text-[#8c7853] italic py-8">
            No premade builds found matching &quot;{filter}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
