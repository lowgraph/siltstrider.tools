"use client";
import { useState, useEffect } from "react";

export default function GearAdvisor({ build }) {
  const [stealEarly, setStealEarly] = useState(() => document.getElementById("gear-steal")?.checked ?? true);
  const [endgameEarly, setEndgameEarly] = useState(() => document.getElementById("gear-endgame")?.checked ?? false);
  const [gearHtml, setGearHtml] = useState("");
  const [optimizing, setOptimizing] = useState(false);

  // Sync with DOM checkboxes if legacy runtime is present
  const handleToggleSteal = (val) => {
    setStealEarly(val);
    const el = document.getElementById("gear-steal");
    if (el) {
      el.checked = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleToggleEndgame = (val) => {
    setEndgameEarly(val);
    const el = document.getElementById("gear-endgame");
    if (el) {
      el.checked = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const buildKey = JSON.stringify(build);
  // A result is valid only for the character used to compute it.
  useEffect(() => {
    setGearHtml("");
    const box = document.getElementById("gear-box");
    if (box) box.innerHTML = "";
  }, [buildKey]);

  const handleOptimize = () => {
    setOptimizing(true);
    try {
      const btn = document.getElementById("btn-gear");
      if (btn) btn.click();
      else if (typeof window.optimizeGear === "function") window.optimizeGear();
      setGearHtml(document.getElementById("gear-box")?.innerHTML || "");
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    const box = document.getElementById("gear-box");
    if (!box) return;
    const observer = new MutationObserver(() => setGearHtml(box.innerHTML));
    observer.observe(box, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="gear-advisor mt-6 p-5 space-y-5 text-sm w-full max-w-[1280px] mx-auto"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-[#2a2318] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#f3e6c8] tracking-wide flex items-center gap-2">
            <span>Gear Recommendations &amp; Progression Advisor</span>
          </h3>
          <p className="text-sm text-[#b8a078] mt-0.5">
            Optimized armor, weapons, and artifact acquisition tailored to your major weapon and armor skills.
          </p>
        </div>

        {/* Action Controls & Policy Toggles */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-[#f3e6c8]">
            <input
              type="checkbox"
              className="accent-[#d4b06a] w-4 h-4"
              checked={stealEarly}
              onChange={(e) => handleToggleSteal(e.target.checked)}
            />
            <span>Steal early gear</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-[#f3e6c8]">
            <input
              type="checkbox"
              className="accent-[#d4b06a] w-4 h-4"
              checked={stealEarly && endgameEarly}
              disabled={!stealEarly}
              onChange={(e) => handleToggleEndgame(e.target.checked)}
            />
            <span>Endgame gear early</span>
          </label>

          <button
            type="button"
            className="mw-btn h-10 px-4 py-2 font-serif font-bold text-sm"
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? "Analyzing loadout..." : "Optimize Gear"}
          </button>
        </div>
      </div>

      {/* Rendered Gear Recommendations */}
      {gearHtml ? (
        <div
          className="gear-results-container text-sm overflow-x-auto text-[#f3e6c8]"
          dangerouslySetInnerHTML={{ __html: gearHtml }}
        />
      ) : (
        <div className="p-8 text-center bg-[#100d08] border border-[#221c13] text-[#b8a078] text-sm italic mw-groove-panel">
          Click <strong>&quot;Optimize Gear&quot;</strong> to generate early and late-game equipment recommendations for this build.
        </div>
      )}
    </div>
  );
}
