/** Keep transport platforms and landing points separate, even in the same town/cell. */
import { adaptTravelGraph, stopNameFor, INTERVENTION_KINDS } from './travel-graph.mjs';

const pointOf = p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])
  ? p.slice(0, 2).map(Math.round) : null;
const cellOf = key => typeof key === 'string' && /^(interior:.+|exterior:-?\d+,-?\d+)$/.test(key);
const modes = { silt_strider: 'Silt Strider', boat: 'Boat', guild_guide: 'Guild Guide',
  gondola: 'Gondolier', pack_guar: 'Pack Guar', sky_lamp: 'Sky Lamp', carriage: 'Carriage',
  riverstrider: 'River Strider', t_mw_riverstriderservice: 'River Strider' };

export function transitStopId(cell, position, unknown = 'unknown') {
  if (!cellOf(cell)) return null;
  if (cell.startsWith('interior:')) return 'stop:' + cell;
  const p = pointOf(position);
  return `stop:${cell}@${p ? p.join(',') : unknown}`;
}

/** Town names remain labels/legacy endpoints, never intermediate zero-time connections. */
export function buildTransitStops(records = [], nodes = {}, { providers = {}, access = null, intervention = null, places = [],
  teleports = [], mageGuild = true, conjurer = false } = {}) {
  const stops = new Map(), virtualNodes = {}, mapped = [];
  let unplaced = 0;
  const placeNames = new Map((Array.isArray(places) ? places : [])
    .filter(p => cellOf(p?.key) && typeof p.name === 'string' && p.name.trim())
    .map(p => [p.key, p.name.trim()]));
  const exits = new Map((Array.isArray(access?.records) ? access.records : []).filter(r => r?.key)
    .map(r => [r.key, (Array.isArray(r.exits) ? r.exits : []).map(pointOf).filter(Boolean)]));
  const add = (cell, pos, mode, provider, departure = false) => {
    // An unknown arrival must never share a placeholder with a departure.
    // Only a known provider's departures can share a missing-position identity.
    const id = transitStopId(cell, pos, departure && provider ? `departure:${provider}` : `unplaced:${unplaced++}`);
    if (!id) return null;
    const node = nodes?.[cell];
    const interior = cell.startsWith('interior:');
    const roomName = placeNames.get(cell) || cell.replace(/^interior:/, '');
    // Teleport-only interiors can be absent from Travel metadata. Their published
    // "Town, room" name supplies a boundary alias, never a new connecting edge.
    const town = node ? stopNameFor(node, cell)
      : interior && roomName.includes(',') ? roomName.split(',')[0].trim() || null : null;
    const name = node?.name || placeNames.get(cell) || (interior ? roomName : town || roomName);
    if (!stops.has(id)) stops.set(id, { id, cell, town, interior, name,
      points: interior ? exits.get(cell) || [] : [pointOf(pos)].filter(Boolean),
      services: new Set(), departures: new Set(), providers: new Set() });
    const stop = stops.get(id);
    if (mode) stop.services.add(mode);
    if (departure && mode) stop.departures.add(mode);
    if (departure && providers?.[provider]?.name) stop.providers.add(providers[provider].name);
    virtualNodes[id] = { name: id, town: id, district: node?.district };
    return id;
  };
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || !cellOf(record.from) || !cellOf(record.to)) continue;
    const mode = modes[record.mode] || 'Other Transport';
    const from = add(record.from, record.fromPos, mode, record.provider, true);
    const to = add(record.to, record.toPos, mode, null);
    mapped.push({ ...record, from, to });
  }
  const markerIds = new Map();
  const teleportIds = new Set();
  for (const teleport of Array.isArray(teleports) ? teleports : []) {
    const to = add(teleport?.to, teleport?.toPos, 'Teleport', null);
    if (to) teleportIds.add(to);
    for (const [i, cell] of (Array.isArray(teleport?.from) ? teleport.from : []).entries()) {
      const from = add(cell, teleport.fromPos?.[i], 'Teleport', null, true);
      if (from) teleportIds.add(from);
    }
  }
  for (const [kind, markers] of Object.entries(intervention?.markers || {})) {
    for (const [index, marker] of (Array.isArray(markers) ? markers : []).entries()) {
      if (!cellOf(marker?.cell)) continue;
      const id = add(marker.cell, marker.pos, INTERVENTION_KINDS[kind], null);
      const stop = stops.get(id);
      if (!nodes?.[marker.cell]) { stop.name = marker.name || stop.name; stop.town = marker.town || null; }
      markerIds.set(`${kind}:${index}`, id);
    }
  }
  for (const stop of stops.values()) {
    const services = [...stop.services].sort().join(' / ');
    stop.label = stop.interior ? stop.name.replace(/,\s*/g, ' › ')
      : `${stop.name} · ${services || 'landing'}${stop.departures.size ? '' : ' arrival'}`;
    if (stop.providers.size) stop.label += ` (${[...stop.providers].sort().join(' / ')})`;
  }
  const graph = adaptTravelGraph(mapped, virtualNodes, { providers, mageGuild, conjurer });
  for (const id of markerIds.values()) graph[id] ||= [];
  for (const id of teleportIds) graph[id] ||= [];
  const points = new Map([...stops].map(([id, stop]) => [id, stop.points]));
  // Only indoor cells can be represented without a position. Outdoor platforms sharing
  // one cell must never be joined through that cell's name or centre.
  const cellNodes = Object.fromEntries([...stops.values()].filter(s => s.interior).map(s => [s.cell, { name: s.id, town: s.id }]));
  const cities = new Map();
  for (const stop of stops.values()) {
    if (!stop.town || !graph[stop.id]) continue;
    if (!cities.has(stop.town)) cities.set(stop.town, []);
    cities.get(stop.town).push(stop.id);
  }
  return { graph, stops, points, cellNodes, markerIds, cities };
}

export function addTransitInterventions(network, intervention, enabled = {}) {
  const out = Object.fromEntries(Object.entries(network.graph).map(([id, edges]) => [id, [...edges]]));
  const records = new Map((Array.isArray(intervention?.records) ? intervention.records : []).filter(r => r?.key).map(r => [r.key, r]));
  for (const [id, stop] of network.stops) {
    for (const kind of Object.keys(INTERVENTION_KINDS)) {
      if (!enabled[kind]) continue;
      const record = records.get(stop.cell), index = record?.[kind];
      const to = Number.isInteger(index) ? network.markerIds.get(`${kind}:${index}`) : null;
      if (!to || to === id) continue;
      out[id] ||= [];
      out[id].push({ to, kind: INTERVENTION_KINDS[kind], spell: kind, free: true, price: 0, hours: 0,
        ambiguous: Boolean(record.ambiguous?.[kind]?.length) || undefined });
    }
  }
  return out;
}

/** City choices/old town links stay merged; a specific place keeps its exact stop. */
export function resolveTransitEndpoint(id, network) {
  if (network.graph[id]) return id;
  const city = [...network.cities.keys()].find(name => name.toLowerCase() === String(id).toLowerCase());
  if (city) return city;
  const cell = typeof id === 'string' && id.startsWith('place:interior:') ? id.slice(6) : null;
  return cell ? [...network.stops.values()].find(s => network.graph[s.id] && s.cell === cell)?.id || id : id;
}

/** Expand only the route's boundaries. Cities never exist as nodes in the graph. */
export function transitEndpointStops(id, network) {
  return network.cities.get(id) || [...network.cities].find(([name]) =>
    typeof id === 'string' && name.toLowerCase() === id.toLowerCase())?.[1] || id;
}
