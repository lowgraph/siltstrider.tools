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
