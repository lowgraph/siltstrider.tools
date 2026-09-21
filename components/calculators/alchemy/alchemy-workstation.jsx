"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import { adaptAlchemy } from "../../../lib/alchemy-catalogs.mjs";
import {
  APPARATUS_TIERS,
  formatEffectLabel,
  calculatePotion
} from "../../../lib/alchemy-math.mjs";

const FALLBACK_INGREDIENTS = [
  { id: "ash_yam", n: "Ash Yam", effects: [{ n: "Fortify Intelligence", b: 1, arg: "Intelligence" }, { n: "Resist Common Disease", b: 2 }, { n: "Fortify Strength", b: 1, arg: "Strength" }, { n: "Drain Agility", b: 1, bad: true, arg: "Agility" }] },
  { id: "bloat", n: "Bloat", effects: [{ n: "Drain Magicka", b: 2, bad: true }, { n: "Fortify Intelligence", b: 1, arg: "Intelligence" }, { n: "Fortify Willpower", b: 1, arg: "Willpower" }, { n: "Detect Animal", b: 1 }] },
  { id: "chokeweed", n: "Chokeweed", effects: [{ n: "Drain Luck", b: 1, bad: true, arg: "Luck" }, { n: "Restore Fatigue", b: 1 }, { n: "Cure Common Disease", b: 2 }, { n: "Drain Willpower", b: 1, bad: true, arg: "Willpower" }] },
  { id: "coda_flower", n: "Coda Flower", effects: [{ n: "Drain Personality", b: 1, bad: true, arg: "Personality" }, { n: "Levitate", b: 3 }, { n: "Drain Health", b: 5, bad: true }, { n: "Drain Magicka", b: 2, bad: true }] },
  { id: "comberry", n: "Comberry", effects: [{ n: "Drain Fatigue", b: 1, bad: true }, { n: "Restore Magicka", b: 8 }, { n: "Fire Shield", b: 3 }, { n: "Reflect", b: 10 }] },
  { id: "corkbulb_root", n: "Corkbulb Root", effects: [{ n: "Cure Paralyzation", b: 2 }, { n: "Restore Health", b: 5 }, { n: "Lightning Shield", b: 3 }, { n: "Blind", b: 1, bad: true }] },
  { id: "crab_meat", n: "Crab Meat", effects: [{ n: "Restore Fatigue", b: 1 }, { n: "Resist Shock", b: 2 }, { n: "Lightning Shield", b: 3 }, { n: "Restore Luck", b: 1, arg: "Luck" }] },
  { id: "daedra_skin", n: "Daedra Skin", effects: [{ n: "Fortify Strength", b: 1, arg: "Strength" }, { n: "Cure Common Disease", b: 2 }, { n: "Paralyze", b: 40, bad: true }, { n: "Swift Swim", b: 2 }] },
  { id: "diamond", n: "Diamond", effects: [{ n: "Drain Agility", b: 1, bad: true, arg: "Agility" }, { n: "Invisibility", b: 20 }, { n: "Reflect", b: 10 }, { n: "Detect Key", b: 1 }] },
  { id: "ectoplasm", n: "Ectoplasm", effects: [{ n: "Fortify Agility", b: 1, arg: "Agility" }, { n: "Detect Animal", b: 1 }, { n: "Drain Strength", b: 1, bad: true, arg: "Strength" }, { n: "Drain Health", b: 5, bad: true }] },
  { id: "fire_petal", n: "Fire Petal", effects: [{ n: "Resist Fire", b: 2 }, { n: "Drain Health", b: 5, bad: true }, { n: "Drain Fatigue", b: 1, bad: true }, { n: "Fire Shield", b: 3 }] },
  { id: "frost_salts", n: "Frost Salts", effects: [{ n: "Drain Health", b: 5, bad: true }, { n: "Frost Shield", b: 3 }, { n: "Restore Magicka", b: 8 }, { n: "Fire Shield", b: 3 }] },
  { id: "hackle_lo_leaf", n: "Hackle-Lo Leaf", effects: [{ n: "Restore Fatigue", b: 1 }, { n: "Paralyze", b: 40, bad: true }, { n: "Water Breathing", b: 3 }, { n: "Restore Luck", b: 1, arg: "Luck" }] },
  { id: "heather", n: "Heather", effects: [{ n: "Restore Personality", b: 1, arg: "Personality" }, { n: "Feather", b: 1 }, { n: "Drain Speed", b: 1, bad: true, arg: "Speed" }, { n: "Drain Personality", b: 1, bad: true, arg: "Personality" }] },
  { id: "hound_meat", n: "Hound Meat", effects: [{ n: "Restore Fatigue", b: 1 }, { n: "Fortify Fatigue", b: 1 }, { n: "Shadow Form", b: 20 }, { n: "Detect Enchantment", b: 1 }] },
  { id: "marshmerrow", n: "Marshmerrow", effects: [{ n: "Restore Health", b: 5 }, { n: "Detect Enchantment", b: 1 }, { n: "Drain Willpower", b: 1, bad: true, arg: "Willpower" }, { n: "Drain Fatigue", b: 1, bad: true }] },
  { id: "moon_sugar", n: "Moon Sugar", effects: [{ n: "Fortify Speed", b: 1, arg: "Speed" }, { n: "Dispel", b: 5 }, { n: "Drain Endurance", b: 1, bad: true, arg: "Endurance" }, { n: "Drain Luck", b: 1, bad: true, arg: "Luck" }] },
  { id: "saltrice", n: "Saltrice", effects: [{ n: "Restore Fatigue", b: 1 }, { n: "Fortify Magicka", b: 1 }, { n: "Drain Strength", b: 1, bad: true, arg: "Strength" }, { n: "Restore Health", b: 5 }] },
  { id: "scrib_jerky", n: "Scrib Jerky", effects: [{ n: "Restore Fatigue", b: 1 }, { n: "Fortify Fatigue", b: 1 }, { n: "Drain Willpower", b: 1, bad: true, arg: "Willpower" }, { n: "Cure Poison", b: 2 }] },
  { id: "wickwheat", n: "Wickwheat", effects: [{ n: "Restore Health", b: 5 }, { n: "Fortify Willpower", b: 1, arg: "Willpower" }, { n: "Paralyze", b: 40, bad: true }, { n: "Damage Intelligence", b: 4, bad: true, arg: "Intelligence" }] }
];

export default function AlchemyWorkstation() {
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const { world } = useShell();

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

  const bundleAlchemy = useMemo(() => {
    if (gameData.status === 'ready' && gameData.data) {
      try {
        const legacyEffects = typeof window !== "undefined" && Array.isArray(window.__MW_EFFECTS) ? window.__MW_EFFECTS : [];
        return adaptAlchemy(gameData.data, legacyEffects);
      } catch (err) {
        console.warn("Bundle alchemy adaptation fallback:", err);
        return null;
      }
    }
    return null;
  }, [gameData.status, gameData.data]);

  const allIngredients = useMemo(() => {
    if (bundleAlchemy?.ingredients?.length > 0) {
      return bundleAlchemy.ingredients;
    }
    if (typeof window !== "undefined" && Array.isArray(window.INGREDIENTS) && window.INGREDIENTS.length > 0) {
      return window.INGREDIENTS;
    }
    return FALLBACK_INGREDIENTS;
  }, [bundleAlchemy]);

  const handleIngestCharacterStats = useCallback(() => {
    setSkill(baseSkill);
    setIntelligence(baseInt);
    setLuck(baseLuck);
    if (syncToCalculators) syncToCalculators();
  }, [baseSkill, baseInt, baseLuck, syncToCalculators]);

  // Apparatus choices: bundle if available, else APPARATUS_TIERS
  const apparatusTiers = useMemo(() => {
    if (bundleAlchemy?.apparatus) {
      return {
        mortar: bundleAlchemy.apparatus.mortar?.length > 0
          ? bundleAlchemy.apparatus.mortar.map(a => ({ id: a.id, name: a.n, quality: a.q }))
          : APPARATUS_TIERS.mortar,
        alembic: bundleAlchemy.apparatus.alembic?.length > 0
          ? [{ id: "none", name: "None", quality: 0 }].concat(bundleAlchemy.apparatus.alembic.map(a => ({ id: a.id, name: a.n, quality: a.q })))
          : APPARATUS_TIERS.alembic,
        calcinator: bundleAlchemy.apparatus.calcinator?.length > 0
          ? [{ id: "none", name: "None", quality: 0 }].concat(bundleAlchemy.apparatus.calcinator.map(a => ({ id: a.id, name: a.n, quality: a.q })))
          : APPARATUS_TIERS.calcinator,
        retort: bundleAlchemy.apparatus.retort?.length > 0
          ? [{ id: "none", name: "None", quality: 0 }].concat(bundleAlchemy.apparatus.retort.map(a => ({ id: a.id, name: a.n, quality: a.q })))
          : APPARATUS_TIERS.retort
      };
    }
    return APPARATUS_TIERS;
  }, [bundleAlchemy]);

  // Selected apparatus qualities
  const mortar = useMemo(() => apparatusTiers.mortar.find((a) => a.id === mortarId) || apparatusTiers.mortar[1] || apparatusTiers.mortar[0], [apparatusTiers, mortarId]);
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
      alchemySkill: skill,
      intelligence,
      luck,
      mortarQuality: mortar.quality,
      alembicQuality: alembic.quality,
      calcinatorQuality: calcinator.quality,
      retortQuality: retort.quality
    });
  }, [selectedIngredients, skill, intelligence, luck, mortar, alembic, calcinator, retort]);

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
        const slot1Effects = new Set((slot1.effects || []).map((e) => e.n));
        const hasCommon = (ing.effects || []).some((e) => slot1Effects.has(e.n));
        if (!hasCommon) return false;
      }

      return true;
    });
  };

  // Sync with legacy DOM elements
  useEffect(() => {
    if (typeof document === "undefined") return;
    const domSkill = document.getElementById("alc-skill");
    const domInt = document.getElementById("alc-int");
    const domLuck = document.getElementById("alc-luck");
    const domMortar = document.getElementById("alc-mortar");
    const domAlembic = document.getElementById("alc-alembic");
    const domCalcinator = document.getElementById("alc-calcinator");
    const domRetort = document.getElementById("alc-retort");
    const domName = document.getElementById("alc-name");

    if (domSkill && domSkill.value !== String(skill)) domSkill.value = String(skill);
    if (domInt && domInt.value !== String(intelligence)) domInt.value = String(intelligence);
    if (domLuck && domLuck.value !== String(luck)) domLuck.value = String(luck);
    if (domMortar && domMortar.value !== String(mortar.quality)) domMortar.value = String(mortar.quality);
    if (domAlembic && domAlembic.value !== String(alembic.quality)) domAlembic.value = String(alembic.quality);
    if (domCalcinator && domCalcinator.value !== String(calcinator.quality)) domCalcinator.value = String(calcinator.quality);
    if (domRetort && domRetort.value !== String(retort.quality)) domRetort.value = String(retort.quality);
    if (domName && domName.value !== (customPotionName || potion.name)) {
      domName.value = customPotionName || potion.name;
    }
  }, [skill, intelligence, luck, mortar, alembic, calcinator, retort, customPotionName, potion.name]);

  const slotsData = [
    { slotIndex: 0, current: slot1, setSlot: setSlot1, search: search1, setSearch: setSearch1 },
    { slotIndex: 1, current: slot2, setSlot: setSlot2, search: search2, setSearch: setSearch2 },
    { slotIndex: 2, current: slot3, setSlot: setSlot3, search: search3, setSearch: setSearch3 },
    { slotIndex: 3, current: slot4, setSlot: setSlot4, search: search4, setSearch: setSearch4 }
  ];

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
            <span className="text-xs px-2 py-0.5 rounded border border-success-line-5 bg-success-surface-1 text-success-3 font-mono flex items-center gap-1.5 shadow-inner" title={`Loaded from content-addressed bundle ${gameData.bundleId || ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-success-surface-7 inline-block"/>
              <span>Live: {allIngredients.length} Ing. ({gameData.data?.profile?.toUpperCase() || activeWorld.toUpperCase()})</span>
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
                value={mortarId}
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
                value={alembicId}
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
                value={calcinatorId}
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
                value={retortId}
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
                    <select
                      className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
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
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {current && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {(current.effects || []).map((eff, eIdx) => {
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
                        Magnitude {item.magnitude}, {item.duration}s
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
