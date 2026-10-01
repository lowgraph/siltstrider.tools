"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_PRESETS } from "../lib/challenge-math.mjs";
import { createEmptyRun, sanitizeRun, profileForRun } from "../lib/challenge-engine.mjs";
import { decodeShareUrl } from "../lib/permalink-codec.mjs";
import { useAccountSettings } from './account-settings-context';
import { useShell, readVisitorProfile } from './shell-context';
import { resolveAccountToolDefaults, updateAccountToolSettings } from '../lib/account-settings.mjs';

/**
 * The challenge run lives above the views, like the character build, so leaving the
 * Challenge Runs page (to open the rolled character in the Character Builder, say) and
 * coming back finds the same run. The run and its locks are also kept in this browser,
 * so a reload does not lose them, and a shared link (/challenge?run=...) opens its run.
 *
 * The roll settings the player picks (preset, difficulty bands, counts) are their
 * preferred run and are remembered too. Settings a loaded seed brings are used for that
 * run without replacing the preferred ones.
 */

export const RUN_STORAGE_KEY = "silt-challenge-run";
export const SETTINGS_STORAGE_KEY = "silt-challenge-settings";
const COUNTS = ["random", "1", "2", "3", "4", "5"];

const EMPTY_LOCKS = Object.freeze({ race: false, cls: false, sign: false, major: false, rest: false, obj: false });

export function defaultSettings() {
  const p = DIFFICULTY_PRESETS.standard;
  return {
    preset: p.id,
    restrictionCount: String(p.restrictionsCount),
    objectiveCount: String(p.objectivesCount),
    allowedBands: { ...p.bands }
  };
}

function storage() {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The stored run and locks, or null when there is none or it is unreadable. */
export function readStoredRun(store = storage()) {
  try {
    const saved = JSON.parse(store?.getItem(RUN_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object" || !saved.run || typeof saved.run !== "object") return null;
    return {
      run: { ...createEmptyRun(), ...saved.run },
      locks: { ...EMPTY_LOCKS, ...(saved.locks || {}) }
    };
  } catch {
    return null;
  }
}

/** The remembered preferred settings, or null when there are none or they are unreadable. */
export function readStoredSettings(store = storage()) {
  try {
    const saved = JSON.parse(store?.getItem(SETTINGS_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return null;
    const fallback = defaultSettings();
    return {
      preset: Object.hasOwn(DIFFICULTY_PRESETS, saved.preset) ? saved.preset : "custom",
      restrictionCount: COUNTS.includes(String(saved.restrictionCount)) ? String(saved.restrictionCount) : fallback.restrictionCount,
      objectiveCount: COUNTS.includes(String(saved.objectiveCount)) ? String(saved.objectiveCount) : fallback.objectiveCount,
      allowedBands: Object.fromEntries(Object.keys(fallback.allowedBands).map((b) => [b, Boolean(saved.allowedBands?.[b])]))
    };
  } catch {
    return null;
  }
}

const sameSettings = (a, b) => Boolean(a && b) && a.preset === b.preset && a.restrictionCount === b.restrictionCount &&
  a.objectiveCount === b.objectiveCount && Object.keys(a.allowedBands).every((k) => Boolean(a.allowedBands[k]) === Boolean(b.allowedBands?.[k]));

function writeStoredRun(run, locks, store = storage()) {
  try {
    store?.setItem(RUN_STORAGE_KEY, JSON.stringify({ run, locks }));
  } catch {}
}

/** The run a shared link carries, or null. */
export function runFromLink(hash) {
  return sanitizeRun(decodeShareUrl(hash || "").run);
}

// Once a linked run is open, take it out of the address bar: later rolls are not it, and
// a reload should find the latest run, not the link's.
function dropRunFromAddress() {
  try {
    const raw = window.location.href || (window.location.pathname + window.location.search);
    const { view, world, arce } = decodeShareUrl(raw);
    // The link's world wins over the one kept in this browser; a link that names none
    // (it would decode as vanilla) leaves the kept one alone.
    const query = new URL(raw, window.location.origin).searchParams;
    if (query.has('world') || query.has('arce')) {
      try {
        window.localStorage.setItem('mw-world', world);
        window.localStorage.setItem('mw-arce', arce ? '1' : '0');
      } catch {}
    }
    const cleanPath = view === "home" ? "/" : "/" + view;
    window.history.replaceState({ ...(window.history.state || {}), view }, "", cleanPath);
    window.dispatchEvent(new Event("silt-shell-change"));
  } catch {}
}

function useChallengeRunState({ persist }) {
  const preferences = useAccountSettings();
  const { profile } = useShell();
  const currentChoice = useRef(false);
  const sharedChoice = useRef(false);
  const choiceOwner = useRef(undefined);
  const [run, setRun] = useState(createEmptyRun);
  const [locks, setLocks] = useState(() => ({ ...EMPTY_LOCKS }));
  const [settings, setSettings] = useState(defaultSettings);
  const [preferred, setPreferred] = useState(defaultSettings);
  const remember = useRef(false);
  const restored = useRef(!persist);

  // Read after mount: the server render has no storage, and hydration must match it.
  useEffect(() => {
    if (!persist) return undefined;
    const openLink = () => {
      const raw = window.location.href || (window.location.pathname + window.location.search);
      const linked = runFromLink(raw);
      if (!linked) return false;
      currentChoice.current = true;
      sharedChoice.current = true;
      const query = new URL(raw, window.location.origin).searchParams;
      const fallback = query.has('world') || query.has('arce') ? decodeShareUrl(raw) : readVisitorProfile();
      setRun({ ...linked, profile: profileForRun(linked, fallback).profile });
      setLocks({ ...EMPTY_LOCKS });
      dropRunFromAddress();
      return true;
    };
    if (!openLink()) {
      const saved = readStoredRun();
      if (saved) {
        setRun((current) => (current.race || current.major ? current : saved.run));
        setLocks(saved.locks);
      }
    }
    const savedSettings = readStoredSettings();
    if (savedSettings) {
      setSettings(savedSettings);
      setPreferred(savedSettings);
    }
    restored.current = true;
    // Browser history may restore a shared link.
    window.addEventListener("popstate", openLink);
    return () => window.removeEventListener("popstate", openLink);
  }, [persist]);

  useEffect(() => {
    if (persist && restored.current) writeStoredRun(run, locks);
  }, [persist, run, locks]);

  // The player's own choices become the preferred settings; a seed's do not.
  const updateSettings = useCallback((patch, { preferred: isPreferred = true } = {}) => {
    currentChoice.current = true;
    sharedChoice.current = !isPreferred;
    remember.current = isPreferred;
    setSettings((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  useEffect(() => {
    if (!remember.current) return;
    remember.current = false;
    setPreferred(settings);
    if (persist && preferences) preferences.update(document => updateAccountToolSettings(document, 'challenge', settings, { world: profile }));
    if (persist && !preferences?.owner) {
      try {
        storage()?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch {}
    }
  }, [persist, settings, preferences?.owner, preferences?.update, profile]);

  useEffect(() => {
    if (!persist || !preferences?.ready) return;
    const key = `${preferences.owner || 'guest'}:${profile}`;
    const previousOwner = choiceOwner.current;
    if (previousOwner !== undefined && previousOwner !== key && !sharedChoice.current) currentChoice.current = false;
    choiceOwner.current = key;
    const defaults = resolveAccountToolDefaults(preferences.settings, { world: profile }).challenge;
    setPreferred(defaults);
    if (!currentChoice.current) setSettings(defaults);
  }, [persist, preferences?.ready, preferences?.owner, preferences?.settings, profile]);

  const restorePreferred = useCallback(() => {
    sharedChoice.current = false;
    currentChoice.current = false;
    setSettings(preferred);
  }, [preferred]);
  const usingPreferred = sameSettings(settings, preferred);

  return useMemo(
    () => ({ run, setRun, locks, setLocks, settings, updateSettings, usingPreferred, restorePreferred }),
    [run, locks, settings, updateSettings, usingPreferred, restorePreferred]
  );
}

const ChallengeRunContext = createContext(null);

export function ChallengeRunProvider({ children }) {
  const value = useChallengeRunState({ persist: true });
  return <ChallengeRunContext.Provider value={value}>{children}</ChallengeRunContext.Provider>;
}

/** The shared challenge run; outside a provider (isolated tests), a local one. */
export function useChallengeRun() {
  const shared = useContext(ChallengeRunContext);
  const local = useChallengeRunState({ persist: false });
  return shared || local;
}
