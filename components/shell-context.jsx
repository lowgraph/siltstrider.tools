"use client";
import { createContext, useContext, useSyncExternalStore } from 'react';
import { decodeShareHash, encodeShareHash, normalizeProfile } from '../lib/permalink-codec.mjs';

const initial = Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: 'home' });

// Listen for both legacy silt-shell-change and standard browser hashchange/popstate events
const subscribe = listener => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('silt-shell-change', listener);
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener('silt-shell-change', listener);
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
};

let cachedState = null;
let lastHash = null;

const getSnapshot = () => {
  if (typeof window === 'undefined') return initial;

  // If legacy siltShell has booted and is ready, prioritize its snapshot for compatibility
  const legacySnapshot = window.siltShell?.getSnapshot();
  if (legacySnapshot && legacySnapshot.ready) {
    return legacySnapshot;
  }

  // Otherwise, derive snapshot from current location.hash via permalink-codec
  const currentHash = window.location.hash || '';
  if (cachedState && currentHash === lastHash) {
    return cachedState;
  }

  lastHash = currentHash;
  const decoded = decodeShareHash(currentHash);
  cachedState = Object.freeze({
    ready: true,
    world: decoded.world,
    arce: decoded.arce,
    profile: decoded.profile,
    view: decoded.view
  });
  return cachedState;
};

const getServerSnapshot = () => initial;

const ShellContext = createContext(null);

export function ShellProvider({ children }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navigate = view => {
    if (typeof window === 'undefined') return;
    if (window.siltShell?.navigate) {
      window.siltShell.navigate(view);
      return;
    }
    const nextHash = encodeShareHash({
      view,
      world: state.world,
      arce: state.arce,
      profile: state.profile
    });
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.dispatchEvent(new Event('silt-shell-change'));
  };

  const setProfile = profile => {
    if (typeof window === 'undefined') return;
    if (window.siltShell?.setProfile) {
      Promise.resolve(window.siltShell.setProfile(profile)).catch(() => {});
      return;
    }
    const { world, arce } = normalizeProfile({ profile });
    const nextHash = encodeShareHash({
      view: state.view,
      world,
      arce,
      profile
    });
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    window.dispatchEvent(new Event('silt-shell-change'));
  };

  return (
    <ShellContext.Provider value={{
      ...state,
      navigate,
      setProfile
    }}>
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const shell = useContext(ShellContext);
  return shell || initial;
}
