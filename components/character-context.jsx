"use client";
import { distinctFavored } from "../lib/favored-attributes.mjs";
import { CANONICAL_RACES, canonicalRaceFor, getRandomPremadeBuild, premadeToBuild, sameCharacter } from "../lib/premade-data.mjs";
import { validateSave } from "../lib/omwsave-import.mjs";
import {saveMemberships} from "../lib/faction-memberships.mjs";
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { computeSheet, swapSkill as mathSwapSkill } from "../lib/character-math.mjs";
import { readStoredProfile, readVisitorProfile, useShell } from "./shell-context";
import { getGameDataLoader } from "./use-game-data";
import { createCharacterCatalogService } from "../lib/character-catalogs.mjs";
import { createDefaultLoadoutPresets } from "../lib/equipment-math.mjs";
import { decodeShareUrl } from "../lib/permalink-codec.mjs";
import { sanitizeBuild } from "../lib/character-vault.mjs";
import { rememberSave, recallSave, forgetSave } from "../lib/active-save-store.mjs";
import { hasClerkSession } from "../lib/clerk-browser.mjs";
import { SIGN_IN_EVENT, keepCharacterForSignIn, takeCharacterAfterSignIn } from "../lib/sign-in-handoff.mjs";
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

export function CharacterProvider({ children, initialBuild = null }) {
  let shell = null;
  try {
    shell = useShell();
  } catch (e) {
    shell = { world: "vanilla", arce: false, profile: "vanilla" };
  }
  if (!shell) {
    shell = { world: "vanilla", arce: false, profile: "vanilla" };
  }
  // The server and the browser's first render must agree, or React throws the
  // prerendered page away: both start from the fixed default, and the random premade
  // is picked just after, below.
  const [build, setBuildState] = useState(() => distinctFavored(initialBuild || DEFAULT_BUILD));
  const setBuild = useCallback((next) => setBuildState(previous => distinctFavored(typeof next === 'function' ? next(previous) : next, previous)), []);
  const [catalogs, setCatalogs] = useState(null);

  // A fresh visit starts from a random premade. This is the first effect, so a shared
  // link, a character kept through sign-in or a loaded save, all set later, still win.
  const randomPick = useRef(null);
  useEffect(() => {
    if (initialBuild) return;
    // While the page hydrates the shell still shows the server's world, so the draw reads
    // the visitor's own: with TR + ARCE the ARCE builds are in the pool.
    const { world, arce } = shell.ready === false ? readVisitorProfile() : shell;
    const pick = getRandomPremadeBuild({ world: world || "vanilla", arce: Boolean(arce) });
    if (!pick) return;
    randomPick.current = pick;
    setBuild(pick);
    // Mount only: later world changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const service = useMemo(() => createCharacterCatalogService(getGameDataLoader()), []);

  // Load the selected profile.
  useEffect(() => {
    let current = true;
    if (typeof window === "undefined") return;

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

    return () => { current = false; };
  }, [shell.profile, service]);

  // Keep build in sync with world/arce profile changes -- once the shell knows the
  // visitor's world: the prerender's vanilla would undo a start drawn for TR + ARCE.
  useEffect(() => {
    if (shell.ready === false) return;
    setBuild((prev) => {
      const nextWorld = shell.world || "vanilla";
      const nextArce = !!shell.arce;
      if (prev.world === nextWorld && prev.arce === nextArce) return prev;
      if (!nextArce && !CANONICAL_RACES.includes(prev.race)) {
        // Leaving ARCE with an ARCE-only race: an untouched random premade is swapped for
        // another; a character the player made keeps everything but the race.
        if (sameCharacter(prev, randomPick.current)) {
          const pick = getRandomPremadeBuild({ world: nextWorld, arce: false });
          if (pick) {
            randomPick.current = pick;
            return pick;
          }
        }
        return { ...prev, world: nextWorld, arce: nextArce, race: canonicalRaceFor(prev.race) };
      }
      return { ...prev, world: nextWorld, arce: nextArce };
    });
  }, [shell.ready, shell.world, shell.arce]);

  // Still the random start: nothing chosen, linked, loaded or edited yet (BLD-3).
  const isStarter = sameCharacter(build, randomPick.current);

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
      const next = premadeToBuild(premade, {
        world: shell.world || "vanilla",
        arce: Boolean(shell.arce)
      });
      if (next) setBuild(next);
    },
    [shell.world, shell.arce, setBuild]
  );

  const rollRandomBuild = useCallback(() => {
    const next = getRandomPremadeBuild({
      world: shell.world || "vanilla",
      arce: Boolean(shell.arce)
    });
    if (next) setBuild(next);
    return next;
  }, [shell.world, shell.arce, setBuild]);

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
  }, [shell, service]);

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
    if (sanitizeBuild(decodeShareUrl(raw).build)) return;
    recallSave()
      .then((kept) => (kept ? loadSave(kept, { restored: true }) : null))
      .catch((err) => {
        console.warn("Could not restore the saved character:", err);
        forgetSave();
      });
  }, [loadSave]);

  // A shared build link (/builder?build=...) opens its character, on load or when pasted
  // into an open tab, then leaves the address bar with a clean path so later edits are not confused with it.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const openLink = () => {
      const raw = window.location.href || (window.location.pathname + window.location.search);
      const decoded = decodeShareUrl(raw);
      const linked = sanitizeBuild(decoded.build);
      if (!linked) return;
      setActiveSave(null);
      forgetSave();
      // The link's world wins over the one this browser kept; a link that names none keeps it.
      // Compared with what is kept, not with the shell: while the page hydrates the shell
      // still shows the prerender's vanilla, so a vanilla link never switched a TR visitor.
      const query = new URL(raw, window.location.origin).searchParams;
      const namesWorld = query.has("world") || query.has("arce");
      setBuild((prev) => ({ ...DEFAULT_BUILD, world: namesWorld ? decoded.world : prev.world, arce: namesWorld ? decoded.arce : prev.arce, ...linked }));
      if (namesWorld && typeof shell?.setProfile === "function" && readStoredProfile().profile !== decoded.profile) {
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
    window.addEventListener("popstate", openLink);
    return () => window.removeEventListener("popstate", openLink);
  }, [shell, service]);

  // Signing in with Google or Discord leaves the page and comes back (sign-in-handoff.mjs).
  // The sign-in buttons announce it; a plain character is kept for that round trip and
  // put back on the return. A loaded save needs nothing: it already survives a reload,
  // and it is what the Vault saves. A shared build link opened with the page still wins.
  const activeSaveRef = useRef(activeSave);
  activeSaveRef.current = activeSave;
  // The address as the page opened: a shared link is cleaned from the address bar by
  // the time effects run, so it is read during the first render.
  const openedAt = useRef(typeof window === "undefined" ? "" : window.location.href || "");
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const kept = takeCharacterAfterSignIn({ signedIn: hasClerkSession(window.document) });
    if (kept && !sanitizeBuild(decodeShareUrl(openedAt.current).build)) {
      setBuild((prev) => ({ ...kept, world: prev.world, arce: prev.arce }));
    }
    const keep = () => { if (!activeSaveRef.current) keepCharacterForSignIn(buildRef.current); };
    window.addEventListener(SIGN_IN_EVENT, keep);
    return () => window.removeEventListener(SIGN_IN_EVENT, keep);
  }, [setBuild]);

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
      rollRandomBuild,
      isStarter,
      activeSave,
      loadSave,
      clearSave
    }),
    [build, sheet, catalogs, updateField, swapSkill, selectClassPreset, selectPremade,
     rollRandomBuild, isStarter, activeSave, loadSave, clearSave]
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
      rollRandomBuild: () => null,
      isStarter: false,
      activeSave: null,
      loadSave: async () => null,
      clearSave: () => {}
    };
  }
  return ctx;
}
