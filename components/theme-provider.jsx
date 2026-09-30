"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useAccountSettings } from './account-settings-context';
import {
  DEFAULT_THEME, THEMES, getTheme, isThemeShortcut, otherTheme, setTheme as applyTheme, subscribeTheme
} from "../lib/theme.mjs";

const ThemeContext = createContext(null);

// The server (and hydration) always sees the default; the real value follows
// right after, already painted by the inline script in <head>.
function useThemeStore() {
  const preferences = useAccountSettings();
  const theme = useSyncExternalStore(subscribeTheme, () => getTheme(), () => DEFAULT_THEME);
  const setTheme = useCallback(next => {
    const selected = applyTheme(next, preferences?.owner ? { storage: null } : {});
    preferences?.update(settings => ({ ...settings, theme: selected }));
  }, [preferences]);
  const toggleTheme = useCallback(() => setTheme(otherTheme(getTheme())), [setTheme]);
  return useMemo(() => ({ theme, themes: THEMES, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
}

/** Theme state for the app, plus the global J shortcut that toggles it. */
export function ThemeProvider({ children }) {
  const preferences = useAccountSettings();
  useEffect(() => {
    if (preferences?.ready) applyTheme(preferences.settings.theme, { animate: false, ...(preferences.owner ? { storage: null } : {}) });
  }, [preferences?.ready, preferences?.owner, preferences?.settings.theme]);
  const value = useThemeStore();
  const { toggleTheme } = value;
  useEffect(() => {
    const onKey = event => {
      if (!isThemeShortcut(event)) return;
      event.preventDefault();
      toggleTheme();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** { theme, themes, setTheme, toggleTheme }. Works without a provider too. */
export function useTheme() {
  const own = useThemeStore();
  return useContext(ThemeContext) || own;
}
