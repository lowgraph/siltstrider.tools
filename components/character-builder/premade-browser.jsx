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
      className="premade-browser px-8 sm:px-10 py-6 space-y-5 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--color-surface-7)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-line-11 pb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-fg-2 tracking-wide">
            Premade Character Builds ({filteredBuilds.length})
          </h3>
          <p className="text-sm text-fg-8 mt-0.5">
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
          className="flex-1 h-10 bg-surface-2 text-fg-2 border-4 border-transparent px-3.5 py-2 text-sm focus:outline-none transition-colors"
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
            <div key={cat} className="category-block bg-surface-2 border border-line-12 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-3 bg-surface-3 hover:bg-surface-9 border-b border-line-12 transition-colors text-left group"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-accent transition-transform duration-200">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                  <span className="font-serif text-sm uppercase tracking-wider text-accent font-bold group-hover:text-fg-2 transition-colors">
                    {cat}
                  </span>
                  <span className="text-xs font-mono text-fg-14">
                    ({inCat.length} {inCat.length === 1 ? "build" : "builds"})
                  </span>
                </div>
                <span className="text-xs text-fg-14 font-serif group-hover:text-accent transition-colors">
                  {isExpanded ? "Collapse ▲" : "Expand ▼"}
                </span>
              </button>

              {isExpanded && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface-1">
                  {inCat.map((b) => (
                    <div
                      key={b.name}
                      className="p-4 bg-surface-3 border border-line-11 hover:border-accent rounded transition-all cursor-pointer group flex flex-col justify-between"
                      onClick={() => onSelectBuild(b)}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <strong className="font-serif text-base font-bold text-fg-2 group-hover:text-accent transition-colors leading-tight">
                            {b.name}
                          </strong>
                          <span className="text-xs font-mono font-medium text-accent shrink-0">
                            {b.gender} {b.race}
                          </span>
                        </div>
                        <div className="text-xs text-fg-8 mt-1.5">
                          Sign: <span className="text-fg-2 font-medium">{b.sign}</span> · Favored:{" "}
                          <span className="text-fg-2 font-medium">{b.fav}</span>
                        </div>
                        <div className="text-xs text-fg-4 mt-1 line-clamp-1">
                          <strong className="text-accent">Maj:</strong> {b.maj}
                        </div>
                        <div className="text-xs text-fg-14 mt-0.5 line-clamp-1">
                          <strong className="text-fg-9">Min:</strong> {b.min}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-line-12 flex items-center justify-between">
                        <span className="text-xs text-fg-14 italic">{b.spec} Specialization</span>
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
          <p className="text-center text-sm text-fg-14 italic py-8">
            No premade builds found matching &quot;{filter}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
