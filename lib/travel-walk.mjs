/**
 * Walking: the legs that join a place to the travel network and nearby stops to each
 * other. A walk is a straight line between two points, refused when it would swim open
 * sea by the Access catalog's land mask, and timed by the character's run speed as
 * OpenMW 0.51.0 computes it. Real routes around hills and water take longer.
 */
import { stopNameFor } from "./travel-graph.mjs";

export const CELL = 8192;
const BLOCK = 1024;
const STEP = 256;

/** Walks longer than this between two stops are not offered: take the transport. */
export const STOP_WALK_LIMIT = 3 * CELL;
/** How far the first or last leg may walk to reach the network. */
export const PLACE_WALK_LIMIT = 10 * CELL;
/** The longest stretch of water a walk may cross: a river, a canal, a strait swum. */
export const MAX_WATER = 2048;

const maskCache = new Map();
function maskWords(hex) {
  let words = maskCache.get(hex);
  if (!words) {
    words = [parseInt(hex.slice(8), 16) >>> 0, parseInt(hex.slice(0, 8), 16) >>> 0];
    maskCache.set(hex, words);
  }
  return words;
}

/** True when world point (x, y) is on land by the mask; a cell with no mask is sea. */
export function onLand(land, x, y) {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  const hex = land?.[`exterior:${cx},${cy}`];
  if (typeof hex !== "string" || hex.length !== 16) return false;
  const bx = Math.min(7, Math.floor((x - cx * CELL) / BLOCK));
  const by = Math.min(7, Math.floor((y - cy * CELL) / BLOCK));
  const bit = by * 8 + bx;
  const [lo, hi] = maskWords(hex);
  return (bit < 32 ? (lo >>> bit) : (hi >>> (bit - 32))) & 1 ? true : false;
}

/** The longest unbroken stretch of water on the straight line from a to b, in units. */
export function longestWater(land, a, b) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(1, Math.ceil(length / STEP));
  let run = 0, longest = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (onLand(land, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) run = 0;
    else { run += length / steps; if (run > longest) longest = run; }
  }
  return longest;
}

const setting = (settings, name, fallback) => {
  const value = Number(settings?.[name]);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * Run speed in units per second: Npc::getWalkSpeed times the run multiplier from
 * Npc::getRunSpeed, OpenMW 0.51.0, carrying nothing.
 */
export function runSpeed(player = {}, settings = {}) {
  const speed = Math.max(0, Number(player.speed) || 0);
  const athletics = Math.max(0, Number(player.athletics) || 0);
  const min = setting(settings, "fMinWalkSpeed", 100), max = setting(settings, "fMaxWalkSpeed", 200);
  const walk = min + 0.01 * speed * (max - min);
  return walk * (0.01 * athletics * setting(settings, "fAthleticsRunBonus", 1) + setting(settings, "fBaseRunMultiplier", 1.75));
}

/** In-game hours to cover `distance` units at `speed`; game time runs `timescale` times faster. */
export function walkHours(distance, speed, timescale = 30) {
  if (!(speed > 0)) return null;
  return (distance / speed) * timescale / 3600;
}

const DIRECTIONS = ["east", "north-east", "north", "north-west", "west", "south-west", "south", "south-east"];
/** The compass direction from a to b, north up. */
export function bearing(a, b) {
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return DIRECTIONS[((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8];
}

/** "2 h 14 min", "9 min", "no time". */
export function formatDuration(hours) {
  if (!Number.isFinite(hours)) return "";
  const minutes = Math.round(hours * 60);
  if (minutes <= 0) return "no time";
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

const markerStop = marker => (typeof marker?.town === "string" && marker.town.trim()) ? marker.town.trim()
  : (typeof marker?.name === "string" && marker.name.trim() ? marker.name.split(",")[0].trim() : null);

/**
 * Every point on the map where each stop can be reached on foot: where its providers
 * stand outdoors, where journeys put you down outdoors, where its indoor stops (guild
 * halls) let you out, and where interventions land.
 */
export function stopPoints({ records = [], nodes = {}, access = null, intervention = null } = {}) {
  const exits = new Map((access?.records || []).map(r => [r.key, r.exits || []]));
  const points = new Map();
  const add = (stop, point) => {
    if (!stop || !Array.isArray(point) || !point.every(Number.isFinite)) return;
    if (!points.has(stop)) points.set(stop, []);
    const list = points.get(stop);
    if (!list.some(p => Math.abs(p[0] - point[0]) < 256 && Math.abs(p[1] - point[1]) < 256)) list.push(point);
  };
  for (const record of records) {
    const from = stopNameFor(nodes[record.from], record.from), to = stopNameFor(nodes[record.to], record.to);
    if (String(record.from).startsWith("exterior:")) add(from, record.fromPos);
    if (String(record.to).startsWith("exterior:")) add(to, record.toPos);
  }
  for (const [cellKey, node] of Object.entries(nodes || {})) {
    const stop = stopNameFor(node, cellKey);
    for (const exit of exits.get(cellKey) || []) add(stop, exit);
  }
  for (const markers of Object.values(intervention?.markers || {})) {
    for (const marker of markers || []) {
      if (String(marker.cell).startsWith("exterior:")) add(markerStop(marker), marker.pos);
    }
  }
  return points;
}

/** The nearest pair of points between two sets, with its distance. */
function closestPair(as, bs) {
  let best = null;
  for (const a of as) for (const b of bs) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!best || d < best.distance) best = { a, b, distance: d };
  }
  return best;
}

function walkEdge(to, pair, speed, timescale) {
  return {
    to, kind: "Walk", walk: true, free: true, price: 0,
    hours: walkHours(pair.distance, speed, timescale),
    distance: Math.round(pair.distance), direction: bearing(pair.a, pair.b)
  };
}

/**
 * Walking legs between stops within `limit` units whose straight line never crosses
 * more than MAX_WATER of sea. Returns a new graph.
 */
export function addStopWalks(graph = {}, points = new Map(), land = null, speed = 0, { limit = STOP_WALK_LIMIT, timescale = 30 } = {}) {
  const out = Object.fromEntries(Object.entries(graph || {}).map(([stop, edges]) => [stop, [...edges]]));
  if (!land || !(speed > 0)) return out;
  const stops = [...points.keys()].filter(stop => out[stop]).sort();
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const pair = closestPair(points.get(stops[i]), points.get(stops[j]));
      if (!pair || pair.distance > limit || longestWater(land, pair.a, pair.b) > MAX_WATER) continue;
      out[stops[i]].push(walkEdge(stops[j], pair, speed, timescale));
      out[stops[j]].push(walkEdge(stops[i], { a: pair.b, b: pair.a, distance: pair.distance }, speed, timescale));
    }
  }
  return out;
}

export const PLACE_PREFIX = "place:";
export const isPlace = id => typeof id === "string" && id.startsWith(PLACE_PREFIX);

/** Where a place is walked from or to: a grid square's middle, or an interior's exits. */
export function placePoints(cellKey, access = null) {
  const grid = /^exterior:(-?\d+),(-?\d+)$/.exec(cellKey || "");
  if (grid) return [[Number(grid[1]) * CELL + CELL / 2, Number(grid[2]) * CELL + CELL / 2]];
  const record = (access?.records || []).find(r => r.key === cellKey);
  return record?.exits || [];
}

/** The rooms from `cellKey` out to the one whose door opens outdoors. */
export function doorChain(cellKey, access = null) {
  const byKey = new Map((access?.records || []).map(r => [r.key, r]));
  const chain = [];
  let key = cellKey;
  while (key && byKey.has(key) && !chain.includes(key)) {
    chain.push(key);
    key = byKey.get(key).via;
  }
  return chain;
}

/**
 * Add a place (any cell) as a node the router can start or end at: walks to and from
 * every stop within `limit` that stays out of the sea, a direct walk to the other
 * place, and, cast from the place, the interventions the character has.
 */
export function addPlaces(graph = {}, placeKeys = [], { points = new Map(), access = null, land = null, speed = 0,
  intervention = null, spells = {}, limit = PLACE_WALK_LIMIT, timescale = 30 } = {}) {
  const out = Object.fromEntries(Object.entries(graph || {}).map(([stop, edges]) => [stop, [...edges]]));
  const byIntervention = new Map((intervention?.records || []).map(r => [r.key, r]));
  const placed = [];
  for (const cellKey of [...new Set(placeKeys.filter(Boolean))]) {
    const id = PLACE_PREFIX + cellKey;
    out[id] = out[id] || [];
    const here = placePoints(cellKey, access);
    placed.push([id, here]);
    if (land && speed > 0 && here.length) {
      for (const [stop, there] of points) {
        if (!out[stop]) continue;
        const pair = closestPair(here, there);
        if (!pair || pair.distance > limit || longestWater(land, pair.a, pair.b) > MAX_WATER) continue;
        out[id].push(walkEdge(stop, pair, speed, timescale));
        out[stop].push(walkEdge(id, { a: pair.b, b: pair.a, distance: pair.distance }, speed, timescale));
      }
    }
    const record = byIntervention.get(cellKey);
    for (const kind of ["divine", "almsivi"]) {
      if (!spells?.[kind] || !Number.isInteger(record?.[kind])) continue;
      const marker = intervention.markers?.[kind]?.[record[kind]];
      const to = markerStop(marker);
      if (!to) continue;
      if (!out[to]) out[to] = [];
      out[id].push({ to, kind: kind === "divine" ? "Divine Intervention" : "Almsivi Intervention", spell: kind,
        free: true, price: 0, hours: 0, ambiguous: Boolean(record.ambiguous?.[kind]?.length) || undefined });
    }
  }
  if (land && speed > 0 && placed.length === 2) {
    const [[a, pa], [b, pb]] = placed;
    const pair = closestPair(pa, pb);
    if (pair && pair.distance <= limit && longestWater(land, pair.a, pair.b) <= MAX_WATER) {
      out[a].push(walkEdge(b, pair, speed, timescale));
      out[b].push(walkEdge(a, { a: pair.b, b: pair.a, distance: pair.distance }, speed, timescale));
    }
  }
  return out;
}
