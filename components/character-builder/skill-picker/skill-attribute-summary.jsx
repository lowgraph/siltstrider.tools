"use client";
import React from "react";
import { ATTRS, ATTR_ABBR, calculateAttributeDistribution } from "../../../lib/character-math.mjs";

export default function SkillAttributeSummary({ maj = [], min = [] }) {
  const distribution = calculateAttributeDistribution(maj, min);
  // Exclude Luck from skill count as it governs no skills in Morrowind
  const primaryAttrs = ATTRS.filter((a) => a !== "Luck");

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-surface-2 border border-line-11 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-bold text-accent uppercase tracking-wider text-[11px]">
            Class Skill Distribution:
          </span>
          <span
            className="cursor-help text-fg-11 hover:text-fg-2 text-[11px]"
            title="Morrowind Level-Up Rules: Each level-up allows picking 3 attributes to increase. An attribute receives up to a x5 bonus (+5) if you accumulate 10 skill increases governed by that attribute (via Major, Minor, or Misc training) during that level. Class skills advance your character level; Misc skills allow safe trainer leveling without advancing character level."
          >
            ⓘ
          </span>
        </div>
        <span className="font-mono text-[10px] text-fg-15">
          10 Skills / 7 Attributes
        </span>
      </div>

      {/* Attribute Distribution Chips */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
        {primaryAttrs.map((attr) => {
          const count = distribution[attr] || 0;
          const abbr = ATTR_ABBR[attr] || attr.slice(0, 3).toUpperCase();
          const highlightClass =
            count >= 3
              ? "border-accent bg-surface-13 text-fg-2 font-bold"
              : count > 0
              ? "border-line-7 bg-surface-4 text-accent"
              : "border-line-12 bg-surface-1 text-fg-14";

          return (
            <div
              key={attr}
              title={`${attr}: ${count} class skill${count === 1 ? "" : "s"}`}
              className={`flex items-center justify-between px-1.5 py-1.5 border text-center font-mono text-[11px] ${highlightClass}`}
            >
              <span>{abbr}</span>
              <span className="font-bold">({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
