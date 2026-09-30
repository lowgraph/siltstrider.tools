import { PLACE_PREFIX, isPlace } from './travel-walk.mjs';
import { formatRegionName, parseGrid } from './travel-map.mjs';

const text = value => typeof value === 'string' ? value.trim() : '';
const normal = value => text(value).toLowerCase();
const roomLabel = name => text(name).split(',').map(part => part.trim()).filter(Boolean).join(' › ');
const rank = option => option.kind === 'stop' || option.kind === 'town' ? 0 : option.kind === 'exterior' ? 1 : 2;
const alphabetic = (a, b) => a.label.localeCompare(b.label) || text(a.detail).localeCompare(text(b.detail)) || a.id.localeCompare(b.id);
const byKind = (a, b) => rank(a) - rank(b) || alphabetic(a, b);

// Same representative as matchPlaces: closest to the group's centre, then first key.
function centralCell(cells) {
  const x = cells.reduce((sum, cell) => sum + cell.grid[0], 0) / cells.length;
  const y = cells.reduce((sum, cell) => sum + cell.grid[1], 0) / cells.length;
  const distance = cell => (cell.grid[0] - x) ** 2 + (cell.grid[1] - y) ** 2;
  return [...cells].sort((a, b) => distance(a) - distance(b) || a.key.localeCompare(b.key))[0];
}

/** Build the profile's candidate list once. Filtering never changes route IDs. */
export function buildTravelSearchOptions({ stops = [], places = [], settlements = [], graph = {}, includePlaces = true } = {}) {
  const stopNames = new Map();
  for (const stop of Array.isArray(stops) ? stops : []) {
    if (text(stop) && !isPlace(stop) && !stopNames.has(normal(stop))) stopNames.set(normal(stop), stop);
  }
  const townNames = new Set(stopNames.keys());
  const townCells = new Set();
  for (const settlement of Array.isArray(settlements) ? settlements : []) {
    if (text(settlement?.name)) townNames.add(normal(settlement.name));
    for (const key of Array.isArray(settlement?.cells) ? settlement.cells : []) {
      if (typeof key === 'string') townCells.add(key);
    }
  }

  // Include incoming services too: a stop with only arrivals is still searchable.
  const services = new Map([...stopNames.keys()].map(key => [key, new Set()]));
  for (const [from, edges] of Object.entries(graph || {})) {
    for (const edge of Array.isArray(edges) ? edges : []) {
      if (!edge || edge.walk || edge.spell || edge.teleport || !text(edge.kind)) continue;
      services.get(normal(from))?.add(edge.kind);
      services.get(normal(edge.to))?.add(edge.kind);
    }
  }
  const options = [...stopNames].map(([key, id]) => ({
    id, label: id, kind: 'stop', badge: [...services.get(key)].sort().join(' · ') || 'transit'
  }));
  if (!includePlaces) return options.sort(byKind);

  const exteriors = new Map();
  const interiors = [];
  const seen = new Set();
  const records = places instanceof Map ? places.values() : Array.isArray(places) ? places : [];
  for (const record of records) {
    if (!text(record?.key) || !text(record?.name) || seen.has(record.key)) continue;
    if (record.interior === true && record.key.startsWith('interior:')) {
      seen.add(record.key);
      interiors.push(record);
    } else if (record.interior === false && parseGrid(record.key)) {
      if (!Array.isArray(record.grid) || record.grid.length !== 2 || !record.grid.every(Number.isFinite)) continue;
      seen.add(record.key);
      const group = `${normal(record.name)}\u0000${normal(record.region)}`;
      if (!exteriors.has(group)) exteriors.set(group, []);
      exteriors.get(group).push(record);
    }
  }
  const sameNameGroups = new Map();
  for (const cells of exteriors.values()) {
    const name = normal(cells[0].name);
    sameNameGroups.set(name, (sameNameGroups.get(name) || 0) + 1);
  }
  for (const cells of exteriors.values()) {
    const record = centralCell(cells);
    const name = normal(record.name);
    // Stop IDs have no region. Do not guess which of two same-named places it is.
    if (stopNames.has(name) && sameNameGroups.get(name) === 1) continue;
    const region = formatRegionName(text(record.region));
    options.push({
      id: PLACE_PREFIX + record.key,
      label: record.name,
      kind: townNames.has(name) || cells.some(cell => townCells.has(cell.key)) ? 'town' : 'exterior',
      badge: 'walk',
      detail: `${region ? region + ' · ' : ''}Map ${record.grid[0]}, ${record.grid[1]}`,
      record
    });
  }
  const roomNames = new Map();
  for (const record of interiors) {
    const name = normal(roomLabel(record.name));
    roomNames.set(name, (roomNames.get(name) || 0) + 1);
  }
  for (const record of interiors) {
    // Interior names already carry this hierarchy; use it without guessing geography.
    const label = roomLabel(record.name);
    const region = formatRegionName(text(record.region));
    // A distinct room key can share a display name in a modded catalog. Show the
    // location name stored in that key without exposing the routing prefix.
    const detail = roomNames.get(normal(label)) > 1
      ? `${region ? region + ' · ' : ''}${roomLabel(record.key.slice('interior:'.length))}`
      : undefined;
    options.push({
      id: PLACE_PREFIX + record.key,
      label,
      kind: 'interior', badge: 'inside', detail, record
    });
  }
  return options.sort(byKind);
}

/** One ranking and one count across all result types, before a bounded display limit. */
export function searchTravelOptions(options, query, { limit = 40 } = {}) {
  const q = normal(query);
  const words = q.split(/\s+/).filter(Boolean);
  const relevance = option => normal(option.label) === q ? 0 : normal(option.label).startsWith(q) ? 1 : 2;
  const matches = (Array.isArray(options) ? options : [])
    .filter(option => text(option?.id) && text(option?.label))
    .filter(option => {
      const haystack = normal(`${option.label} ${option.record?.name || ''} ${option.detail || ''}`);
      return words.every(word => haystack.includes(word));
    })
    .sort((a, b) => rank(a) - rank(b) || relevance(a) - relevance(b) || alphabetic(a, b));
  const cap = Number.isFinite(limit) ? Math.max(0, Math.min(100, Math.floor(limit))) : 40;
  return { options: matches.slice(0, cap), total: matches.length };
}
