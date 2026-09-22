"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_PRESETS } from "../lib/challenge-math.mjs";
import { createEmptyRun } from "../lib/challenge-engine.mjs";

/**
 * The challenge run lives above the views, like the character build, so leaving the
 * Challenge Runs page (to open the rolled character in the Build Optimizer, say) and
 * coming back finds the same run. The run and its locks are also kept in this browser,
 * so a reload does not lose them.
 */

export const RUN_STORAGE_KEY = "silt-challenge-run";

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

function writeStoredRun(run, locks, store = storage()) {
  try {
    store?.setItem(RUN_STORAGE_KEY, JSON.stringify({ run, locks }));
  } catch {}
}

function useChallengeRunState({ persist }) {
  const [run, setRun] = useState(createEmptyRun);
  const [locks, setLocks] = useState(() => ({ ...EMPTY_LOCKS }));
  const [settings, setSettings] = useState(defaultSettings);
  const restored = useRef(!persist);

  // Read after mount: the server render has no storage, and hydration must match it.
  useEffect(() => {
    if (!persist) return;
    const saved = readStoredRun();
    if (saved) {
      setRun((current) => (current.race || current.major ? current : saved.run));
      setLocks(saved.locks);
    }
    restored.current = true;
  }, [persist]);

  useEffect(() => {
    if (persist && restored.current) writeStoredRun(run, locks);
  }, [persist, run, locks]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  return useMemo(
    () => ({ run, setRun, locks, setLocks, settings, updateSettings }),
    [run, locks, settings, updateSettings]
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
