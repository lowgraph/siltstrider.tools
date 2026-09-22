/**
 * Site themes. Ashfall (modern) is the default; Morrowind is the classic look.
 * The theme lives on <html data-theme="..."> and in localStorage. An inline
 * script in <head> (THEME_INIT_SCRIPT) applies the stored choice before the
 * first paint, so a returning Morrowind user never sees Ashfall flash.
 */
export const THEMES = Object.freeze({
  ashfall: Object.freeze({ id: "ashfall", name: "Modern UI" }),
  morrowind: Object.freeze({ id: "morrowind", name: "Morrowind UI" })
});
export const DEFAULT_THEME = "ashfall";
export const THEME_STORAGE_KEY = "silt-theme";
export const THEME_SHORTCUT = "J";

/** Anything but a known theme id reads as the default. */
export const normalizeTheme = value => (Object.prototype.hasOwnProperty.call(THEMES, value) ? value : DEFAULT_THEME);
export const otherTheme = theme => (normalizeTheme(theme) === "ashfall" ? "morrowind" : "ashfall");

// Kept tiny and dependency-free: it runs synchronously while the HTML is parsed.
export const THEME_INIT_SCRIPT =
  `(function(){var t=${JSON.stringify(DEFAULT_THEME)};try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
  `if(s===${JSON.stringify("morrowind")}||s===${JSON.stringify("ashfall")})t=s}catch(e){}` +
  `document.documentElement.setAttribute("data-theme",t)})()`;

// window.localStorage can throw (sandboxed frames, blocked site data).
function defaultStorage() {
  try {
    return globalThis.window?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readStoredTheme(storage = defaultStorage()) {
  try {
    return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

// ---- Store: the <html> attribute is the truth, except mid-switch ----------

const listeners = new Set();
const emit = () => listeners.forEach(fn => fn());

// A cross-fade updates the page a frame later (or never, in a hidden tab), so
// the store keeps the theme it was asked for until the page catches up.
let pending = null;
let generation = 0;
const TRANSITION_FALLBACK_MS = 400;

export function getTheme(doc = globalThis.document) {
  return pending ?? normalizeTheme(doc?.documentElement?.getAttribute("data-theme"));
}

export function subscribeTheme(fn) {
  listeners.add(fn);
  // Another tab switched themes: follow it.
  const onStorage = event => {
    if (event.key !== THEME_STORAGE_KEY || typeof document === "undefined") return;
    generation += 1;
    pending = null;
    document.documentElement.setAttribute("data-theme", normalizeTheme(event.newValue));
    emit();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/**
 * Applies and remembers a theme. Cross-fades with the View Transitions API
 * where the browser has it, the tab is visible and the user has not asked for
 * reduced motion; otherwise switches at once.
 */
export function setTheme(next, { doc = globalThis.document, storage = defaultStorage(), win = globalThis.window, animate = true } = {}) {
  const theme = normalizeTheme(next);
  if (!doc?.documentElement) return theme;
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  if (getTheme(doc) === theme) return theme;

  const token = ++generation;
  pending = theme;
  // Only the latest request may touch the page: a late callback from an
  // earlier switch must not undo a newer one.
  const apply = () => {
    if (token !== generation) return;
    pending = null;
    doc.documentElement.setAttribute("data-theme", theme);
    emit();
  };
  emit();

  const reduce = Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const visible = !doc.visibilityState || doc.visibilityState === "visible";
  if (animate && !reduce && visible && typeof doc.startViewTransition === "function") {
    try {
      doc.startViewTransition(apply);
      // If the browser never runs the callback (tab hidden mid-switch), switch anyway.
      (win?.setTimeout || globalThis.setTimeout)(apply, TRANSITION_FALLBACK_MS);
      return theme;
    } catch {}
  }
  apply();
  return theme;
}

export const toggleTheme = (options = {}) => setTheme(otherTheme(getTheme(options.doc)), options);

// ---- Keyboard shortcut ------------------------------------------------------

export function isEditableTarget(target) {
  if (!target || typeof target !== "object") return false;
  if (target.isContentEditable) return true;
  const tag = String(target.tagName || "").toUpperCase();
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = String(target.type || "text").toLowerCase();
    return !["button", "checkbox", "radio", "range", "color", "submit", "reset", "file", "image"].includes(type);
  }
  return Boolean(target.closest?.('[contenteditable=""], [contenteditable="true"], [role="textbox"]'));
}

/** J with no modifiers, not held down, and not while typing. */
export function isThemeShortcut(event) {
  if (!event || event.defaultPrevented || event.repeat) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (String(event.key).toLowerCase() !== THEME_SHORTCUT.toLowerCase()) return false;
  return !isEditableTarget(event.target);
}
