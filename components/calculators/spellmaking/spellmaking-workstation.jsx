"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
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
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const { world } = useShell();

  // Character Magic Skills & Stats
  const baseAlt = sheet?.skills?.["Alteration"]?.v ?? 50;
  const baseCon = sheet?.skills?.["Conjuration"]?.v ?? 50;
  const baseDes = sheet?.skills?.["Destruction"]?.v ?? 50;
  const baseIll = sheet?.skills?.["Illusion"]?.v ?? 50;
  const baseMys = sheet?.skills?.["Mysticism"]?.v ?? 50;
  const baseRes = sheet?.skills?.["Restoration"]?.v ?? 50;
  const baseWil = sheet?.attributes?.["Willpower"]?.v ?? 40;
  const baseLuck = sheet?.attributes?.["Luck"]?.v ?? 40;
  const baseMerc = sheet?.skills?.["Mercantile"]?.v ?? 40;
  const basePers = sheet?.attributes?.["Personality"]?.v ?? 40;

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

  const availableEffects = useMemo(() => {
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
  }, []);

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
    const list = getActiveSpellmakers(world);
    const pc = { merc: mercantile, pers: personality, luck, disp: disposition };
    return list
      .map((npc) => ({
        ...npc,
        barterPrice: calcSpellmakerBarterPrice(baseGoldCost, npc, pc)
      }))
      .sort((a, b) => a.barterPrice - b.barterPrice);
  }, [world, mercantile, personality, luck, disposition, baseGoldCost]);

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
    <div className="spellmaking-workstation p-4 sm:p-5 border border-[#3a2e1d] bg-[#14100a] text-[#f3e6c8] space-y-6">
      {/* Top Banner: Character Skills & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#19140c] border border-[#2a2215]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-serif font-bold text-[#d4b06a] uppercase tracking-wider whitespace-nowrap">
            Active Character:
          </span>
          <span className="font-bold text-[#f3e6c8] whitespace-nowrap">
            {build.race || "Adventurer"} {build.className || "Custom"}
          </span>
          <span className="text-[#8e7e65] hidden sm:inline">·</span>
          <span className="text-[#a8997c] whitespace-nowrap">
            WIL: <strong className="text-[#d4b06a]">{willpower}</strong> | LUK: <strong className="text-[#d4b06a]">{luck}</strong>
          </span>
        </div>

        <button
          type="button"
          className="mw-btn w-full sm:w-auto px-2.5 py-1 text-xs font-serif font-bold"
          onClick={handleIngestCharacterStats}
          title="Reset spellcasting skills to active character's base values"
        >
          Ingest Character Stats
        </button>
      </div>

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Grimoire Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-[#d4b06a] uppercase tracking-wider border-b border-[#3a2e1d] pb-1.5">
            Spellcraft Configuration
          </h3>

          <div>
            <label htmlFor="spell-name-input" className="text-xs uppercase font-serif font-bold text-[#c2b291] block mb-1">
              Spell Name
            </label>
            <input
              id="spell-name-input"
              type="text"
              className="w-full bg-[#0c0906] border border-[#3a2e1d] p-2 text-xs font-serif text-[#f3e6c8]"
              value={spellName}
              onChange={(e) => setSpellName(e.target.value)}
              placeholder="Spell Name"
            />
          </div>

          {/* Magic School Filter Pills */}
          <div>
            <label className="text-xs uppercase font-serif font-bold text-[#c2b291] block mb-1.5">
              Filter by Magic School
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MAGIC_SCHOOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`px-2.5 py-1 text-xs font-serif font-bold border transition-colors ${
                    activeSchoolTab === s
                      ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]"
                      : "bg-[#14100a] border-[#3a2e1d] text-[#8e7e65] hover:text-[#d4b06a]"
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
              <label className="text-xs uppercase font-serif font-bold text-[#d4b06a]">
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
                  <div key={idx} className="p-3 bg-[#19140c] border border-[#2a2114] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        className="flex-1 mw-select p-1.5 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
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
                          className="mw-btn px-2 py-1 text-xs font-serif text-[#a03017] hover:text-[#e29381]"
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
                          <label className="text-[10px] text-[#8e7e65] block mb-0.5">Range</label>
                          <select
                            className="w-full mw-select p-1 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
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
                        <label className="text-[10px] text-[#8e7e65] block mb-0.5">Min Mag</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-[#0c0906] border border-[#3a2e1d] p-1 text-xs font-mono text-[#f3e6c8]"
                          value={row.min}
                          onChange={(e) => handleEffectChange(idx, "min", Math.max(1, Number(e.target.value) || 1))}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8e7e65] block mb-0.5">Max Mag</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-[#0c0906] border border-[#3a2e1d] p-1 text-xs font-mono text-[#f3e6c8]"
                          value={row.max}
                          onChange={(e) => handleEffectChange(idx, "max", Math.max(1, Number(e.target.value) || 1))}
                        />
                      </div>

                      {showDuration && (
                        <div>
                          <label className="text-[10px] text-[#8e7e65] block mb-0.5">Duration</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            className="w-full bg-[#0c0906] border border-[#3a2e1d] p-1 text-xs font-mono text-[#f3e6c8]"
                            value={row.dur}
                            onChange={(e) => handleEffectChange(idx, "dur", Math.max(1, Number(e.target.value) || 1))}
                          />
                        </div>
                      )}

                      {showArea && (
                        <div>
                          <label className="text-[10px] text-[#8e7e65] block mb-0.5">Area</label>
                          <input
                            type="number"
                            min="0"
                            max="500"
                            className="w-full bg-[#0c0906] border border-[#3a2e1d] p-1 text-xs font-mono text-[#f3e6c8]"
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
          <h3 className="text-sm font-serif font-bold text-[#d4b06a] uppercase tracking-wider border-b border-[#3a2e1d] pb-1.5">
            Spellmaking Output &amp; Barter
          </h3>

          {/* Output Summary Card */}
          <div className="p-3.5 bg-[#17120b] border border-[#3a2e1d] space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#120e08] border border-[#2a2114]">
                <span className="text-[10px] uppercase text-[#8e7e65] block font-serif">Magicka Cost</span>
                <span className="text-xl font-bold font-mono text-[#d4b06a]">{magickaCost} pts</span>
              </div>

              <div className="p-2.5 bg-[#120e08] border border-[#2a2114]">
                <span className="text-[10px] uppercase text-[#8e7e65] block font-serif">Cast Reliability</span>
                <span className={`text-xl font-bold font-mono ${castChance >= 75 ? "text-[#d4b06a]" : castChance >= 40 ? "text-[#e0cfab]" : "text-[#f28e85]"}`}>
                  {castChance}%
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#120e08] border border-[#2a2114] flex justify-between items-center text-xs">
              <span className="text-[#8e7e65] font-serif">Governing School:</span>
              <span className="font-serif font-bold text-[#f3e6c8]">
                {primarySchool} ({governingSkillValue} skill)
              </span>
            </div>

            <div className="text-xs space-y-1 pt-1 border-t border-[#2a2215]">
              <span className="text-[11px] text-[#8e7e65] uppercase font-serif block">Spell Formula</span>
              {calculatedEffects.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-serif text-[#e0cfab]">
                  <span>{item.effect?.n || "Effect"}</span>
                  <span className="font-mono text-[11px] text-[#d4b06a]">
                    {item.range.toUpperCase()}: {item.min}-{item.max} pts, {item.dur}s
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Spellmakers Ranked Barter Table */}
          <div className="p-3.5 bg-[#17120b] border border-[#3a2e1d] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase font-serif font-bold text-[#d4b06a]">
                Ranked Spellmakers ({filteredSpellmakers.length})
              </label>
              <input
                type="text"
                className="bg-[#0c0906] border border-[#3a2e1d] px-2 py-0.5 text-xs text-[#f3e6c8] placeholder-[#7a6b52] font-serif w-36"
                placeholder="Search spellmakers..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto mw-scrollbar space-y-1.5 pr-1 border border-[#2a2114] p-1 bg-[#100d08]">
              {filteredSpellmakers.slice(0, 15).map((sm) => (
                <div
                  key={sm.id}
                  className={`p-2 border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedVendorId === sm.id
                      ? "bg-[#251e13] border-[#d4b06a] text-[#f3e6c8]"
                      : "bg-[#14100a] border-[#221a0f] text-[#c2b291] hover:border-[#4a3920]"
                  }`}
                  onClick={() => setSelectedVendorId(sm.id)}
                >
                  <div className="truncate mr-2">
                    <span className="font-serif font-bold block truncate">{sm.n}</span>
                    <span className="text-[10px] text-[#8e7e65] font-mono">Merc: {sm.merc} · Pers: {sm.pers}</span>
                  </div>
                  <span className="font-mono font-bold text-[#d4b06a] shrink-0">
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
