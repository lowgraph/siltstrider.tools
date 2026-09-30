"use client";
import { createContext, useContext, useSyncExternalStore, useCallback, useMemo, useRef, useState } from 'react';
import { useAccountSettings } from './account-settings-context';
import { decodeShareUrl, normalizeProfile, normalizeView, KNOWN_VIEWS } from '../lib/permalink-codec.mjs';

const initial = Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: 'home' });

// Listen for app history replacements and browser history events
const subscribe = listener => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('silt-shell-change', listener);
  window.addEventListener('popstate', listener);
  return () => {
    window.removeEventListener('silt-shell-change', listener);
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

function readCurrentState(initialView, preferred = null) {
  if (typeof window === 'undefined') {
    return Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView });
  }

  const pathname = window.location.pathname || '/';
  const search = window.location.search || '';
  const historyView = window.history?.state?.view;

  // Stored preferences
  const stored = preferred || getStoredProfile();

  // Determine base view from history.state or pathname or initialView
  let baseView = initialView || 'home';
  if (historyView && KNOWN_VIEWS.includes(historyView)) {
    baseView = historyView;
  } else {
    baseView = resolvePathView(pathname, initialView);
  }

  // Explicit query settings override the stored profile.
  let decoded = null;
  if (search) {
    decoded = decodeShareUrl(pathname + search, {
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

// The world the visitor has chosen, read from the address and this browser. While the
// prerendered page hydrates, the shell still shows the server's (vanilla) and ready is false.
export function readVisitorProfile() {
  const { world, arce, profile } = readCurrentState('home');
  return { world, arce, profile };
}

// The world this browser kept (the address is ignored): what the shell falls back to once
// a shared link's address is cleaned.
export function readStoredProfile() {
  return getStoredProfile();
}

const ShellContext = createContext(null);

export function ShellProvider({ children, initialView = 'home' }) {
  const preferences = useAccountSettings();
  const [choice, setChoice] = useState(null);
  // A build/run consumer may clean its link before the account response arrives.
  const linked = useRef(undefined);
  if (linked.current === undefined && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    linked.current = params.has('world') || params.has('arce') ? readCurrentState(initialView) : null;
  }
  const preferred = choice && choice.owner === preferences?.owner ? normalizeProfile({ profile: choice.profile })
    : linked.current || (preferences?.ready ? normalizeProfile({ profile: preferences.settings.world }) : null);
  // One object per initialView: useSyncExternalStore compares snapshots by identity, so
  // a fresh object on every call reads as a change and React warns of a render loop.
  const serverState = useMemo(
    () => Object.freeze({ ready: false, world: 'vanilla', arce: false, profile: 'vanilla', view: initialView }),
    [initialView]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return serverState;
    }

    const pathname = window.location.pathname || '/';
    const search = window.location.search || '';
    const historyView = window.history?.state?.view || '';
    let storedWorld = 'vanilla';
    let storedArce = '0';
    try {
      storedWorld = window.localStorage.getItem('mw-world') || 'vanilla';
      storedArce = window.localStorage.getItem('mw-arce') || '0';
    } catch {}

    const cacheKey = `${pathname}|${search}|${historyView}|${storedWorld}|${storedArce}|${initialView}|${preferred?.profile || ''}`;
    if (cachedState && cacheKey === lastCacheKey) {
      return cachedState;
    }

    lastCacheKey = cacheKey;
    cachedState = readCurrentState(initialView, preferred);
    return cachedState;
  }, [initialView, serverState, preferred]);

  const getServerSnapshot = useCallback(() => serverState, [serverState]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navigate = useCallback(view => {
    if (typeof window === 'undefined') return;
    const current = readCurrentState(initialView, preferred);
    try { if (!preferences?.owner) {
      window.localStorage.setItem('mw-world', current.world);
      window.localStorage.setItem('mw-arce', current.arce ? '1' : '0');
    } } catch {}
    const targetPath = view === 'home' ? '/' : '/' + view;
    const currentPath = window.location.pathname || '/';
    const currentHash = window.location.hash || '';

    if (currentPath !== targetPath || currentHash) {
      window.history.pushState({ view }, '', targetPath);
    }
    window.dispatchEvent(new Event('silt-shell-change'));
  }, [initialView, preferred, preferences?.owner]);

  const setProfile = useCallback(profile => {
    if (typeof window === 'undefined') return;
    const { world, arce } = normalizeProfile({ profile });
    linked.current = null;
    setChoice({ owner: preferences?.owner, profile });
    preferences?.update(settings => ({ ...settings, world: profile }));
    try { if (!preferences?.owner) {
      window.localStorage.setItem('mw-world', world);
      window.localStorage.setItem('mw-arce', arce ? '1' : '0');
    } } catch {}

    const cleanPath = state.view === 'home' ? '/' : '/' + state.view;
    const params = new URLSearchParams(window.location.search);
    // Explicit URL settings must agree with the user's new selection, including
    // when localStorage is unavailable. Preserve unrelated query parameters.
    params.set('world', world);
    params.set('arce', arce ? '1' : '0');
    window.history.replaceState({ ...window.history.state, view: state.view }, '', cleanPath + '?' + params);
    window.dispatchEvent(new Event('silt-shell-change'));
  }, [state.view, preferences]);

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
