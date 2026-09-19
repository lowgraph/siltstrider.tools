"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Configurator from "./configurator";
import CharacterSheet from "./character-sheet";
import PremadeBrowser from "./premade-browser";
import GearAdvisor from "./gear-advisor";
import VitalsBar from "./vitals-bar";
import { computeSheet, swapSkill } from "../../lib/character-math.mjs";
import { useShell } from "../shell-context";
import { getGameDataLoader } from "../use-game-data";
import { createCharacterCatalogService } from "../../lib/character-catalogs.mjs";

const DEFAULT_BUILD = {
  version: 1,
  world: "vanilla",
  arce: false,
  name: "",
  race: "Dark Elf",
  gender: "Male",
  className: "Custom",
  sign: "The Lady",
  spec: "Combat",
  fav1: "Strength",
  fav2: "Endurance",
  maj: ["Long Blade", "Heavy Armor", "Block", "Armorer", "Athletics"],
  min: ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"]
};

function readBuildFromDom(shell) {
  if (typeof document === "undefined") return null;
  const raceEl = document.getElementById("c-race");
  if (!raceEl || !raceEl.value) return null;

  const getVal = (id, fallback) => {
    const el = document.getElementById(id);
    return el && el.value ? el.value : fallback;
  };

  const maj = [0, 1, 2, 3, 4].map((i) => getVal("maj" + i, DEFAULT_BUILD.maj[i]));
  const min = [0, 1, 2, 3, 4].map((i) => getVal("min" + i, DEFAULT_BUILD.min[i]));

  return {
    version: 1,
    world: shell?.world || "vanilla",
    arce: !!shell?.arce,
    name: "",
    race: getVal("c-race", DEFAULT_BUILD.race),
    gender: getVal("c-gender", DEFAULT_BUILD.gender),
    className: getVal("c-class", DEFAULT_BUILD.className),
    sign: getVal("c-sign", DEFAULT_BUILD.sign),
    spec: getVal("c-spec", DEFAULT_BUILD.spec),
    fav1: getVal("c-fav1", DEFAULT_BUILD.fav1),
    fav2: getVal("c-fav2", DEFAULT_BUILD.fav2),
    maj,
    min
  };
}

function getFallbackCatalogs() {
  if (typeof window === "undefined") return null;
  const races = window.RACES;
  const signs = window.SIGNS;
  const classes = window.VANILLA_CLASS;
  const skills = window.SKILLS;
  const specSkills = window.SPEC_SKILLS;
  if (!races || !signs || !classes || !skills || !specSkills) return null;

  return {
    profile: "vanilla",
    races,
    signs,
    classes,
    skills,
    specSkills,
    raceSpells: window.RACE_SPELLS || {},
    signSpells: window.SIGN_SPELLS || {}
  };
}

export default function CharacterBuilderRoot() {
  const shell = useShell();
  const [activeTab, setActiveTab] = useState("builder"); // "builder" | "premade"
  const [mobileTab, setMobileTab] = useState("config"); // "config" | "sheet" (screens < 1024px)
  const [build, setBuild] = useState(() => {
    const fromDom = typeof window !== "undefined" ? readBuildFromDom(shell) : null;
    return fromDom || DEFAULT_BUILD;
  });
  const [catalogs, setCatalogs] = useState(() => getFallbackCatalogs());
  const [copied, setCopied] = useState(false);
  const isInternalSyncRef = useRef(false);

  // Load and subscribe to character catalogs
  useEffect(() => {
    let current = true;
    if (typeof window === "undefined") return;

    // Use fallback if catalogs not loaded yet
    if (!catalogs) {
      const fb = getFallbackCatalogs();
      if (fb) setCatalogs(fb);
    }

    const service = (window.siltCharacters ||= createCharacterCatalogService(getGameDataLoader()));
    const profile = shell.profile || "vanilla";

    if (service.active && service.active.profile === profile) {
      setCatalogs(service.active);
    } else {
      service
        .prepare(profile)
        .then((data) => {
          if (current) {
            service.activate(profile);
            setCatalogs(data);
          }
        })
        .catch((err) => {
          console.warn("Could not load bundle catalogs; falling back to global tables:", err);
          if (current && !catalogs) {
            const fb = getFallbackCatalogs();
            if (fb) setCatalogs(fb);
          }
        });
    }

    const onStatus = () => {
      if (service.active && current) {
        setCatalogs(service.active);
      }
    };
    window.addEventListener("silt-character-status", onStatus);
    return () => {
      current = false;
      window.removeEventListener("silt-character-status", onStatus);
    };
  }, [shell.profile]);

  // Two-way synchronization: detect external updates ("Send to Build Optimizer", hash permalinks, local storage restore)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromDom = () => {
      if (isInternalSyncRef.current) return;
      const domBuild = readBuildFromDom(shell);
      if (!domBuild) return;

      setBuild((prev) => {
        const isDiff =
          prev.race !== domBuild.race ||
          prev.gender !== domBuild.gender ||
          prev.sign !== domBuild.sign ||
          prev.className !== domBuild.className ||
          prev.spec !== domBuild.spec ||
          prev.fav1 !== domBuild.fav1 ||
          prev.fav2 !== domBuild.fav2 ||
          prev.maj.some((s, i) => s !== domBuild.maj[i]) ||
          prev.min.some((s, i) => s !== domBuild.min[i]);
        return isDiff ? domBuild : prev;
      });
    };

    window.addEventListener("silt-shell-change", syncFromDom);
    window.addEventListener("silt-character-status", syncFromDom);
    window.addEventListener("hashchange", syncFromDom);

    syncFromDom();

    return () => {
      window.removeEventListener("silt-shell-change", syncFromDom);
      window.removeEventListener("silt-character-status", syncFromDom);
      window.removeEventListener("hashchange", syncFromDom);
    };
  }, [shell]);

  // Defend against catalog switches invalidating the selected race or class (ARCE -> Vanilla)
  useEffect(() => {
    if (!catalogs) return;
    const availableRaces = catalogs.races ? Object.keys(catalogs.races) : [];
    const availableClasses = catalogs.classes ? Object.keys(catalogs.classes) : [];

    setBuild((prev) => {
      let nextRace = prev.race;
      let nextClass = prev.className;
      let changed = false;

      if (availableRaces.length > 0 && !availableRaces.includes(prev.race)) {
        nextRace = availableRaces.includes("Dark Elf") ? "Dark Elf" : availableRaces[0];
        changed = true;
      }
      if (prev.className !== "Custom" && availableClasses.length > 0 && !availableClasses.includes(prev.className)) {
        nextClass = "Custom";
        changed = true;
      }

      if (changed) {
        return { ...prev, race: nextRace, className: nextClass };
      }
      return prev;
    });
  }, [catalogs]);

  // Compute live character sheet
  const sheet = useMemo(() => {
    if (!catalogs) return null;
    return computeSheet(build, catalogs);
  }, [build, catalogs]);

  // Pure state updater: field change
  const handleUpdateField = useCallback((field, value) => {
    setBuild((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Pure state updater: swap duplicate skill
  const handleSwapSkill = useCallback((isMajor, index, newSkill) => {
    setBuild((prev) => {
      const { maj, min } = swapSkill(prev.maj, prev.min, isMajor, index, newSkill);
      return { ...prev, maj, min };
    });
  }, []);

  // Pure state updater: preset class selection
  const handleSelectClassPreset = useCallback((className, preset) => {
    if (!preset) {
      setBuild((prev) => ({ ...prev, className }));
      return;
    }

    setBuild((prev) => ({
      ...prev,
      className,
      spec: preset.spec || prev.spec,
      fav1: preset.fav?.[0] || prev.fav1,
      fav2: preset.fav?.[1] || prev.fav2,
      maj: Array.isArray(preset.maj) ? preset.maj : prev.maj,
      min: Array.isArray(preset.min) ? preset.min : prev.min
    }));
  }, []);

  // Pure state updater: premade build selection
  const handleSelectPremade = useCallback(
    (premade) => {
      const favs = (premade.fav || "").split(",").map((s) => s.trim());
      const majs = (premade.maj || "").split(",").map((s) => s.trim());
      const mins = (premade.min || "").split(",").map((s) => s.trim());

      setBuild({
        version: 1,
        world: shell.world || "vanilla",
        arce: !!shell.arce,
        name: premade.name,
        race: premade.race,
        gender: premade.gender || "Male",
        className: "Custom",
        sign: premade.sign,
        spec: premade.spec,
        fav1: favs[0] || "Strength",
        fav2: favs[1] || "Endurance",
        maj: majs,
        min: mins
      });

      setActiveTab("builder");
      setMobileTab("sheet");
    },
    [shell.world, shell.arce]
  );

  // Copy shareable build permalink
  const handleCopyLink = useCallback(() => {
    if (typeof window === "undefined") return;
    if (typeof window.writeShareHash === "function") {
      try {
        window.writeShareHash();
      } catch (e) {}
    }
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const btn = document.getElementById("btn-copy-build-link");
      if (btn) btn.click();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // Synchronize React state to legacy DOM controls in background without firing cascading events
  useEffect(() => {
    if (typeof document === "undefined") return;
    isInternalSyncRef.current = true;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && el.value !== val) {
        el.value = val;
      }
    };
    setVal("c-race", build.race);
    setVal("c-gender", build.gender);
    setVal("c-sign", build.sign);
    setVal("c-spec", build.spec);
    setVal("c-fav1", build.fav1);
    setVal("c-fav2", build.fav2);
    setVal("c-class", build.className);
    build.maj?.forEach((s, i) => setVal("maj" + i, s));
    build.min?.forEach((s, i) => setVal("min" + i, s));

    if (typeof window !== "undefined" && typeof window.syncSkillPrev === "function") {
      try {
        window.syncSkillPrev();
      } catch (e) {}
    }

    // Safely refresh share hash after commit
    const timer = setTimeout(() => {
      isInternalSyncRef.current = false;
      if (typeof window !== "undefined" && window.hashBooted && window.writeShareHash) {
        try {
          window.writeShareHash();
        } catch (e) {}
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      isInternalSyncRef.current = false;
    };
  }, [build]);

  return (
    <div className="character-builder-root w-full max-w-[1280px] mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* Top Mode Bar */}
      <div
        className="mode-bar p-3.5 flex flex-wrap items-center justify-between gap-3"
        style={{
          border: "4px solid transparent",
          borderImage: "var(--mw-bevel) 4 repeat",
          background: "#181510"
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className={`mw-btn px-4 py-2 font-serif text-sm font-bold tracking-wide transition-colors ${
              activeTab === "builder" ? "active" : ""
            }`}
            onClick={() => setActiveTab("builder")}
          >
            Custom Class Builder
          </button>
          <button
            type="button"
            className={`mw-btn px-4 py-2 font-serif text-sm font-bold tracking-wide transition-colors ${
              activeTab === "premade" ? "active" : ""
            }`}
            onClick={() => setActiveTab("premade")}
          >
            Premade Builds Catalog
          </button>
          <button
            type="button"
            className="mw-btn px-3 py-2 font-serif text-xs font-bold tracking-wide flex items-center gap-1.5"
            onClick={handleCopyLink}
            title="Copy shareable build permalink"
          >
            <span>{copied ? "✓ Link Copied!" : "🔗 Copy Build Link"}</span>
          </button>
        </div>

        {/* View Toggle (Visible on screens < 1024px) */}
        {activeTab === "builder" && (
          <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto p-1 bg-[#120f0a] border border-[#2a2318] mt-1 sm:mt-0">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-serif font-bold transition-all mw-btn ${
                mobileTab === "config" ? "active" : ""
              }`}
              onClick={() => setMobileTab("config")}
            >
              Configurator
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm font-serif font-bold transition-all mw-btn ${
                mobileTab === "sheet" ? "active" : ""
              }`}
              onClick={() => setMobileTab("sheet")}
            >
              Character Sheet
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === "premade" ? (
        <PremadeBrowser
          onSelectBuild={handleSelectPremade}
          activeProfile={shell.profile}
        />
      ) : (
        <>
          {/* Quick Vitals HUD (shown on screens < 1024px when on configurator tab) */}
          {sheet && (
            <div className="character-vitals-hud block lg:hidden bg-[#100d08] p-3 border border-[#2a2318] space-y-2 mw-groove-panel">
              <div className="flex items-center justify-between text-xs font-mono text-[#d4b06a] mb-1 pb-1 border-b border-[#221c13]">
                <span className="font-serif font-bold text-sm">Character Vitals</span>
                <button
                  type="button"
                  className="mw-btn px-2.5 py-1 text-xs font-serif font-bold tracking-wide"
                  onClick={() => setMobileTab(mobileTab === "config" ? "sheet" : "config")}
                >
                  {mobileTab === "config" ? "View Full Sheet →" : "← View Config"}
                </button>
              </div>
              <div className="flex flex-col space-y-2">
                <VitalsBar label="Health" kind="health" value={sheet.health} max={sheet.health} />
                <VitalsBar label="Magicka" kind="magicka" value={sheet.magicka} max={sheet.magicka} />
                <VitalsBar label="Fatigue" kind="fatigue" value={sheet.fatigue} max={sheet.fatigue} />
              </div>
            </div>
          )}

          {/* Desktop 2-Pane Dashboard: Side-by-Side on Desktop (>=1024px), Tabbed on screens < 1024px */}
          <div className="cb-dashboard">
            <div className={`cb-pane ${mobileTab !== "config" ? "cb-pane-mobile-hidden" : ""}`}>
              <Configurator
                build={build}
                catalogs={catalogs}
                sheet={sheet}
                onUpdateField={handleUpdateField}
                onSwapSkill={handleSwapSkill}
                onSelectClassPreset={handleSelectClassPreset}
              />
            </div>

            <div className={`cb-pane ${mobileTab !== "sheet" ? "cb-pane-mobile-hidden" : ""}`}>
              <CharacterSheet build={build} sheet={sheet} catalogs={catalogs} />
            </div>
          </div>

          {/* Decoupled Gear Advisor */}
          <GearAdvisor build={{...build, world:shell.world, arce:shell.arce}} />
        </>
      )}
    </div>
  );
}
