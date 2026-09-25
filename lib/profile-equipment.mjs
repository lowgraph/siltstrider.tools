export function resolveProfileEquipment(items = {}, catalog = []) {
 const byKey = new Map(catalog.map(item => [item.key, item]));
 const active = {}, unavailable = [];
 for (const [slot,item] of Object.entries(items)) {
  if (!item) continue;
  const resolved = item.isCustom ? item : byKey.get(item.key);
  if (resolved) active[slot] = resolved;
  else unavailable.push({slot, name:item.name || item.key || item.id || slot});
 }
 return {active, unavailable};
}
