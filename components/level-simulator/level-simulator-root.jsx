"use client";
import { useState, useMemo, useCallback } from "react";
import LevelModeToggle from "./level-mode-toggle";
import LevelStepEditor from "./level-step-editor";
import ProgressionSheet from "./progression-sheet";
import { useShell } from "../shell-context";
import { useActiveCharacter } from "../character-context";
import {
  PROGRESSION_MODES,
  ARCHETYPES,
  normalizeCharacterState,
  detectArchetype,
  simulateProgression,
  applyLevelStep
} from "../../lib/level-math.mjs";

export default function LevelSimulatorRoot() {
  const shell = useShell();
  const { build, sheet, catalogs } = useActiveCharacter();

  // Normalize initial base character
  const initialSheet = useMemo(() => {
    try {
      return normalizeCharacterState(
        sheet || build,
        catalogs,
        { bitterCup: Boolean(sheet?.bitterCup || build?.bitterCup) }
      );
    } catch (e) {
      return null;
    }
  }, [build, sheet, catalogs]);

  // Detected archetype for the character
  const detectedArchetype = useMemo(() => {
    return detectArchetype(initialSheet || build);
  }, [initialSheet, build]);

  // UI state
  const [mode, setMode] = useState(PROGRESSION_MODES.STATS_ONLY);
  const [archetypeId, setArchetypeId] = useState(() => detectedArchetype.id);
  const [customPriority, setCustomPriority] = useState(() => [...detectedArchetype.priority]);
  const [strategy, setStrategy] = useState("auto");
  const [targetLevel, setTargetLevel] = useState(() => {
    return initialSheet ? Math.min(initialSheet.levelCap, 50) : 50;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState("controls"); // "controls" | "sheet"
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Run full simulation
  const simulation = useMemo(() => {
    if (!initialSheet) return null;
    return simulateProgression(initialSheet, {
      targetLevel,
      archetype: archetypeId !== "custom" ? archetypeId : undefined,
      priority: customPriority,
      strategy,
      mode,
      catalogs
    });
  }, [initialSheet, targetLevel, archetypeId, customPriority, strategy, mode, catalogs]);

  const steps = simulation?.steps || [];
  const levelCap = simulation?.levelCap || initialSheet?.levelCap || 60;

  // Current state at active stepIndex
  const currentState = useMemo(() => {
    if (!simulation) return initialSheet;
    if (steps.length === 0 || stepIndex === 0) {
      return simulation.initialSheet;
    }
    const step = steps[Math.min(stepIndex, steps.length - 1)];
    return {
      ...initialSheet,
      level: step.nextLevel,
      attributes: step.stateAfter.attributes,
      skills: step.stateAfter.skills,
      health: step.stateAfter.health,
      magicka: step.stateAfter.magicka,
      fatigue: step.stateAfter.fatigue
    };
  }, [simulation, initialSheet, steps, stepIndex]);

  // Handlers
  const handleSelectArchetype = useCallback((id) => {
    setArchetypeId(id);
    if (id !== "custom" && ARCHETYPES[id]) {
      setCustomPriority([...ARCHETYPES[id].priority]);
    }
  }, []);

  const handleReorderPriority = useCallback((newPriority) => {
    setCustomPriority(newPriority);
    setArchetypeId("custom");
  }, []);

  const handleApplyStrategy = useCallback((strat) => {
    setStrategy(strat);
    showToast(`Strategy applied: ${strat}`);
  }, []);

  const handleResetPlan = useCallback(() => {
    setStrategy("auto");
    setTargetLevel(initialSheet?.level || 1);
    setStepIndex(0);
    showToast("Progression reset to Level 1");
  }, [initialSheet]);

  const handleApplyManualStep = useCallback((stepData) => {
    if (!currentState) return;
    const nextState = applyLevelStep(currentState, stepData);
    showToast(`Level ${nextState.level} applied manually`);
  }, [currentState]);

  // Export leveled character JSON dossier
  const handleExportJSON = useCallback(() => {
    if (!simulation) return;
    const dossier = {
      app: "Silt Strider",
      version: "1.0.0",
      tool: "Character Level Simulator",
      exportDate: new Date().toISOString(),
      world: shell.world,
      character: {
        name: build.name || build.className || "Custom Build",
        race: initialSheet?.race,
        gender: initialSheet?.gender,
        class: initialSheet?.className,
        sign: initialSheet?.sign,
        bitterCup: initialSheet?.bitterCup
      },
      progression: {
        startingLevel: initialSheet?.level,
        targetLevel,
        theoreticalLevelCap: levelCap,
        strategy,
        mode,
        totalTrainingCost: simulation.totalTrainingCost,
        finalVitals: {
          health: simulation.finalState?.health,
          magicka: simulation.finalState?.magicka,
          fatigue: simulation.finalState?.fatigue
        },
        finalAttributes: simulation.finalState?.attributes,
        finalSkills: simulation.finalState?.skills
      },
      history: steps.map((s) => ({
        level: s.level,
        nextLevel: s.nextLevel,
        attributeBonuses: s.attributeBonuses,
        majorMinorIncreases: s.majorMinorIncreases,
        miscTraining: s.miscTraining,
        healthGain: s.healthGain,
        trainingCost: s.totalTrainingCost
      }))
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${build.className || "character"}-level-${targetLevel}-progression.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Leveled Build JSON exported");
  }, [simulation, build, initialSheet, targetLevel, levelCap, strategy, mode, shell.world, steps]);

  return (
    <div className="level-simulator-root w-full mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 p-3 bg-surface-7 border border-accent text-fg-2 font-serif text-xs font-bold shadow-xl animate-fade-in"
          role="status"
        >
          {toastMessage}
        </div>
      )}

      {/* Top Controls & Navigation Bar */}
      <div className="top-toolbar bg-surface-7 p-4 border border-line-11 mw-groove-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-fg-2 tracking-wide m-0">
            Character Level Simulator &amp; Progression Optimizer
          </h2>
          <p className="text-xs text-fg-11 mt-0.5 m-0 font-sans">
            Simulate leveling to theoretical cap, calculate non-retroactive Health growth, and generate 5x multiplier Misc training itineraries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold"
            onClick={() => {
              window.siltShell?.navigate("builder");
            }}
          >
            ← Back to Character Builder
          </button>
          <button
            type="button"
            className="mw-btn py-2 px-3 text-xs font-serif font-bold text-accent"
            onClick={handleExportJSON}
          >
            Export Leveled JSON
          </button>
        </div>
      </div>

      {/* Dual Mode Progression Toggle */}
      <LevelModeToggle mode={mode} onModeChange={setMode} />

      {/* Mobile Tab Bar (< 1024px) */}
      <div className="flex lg:hidden items-center gap-2 w-full p-1 bg-surface-2 border border-line-11 mb-4">
        <button
          type="button"
          className={`flex-1 py-2 px-3 text-xs font-serif font-bold transition-all mw-btn ${
            mobileTab === "controls" ? "active" : ""
          }`}
          onClick={() => setMobileTab("controls")}
        >
          Leveling Optimizer &amp; Stepper
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-3 text-xs font-serif font-bold transition-all mw-btn ${
            mobileTab === "sheet" ? "active" : ""
          }`}
          onClick={() => setMobileTab("sheet")}
        >
          Leveled Character Sheet
        </button>
      </div>

      {/* Two-Pane Responsive Layout */}
      <div className="cb-dashboard">
        {/* Left Pane: Level Step Editor & Optimizer Controls */}
        <div className={`cb-pane ${mobileTab !== "controls" ? "cb-pane-mobile-hidden" : ""}`}>
          <LevelStepEditor
            currentState={currentState}
            initialSheet={initialSheet}
            stepIndex={stepIndex}
            steps={steps}
            targetLevel={targetLevel}
            levelCap={levelCap}
            priority={customPriority}
            archetypeId={archetypeId}
            detectedArchetype={detectedArchetype}
            strategy={strategy}
            mode={mode}
            onStepIndexChange={setStepIndex}
            onTargetLevelChange={setTargetLevel}
            onSelectArchetype={handleSelectArchetype}
            onReorderPriority={handleReorderPriority}
            onApplyStrategy={handleApplyStrategy}
            onResetPlan={handleResetPlan}
            onApplyManualStep={handleApplyManualStep}
          />
        </div>

        {/* Right Pane: Leveled Character Sheet & Charts */}
        <div className={`cb-pane ${mobileTab !== "sheet" ? "cb-pane-mobile-hidden" : ""}`}>
          <ProgressionSheet
            character={build}
            currentState={currentState}
            initialSheet={initialSheet}
            mode={mode}
            catalogs={catalogs}
            targetLevel={targetLevel}
          />
        </div>
      </div>
    </div>
  );
}
