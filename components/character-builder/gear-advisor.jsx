"use client";
import { useState, useEffect } from "react";
import {useGameData} from '../use-game-data';
import {GearSourcesView} from './gear-sources';

// Keep the verified endgame tables and notes; the bundle supplies early rows.
function endgameHtml(html){
  const template=document.createElement('template');
  template.innerHTML=html;
  for(const details of template.content.querySelectorAll('details')){
    if(details.querySelector('summary')?.textContent.trim()==='Early game')details.remove();
  }
  return template.innerHTML;
}

export default function GearAdvisor(props){
  const [enabled,setEnabled]=useState(false);
  const result=useGameData('gear',{enabled});
  return <GearAdvisorView {...props} result={result} onLoad={()=>setEnabled(true)}/>;
}

export function GearAdvisorView({ build, beast=false, attrs={}, result, onLoad }) {
  const [ranking,setRanking]=useState(null);
  const [rankError,setRankError]=useState(null);
  const [nearStart,setNearStart]=useState(false);
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
    setRanking(null);
    setRankError(null);
    const box = document.getElementById("gear-box");
    if (box) box.innerHTML = "";
  }, [buildKey]);

  const handleOptimize = () => {
    onLoad();
    setOptimizing(true);
    try {
      if(typeof window.makeBuildProfile!=='function')throw new Error('Build ranking is not ready. Try again.');
      setRanking(window.makeBuildProfile(build.maj,build.min,build.spec,build.race,attrs,build.sign));
      setRankError(null);
      const btn = document.getElementById("btn-gear");
      if (btn) btn.click();
      else if (typeof window.optimizeGear === "function") window.optimizeGear();
      setGearHtml(endgameHtml(document.getElementById("gear-box")?.innerHTML || ""));
    } catch(error) {
      setRankError(error.message);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    const box = document.getElementById("gear-box");
    if (!box) return;
    const observer = new MutationObserver(() => setGearHtml(endgameHtml(box.innerHTML)));
    observer.observe(box, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="gear-advisor mt-6 px-8 sm:px-10 py-6 space-y-5 text-sm w-full"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-[#2a2318] pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#f3e6c8] tracking-wide flex items-center gap-2">
            <span>Gear Recommendations &amp; Progression Advisor</span>
          </h3>
          <p className="text-sm text-[#b8a078] mt-1">
            Optimized armor, weapons, and artifact acquisition tailored to your major weapon and armor skills.
          </p>
        </div>

        {/* Action Controls & Policy Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm pt-2 lg:pt-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
                checked={endgameEarly}
                onChange={(e) => handleToggleEndgame(e.target.checked)}
              />
              <span>Endgame gear early</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#f3e6c8]">
              <input type="checkbox" className="accent-[#d4b06a] w-4 h-4" checked={nearStart} onChange={e=>setNearStart(e.target.checked)}/>
              <span>Near starting areas</span>
            </label>
          </div>

          <button
            type="button"
            className="w-full sm:w-auto mw-btn py-2.5 px-6 font-serif font-bold text-sm tracking-wide shadow-md whitespace-nowrap text-center"
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? "Analyzing loadout..." : "Optimize Gear"}
          </button>
        </div>
      </div>

      {/* Rendered Gear Recommendations */}
      {rankError&&<p role="alert">{rankError}</p>}
      {gearHtml ? (
        <div className="gear-results-container text-sm overflow-x-auto text-[#f3e6c8]">
          <GearSourcesView ranking={ranking} build={build} beast={beast} result={result} toggles={{theft:stealEarly,endgame:endgameEarly,nearStart}}/>
          <div dangerouslySetInnerHTML={{ __html: gearHtml }}/>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#100d08] border border-[#221c13] text-[#b8a078] text-sm italic mw-groove-panel">
          Click <strong>&quot;Optimize Gear&quot;</strong> to generate early and late-game equipment recommendations for this build.
        </div>
      )}
    </div>
  );
}
