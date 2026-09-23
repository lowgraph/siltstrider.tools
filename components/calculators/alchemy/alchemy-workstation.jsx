"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import { useSearchIntent } from "../../use-search-intent";
import { clearSearchIntent } from "../../../lib/search-intent.mjs";
import { adaptAlchemy } from "../../../lib/alchemy-catalogs.mjs";
import {
  sharesAlchemyEffect,
  formatEffectLabel,
  calculatePotion
} from "../../../lib/alchemy-math.mjs";

export default function AlchemyWorkstation() {
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const { profile } = useShell();

  // Character stats
  const baseSkill = sheet?.skills?.["Alchemy"]?.v ?? 50;
  const baseInt = sheet?.attributes?.["Intelligence"]?.v ?? 40;
  const baseLuck = sheet?.attributes?.["Luck"]?.v ?? 40;

  const [skill, setSkill] = useState(baseSkill);
  const [intelligence, setIntelligence] = useState(baseInt);
  const [luck, setLuck] = useState(baseLuck);

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

  // Search queries per slot
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [search3, setSearch3] = useState("");
  const [search4, setSearch4] = useState("");

  const handleClearAllIngredients = () => {
    setSlot1(null);
    setSlot2(null);
    setSlot3(null);
    setSlot4(null);
    setSearch1("");
    setSearch2("");
    setSearch3("");
    setSearch4("");
    setCustomPotionName("");
  };

  const gameData = useGameData('alchemy', { enabled: true });

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
    const slots = [[slot1, setSlot1, setSearch1], [slot2, setSlot2, setSearch2], [slot3, setSlot3, setSearch3], [slot4, setSlot4, setSearch4]];
    if (!hit || slots.some(([current]) => current?.id === hit.id)) return;
    const [, setSlot, setSearch] = slots.find(([current]) => !current) || slots[3];
    setSlot(hit);
    setSearch("");
  }, [intent, bundleAlchemy, allIngredients, gameData.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIngestCharacterStats = useCallback(() => {
    setSkill(baseSkill);
    setIntelligence(baseInt);
    setLuck(baseLuck);
    if (syncToCalculators) syncToCalculators();
  }, [baseSkill, baseInt, baseLuck, syncToCalculators]);

  const apparatusTiers = useMemo(() => Object.fromEntries(
    ['mortar','alembic','calcinator','retort'].map(type=>[type,
      [...(type==='mortar'?[]:[{id:'none',name:'None',quality:0}]),
       ...(bundleAlchemy?.apparatus[type]||[]).map(a=>({id:a.id,name:a.n,quality:a.q}))]
    ])
  ),[bundleAlchemy]);

  // Selected apparatus qualities
  const mortar = useMemo(() => apparatusTiers.mortar.find((a) => a.id === mortarId) || apparatusTiers.mortar[1] || apparatusTiers.mortar[0] || {id:"",quality:0}, [apparatusTiers, mortarId]);
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

  // Filter pool for a given slot
  const getPoolForSlot = (slotIndex, query) => {
    const q = query.trim().toLowerCase();
    const otherSelectedIds = new Set(
      selectedIngredients
        .filter((_, i) => i !== slotIndex)
        .filter(Boolean)
        .map((ing) => ing.id)
    );

    return allIngredients.filter((ing) => {
      if (otherSelectedIds.has(ing.id)) return false;
      if (q && !ing.n.toLowerCase().includes(q)) return false;

      // If matchFirst is on and slot > 0, check if ing shares any effect with slot1
      if (matchFirst && slotIndex > 0 && slot1) {
        const hasCommon = sharesAlchemyEffect(slot1, ing);
        if (!hasCommon) return false;
      }

      return true;
    });
  };

  const slotsData = [
    { slotIndex: 0, current: slot1, setSlot: setSlot1, search: search1, setSearch: setSearch1 },
    { slotIndex: 1, current: slot2, setSlot: setSlot2, search: search2, setSearch: setSearch2 },
    { slotIndex: 2, current: slot3, setSlot: setSlot3, search: search3, setSearch: setSearch3 },
    { slotIndex: 3, current: slot4, setSlot: setSlot4, search: search4, setSearch: setSearch4 }
  ];

  const dataError=gameData.error || adaptation.error;
  if(dataError)return <div role="alert">Alchemy data could not be loaded. {dataError.message} <button className="mw-btn" onClick={gameData.retry}>Retry alchemy data</button></div>;
  if(!bundleAlchemy)return <p role="status">Loading alchemy data...</p>;

  return (
    <div className="alchemy-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-6">
      {/* Top Banner: Character Stats Strip & Live Game-Data Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-5 border border-line-11">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-serif font-bold text-accent uppercase tracking-wider whitespace-nowrap">
            Active Character:
          </span>
          <span className="font-bold text-fg-2 whitespace-nowrap">
            {build.race || "Adventurer"} {build.className || "Custom"}
          </span>
          <span className="text-fg-13 hidden sm:inline">·</span>
          <span className="text-fg-9 whitespace-nowrap">
            Alchemy: <strong className="text-accent">{skill}</strong> | INT: <strong className="text-accent">{intelligence}</strong> | LUK: <strong className="text-accent">{luck}</strong>
          </span>
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
            Ingest Character Stats
          </button>
        </div>
      </div>

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Apparatus Rack & Ingredient Crucible */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
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
                    {a.name.replace(" Mortar and Pestle", "")} ({a.quality}x)
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
                    {a.name.replace(" Alembic", "")} {a.quality > 0 ? `(${a.quality}x)` : ""}
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
                    {a.name.replace(" Calcinator", "")} {a.quality > 0 ? `(${a.quality}x)` : ""}
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
                    {a.name.replace(" Retort", "")} {a.quality > 0 ? `(${a.quality}x)` : ""}
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

            {slotsData.map(({ slotIndex, current, setSlot, search, setSearch }) => {
              const pool = getPoolForSlot(slotIndex, search);

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
                        onClick={() => {
                          setSlot(null);
                          setSearch("");
                        }}
                        title={`Clear Slot ${slotIndex + 1}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Inline sizes: the legacy #panel-alchemy rule makes every input and select 100% wide. */}
                    <select
                      className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                      style={{ flex: "1 1 0", minWidth: 0 }}
                      value={current?.id || ""}
                      onChange={(e) => {
                        const hit = allIngredients.find((x) => x.id === e.target.value);
                        setSlot(hit || null);
                      }}
                    >
                      <option value="">(Select Ingredient)</option>
                      {pool.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.n}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="w-32 bg-surface-1 border border-line-9 px-2 py-1 text-xs text-fg-2 placeholder-fg-15 font-serif"
                      style={{ width: "8rem", flex: "none" }}
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

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
          <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
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
                <span className="text-xl font-bold font-mono text-accent">{potion.brewChance}%</span>
              </div>

              <div className="p-2.5 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Estimated Gold Value</span>
                <span className="text-xl font-bold font-mono text-accent">{potion.goldValue} g</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
