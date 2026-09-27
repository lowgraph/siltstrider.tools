"use client";
import { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { decodeShareHash, encodeShareHash, normalizeProfile } from '../lib/permalink-codec.mjs';

const initial = Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: 'home' });

// Listen for app history replacements and browser hashchange/popstate events
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
let cachedInitialView = null;

const ShellContext = createContext(null);

export function ShellProvider({ children, initialView = 'home' }) {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView });
    }

    const currentHash = window.location.hash || '';
    if (cachedState && currentHash === lastHash && cachedInitialView === initialView) {
      return cachedState;
    }

    lastHash = currentHash;
    cachedInitialView = initialView;
    const decoded = decodeShareHash(currentHash, { defaultView: initialView });
    cachedState = Object.freeze({
      ready: true,
      world: decoded.world,
      arce: decoded.arce,
      profile: decoded.profile,
      view: decoded.view
    });
    return cachedState;
  }, [initialView]);

  const getServerSnapshot = useCallback(() => {
    return Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView });
  }, [initialView]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navigate = view => {
    if (typeof window === 'undefined') return;
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
