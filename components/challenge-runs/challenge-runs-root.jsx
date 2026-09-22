"use client";
import { useState, useCallback, useMemo } from "react";
import SeedBar from "./seed-bar";
import RunConfigurator from "./run-configurator";
import RunSummarySheet from "./run-summary-sheet";
import PoolBrowserModal from "./pool-browser-modal";
import { useShell } from "../shell-context";
import { useActiveCharacter } from "../character-context";
import { useChallengeRun } from "../challenge-run-context";
import {
  POOL,
  MAJORS,
  TR_MAJORS,
  OBJECTIVES,
  DIFFICULTY_PRESETS,
  createRng,
  generateSeed,
  pickCompatibleRestrictions,
  pickMixedObjectives,
  formatRunMarkdown,
  tagsOf,
  restrictionOkForNeeds
} from "../../lib/challenge-math.mjs";
import { rollCardAspect } from "../../lib/challenge-engine.mjs";
import { computeSheet } from "../../lib/character-math.mjs";

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

  const activeMajorsList = useMemo(() => {
    return shell.world === "tr" ? MAJORS.concat(TR_MAJORS) : MAJORS;
  }, [shell.world]);

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

  // Generate Run Logic (Pure + Deterministic / Interactive)
  const handleGenerateRun = useCallback(
    (customSeed) => {
      const activeSeed =
        typeof customSeed === "string"
          ? customSeed
          : generateSeed("SEED", shell.world || "VANILLA");
      const rng = createRng(activeSeed);

      // 1. Roll or Keep Character Identity
      let nextRace = run.race;
      if (!locks.race || !nextRace) {
        const pool = races.length ? races : ["Dark Elf", "Nord", "Redguard", "Breton"];
        nextRace = pool[Math.floor(rng() * pool.length)];
      }

      let nextGender = run.gender;
      if (!nextGender) {
        nextGender = rng() < 0.5 ? "Male" : "Female";
      }

      let nextClass = run.cls;
      if (!locks.cls || !nextClass) {
        const pool = classNames.length ? ["Custom", ...classNames] : ["Warrior", "Mage", "Thief", "Custom"];
        nextClass = pool[Math.floor(rng() * pool.length)];
      }

      let nextSign = run.sign;
      if (!locks.sign || !nextSign) {
        const pool = signs.length ? signs : ["The Lady", "The Warrior", "The Mage", "The Thief"];
        nextSign = pool[Math.floor(rng() * pool.length)];
      }

      // 2. Roll or Keep Major Objective
      let nextMajor = run.major;
      if (!locks.major || !nextMajor) {
        const eligibleMajors = activeMajorsList.filter((m) => {
          if (!locks.rest) return true;
          return run.rests.every((r) => restrictionOkForNeeds(r, tagsOf(m)));
        });
        const pool = eligibleMajors.length ? eligibleMajors : activeMajorsList;
        nextMajor = pool[Math.floor(rng() * pool.length)];
      }

      // 3. Roll or Keep Minor Objectives
      let nextMinors = run.minors;
      if (!locks.obj || !nextMinors || !nextMinors.length) {
        const numObj =
          objectiveCount === "random"
            ? 1 + Math.floor(rng() * 5)
            : Math.min(5, Math.max(1, Number(objectiveCount) || 1));
        nextMinors = pickMixedObjectives(numObj, locks.rest ? run.rests : [], rng);
      }

      // 4. Roll or Keep Active Restrictions
      let nextRests = run.rests;
      let nextRestNote = "";
      if (!locks.rest || !nextRests || !nextRests.length) {
        const numRest =
          restrictionCount === "random"
            ? 1 + Math.floor(rng() * 5)
            : Math.min(5, Math.max(1, Number(restrictionCount) || 1));
        const activePool = POOL.filter((r) => {
          const b = r ? allowedBands[r.band || "Medium"] ?? true : true;
          return allowedBands[b] ?? true;
        });
        const needs = tagsOf(nextMajor).concat(
          ...nextMinors.map((o) => tagsOf(typeof o === "string" ? o : o.text))
        );
        nextRests = pickCompatibleRestrictions(numRest, POOL, needs, rng);
        if (!nextRests.length) {
          nextRestNote = "Turn on more difficulty bands to roll active restrictions.";
        }
      }

      // Determine specialization, favored attributes, and skills for identity
      let nextSpec = run.spec || "Combat";
      let nextFav1 = run.fav1 || "Strength";
      let nextFav2 = run.fav2 || "Endurance";
      let nextMaj = Array.isArray(run.maj) ? [...run.maj] : [];
      let nextMin = Array.isArray(run.min) ? [...run.min] : [];

      if (nextClass === "Custom") {
        if (!nextMaj.length || !nextMin.length || nextClass !== run.cls) {
          const SPECS = ["Combat", "Magic", "Stealth"];
          const ATTRS_LIST = ["Strength", "Intelligence", "Willpower", "Agility", "Speed", "Endurance", "Personality", "Luck"];
          const ALL_SKILLS_LIST = [
            "Block", "Armorer", "Medium Armor", "Heavy Armor", "Blunt Weapon", "Long Blade", "Axe", "Spear", "Athletics",
            "Enchant", "Destruction", "Alteration", "Illusion", "Conjuration", "Mysticism", "Restoration", "Alchemy", "Unarmored",
            "Security", "Sneak", "Acrobatics", "Light Armor", "Short Blade", "Marksman", "Mercantile", "Speechcraft", "Hand-to-hand"
          ];
          nextSpec = SPECS[Math.floor(rng() * SPECS.length)];
          const shuffledAttrs = [...ATTRS_LIST].sort(() => rng() - 0.5);
          nextFav1 = shuffledAttrs[0];
          nextFav2 = shuffledAttrs[1];
          const shuffledSkills = [...ALL_SKILLS_LIST].sort(() => rng() - 0.5);
          nextMaj = shuffledSkills.slice(0, 5);
          nextMin = shuffledSkills.slice(5, 10);
        }
      } else if (catalogs?.classes?.[nextClass]) {
        const c = catalogs.classes[nextClass];
        nextSpec = c.spec;
        nextFav1 = c.fav[0];
        nextFav2 = c.fav[1];
        nextMaj = [...c.maj];
        nextMin = [...c.min];
      }

      // Compute vitals preview
      let vitals = { health: 50, magicka: 40, fatigue: 180 };
      if (catalogs && nextRace && nextClass && nextSign) {
        try {
          const computed = computeSheet(
            {
              race: nextRace,
              gender: nextGender,
              sign: nextSign,
              className: nextClass,
              spec: nextSpec,
              fav1: nextFav1,
              fav2: nextFav2,
              maj: nextMaj.length ? nextMaj : ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"],
              min: nextMin.length ? nextMin : ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"]
            },
            catalogs
          );
          if (computed) {
            vitals = {
              health: computed.health,
              magicka: computed.magicka,
              fatigue: computed.fatigue
            };
          }
        } catch (e) {}
      }

      const updatedRun = {
        ...run,
        race: nextRace,
        gender: nextGender,
        cls: nextClass,
        sign: nextSign,
        spec: nextSpec,
        fav1: nextFav1,
        fav2: nextFav2,
        maj: nextMaj,
        min: nextMin,
        major: nextMajor,
        minors: nextMinors,
        rests: nextRests,
        restNote: nextRestNote,
        vitals,
        seed: activeSeed
      };

      setRun(updatedRun);

      // Sync into legacy DOM elements and window.challengeRun
      if (typeof window !== "undefined") {
        if (window.challengeRun) {
          window.challengeRun.race = nextRace;
          window.challengeRun.gender = nextGender;
          window.challengeRun.cls = nextClass;
          window.challengeRun.sign = nextSign;
          window.challengeRun.major = nextMajor;
          window.challengeRun.minors = nextMinors;
          window.challengeRun.rests = nextRests;
          window.challengeRun.restNote = nextRestNote;
        }

        // Set hidden form controls for build optimizer bridge
        const rRace = document.getElementById("r-race");
        if (rRace) rRace.value = nextRace;
        const rGender = document.getElementById("r-gender");
        if (rGender) rGender.value = nextGender;
        const rClass = document.getElementById("r-class");
        if (rClass) rClass.value = nextClass;
        const rSign = document.getElementById("r-sign");
        if (rSign) rSign.value = nextSign;

        if (typeof window.renderRun === "function") {
          try {
            window.renderRun();
          } catch (e) {}
        }
      }

      // Switch to sheet view on mobile when generated
      setMobileTab("sheet");
    },
    [
      run,
      locks,
      races,
      classNames,
      signs,
      activeMajorsList,
      restrictionCount,
      objectiveCount,
      allowedBands,
      catalogs,
      shell.world
    ]
  );

  // Roll individual aspect
  const handleRollAspect = useCallback(
    (key) => {
      if (locks[key]) return;
      setRun((prevRun) => {
        return rollCardAspect(key, prevRun, {
          catalogs,
          world: shell.world,
          allowedBands,
          restrictionCount: Number(restrictionCount) || 3,
          objectiveCount: Number(objectiveCount) || 2
        });
      });
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
        onApplySeed={(s) => handleGenerateRun(s)}
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
                const next = { ...prev, [slot]: val };
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
