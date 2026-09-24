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
            className={`attribute-row flex items-center justify-between px-3 py-1.5 min-h-[36px] border border-line-11 hover:border-line-7 transition-colors rounded-[1px] ${
              isAltRow ? "bg-surface-6" : "bg-surface-3"
            }`}
            title={`${attr}: ${ATTR_TIP[attr] || ""}`}
          >
            <div className="flex flex-wrap items-center gap-x-2 min-w-0 pr-2">
              <span className="font-serif text-fg-2 text-sm sm:text-base font-medium">{attr}</span>
              {bonusText && (
                <span className="text-xs text-fg-8 font-mono" title={bonusText}>
                  {bonusText}
                </span>
              )}
            </div>
            <strong className="shrink-0 whitespace-nowrap font-mono text-accent text-base sm:text-lg font-bold pl-2">
              {data.v}
            </strong>
          </div>
        );
      })}
    </div>
  );
}
