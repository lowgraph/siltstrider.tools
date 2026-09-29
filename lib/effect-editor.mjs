export function effectNumber(value, minimum = 1) {
 const number = Number(value);
 return Number.isFinite(number) ? Math.max(minimum, Math.min(500, Math.trunc(number))) : minimum;
}
// An effect's base cost for a label. The game stores it as a 32-bit float, so 0.2 arrives
// as 0.20000000298023224; six significant digits give back the number the game shows.
export function baseCostLabel(value) {
  const n = value === null || value === "" ? NaN : Number(value);
  return Number.isFinite(n) ? String(Number(n.toPrecision(6))) : "?";
}
export function allowedRanges(effect) {
 return ['self','touch','target'].filter(range=>effect?.['cast'+range[0].toUpperCase()+range.slice(1)] === true);
}
export function selectedEffect(effects,key) {
 return effects.find(effect=>effect.key===key) || null;
}
export function effectDraft(row,effect,catalogs={},constant=false) {
 const ranges=allowedRanges(effect);
 row = {...row, min:effectNumber(row.min), max:effectNumber(row.max), dur:effectNumber(row.dur), area:effectNumber(row.area,0)};
 const range=constant?'self':ranges.includes(row.range)?row.range:ranges[0] || 'self';
 const targets=effect?.targetsAttribute?catalogs.Attributes:effect?.targetsSkill?catalogs.Skills:[];
 const ids=(targets||[]).map(target=>target.id);
 return {...row,range,min:effect?.mag?row.min:1,max:effect?.mag?Math.max(row.min,row.max):1,
   dur:effect?.dur&&!constant?row.dur:1,area:range==='self'||constant?0:row.area,
   target:ids.includes(row.target)?row.target:ids[0] || ''};
}
