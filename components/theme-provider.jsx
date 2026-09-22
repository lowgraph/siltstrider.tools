"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME, THEMES, getTheme, isThemeShortcut, otherTheme, setTheme as applyTheme, subscribeTheme
} from "../lib/theme.mjs";

const ThemeContext = createContext(null);

// The server (and hydration) always sees the default; the real value follows
// right after, already painted by the inline script in <head>.
function useThemeStore() {
  const theme = useSyncExternalStore(subscribeTheme, () => getTheme(), () => DEFAULT_THEME);
  const setTheme = useCallback(next => applyTheme(next), []);
  const toggleTheme = useCallback(() => applyTheme(otherTheme(getTheme())), []);
  return useMemo(() => ({ theme, themes: THEMES, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
}

/** Theme state for the app, plus the global J shortcut that toggles it. */
export function ThemeProvider({ children }) {
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
