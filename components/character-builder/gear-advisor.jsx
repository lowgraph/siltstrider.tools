"use client";
import { useState, useEffect } from "react";
import {useGameData} from '../use-game-data';
import {GearSourcesView} from './gear-sources';
import {BestInSlotView} from './best-in-slot-view';
import { buildGearGroups } from '../../lib/gear-rows.mjs';
import { resolveBestInSlotPicks } from '../../lib/best-in-slot.mjs';
import { recommendedLoadouts } from '../../lib/recommended-loadout.mjs';

export default function GearAdvisor(props){
  const [enabled,setEnabled]=useState(false);
  const result=useGameData('gear',{enabled});
  const bisResult=useGameData('bestInSlot',{enabled});
  return <GearAdvisorView {...props} result={result} bisResult={bisResult} onLoad={()=>setEnabled(true)}/>;
}

export function GearAdvisorView({ build, beast=false, attrs={}, result, bisResult, onLoad, onEquip }) {
  const [ranking,setRanking]=useState(null);
  const [rankError,setRankError]=useState(null);
  const [nearStart, setNearStart] = useState(false);
  const [stealEarly, setStealEarly] = useState(true);
  const [endgameEarly, setEndgameEarly] = useState(false);
  const [darkBrotherhood, setDarkBrotherhood] = useState(false);
  const gearToggles = {theft:stealEarly,endgame:endgameEarly,nearStart,darkBrotherhood};
  const [optimizing, setOptimizing] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [weaponSetup, setWeaponSetup] = useState('one-handed');
  const displayedRanking = ranking && { ...ranking, weaponSetup, twoHand: weaponSetup === 'two-handed', shield: weaponSetup === 'one-handed' ? 'recommended' : 'none' };

  const resolveRanking = () => {
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
    setRanking(null);
    setRankError(null);
    setHasRun(false);
  }, [buildKey]);

  const handleOptimize = () => {
    onLoad();
    setOptimizing(true);
    setHasRun(true);
    try {
      const prof = resolveRanking();
      setRanking(prof);
      setRankError(null);
    } catch(error) {
      setRankError(error.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleEquipToLoadout = (late = false) => {
    try {
      const groups = late
        ? resolveBestInSlotPicks(bisResult.data, build, { beast, weaponSetup, allowFormidableSources:endgameEarly }).groups
        : buildGearGroups(result.data.catalogs, build, gearToggles, displayedRanking, {beast});
      onEquip(recommendedLoadouts(groups, bisResult.data.catalogs, build, {late}));
    } catch (error) { setRankError(error.message); }
  };

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
                onChange={(e) => setStealEarly(e.target.checked)}
              />
              <span>Steal early gear</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-fg-2">
              <input
                type="checkbox"
                className="accent-accent w-4 h-4"
                checked={endgameEarly}
                onChange={(e) => setEndgameEarly(e.target.checked)}
              />
              <span>Endgame gear early</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-fg-2">
              <input
                type="checkbox"
                className="accent-accent w-4 h-4"
                checked={nearStart}
                onChange={(e) => setNearStart(e.target.checked)}
              />
              <span>Near starting areas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-fg-2"
              title="Tribunal's assassins may attack while you rest, from level 1, each wearing the whole light armor set">
              <input
                type="checkbox"
                className="accent-accent w-4 h-4"
                checked={darkBrotherhood}
                onChange={(e) => setDarkBrotherhood(e.target.checked)}
              />
              <span>Dark Brotherhood armor</span>
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
            disabled={!hasRun || result.status !== "ready" || bisResult?.status !== "ready"}
            onClick={() => handleEquipToLoadout(false)}
            title="Equip recommended gear kit directly into your active loadout"
          >
            Equip early recommendations →
          </button>
          <button type="button" className="mw-btn px-5 py-2.5" disabled={!hasRun || bisResult?.status !== "ready"} onClick={() => handleEquipToLoadout(true)}>Equip late-game recommendations →</button>
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
      {hasRun ? (
        <div className="gear-results-container text-sm overflow-x-auto text-fg-2">
          <GearSourcesView ranking={displayedRanking} build={build} beast={beast} result={result} toggles={gearToggles}/>
          {bisResult?.status === "ready" ? (
            <BestInSlotView
              featureData={bisResult.data}
              build={build}
              beast={beast}
              weaponSetup={weaponSetup}
              allowFormidableSources={endgameEarly}
            />
          ) : (
            <details open><summary>Optimized endgame kit</summary>
              {bisResult?.status === "error" ? (
                <p role="alert">Late-game equipment could not be loaded. <button type="button" className="mw-btn" onClick={bisResult.retry}>Retry</button></p>
              ) : <p role="status">Loading late-game equipment...</p>}
            </details>
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
