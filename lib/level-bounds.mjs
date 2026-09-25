export function boundedLevel(target, start, cap) {
 const low = Number.isFinite(start) ? start : 1;
 const high = Math.max(low, Number.isFinite(cap) ? cap : low);
 return Math.max(low, Math.min(high, Number.isFinite(target) ? Math.trunc(target) : low));
}
