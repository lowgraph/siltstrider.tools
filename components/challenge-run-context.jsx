"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_PRESETS } from "../lib/challenge-math.mjs";
import { createEmptyRun, sanitizeRun } from "../lib/challenge-engine.mjs";
import { decodeShareHash, encodeShareHash } from "../lib/permalink-codec.mjs";

/**
 * The challenge run lives above the views, like the character build, so leaving the
 * Challenge Runs page (to open the rolled character in the Build Optimizer, say) and
 * coming back finds the same run. The run and its locks are also kept in this browser,
 * so a reload does not lose them, and a shared link (#challenge&run=...) opens its run.
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
  return sanitizeRun(decodeShareHash(hash || "").run);
}

// Once a linked run is open, take it out of the address bar: later rolls are not it, and
// a reload should find the latest run, not the link's.
function dropRunFromAddress() {
  try {
    const { view, world, arce, profile } = decodeShareHash(window.location.hash);
    const hash = encodeShareHash({ view, world, arce, profile });
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + hash);
    window.dispatchEvent(new Event("silt-shell-change"));
  } catch {}
}

function useChallengeRunState({ persist }) {
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
      const linked = runFromLink(window.location.hash);
      if (!linked) return false;
      setRun(linked);
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
    // A link pasted into an open tab changes only the hash.
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
  }, [persist]);

  useEffect(() => {
    if (persist && restored.current) writeStoredRun(run, locks);
  }, [persist, run, locks]);

  // The player's own choices become the preferred settings; a seed's do not.
  const updateSettings = useCallback((patch, { preferred: isPreferred = true } = {}) => {
    remember.current = isPreferred;
    setSettings((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  useEffect(() => {
    if (!remember.current) return;
    remember.current = false;
    setPreferred(settings);
    if (persist) {
      try {
        storage()?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch {}
    }
  }, [persist, settings]);

  const restorePreferred = useCallback(() => setSettings(preferred), [preferred]);
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
