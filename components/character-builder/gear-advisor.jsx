"use client";
import { useState, useEffect } from "react";
import {useGameData} from '../use-game-data';
import {GearSourcesView} from './gear-sources';
import {BestInSlotView} from './best-in-slot-view';
import { QUICK_LOADOUT_KITS } from '../equipment-studio/loadout-tabs-bar';

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
  const bisResult=useGameData('bestInSlot',{enabled});
  return <GearAdvisorView {...props} result={result} bisResult={bisResult} onLoad={()=>setEnabled(true)}/>;
}

export function GearAdvisorView({ build, beast=false, attrs={}, result, bisResult, onLoad }) {
  const [ranking,setRanking]=useState(null);
  const [rankError,setRankError]=useState(null);
  const [nearStart, setNearStart] = useState(() => document.getElementById("gear-near-start")?.checked ?? false);
  const [stealEarly, setStealEarly] = useState(() => document.getElementById("gear-steal")?.checked ?? true);
  const [endgameEarly, setEndgameEarly] = useState(() => document.getElementById("gear-endgame")?.checked ?? false);
  const [gearHtml, setGearHtml] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [weaponSetup, setWeaponSetup] = useState('one-handed');
  const displayedRanking = ranking && { ...ranking, weaponSetup, twoHand: weaponSetup === 'two-handed', shield: weaponSetup === 'one-handed' ? 'recommended' : 'none' };

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

  const handleToggleNearStart = (val) => {
    setNearStart(val);
    const el = document.getElementById("gear-near-start");
    if (el) {
      el.checked = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const resolveRanking = () => {
    if (typeof window !== "undefined" && typeof window.makeBuildProfile === 'function') {
      return window.makeBuildProfile(build?.maj || [], build?.min || [], build?.spec || '', build?.race || '', attrs, build?.sign || '');
    }
    const maj = build?.maj || [];
    const min = build?.min || [];
    const skills = [...maj, ...min];
    const armPool = ["Heavy Armor", "Medium Armor", "Light Armor", "Unarmored"].filter(s => skills.includes(s));
    const wepPool = ["Long Blade", "Short Blade", "Blunt Weapon", "Axe", "Spear", "Marksman", "Hand-to-hand"].filter(s => skills.includes(s));
    return {
      maj, min, spec: build?.spec || '', raceName: build?.race || '', attrs, sign: build?.sign || '',
      primaryWep: wepPool[0] || "Long Blade",
      primaryArmor: armPool[0] || "Light Armor",
      wepRanked: (wepPool.length ? wepPool : ["Long Blade"]).map(n => ({ n, s: maj.includes(n) ? 50 : 30 })),
      armRanked: (armPool.length ? armPool : ["Light Armor"]).map(n => ({ n, s: maj.includes(n) ? 50 : 30 })),
      twoHand: false,
      shield: skills.includes("Block") ? "recommended" : "optional"
    };
  };

  const buildKey = JSON.stringify(build);
  // A result is valid only for the character used to compute it.
  useEffect(() => {
    setGearHtml("");
    setRanking(null);
    setRankError(null);
    setHasRun(false);
    const box = document.getElementById("gear-box");
    if (box) box.innerHTML = "";
  }, [buildKey]);

  const handleOptimize = () => {
    onLoad();
    setOptimizing(true);
    setHasRun(true);
    try {
      const prof = resolveRanking();
      setRanking(prof);
      setRankError(null);
      const btn = document.getElementById("btn-gear");
      if (btn) btn.click();
      else if (typeof window !== "undefined" && typeof window.optimizeGear === "function") window.optimizeGear();
      setGearHtml(endgameHtml(document.getElementById("gear-box")?.innerHTML || ""));
    } catch(error) {
      setRankError(error.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleEquipToLoadout = (isEndgame = false) => {
    const isHeavy = build?.maj?.includes("Heavy Armor") || build?.min?.includes("Heavy Armor");
    const isMedium = build?.maj?.includes("Medium Armor") || build?.min?.includes("Medium Armor");
    let kitId = "kit-starter-light";
    if (isEndgame) {
      kitId = "kit-endgame-daedric";
    } else if (isHeavy) {
      kitId = "kit-starter-heavy";
    } else if (isMedium) {
      kitId = "kit-starter-medium";
    }

    const kit = QUICK_LOADOUT_KITS.find((k) => k.id === kitId) || QUICK_LOADOUT_KITS[0];
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("silt-equip-kit", { detail: { kitItems: kit.items } }));
      window.dispatchEvent(new CustomEvent("silt-open-equipment"));
      window.dispatchEvent(new CustomEvent("silt-open-paperdoll"));
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
        background: "var(--color-surface-7)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-line-11 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-fg-2 tracking-wide flex items-center gap-2">
            <span>Gear Recommendations &amp; Progression Advisor</span>
          </h3>
          <p className="text-sm text-fg-8 mt-1">
            Optimized armor, weapons, and artifact acquisition tailored to your major weapon and armor skills.
          </p>
        </div>

        {/* Action Controls & Policy Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm pt-2 lg:pt-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-fg-2">
              <input
                type="checkbox"
                className="accent-accent w-4 h-4"
                checked={stealEarly}
                onChange={(e) => handleToggleSteal(e.target.checked)}
              />
              <span>Steal early gear</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-fg-2">
              <input
                type="checkbox"
                className="accent-accent w-4 h-4"
                checked={endgameEarly}
                onChange={(e) => handleToggleEndgame(e.target.checked)}
              />
              <span>Endgame gear early</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-fg-2">
              <input
                type="checkbox"
                className="accent-accent w-4 h-4"
                checked={nearStart}
                onChange={(e) => handleToggleNearStart(e.target.checked)}
              />
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

          <button
            type="button"
            className="w-full sm:w-auto mw-btn py-2.5 px-5 font-serif font-bold text-sm tracking-wide shadow-md whitespace-nowrap text-center text-accent"
            onClick={() => handleEquipToLoadout(endgameEarly)}
            title="Equip recommended gear kit directly into your active loadout"
          >
            Equip Kit to Loadout →
          </button>
        </div>
      </div>

      {/* Rendered Gear Recommendations */}
      <div role="group" aria-label="Weapon setup" className="flex flex-wrap gap-2">
        {[['one-handed', 'One-handed + shield'], ['two-handed', 'Two-handed']].map(([value, label]) => (
          <button key={value} type="button" className={'mw-btn px-4 py-2' + (weaponSetup === value ? ' active ring-1 ring-accent' : '')} aria-pressed={weaponSetup === value}
            onClick={() => setWeaponSetup(value)}>{label}</button>
        ))}
      </div>
      {rankError&&<p role="alert">{rankError}</p>}
      {gearHtml || (hasRun && bisResult?.status === "ready") ? (
        <div className="gear-results-container text-sm overflow-x-auto text-fg-2">
          <GearSourcesView ranking={displayedRanking} build={build} beast={beast} result={result} toggles={{theft:stealEarly,endgame:endgameEarly,nearStart}}/>
          {bisResult?.status === "ready" ? (
            <BestInSlotView
              featureData={bisResult.data}
              build={build}
              beast={beast}
              weaponSetup={weaponSetup}
              allowFormidableSources={endgameEarly}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: gearHtml }}/>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-surface-2 border border-line-12 text-fg-8 text-sm italic mw-groove-panel">
          Click <strong>&quot;Optimize Gear&quot;</strong> to generate early and late-game equipment recommendations for this build.
        </div>
      )}
    </div>
  );
}
