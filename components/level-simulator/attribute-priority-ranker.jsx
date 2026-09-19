"use client";
import { ARCHETYPES, ATTR_ABBR } from "../../lib/level-math.mjs";

export default function AttributePriorityRanker({
  priority,
  archetypeId,
  detectedArchetype,
  onSelectArchetype,
  onReorderPriority
}) {
  const moveAttr = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= priority.length) return;
    const next = [...priority];
    const temp = next[index];
    next[index] = next[newIdx];
    next[newIdx] = temp;
    onReorderPriority(next);
  };

  const detectedName = detectedArchetype?.name || "Melee Tank / Warrior";

  return (
    <div className="attribute-priority-ranker space-y-3 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#221c13] pb-2">
        <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
          Attribute Leveling Priority
        </h4>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#9e8b6b]">Detected Archetype:</span>
          <span className="font-serif font-bold text-[#f3e6c8] bg-[#1a140d] px-2 py-0.5 border border-[#3a3020]">
            {detectedName}
          </span>
        </div>
      </div>

      {/* Preset Archetype Selectors */}
      <div className="archetype-selector-row">
        <label htmlFor="archetype-select" className="text-xs text-[#9e8b6b] font-serif block mb-1">
          Preset Priority Template:
        </label>
        <select
          id="archetype-select"
          className="w-full mw-select text-xs py-1.5 px-2 font-serif"
          value={archetypeId}
          onChange={(e) => onSelectArchetype(e.target.value)}
          aria-label="Attribute priority archetype preset"
        >
          {Object.values(ARCHETYPES).map((arch) => (
            <option key={arch.id} value={arch.id}>
              {arch.name}
            </option>
          ))}
          <option value="custom">Custom Priority Order</option>
        </select>
      </div>

      {/* Reorderable Attribute Pills */}
      <div className="priority-list grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {priority.map((attr, idx) => (
          <div
            key={attr}
            className="flex items-center justify-between p-1.5 bg-[#16120b] border border-[#2f2518] shadow-sm text-xs"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-mono text-[10px] text-[#d4b06a] font-bold w-4 shrink-0">
                #{idx + 1}
              </span>
              <span className="font-serif font-semibold text-[#f3e6c8] truncate" title={attr}>
                {attr}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center mw-btn text-[10px] font-mono disabled:opacity-30"
                onClick={() => moveAttr(idx, -1)}
                disabled={idx === 0}
                title={`Move ${attr} up`}
                aria-label={`Move ${attr} up`}
              >
                ▲
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center mw-btn text-[10px] font-mono disabled:opacity-30"
                onClick={() => moveAttr(idx, 1)}
                disabled={idx === priority.length - 1}
                title={`Move ${attr} down`}
                aria-label={`Move ${attr} down`}
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mechanics Explanation */}
      <div className="text-[11px] text-[#9e8b6b] leading-tight pt-1">
        <p className="m-0">
          <strong className="text-[#c4b998]">Mechanics Note:</strong> Endurance is prioritized first across all archetypes because Morrowind&apos;s level-up Health gain is non-retroactive. Stealth builds prioritize Strength over Speed as sneak attack multipliers scale directly with Strength.
        </p>
      </div>
    </div>
  );
}
