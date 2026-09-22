"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import SeedBar from "./seed-bar";
import RunConfigurator from "./run-configurator";
import RunSummarySheet from "./run-summary-sheet";
import PoolBrowserModal from "./pool-browser-modal";
import { useShell } from "../shell-context";
import { useActiveCharacter } from "../character-context";
import { useChallengeRun } from "../challenge-run-context";
import { DIFFICULTY_PRESETS, formatRunMarkdown } from "../../lib/challenge-math.mjs";
import { formatRunSeed, generateSeededRun, newSeedCode, parseRunSeed, rollCardAspect } from "../../lib/challenge-engine.mjs";

export default function ChallengeRunsRoot() {
  const shell = useShell();
  const { catalogs, setBuild, clearSave } = useActiveCharacter();

  // The run, its locks and the roll settings live in ChallengeRunProvider, above the
  // views, so they survive a trip to the Build Optimizer and back.
  const { run, setRun, locks, setLocks, settings, updateSettings } = useChallengeRun();
  const { preset, restrictionCount, objectiveCount, allowedBands } = settings;
  const setPreset = useCallback((id) => updateSettings({ preset: id }), [updateSettings]);
  const setRestrictionCount = useCallback((value) => updateSettings({ restrictionCount: value }), [updateSettings]);
  const setObjectiveCount = useCallback((value) => updateSettings({ objectiveCount: value }), [updateSettings]);
  const setAllowedBands = useCallback(
    (next) => updateSettings((prev) => ({ allowedBands: typeof next === "function" ? next(prev.allowedBands) : next })),
    [updateSettings]
  );

  // UI state
  const [mobileTab, setMobileTab] = useState("config"); // "config" | "sheet"
  const [isPoolBrowserOpen, setIsPoolBrowserOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedPermalink, setCopiedPermalink] = useState(false);

  // Available catalogs from active world
  const races = useMemo(() => {
    if (!catalogs?.races) return [];
    return Object.keys(catalogs.races).filter((name) => name !== "Hill Giant");
  }, [catalogs]);

  const classNames = useMemo(() => {
    if (!catalogs?.classes) return [];
    return Object.keys(catalogs.classes);
  }, [catalogs]);

  const signs = useMemo(() => {
    if (!catalogs?.signs) return [];
    return Object.keys(catalogs.signs);
  }, [catalogs]);

  // Handle Preset Changes
  const handleSelectPreset = useCallback((presetId) => {
    const p = DIFFICULTY_PRESETS[presetId];
    if (!p) return;
    setPreset(p.id);
    if (p.id !== "custom") {
      setRestrictionCount(String(p.restrictionsCount));
      setObjectiveCount(String(p.objectivesCount));
      setAllowedBands({ ...p.bands });

      // Sync to legacy hidden checkboxes if present
      if (typeof document !== "undefined") {
        const easyEl = document.getElementById("tog-easy");
        const medEl = document.getElementById("tog-medium");
        const hardEl = document.getElementById("tog-hard");
        const grindEl = document.getElementById("tog-grind");
        const countEl = document.getElementById("count");
        const objCountEl = document.getElementById("obj-count");
        if (easyEl) easyEl.checked = p.bands.Easy;
        if (medEl) medEl.checked = p.bands.Medium;
        if (hardEl) hardEl.checked = p.bands.Hard;
        if (grindEl) grindEl.checked = p.bands.Grind;
        if (countEl) countEl.value = String(p.restrictionsCount);
        if (objCountEl) objCountEl.value = String(p.objectivesCount);
      }
    }
  }, [setPreset, setRestrictionCount, setObjectiveCount, setAllowedBands]);

  const handleToggleBand = useCallback((bandId) => {
    setPreset("custom");
    setAllowedBands((prev) => {
      const next = { ...prev, [bandId]: !prev[bandId] };
      const el = document.getElementById(`tog-${bandId.toLowerCase()}`);
      if (el) el.checked = next[bandId];
      return next;
    });
  }, [setPreset, setAllowedBands]);

  const handleToggleLock = useCallback((slotKey) => {
    setLocks((prev) => {
      const next = { ...prev, [slotKey]: !prev[slotKey] };
      if (typeof window !== "undefined" && typeof window.setLock === "function") {
        try {
          window.setLock(slotKey, next[slotKey]);
        } catch (e) {}
      }
      return next;
    });
  }, [setLocks]);

  // Roll a whole run from a seed. Unlocked cards come from the seed alone, so the seed
  // reproduces the run; locked cards are carried over and make the run seed-inexact.
  const rollFromSeed = useCallback(
    (seed, { fresh = false } = {}) => {
      const { run: next } = generateSeededRun(seed, {
        catalogs,
        world: shell.world,
        current: fresh ? null : run,
        locks: fresh ? {} : locks,
        fallback: { allowedBands, restrictionCount, objectiveCount }
      });
      setRun(next);
      setMobileTab("sheet");
      return next;
    },
    [catalogs, shell.world, run, locks, allowedBands, restrictionCount, objectiveCount, setRun]
  );

  // Generate: a new seed that carries this world and these settings.
  const handleGenerateRun = useCallback(() => {
    const count = (value) => (value === "random" ? 1 + Math.floor(Math.random() * 5) : value);
    const seed = formatRunSeed({
      code: newSeedCode(),
      profile: shell.profile || "vanilla",
      allowedBands,
      restrictionCount: count(restrictionCount),
      objectiveCount: count(objectiveCount)
    });
    rollFromSeed(seed);
  }, [shell.profile, allowedBands, restrictionCount, objectiveCount, rollFromSeed]);

  // Load a seed: take on its settings and world, and roll it whole, locks aside.
  const [seedError, setSeedError] = useState(null);
  const [pendingSeed, setPendingSeed] = useState(null);
  const handleLoadSeed = useCallback(
    (text) => {
      const parsed = parseRunSeed(text);
      if (!parsed) {
        setSeedError("That is not a Silt Strider seed. Seeds look like K7Q2M-TR-EM-R3O2.");
        return;
      }
      setSeedError(null);
      const seed = String(text).trim().toUpperCase();
      if (parsed.settings) {
        const s = parsed.settings;
        const match = Object.values(DIFFICULTY_PRESETS).find(
          (p) => p.id !== "custom" && p.restrictionsCount === s.restrictionCount && p.objectivesCount === s.objectiveCount &&
            Object.keys(p.bands).every((b) => Boolean(p.bands[b]) === Boolean(s.allowedBands[b]))
        );
        updateSettings({
          preset: match ? match.id : "custom",
          allowedBands: { ...s.allowedBands },
          restrictionCount: String(s.restrictionCount),
          objectiveCount: String(s.objectiveCount)
        });
      }
      setLocks((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
      if (parsed.profile !== (shell.profile || "vanilla") && typeof shell.setProfile === "function") {
        setPendingSeed({ seed, profile: parsed.profile });
        shell.setProfile(parsed.profile);
        return;
      }
      rollFromSeed(seed, { fresh: true });
    },
    [shell, updateSettings, setLocks, rollFromSeed]
  );

  // A seed for another world rolls once that world's races, classes and signs are in.
  useEffect(() => {
    if (!pendingSeed || shell.profile !== pendingSeed.profile) return;
    if (catalogs?.profile && catalogs.profile !== pendingSeed.profile) return;
    setPendingSeed(null);
    rollFromSeed(pendingSeed.seed, { fresh: true });
  }, [pendingSeed, shell.profile, catalogs, rollFromSeed]);

  // Roll individual aspect: the run no longer matches its seed.
  const handleRollAspect = useCallback(
    (key) => {
      if (locks[key]) return;
      setRun((prevRun) => ({
        ...rollCardAspect(key, prevRun, {
          catalogs,
          world: shell.world,
          allowedBands,
          restrictionCount: Number(restrictionCount) || 3,
          objectiveCount: Number(objectiveCount) || 2
        }),
        seedExact: false
      }));
    },
    [locks, catalogs, shell.world, allowedBands, restrictionCount, objectiveCount, setRun]
  );

  // Send to Build Optimizer Bridge
  const handleSendToOptimizer = useCallback(() => {
    if (typeof window === "undefined") return;

    // Resolve class preset details if not Custom
    const targetClass = run.cls || "Custom";
    let targetSpec = run.spec || "Combat";
    let targetFav1 = run.fav1 || "Strength";
    let targetFav2 = run.fav2 || "Endurance";
    let targetMaj = Array.isArray(run.maj) && run.maj.length === 5 ? [...run.maj] : [];
    let targetMin = Array.isArray(run.min) && run.min.length === 5 ? [...run.min] : [];

    if (targetClass !== "Custom" && catalogs?.classes?.[targetClass]) {
      const c = catalogs.classes[targetClass];
      targetSpec = c.spec || targetSpec;
      targetFav1 = c.fav?.[0] || targetFav1;
      targetFav2 = c.fav?.[1] || targetFav2;
      if (!targetMaj.length) targetMaj = [...(c.maj || [])];
      if (!targetMin.length) targetMin = [...(c.min || [])];
    }

    if (!targetMaj.length) {
      targetMaj = ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"];
    }
    if (!targetMin.length) {
      targetMin = ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"];
    }

    const targetBuild = {
      version: 1,
      world: shell?.world || "vanilla",
      arce: !!shell?.arce,
      name: "",
      race: run.race || "Dark Elf",
      gender: run.gender || "Male",
      className: targetClass,
      sign: run.sign || "The Lady",
      spec: targetSpec,
      fav1: targetFav1,
      fav2: targetFav2,
      maj: targetMaj,
      min: targetMin,
      bitterCup: false
    };

    if (typeof clearSave === "function") {
      clearSave();
    }

    if (typeof setBuild === "function") {
      setBuild(targetBuild);
    }

    // Set legacy DOM values if present (for test environments and fallback scripts)
    const setDomVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = val;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    setDomVal("c-race", targetBuild.race);
    setDomVal("c-gender", targetBuild.gender);
    setDomVal("c-sign", targetBuild.sign);
    setDomVal("c-spec", targetBuild.spec);
    setDomVal("c-fav1", targetBuild.fav1);
    setDomVal("c-fav2", targetBuild.fav2);
    setDomVal("c-class", targetBuild.className);
    targetBuild.maj.forEach((s, i) => setDomVal("maj" + i, s));
    targetBuild.min.forEach((s, i) => setDomVal("min" + i, s));

    // Use legacy bridge function if available
    const btn = document.getElementById("btn-to-optimizer");
    if (btn) {
      try {
        btn.click();
      } catch (e) {}
    }

    // Direct navigation fallback
    if (shell?.navigate) {
      shell.navigate("builder");
    }
  }, [run, catalogs, shell, setBuild, clearSave]);

  // Copy Summary (Markdown)
  const handleCopySummary = useCallback(() => {
    const md = formatRunMarkdown(run);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(md).then(() => {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      });
    } else {
      const btn = document.getElementById("btn-copy-summary");
      if (btn) btn.click();
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  }, [run]);

  // Copy Permalink
  const handleCopyPermalink = useCallback(() => {
    if (typeof window === "undefined") return;
    if (typeof window.writeShareHash === "function") {
      try {
        window.writeShareHash();
      } catch (e) {}
    }
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedPermalink(true);
        setTimeout(() => setCopiedPermalink(false), 2000);
      });
    } else {
      const btn = document.getElementById("btn-copy-permalink");
      if (btn) btn.click();
      setCopiedPermalink(true);
      setTimeout(() => setCopiedPermalink(false), 2000);
    }
  }, []);

  return (
    <div className="challenge-runs-root w-full mx-auto space-y-5">
      {/* Top Bar: Seed Engine, Presets & Quick Share */}
      <SeedBar
        seed={run.seed}
        seedExact={run.seedExact !== false}
        seedError={seedError}
        onApplySeed={handleLoadSeed}
        activePreset={preset}
        onSelectPreset={handleSelectPreset}
        onCopyLink={handleCopyPermalink}
        copiedLink={copiedPermalink}
      />

      {/* Mobile View Toggle (Visible only on screens < 1024px) */}
      <div className="flex lg:hidden items-center gap-2 w-full p-1 bg-surface-2 border border-line-11">
        <button
          type="button"
          className={`flex-1 py-2 px-3 text-sm font-serif font-bold transition-all mw-btn ${
            mobileTab === "config" ? "active" : ""
          }`}
          onClick={() => setMobileTab("config")}
        >
          Run Configuration
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-3 text-sm font-serif font-bold transition-all mw-btn ${
            mobileTab === "sheet" ? "active" : ""
          }`}
          onClick={() => setMobileTab("sheet")}
        >
          Run Summary Sheet
        </button>
      </div>

      {/* 2-Pane CRPG Dashboard */}
      <div className="cb-dashboard">
        {/* Left Pane: Run Configuration */}
        <div className={`cb-pane ${mobileTab !== "config" ? "cb-pane-mobile-hidden" : ""}`}>
          <RunConfigurator
            onGenerateRun={() => handleGenerateRun()}
            preset={preset}
            onSelectPreset={handleSelectPreset}
            restrictionCount={restrictionCount}
            onRestrictionCountChange={setRestrictionCount}
            objectiveCount={objectiveCount}
            onObjectiveCountChange={setObjectiveCount}
            allowedBands={allowedBands}
            onToggleBand={handleToggleBand}
            locks={locks}
            onToggleLock={handleToggleLock}
            character={run}
            onUpdateCharacterSlot={(slot, val) => {
              setRun((prev) => {
                const next = { ...prev, [slot]: val, seedExact: false };
                if (slot === "cls" && catalogs?.classes?.[val]) {
                  const c = catalogs.classes[val];
                  next.spec = c.spec;
                  next.fav1 = c.fav[0];
                  next.fav2 = c.fav[1];
                  next.maj = [...c.maj];
                  next.min = [...c.min];
                }
                return next;
              });
            }}
            races={races}
            classes={classNames}
            signs={signs}
            onOpenPoolBrowser={() => setIsPoolBrowserOpen(true)}
          />
        </div>

        {/* Right Pane: Parchment Run Summary Sheet */}
        <div className={`cb-pane ${mobileTab !== "sheet" ? "cb-pane-mobile-hidden" : ""}`}>
          <RunSummarySheet
            run={run}
            locks={locks}
            onToggleLock={handleToggleLock}
            onRollAspect={handleRollAspect}
            onSendToOptimizer={handleSendToOptimizer}
            onCopySummary={handleCopySummary}
            onCopyPermalink={handleCopyPermalink}
            copiedSummary={copiedSummary}
            copiedPermalink={copiedPermalink}
          />
        </div>
      </div>

      {/* Sticky Quick Roll Action on Mobile when viewing sheet */}
      {mobileTab === "sheet" && (
        <div className="block lg:hidden sticky z-30 px-2 mt-4" style={{ bottom: "calc(var(--phone-tabs-h, 0px) + 12px)" }}>
          <button
            type="button"
            className="w-full mw-btn py-3 px-4 text-sm font-serif font-bold text-fg-2 bg-surface-6/95 backdrop-blur border-2 border-accent shadow-2xl flex items-center justify-center gap-2"
            onClick={() => handleGenerateRun()}
          >
            <span>Re-roll Run</span>
          </button>
        </div>
      )}

      {/* Searchable Pool Explorer Modal */}
      <PoolBrowserModal
        isOpen={isPoolBrowserOpen}
        onClose={() => setIsPoolBrowserOpen(false)}
        world={shell.world}
      />
    </div>
  );
}
