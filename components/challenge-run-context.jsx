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
    restored.current = true;
    // A link pasted into an open tab changes only the hash.
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
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
