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

      {/* Difficulty Presets Strip: the page's only one, beside the settings a preset sets */}
      <div className="border-t border-line-11 pt-4" role="group" aria-labelledby="cfg-preset-label">
        <span id="cfg-preset-label" className="text-xs uppercase tracking-widest font-serif font-bold text-accent block mb-2">
          Difficulty Preset
        </span>
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
                aria-pressed={isActive}
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
                    : "bg-surface-2 border-line-12 text-fg-15"
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

      {/* CHL-2: choose instead of rolling. A choice here is kept when you roll (its lock on
          the sheet turns on); "Roll it" gives the slot back to the dice. The locks themselves
          are only on the sheet, next to what they keep. */}
      <div className="border-t border-line-11 pt-4 space-y-3">
        <div>
          <span id="cfg-choose-label" className="text-xs uppercase tracking-widest font-serif font-bold text-accent block">
            Choose instead of rolling
          </span>
          <p className="text-[11px] text-fg-11 font-serif mt-1 mb-0">
            A choice here stays when you roll. To keep a rolled result, lock it on the sheet.
          </p>
        </div>

        <div className="space-y-2.5" role="group" aria-labelledby="cfg-choose-label">
          {[
            { slot: "race", label: "Race", options: races.map((r) => [r, r]) },
            { slot: "cls", label: "Class", options: [["Custom", "Custom Class"], ...classes.map((c) => [c, c])] },
            { slot: "sign", label: "Birthsign", options: signs.map((s) => [s, s]) }
          ].map(({ slot, label, options: listed }) => {
            // The locked value is always an option, so the picker never says "Roll it" for a
            // kept slot (before the lists load, or for a value they do not hold).
            const kept = locks[slot] ? character?.[slot] || "" : "";
            const options = kept && !listed.some(([value]) => value === kept) ? [[kept, kept], ...listed] : listed;
            return (
            <div key={slot} className="flex items-center gap-2">
              <label htmlFor={`cfg-choose-${slot}`} className="text-xs font-serif font-bold text-fg-7 w-20 shrink-0">
                {label}
              </label>
              <select
                id={`cfg-choose-${slot}`}
                className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={kept}
                onChange={(e) => onUpdateCharacterSlot(slot, e.target.value)}
              >
                <option value="">Roll it</option>
                {options.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
            );
          })}
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
