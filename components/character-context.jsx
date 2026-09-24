"use client";
import {saveMemberships} from "../lib/faction-memberships.mjs";
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { computeSheet, swapSkill as mathSwapSkill } from "../lib/character-math.mjs";
import { useShell } from "./shell-context";
import { getGameDataLoader } from "./use-game-data";
import { createCharacterCatalogService } from "../lib/character-catalogs.mjs";
import { createDefaultLoadoutPresets } from "../lib/equipment-math.mjs";
import { decodeShareHash, encodeShareHash } from "../lib/permalink-codec.mjs";
import { sanitizeBuild } from "../lib/character-vault.mjs";
import {
  buildFromSave,
  loadoutFromSave,
  profileForSave,
  rulesCheck,
  sheetFromSave
} from "../lib/omwsave-import.mjs";

export const DEFAULT_BUILD = {
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
  min: ["Restoration", "Medium Armor", "Spear", "Mercantile", "Speechcraft"],
  bitterCup: false
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
  const bitterCupEl = document.getElementById("c-bittercup");

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
    min,
    bitterCup: bitterCupEl ? bitterCupEl.checked : false
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

export function syncStatsToCalculators(sheet, { force = false } = {}) {
  if (typeof document === "undefined" || !sheet) return;

  const setCalcField = (id, val) => {
    const el = document.getElementById(id);
    if (!el || val === undefined) return;
    if (force || !el.dataset.userEdited) {
      el.value = String(val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  // Track user edits so we never overwrite manual progression testing unless forced
  const trackEdit = (id) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.boundTrack) {
      el.dataset.boundTrack = "1";
      el.addEventListener("input", () => {
        el.dataset.userEdited = "1";
      });
    }
  };

  const calcIds = [
    "enc-skill", "enc-int", "enc-luck", "enc-merc", "enc-pers",
    "spl-alt", "spl-con", "spl-des", "spl-ill", "spl-mys", "spl-res", "spl-wil", "spl-luck", "spl-merc", "spl-pers",
    "alc-skill", "alc-int", "alc-luck"
  ];
  calcIds.forEach(trackEdit);

  // Enchanting
  setCalcField("enc-skill", sheet.skills?.["Enchant"]?.v);
  setCalcField("enc-int", sheet.attributes?.["Intelligence"]?.v);
  setCalcField("enc-luck", sheet.attributes?.["Luck"]?.v);
  setCalcField("enc-merc", sheet.skills?.["Mercantile"]?.v);
  setCalcField("enc-pers", sheet.attributes?.["Personality"]?.v);

  // Spellmaking
  setCalcField("spl-alt", sheet.skills?.["Alteration"]?.v);
  setCalcField("spl-con", sheet.skills?.["Conjuration"]?.v);
  setCalcField("spl-des", sheet.skills?.["Destruction"]?.v);
  setCalcField("spl-ill", sheet.skills?.["Illusion"]?.v);
  setCalcField("spl-mys", sheet.skills?.["Mysticism"]?.v);
  setCalcField("spl-res", sheet.skills?.["Restoration"]?.v);
  setCalcField("spl-wil", sheet.attributes?.["Willpower"]?.v);
  setCalcField("spl-luck", sheet.attributes?.["Luck"]?.v);
  setCalcField("spl-merc", sheet.skills?.["Mercantile"]?.v);
  setCalcField("spl-pers", sheet.attributes?.["Personality"]?.v);

  // Alchemy
  setCalcField("alc-skill", sheet.skills?.["Alchemy"]?.v);
  setCalcField("alc-int", sheet.attributes?.["Intelligence"]?.v);
  setCalcField("alc-luck", sheet.attributes?.["Luck"]?.v);
}

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  let shell = null;
  try {
    shell = useShell();
  } catch (e) {
    shell = { world: "vanilla", arce: false, profile: "vanilla" };
  }
  if (!shell) {
    shell = { world: "vanilla", arce: false, profile: "vanilla" };
  }
  const [build, setBuild] = useState(() => {
    const fromDom = typeof window !== "undefined" ? readBuildFromDom(shell) : null;
    return fromDom || DEFAULT_BUILD;
  });
  const [catalogs, setCatalogs] = useState(() => getFallbackCatalogs());
  const isInternalSyncRef = useRef(false);

  // Catalog service subscription
  useEffect(() => {
    let current = true;
    if (typeof window === "undefined") return;

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

  // Two-way synchronization: detect external DOM updates ("Send to Build Optimizer", hash permalinks, local storage restore)
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
          prev.className !== domBuild.className ||
          prev.sign !== domBuild.sign ||
          prev.spec !== domBuild.spec ||
          prev.fav1 !== domBuild.fav1 ||
          prev.fav2 !== domBuild.fav2 ||
          Boolean(prev.bitterCup) !== Boolean(domBuild.bitterCup) ||
          JSON.stringify(prev.maj) !== JSON.stringify(domBuild.maj) ||
          JSON.stringify(prev.min) !== JSON.stringify(domBuild.min);
        return isDiff ? domBuild : prev;
      });
    };

    const target = document.getElementById("panel-build") || document.body;
    const observer = new MutationObserver(syncFromDom);
    if (target) {
      observer.observe(target, { attributes: true, subtree: true, attributeFilter: ["value", "selected", "checked"] });
    }

    const onStorageOrHash = () => syncFromDom();
    window.addEventListener("hashchange", onStorageOrHash);
    window.addEventListener("storage", onStorageOrHash);
    window.addEventListener("silt-shell-change", onStorageOrHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onStorageOrHash);
      window.removeEventListener("storage", onStorageOrHash);
      window.removeEventListener("silt-shell-change", onStorageOrHash);
    };
  }, [shell]);

  // Keep build in sync with world/arce profile changes
  useEffect(() => {
    setBuild((prev) => {
      const nextWorld = shell.world || "vanilla";
      const nextArce = !!shell.arce;
      if (prev.world === nextWorld && prev.arce === nextArce) return prev;
      return { ...prev, world: nextWorld, arce: nextArce };
    });
  }, [shell.world, shell.arce]);

  // Compute live character sheet
  const sheet = useMemo(() => {
    if (!catalogs) return null;
    return computeSheet(build, catalogs);
  }, [build, catalogs]);

  // Pure state mutators
  const updateField = useCallback((field, value) => {
    setBuild((prev) => ({ ...prev, [field]: value }));
  }, []);

  const swapSkill = useCallback((isMajor, index, newSkill) => {
    setBuild((prev) => {
      const { maj, min } = mathSwapSkill(prev.maj, prev.min, isMajor, index, newSkill);
      return { ...prev, maj, min };
    });
  }, []);

  const selectClassPreset = useCallback((className, preset) => {
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

  const selectPremade = useCallback(
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
    },
    [shell.world, shell.arce]
  );

  // Sync React state to legacy DOM controls in background
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

    const bcEl = document.getElementById("c-bittercup");
    if (bcEl && bcEl.checked !== Boolean(build.bitterCup)) {
      bcEl.checked = Boolean(build.bitterCup);
    }

    if (typeof window !== "undefined" && typeof window.syncSkillPrev === "function") {
      try {
        window.syncSkillPrev();
      } catch (e) {}
    }

    const timer = setTimeout(() => {
      isInternalSyncRef.current = false;
    }, 100);
    return () => {
      clearTimeout(timer);
      isInternalSyncRef.current = false;
    };
  }, [build]);

  // Seed baseline stats to calculators once sheet is ready without forcing over user edits
  useEffect(() => {
    if (sheet) {
      syncStatsToCalculators(sheet, { force: false });
    }
  }, [sheet]);

  const forceSyncToCalculators = useCallback(() => {
    if (sheet) {
      syncStatsToCalculators(sheet, { force: true });
    }
  }, [sheet]);

  // A loaded .omwsave: the build it resolves to, plus what the other tools read from
  // it -- the Level Simulator's starting sheet, the worn loadout, journal progress --
  // and everything that could not be resolved against the save's own profile.
  const [activeSave, setActiveSave] = useState(null);
  const buildRef = useRef(build);
  buildRef.current = build;

  const loadSave = useCallback(async (save) => {
    const { profile, reason, contentFileCount } = profileForSave(save);
    const loader = getGameDataLoader();
    const service = (window.siltCharacters ||= createCharacterCatalogService(loader));
    // Resolved against the save's profile, not whichever one the site is showing.
    const [character, equipment] = await Promise.all([
      service.prepare(profile),
      loader.loadFeature(profile, "equipment")
    ]);
    const { build: next, unresolved } = buildFromSave(save, character, { current: buildRef.current, profile });
    const { loadout, unresolved: unworn } = loadoutFromSave(save, equipment.catalogs);
    const loaded = {
      token: Date.now(),
      save,
      profile,
      reason,
      contentFileCount,
      className: save.identity?.class?.name || save.identity?.class?.id || null,
      unresolved,
      unworn,
      rules: rulesCheck(save, character, next),
      sheet: sheetFromSave(save, character, next)
    };
    setActiveSave(loaded);
    setBuild({ ...next, factionMemberships:saveMemberships(save.progress), loadouts: [loadout, ...createDefaultLoadoutPresets().slice(1)] });
    if (shell.profile !== profile && typeof shell.setProfile === "function") shell.setProfile(profile);
    return loaded;
  }, [shell]);

  const clearSave = useCallback(() => setActiveSave(null), []);

  // A shared build link (#builder&build=...) opens its character, on load or when pasted
  // into an open tab, then leaves the address bar so later edits are not confused with it.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const openLink = () => {
      const decoded = decodeShareHash(window.location.hash);
      const linked = sanitizeBuild(decoded.build);
      if (!linked) return;
      setActiveSave(null);
      setBuild((prev) => ({ ...DEFAULT_BUILD, world: prev.world, arce: prev.arce, ...linked }));
      try {
        const { view, world, arce, profile } = decoded;
        window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + encodeShareHash({ view, world, arce, profile }));
        window.dispatchEvent(new Event("silt-shell-change"));
      } catch {}
    };
    openLink();
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
  }, []);

  const value = useMemo(
    () => ({
      build,
      setBuild,
      loadBuild: setBuild,
      sheet,
      catalogs,
      updateField,
      swapSkill,
      selectClassPreset,
      selectPremade,
      syncToCalculators: forceSyncToCalculators,
      activeSave,
      loadSave,
      clearSave
    }),
    [build, sheet, catalogs, updateField, swapSkill, selectClassPreset, selectPremade, forceSyncToCalculators,
     activeSave, loadSave, clearSave]
  );

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

export function useActiveCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    return {
      build: DEFAULT_BUILD,
      setBuild: () => {},
      loadBuild: () => {},
      sheet: null,
      catalogs: null,
      updateField: () => {},
      swapSkill: () => {},
      selectClassPreset: () => {},
      selectPremade: () => {},
      syncToCalculators: () => {},
      activeSave: null,
      loadSave: async () => null,
      clearSave: () => {}
    };
  }
  return ctx;
}
