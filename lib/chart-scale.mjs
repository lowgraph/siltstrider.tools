// Axis helpers for the site's small SVG charts.

/** Round tick values from 0 up to at least `max`, about `count` of them (1, 2, 2.5 or 5 x 10^n apart). */
export function niceTicks(max, count = 4) {
  const top = Number.isFinite(max) && max > 0 ? max : 1;
  const raw = top / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
  const ticks = [];
  for (let v = 0; v < top + step; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

/** Whole-number ticks between `start` and `end` (both included), at most `max` of them, on round steps. */
export function levelTicks(start, end, max = 8) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  if (end === start) return [start];
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find(s => Math.floor((end - start) / s) + 1 <= max) || 100;
  const ticks = [start];
  for (let v = Math.ceil((start + 1) / step) * step; v < end; v += step) {
    if (v - ticks[ticks.length - 1] >= step / 2) ticks.push(v);
  }
  if (end - ticks[ticks.length - 1] < step && ticks.length > 1) ticks.pop();
  ticks.push(end);
  return ticks;
}
