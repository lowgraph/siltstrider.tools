"use client";
import { useState, useMemo } from "react";
import { POOL, MAJORS, TR_MAJORS, OBJECTIVES, band, regionsIn } from "../../lib/challenge-math.mjs";

export default function PoolBrowserModal({
  isOpen,
  onClose,
  world = "vanilla"
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "major" | "minor" | "restrictions"

  const majorsPool = useMemo(() => {
    return world === "tr" ? MAJORS.concat(TR_MAJORS) : MAJORS;
  }, [world]);

  const filteredMajors = useMemo(() => {
    if (!query) return majorsPool;
    const q = query.toLowerCase();
    return majorsPool.filter((m) => m.toLowerCase().includes(q));
  }, [majorsPool, query]);

  const filteredMinors = useMemo(() => {
    if (!query) return OBJECTIVES;
    const q = query.toLowerCase();
    return OBJECTIVES.filter((o) => o.text.toLowerCase().includes(q) || o.kind.toLowerCase().includes(q));
  }, [query]);

  const filteredRestrictions = useMemo(() => {
    if (!query) return POOL;
    const q = query.toLowerCase();
    return POOL.filter((r) => r.toLowerCase().includes(q) || band(r).toLowerCase().includes(q));
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-3 border-2 border-accent w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-fg-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line-9 bg-surface-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-accent">
              Challenge Runs Pool Browser
            </h3>
            <p className="text-xs text-fg-11 font-serif">
              Search and explore all objectives, restrictions, and rules for {world === "tr" ? "Tamriel Rebuilt" : "Vvardenfell"}.
            </p>
          </div>
          <button
            type="button"
            className="mw-btn px-3 py-1 text-sm font-bold"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="p-4 border-b border-line-11 space-y-3 bg-surface-2">
          <input
            type="text"
            className="w-full bg-surface-1 border border-line-7 p-2 text-sm text-fg-2 placeholder-fg-15 font-serif"
            placeholder="Search objectives, places, tags, or restrictions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Items" },
              { id: "major", label: `Major Objectives (${filteredMajors.length})` },
              { id: "minor", label: `Minor Objectives (${filteredMinors.length})` },
              { id: "restrictions", label: `Restrictions (${filteredRestrictions.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`mw-btn px-3 py-1 text-xs font-serif ${
                  activeTab === tab.id ? "active ring-1 ring-accent" : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* Major Objectives */}
          {(activeTab === "all" || activeTab === "major") && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-serif font-bold text-accent mb-2 border-b border-line-9 pb-1">
                Major Objectives ({filteredMajors.length})
              </h4>
              <ul className="space-y-1.5 text-sm">
                {filteredMajors.map((m, idx) => (
                  <li key={idx} className="p-2 bg-surface-5 border border-line-11 flex items-center justify-between">
                    <span className="font-serif">{m}</span>
                    {regionsIn(m).map((r) => (
                      <span key={r} className="region-tag text-[10px] px-1.5 py-0.5 bg-surface-14 border border-line-9 text-fg-7">
                        {r}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Minor Objectives */}
          {(activeTab === "all" || activeTab === "minor") && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-serif font-bold text-accent mb-2 border-b border-line-9 pb-1">
                Minor Objectives ({filteredMinors.length})
              </h4>
              <ul className="space-y-1.5 text-sm">
                {filteredMinors.map((o, idx) => (
                  <li key={idx} className="p-2 bg-surface-5 border border-line-11 flex items-center justify-between">
                    <span className="font-serif">{o.text}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-surface-14 text-fg-9">
                      {o.kind}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Restrictions */}
          {(activeTab === "all" || activeTab === "restrictions") && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-serif font-bold text-accent mb-2 border-b border-line-9 pb-1">
                Restrictions ({filteredRestrictions.length})
              </h4>
              <ul className="space-y-1.5 text-sm">
                {filteredRestrictions.map((r, idx) => {
                  const b = band(r);
                  return (
                    <li key={idx} className="p-2 bg-surface-5 border border-line-11 flex items-center justify-between">
                      <span className="font-serif">{r}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-surface-14 text-accent border border-line-9">
                        {b}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
