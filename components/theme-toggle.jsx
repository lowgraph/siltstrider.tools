"use client";
import { useId } from "react";
import { useTheme } from "./theme-provider";
import { THEME_SHORTCUT, otherTheme } from "../lib/theme.mjs";

// The Moon-and-Star: a crescent cradling a star, the Nerevarine's sign.
function MoonAndStar() {
  const mask = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-toggle-glyph">
      <defs>
        <mask id={mask}>
          <rect width="24" height="24" fill="white" />
          <circle cx="15.2" cy="10.2" r="6.6" fill="black" />
        </mask>
      </defs>
      <circle cx="11.5" cy="12.5" r="8.5" fill="currentColor" mask={`url(#${mask})`} />
      <path d="M16.2 6.4l.95 2.35 2.35.95-2.35.95-.95 2.35-.95-2.35-2.35-.95 2.35-.95z" fill="currentColor" />
    </svg>
  );
}

// Red Mountain contours around an ember: Ashfall's mark.
function EmberMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-toggle-glyph">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.2 2.2" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Header switch between Ashfall and the classic Morrowind UI. Both faces are
 * rendered and CSS shows the one for the other theme, so the button is right
 * on first paint whatever the stored theme is.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, themes, toggleTheme } = useTheme();
  const next = otherTheme(theme);
  const label = `Switch to ${themes[next].name} (current theme: ${themes[theme].name}). Shortcut: ${THEME_SHORTCUT}`;
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      aria-keyshortcuts={THEME_SHORTCUT}
      data-next-theme={next}
    >
      <span className="theme-toggle-face theme-toggle-face--to-morrowind" aria-hidden="true">
        <MoonAndStar />
        <span className="theme-toggle-text">Morrowind UI</span>
      </span>
      <span className="theme-toggle-face theme-toggle-face--to-ashfall" aria-hidden="true">
        <EmberMark />
        <span className="theme-toggle-text">Modern UI</span>
      </span>
      <span className="theme-toggle-tip" aria-hidden="true">
        <span className="theme-toggle-tip-title theme-toggle-face--to-morrowind">Switch to Morrowind UI</span>
        <span className="theme-toggle-tip-title theme-toggle-face--to-ashfall">Switch to Modern UI</span>
        <span className="theme-toggle-tip-key">Toggle theme <kbd>{THEME_SHORTCUT}</kbd></span>
      </span>
    </button>
  );
}
