// Save headers have no profile field. Resolve only names that agree across the
// published profiles; never substitute the currently selected builder profile.
const PROFILES = ['vanilla', 'tr', 'tr_arce'];
const pending = new WeakMap();

function label(value, tables, kind) {
  if (typeof value !== 'string' || !value.trim()) return value;
  const key = value.trim().toLowerCase();
  const matches = new Set();
  for (const table of tables) for (const row of table[kind] || []) {
    if ([row.key, row.id, row.name].some(v => typeof v === 'string' && v.toLowerCase() === key)
      && typeof row.name === 'string' && row.name.trim()) matches.add(row.name);
  }
  return matches.size === 1 ? [...matches][0] : value;
}

export function vaultIdentityLabels(save, tables) {
  return {
    race: label(save.race, tables, 'Races'),
    birthsign: label(save.birthsign, tables, 'Birthsigns'),
  };
}

export async function loadVaultIdentityLabels(loader, save) {
  if (!pending.has(loader)) {
    const request = Promise.all(PROFILES.map(async profile => {
      const [Races, Birthsigns] = await Promise.all([
        loader.loadCatalog(profile, 'Races'), loader.loadCatalog(profile, 'Birthsigns'),
      ]);
      return {Races, Birthsigns};
    })).catch(error => { pending.delete(loader); throw error; });
    pending.set(loader, request);
  }
  return vaultIdentityLabels(save, await pending.get(loader));
}
