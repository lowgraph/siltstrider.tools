"use client";
import {distinctFavored} from "../lib/favored-attributes.mjs";
import { validateSave } from "../lib/omwsave-import.mjs";
import {saveMemberships} from "../lib/faction-memberships.mjs";
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { computeSheet, swapSkill as mathSwapSkill } from "../lib/character-math.mjs";
import { useShell } from "./shell-context";
import { getGameDataLoader } from "./use-game-data";
import { createCharacterCatalogService } from "../lib/character-catalogs.mjs";
import { createDefaultLoadoutPresets } from "../lib/equipment-math.mjs";
import { decodeShareHash, encodeShareHash } from "../lib/permalink-codec.mjs";
import { sanitizeBuild } from "../lib/character-vault.mjs";
import { rememberSave, recallSave, forgetSave } from "../lib/active-save-store.mjs";
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
  const [build, setBuildState] = useState(() => distinctFavored(DEFAULT_BUILD));
  const setBuild = useCallback((next) => setBuildState(previous => distinctFavored(typeof next === 'function' ? next(previous) : next, previous)), []);
  const [catalogs, setCatalogs] = useState(null);

  // Catalog service subscription
  useEffect(() => {
    let current = true;
    if (typeof window === "undefined") return;

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
          console.warn("Could not load bundle catalogs:", err);
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

  // A loaded .omwsave: the build it resolves to, plus what the other tools read from
  // it -- the Level Simulator's starting sheet, the worn loadout, journal progress --
  // and everything that could not be resolved against the save's own profile.
  const [activeSave, setActiveSave] = useState(null);
  const buildRef = useRef(build);
  buildRef.current = build;

  // `restored`: brought back from this browser on a page load, so it is already kept,
  // and the world the visitor has chosen since stays as it is.
  const loadSave = useCallback(async (save, { restored = false } = {}) => {
    validateSave(save);
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
      restored,
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
    const nextBuild = { ...next, factionMemberships:saveMemberships(save.progress), loadouts: [loadout, ...createDefaultLoadoutPresets().slice(1)] };
    setActiveSave(loaded);
    setBuild(nextBuild);
    if (!restored) {
      rememberSave(save).then((kept) => { if (!kept) console.warn("The save could not be kept in this browser; it lasts until the page reloads."); });
      if (shell.profile !== profile && typeof shell.setProfile === "function") shell.setProfile(profile);
    }
    return loaded;
  }, [shell]);

  const clearSave = useCallback(() => {
    setActiveSave(null);
    forgetSave();
  }, []);

  // A save loaded before this page load comes back, until it is cleared. A shared
  // build link opened with the page wins: it replaces the character, save and all.
  const restoring = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || restoring.current) return;
    restoring.current = true;
    const raw = window.location.href || "";
    if (sanitizeBuild(decodeShareHash(raw).build)) return;
    recallSave()
      .then((kept) => (kept ? loadSave(kept, { restored: true }) : null))
      .catch((err) => {
        console.warn("Could not restore the saved character:", err);
        forgetSave();
      });
  }, [loadSave]);

  // A shared build link (#builder&build=... or ?build=...) opens its character, on load or when pasted
  // into an open tab, then leaves the address bar with a clean path so later edits are not confused with it.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const openLink = () => {
      const raw = window.location.href || ((window.location.search || '') + (window.location.hash || ''));
      const decoded = decodeShareHash(raw);
      const linked = sanitizeBuild(decoded.build);
      if (!linked) return;
      setActiveSave(null);
      forgetSave();
      setBuild((prev) => ({ ...DEFAULT_BUILD, world: decoded.world || prev.world, arce: decoded.arce ?? prev.arce, ...linked }));
      if (decoded.profile && typeof shell?.setProfile === "function" && shell.profile !== decoded.profile) {
        shell.setProfile(decoded.profile);
      }
      try {
        const { view } = decoded;
        const cleanPath = view === "home" ? "/" : "/" + view;
        window.history.replaceState({ ...(window.history.state || {}), view }, "", cleanPath);
        window.dispatchEvent(new Event("silt-shell-change"));
      } catch {}
    };
    openLink();
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
  }, [shell]);

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
      activeSave,
      loadSave,
      clearSave
    }),
    [build, sheet, catalogs, updateField, swapSkill, selectClassPreset, selectPremade,
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
      activeSave: null,
      loadSave: async () => null,
      clearSave: () => {}
    };
  }
  return ctx;
}
