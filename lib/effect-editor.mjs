export function allowedRanges(effect) {
 return ['self','touch','target'].filter(range=>effect?.['cast'+range[0].toUpperCase()+range.slice(1)] === true);
}
export function effectDraft(row,effect,catalogs={},constant=false) {
 const ranges=allowedRanges(effect);
 const range=constant?'self':ranges.includes(row.range)?row.range:ranges[0] || 'self';
 const targets=effect?.targetsAttribute?catalogs.Attributes:effect?.targetsSkill?catalogs.Skills:[];
 const ids=(targets||[]).map(target=>target.id);
 return {...row,range,min:effect?.mag?row.min:1,max:effect?.mag?Math.max(row.min,row.max):1,
   dur:effect?.dur&&!constant?row.dur:1,area:range==='self'||constant?0:row.area,
   target:ids.includes(row.target)?row.target:ids[0] || ''};
}
