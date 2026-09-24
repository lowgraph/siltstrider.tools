"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import {
  MAGIC_SCHOOLS,
  calcSingleSpellEffectCost,
  calcTotalSpellMagickaCost,
  calcSpellCastChance,
  calcSpellmakerBaseGold,
  calcSpellmakerBarterPrice,
  getActiveSpellmakers
} from "../../../lib/spell-math.mjs";

export default function SpellmakingWorkstation() {
  const { build, sheet: buildSheet, activeSave, syncToCalculators } = useActiveCharacter();
  const sheet = activeSave?.sheet || buildSheet;
  const { world } = useShell();

  // Character Magic Skills & Stats
  const baseAlt = sheet?.skills?.["Alteration"]?.v ?? 50;
  const baseCon = sheet?.skills?.["Conjuration"]?.v ?? 50;
  const baseDes = sheet?.skills?.["Destruction"]?.v ?? 50;
  const baseIll = sheet?.skills?.["Illusion"]?.v ?? 50;
  const baseMys = sheet?.skills?.["Mysticism"]?.v ?? 50;
  const baseRes = sheet?.skills?.["Restoration"]?.v ?? 50;
  const baseWil = sheet?.attrs?.["Willpower"]?.v ?? 40;
  const baseLuck = sheet?.attrs?.["Luck"]?.v ?? 40;
  const baseMerc = sheet?.skills?.["Mercantile"]?.v ?? 40;
  const basePers = sheet?.attrs?.["Personality"]?.v ?? 40;

  const [alt, setAlt] = useState(baseAlt);
  const [con, setCon] = useState(baseCon);
  const [des, setDes] = useState(baseDes);
  const [ill, setIll] = useState(baseIll);
  const [mys, setMys] = useState(baseMys);
  const [res, setRes] = useState(baseRes);
  const [willpower, setWillpower] = useState(baseWil);
  const [luck, setLuck] = useState(baseLuck);
  const [mercantile, setMercantile] = useState(baseMerc);
  const [personality, setPersonality] = useState(basePers);
  const [disposition, setDisposition] = useState(50);

  const [activeSchoolTab, setActiveSchoolTab] = useState("All");
  const [spellName, setSpellName] = useState("Custom Spell");

  useEffect(() => {
    setAlt(baseAlt);
    setCon(baseCon);
    setDes(baseDes);
    setIll(baseIll);
    setMys(baseMys);
    setRes(baseRes);
    setWillpower(baseWil);
    setLuck(baseLuck);
    setMercantile(baseMerc);
    setPersonality(basePers);
  }, [baseAlt, baseCon, baseDes, baseIll, baseMys, baseRes, baseWil, baseLuck, baseMerc, basePers]);

  // Effect Stack
  const [effectsList, setEffectsList] = useState([
    {
      effectIndex: 0,
      min: 10,
      max: 20,
      dur: 5,
      area: 0,
      range: "target"
    }
  ]);

  const [selectedVendorId, setSelectedVendorId] = useState("estirdalin");
  const [vendorSearch, setVendorSearch] = useState("");

  const gameData = useGameData('spellmaking', { enabled: true });

  const availableEffects = useMemo(() => {
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.EffectRules)) {
      const live = gameData.data.catalogs.EffectRules
        .filter((r) => r.allowSpellmaking)
        .map((r) => ({
          n: r.name,
          b: r.baseCost,
          mag: r.noMagnitude ? 0 : 1,
          dur: r.noDuration ? 0 : 1,
          school: r.school ? (r.school.charAt(0).toUpperCase() + r.school.slice(1)) : "Destruction"
        }))
        .sort((a, b) => a.n.localeCompare(b.n));
      if (live.length > 0) return live;
    }
    if (typeof window !== "undefined" && Array.isArray(window.__MW_EFFECTS) && window.__MW_EFFECTS.length > 0) {
      return window.__MW_EFFECTS;
    }
    return [
      { n: "Fire Damage", b: 5, mag: 1, dur: 1, school: "Destruction" },
      { n: "Frost Damage", b: 5, mag: 1, dur: 1, school: "Destruction" },
      { n: "Shock Damage", b: 7, mag: 1, dur: 1, school: "Destruction" },
      { n: "Weakness to Fire", b: 2, mag: 1, dur: 1, school: "Destruction" },
      { n: "Restore Health", b: 5, mag: 1, dur: 1, school: "Restoration" },
      { n: "Restore Fatigue", b: 1, mag: 1, dur: 1, school: "Restoration" },
      { n: "Fortify Strength", b: 1, mag: 1, dur: 1, school: "Restoration" },
      { n: "Fortify Intelligence", b: 1, mag: 1, dur: 1, school: "Restoration" },
      { n: "Fortify Agility", b: 1, mag: 1, dur: 1, school: "Restoration" },
      { n: "Levitate", b: 3, mag: 1, dur: 1, school: "Alteration" },
      { n: "Shield", b: 2, mag: 1, dur: 1, school: "Alteration" },
      { n: "Open", b: 6, mag: 1, dur: 0, school: "Alteration" },
      { n: "Water Walking", b: 3, mag: 0, dur: 1, school: "Alteration" },
      { n: "Summon Ancestral Ghost", b: 7, mag: 0, dur: 1, school: "Conjuration" },
      { n: "Summon Flame Atronach", b: 18, mag: 0, dur: 1, school: "Conjuration" },
      { n: "Bound Longsword", b: 2, mag: 0, dur: 1, school: "Conjuration" },
      { n: "Chameleon", b: 1, mag: 1, dur: 1, school: "Illusion" },
      { n: "Paralyze", b: 40, mag: 0, dur: 1, school: "Illusion" },
      { n: "Invisibility", b: 20, mag: 0, dur: 1, school: "Illusion" },
      { n: "Telekinesis", b: 1, mag: 1, dur: 1, school: "Mysticism" },
      { n: "Absorb Health", b: 8, mag: 1, dur: 1, school: "Mysticism" },
      { n: "Dispel", b: 5, mag: 1, dur: 0, school: "Mysticism" }
    ];
  }, [gameData.status, gameData.data]);

  const filteredEffectsBySchool = useMemo(() => {
    if (activeSchoolTab === "All") return availableEffects;
    return availableEffects.filter((e) => e.school === activeSchoolTab);
  }, [availableEffects, activeSchoolTab]);

  const handleIngestCharacterStats = useCallback(() => {
    setAlt(baseAlt);
    setCon(baseCon);
    setDes(baseDes);
    setIll(baseIll);
    setMys(baseMys);
    setRes(baseRes);
    setWillpower(baseWil);
    setLuck(baseLuck);
    setMercantile(baseMerc);
    setPersonality(basePers);
    if (syncToCalculators) syncToCalculators();
  }, [baseAlt, baseCon, baseDes, baseIll, baseMys, baseRes, baseWil, baseLuck, baseMerc, basePers, syncToCalculators]);

  const handleAddEffect = () => {
    setEffectsList((prev) => [
      ...prev,
      {
        effectIndex: 0,
        min: 10,
        max: 20,
        dur: 5,
        area: 0,
        range: "target"
      }
    ]);
  };

  const handleRemoveEffect = (index) => {
    setEffectsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEffectChange = (index, field, value) => {
    setEffectsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculatedEffects = useMemo(() => {
    return effectsList.map((row) => {
      const effectObj = availableEffects[row.effectIndex] || availableEffects[0];
      return {
        ...row,
        effect: effectObj
      };
    });
  }, [effectsList, availableEffects]);

  const magickaCost = useMemo(() => {
    return calcTotalSpellMagickaCost(calculatedEffects);
  }, [calculatedEffects]);

  // Primary school determined by highest cost effect in stack
  const primarySchool = useMemo(() => {
    if (!calculatedEffects.length) return "Destruction";
    let maxCost = -1;
    let topSchool = "Destruction";
    for (const e of calculatedEffects) {
      const c = calcSingleSpellEffectCost(e.effect, e.min, e.max, e.dur, e.area, e.range);
      if (c > maxCost) {
        maxCost = c;
        topSchool = e.effect?.school || "Destruction";
      }
    }
    return topSchool;
  }, [calculatedEffects]);

  const governingSkillValue = useMemo(() => {
    switch (primarySchool) {
      case "Alteration": return alt;
      case "Conjuration": return con;
      case "Destruction": return des;
      case "Illusion": return ill;
      case "Mysticism": return mys;
      case "Restoration": return res;
      default: return des;
    }
  }, [primarySchool, alt, con, des, ill, mys, res]);

  const castChance = useMemo(() => {
    return calcSpellCastChance(magickaCost, governingSkillValue, willpower, luck, 1.0);
  }, [magickaCost, governingSkillValue, willpower, luck]);

  const baseGoldCost = useMemo(() => {
    return calcSpellmakerBaseGold(magickaCost);
  }, [magickaCost]);

  const spellmakersList = useMemo(() => {
    let list = null;
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.Merchants)) {
      const liveSpellmakers = gameData.data.catalogs.Merchants
        .filter((m) => (m.servicesRaw & 32768) !== 0)
        .map((m) => ({
          id: m.key,
          n: `${m.name} (${m.cells?.[0] ? m.cells[0].replace(/^(interior|exterior):/,'') : m.class || 'Spellmaker'})`,
          merc: m.mercantile,
          pers: m.personality,
          luck: m.luck,
          gold: m.gold
        }));
      if (liveSpellmakers.length > 0) list = liveSpellmakers;
    }
    if (!list) {
      list = getActiveSpellmakers(world);
    }
    const pc = { merc: mercantile, pers: personality, luck, disp: disposition };
    return list
      .map((npc) => ({
        ...npc,
        barterPrice: calcSpellmakerBarterPrice(baseGoldCost, npc, pc)
      }))
      .sort((a, b) => a.barterPrice - b.barterPrice);
  }, [gameData.status, gameData.data, world, mercantile, personality, luck, disposition, baseGoldCost]);

  const filteredSpellmakers = useMemo(() => {
    if (!vendorSearch.trim()) return spellmakersList;
    const q = vendorSearch.toLowerCase();
    return spellmakersList.filter((s) => s.n.toLowerCase().includes(q));
  }, [spellmakersList, vendorSearch]);

  // Sync with legacy DOM elements
  useEffect(() => {
    if (typeof document === "undefined") return;
    const ids = {
      "spl-alt": alt,
      "spl-con": con,
      "spl-des": des,
      "spl-ill": ill,
      "spl-mys": mys,
      "spl-res": res,
      "spl-wil": willpower,
      "spl-luck": luck,
      "spl-merc": mercantile,
      "spl-pers": personality,
      "spl-disp": disposition
    };
    for (const [id, val] of Object.entries(ids)) {
      const el = document.getElementById(id);
      if (el && el.value !== String(val)) el.value = String(val);
    }
  }, [alt, con, des, ill, mys, res, willpower, luck, mercantile, personality, disposition]);

  return (
    <div className="spellmaking-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-6">
      {/* Top Banner: Character Skills & Stats & Live Game-Data Status */}
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
            WIL: <strong className="text-accent">{willpower}</strong> | LUK: <strong className="text-accent">{luck}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {gameData.status === 'ready' ? (
            <span className="text-xs px-2 py-0.5 rounded border border-success-line-5 bg-success-surface-1 text-success-3 font-mono flex items-center gap-1.5 shadow-inner" title={`Loaded from content-addressed bundle ${gameData.bundleId || ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-success-surface-7 inline-block"/>
              <span>Live: {availableEffects.length} Spells · {spellmakersList.length} Vendors ({gameData.data?.profile?.toUpperCase() || activeWorld.toUpperCase()})</span>
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
            title="Reset magic skills to active character sheet"
          >
            Ingest Character Stats
          </button>
        </div>
      </div>

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Grimoire Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Spellcraft Configuration
          </h3>

          <div>
            <label htmlFor="spell-name-input" className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1">
              Spell Name
            </label>
            <input
              id="spell-name-input"
              type="text"
              className="w-full bg-surface-1 border border-line-9 p-2 text-xs font-serif text-fg-2"
              value={spellName}
              onChange={(e) => setSpellName(e.target.value)}
              placeholder="Spell Name"
            />
          </div>

          {/* Magic School Filter Pills */}
          <div>
            <label className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1.5">
              Filter by Magic School
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MAGIC_SCHOOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`px-2.5 py-1 text-xs font-serif font-bold border transition-colors ${
                    activeSchoolTab === s
                      ? "bg-surface-18 border-accent text-accent"
                      : "bg-surface-3 border-line-9 text-fg-13 hover:text-accent"
                  }`}
                  onClick={() => setActiveSchoolTab(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Effects Stack */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-serif font-bold text-accent">
                Spell Effects Stack ({effectsList.length})
              </label>
              <button
                type="button"
                className="mw-btn px-2.5 py-1 text-xs font-serif font-bold"
                onClick={handleAddEffect}
              >
                Add Effect
              </button>
            </div>

            <div className="space-y-2.5">
              {effectsList.map((row, idx) => {
                const eff = availableEffects[row.effectIndex] || availableEffects[0];
                const showRange = true;
                const showDuration = eff?.dur;
                const showArea = row.range !== "self";

                return (
                  <div key={idx} className="p-3 bg-surface-5 border border-line-11 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                        value={row.effectIndex}
                        onChange={(e) => handleEffectChange(idx, "effectIndex", Number(e.target.value))}
                      >
                        {filteredEffectsBySchool.map((item) => {
                          const originalIdx = availableEffects.indexOf(item);
                          return (
                            <option key={originalIdx} value={originalIdx}>
                              {item.n} ({item.school}, base {item.b})
                            </option>
                          );
                        })}
                      </select>

                      {effectsList.length > 1 && (
                        <button
                          type="button"
                          className="mw-btn px-2 py-1 text-xs font-serif text-danger-9 hover:text-danger-4"
                          onClick={() => handleRemoveEffect(idx)}
                          title="Remove effect from spell"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {showRange && (
                        <div>
                          <label className="text-[10px] text-fg-13 block mb-0.5">Range</label>
                          <select
                            className="w-full mw-select p-1 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                            value={row.range}
                            onChange={(e) => handleEffectChange(idx, "range", e.target.value)}
                          >
                            <option value="self">Self</option>
                            <option value="touch">Touch</option>
                            <option value="target">Target</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] text-fg-13 block mb-0.5">Min Mag</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                          value={row.min}
                          onChange={(e) => handleEffectChange(idx, "min", Math.max(1, Number(e.target.value) || 1))}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-fg-13 block mb-0.5">Max Mag</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                          value={row.max}
                          onChange={(e) => handleEffectChange(idx, "max", Math.max(1, Number(e.target.value) || 1))}
                        />
                      </div>

                      {showDuration && (
                        <div>
                          <label className="text-[10px] text-fg-13 block mb-0.5">Duration</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                            value={row.dur}
                            onChange={(e) => handleEffectChange(idx, "dur", Math.max(1, Number(e.target.value) || 1))}
                          />
                        </div>
                      )}

                      {showArea && (
                        <div>
                          <label className="text-[10px] text-fg-13 block mb-0.5">Area</label>
                          <input
                            type="number"
                            min="0"
                            max="500"
                            className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                            value={row.area}
                            onChange={(e) => handleEffectChange(idx, "area", Math.max(0, Number(e.target.value) || 0))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Dossier & Barter */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Spellmaking Output &amp; Barter
          </h3>

          {/* Output Summary Card */}
          <div className="p-3.5 bg-surface-5 border border-line-9 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Magicka Cost</span>
                <span className="text-xl font-bold font-mono text-accent">{magickaCost} pts</span>
              </div>

              <div className="p-2.5 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Cast Reliability</span>
                <span className={`text-xl font-bold font-mono ${castChance >= 75 ? "text-accent" : castChance >= 40 ? "text-fg-4" : "text-danger-3"}`}>
                  {castChance}%
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-surface-3 border border-line-11 flex justify-between items-center text-xs">
              <span className="text-fg-13 font-serif">Governing School:</span>
              <span className="font-serif font-bold text-fg-2">
                {primarySchool} ({governingSkillValue} skill)
              </span>
            </div>

            <div className="text-xs space-y-1 pt-1 border-t border-line-11">
              <span className="text-[11px] text-fg-13 uppercase font-serif block">Spell Formula</span>
              {calculatedEffects.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-serif text-fg-4">
                  <span>{item.effect?.n || "Effect"}</span>
                  <span className="font-mono text-[11px] text-accent">
                    {item.range.toUpperCase()}: {item.min}-{item.max} pts, {item.dur}s
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Spellmakers Ranked Barter Table */}
          <div className="p-3.5 bg-surface-5 border border-line-9 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase font-serif font-bold text-accent">
                Ranked Spellmakers ({filteredSpellmakers.length})
              </label>
              <input
                type="text"
                className="bg-surface-1 border border-line-9 px-2 py-0.5 text-xs text-fg-2 placeholder-fg-15 font-serif w-36"
                placeholder="Search spellmakers..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto mw-scrollbar space-y-1.5 pr-1 border border-line-11 p-1 bg-surface-2">
              {filteredSpellmakers.slice(0, 15).map((sm) => (
                <div
                  key={sm.id}
                  className={`p-2 border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedVendorId === sm.id
                      ? "bg-surface-14 border-accent text-fg-2"
                      : "bg-surface-3 border-line-12 text-fg-7 hover:border-line-7"
                  }`}
                  onClick={() => setSelectedVendorId(sm.id)}
                >
                  <div className="truncate mr-2">
                    <span className="font-serif font-bold block truncate">{sm.n}</span>
                    <span className="text-[10px] text-fg-13 font-mono">Merc: {sm.merc} · Pers: {sm.pers}</span>
                  </div>
                  <span className="font-mono font-bold text-accent shrink-0">
                    {sm.barterPrice.toLocaleString()} g
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
