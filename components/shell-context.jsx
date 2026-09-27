"use client";
import { createContext, useContext, useSyncExternalStore, useCallback, useEffect } from 'react';
import { decodeShareHash, normalizeProfile, normalizeView, KNOWN_VIEWS } from '../lib/permalink-codec.mjs';

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
let lastCacheKey = null;

function resolvePathView(pathname, initialView) {
  if (pathname === '/') return 'home';
  if (!pathname) return normalizeView(initialView) || 'home';
  const segment = pathname.replace(/^\/+|\/+$/g, '').split('/')[0].toLowerCase();
  const normalized = normalizeView(segment);
  if (normalized === 'home' && segment !== 'home') {
    return normalizeView(initialView) || 'home';
  }
  return normalized;
}

function getStoredProfile() {
  let defaultWorld = 'vanilla';
  let defaultArce = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (window.localStorage.getItem('mw-world') === 'tr') defaultWorld = 'tr';
      if (window.localStorage.getItem('mw-arce') === '1') defaultArce = true;
    }
  } catch {}
  return normalizeProfile({ world: defaultWorld, arce: defaultArce });
}

function readCurrentState(initialView) {
  if (typeof window === 'undefined') {
    return Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView });
  }

  const pathname = window.location.pathname || '/';
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const historyView = window.history?.state?.view;

  // Stored preferences
  const stored = getStoredProfile();

  // Determine base view from history.state or pathname or initialView
  let baseView = initialView || 'home';
  if (historyView && KNOWN_VIEWS.includes(historyView)) {
    baseView = historyView;
  } else {
    baseView = resolvePathView(pathname, initialView);
  }

  // If a hash exists (e.g. legacy #builder, #alchemy, #TR, #builder&build=...), decode from it
  let decoded = null;
  if (hash && hash !== '#') {
    decoded = decodeShareHash(hash, {
      defaultView: baseView,
      defaultWorld: stored.world,
      defaultArce: stored.arce
    });
  } else if (search) {
    decoded = decodeShareHash(search, {
      defaultView: baseView,
      defaultWorld: stored.world,
      defaultArce: stored.arce
    });
  } else {
    decoded = {
      view: baseView,
      world: stored.world,
      arce: stored.arce,
      profile: stored.profile
    };
  }

  return Object.freeze({
    ready: true,
    world: decoded.world,
    arce: decoded.arce,
    profile: decoded.profile,
    view: decoded.view
  });
}

const ShellContext = createContext(null);

export function ShellProvider({ children, initialView = 'home' }) {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView });
    }

    const pathname = window.location.pathname || '/';
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const historyView = window.history?.state?.view || '';
    let storedWorld = 'vanilla';
    let storedArce = '0';
    try {
      storedWorld = window.localStorage.getItem('mw-world') || 'vanilla';
      storedArce = window.localStorage.getItem('mw-arce') || '0';
    } catch {}

    const cacheKey = `${pathname}|${hash}|${search}|${historyView}|${storedWorld}|${storedArce}|${initialView}`;
    if (cachedState && cacheKey === lastCacheKey) {
      return cachedState;
    }

    lastCacheKey = cacheKey;
    cachedState = readCurrentState(initialView);
    return cachedState;
  }, [initialView]);

  const getServerSnapshot = useCallback(() => {
    return Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView });
  }, [initialView]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Auto-migrate legacy hash fragments (#builder, #alchemy, #TR, etc.) to clean HTML5 paths
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const migrateLegacyHash = () => {
      const rawHash = window.location.hash;
      if (!rawHash || rawHash === '#') return;

      const hasPayload = /(?:^|[?&#])(run|build)=/i.test(rawHash);
      if (hasPayload) {
        // Child context (CharacterProvider or ChallengeRunProvider) consumes and strips the payload
        return;
      }

      // Plain legacy hash without payload
      const decoded = decodeShareHash(rawHash, { defaultView: state.view });
      if (/(?:^|[&#?/_])(tr|tamriel|arce)\b/i.test(rawHash) || /world=|arce=/i.test(rawHash)) {
        try {
          window.localStorage.setItem('mw-world', decoded.world);
          window.localStorage.setItem('mw-arce', decoded.arce ? '1' : '0');
        } catch {}
      }

      const cleanPath = decoded.view === 'home' ? '/' : '/' + decoded.view;
      window.history.replaceState({ view: decoded.view }, '', cleanPath + (window.location.search || ''));
      window.dispatchEvent(new Event('silt-shell-change'));
    };

    migrateLegacyHash();
    window.addEventListener('hashchange', migrateLegacyHash);
    return () => window.removeEventListener('hashchange', migrateLegacyHash);
  }, [state.view]);

  const navigate = useCallback(view => {
    if (typeof window === 'undefined') return;
    const targetPath = view === 'home' ? '/' : '/' + view;
    const currentPath = window.location.pathname || '/';
    const currentHash = window.location.hash || '';

    if (currentPath !== targetPath || currentHash) {
      window.history.pushState({ view }, '', targetPath);
    }
    window.dispatchEvent(new Event('silt-shell-change'));
  }, []);

  const setProfile = useCallback(profile => {
    if (typeof window === 'undefined') return;
    const { world, arce } = normalizeProfile({ profile });
    try {
      window.localStorage.setItem('mw-world', world);
      window.localStorage.setItem('mw-arce', arce ? '1' : '0');
    } catch {}

    if (window.location.hash) {
      const cleanPath = state.view === 'home' ? '/' : '/' + state.view;
      window.history.replaceState({ view: state.view }, '', cleanPath + (window.location.search || ''));
    }
    window.dispatchEvent(new Event('silt-shell-change'));
  }, [state.view]);

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
