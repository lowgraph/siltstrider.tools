/**
 * A skill or attribute typed into a calculator (CALC-2): a whole number from 0 to STAT_MAX.
 * Fortified values can pass 100, so the ceiling is the inputs' own max. Scientific notation
 * reads as the number it is ("1e3" is 1000), decimals are dropped, and an empty field,
 * text or a negative number reads as 0.
 */
export const STAT_MAX = 1000;

export function statNumber(value) {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return 0;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.min(STAT_MAX, Math.max(0, n)) : 0;
}

// The numbers a player typed, per calculator, for as long as the page is open: kept per
// window, so a server render has none (hydration is unaffected) and every page starts empty.
// Every tool follows the character sheet for the rest, and a world switch (which rebuilds
// Alchemy) keeps them; only "Reset to character sheet" lets them go.
const stores = new WeakMap();

function store() {
  const win = typeof window === 'undefined' ? null : window;
  if (!win) return null;
  if (!stores.has(win)) stores.set(win, new Map());
  return stores.get(win);
}

export function typedStats(tool) {
  return store()?.get(tool) || {};
}

export function typeStat(tool, field, value) {
  store()?.set(tool, { ...typedStats(tool), [field]: value });
  return value;
}

export function forgetTypedStats(tool) {
  store()?.delete(tool);
}
