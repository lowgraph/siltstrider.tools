/**
 * Walking: the legs that join a place to the travel network and nearby stops to each
 * other. Where the Access catalog carries a walkable grid, a walk is a path over it:
 * around ground too steep for OpenMW to let an actor climb, walls such as the Ghostfence,
 * and, optionally, across open sea. Releases without the grid use the land mask
 * along a straight line. Walking and swimming are timed separately by the
 * character's run and swim speeds as OpenMW 0.51.0 computes them. The grid is terrain
 * only: rocks and buildings are meshes it does not see.
 */
import { stopNameFor } from "./travel-graph.mjs";

export const CELL = 8192;
const BLOCK = 1024;
const STEP = 256;

/** Reach for local platform transfers; selected endpoints can have longer journeys. */
export const STOP_WALK_LIMIT = 3 * CELL;
/** Short-only reach for the first or last leg joining a place to the network. */
export const PLACE_WALK_LIMIT = 10 * CELL;
/** Short-only limit on an unbroken stretch of water along the mask fallback. */
export const MAX_WATER = 2048;
/** Short-only limit on total water crossed over the grid. */
export const MAX_SWIM = 2 * MAX_WATER;

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

// The walkable grid's codes, two bits a square (build_access_catalog.py).
export const SEA = 0, LAND = 1, BLOCKED = 2, SWIM = 3;
/** How far a walk's end may move to reach a square it can stand on: a cave mouth in a cliff. */
const SNAP = 2;
/** Squares a single search may settle before it gives up. */
const MAX_SETTLED = 250000;

function decodeBase64(text) {
  if (typeof atob === "function") {
    const binary = atob(text);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(text, "base64"));
}

/**
 * The Access catalog's walkable grid, ready to search, or null when the release has
 * none or it is malformed. Cells decode the first time a search reaches them.
 */
export function walkGrid(walkable) {
  const per = Number(walkable?.squaresPerCell), size = Number(walkable?.squareSize);
  if (!Number.isInteger(per) || per < 1 || !(size > 0) || Math.abs(per * size - CELL) > 1e-9) return null;
  if (!walkable.cells || typeof walkable.cells !== "object") return null;
  return { per, size, cells: walkable.cells, decoded: new Map(), paths: new Map() };
}

/** The code of square (gx, gy); a cell the grid lacks, or cannot decode, is open sea. */
export function squareAt(grid, gx, gy) {
  const cx = Math.floor(gx / grid.per), cy = Math.floor(gy / grid.per);
  const key = (cx + 32768) * 65536 + (cy + 32768);
  let codes = grid.decoded.get(key);
  if (codes === undefined) {
    codes = null;
    const text = grid.cells[`exterior:${cx},${cy}`];
    if (typeof text === "string") {
      try {
        const packed = decodeBase64(text);
        if (packed.length * 4 >= grid.per * grid.per) {
          codes = new Uint8Array(grid.per * grid.per);
          for (let i = 0; i < codes.length; i++) codes[i] = (packed[i >> 2] >> ((i & 3) * 2)) & 3;
        }
      } catch { codes = null; }
    }
    grid.decoded.set(key, codes);
  }
  if (!codes) return SEA;
  return codes[(gy - cy * grid.per) * grid.per + (gx - cx * grid.per)];
}

// Water Walking makes any water, open sea too, ground to walk on.
const passable = (code, waterWalk = false, longJourneys = false) => code === LAND || code === SWIM || ((waterWalk || longJourneys) && code === SEA);

/** The square a point stands in, or the nearest one within SNAP squares it can stand on. */
function standOn(grid, point, waterWalk = false, longJourneys = false) {
  const gx = Math.floor(point[0] / grid.size), gy = Math.floor(point[1] / grid.size);
  let best = null;
  for (let ring = 0; ring <= SNAP && !best; ring++) {
    for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring || !passable(squareAt(grid, gx + dx, gy + dy), waterWalk, longJourneys)) continue;
      const x = (gx + dx + 0.5) * grid.size, y = (gy + dy + 0.5) * grid.size;
      const off = Math.hypot(x - point[0], y - point[1]);
      if (!best || off < best.off) best = { gx: gx + dx, gy: gy + dy, off, water: [SEA, SWIM].includes(squareAt(grid, gx + dx, gy + dy)) };
    }
  }
  return best;
}

// A binary heap of [cost, key] pairs, cheapest first.
class Heap {
  constructor() { this.items = []; }
  get size() { return this.items.length; }
  push(item) {
    const a = this.items; a.push(item);
    for (let i = a.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.items, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

const OFFSET = 1 << 15;
const keyOf = (gx, gy) => (gx + OFFSET) * 65536 + (gy + OFFSET);
const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * Search the grid from `start`, cheapest first. Moving onto a swum square costs
 * `swimCost` times its length; a diagonal step may not cut the corner of a square that
 * cannot be crossed. Short-only paths swim at most MAX_SWIM. With `longJourneys`,
 * open sea is passable and the swim cap is lifted. With `waterWalk`,
 * water of any depth is walked like land and without limit. With `goal`, an A* search
 * that stops there. Each settled square keeps its cost and the land and water crossed
 * to reach it.
 */
function search(grid, start, { goal = null, maxCost = Infinity, swimCost = 1, waterWalk = false, longJourneys = false } = {}) {
  const size = grid.size, diagonal = size * Math.SQRT2;
  const best = new Map(), settled = new Map();
  const heuristic = goal ? (gx, gy) => {
    const dx = Math.abs(gx - goal.gx), dy = Math.abs(gy - goal.gy);
    return (Math.max(dx, dy) - Math.min(dx, dy)) * size + Math.min(dx, dy) * diagonal;
  } : () => 0;
  const startKey = keyOf(start.gx, start.gy);
  best.set(startKey, { cost: 0, land: 0, water: 0, gx: start.gx, gy: start.gy });
  const heap = new Heap();
  heap.push([heuristic(start.gx, start.gy), startKey]);
  while (heap.size && settled.size < MAX_SETTLED) {
    const [f, key] = heap.pop();
    if (settled.has(key)) continue;
    const node = best.get(key);
    if (f > maxCost) break;
    settled.set(key, node);
    if (goal && node.gx === goal.gx && node.gy === goal.gy) return settled;
    for (const [dx, dy] of MOVES) {
      const nx = node.gx + dx, ny = node.gy + dy;
      const code = squareAt(grid, nx, ny);
      if (!passable(code, waterWalk, longJourneys)) continue;
      if (dx && dy && (!passable(squareAt(grid, node.gx + dx, node.gy), waterWalk, longJourneys) || !passable(squareAt(grid, node.gx, node.gy + dy), waterWalk, longJourneys))) continue;
      const nkey = keyOf(nx, ny);
      if (settled.has(nkey)) continue;
      const length = dx && dy ? diagonal : size;
      const swum = code === SWIM || code === SEA;
      if (swum && !waterWalk && !longJourneys && node.water + length > MAX_SWIM) continue;
      const cost = node.cost + length * (swum && !waterWalk ? swimCost : 1);
      const seen = best.get(nkey);
      if (seen && seen.cost <= cost) continue;
      best.set(nkey, { cost, land: node.land + (swum ? 0 : length), water: node.water + (swum ? length : 0), gx: nx, gy: ny });
      heap.push([cost + heuristic(nx, ny), nkey]);
    }
  }
  return settled;
}

// Endpoint offsets are timed as water when their footing is water.
function finish(node, from, to) {
  const land = node.land + (from.water ? 0 : from.off) + (to.water ? 0 : to.off);
  const water = node.water + (from.water ? from.off : 0) + (to.water ? to.off : 0);
  return { distance: land + water, land, water };
}

/**
 * The walk from a to b over the grid: its length, and how much of it is land and how
 * much is swum, or null when no path of cost up to `maxCost` joins them. Results are
 * kept on the grid, so the same walk is searched once.
 */
export function findWalk(grid, a, b, { maxCost = Infinity, swimCost = 1, waterWalk = false, longJourneys = false } = {}) {
  const memo = `${Math.round(a[0])},${Math.round(a[1])}|${Math.round(b[0])},${Math.round(b[1])}|${swimCost}|${maxCost}|${waterWalk ? 1 : 0}|${longJourneys ? 1 : 0}`;
  if (grid.paths.has(memo)) return grid.paths.get(memo);
  const from = standOn(grid, a, waterWalk, longJourneys), to = standOn(grid, b, waterWalk, longJourneys);
  let result = null;
  if (from && to) {
    const node = search(grid, from, { goal: to, maxCost, swimCost, waterWalk, longJourneys }).get(keyOf(to.gx, to.gy));
    if (node) result = finish(node, from, to);
  }
  grid.paths.set(memo, result);
  return result;
}

/**
 * Every walk from `a` of cost up to `maxCost`, in one search: returns a function that
 * gives the walk to any point, or null when it is out of reach.
 */
export function walksFrom(grid, a, { maxCost = Infinity, swimCost = 1, waterWalk = false, longJourneys = false } = {}) {
  const from = standOn(grid, a, waterWalk, longJourneys);
  if (!from) return () => null;
  const settled = search(grid, from, { maxCost, swimCost, waterWalk, longJourneys });
  return point => {
    const to = standOn(grid, point, waterWalk, longJourneys);
    const node = to && settled.get(keyOf(to.gx, to.gy));
    return node ? finish(node, from, to) : null;
  };
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

/**
 * Swim speed in units per second: the run speed times fSwimRunBase + 0.01 x Athletics x
 * fSwimRunAthleticsMult (getSwimSpeedImpl, apps/openmw/mwclass/actor.hpp, OpenMW 0.51.0),
 * without Swift Swim.
 */
export function swimSpeed(player = {}, settings = {}) {
  const athletics = Math.max(0, Number(player.athletics) || 0);
  return runSpeed(player, settings)
    * (setting(settings, "fSwimRunBase", 0.5) + 0.01 * athletics * setting(settings, "fSwimRunAthleticsMult", 0.1));
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

/** How much longer than its straight line a walk over the grid may be before it is refused. */
export const DETOUR_LIMIT = 1.5;

/**
 * A walking leg. `pair` is the two points and their straight distance; `path`, when the
 * walk followed the grid, its length and the land and water in it, timed at the run and
 * swim speeds, or with Water Walking the water at the run speed too.
 */
function walkEdge(to, pair, speed, timescale, path = null, swim = 0, waterWalk = false) {
  const edge = {
    to, kind: "Walk", walk: true, free: true, price: 0,
    hours: walkHours(pair.distance, speed, timescale),
    movementSeconds: pair.distance / speed,
    walkingSeconds: pair.distance / speed, swimmingSeconds: 0,
    distance: Math.round(pair.distance), direction: bearing(pair.a, pair.b)
  };
  if (path) {
    Object.assign(edge, {
      hours: walkHours(path.land, speed, timescale)
        + (path.water > 0 ? walkHours(path.water, swim > 0 && !waterWalk ? swim : speed, timescale) : 0),
      movementSeconds: path.land / speed
        + (path.water > 0 ? path.water / (swim > 0 && !waterWalk ? swim : speed) : 0),
      walkingSeconds: (path.land + (waterWalk ? path.water : 0)) / speed,
      swimmingSeconds: !waterWalk && path.water > 0 ? path.water / swim : 0,
      distance: Math.round(path.distance), straight: Math.round(pair.distance),
      water: Math.round(path.water), terrain: path.terrain !== false,
      ...(waterWalk && path.water > 0 ? { waterWalk: true } : {})
    });
  }
  return edge;
}

/** A leg flown with Levitate at `fly` units a second: a straight line over anything below. */
function flyEdge(to, pair, fly, timescale) {
  return {
    to, kind: "Walk", walk: true, free: true, price: 0, levitate: true,
    hours: walkHours(pair.distance, fly, timescale),
    movementSeconds: pair.distance / fly,
    distance: Math.round(pair.distance), straight: Math.round(pair.distance), direction: bearing(pair.a, pair.b)
  };
}

const reversed = pair => ({ a: pair.b, b: pair.a, distance: pair.distance });

/**
 * The legs both ways between `from` and `to`: walked (`walk`, from walkBetween or a grid
 * search) or flown (`air`, the nearest pair in a straight line), whichever takes fewer
 * hours, or null when neither is possible.
 */
function legsBetween(from, to, walk, air, { speed, swim, fly, waterWalk, timescale }) {
  const ground = walk && (!(walk.path?.water > 0) || waterWalk || swim > 0) ? [walkEdge(to, walk.pair, speed, timescale, walk.path, swim, waterWalk),
    walkEdge(from, reversed(walk.pair), speed, timescale, walk.path, swim, waterWalk)] : null;
  const flown = air && fly > 0 ? [flyEdge(to, air, fly, timescale), flyEdge(from, reversed(air), fly, timescale)] : null;
  if (!ground || !flown) return ground || flown;
  return flown[0].hours < ground[0].hours ? flown : ground;
}

/** The nearest pair of points between two sets within `limit` in a straight line, or null. */
function nearestWithin(as, bs, limit) {
  const pair = closestPair(as, bs);
  return pair && pair.distance <= limit ? pair : null;
}

/**
 * The walk between the nearest points of two sets, or null. Over the grid when there is
 * one: each pair within `limit` in a straight line, nearest first, until one has a path
 * no longer than DETOUR_LIMIT times the limit. Otherwise a straight line that never
 * crosses more than MAX_WATER of sea.
 */
function walkBetween(as, bs, { land, grid, limit, swimCost, waterWalk = false, longJourneys = false }) {
  if (!grid) {
    const pair = closestPair(as, bs);
    if (!pair || pair.distance > limit || (!waterWalk && !longJourneys && longestWater(land, pair.a, pair.b) > MAX_WATER)) return null;
    if (longJourneys) {
      const steps = Math.max(1, Math.ceil(pair.distance / STEP));
      let wet = 0;
      for (let i = 0; i < steps; i++) {
        const t = (i + 0.5) / steps;
        if (!onLand(land, pair.a[0] + (pair.b[0] - pair.a[0]) * t, pair.a[1] + (pair.b[1] - pair.a[1]) * t)) wet++;
      }
      const water = pair.distance * wet / steps;
      return { pair, path: { distance: pair.distance, land: pair.distance - water, water, terrain: false } };
    }
    return { pair, path: null };
  }
  const pairs = [];
  for (const a of as) for (const b of bs) {
    const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (distance <= limit) pairs.push({ a, b, distance });
  }
  pairs.sort((x, y) => x.distance - y.distance);
  for (const pair of pairs.slice(0, 4)) {
    const path = findWalk(grid, pair.a, pair.b, { maxCost: limit * DETOUR_LIMIT * swimCost, swimCost, waterWalk, longJourneys });
    if (path && path.distance <= limit * DETOUR_LIMIT) return { pair, path };
  }
  return null;
}

/** How much a swum unit costs a walker against a run one: the run speed over the swim speed. */
const swimCostOf = (speed, swim) => (swim > 0 && speed > 0 ? Math.max(1, speed / swim) : 1);

/**
 * Walking legs between stops within `limit` units: over the walkable grid when `grid`
 * is given, else in a straight line that never crosses more than MAX_WATER of sea. With
 * `waterWalk` any water is walked; with a `fly` speed (constant Levitate) a straight
 * flight is taken instead wherever it is quicker, or the only way. Returns a new graph.
 */
export function addStopWalks(graph = {}, points = new Map(), land = null, speed = 0,
  { limit = STOP_WALK_LIMIT, timescale = 30, grid = null, swim = 0, fly = 0, waterWalk = false, longJourneys = false } = {}) {
  const out = Object.fromEntries(Object.entries(graph || {}).map(([stop, edges]) => [stop, [...edges]]));
  if (!land || !(speed > 0)) return out;
  const swimCost = swimCostOf(speed, swim);
  const move = { speed, swim, fly, waterWalk, timescale };
  const stops = [...points.keys()].filter(stop => out[stop]).sort();
  for (let i = 0; i < stops.length; i++) {
    for (let j = i + 1; j < stops.length; j++) {
      const as = points.get(stops[i]), bs = points.get(stops[j]);
      const walk = walkBetween(as, bs, { land, grid, limit, swimCost, waterWalk, longJourneys });
      const legs = legsBetween(stops[i], stops[j], walk, fly > 0 ? nearestWithin(as, bs, limit) : null, move);
      if (!legs) continue;
      out[stops[i]].push(legs[0]);
      out[stops[j]].push(legs[1]);
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

/**
 * The place a loaded save's character stands in, as a Places key, or null. Indoors the
 * save names the room exactly; outdoors it names only the town or the region, so the
 * player's own position decides the grid square. `places` is a Map or Set of keys.
 */
export function placeFromSave(save, places) {
  const has = key => Boolean(key) && (typeof places?.has === "function" ? places.has(key) : false);
  const name = typeof save?.identity?.cell === "string" ? save.identity.cell.trim() : "";
  if (name && has("interior:" + name.toLowerCase())) return "interior:" + name.toLowerCase();
  for (const point of [save?.identity?.position, save?.identity?.lastExteriorPosition]) {
    if (!Array.isArray(point) || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
    const key = `exterior:${Math.floor(point[0] / CELL)},${Math.floor(point[1] / CELL)}`;
    if (has(key)) return key;
  }
  // A save reopened from the cloud keeps no position: a town's name still finds the town.
  if (name && typeof places?.values === "function") {
    const lower = name.toLowerCase();
    const town = [...places.values()]
      .filter(p => p && !p.interior && typeof p.name === "string" && p.name.toLowerCase() === lower && p.key)
      .map(p => p.key).sort()[0];
    if (town) return town;
  }
  return null;
}

/** The most central of a town's exterior cells; ties go to the first key. */
function centralCell(cells) {
  const cx = cells.reduce((sum, c) => sum + c.grid[0], 0) / cells.length;
  const cy = cells.reduce((sum, c) => sum + c.grid[1], 0) / cells.length;
  const far = c => (c.grid[0] - cx) ** 2 + (c.grid[1] - cy) ** 2;
  return [...cells].sort((a, b) => far(a) - far(b) || String(a.key).localeCompare(String(b.key)))[0];
}

/**
 * Named places matching a search, for the Travel pickers: tombs, caves, houses, shops, and
 * towns without a stop. A town spans several exterior cells with one name (Balmora is four),
 * so it is listed once, as its most central cell, per region. Stops are left out (the stop
 * list has them), and fewer than two letters finds nothing. Sorted by name, then region.
 * `places` is a Map or array of Places records.
 */
export function matchPlaces(places, query, { stops = [], limit = 30 } = {}) {
  const q = String(query ?? "").trim().toLowerCase();
  if (q.length < 2 || !places) return [];
  const skip = new Set(stops.map(stop => String(stop).toLowerCase()));
  const records = typeof places.values === "function" ? places.values() : places;
  const found = [];
  const towns = new Map();
  for (const record of records) {
    const name = typeof record?.name === "string" ? record.name : "";
    if (!name || skip.has(name.toLowerCase()) || !name.toLowerCase().includes(q)) continue;
    if (record.interior || !Array.isArray(record.grid) || record.grid.length < 2) { found.push(record); continue; }
    const town = `${name.toLowerCase()}|${record.region || ""}`;
    if (!towns.has(town)) towns.set(town, []);
    towns.get(town).push(record);
  }
  for (const cells of towns.values()) found.push(centralCell(cells));
  return found
    .sort((a, b) => a.name.localeCompare(b.name) || String(a.region || "").localeCompare(String(b.region || "")) || String(a.key).localeCompare(String(b.key)))
    .slice(0, limit);
}

// Sealed rooms' door lists (Access 1.2.0), by room, kept per catalog.
const joinedCache = new WeakMap();
function joinedRooms(access) {
  const records = access?.records;
  if (!Array.isArray(records)) return new Map();
  let joined = joinedCache.get(records);
  if (!joined) {
    joined = new Map(records.filter(r => r?.depth === null && Array.isArray(r.doors)).map(r => [r.key, r.doors]));
    joinedCache.set(records, joined);
  }
  return joined;
}

/**
 * From a sealed room (no door chain leads outside), every room its doors lead to, the
 * nearest first, each with the rooms passed on the way: [from, ..., room]. Empty for a
 * room with a way out, a room with no doors, or a release before Access 1.2.0.
 */
export function roomsThrough(cellKey, access = null) {
  const joined = joinedRooms(access);
  const chains = new Map();
  if (!joined.has(cellKey)) return chains;
  chains.set(cellKey, [cellKey]);
  const queue = [cellKey];
  for (let i = 0; i < queue.length; i++) {
    const room = queue[i];
    for (const next of joined.get(room) || []) {
      if (chains.has(next)) continue;
      chains.set(next, [...chains.get(room), next]);
      queue.push(next);
    }
  }
  chains.delete(cellKey);
  return chains;
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
 * How long a place's walk may wind, as a multiple of the usual reach, when no walk is
 * short enough otherwise: inside the Ghostfence every walk goes round by the Ghostgate.
 * The stops it may reach are still those within the usual reach in a straight line.
 */
export const FAR_DETOUR = 3;

/**
 * Walks from any of `here` to the nearest of `there` it reaches over the grid, given
 * one search from each point of `here`: the shortest no longer than `longest`, or null.
 */
function nearestReached(searches, there, limit, longest) {
  let best = null;
  for (const { point, walk } of searches) {
    for (const b of there) {
      const distance = Math.hypot(b[0] - point[0], b[1] - point[1]);
      if (distance > limit) continue;
      const path = walk(b);
      if (path && path.distance <= longest && (!best || path.distance < best.path.distance)) {
        best = { pair: { a: point, b, distance }, path };
      }
    }
  }
  return best;
}

/**
 * Join a sealed room to the rooms around it the network already knows, through its
 * doors: a teleport's arrival or departure room, or a stop such as a guild hall. Each
 * is an Indoors leg both ways that names the rooms passed, and takes no time.
 */
function addIndoors(out, id, cellKey, access, nodes) {
  for (const [room, chain] of roomsThrough(cellKey, access)) {
    const target = stopNameFor(nodes?.[room], room) || PLACE_PREFIX + room;
    if (target === id || !out[target]) continue;
    if (out[id].some(e => e.to === target && e.indoors)) continue;
    const leg = rooms => ({ kind: "Indoors", indoors: true, free: true, price: 0, hours: 0, doors: rooms });
    out[id].push({ to: target, ...leg(chain) });
    out[target].push({ to: id, ...leg([...chain].reverse()) });
  }
}

/**
 * Add a place (any cell) as a node the router can start or end at: walks to and from
 * every stop within `limit`, over the walkable grid when `grid` is given and else in a
 * straight line that stays out of the sea, a direct walk to the other place, and, cast
 * from the place, the interventions the character has. A sealed room is joined through
 * its doors to rooms the network knows (`nodes` names the stops among them).
 */
export function addPlaces(graph = {}, placeKeys = [], { points = new Map(), access = null, land = null, speed = 0,
  intervention = null, spells = {}, limit = PLACE_WALK_LIMIT, timescale = 30, grid = null, swim = 0, nodes = {},
  fly = 0, waterWalk = false, markerTarget = null, longJourneys = false } = {}) {
  if (longJourneys) limit = Infinity;
  const out = Object.fromEntries(Object.entries(graph || {}).map(([stop, edges]) => [stop, [...edges]]));
  const byIntervention = new Map((intervention?.records || []).map(r => [r.key, r]));
  const swimCost = swimCostOf(speed, swim);
  const move = { speed, swim, fly, waterWalk, timescale };
  const placed = [];
  const keys = [...new Set(placeKeys.filter(Boolean))];
  // Every place is a node first, so two sealed rooms added together can join each other.
  for (const cellKey of keys) out[PLACE_PREFIX + cellKey] = out[PLACE_PREFIX + cellKey] || [];
  for (const cellKey of keys) {
    const id = PLACE_PREFIX + cellKey;
    const here = placePoints(cellKey, access);
    if (!here.length) addIndoors(out, id, cellKey, access, nodes);
    placed.push([id, here]);
    if (land && speed > 0 && here.length) {
      const stops = [...points].filter(([stop]) => out[stop]);
      let walks;
      if (grid) {
        // One search per exit reaches network stops. Short-only mode limits reach
        // and retries a longer detour when needed. Long mode removes those distance
        // caps; the grid search still obeys terrain and MAX_SETTLED work bounds.
        const reach = factor => {
          const longest = limit * factor;
          const searches = here.map(point => ({ point, walk: walksFrom(grid, point, { maxCost: longest * swimCost, swimCost, waterWalk, longJourneys }) }));
          return stops.map(([stop, there]) => [stop, nearestReached(searches, there, limit, longest)]);
        };
        walks = reach(DETOUR_LIMIT);
        if (!longJourneys && !walks.some(([, walk]) => walk)) walks = reach(FAR_DETOUR);
      } else {
        walks = stops.map(([stop, there]) => [stop, walkBetween(here, there, { land, grid: null, limit, swimCost, waterWalk, longJourneys })]);
      }
      const around = new Map(stops);
      for (const [stop, walk] of walks) {
        const legs = legsBetween(id, stop, walk, fly > 0 ? nearestWithin(here, around.get(stop), limit) : null, move);
        if (!legs) continue;
        out[id].push(legs[0]);
        out[stop].push(legs[1]);
      }
    }
    const record = byIntervention.get(cellKey);
    for (const kind of ["divine", "almsivi"]) {
      if (!spells?.[kind] || !Number.isInteger(record?.[kind])) continue;
      const marker = intervention.markers?.[kind]?.[record[kind]];
      const to = markerTarget ? markerTarget(kind, record[kind]) : markerStop(marker);
      if (!to) continue;
      if (!out[to]) out[to] = [];
      out[id].push({ to, kind: kind === "divine" ? "Divine Intervention" : "Almsivi Intervention", spell: kind,
        free: true, price: 0, hours: 0, ambiguous: Boolean(record.ambiguous?.[kind]?.length) || undefined });
    }
  }
  if (land && speed > 0 && placed.length === 2) {
    const [[a, pa], [b, pb]] = placed;
    const walk = walkBetween(pa, pb, { land, grid, limit, swimCost, waterWalk, longJourneys });
    const legs = legsBetween(a, b, walk, fly > 0 ? nearestWithin(pa, pb, limit) : null, move);
    if (legs) {
      out[a].push(legs[0]);
      out[b].push(legs[1]);
    }
  }
  return out;
}

/** Direct long journeys between selected endpoint platforms. City choices keep all
 * their platforms; no virtual city node can join intermediate stops for free.
 * Local transfers remain sparse, so long-distance routing does not search every
 * pair of platforms across an entire profile whenever the page renders. */
export function addJourneyWalks(graph, origins, destinations, { points = new Map(), access = null,
  land = null, speed = 0, swim = 0, fly = 0, grid = null, waterWalk = false, timescale = 30 } = {}) {
  if (!land || !(speed > 0)) return graph;
  const out = Object.fromEntries(Object.entries(graph).map(([id, edges]) => [id, [...edges]]));
  const positions = id => isPlace(id) ? placePoints(id.slice(PLACE_PREFIX.length), access) : points.get(id) || [];
  const list = ids => Array.isArray(ids) ? ids : [ids];
  const swimCost = swimCostOf(speed, swim);
  for (const from of list(origins)) for (const to of list(destinations)) {
    if (from === to || !out[from] || !out[to] || out[from].some(edge => edge.to === to && edge.walk)) continue;
    const a = positions(from), b = positions(to);
    const walk = walkBetween(a, b, { land, grid, limit: Infinity, swimCost, waterWalk, longJourneys: true });
    const legs = legsBetween(from, to, walk, fly > 0 ? nearestWithin(a, b, Infinity) : null, { speed, swim, fly, waterWalk, timescale });
    if (legs) { out[from].push(legs[0]); out[to].push(legs[1]); }
  }
  return out;
}
