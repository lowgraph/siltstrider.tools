const keyOf = value => typeof value === 'string' ? value.trim().toLowerCase() : '';

/** Display filtering only: keep the full catalog and saved memberships intact. */
export function isDisplayFaction(record) {
  return Boolean(keyOf(record?.key)) && !/^\s*<deprecated>\s*$/i.test(record?.name || '');
}

/** Published names win. Unknown mod IDs remain unknown rather than invented names. */
export function factionLabel(id, factions = []) {
  const key = keyOf(id);
  const record = (Array.isArray(factions) ? factions : []).find(f => key && keyOf(f?.key) === key);
  if (record && !isDisplayFaction(record)) return null;
  if (typeof record?.name === 'string' && record.name.trim()) return record.name.trim();
  return key && !/[_:]/.test(key) ? key.replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown faction';
}
