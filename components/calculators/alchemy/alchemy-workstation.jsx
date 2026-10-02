"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { statNumber, typedStats, typeStat, forgetTypedStats } from "../../../lib/calculator-stats.mjs";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import { useSearchIntent } from "../../use-search-intent";
import { clearSearchIntent } from "../../../lib/search-intent.mjs";
import IngredientCombobox from "./ingredient-combobox";
import ReverseAlchemy from "./reverse-alchemy";
import IngredientSources from "./ingredient-sources";
import ActiveCharacterLink from "../../active-character-link";
import { adaptAlchemy } from "../../../lib/alchemy-catalogs.mjs";
import { sourceIndex } from "../../../lib/ingredient-sources.mjs";
import {
  sharesAlchemyEffect,
  formatEffectLabel,
  calculatePotion
} from "../../../lib/alchemy-math.mjs";

// Where a number goes before there is anything to calculate: a dash, read out in words.
const NO_RESULT = <><span aria-hidden="true">—</span><span className="sr-only">not calculated yet</span></>;

export default function AlchemyWorkstation() {
  const { build, sheet: buildSheet, activeSave } = useActiveCharacter();
  const sheet = activeSave?.sheet || buildSheet;
  const { profile } = useShell();

  // Character stats
  const baseSkill = sheet?.skills?.["Alchemy"]?.v ?? 50;
  const baseInt = sheet?.attrs?.["Intelligence"]?.v ?? 40;
  const baseLuck = sheet?.attrs?.["Luck"]?.v ?? 40;

  const [skill, setSkill] = useState(() => typedStats("alchemy").skill ?? baseSkill);
  const [intelligence, setIntelligence] = useState(() => typedStats("alchemy").intelligence ?? baseInt);
  const [luck, setLuck] = useState(() => typedStats("alchemy").luck ?? baseLuck);
  const [showCustomInputs, setShowCustomInputs] = useState(() => Object.keys(typedStats("alchemy")).length > 0);

  // The sheet sets every number the player has not typed; typed ones stay, across a world
  // switch too, until "Reset to character sheet".
  useEffect(() => {
    const kept = typedStats("alchemy");
    setSkill(kept.skill ?? baseSkill);
    setIntelligence(kept.intelligence ?? baseInt);
    setLuck(kept.luck ?? baseLuck);
  }, [baseSkill, baseInt, baseLuck]);

  // Apparatus selection
  const [mortarId, setMortarId] = useState("apparatus_j_mortar_01");
  const [alembicId, setAlembicId] = useState("none");
  const [calcinatorId, setCalcinatorId] = useState("none");
  const [retortId, setRetortId] = useState("none");

  // Ingredients in the 4 crucible slots
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [slot3, setSlot3] = useState(null);
  const [slot4, setSlot4] = useState(null);

  const [matchFirst, setMatchFirst] = useState(false);
  const [customPotionName, setCustomPotionName] = useState("");

  const handleClearAllIngredients = () => {
    setSlot1(null);
    setSlot2(null);
    setSlot3(null);
    setSlot4(null);
    setCustomPotionName("");
  };

  const gameData = useGameData('alchemy', { enabled: true });
  // Source data loads only when a selected ingredient or finder pair is opened.
  const [wantSources, setWantSources] = useState(false);
  const sourceData = useGameData('ingredientSources', { enabled: wantSources });
  const sourceState = useMemo(() => sourceIndex(wantSources ? { status: sourceData.status, data: sourceData.data } : null),
    [wantSources, sourceData.status, sourceData.data]);
  const sources = { ...sourceState, retry: sourceData.retry };

  const adaptation = useMemo(() => {
    if(gameData.status!=='ready')return {data:null,error:null};
    try{return {data:adaptAlchemy(gameData.data),error:null};}
    catch(error){return {data:null,error};}
  },[gameData.status,gameData.data]);
  const bundleAlchemy=adaptation.data;
  const allIngredients=bundleAlchemy?.ingredients || [];

  // "Add to Alchemy" from site search: put the ingredient in the first empty slot
  // (the last slot when all four are full) once the bundle's ingredients are in.
  const intent = useSearchIntent("alchemy");
  useEffect(() => {
    if (!intent || intent.kind !== "ingredient") return;
    if (!bundleAlchemy) {
      if (gameData.status === "ready" || gameData.status === "error") clearSearchIntent(intent);
      return;
    }
    clearSearchIntent(intent);
    const hit = allIngredients.find(x => x.id === intent.value);
    const slots = [[slot1, setSlot1], [slot2, setSlot2], [slot3, setSlot3], [slot4, setSlot4]];
    if (!hit || slots.some(([current]) => current?.id === hit.id)) return;
    const [, setSlot] = slots.find(([current]) => !current) || slots[3];
    setSlot(hit);
  }, [intent, bundleAlchemy, allIngredients, gameData.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIngestCharacterStats = useCallback(() => {
    forgetTypedStats("alchemy");
    setSkill(baseSkill);
    setIntelligence(baseInt);
    setLuck(baseLuck);
  }, [baseSkill, baseInt, baseLuck]);

  const apparatusTiers = useMemo(() => Object.fromEntries(
    ['mortar','alembic','calcinator','retort'].map(type=>[type,
      [...(type==='mortar'?[]:[{id:'none',name:'None',quality:0}]),
       ...(bundleAlchemy?.apparatus[type]||[]).map(a=>({id:a.id,name:a.n,quality:a.q}))]
    ])
  ),[bundleAlchemy]);

  // Selected apparatus qualities
  const mortar = useMemo(() => apparatusTiers.mortar.find((a) => a.id === mortarId) || apparatusTiers.mortar.at(-1) || {id:"",quality:0}, [apparatusTiers, mortarId]);
  const alembic = useMemo(() => apparatusTiers.alembic.find((a) => a.id === alembicId) || apparatusTiers.alembic[0], [apparatusTiers, alembicId]);
  const calcinator = useMemo(() => apparatusTiers.calcinator.find((a) => a.id === calcinatorId) || apparatusTiers.calcinator[0], [apparatusTiers, calcinatorId]);
  const retort = useMemo(() => apparatusTiers.retort.find((a) => a.id === retortId) || apparatusTiers.retort[0], [apparatusTiers, retortId]);

  // Active slots
  const selectedIngredients = useMemo(() => {
    return [slot1, slot2, slot3, slot4];
  }, [slot1, slot2, slot3, slot4]);

  // Calculate potion properties
  const potion = useMemo(() => {
    return calculatePotion({
      ingredients: selectedIngredients,
      settings: bundleAlchemy?.settings ?? null,
      alchemySkill: skill,
      intelligence,
      luck,
      mortarQuality: mortar.quality,
      alembicQuality: alembic.quality,
      calcinatorQuality: calcinator.quality,
      retortQuality: retort.quality
    });
  }, [selectedIngredients, skill, intelligence, luck, mortar, alembic, calcinator, retort, bundleAlchemy]);

  // The ingredients a slot may take; its box filters them by what is typed.
  const getPoolForSlot = (slotIndex) => {
    const otherSelectedIds = new Set(
      selectedIngredients
        .filter((_, i) => i !== slotIndex)
        .filter(Boolean)
        .map((ing) => ing.id)
    );

    return allIngredients.filter((ing) => {
      if (otherSelectedIds.has(ing.id)) return false;

      // If matchFirst is on and slot > 0, check if ing shares any effect with slot1
      if (matchFirst && slotIndex > 0 && slot1) {
        const hasCommon = sharesAlchemyEffect(slot1, ing);
        if (!hasCommon) return false;
      }

      return true;
    });
  };

  const slotsData = [
    { slotIndex: 0, current: slot1, setSlot: setSlot1 },
    { slotIndex: 1, current: slot2, setSlot: setSlot2 },
    { slotIndex: 2, current: slot3, setSlot: setSlot3 },
    { slotIndex: 3, current: slot4, setSlot: setSlot4 }
  ];

  const dataError=gameData.error || adaptation.error;
  if(dataError)return <div role="alert">Alchemy data could not be loaded. {dataError.message} <button className="mw-btn" onClick={gameData.retry}>Retry alchemy data</button></div>;
  if(!bundleAlchemy)return <p role="status">Loading alchemy data...</p>;

  return (
    <div className="alchemy-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-6">
      {/* Workstation Header Bar */}
      <div className="bg-surface-7 p-4 border border-line-11 mw-groove-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mw-caption font-serif text-xl sm:text-2xl font-bold text-fg-2 tracking-wide m-0">
            Alchemy
          </h2>
          <p className="text-xs text-fg-11 mt-0.5 m-0 font-sans">
            Combine up to four ingredients with apparatus quality modifiers to calculate potion potency, duration, and brewing success.
          </p>
        </div>
      </div>

      {/* Top Banner: Character Stats Strip & Live Game-Data Status */}
      <div className="p-3 bg-surface-5 border border-line-11 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-serif font-bold text-accent">
              Using <ActiveCharacterLink build={build} />:
            </span>
            <span className="text-fg-9 whitespace-nowrap">
              Alchemy <strong className="text-accent">{skill}</strong> (INT: <strong className="text-accent">{intelligence}</strong> | LUK: <strong className="text-accent">{luck}</strong>)
            </span>
            <button
              type="button"
              id="alc-toggle-custom-stats"
              className="text-xs text-accent underline hover:text-accent-hover font-serif cursor-pointer ml-1 bg-transparent border-0 p-0"
              onClick={() => setShowCustomInputs((v) => !v)}
              aria-expanded={showCustomInputs}
            >
              {showCustomInputs ? "— hide inputs" : "— type your own"}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {gameData.status === 'ready' ? (
              <span className="text-xs px-2 py-0.5 rounded border border-success-line-5 bg-success-surface-1 text-success-3 font-mono flex items-center gap-1.5 shadow-inner" title={`Loaded from content-addressed bundle ${gameData.data?.bundleId || ''}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-success-surface-7 inline-block"/>
                <span>Live: {allIngredients.length} Ing. ({gameData.data?.profile?.toUpperCase() || profile.toUpperCase()})</span>
              </span>
            ) : gameData.status === 'loading' ? (
              <span className="text-xs px-2 py-0.5 rounded border border-line-6 bg-surface-5 text-accent font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse"/>
                <span>Loading bundle...</span>
              </span>
            ) : null}

            <button
              type="button"
              className="mw-btn px-2.5 py-1 text-xs font-serif font-bold"
              onClick={handleIngestCharacterStats}
              title="Reset alchemy skills to active character's base values"
            >
              Reset to character sheet
            </button>
          </div>
        </div>

        {/* Editable Custom Stats Controls */}
        {showCustomInputs && (
          <div className="pt-2 border-t border-line-11 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="font-serif font-bold text-fg-7 uppercase text-[11px]">
              Custom numbers:
            </span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="alc-skill-input" className="text-fg-9 font-serif font-bold whitespace-nowrap shrink-0">
                Alchemy:
              </label>
              <input
                id="alc-skill-input"
                type="number"
                min="0"
                max="1000"
                className="w-16 bg-surface-1 border border-line-9 px-2 py-0.5 text-xs font-mono text-accent font-bold"
                value={skill}
                onChange={(e) => setSkill(typeStat("alchemy", "skill", statNumber(e.target.value)))}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="alc-int-input" className="text-fg-9 font-serif font-bold whitespace-nowrap shrink-0">
                INT:
              </label>
              <input
                id="alc-int-input"
                type="number"
                min="0"
                max="1000"
                className="w-16 bg-surface-1 border border-line-9 px-2 py-0.5 text-xs font-mono text-accent font-bold"
                value={intelligence}
                onChange={(e) => setIntelligence(typeStat("alchemy", "intelligence", statNumber(e.target.value)))}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="alc-luck-input" className="text-fg-9 font-serif font-bold whitespace-nowrap shrink-0">
                LUK:
              </label>
              <input
                id="alc-luck-input"
                type="number"
                min="0"
                max="1000"
                className="w-16 bg-surface-1 border border-line-9 px-2 py-0.5 text-xs font-mono text-accent font-bold"
                value={luck}
                onChange={(e) => setLuck(typeStat("alchemy", "luck", statNumber(e.target.value)))}
              />
            </div>

            {(skill !== baseSkill || intelligence !== baseInt || luck !== baseLuck) && (
              <span className="text-[11px] text-accent italic">
                (Custom numbers applied)
              </span>
            )}
          </div>
        )}
      </div>

      <ReverseAlchemy ingredients={allIngredients} sources={sources} onWantSources={() => setWantSources(true)} onUsePair={([first, second]) => {
        setSlot1(first); setSlot2(second); setSlot3(null); setSlot4(null); setCustomPotionName("");
        document.getElementById("alchemy-potion-output")?.focus();
      }} />

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Apparatus Rack & Ingredient Crucible */}
        <div className="space-y-4">
          <h3 className="mw-caption text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Apparatus Rack &amp; Ingredients
          </h3>

          {/* Apparatus Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label htmlFor="alc-mortar-select" className="text-[11px] uppercase font-serif font-bold text-fg-7 block mb-1">
                Mortar &amp; Pestle
              </label>
              <select
                id="alc-mortar-select"
                className="w-full mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={mortar.id}
                onChange={(e) => setMortarId(e.target.value)}
              >
                {apparatusTiers.mortar.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.replace(" Mortar and Pestle", "")} ({Number(a.quality.toFixed(3))}x)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alc-alembic-select" className="text-[11px] uppercase font-serif font-bold text-fg-7 block mb-1">
                Alembic
              </label>
              <select
                id="alc-alembic-select"
                className="w-full mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={alembic.id}
                onChange={(e) => setAlembicId(e.target.value)}
              >
                {apparatusTiers.alembic.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.replace(" Alembic", "")} {a.quality > 0 ? `(${Number(a.quality.toFixed(3))}x)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alc-calcinator-select" className="text-[11px] uppercase font-serif font-bold text-fg-7 block mb-1">
                Calcinator
              </label>
              <select
                id="alc-calcinator-select"
                className="w-full mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={calcinator.id}
                onChange={(e) => setCalcinatorId(e.target.value)}
              >
                {apparatusTiers.calcinator.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.replace(" Calcinator", "")} {a.quality > 0 ? `(${Number(a.quality.toFixed(3))}x)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alc-retort-select" className="text-[11px] uppercase font-serif font-bold text-fg-7 block mb-1">
                Retort
              </label>
              <select
                id="alc-retort-select"
                className="w-full mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={retort.id}
                onChange={(e) => setRetortId(e.target.value)}
              >
                {apparatusTiers.retort.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.replace(" Retort", "")} {a.quality > 0 ? `(${Number(a.quality.toFixed(3))}x)` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Option */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="alc-filter-match-first"
              type="checkbox"
              checked={matchFirst}
              onChange={(e) => setMatchFirst(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <label htmlFor="alc-filter-match-first" className="text-xs font-serif text-fg-7 cursor-pointer select-none">
              Only show ingredients that share effects with Slot 1
            </label>
          </div>

          {/* 4 Crucible Slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line-9 pb-1.5">
              <h4 className="text-xs uppercase font-serif font-bold text-accent tracking-wider">
                Crucible Ingredients
              </h4>
              {(slot1 || slot2 || slot3 || slot4) && (
                <button
                  type="button"
                  className="mw-btn px-2.5 py-0.5 text-xs font-serif font-bold"
                  onClick={handleClearAllIngredients}
                  title="Remove all ingredients from the crucible slots"
                >
                  Clear All Ingredients
                </button>
              )}
            </div>

            {slotsData.map(({ slotIndex, current, setSlot }) => {
              const pool = getPoolForSlot(slotIndex);

              return (
                <div key={slotIndex} className="p-3 bg-surface-5 border border-line-11 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase font-serif font-bold text-accent">
                      Slot {slotIndex + 1}
                    </span>

                    {current && (
                      <button
                        type="button"
                        className="mw-btn px-2 py-0.5 text-[11px] font-serif"
                        onClick={() => setSlot(null)}
                        title={`Clear Slot ${slotIndex + 1}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <IngredientCombobox slot={slotIndex} value={current} options={pool} onSelect={setSlot} />

                  {current && <IngredientSources key={current.id} ingredient={current} sources={sources}
                    onWantSources={() => setWantSources(true)} />}

                  {current && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {(current.effects || []).filter(Boolean).map((eff, eIdx) => {
                        const label = formatEffectLabel(eff);
                        return (
                          <span
                            key={eIdx}
                            className={`text-[10px] px-1.5 py-0.5 border font-mono ${
                              eff.bad
                                ? "bg-danger-surface-2 border-danger-line-3 text-danger-3"
                                : "bg-surface-14 border-line-9 text-accent"
                            }`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Brew Dossier & Potion Preview */}
        <div className="space-y-4">
          <h3 id="alchemy-potion-output" tabIndex={-1} className="mw-caption text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Potion Preview &amp; Output
          </h3>

          <div className="p-3.5 bg-surface-5 border border-line-9 space-y-3">
            <div>
              <label htmlFor="potion-name-input" className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1">
                Potion Name
              </label>
              <input
                id="potion-name-input"
                type="text"
                className="w-full bg-surface-1 border border-line-9 p-2 text-xs font-serif text-fg-2"
                value={customPotionName || potion.name}
                onChange={(e) => setCustomPotionName(e.target.value)}
                placeholder="Potion Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Brew Success Chance</span>
                <span className={`text-xl font-bold font-mono ${potion.isCalculated ? "text-accent" : "text-fg-11"}`}>{potion.isCalculated ? `${potion.brewChance}%` : NO_RESULT}</span>
              </div>

              <div className="p-2.5 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Estimated Gold Value</span>
                <span className={`text-xl font-bold font-mono ${potion.isValid ? "text-accent" : "text-fg-11"}`}>{potion.isValid ? `${potion.goldValue} g` : NO_RESULT}</span>
              </div>
            </div>

            {/* Combined Effects List */}
            <div className="space-y-2 pt-2 border-t border-line-11">
              <span className="text-xs uppercase font-serif font-bold text-accent block">
                Resulting Potion Effects ({potion.effects.length})
              </span>

              {potion.isValid ? (
                <div className="space-y-1.5">
                  {potion.effects.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-surface-3 border border-line-11 flex items-center justify-between text-xs"
                    >
                      <span className={`font-serif font-bold ${item.isBad ? "text-danger-3" : "text-fg-2"}`}>
                        {item.label}
                      </span>
                      <span className="font-mono text-accent">
                        {item.hasMagnitude ? `Magnitude ${item.magnitude}` : ""}{item.hasMagnitude && item.hasDuration ? ", " : ""}{item.hasDuration ? `${item.duration}s` : ""}{!item.hasMagnitude && !item.hasDuration ? "Instant effect" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-surface-3 border border-line-11 text-xs text-fg-9 font-serif italic">
                  {potion.message}
                </div>
              )}
            </div>

            <details className="calculation-notes">
              <summary>How this is calculated</summary>
              <div>
                <p>Your Alchemy skill, Intelligence and Luck determine the chance of brewing a potion. Fatigue does not change that chance in OpenMW.</p>
                <p>Brew chance: <span className="font-mono">Alchemy + 0.1×Intelligence + 0.1×Luck</span>, shown as a percentage rounded to the nearest whole number, between 0% and 100%.</p>
                <p>The Mortar &amp; Pestle and your Alchemy skill determine potion strength and duration. A Retort improves beneficial effects, an Alembic reduces harmful effects, and a Calcinator increases potency. Effects with no strength or duration, such as cures, do not gain those properties.</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
