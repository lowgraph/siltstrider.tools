"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import {
  SOUL_GEMS,
  ENCHANT_BASE_ITEMS,
  calcEffectCost,
  calcEnchantmentTotalPoints,
  calcSelfEnchantChance,
  calcEnchantGoldCost,
  calcBarterBuyPrice,
  getActiveEnchanters
} from "../../../lib/enchant-math.mjs";

export default function EnchantingWorkstation() {
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const { world } = useShell();

  // Character stats
  const baseSkill = sheet?.skills?.["Enchant"]?.v ?? 50;
  const baseInt = sheet?.attributes?.["Intelligence"]?.v ?? 40;
  const baseLuck = sheet?.attributes?.["Luck"]?.v ?? 40;
  const baseMerc = sheet?.skills?.["Mercantile"]?.v ?? 40;
  const basePers = sheet?.attributes?.["Personality"]?.v ?? 40;

  const [skill, setSkill] = useState(baseSkill);
  const [intelligence, setIntelligence] = useState(baseInt);
  const [luck, setLuck] = useState(baseLuck);
  const [mercantile, setMercantile] = useState(baseMerc);
  const [personality, setPersonality] = useState(basePers);
  const [disposition, setDisposition] = useState(50);

  // Configuration
  const [selectedBaseItem, setSelectedBaseItem] = useState("Exquisite Ring");
  const [capacity, setCapacity] = useState(120);
  const [soul, setSoul] = useState(400);
  const [enchantType, setEnchantType] = useState("used"); // "used" | "strike" | "const"

  // Effects list
  const [effectsList, setEffectsList] = useState([
    {
      effectIndex: 0,
      min: 10,
      max: 10,
      dur: 10,
      area: 0,
      range: "self"
    }
  ]);

  const [selectedVendorId, setSelectedVendorId] = useState("galbedir");
  const [vendorSearch, setVendorSearch] = useState("");

  // Available effects from game data / runtime
  const availableEffects = useMemo(() => {
    if (typeof window !== "undefined" && Array.isArray(window.__MW_EFFECTS) && window.__MW_EFFECTS.length > 0) {
      return window.__MW_EFFECTS;
    }
    return [
      { n: "Fortify Attribute", b: 1, mag: 1, dur: 1, school: "Restoration", ce: 1 },
      { n: "Fortify Skill", b: 1, mag: 1, dur: 1, school: "Restoration", ce: 1 },
      { n: "Chameleon", b: 1, mag: 1, dur: 1, school: "Illusion", ce: 1 },
      { n: "Sanctuary", b: 1, mag: 1, dur: 1, school: "Illusion", ce: 1 },
      { n: "Shield", b: 2, mag: 1, dur: 1, school: "Alteration", ce: 1 },
      { n: "Fire Shield", b: 3, mag: 1, dur: 1, school: "Alteration", ce: 1 },
      { n: "Frost Shield", b: 3, mag: 1, dur: 1, school: "Alteration", ce: 1 },
      { n: "Lightning Shield", b: 3, mag: 1, dur: 1, school: "Alteration", ce: 1 },
      { n: "Levitate", b: 3, mag: 1, dur: 1, school: "Alteration", ce: 1 },
      { n: "Water Breathing", b: 3, mag: 0, dur: 1, school: "Alteration", ce: 1 },
      { n: "Water Walking", b: 3, mag: 0, dur: 1, school: "Alteration", ce: 1 },
      { n: "Slowfall", b: 3, mag: 1, dur: 1, school: "Alteration", ce: 1 },
      { n: "Restore Health", b: 5, mag: 1, dur: 1, school: "Restoration", ce: 1 },
      { n: "Restore Fatigue", b: 1, mag: 1, dur: 1, school: "Restoration", ce: 1 },
      { n: "Fire Damage", b: 5, mag: 1, dur: 1, school: "Destruction", ce: 0 },
      { n: "Frost Damage", b: 5, mag: 1, dur: 1, school: "Destruction", ce: 0 },
      { n: "Shock Damage", b: 7, mag: 1, dur: 1, school: "Destruction", ce: 0 },
      { n: "Absorb Health", b: 8, mag: 1, dur: 1, school: "Mysticism", ce: 0 },
      { n: "Paralyze", b: 40, mag: 0, dur: 1, school: "Illusion", ce: 0 }
    ];
  }, []);

  // Update base stats if character changes and user hasn't edited
  const handleIngestCharacterStats = useCallback(() => {
    setSkill(baseSkill);
    setIntelligence(baseInt);
    setLuck(baseLuck);
    setMercantile(baseMerc);
    setPersonality(basePers);
    if (syncToCalculators) syncToCalculators();
  }, [baseSkill, baseInt, baseLuck, baseMerc, basePers, syncToCalculators]);

  // Handle Base Item change
  const handleBaseItemChange = (e) => {
    const itemName = e.target.value;
    setSelectedBaseItem(itemName);
    const found = ENCHANT_BASE_ITEMS.find((b) => b.name === itemName);
    if (found && found.type !== "Custom") {
      setCapacity(found.capacity);
    }
  };

  // Handle Soul Gem change
  const handleSoulGemChange = (e) => {
    const val = Number(e.target.value);
    setSoul(val);
    if (val < 400 && enchantType === "const") {
      setEnchantType("used");
    }
  };

  // Add / remove / update effects
  const handleAddEffect = () => {
    setEffectsList((prev) => [
      ...prev,
      {
        effectIndex: 0,
        min: 10,
        max: 10,
        dur: 10,
        area: 0,
        range: "self"
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

  // Calculation outputs
  const calculatedEffects = useMemo(() => {
    return effectsList.map((row) => {
      const effectObj = availableEffects[row.effectIndex] || availableEffects[0];
      return {
        ...row,
        effect: effectObj
      };
    });
  }, [effectsList, availableEffects]);

  const totalPoints = useMemo(() => {
    return calcEnchantmentTotalPoints(calculatedEffects, enchantType);
  }, [calculatedEffects, enchantType]);

  const selfChance = useMemo(() => {
    return calcSelfEnchantChance(skill, intelligence, luck, totalPoints);
  }, [skill, intelligence, luck, totalPoints]);

  const baseGoldCost = useMemo(() => {
    return calcEnchantGoldCost(totalPoints, enchantType);
  }, [totalPoints, enchantType]);

  const enchantersList = useMemo(() => {
    const list = getActiveEnchanters(world);
    const pc = { merc: mercantile, pers: personality, luck, disp: disposition };
    return list
      .map((npc) => ({
        ...npc,
        barterPrice: calcBarterBuyPrice(baseGoldCost, npc, pc)
      }))
      .sort((a, b) => a.barterPrice - b.barterPrice);
  }, [world, mercantile, personality, luck, disposition, baseGoldCost]);

  const filteredEnchanters = useMemo(() => {
    if (!vendorSearch.trim()) return enchantersList;
    const q = vendorSearch.toLowerCase();
    return enchantersList.filter((e) => e.n.toLowerCase().includes(q));
  }, [enchantersList, vendorSearch]);

  const isOverCapacity = totalPoints > capacity;
  const isCeEligible = soul >= 400;

  // Bi-directional legacy DOM synchronization
  useEffect(() => {
    if (typeof document === "undefined") return;
    const domItem = document.getElementById("enc-item");
    const domSoul = document.getElementById("enc-soul");
    const domType = document.getElementById("enc-type");
    const domSkill = document.getElementById("enc-skill");
    const domInt = document.getElementById("enc-int");
    const domLuck = document.getElementById("enc-luck");
    const domMerc = document.getElementById("enc-merc");
    const domPers = document.getElementById("enc-pers");
    const domDisp = document.getElementById("enc-disp");

    if (domItem && domItem.value !== String(capacity)) domItem.value = String(capacity);
    if (domSoul && domSoul.value !== String(soul)) domSoul.value = String(soul);
    if (domType && domType.value !== enchantType) domType.value = enchantType;
    if (domSkill && domSkill.value !== String(skill)) domSkill.value = String(skill);
    if (domInt && domInt.value !== String(intelligence)) domInt.value = String(intelligence);
    if (domLuck && domLuck.value !== String(luck)) domLuck.value = String(luck);
    if (domMerc && domMerc.value !== String(mercantile)) domMerc.value = String(mercantile);
    if (domPers && domPers.value !== String(personality)) domPers.value = String(personality);
    if (domDisp && domDisp.value !== String(disposition)) domDisp.value = String(disposition);
  }, [capacity, soul, enchantType, skill, intelligence, luck, mercantile, personality, disposition]);

  return (
    <div className="enchanting-workstation p-4 sm:p-5 border border-[#3a2e1d] bg-[#14100a] text-[#f3e6c8] space-y-6">
      {/* Top Banner: Active Character Stats Strip */}
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
            Enchant: <strong className="text-[#d4b06a]">{skill}</strong> | INT: <strong className="text-[#d4b06a]">{intelligence}</strong> | LUK: <strong className="text-[#d4b06a]">{luck}</strong>
          </span>
        </div>

        <button
          type="button"
          className="mw-btn w-full sm:w-auto px-2.5 py-1 text-xs font-serif font-bold"
          onClick={handleIngestCharacterStats}
          title="Reset calculator inputs to match active character sheet"
        >
          Ingest Character Stats
        </button>
      </div>

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-[#d4b06a] uppercase tracking-wider border-b border-[#3a2e1d] pb-1.5">
            Enchantment Configuration
          </h3>

          {/* Item & Soul Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="enchant-item-select" className="text-xs uppercase font-serif font-bold text-[#c2b291] block mb-1">
                Base Item
              </label>
              <select
                id="enchant-item-select"
                className="w-full mw-select p-2 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
                value={selectedBaseItem}
                onChange={handleBaseItemChange}
              >
                {ENCHANT_BASE_ITEMS.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.capacity} pts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enchant-capacity-input" className="text-xs uppercase font-serif font-bold text-[#c2b291] block mb-1">
                Max Capacity Points
              </label>
              <input
                id="enchant-capacity-input"
                type="number"
                min="1"
                max="9999"
                className="w-full bg-[#0c0906] border border-[#3a2e1d] p-2 text-xs font-mono text-[#d4b06a]"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>

          {/* Soul Gem & Enchantment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="enchant-soul-select" className="text-xs uppercase font-serif font-bold text-[#c2b291] block mb-1">
                Soul Gem
              </label>
              <select
                id="enchant-soul-select"
                className="w-full mw-select p-2 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
                value={soul}
                onChange={handleSoulGemChange}
              >
                {SOUL_GEMS.map((g) => (
                  <option key={g.name} value={g.soul}>
                    {g.name} ({g.soul} soul)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-serif font-bold text-[#c2b291] block mb-1">
                Enchantment Type
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: "used", label: "When Used" },
                  { id: "strike", label: "On Strike" },
                  { id: "const", label: "Constant", disabled: !isCeEligible }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={t.disabled}
                    className={`py-1.5 px-1 text-[11px] font-serif font-bold border transition-colors ${
                      enchantType === t.id
                        ? "bg-[#2d2214] border-[#d4b06a] text-[#d4b06a]"
                        : t.disabled
                        ? "bg-[#100d08] border-[#221a0f] text-[#554734] cursor-not-allowed"
                        : "bg-[#14100a] border-[#3a2e1d] text-[#8e7e65] hover:text-[#d4b06a]"
                    }`}
                    onClick={() => setEnchantType(t.id)}
                    title={t.disabled ? "Constant Effect requires soul size of 400 or greater" : t.label}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Effects Stack */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-serif font-bold text-[#d4b06a]">
                Enchantment Effects Stack ({effectsList.length})
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
                const showRange = enchantType !== "const";
                const showDuration = enchantType !== "const" && eff?.dur;
                const showArea = enchantType !== "const" && row.range !== "self";

                return (
                  <div key={idx} className="p-3 bg-[#19140c] border border-[#2a2114] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        className="flex-1 mw-select p-1.5 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
                        value={row.effectIndex}
                        onChange={(e) => handleEffectChange(idx, "effectIndex", Number(e.target.value))}
                      >
                        {availableEffects.map((item, eIdx) => (
                          <option key={eIdx} value={eIdx}>
                            {item.n} (base {item.b})
                          </option>
                        ))}
                      </select>

                      {effectsList.length > 1 && (
                        <button
                          type="button"
                          className="mw-btn px-2 py-1 text-xs font-serif text-[#a03017] hover:text-[#e29381]"
                          onClick={() => handleRemoveEffect(idx)}
                          title="Remove effect from stack"
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

        {/* Right Pane: Dossier, Gauge & Barter */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-[#d4b06a] uppercase tracking-wider border-b border-[#3a2e1d] pb-1.5">
            Enchantment Output &amp; Barter
          </h3>

          {/* Capacity Progress Gauge */}
          <div className="p-3.5 bg-[#17120b] border border-[#3a2e1d] space-y-2">
            <div className="flex justify-between items-center text-xs font-serif">
              <span className="font-bold text-[#d4b06a] uppercase tracking-wider">
                Capacity Usage
              </span>
              <span className={`font-mono font-bold ${isOverCapacity ? "text-[#f28e85]" : "text-[#d4b06a]"}`}>
                {totalPoints} / {capacity} Points
              </span>
            </div>

            <div className="h-3 w-full bg-[#0c0906] border border-[#3a2e1d] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverCapacity ? "bg-[#a03017]" : "bg-[#d4b06a]"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((totalPoints / capacity) * 100))}%`
                }}
              />
            </div>

            {isOverCapacity && (
              <p className="text-[11px] text-[#f28e85] font-serif">
                Total enchantment points exceed the selected item capacity by {totalPoints - capacity} points.
              </p>
            )}
          </div>

          {/* Dossier Card */}
          <div className="p-3.5 bg-[#17120b] border border-[#3a2e1d] space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-[#120e08] border border-[#2a2114]">
                <span className="text-[10px] uppercase text-[#8e7e65] block font-serif">Self-Enchant Chance</span>
                <span className="text-base font-bold font-mono text-[#d4b06a]">{selfChance}%</span>
              </div>

              <div className="p-2 bg-[#120e08] border border-[#2a2114]">
                <span className="text-[10px] uppercase text-[#8e7e65] block font-serif">Base Gold Value</span>
                <span className="text-base font-bold font-mono text-[#d4b06a]">{baseGoldCost.toLocaleString()} g</span>
              </div>
            </div>

            <div className="text-xs space-y-1 pt-1 border-t border-[#2a2215]">
              <span className="text-[11px] text-[#8e7e65] uppercase font-serif block">Effects Summary</span>
              {calculatedEffects.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-serif text-[#e0cfab]">
                  <span>{item.effect?.n || "Effect"}</span>
                  <span className="font-mono text-[11px] text-[#d4b06a]">
                    {enchantType === "const" ? "Constant" : `${item.min}-${item.max} pts, ${item.dur}s`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enchanters Ranked Barter Table */}
          <div className="p-3.5 bg-[#17120b] border border-[#3a2e1d] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase font-serif font-bold text-[#d4b06a]">
                Ranked Enchanters ({filteredEnchanters.length})
              </label>
              <input
                type="text"
                className="bg-[#0c0906] border border-[#3a2e1d] px-2 py-0.5 text-xs text-[#f3e6c8] placeholder-[#7a6b52] font-serif w-36"
                placeholder="Search enchanters..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto mw-scrollbar space-y-1.5 pr-1 border border-[#2a2114] p-1 bg-[#100d08]">
              {filteredEnchanters.slice(0, 15).map((enc) => (
                <div
                  key={enc.id}
                  className={`p-2 border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedVendorId === enc.id
                      ? "bg-[#251e13] border-[#d4b06a] text-[#f3e6c8]"
                      : "bg-[#14100a] border-[#221a0f] text-[#c2b291] hover:border-[#4a3920]"
                  }`}
                  onClick={() => setSelectedVendorId(enc.id)}
                >
                  <div className="truncate mr-2">
                    <span className="font-serif font-bold block truncate">{enc.n}</span>
                    <span className="text-[10px] text-[#8e7e65] font-mono">Merc: {enc.merc} · Pers: {enc.pers}</span>
                  </div>
                  <span className="font-mono font-bold text-[#d4b06a] shrink-0">
                    {enc.barterPrice.toLocaleString()} g
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
