"use client";
import { DIFFICULTY_PRESETS, POOL, band } from "../../lib/challenge-math.mjs";

export default function RunConfigurator({
  onGenerateRun,
  preset,
  onSelectPreset,
  restrictionCount,
  onRestrictionCountChange,
  objectiveCount,
  onObjectiveCountChange,
  allowedBands,
  onToggleBand,
  locks,
  onToggleLock,
  character,
  onUpdateCharacterSlot,
  races = [],
  classes = [],
  signs = [],
  onOpenPoolBrowser
}) {
  const easyCount = POOL.filter((r) => band(r) === "Easy").length;
  const medCount = POOL.filter((r) => band(r) === "Medium").length;
  const hardCount = POOL.filter((r) => band(r) === "Hard").length;
  const grindCount = POOL.filter((r) => band(r) === "Grind").length;

  return (
    <div className="run-configurator border border-[#3a2e1d] bg-[#14100a] p-5 text-[#f3e6c8] space-y-5">
      {/* Primary Action */}
      <div>
        <button
          type="button"
          className="w-full mw-btn py-3.5 px-6 font-serif text-base font-bold tracking-wider uppercase text-[#f8ecce] shadow-lg flex items-center justify-center gap-2 border-2 border-[#d4b06a]"
          onClick={onGenerateRun}
          id="react-btn-generate-run"
        >
          <span className="text-xl">🎲</span>
          <span>Generate Run</span>
        </button>
        <p className="text-[11px] text-[#9b8b6a] font-serif text-center mt-1.5">
          Rolls character identity, victory condition, and gameplay modifiers based on chosen settings.
        </p>
      </div>

      {/* Difficulty Presets Strip */}
      <div className="border-t border-[#2a2215] pt-4">
        <label className="text-xs uppercase tracking-widest font-serif font-bold text-[#d4b06a] block mb-2">
          Difficulty Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(DIFFICULTY_PRESETS).map((p) => {
            const isActive = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`mw-btn py-2 px-2 text-xs font-serif font-bold transition-all text-center ${
                  isActive ? "active ring-1 ring-[#d4b06a] text-[#d4b06a]" : "text-[#bdae8e]"
                }`}
                onClick={() => onSelectPreset(p.id)}
                title={p.description}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modifier Counts */}
      <div className="border-t border-[#2a2215] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cfg-rest-count" className="text-xs uppercase tracking-wider font-serif font-bold text-[#c2b291] block mb-1.5">
            Active Restrictions
          </label>
          <select
            id="cfg-rest-count"
            className="w-full mw-select p-2 text-sm font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
            value={restrictionCount}
            onChange={(e) => onRestrictionCountChange(e.target.value)}
          >
            <option value="random">Random (1–5)</option>
            <option value="1">1 Restriction</option>
            <option value="2">2 Restrictions</option>
            <option value="3">3 Restrictions</option>
            <option value="4">4 Restrictions</option>
            <option value="5">5 Restrictions</option>
          </select>
        </div>

        <div>
          <label htmlFor="cfg-obj-count" className="text-xs uppercase tracking-wider font-serif font-bold text-[#c2b291] block mb-1.5">
            Minor Objectives
          </label>
          <select
            id="cfg-obj-count"
            className="w-full mw-select p-2 text-sm font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
            value={objectiveCount}
            onChange={(e) => onObjectiveCountChange(e.target.value)}
          >
            <option value="random">Random (1–5)</option>
            <option value="1">1 Objective</option>
            <option value="2">2 Objectives</option>
            <option value="3">3 Objectives</option>
            <option value="4">4 Objectives</option>
            <option value="5">5 Objectives</option>
          </select>
        </div>
      </div>

      {/* Difficulty Filter Chips */}
      <div className="border-t border-[#2a2215] pt-4">
        <label className="text-xs uppercase tracking-widest font-serif font-bold text-[#d4b06a] block mb-2">
          Difficulty Filter Pool
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "Easy", label: "Easy", count: easyCount, color: "text-[#7de091]" },
            { id: "Medium", label: "Medium", count: medCount, color: "text-[#eed072]" },
            { id: "Hard", label: "Hard", count: hardCount, color: "text-[#f28e85]" },
            { id: "Grind", label: "Grind", count: grindCount, color: "text-[#c9a7f5]" }
          ].map((b) => {
            const isChecked = !!allowedBands[b.id];
            return (
              <label
                key={b.id}
                className={`flex items-center justify-between p-2 border cursor-pointer select-none transition-colors ${
                  isChecked ? "bg-[#1f190f] border-[#4a3b26]" : "bg-[#100d08] border-[#221a0f] opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleBand(b.id)}
                    className="accent-[#d4b06a] cursor-pointer"
                  />
                  <span className={`text-xs font-serif font-bold ${b.color}`}>
                    {b.label}
                  </span>
                </div>
                <span className="text-[10px] text-[#8e7e65] font-mono">
                  ({b.count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Slot-Pinning Locks */}
      <div className="border-t border-[#2a2215] pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest font-serif font-bold text-[#d4b06a]">
            Pinned Slots (Locks)
          </label>
          <span className="text-[11px] text-[#8e7e65] font-serif">
            Locked slots stay unchanged on roll
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Race Pin */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-2.5 py-1.5 text-xs border rounded-none font-serif w-20 shrink-0 text-center ${
                locks.race ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "border-[#3a2e1d] text-[#8e7e65]"
              }`}
              onClick={() => onToggleLock("race")}
            >
              {locks.race ? "🔒 Race" : "🔓 Race"}
            </button>
            <select
              className="flex-1 mw-select p-1.5 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
              value={character?.race || ""}
              onChange={(e) => onUpdateCharacterSlot("race", e.target.value)}
              disabled={!locks.race && !character?.race}
            >
              <option value="">(Roll on generate)</option>
              {races.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Class Pin */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-2.5 py-1.5 text-xs border rounded-none font-serif w-20 shrink-0 text-center ${
                locks.cls ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "border-[#3a2e1d] text-[#8e7e65]"
              }`}
              onClick={() => onToggleLock("cls")}
            >
              {locks.cls ? "🔒 Class" : "🔓 Class"}
            </button>
            <select
              className="flex-1 mw-select p-1.5 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
              value={character?.cls || ""}
              onChange={(e) => onUpdateCharacterSlot("cls", e.target.value)}
              disabled={!locks.cls && !character?.cls}
            >
              <option value="">(Roll on generate)</option>
              <option value="Custom">Custom Class</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sign Pin */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-2.5 py-1.5 text-xs border rounded-none font-serif w-20 shrink-0 text-center ${
                locks.sign ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "border-[#3a2e1d] text-[#8e7e65]"
              }`}
              onClick={() => onToggleLock("sign")}
            >
              {locks.sign ? "🔒 Sign" : "🔓 Sign"}
            </button>
            <select
              className="flex-1 mw-select p-1.5 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
              value={character?.sign || ""}
              onChange={(e) => onUpdateCharacterSlot("sign", e.target.value)}
              disabled={!locks.sign && !character?.sign}
            >
              <option value="">(Roll on generate)</option>
              {signs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Lock Switches for Objectives & Restrictions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              className={`py-1.5 px-2 text-xs border font-serif text-center ${
                locks.major ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "border-[#3a2e1d] text-[#8e7e65]"
              }`}
              onClick={() => onToggleLock("major")}
            >
              {locks.major ? "🔒 Major Objective" : "🔓 Major Objective"}
            </button>

            <button
              type="button"
              className={`py-1.5 px-2 text-xs border font-serif text-center ${
                locks.rest ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]" : "border-[#3a2e1d] text-[#8e7e65]"
              }`}
              onClick={() => onToggleLock("rest")}
            >
              {locks.rest ? "🔒 Restrictions" : "🔓 Restrictions"}
            </button>
          </div>
        </div>
      </div>

      {/* Pool Explorer Button */}
      <div className="border-t border-[#2a2215] pt-4">
        <button
          type="button"
          className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-[#c2b291] flex items-center justify-center gap-1.5"
          onClick={onOpenPoolBrowser}
        >
          <span>📜 Browse Full Pools &amp; Rules</span>
        </button>
      </div>
    </div>
  );
}
