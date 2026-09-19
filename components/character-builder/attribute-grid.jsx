"use client";
import { ATTRS, ATTR_TIP } from "../../lib/character-math.mjs";

export default function AttributeGrid({ attrs = {}, signName = "" }) {
  return (
    <div className="attribute-grid grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 py-2.5">
      {ATTRS.map((attr, idx) => {
        const data = attrs[attr] || { v: 40, parts: [] };
        // Extract bonus notes (exclude the base race part)
        const bonusParts = (data.parts || []).filter((p) => !p.includes("race"));
        const bonusText = bonusParts.length > 0 ? ` (${bonusParts.join(", ")})` : "";
        const isAltRow = Math.floor(idx / 2) % 2 === 1;

        return (
          <div
            key={attr}
            className={`attribute-row flex items-center justify-between px-3 py-1.5 min-h-[36px] border border-[#2a2318] hover:border-[#4a3f2d] transition-colors rounded-[1px] ${
              isAltRow ? "bg-[#1c160f]" : "bg-[#130f0a]"
            }`}
            title={`${attr}: ${ATTR_TIP[attr] || ""}`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="font-serif text-[#f3e6c8] text-sm sm:text-base font-medium truncate">{attr}</span>
              {bonusText && (
                <span className="text-xs text-[#b8a078] font-mono truncate" title={bonusText}>
                  {bonusText}
                </span>
              )}
            </div>
            <strong className="font-mono text-[#d4b06a] text-base sm:text-lg font-bold pl-2">
              {data.v}
            </strong>
          </div>
        );
      })}
    </div>
  );
}
