"use client";
import { useState, useMemo } from "react";
import LevelItineraryCard from "./level-itinerary-card";
import AttributePriorityRanker from "./attribute-priority-ranker";
import { ATTRS, validateLevelStep } from "../../lib/level-math.mjs";

export default function LevelStepEditor({
  currentState,
  initialSheet,
  stepIndex,
  steps,
  targetLevel,
  levelCap,
  priority,
  archetypeId,
  detectedArchetype,
  strategy,
  mode,
  onStepIndexChange,
  onTargetLevelChange,
  onSelectArchetype,
  onReorderPriority,
  onApplyStrategy,
  onResetPlan,
  onApplyManualStep
}) {
  const isStatsOnly = mode === "stats_only";
  const currentStep = steps[stepIndex] || null;

  const [isManualEditOpen, setIsManualEditOpen] = useState(false);
  const [manualAttrs, setManualAttrs] = useState([
    { attribute: "Endurance", bonus: 5 },
    { attribute: "Strength", bonus: 5 },
    { attribute: "Agility", bonus: 5 }
  ]);

  // Validation for manual step
  const validation = useMemo(() => {
    if (!currentState) return { valid: true, errors: [] };
    const stepData = {
      attributeBonuses: manualAttrs,
      majorMinorIncreases: currentStep?.majorMinorIncreases || {},
      miscIncreases: currentStep?.miscIncreases || {},
      mode
    };
    return validateLevelStep(currentState, stepData, { mode, statsOnly: isStatsOnly });
  }, [currentState, manualAttrs, currentStep, mode, isStatsOnly]);

  const handleAttrChange = (index, field, value) => {
    const next = [...manualAttrs];
    next[index] = { ...next[index], [field]: field === "bonus" ? Number(value) : value };
    // Luck lock
    if (field === "attribute" && value === "Luck") {
      next[index].bonus = 1;
    }
    setManualAttrs(next);
  };

  const handleApplyManual = () => {
    if (!validation.valid) return;
    onApplyManualStep({
      attributeBonuses: manualAttrs,
      majorMinorIncreases: currentStep?.majorMinorIncreases || {},
      miscIncreases: currentStep?.miscIncreases || {}
    });
    setIsManualEditOpen(false);
  };

  return (
    <div
      className="level-step-editor px-6 sm:px-10 py-7 space-y-6 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* 1-Click Optimization Presets */}
      <div className="optimizer-presets-section space-y-2.5 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
        <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold border-b border-[#221c13] pb-1.5 mb-2">
          Progression Optimizer Presets
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className="mw-btn py-2.5 px-3 text-xs font-serif font-bold text-left flex flex-col justify-center transition-all col-span-1 sm:col-span-2 ring-1 ring-[#d4b06a] active"
            onClick={() => onApplyStrategy("auto")}
          >
            <span className="text-[#f3e6c8] text-sm">⚡ Auto-Calculate Optimal Build</span>
            <span className="text-[10px] text-[#9e8b6b] font-sans font-normal mt-0.5">
              Rushes Endurance to 100 first for max HP, then auto-solves secondary attributes with 5x multipliers.
            </span>
          </button>
          <button
            type="button"
            className={`mw-btn py-2 px-3 text-xs font-serif font-bold text-left transition-all ${
              strategy === "rush_endurance" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
            onClick={() => onApplyStrategy("rush_endurance")}
          >
            <span className="text-[#f3e6c8]">🛡️ Rush Endurance (+5)</span>
            <span className="block text-[10px] text-[#9e8b6b] font-sans font-normal mt-0.5">
              Guarantees +5 Endurance every level until 100.
            </span>
          </button>
          <button
            type="button"
            className={`mw-btn py-2 px-3 text-xs font-serif font-bold text-left transition-all ${
              strategy === "triple_5" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
            onClick={() => onApplyStrategy("triple_5")}
          >
            <span className="text-[#f3e6c8]">⚔️ Triple +5 (+5/+5/+5)</span>
            <span className="block text-[10px] text-[#9e8b6b] font-sans font-normal mt-0.5">
              Pure min-maxing with 3x +5 attribute multipliers.
            </span>
          </button>
          <button
            type="button"
            className={`mw-btn py-2 px-3 text-xs font-serif font-bold text-left transition-all ${
              strategy === "efficient_luck" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
            onClick={() => onApplyStrategy("efficient_luck")}
          >
            <span className="text-[#f3e6c8]">🍀 Efficient (+5/+5/+1 Luck)</span>
            <span className="block text-[10px] text-[#9e8b6b] font-sans font-normal mt-0.5">
              Two +5 bonuses plus steady +1 Luck every level.
            </span>
          </button>
          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold text-[#ef4444] text-left transition-all hover:bg-[#251010]"
            onClick={onResetPlan}
          >
            <span>🔄 Reset to Level 1</span>
            <span className="block text-[10px] text-[#9e8b6b] font-sans font-normal mt-0.5">
              Clears progression back to starting sheet.
            </span>
          </button>
        </div>
      </div>

      {/* Target Level Slider */}
      <div className="target-level-section space-y-2 bg-[#100d08] p-4 border border-[#2a2318] mw-groove-panel">
        <div className="flex items-center justify-between">
          <label htmlFor="target-level-slider" className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Target Level: <strong className="text-sm font-mono text-[#f3e6c8]">{targetLevel}</strong>
          </label>
          <span className="text-xs text-[#9e8b6b] font-mono">
            Max Cap: Level {levelCap}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="target-level-slider"
            type="range"
            min="1"
            max={levelCap}
            value={targetLevel}
            onChange={(e) => onTargetLevelChange(Number(e.target.value))}
            className="w-full accent-[#d4b06a] cursor-pointer"
            aria-label="Target level slider"
          />
          <span className="font-mono text-xs text-[#d4b06a] px-2 py-0.5 bg-[#18140e] border border-[#3a3020] shrink-0">
            {targetLevel} / {levelCap}
          </span>
        </div>
      </div>

      {/* Attribute Priority Ranker */}
      <AttributePriorityRanker
        priority={priority}
        archetypeId={archetypeId}
        detectedArchetype={detectedArchetype}
        onSelectArchetype={onSelectArchetype}
        onReorderPriority={onReorderPriority}
      />

      {/* Step Stepper & Itinerary */}
      <div className="step-stepper-section space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-[#2a2318] pb-2">
          <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Level-by-Level Training Itinerary
          </h4>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="mw-btn py-1 px-2 text-xs font-serif font-bold disabled:opacity-30"
              onClick={() => onStepIndexChange(Math.max(0, stepIndex - 1))}
              disabled={stepIndex <= 0}
              aria-label="Previous level step"
            >
              ◀ Prev
            </button>
            <span className="font-mono text-xs text-[#f3e6c8] px-2 py-0.5 bg-[#100d08] border border-[#2a2318]">
              Step {stepIndex + 1} of {Math.max(1, steps.length)}
            </span>
            <button
              type="button"
              className="mw-btn py-1 px-2 text-xs font-serif font-bold disabled:opacity-30"
              onClick={() => onStepIndexChange(Math.min(steps.length - 1, stepIndex + 1))}
              disabled={stepIndex >= steps.length - 1}
              aria-label="Next level step"
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Current Itinerary Card */}
        <LevelItineraryCard step={currentStep} isStatsOnly={isStatsOnly} />

        {/* Manual Step Customizer Disclosure */}
        <div className="manual-edit-disclosure pt-1">
          <button
            type="button"
            className="text-xs font-serif font-bold text-[#d4b06a] hover:underline flex items-center gap-1"
            onClick={() => setIsManualEditOpen(!isManualEditOpen)}
          >
            <span>{isManualEditOpen ? "▾" : "▸"}</span>
            <span>Manual Step Override &amp; Attribute Allocator</span>
          </button>

          {isManualEditOpen && (
            <div className="manual-step-form mt-2 p-3 bg-[#120f0a] border border-[#2e2316] space-y-3">
              <p className="text-[11px] text-[#9e8b6b] m-0">
                Manually configure the 3 attribute picks for this level. Multipliers are validated against governing skill increases.
              </p>

              <div className="space-y-2">
                {manualAttrs.map((pick, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      className="mw-select text-xs py-1 px-2 flex-1"
                      value={pick.attribute}
                      onChange={(e) => handleAttrChange(i, "attribute", e.target.value)}
                      aria-label={`Manual attribute pick ${i + 1}`}
                    >
                      {ATTRS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <select
                      className="mw-select text-xs py-1 px-2 w-24 shrink-0"
                      value={pick.bonus}
                      onChange={(e) => handleAttrChange(i, "bonus", e.target.value)}
                      disabled={pick.attribute === "Luck"}
                      aria-label={`Manual attribute bonus ${i + 1}`}
                    >
                      {pick.attribute === "Luck" ? (
                        <option value="1">+1 (Fixed)</option>
                      ) : (
                        [1, 2, 3, 4, 5].map((b) => (
                          <option key={b} value={b}>
                            +{b} ({b}x)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ))}
              </div>

              {/* Validation errors */}
              {!validation.valid && (
                <div className="text-[11px] text-[#ef4444] space-y-0.5 bg-[#251010] p-2 border border-[#4a1c1c]">
                  {validation.errors.map((err, idx) => (
                    <div key={idx}>⚠️ {err}</div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="w-full mw-btn py-2 px-3 text-xs font-serif font-bold disabled:opacity-40"
                onClick={handleApplyManual}
                disabled={!validation.valid}
              >
                Apply Manual Step
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
