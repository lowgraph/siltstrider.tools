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
  usingPreferred = true,
  onRestorePreferred,
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
    <div className="run-configurator border border-line-9 bg-surface-3 p-5 text-fg-2 space-y-5">
      {/* Primary Action */}
      <div>
        <button
          type="button"
          className="w-full mw-btn py-3.5 px-6 font-serif text-base font-bold tracking-wider uppercase text-fg-2 shadow-lg flex items-center justify-center gap-2 border-2 border-accent"
          onClick={onGenerateRun}
          id="react-btn-generate-run"
        >
          <span>Generate Run</span>
        </button>
        <p className="text-[11px] text-fg-11 font-serif text-center mt-1.5">
          Rolls character identity, victory condition, and gameplay modifiers based on chosen settings.
        </p>
      </div>

      {/* Preferred settings: remembered on this device; a loaded seed's are temporary */}
      <p className="text-[11px] text-fg-11 font-serif m-0" id="cfg-preferred-note">
        {usingPreferred ? (
          "Your settings are remembered on this device for your next run."
        ) : (
          <>
            These settings came with a loaded seed.{" "}
            <button type="button" className="underline text-accent font-bold" onClick={onRestorePreferred}>
              Back to my settings
            </button>
          </>
        )}
      </p>

      {/* Difficulty Presets Strip */}
      <div className="border-t border-line-11 pt-4">
        <label className="text-xs uppercase tracking-widest font-serif font-bold text-accent block mb-2">
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
                  isActive ? "active ring-1 ring-accent text-accent" : "text-fg-7"
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
      <div className="border-t border-line-11 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cfg-rest-count" className="text-xs uppercase tracking-wider font-serif font-bold text-fg-7 block mb-1.5">
            Active Restrictions
          </label>
          <select
            id="cfg-rest-count"
            className="w-full mw-select p-2 text-sm font-serif bg-surface-1 border border-line-9 text-fg-2"
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
          <label htmlFor="cfg-obj-count" className="text-xs uppercase tracking-wider font-serif font-bold text-fg-7 block mb-1.5">
            Minor Objectives
          </label>
          <select
            id="cfg-obj-count"
            className="w-full mw-select p-2 text-sm font-serif bg-surface-1 border border-line-9 text-fg-2"
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
      <div className="border-t border-line-11 pt-4">
        <label className="text-xs uppercase tracking-widest font-serif font-bold text-accent block mb-2">
          Difficulty Filter Pool
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "Easy", label: "Easy", count: easyCount },
            { id: "Medium", label: "Medium", count: medCount },
            { id: "Hard", label: "Hard", count: hardCount },
            { id: "Grind", label: "Grind", count: grindCount }
          ].map((b) => {
            const isChecked = !!allowedBands[b.id];
            return (
              <label
                key={b.id}
                className={`flex items-center justify-between p-2 border cursor-pointer select-none transition-colors ${
                  isChecked
                    ? "bg-surface-14 border-accent/50 text-fg-2"
                    : "bg-surface-2 border-line-12 text-fg-15 opacity-75"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleBand(b.id)}
                    className="accent-accent cursor-pointer"
                  />
                  <span className="text-xs font-serif font-bold text-fg-2">
                    {b.label}
                  </span>
                </div>
                <span className="text-[10px] text-fg-13 font-mono">
                  ({b.count})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Slot-Pinning Locks */}
      <div className="border-t border-line-11 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-widest font-serif font-bold text-accent">
            Pinned Slots (Locks)
          </label>
          <span className="text-[11px] text-fg-13 font-serif">
            Locked slots stay unchanged on roll
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Race Pin */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-2.5 py-1.5 text-xs border rounded-none font-serif w-20 shrink-0 text-center ${
                locks.race ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
              }`}
              onClick={() => onToggleLock("race")}
            >
              {locks.race ? "Locked" : "Lock"}
            </button>
            <select
              className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
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
                locks.cls ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
              }`}
              onClick={() => onToggleLock("cls")}
            >
              {locks.cls ? "Locked" : "Lock"}
            </button>
            <select
              className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
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
                locks.sign ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
              }`}
              onClick={() => onToggleLock("sign")}
            >
              {locks.sign ? "Locked" : "Lock"}
            </button>
            <select
              className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
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
                locks.major ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
              }`}
              onClick={() => onToggleLock("major")}
            >
              {locks.major ? "Major: Locked" : "Major: Lock"}
            </button>

            <button
              type="button"
              className={`py-1.5 px-2 text-xs border font-serif text-center ${
                locks.rest ? "bg-surface-18 border-accent text-accent" : "bg-surface-3 border-line-9 text-fg-13"
              }`}
              onClick={() => onToggleLock("rest")}
            >
              {locks.rest ? "Restrictions: Locked" : "Restrictions: Lock"}
            </button>
          </div>
        </div>
      </div>

      {/* Pool Explorer Button */}
      <div className="border-t border-line-11 pt-4">
        <button
          type="button"
          className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold text-fg-7 flex items-center justify-center gap-1.5"
          onClick={onOpenPoolBrowser}
        >
          <span>Browse Full Pools &amp; Rules</span>
        </button>
      </div>
    </div>
  );
}
