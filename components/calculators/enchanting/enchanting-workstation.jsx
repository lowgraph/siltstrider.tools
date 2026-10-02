"use client";
import {effectNumber, allowedRanges, effectDraft, selectedEffect, baseCostLabel} from "../../../lib/effect-editor.mjs";
import { useState, useEffect, useMemo, useCallback, useId } from "react";
import { statNumber, typedStats, typeStat, forgetTypedStats } from "../../../lib/calculator-stats.mjs";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import ActiveCharacterLink from "../../active-character-link";
import { CUSTOM_ENCHANT_KINDS, enchantItemKind, eligibleEnchantTypes, validEnchantType } from "../../../lib/enchant-eligibility.mjs";
import {
  SOUL_GEMS,
  ENCHANT_BASE_ITEMS,
  DEFAULT_ENCHANT_ITEM,
  DEFAULT_SOUL_GEM,
  enchantingSettings,
  calcEnchantmentCosts,
  calcSelfEnchantChance,
  calcEnchantGoldCost,
  calcBarterBuyPrice,
  getActiveEnchanters
} from "../../../lib/enchant-math.mjs";

// A new effect's starting numbers (ENC-1): 5 points for 5 seconds, so a single effect fits
// the first case, an Expensive Ring (Restore Health on self costs about 6 of its 15 points;
// 10 for 10 seconds, sized for an Exquisite Ring, cost 25).
const NEW_EFFECT_ROW = Object.freeze({ effectKey: "", min: 5, max: 5, dur: 5, area: 0, range: "self" });

// Where a number goes before there is anything to calculate: a dash, read out in words.
const NO_RESULT = <><span aria-hidden="true">—</span><span className="sr-only">not calculated yet</span></>;

export default function EnchantingWorkstation() {
  const effectFieldsId = useId();
  const { build, sheet: buildSheet, activeSave } = useActiveCharacter();
  const sheet = activeSave?.sheet || buildSheet;
  const { world } = useShell();

  // Character stats
  const baseSkill = sheet?.skills?.["Enchant"]?.v ?? 50;
  const baseInt = sheet?.attrs?.["Intelligence"]?.v ?? 40;
  const baseLuck = sheet?.attrs?.["Luck"]?.v ?? 40;
  const baseMerc = sheet?.skills?.["Mercantile"]?.v ?? 40;
  const basePers = sheet?.attrs?.["Personality"]?.v ?? 40;

  const [skill, setSkill] = useState(() => typedStats("enchanting").skill ?? baseSkill);
  const [intelligence, setIntelligence] = useState(() => typedStats("enchanting").intelligence ?? baseInt);
  const [luck, setLuck] = useState(() => typedStats("enchanting").luck ?? baseLuck);
  const [mercantile, setMercantile] = useState(baseMerc);
  const [personality, setPersonality] = useState(basePers);
  const [disposition, setDisposition] = useState(50);
  const [showCustomInputs, setShowCustomInputs] = useState(() => Object.keys(typedStats("enchanting")).length > 0);

  // The sheet sets every number the player has not typed; typed ones stay, across a world
  // switch too, until "Reset to character sheet".
  useEffect(() => {
    const kept = typedStats("enchanting");
    setSkill(kept.skill ?? baseSkill);
    setIntelligence(kept.intelligence ?? baseInt);
    setLuck(kept.luck ?? baseLuck);
    setMercantile(baseMerc);
    setPersonality(basePers);
  }, [baseSkill, baseInt, baseLuck, baseMerc, basePers]);

  // Configuration
  // ENC-1: an early enchantment first, not an Exquisite Ring and a Grand Soul Gem.
  const [selectedBaseItem, setSelectedBaseItem] = useState(DEFAULT_ENCHANT_ITEM);
  const [capacity, setCapacity] = useState(() => ENCHANT_BASE_ITEMS.find((b) => b.name === DEFAULT_ENCHANT_ITEM).capacity);
  const [soul, setSoul] = useState(() => SOUL_GEMS.find((g) => g.name === DEFAULT_SOUL_GEM).soul);
  const [requestedType, setEnchantType] = useState("used");
  const [customKind, setCustomKind] = useState('apparel');

  // Effects list
  const [effectsList, setEffectsList] = useState(() => [{ ...NEW_EFFECT_ROW }]);

  const [selectedVendorId, setSelectedVendorId] = useState("galbedir");
  const [vendorSearch, setVendorSearch] = useState("");

  const gameData = useGameData('enchanting', { enabled: true });
  const mathSettings = useMemo(() => enchantingSettings(gameData.data?.catalogs?.GameSettings), [gameData.data]);
  const baseItem = ENCHANT_BASE_ITEMS.find(item => item.name === selectedBaseItem);
  const itemKind = enchantItemKind(baseItem, customKind);
  const allowedTypes = eligibleEnchantTypes(itemKind, soul, mathSettings.iSoulAmountForConstantEffect);
  // Derive a valid choice during the render too, before the state update settles.
  const enchantType = validEnchantType(requestedType, allowedTypes);
  useEffect(() => { if (requestedType !== enchantType) setEnchantType(enchantType); }, [requestedType, enchantType]);

  // Available effects from game data / runtime
  const availableEffects = useMemo(() => {
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.EffectRules)) {
      const live = gameData.data.catalogs.EffectRules
        .filter((r) => r.allowEnchanting)
        .map((r) => ({
          ...r,
          n: r.name,
          b: r.baseCost,
          mag: r.noMagnitude ? 0 : 1,
          dur: r.noDuration ? 0 : 1,
          school: r.school ? (r.school.charAt(0).toUpperCase() + r.school.slice(1)) : "Alteration",
          ce: 1
        }))
        .sort((a, b) => a.n.localeCompare(b.n));
      return live;
    }
    return [];
  }, [gameData.status, gameData.data]);

  // Update base stats if character changes and user hasn't edited
  const handleIngestCharacterStats = useCallback(() => {
    forgetTypedStats("enchanting");
    setSkill(baseSkill);
    setIntelligence(baseInt);
    setLuck(baseLuck);
    setMercantile(baseMerc);
    setPersonality(basePers);
  }, [baseSkill, baseInt, baseLuck, baseMerc, basePers]);

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
    const input = Number(e.target.value);
    const val = Number.isFinite(input) ? Math.max(0, Math.trunc(input)) : 0;
    setSoul(val);
    if (val < 400 && enchantType === "const") {
      setEnchantType("used");
    }
  };

  // Add / remove / update effects
  const handleAddEffect = () => {
    setEffectsList((prev) => [...prev, { ...NEW_EFFECT_ROW }]);
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
    return effectsList.filter(row => selectedEffect(availableEffects,row.effectKey)).map((row) => {
      const effectObj = selectedEffect(availableEffects,row.effectKey);
      return {
        ...effectDraft(row, effectObj, gameData.data?.catalogs, enchantType === "const"),
        effect: effectObj
      };
    });
  }, [effectsList, availableEffects, gameData.data, enchantType]);

  const costs = useMemo(() => calcEnchantmentCosts(calculatedEffects, enchantType, mathSettings), [calculatedEffects, enchantType, mathSettings]);
  const totalPoints = costs.capacityPoints;

  const selfChance = useMemo(() => {
    return calcSelfEnchantChance(skill, intelligence, luck, costs.precisePoints, { type: enchantType, settings: mathSettings });
  }, [skill, intelligence, luck, costs.precisePoints, enchantType, mathSettings]);

  const baseGoldCost = useMemo(() => {
    return calcEnchantGoldCost(costs.finalEffectCost, enchantType, mathSettings);
  }, [costs.finalEffectCost, enchantType, mathSettings]);

  const enchantersList = useMemo(() => {
    let list = null;
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.Merchants)) {
      const liveMerchants = gameData.data.catalogs.Merchants
        .filter((m) => (m.servicesRaw & 65536) !== 0)
        .map((m) => ({
          id: m.key,
          n: `${m.name} (${m.cells?.[0] ? m.cells[0].replace(/^(interior|exterior):/,'') : m.class || 'Enchanter'})`,
          merc: m.mercantile,
          pers: m.personality,
          luck: m.luck,
          gold: m.gold
        }));
      if (liveMerchants.length > 0) list = liveMerchants;
    }
    if (!list) {
      list = getActiveEnchanters(world);
    }
    const pc = { merc: mercantile, pers: personality, luck, disp: disposition };
    return list
      .map((npc) => ({
        ...npc,
        barterPrice: calcBarterBuyPrice(baseGoldCost, npc, pc)
      }))
      .sort((a, b) => a.barterPrice - b.barterPrice);
  }, [gameData.status, gameData.data, world, mercantile, personality, luck, disposition, baseGoldCost]);

  const filteredEnchanters = useMemo(() => {
    if (!vendorSearch.trim()) return enchantersList;
    const q = vendorSearch.toLowerCase();
    return enchantersList.filter((e) => e.n.toLowerCase().includes(q));
  }, [enchantersList, vendorSearch]);

  const isOverCapacity = totalPoints > capacity;
  const hasEffect = calculatedEffects.length > 0;

  return (
    <div className="enchanting-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-6">
      {/* Workstation Header Bar */}
      <div className="bg-surface-7 p-4 border border-line-11 mw-groove-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mw-caption font-serif text-xl sm:text-2xl font-bold text-fg-2 tracking-wide m-0">
            Enchanting
          </h2>
          <p className="text-xs text-fg-11 mt-0.5 m-0 font-sans">
            Calculate enchantment points, constant effect soul requirements, self-enchant probabilities, and enchanter barter fees.
          </p>
        </div>
      </div>

      {/* Top Banner: Active Character Stats Strip & Live Game-Data Status */}
      <div className="p-3 bg-surface-5 border border-line-11 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-serif font-bold text-accent">
              Using <ActiveCharacterLink build={build} />:
            </span>
            <span className="text-fg-9 whitespace-nowrap">
              Enchant <strong className="text-accent">{skill}</strong> (INT: <strong className="text-accent">{intelligence}</strong> | LUK: <strong className="text-accent">{luck}</strong>)
            </span>
            <button
              type="button"
              id="ench-toggle-custom-stats"
              className="text-xs text-accent underline hover:text-accent-hover font-serif cursor-pointer ml-1 bg-transparent border-0 p-0"
              onClick={() => setShowCustomInputs((v) => !v)}
              aria-expanded={showCustomInputs}
            >
              {showCustomInputs ? "— hide inputs" : "— type your own"}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {gameData.status === 'ready' ? (
              <span className="text-xs px-2 py-0.5 rounded border border-success-line-5 bg-success-surface-1 text-success-3 font-mono flex items-center gap-1.5 shadow-inner" title={`Loaded from content-addressed bundle ${gameData.bundleId || ''}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-success-surface-7 inline-block"/>
                <span>Live: {availableEffects.length} Effects · {enchantersList.length} Vendors ({gameData.data?.profile?.toUpperCase() || activeWorld.toUpperCase()})</span>
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
              title="Reset calculator inputs to match active character sheet"
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
              <label htmlFor="ench-skill-input" className="text-fg-9 font-serif font-bold whitespace-nowrap shrink-0">
                Enchant:
              </label>
              <input
                id="ench-skill-input"
                type="number"
                min="0"
                max="1000"
                className="w-16 bg-surface-1 border border-line-9 px-2 py-0.5 text-xs font-mono text-accent font-bold"
                value={skill}
                onChange={(e) => setSkill(typeStat("enchanting", "skill", statNumber(e.target.value)))}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="ench-int-input" className="text-fg-9 font-serif font-bold whitespace-nowrap shrink-0">
                INT:
              </label>
              <input
                id="ench-int-input"
                type="number"
                min="0"
                max="1000"
                className="w-16 bg-surface-1 border border-line-9 px-2 py-0.5 text-xs font-mono text-accent font-bold"
                value={intelligence}
                onChange={(e) => setIntelligence(typeStat("enchanting", "intelligence", statNumber(e.target.value)))}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="ench-luck-input" className="text-fg-9 font-serif font-bold whitespace-nowrap shrink-0">
                LUK:
              </label>
              <input
                id="ench-luck-input"
                type="number"
                min="0"
                max="1000"
                className="w-16 bg-surface-1 border border-line-9 px-2 py-0.5 text-xs font-mono text-accent font-bold"
                value={luck}
                onChange={(e) => setLuck(typeStat("enchanting", "luck", statNumber(e.target.value)))}
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

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Configuration */}
        <div className="space-y-4">
          <h3 className="mw-caption text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Enchantment Configuration
          </h3>

          {/* Item & Soul Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="enchant-item-select" className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1">
                Base Item
              </label>
              <select
                id="enchant-item-select"
                className="w-full mw-select p-2 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={selectedBaseItem}
                onChange={handleBaseItemChange}
              >
                {ENCHANT_BASE_ITEMS.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.capacity} pts)
                  </option>
                ))}
              </select>
              {baseItem?.type === 'Custom' && <>
                <label htmlFor="enchant-custom-kind" className="text-xs font-serif text-fg-7 block mt-2 mb-1">Custom item kind</label>
                <select id="enchant-custom-kind" className="w-full mw-select p-2 text-xs" value={customKind} onChange={e => setCustomKind(e.target.value)}>
                  {CUSTOM_ENCHANT_KINDS.map(kind => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
                </select>
              </>}
            </div>

            <div>
              <label htmlFor="enchant-capacity-input" className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1">
                Max Capacity Points
              </label>
              <input
                id="enchant-capacity-input"
                type="number"
                min="1"
                max="9999"
                className="w-full bg-surface-1 border border-line-9 p-2 text-xs font-mono text-accent"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>

          {/* Soul Gem & Enchantment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="enchant-soul-select" className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1">
                Example soul
              </label>
              <select
                id="enchant-soul-select"
                className="w-full mw-select p-2 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                value={soul}
                onChange={handleSoulGemChange}
              >
                {!SOUL_GEMS.some(g => g.soul === soul) && <option value={soul}>Custom soul ({soul})</option>}
                {SOUL_GEMS.map((g) => (
                  <option key={g.name} value={g.soul}>
                    {g.name} ({g.soul} soul)
                  </option>
                ))}
              </select>
              <label htmlFor="enchant-soul-size" className="text-xs font-serif text-fg-7 block mt-2 mb-2">Trapped soul size</label>
              <input id="enchant-soul-size" type="number" min="0" step="1" value={soul} onChange={handleSoulGemChange}
                className="w-full p-2 text-xs bg-surface-1 border border-line-9 text-fg-2" aria-describedby="enchant-soul-help" />
              <p id="enchant-soul-help" className="text-[11px] text-fg-9 mt-1">Use the trapped creature&apos;s soul size, which can be smaller than the gem&apos;s capacity.</p>
            </div>

            <div>
              <label id="enchant-type-label" className="text-xs uppercase font-serif font-bold text-fg-7 block mb-1">
                Enchantment Type
              </label>
              <div className="grid grid-cols-3 gap-1" role="group" aria-labelledby="enchant-type-label">
                {[
                  { id: "used", label: "When Used" },
                  { id: "strike", label: "On Strike" },
                  { id: "const", label: "Constant" },
                  ...(itemKind === 'book' ? [{id:'once',label:'Cast Once'}] : [])
                ].map((choice) => {
                  const t = {...choice, disabled: !allowedTypes.includes(choice.id)};
                  return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={t.disabled}
                    aria-pressed={enchantType === t.id}
                    className={`py-1.5 px-1 text-[11px] font-serif font-bold border transition-colors ${
                      enchantType === t.id
                        ? "bg-surface-18 border-accent text-accent"
                        : t.disabled
                        ? "bg-surface-2 border-line-12 text-fg-14 cursor-not-allowed"
                        : "bg-surface-3 border-line-9 text-fg-13 hover:text-accent"
                    }`}
                    onClick={() => setEnchantType(t.id)}
                    title={t.disabled ? (t.id === 'const' && ['melee','ranged','apparel'].includes(itemKind) ? `Constant Effect requires soul size of ${mathSettings.iSoulAmountForConstantEffect} or greater` : "Unavailable for this item kind") : t.label}
                  >
                    {t.label}
                  </button>
                );})}
              </div>
              <p className="text-[11px] text-fg-9 mt-1" role="status">{itemKind === 'apparel' ? 'Armor and clothing use When Used or Constant; On Strike requires a melee weapon, thrown weapon or ammunition.' : itemKind === 'ranged' ? 'Bows and crossbows use When Used or Constant.' : ['ammo','thrown'].includes(itemKind) ? 'Thrown weapons and ammunition use On Strike only.' : itemKind === 'book' ? 'Books and scrolls use Cast Once only.' : 'Melee weapons can use When Used, On Strike or Constant.'}</p>
            </div>
          </div>

          {/* Effects Stack */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-serif font-bold text-accent">
                Enchantment Effects Stack ({effectsList.length})
              </label>
              <button
                type="button"
                className="mw-btn px-2.5 py-1 text-xs font-serif font-bold"
                onClick={handleAddEffect}
                disabled={gameData.status !== "ready"}
              >
                Add Effect
              </button>
            </div>

            <div className="space-y-2.5">
              {effectsList.map((draft, idx) => {
                const fieldId = `${effectFieldsId}-${idx}`;
                const row = effectDraft(draft, selectedEffect(availableEffects,draft.effectKey), gameData.data?.catalogs, enchantType === "const");
                const eff = selectedEffect(availableEffects,row.effectKey);
                const showRange = enchantType !== "const";
                const showDuration = enchantType !== "const" && eff?.dur;
                const showArea = enchantType !== "const" && row.range !== "self";

                return (
                  <div key={idx} className="p-3 bg-surface-5 border border-line-11 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        className="flex-1 mw-select p-1.5 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                        aria-label={`Effect ${idx+1}`}
                        disabled={gameData.status !== "ready"}
                        value={row.effectKey}
                        onChange={(e) => handleEffectChange(idx, "effectKey", e.target.value)}
                      >
                        <option value="">Choose an effect</option>
                        {availableEffects.map((item, eIdx) => (
                          <option key={item.key} value={item.key}>
                            {item.n} (base {baseCostLabel(item.b)})
                          </option>
                        ))}
                      </select>

                      {effectsList.length > 1 && (
                        <button
                          type="button"
                          className="mw-btn px-2 py-1 text-xs font-serif text-danger-9 hover:text-danger-4"
                          onClick={() => handleRemoveEffect(idx)}
                          title="Remove effect from stack"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {(eff?.targetsAttribute || eff?.targetsSkill) && <label className="block text-xs">{eff.targetsAttribute ? 'Attribute' : 'Skill'}
                      <select aria-label={`Effect target ${idx+1}`} className="mw-select" value={row.target} onChange={event => handleEffectChange(idx, 'target', event.target.value)}>
                        {(gameData.data?.catalogs?.[eff.targetsAttribute ? 'Attributes' : 'Skills'] || []).map(target => <option key={target.id} value={target.id}>{target.name}</option>)}
                      </select>
                    </label>}
                    {!eff && row.effectKey && <p role="alert">This effect is unavailable in this profile. Choose another effect.</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {eff && showRange && (
                        <div>
                          <label htmlFor={`${fieldId}-range`} className="text-[10px] text-fg-13 block mb-0.5">Range</label>
                          <select
                            className="w-full mw-select p-1 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
                            id={`${fieldId}-range`}
                            value={row.range}
                            onChange={(e) => handleEffectChange(idx, "range", e.target.value)}
                          >
                            {allowedRanges(eff).map(range => <option key={range} value={range}>{range[0].toUpperCase()+range.slice(1)}</option>)}
                          </select>
                        </div>
                      )}

                      {Boolean(eff?.mag) && <><div>
                        <label htmlFor={`${fieldId}-min`} className="text-[10px] text-fg-13 block mb-0.5">Min Mag</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                          id={`${fieldId}-min`}
                          value={row.min}
                          onChange={(e) => handleEffectChange(idx, "min", effectNumber(e.target.value))}
                        />
                      </div>

                      <div>
                        <label htmlFor={`${fieldId}-max`} className="text-[10px] text-fg-13 block mb-0.5">Max Mag</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                          id={`${fieldId}-max`}
                          value={row.max}
                          onChange={(e) => handleEffectChange(idx, "max", effectNumber(e.target.value))}
                        />
                      </div>

                      </>}
                      {Boolean(showDuration) && (
                        <div>
                          <label htmlFor={`${fieldId}-dur`} className="text-[10px] text-fg-13 block mb-0.5">Duration</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                            id={`${fieldId}-dur`}
                            value={row.dur}
                            onChange={(e) => handleEffectChange(idx, "dur", effectNumber(e.target.value))}
                          />
                        </div>
                      )}

                      {eff && showArea && (
                        <div>
                          <label htmlFor={`${fieldId}-area`} className="text-[10px] text-fg-13 block mb-0.5">Area</label>
                          <input
                            type="number"
                            min="0"
                            max="500"
                            className="w-full bg-surface-1 border border-line-9 p-1 text-xs font-mono text-fg-2"
                            id={`${fieldId}-area`}
                            value={row.area}
                            onChange={(e) => handleEffectChange(idx, "area", effectNumber(e.target.value, 0))}
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
          <h3 className="mw-caption text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Enchantment Output &amp; Barter
          </h3>

          {/* Capacity Progress Gauge */}
          <div className="p-3.5 bg-surface-5 border border-line-9 space-y-2">
            <div className="flex justify-between items-center text-xs font-serif">
              <span className="font-bold text-accent uppercase tracking-wider">
                Capacity Usage
              </span>
              <span className={`font-mono font-bold ${isOverCapacity ? "text-danger-3" : "text-accent"}`}>
                {totalPoints} / {capacity} Points
              </span>
            </div>

            <div className="h-3 w-full bg-surface-1 border border-line-9 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverCapacity ? "bg-danger-surface-4" : "bg-accent"
                }`}
                style={{
                  width: `${Math.min(100, Math.round((totalPoints / capacity) * 100))}%`
                }}
              />
            </div>

            {isOverCapacity && (
              <p className="text-[11px] text-danger-3 font-serif">
                Total enchantment points exceed the selected item capacity by {totalPoints - capacity} points.
              </p>
            )}
          </div>

          {/* Dossier Card */}
          <div className="p-3.5 bg-surface-5 border border-line-9 space-y-2.5">
            {!hasEffect && (
              <p className="calc-empty-prompt text-xs text-fg-9 font-serif italic m-0">
                Choose an effect to see your chance to enchant it yourself and what enchanters charge.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Self-Enchant Chance</span>
                <span className={`text-base font-bold font-mono ${hasEffect ? "text-accent" : "text-fg-11"}`}>{hasEffect ? `${selfChance}%` : NO_RESULT}</span>
              </div>

              <div className="p-2 bg-surface-3 border border-line-11">
                <span className="text-[10px] uppercase text-fg-13 block font-serif">Base Gold Value</span>
                <span className={`text-base font-bold font-mono ${hasEffect ? "text-accent" : "text-fg-11"}`}>{hasEffect ? `${baseGoldCost.toLocaleString()} g` : NO_RESULT}</span>
              </div>
            </div>

            <div className="text-xs space-y-1 pt-1 border-t border-line-11">
              <span className="text-[11px] text-fg-13 uppercase font-serif block">Effects Summary</span>
              {calculatedEffects.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-serif text-fg-4">
                  <span>{item.effect?.n || "Effect"}</span>
                  <span className="font-mono text-[11px] text-accent">
                    {enchantType === "const" ? "Constant" : `${item.min}-${item.max} pts, ${item.dur}s`}
                  </span>
                </div>
              ))}
            </div>

            <details className="calculation-notes">
              <summary>How this is calculated</summary>
              <div>
                <p>Stronger, longer-lasting and wider effects use more enchantment points. The total must fit within the item&apos;s capacity. Target range costs 1.5 times as much as Self or Touch.</p>
                <p>Constant Effect needs a soul worth at least 400 points, such as a Golden Saint or Ascended Sleeper held in a Grand Soul Gem or Azura&apos;s Star.</p>
                <p>Each effect adds <span className="font-mono">((Min + Max) × Duration + Area) × BaseCost × {mathSettings.fEffectCostMult * 0.05}</span> to a running cost. Min, Max and Area count as at least 1; the running cost is at least 1, then Target multiplies it by 1.5. Constant Effect uses {mathSettings.fEnchantmentConstantDurationMult} for Duration. Capacity adds each running cost rounded down, so earlier effects count again as later effects are added.</p>
                <p>Your Enchant skill, Intelligence, Luck and fatigue affect the chance of making the item yourself. More points make it harder. This estimate assumes full fatigue.</p>
                <p>Success chance: <span className="font-mono">(Enchant + 0.2×Int + 0.1×Luck − {mathSettings.fEnchantmentChanceMult}×Precise Points) × Fatigue</span>, with an additional ×{mathSettings.fEnchantmentConstantChanceMult} for Constant Effect, truncated and limited to 0–100%. Precise Points adds the running costs before rounding; Int means Intelligence. Full fatigue uses ×{mathSettings.fFatigueBase}.</p>
                <p>Base Gold Value uses only the final running cost ×{mathSettings.fEnchantmentValueMult}, truncated before barter. Constant Effect has no extra price multiplier. These calculations follow the OpenMW 0.51 source for a single item.</p>
                <p>A hired enchanter&apos;s price depends on their Mercantile and disposition toward you, as well as your Mercantile, Personality and Luck.</p>
              </div>
            </details>
          </div>

          {/* Enchanters Ranked Barter Table */}
          <div className="p-3.5 bg-surface-5 border border-line-9 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase font-serif font-bold text-accent">
                Ranked Enchanters ({filteredEnchanters.length})
              </label>
              <input
                type="text"
                className="bg-surface-1 border border-line-9 px-2 py-0.5 text-xs text-fg-2 placeholder-fg-15 font-serif w-36"
                placeholder="Search enchanters..."
                aria-label="Search enchanters"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />
            </div>

            <div tabIndex={0} role="region" aria-label="Ranked enchanters" className="max-h-48 overflow-y-auto mw-scrollbar space-y-1.5 pr-1 border border-line-11 p-1 bg-surface-2">
              {filteredEnchanters.slice(0, 15).map((enc) => (
                <div
                  key={enc.id}
                  className={`p-2 border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    selectedVendorId === enc.id
                      ? "bg-surface-14 border-accent text-fg-2"
                      : "bg-surface-3 border-line-12 text-fg-7 hover:border-line-7"
                  }`}
                  onClick={() => setSelectedVendorId(enc.id)}
                >
                  <div className="truncate mr-2">
                    <span className="font-serif font-bold block truncate">{enc.n}</span>
                    <span className="text-[10px] text-fg-13 font-mono">Merc: {enc.merc} · Pers: {enc.pers}</span>
                  </div>
                  <span className="font-mono font-bold text-accent shrink-0">
                    {hasEffect ? `${enc.barterPrice.toLocaleString()} g` : NO_RESULT}
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
