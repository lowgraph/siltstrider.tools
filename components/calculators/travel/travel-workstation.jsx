"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import { useSearchIntent } from "../../use-search-intent";
import { clearSearchIntent } from "../../../lib/search-intent.mjs";
import {
  getAvailableTransitStops,
  planRoute,
  journeyGold,
  travelDisposition,
  adaptTravelGraph,
  addInterventionEdges,
  interventionsFromSave,
  interventionSources,
  saveMarks,
  interventionMarkText,
  guildFromSave,
  guildGuideNotice,
  INTERVENTION_KINDS,
  ROUTE_OBJECTIVES
} from "../../../lib/travel-graph.mjs";
import { resolveStopPositions, regionLabels, mapEdges, formatRegionName } from "../../../lib/travel-map.mjs";
import {
  stopPoints,
  addStopWalks,
  addPlaces,
  walkGrid,
  formatDuration,
  placePoints,
  doorChain,
  isPlace,
  placeFromSave,
  matchPlaces,
  roomsThrough,
  PLACE_PREFIX,
  CELL
} from "../../../lib/travel-walk.mjs";
import { addTeleports, teleportItems, heldFromSave } from "../../../lib/travel-teleports.mjs";
import { readRouteLink, writeRouteLink } from "../../../lib/travel-link.mjs";
import { movementFor, itemIndex, carriedWeight, constantEffects } from "../../../lib/travel-movement.mjs";
import TransitMap from "./transit-map";
import ActiveCharacterLink from "../../active-character-link";

const POPULAR_HUBS = [
  { name: "Seyda Neen", desc: "Arrival Port", vanillaOnly: false },
  { name: "Balmora", desc: "Central Hub", vanillaOnly: false },
  { name: "Vivec", desc: "Cantons Transit", vanillaOnly: false },
  { name: "Ald-ruhn", desc: "Redoran Gateway", vanillaOnly: false },
  { name: "Sadrith Mora", desc: "Telvanni Coast", vanillaOnly: false },
  { name: "Old Ebonheart", desc: "Imperial Mainland", trOnly: true }
];

/** Beside an option a loaded save set, while it still holds the save's value. */
function FromSave({ children = "from your save" }) {
  // A real space, so the label reads "Mages Guild member from your save", not run together.
  return <>{" "}<span className="save-mark text-[10px] text-fg-9 whitespace-nowrap">{children}</span></>;
}

export default function TravelWorkstation() {
  const { build, sheet: buildSheet, activeSave } = useActiveCharacter();
  const sheet = activeSave?.sheet || buildSheet;
  const { world } = useShell();
  const isTr = world === "tr";
  const gameData = useGameData('travel', { enabled: true });
  const [origin, setOrigin] = useState("Seyda Neen");
  const [destination, setDestination] = useState("Vivec");
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [mageGuild,setMageGuild] = useState(true);
  const [conjurer,setConjurer] = useState(false);
  const [objective, setObjective] = useState("hops");
  const [followers, setFollowers] = useState(0);
  const [spells, setSpells] = useState({ divine: false, almsivi: false });
  const [walking, setWalking] = useState(true);
  const [held, setHeld] = useState(() => new Set());
  const [questTeleports, setQuestTeleports] = useState(false);
  // What the character carries and the movement effects always on them. A loaded save
  // fills them in once the item catalogs arrive; without one they are yours to set.
  const [carried, setCarried] = useState(0);
  const [levitate, setLevitate] = useState(0);
  const [waterWalking, setWaterWalking] = useState(false);
  const [fromSave, setFromSave] = useState(null);
  const carryingData = useGameData('carrying', { enabled: Boolean(activeSave?.save) });

  // The save's own standing with the Mages Guild decides which guides will serve.
  const saveGuild = useMemo(() => (activeSave?.save ? guildFromSave(activeSave.save) : null), [activeSave]);
  const guildNotice = guildGuideNotice(saveGuild, mageGuild);
  // A loaded save says which intervention the character can cast (the spell or a scroll)
  // and what it carries; options still holding those values are labelled "from your save".
  const saveSpells = useMemo(() => (activeSave?.save ? interventionsFromSave(activeSave.save) : null), [activeSave]);
  const saveSources = useMemo(() => (activeSave?.save ? interventionSources(activeSave.save) : null), [activeSave]);
  const savedItems = useMemo(() => (activeSave?.save ? heldFromSave(activeSave.save) : null), [activeSave]);
  const marks = saveMarks(activeSave?.save ? { guild: saveGuild, spells: saveSpells } : null, { mageGuild, conjurer, spells });

  useEffect(() => {
    if (activeSave?.save) {
      setSpells(saveSpells);
      setHeld(savedItems);
      if (saveGuild) {
        setMageGuild(saveGuild.mageGuild);
        setConjurer(saveGuild.conjurer);
      }
    }
  }, [activeSave, saveGuild, saveSpells, savedItems]);

  useEffect(() => {
    if (!activeSave?.save) { setFromSave(null); return; }
    if (carryingData.status !== 'ready') return;
    const catalogs = carryingData.data?.catalogs || {};
    const items = itemIndex(catalogs);
    const { weight, unknown } = carriedWeight(activeSave.save, items);
    const effects = constantEffects(activeSave.save, items, { enchantments: catalogs.Enchantments, spells: catalogs.Spells });
    setCarried(weight);
    setLevitate(effects.levitate);
    setWaterWalking(effects.waterWalking > 0);
    setFromSave({ weight, unknown, ...effects });
  }, [activeSave, carryingData.status, carryingData.data]);

  const liveNetworkGraph = useMemo(() => {
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.Travel)) {
      const records = gameData.data.catalogs.Travel;
      const nodes = gameData.data.metadata?.Travel?.nodes || {};
      const providers = gameData.data.metadata?.Travel?.providers || {};
      return adaptTravelGraph(records, nodes, {mageGuild,conjurer:isTr && conjurer,providers});
    }
    return {};
  }, [gameData.status, gameData.data,mageGuild,conjurer,isTr]);

  // The haggle: this character's side of getBarterOffer, and the game settings it reads.
  const player = useMemo(() => ({
    mercantile: sheet?.skills?.["Mercantile"]?.v ?? 5,
    personality: sheet?.attrs?.["Personality"]?.v ?? 40,
    luck: sheet?.attrs?.["Luck"]?.v ?? 40,
    races: [build.race, activeSave?.save?.identity?.race?.id, activeSave?.save?.identity?.race?.name].filter(Boolean),
    speed: sheet?.attrs?.["Speed"]?.v ?? 40,
    athletics: sheet?.skills?.["Athletics"]?.v ?? 5,
    strength: sheet?.attrs?.["Strength"]?.v ?? 40,
    followers
  }), [sheet, build.race, activeSave, followers]);
  const settings = useMemo(() => Object.fromEntries(
    (gameData.data?.catalogs?.GameSettings || []).map((r) => [r.id, r.value])
  ), [gameData.data]);
  // Releases before travel policy 2026.09.27.2 carry no fares; plan by legs alone then.
  const priced = useMemo(
    () => Object.values(liveNetworkGraph).some((edges) => edges.some((e) => Number.isFinite(e.price))),
    [liveNetworkGraph]
  );

  // Divine and Almsivi Intervention: where the engine's marker search lands each spell,
  // from every stop, as legs that cost nothing and take no time.
  const intervention = useMemo(() => {
    const records = gameData.data?.catalogs?.Intervention;
    const markers = gameData.data?.metadata?.Intervention?.markers;
    return Array.isArray(records) && markers ? { records, markers } : null;
  }, [gameData.data]);
  const spellGraph = useMemo(() => addInterventionEdges(
    liveNetworkGraph, intervention, gameData.data?.metadata?.Travel?.nodes || {}, spells
  ), [liveNetworkGraph, intervention, gameData.data, spells]);

  // Walking: between nearby stops, and to any place in the game, over the Access
  // catalog's walkable grid (around steep ground, the Ghostfence and open sea) where the
  // release has one and in a straight line kept out of the sea where it does not, timed
  // by this character's run and swim speeds.
  const access = useMemo(() => {
    const records = gameData.data?.catalogs?.Access;
    const land = gameData.data?.metadata?.Access?.land;
    return Array.isArray(records) && land ? { records, land } : null;
  }, [gameData.data]);
  const grid = useMemo(() => walkGrid(gameData.data?.metadata?.Access?.walkable), [gameData.data]);
  // Run, swim and fly speeds, slowed by what is carried (OpenMW 0.51.0); Feather and
  // Burden come from the save alone, since they are only ever always-on from gear.
  const movement = useMemo(() => movementFor(player, settings, {
    carried, levitate, waterWalking, feather: fromSave?.feather || 0, burden: fromSave?.burden || 0
  }), [player, settings, carried, levitate, waterWalking, fromSave]);
  const speed = movement.run, swim = movement.swim, fly = movement.fly;
  const points = useMemo(() => stopPoints({
    records: gameData.data?.catalogs?.Travel || [],
    nodes: gameData.data?.metadata?.Travel?.nodes || {},
    access, intervention
  }), [gameData.data, access, intervention]);
  const walkGraph = useMemo(
    () => (walking && access ? addStopWalks(spellGraph, points, access.land, speed, { grid, swim, fly, waterWalk: waterWalking }) : spellGraph),
    [walking, access, spellGraph, points, speed, grid, swim, fly, waterWalking]
  );

  // Propylons, dialogue transports and teleporting items: the ones the items the
  // character carries open, and quest teleports only when asked for.
  const teleports = useMemo(() => {
    const records = gameData.data?.catalogs?.Teleports;
    return Array.isArray(records) ? { records, items: gameData.data?.metadata?.Teleports?.items || {} } : null;
  }, [gameData.data]);
  const carriedOptions = useMemo(() => teleportItems(teleports), [teleports]);
  const routingGraph = useMemo(() => {
    if (!teleports) return walkGraph;
    return addTeleports(walkGraph, teleports, {
      nodes: gameData.data?.metadata?.Travel?.nodes || {}, held, includeQuest: questTeleports,
      walk: { points, access, land: walking ? access?.land : null, speed, swim, fly, waterWalk: waterWalking, grid,
        intervention, spells, nodes: gameData.data?.metadata?.Travel?.nodes || {} }
    }).graph;
  }, [walkGraph, teleports, gameData.data, held, questTeleports, points, access, walking, speed, swim, fly, waterWalking, grid, intervention, spells]);

  // Every place in the game, for the pickers and for naming a place on the route.
  const places = useMemo(
    () => new Map((gameData.data?.catalogs?.Places || []).map((record) => [record.key, record])),
    [gameData.data]
  );
  // Where the loaded save's character stands, and starting there once per save.
  const saveOrigin = useMemo(() => {
    const key = activeSave?.save ? placeFromSave(activeSave.save, places) : null;
    return key ? PLACE_PREFIX + key : null;
  }, [activeSave, places]);
  const [startedFrom, setStartedFrom] = useState(null);

  // A shared route opens as it was shared, and wins over the save's starting point.
  const [linkRead, setLinkRead] = useState(false);
  useEffect(() => {
    if (linkRead || typeof window === "undefined") return;
    setLinkRead(true);
    const link = readRouteLink(window.location.search, ROUTE_OBJECTIVES);
    if (link.from) { setOrigin(link.from); setStartedFrom(activeSave?.token ?? "link"); }
    if (link.to) setDestination(link.to);
    if (link.plan) setObjective(link.plan);
    if (link.walk === false) setWalking(false);
    if (link.quest === true) setQuestTeleports(true);
  }, [linkRead, activeSave]);
  useEffect(() => {
    // Only while the travel page is the one on screen: tools stay mounted behind others.
    if (!linkRead || typeof window === "undefined" || window.location.pathname !== "/travel") return;
    const search = writeRouteLink(window.location.search, { from: origin, to: destination, plan: objective, walk: walking, quest: questTeleports });
    if (search !== window.location.search) {
      window.history.replaceState(window.history.state, "", window.location.pathname + search + window.location.hash);
    }
  }, [linkRead, origin, destination, objective, walking, questTeleports]);
  const [copied, setCopied] = useState(false);
  const copyRouteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  }, []);

  useEffect(() => {
    if (!saveOrigin || startedFrom === activeSave?.token) return;
    setStartedFrom(activeSave?.token ?? null);
    setOrigin(saveOrigin);
    setOriginSearch("");
  }, [saveOrigin, activeSave, startedFrom]);

  const labelOf = useCallback((id) => {
    if (!isPlace(id)) return id;
    const key = id.slice(PLACE_PREFIX.length);
    const record = places.get(key);
    if (record?.name) return record.name;
    const grid = /^exterior:(-?\d+),(-?\d+)$/.exec(key);
    const region = record?.region ? formatRegionName(record.region) : "Wilderness";
    return grid ? `${region} (${grid[1]}, ${grid[2]})` : key.replace(/^interior:/, "");
  }, [places]);

  // Stop positions, network edges and region labels for the transit map (live bundle only).
  const mapData = useMemo(() => {
    if (!routingGraph) return null;
    const { positions, unplaced } = resolveStopPositions(
      gameData.data?.metadata?.Travel?.nodes || {},
      gameData.data?.metadata?.Places?.settlements || []
    );
    // A landing spot no journey reaches (a fort, a courtyard) sits where its marker stands.
    for (const kind of Object.keys(INTERVENTION_KINDS)) {
      for (const m of intervention?.markers?.[kind] || []) {
        const stop = m.town || (m.name ? m.name.split(",")[0].trim() : null);
        if (stop && !positions[stop] && m.cell?.startsWith("exterior:") && Array.isArray(m.pos)) {
          positions[stop] = [m.pos[0] / 8192, m.pos[1] / 8192];
        }
      }
    }
    // A chosen place sits where you walk to or from it.
    for (const id of [origin, destination]) {
      if (!isPlace(id)) continue;
      const [point] = placePoints(id.slice(PLACE_PREFIX.length), access);
      if (point) positions[id] = [point[0] / CELL, point[1] / CELL];
    }
    // Only stops that are part of the network, so the map and the stop count agree.
    const onNetwork = Object.fromEntries(Object.entries(positions).filter(([stop]) => routingGraph[stop] || isPlace(stop)));
    if (!Object.keys(onNetwork).length) return null;
    return {
      positions: onNetwork,
      unplaced: [...new Set([...unplaced, ...Object.keys(routingGraph).filter((stop) => !positions[stop])])]
        .filter((stop) => routingGraph[stop]).sort().map(labelOf),
      // Spells reach everywhere; drawing them all would bury the network. The route draws its own.
      edges: mapEdges(liveNetworkGraph),
      regions: regionLabels(gameData.data?.catalogs?.Places || [])
    };
  }, [routingGraph, liveNetworkGraph, intervention, gameData.data, origin, destination, access, labelOf]);

  const availableStops = useMemo(() => {
    // Places a teleport lands in are routed through, not listed as stops; search finds them.
    return getAvailableTransitStops(world, routingGraph).filter((stop) => !isPlace(stop));
  }, [world, routingGraph]);


  // Ensure selected stops exist in current world; a chosen place stays while the world has it.
  useEffect(() => {
    if (availableStops.length > 0) {
      const known = (id) => availableStops.includes(id) || (isPlace(id) && places.has(id.slice(PLACE_PREFIX.length)));
      if (!known(origin)) {
        setOrigin(availableStops[0]);
      }
      if (!known(destination)) {
        setDestination(availableStops[availableStops.length - 1] || availableStops[0]);
      }
    }
  }, [world, availableStops, origin, destination, places]);

  const handleOriginChange = setOrigin;
  const handleDestinationChange = setDestination;

  // "Plan a trip here" from site search: set the destination once the stop list has it.
  const intent = useSearchIntent("travel");
  useEffect(() => {
    if (!intent || intent.kind !== "destination") return;
    if (availableStops.includes(intent.value)) {
      clearSearchIntent(intent);
      setDestSearch("");
      handleDestinationChange(intent.value);
    } else if (gameData.status === "ready" || gameData.status === "error") {
      clearSearchIntent(intent);
    }
  }, [intent, availableStops, gameData.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwap = () => {
    const prevOrigin = origin;
    const prevDest = destination;
    handleOriginChange(prevDest);
    handleDestinationChange(prevOrigin);
  };

  // Filtered stops for search
  const filteredOriginStops = useMemo(() => {
    if (!originSearch.trim()) return availableStops;
    return availableStops.filter((s) =>
      s.toLowerCase().includes(originSearch.toLowerCase())
    );
  }, [availableStops, originSearch]);

  const filteredDestStops = useMemo(() => {
    if (!destSearch.trim()) return availableStops;
    return availableStops.filter((s) =>
      s.toLowerCase().includes(destSearch.toLowerCase())
    );
  }, [availableStops, destSearch]);

  // Any named place matching a search: tombs, caves, houses, shops, a town listed once.
  // Needs Access to route.
  const placeMatches = useCallback(
    (query) => (access ? matchPlaces(places, query, { stops: availableStops }) : []),
    [access, places, availableStops]
  );
  const originPlaces = useMemo(() => placeMatches(originSearch), [placeMatches, originSearch]);
  const destPlaces = useMemo(() => placeMatches(destSearch), [placeMatches, destSearch]);
  const sealed = useCallback((record) => record.interior && !placePoints(record.key, access).length, [access]);
  // How a room with no door out is reached: through its doors to a teleport's end or a
  // stop, if any; quest teleports only count when asked for on the route, so say so.
  const teleportEnds = useMemo(() => {
    const ends = new Map();
    for (const t of teleports?.records || []) {
      for (const cell of [t.to, ...(t.from || [])]) {
        if (cell && ends.get(cell) !== "everyday") ends.set(cell, t.questGated ? "quest" : "everyday");
      }
    }
    return ends;
  }, [teleports]);
  const sealedWay = useCallback((cellKey) => {
    const nodes = gameData.data?.metadata?.Travel?.nodes || {};
    let way = null;
    for (const room of [cellKey, ...roomsThrough(cellKey, access).keys()]) {
      const end = nodes[room] ? "everyday" : teleportEnds.get(room);
      if (end === "everyday") { way = end; break; }
      if (end) way = end;
    }
    return way === "everyday" ? "inside, by teleport" : way === "quest" ? "inside, by quest teleport" : "inside, no way in known";
  }, [access, teleportEnds, gameData.data]);

  // Compute route: fewest legs, least gold for this character, or fewest in-game hours.
  const planGraph = useMemo(() => {
    const chosen = [origin, destination].filter(isPlace).map((id) => id.slice(PLACE_PREFIX.length));
    if (!chosen.length) return routingGraph;
    return addPlaces(routingGraph, chosen, {
      points, access, land: walking ? access?.land : null, speed, swim, fly, waterWalk: waterWalking, grid, intervention, spells,
      nodes: gameData.data?.metadata?.Travel?.nodes || {}
    });
  }, [origin, destination, routingGraph, points, access, walking, speed, swim, fly, waterWalking, grid, intervention, spells, gameData.data]);
  const route = useMemo(() => {
    const planned = planRoute(origin, destination, planGraph, {
      objective: priced ? objective : "hops",
      goldOf: (edge) => journeyGold(edge, player, settings)
    });
    if (planned.isValid) return planned;
    const shut = [origin, destination].find((id) => isPlace(id) && !placePoints(id.slice(PLACE_PREFIX.length), access).length);
    if (shut) return { ...planned, message: `No door leads out of ${labelOf(shut)}. It is reached by a script or a spell, if at all.` };
    return planned;
  }, [origin, destination, planGraph, objective, priced, player, settings, access, labelOf]);
  const routeSpellEdges = useMemo(() => (route.isValid ? route.steps : [])
    .filter((step) => step.spell || step.walk || step.teleport)
    .map((step) => {
      const [a, b] = step.from < step.to ? [step.from, step.to] : [step.to, step.from];
      return { a, b, kind: step.kind };
    }), [route]);
  // Places a route passes through (a Propylon chamber) sit where you walk out of them.
  const routePositions = useMemo(() => {
    if (!mapData) return null;
    const out = { ...mapData.positions };
    for (const id of route.isValid ? route.path : []) {
      if (!isPlace(id) || out[id]) continue;
      const [point] = placePoints(id.slice(PLACE_PREFIX.length), access);
      if (point) out[id] = [point[0] / CELL, point[1] / CELL];
    }
    return out;
  }, [mapData, route, access]);
  const firstSeller = useMemo(() => {
    for (const edges of Object.values(liveNetworkGraph)) {
      const found = edges.find((e) => e.barter && e.barter.haggles);
      if (found) return found.barter;
    }
    return null;
  }, [liveNetworkGraph]);

  // Service color helper (gold / wood / dark themes, NO rainbows)
  const getServiceBadge = (kind) => {
    switch (kind) {
      case "Silt Strider":
        return "border-warning-line bg-surface-15 text-accent-2";
      case "Guild Guide":
        return "border-info-line-1 bg-info-surface-1 text-info";
      case "Boat":
        return "border-success-line-3 bg-teal-surface text-success-5";
      case "River Strider":
        return "border-line-2 bg-surface-10 text-accent";
      case "Gondolier":
        return "border-line-3 bg-surface-9 text-fg-7";
      case "Pack Guar":
        return "border-line-5 bg-surface-15 text-accent-2";
      case "Sky Lamp":
        return "border-line-2 bg-surface-10 text-warning-2";
      case "Carriage":
        return "border-line-5 bg-surface-9 text-fg-5";
      case "Divine Intervention":
        return "border-info-line-1 bg-surface-9 text-info";
      case "Almsivi Intervention":
        return "border-warning-line bg-surface-9 text-warning-2";
      case "Propylon":
        return "border-info-line-1 bg-surface-15 text-info";
      case "Indoors":
        return "border-line-6 bg-surface-5 text-fg-7";
      case "Dialogue Teleport":
      case "Item Teleport":
      case "Teleport":
        return "border-line-2 bg-surface-9 text-accent";
      default:
        return "border-line-9 bg-surface-5 text-accent";
    }
  };

  return (
    <div className="travel-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-6">
      {/* Workstation Header Bar */}
      <div className="bg-surface-7 p-4 border border-line-11 mw-groove-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-fg-2 tracking-wide m-0">
            Travel Planner
          </h2>
          <p className="text-xs text-fg-11 mt-0.5 m-0 font-sans">
            Plan the fewest legs, the cheapest fare for your character, or the fastest trip across silt striders, pack guar caravans, sky lamps, boats, river striders, and Guild Guides in Vvardenfell and mainland Tamriel.
          </p>
        </div>
      </div>

      {/* Top Banner: Active Character & World Profile Strip & Live Game-Data Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-5 border border-line-11">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-serif font-bold text-accent uppercase tracking-wider whitespace-nowrap">
            Active Character:
          </span>
          <ActiveCharacterLink build={build} />
          <span className="text-fg-13 max-sm:hidden">·</span>
          <span className="text-fg-9 whitespace-nowrap">
            Network:{" "}
            <strong className="text-accent">
              {isTr ? "Tamriel Rebuilt" : "Vvardenfell (Vanilla)"}
            </strong>
          </span>
          <span className="text-fg-13 max-sm:hidden">·</span>
          <span className="text-fg-9 whitespace-nowrap">
            Stops: <strong className="text-accent">{availableStops.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {gameData.status === 'ready' ? (
            <span className="text-xs px-2 py-0.5 rounded border border-success-line-5 bg-success-surface-1 text-success-3 font-mono flex items-center gap-1.5 shadow-inner" title={`Loaded from content-addressed bundle ${gameData.bundleId || ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-success-surface-7 inline-block"/>
              <span>Live: {availableStops.length} Stops ({gameData.data?.profile?.toUpperCase() || world.toUpperCase()})</span>
            </span>
          ) : gameData.status === 'loading' ? (
            <span className="text-xs px-2 py-0.5 rounded border border-line-6 bg-surface-5 text-accent font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse"/>
              <span>Loading bundle...</span>
            </span>
          ) : null}

          <button
            type="button"
            className="mw-btn px-2.5 py-1 text-xs font-serif font-bold"
            onClick={handleSwap}
            title="Swap Origin and Destination"
          >
            Swap Origin and Destination
          </button>
          <button
            type="button"
            className="mw-btn px-2.5 py-1 text-xs font-serif font-bold"
            onClick={copyRouteLink}
            title="Copy a link to this route"
          >
            {copied ? "Link copied" : "Copy route link"}
          </button>
        </div>
      </div>

      {/* Quick Hub Jump Presets */}
      <div className="flex flex-wrap gap-4 p-3 text-sm">
        <label><input type="checkbox" checked={mageGuild} onChange={event=>setMageGuild(event.target.checked)}/> Mages Guild member{marks.mageGuild && <FromSave />}</label>
        {isTr && <label><input type="checkbox" checked={conjurer} disabled={!mageGuild} onChange={event=>setConjurer(event.target.checked)}/> Conjurer rank or higher{marks.conjurer && <FromSave />}</label>}
        {priced && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Route objective">
            <span className="text-xs font-serif font-bold text-fg-7 uppercase tracking-wider">Plan for:</span>
            {Object.entries(ROUTE_OBJECTIVES).map(([id, o]) => (
              <button
                key={id}
                type="button"
                aria-pressed={objective === id}
                onClick={() => setObjective(id)}
                className={`px-2.5 py-1 text-xs font-serif font-bold border transition-colors ${
                  objective === id
                    ? "border-accent bg-surface-17 text-accent"
                    : "border-line-9 bg-surface-3 text-fg-9 hover:border-line-1 hover:text-fg-2"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        {intervention && Object.entries(INTERVENTION_KINDS).map(([kind, label]) => (
          <label key={kind} className="whitespace-nowrap">
            <input
              type="checkbox"
              checked={spells[kind]}
              onChange={(event) => setSpells((prev) => ({ ...prev, [kind]: event.target.checked }))}
            />{" "}
            {label}
            {marks[kind] && <FromSave>{interventionMarkText(saveSources?.[kind], spells[kind])}</FromSave>}
          </label>
        ))}
        {teleports && (
          <label className="whitespace-nowrap">
            <input type="checkbox" checked={questTeleports} onChange={(event) => setQuestTeleports(event.target.checked)} /> Include quest teleports
          </label>
        )}
        {access && (
          <label className="whitespace-nowrap">
            <input type="checkbox" checked={walking} onChange={(event) => setWalking(event.target.checked)} /> Walk between nearby places
          </label>
        )}
        {access && walking && (
          <>
            <label className="flex items-center gap-1.5 whitespace-nowrap" title="Weight carried; it slows every walk, and past your capacity (Strength x 5) you cannot move.">
              Carrying
              <input
                type="number"
                min={0}
                step="0.5"
                value={carried}
                onChange={(event) => setCarried(Math.max(0, Number(event.target.value) || 0))}
                className="flex-none"
                style={{ width: "5.5rem" }}
              />
              <span className="text-fg-13">of {Math.round(movement.capacity)}</span>
            </label>
            <label className="flex items-center gap-1.5 whitespace-nowrap" title="Magnitude of a Levitate always on, from gear or an ability; 0 for none.">
              Constant Levitate
              <input
                type="number"
                min={0}
                max={100}
                value={levitate}
                onChange={(event) => setLevitate(Math.max(0, Math.min(100, Math.trunc(Number(event.target.value) || 0))))}
                className="flex-none"
                style={{ width: "4.5rem" }}
              />
            </label>
            <label className="whitespace-nowrap">
              <input type="checkbox" checked={waterWalking} onChange={(event) => setWaterWalking(event.target.checked)} /> Constant Water Walking
            </label>
          </>
        )}
        {priced && (
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            Followers
            <input
              type="number"
              min={0}
              max={9}
              value={followers}
              onChange={(event) => setFollowers(Math.max(0, Math.min(9, Math.trunc(Number(event.target.value) || 0))))}
              className="flex-none"
              style={{ width: "5rem" }}
            />
          </label>
        )}
        {guildNotice && (
          <p role="note" className="guild-guide-notice basis-full text-[11px] text-warning-2">{guildNotice}</p>
        )}
        {access && walking && movement.overloaded && (
          <p role="alert" className="basis-full text-[11px] text-warning-2">
            Carrying more than you can ({Math.round(movement.load)} of {Math.round(movement.capacity)}): you cannot move, so no route walks.
          </p>
        )}
        {access && walking && fromSave && (
          <p className="basis-full text-[11px] text-fg-13">
            From your save: carrying {fromSave.weight}{fromSave.unknown ? ` (${fromSave.unknown} item${fromSave.unknown === 1 ? "" : "s"} this world's data does not know, not weighed)` : ""}
            {fromSave.feather ? `, Feather ${fromSave.feather}` : ""}{fromSave.burden ? `, Burden ${fromSave.burden}` : ""}
            {fromSave.sources.length ? `; always on from ${fromSave.sources.join(", ")}` : ""}.
          </p>
        )}
        {activeSave?.save && carryingData.status === 'loading' && <p role="status" className="basis-full text-[11px]">Weighing your pack...</p>}
        {gameData.status === 'loading' && <p role="status">Loading travel network...</p>}
        {gameData.status === 'error' && <p role="alert">Travel network unavailable. <button onClick={gameData.retry}>Retry</button></p>}
      </div>
      {carriedOptions.length > 0 && (
        <details className="p-3 bg-surface-5 border border-line-11">
          <summary className="text-xs font-serif font-bold text-fg-7 uppercase tracking-wider cursor-pointer">
            Items you carry ({carriedOptions.filter((item) => held.has(item.id)).length} of {carriedOptions.length})
            {savedItems && carriedOptions.some((item) => held.has(item.id) && savedItems.has(item.id)) && (
              <FromSave>{carriedOptions.filter((item) => held.has(item.id) && savedItems.has(item.id)).length} from your save</FromSave>
            )}
          </summary>
          <p className="text-[11px] text-fg-13 mt-2 mb-2">
            Propylon indices and teleporting amulets open routes. A loaded save ticks the ones in its pack.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {carriedOptions.map((item) => (
              <label key={item.id} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={held.has(item.id)}
                  onChange={(event) => setHeld((prev) => {
                    const next = new Set(prev);
                    if (event.target.checked) next.add(item.id); else next.delete(item.id);
                    return next;
                  })}
                />
                {item.name}
                {held.has(item.id) && savedItems?.has(item.id) && <FromSave />}
              </label>
            ))}
          </div>
        </details>
      )}
      <div className="p-3 bg-surface-5 border border-line-11 space-y-2">
        <div className="text-xs font-serif font-bold text-fg-7 uppercase tracking-wider">
          Fast Origin Selector
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveOrigin && (
            <button
              type="button"
              onClick={() => { handleOriginChange(saveOrigin); setOriginSearch(""); }}
              className={`px-2.5 py-1 text-xs font-serif font-bold border transition-colors ${
                origin === saveOrigin
                  ? "border-accent bg-surface-17 text-accent"
                  : "border-line-9 bg-surface-3 text-fg-9 hover:border-line-1 hover:text-fg-2"
              }`}
            >
              {labelOf(saveOrigin)} <span className="text-[10px]">(where {activeSave?.save?.identity?.name || "your save"} stands)</span>
            </button>
          )}
          {POPULAR_HUBS.filter((h) => !h.trOnly || isTr).map((hub) => {
            const isSelected = origin === hub.name;
            return (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleOriginChange(hub.name)}
                className={`px-2.5 py-1 text-xs font-serif font-bold border transition-colors ${
                  isSelected
                    ? "border-accent bg-surface-17 text-accent"
                    : "border-line-9 bg-surface-3 text-fg-9 hover:border-line-1 hover:text-fg-2"
                }`}
              >
                {hub.name} <span className="text-[10px]">({hub.desc})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Pane Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Route Origin & Destination Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider border-b border-line-9 pb-1.5">
            Transit Itinerary Setup
          </h3>

          {/* Origin Stop */}
          <div className="p-3 bg-surface-5 border border-line-11 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="travel-origin-select" className="text-xs uppercase font-serif font-bold text-fg-7">
                Origin Location
              </label>
              <span className="text-[10px] font-mono text-fg-13">
                {filteredOriginStops.length} stops found
              </span>
            </div>

            <input
              type="text"
              placeholder="Search origin location..."
              aria-label="Search departure location"
              value={originSearch}
              onChange={(e) => setOriginSearch(e.target.value)}
              className="w-full p-2 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2 focus:border-accent outline-none"
            />

            <select
              id="travel-origin-select"
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full mw-select mw-scrollbar p-2 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
              size={filteredOriginStops.length > 8 ? 6 : Math.max(3, filteredOriginStops.length)}
            >
              {isPlace(origin) && (
                <option value={origin}>{labelOf(origin)}</option>
              )}
              {filteredOriginStops.map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
            {originPlaces.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-serif font-bold uppercase text-fg-13">Places</div>
                <ul className="max-h-48 overflow-y-auto mw-scrollbar border border-line-11 divide-y divide-line-11 m-0 p-0 list-none">
                  {originPlaces.map((record) => (
                    <li key={record.key}>
                      <button
                        type="button"
                        onClick={() => { handleOriginChange(PLACE_PREFIX + record.key); setOriginSearch(""); }}
                        className="w-full text-left px-2 py-1.5 text-xs font-serif text-fg-2 bg-transparent border-0 hover:bg-surface-9"
                      >
                        {record.name}{" "}
                        <span className="text-[10px] text-fg-13">
                          {record.interior ? (sealed(record) ? sealedWay(record.key) : "inside") : formatRegionName(record.region || "") || "outdoors"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Destination Stop */}
          <div className="p-3 bg-surface-5 border border-line-11 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="travel-destination-select" className="text-xs uppercase font-serif font-bold text-fg-7">
                Destination Location
              </label>
              <span className="text-[10px] font-mono text-fg-13">
                {filteredDestStops.length} stops found
              </span>
            </div>

            <input
              type="text"
              placeholder="Search destination location..."
              aria-label="Search destination location"
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              className="w-full p-2 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2 focus:border-accent outline-none"
            />

            <select
              id="travel-destination-select"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full mw-select mw-scrollbar p-2 text-xs font-serif bg-surface-1 border border-line-9 text-fg-2"
              size={filteredDestStops.length > 8 ? 6 : Math.max(3, filteredDestStops.length)}
            >
              {isPlace(destination) && (
                <option value={destination}>{labelOf(destination)}</option>
              )}
              {filteredDestStops.map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
            {destPlaces.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-serif font-bold uppercase text-fg-13">Places</div>
                <ul className="max-h-48 overflow-y-auto mw-scrollbar border border-line-11 divide-y divide-line-11 m-0 p-0 list-none">
                  {destPlaces.map((record) => (
                    <li key={record.key}>
                      <button
                        type="button"
                        onClick={() => { handleDestinationChange(PLACE_PREFIX + record.key); setDestSearch(""); }}
                        className="w-full text-left px-2 py-1.5 text-xs font-serif text-fg-2 bg-transparent border-0 hover:bg-surface-9"
                      >
                        {record.name}{" "}
                        <span className="text-[10px] text-fg-13">
                          {record.interior ? (sealed(record) ? sealedWay(record.key) : "inside") : formatRegionName(record.region || "") || "outdoors"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <details className="calculation-notes">
            <summary>How this is calculated</summary>
            <div>
              <ul>
                <li>Your choice of fewest legs, least gold or fastest route sets the first priority. If routes tie, the other two measures decide.</li>
                <li>Fares are estimates based on distance, followers and your Mercantile, Personality and Luck. The provider&apos;s disposition is estimated from their usual value, your Personality and whether you share a race. Factions, bounties and diseases can change the price in-game.</li>
                <li>Before haggling, the fare is distance ÷ 4,000, at least 1 gold, multiplied by 1 + the number of followers. Guild Guides use a base fare of 10 gold and take no time; other transport takes distance ÷ 16,000 in-game hours. Distance uses the game&apos;s units.</li>
                <li>Routes include Silt Striders, boats, Guild Guides, gondolas, Pack Guar, Sky Lamps, carriages and River Striders. Guild Guides require Mages Guild membership; some mainland links also require Conjurer rank.</li>
                <li>Divine and Almsivi Intervention follow OpenMW&apos;s search through nearby map cells, so the landing point may not be the nearest in a straight line. Indoors, the search starts from the first door out. A loaded save selects known spells or carried scrolls; scrolls are one use, but the planner does not spend them.</li>
                <li>Walking uses your Speed, Athletics and carried weight. Routes avoid slopes steeper than 46°, pass through the Ghostgate and swim only near land. Constant Water Walking allows walking across water; constant Levitate allows direct flight when faster. Buildings and boulders may still block a planned path.</li>
                <li>Indoor routes name the doors and rooms to pass through, including rooms reached by teleport. Time spent indoors is not counted.</li>
                <li>Propylons need their indices; the Master Index adds travel through Caldera. Tick the teleport items you carry. Quest teleports are left out unless you include them; check the quest conditions shown on those legs.</li>
                <li>Mark and Recall are not included.</li>
              </ul>
            </div>
          </details>
        </div>

        {/* Right Pane: Turn-by-Turn Route Itinerary Dossier */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-line-9 pb-1.5">
            <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider">
              Route Dossier
            </h3>
            <span
              className={`px-2.5 py-0.5 border text-xs font-mono font-bold ${
                route.isValid
                  ? route.hops === 0
                    ? "border-line-9 bg-surface-9 text-fg-7"
                    : "border-success-line-4 bg-success-surface-2 text-success-3"
                  : "border-danger-line-3 bg-danger-surface-2 text-danger-7"
              }`}
            >
              {route.isValid
                ? route.hops === 0
                  ? "At Destination"
                  : `${route.hops} ${route.hops === 1 ? "Leg" : "Legs"}${
                      route.totals?.goldKnown && priced ? ` · ${route.totals.gold} gold` : ""
                    }${route.totals?.hoursKnown && priced ? ` · ${formatDuration(route.totals.hours)}` : ""}`
                : "No Route"}
            </span>
          </div>

          {/* Route Status Card */}
          <div className="p-4 bg-surface-5 border border-line-11 space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-line-11">
              <div>
                <span className="text-fg-13 uppercase font-serif font-bold block text-[10px]">
                  Origin
                </span>
                <span className="text-sm font-serif font-bold text-fg-2">{labelOf(origin)}</span>
              </div>
              <div className="text-center font-mono text-fg-13">
                {route.hops > 0 ? `--> ${route.hops} transit legs -->` : "=="}
              </div>
              <div className="text-right">
                <span className="text-fg-13 uppercase font-serif font-bold block text-[10px]">
                  Destination
                </span>
                <span className="text-sm font-serif font-bold text-fg-2">{labelOf(destination)}</span>
              </div>
            </div>

            {/* Turn by turn steps list */}
            {route.isValid ? (
              route.steps.length === 0 ? (
                <div className="p-4 text-center text-sm font-serif text-fg-9 bg-surface-3 border border-line-11">
                  You are already at {labelOf(origin)}. No transit required.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs uppercase font-serif font-bold text-fg-7">
                    Turn-By-Turn Navigation:
                  </div>
                  {route.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="flex items-center justify-between gap-3 p-2.5 bg-surface-3 border border-line-11"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="text-xs font-serif font-bold text-fg-2">
                          Leg {step.stepNumber}: {labelOf(step.from)} to {labelOf(step.to)}
                        </div>
                        {step.stepNumber === 1 && step.walk && isPlace(step.from) && doorChain(step.from.slice(PLACE_PREFIX.length), access).length > 0 && (
                          <div className="text-[11px] text-fg-9">
                            Leave by the doors: {doorChain(step.from.slice(PLACE_PREFIX.length), access).map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")} → outside
                          </div>
                        )}
                        <div className="text-[11px] text-fg-13">
                          {step.indoors
                            ? `Go through the doors: ${(step.doors || []).map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")}`
                            : step.walk && step.levitate
                            ? `Levitate about ${(step.distance / CELL).toFixed(1)} cells ${step.direction} to ${labelOf(step.to)}, straight over whatever is below`
                            : step.walk
                            ? step.terrain
                              ? `Walk about ${(step.distance / CELL).toFixed(1)} cells, heading ${step.direction}, to ${labelOf(step.to)}`
                                + (step.straight && step.distance > step.straight * 1.15
                                  ? `, round high ground: ${(step.distance / step.straight).toFixed(1)}× the straight line`
                                  : "")
                                + (step.water ? `, ${step.waterWalk ? "walking on the water for" : "swimming"} about ${Math.max(0.1, step.water / CELL).toFixed(1)} cells of it` : "")
                              : `Walk about ${(step.distance / CELL).toFixed(1)} cells ${step.direction} to ${labelOf(step.to)}, in a straight line`
                            : step.teleport
                            ? `${step.label} at ${labelOf(step.from)}${step.board ? `, ${step.board}` : ""}`
                            : <>
                                {step.spell ? `Cast ${step.kind}` : `Take the ${step.kind}`}
                                {step.providerName ? ` (${step.providerName})` : ""} from {labelOf(step.from)}
                                {step.board ? `, ${step.board}` : ""}
                                {step.alight ? ` to ${labelOf(step.to)}, ${step.alight}` : ""}
                              </>}
                        </div>
                        {step.stepNumber === route.steps.length && step.walk && isPlace(step.to) && doorChain(step.to.slice(PLACE_PREFIX.length), access).length > 0 && (
                          <div className="text-[11px] text-fg-9">
                            Go in by the doors: outside → {doorChain(step.to.slice(PLACE_PREFIX.length), access).reverse().map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")}
                          </div>
                        )}
                        {step.questGated && (
                          <div className="text-[11px] text-warning-2">
                            Quest teleport{step.conditions?.length ? `: ${step.conditions.join("; ")}` : ""}.
                          </div>
                        )}
                        {step.ambiguous && (
                          <div className="text-[11px] text-warning-2">
                            From some rooms here the spell may land elsewhere; the engine&apos;s door order decides.
                          </div>
                        )}
                        {step.kind === "Guild Guide" && (
                          <div className="guild-guide-members text-[11px] text-fg-9">Mages Guild members only.</div>
                        )}
                        {(Number.isFinite(step.gold) || Number.isFinite(step.hours)) && (
                          <div className="text-[11px] font-mono text-fg-9">
                            {Number.isFinite(step.gold) ? `${step.gold} gold` : "price unknown"}
                            {step.indoors ? " · time indoors not counted"
                              : Number.isFinite(step.hours) ? ` · ${step.hours === 0 ? "no time passes" : formatDuration(step.hours)}` : ""}
                          </div>
                        )}
                      </div>
                      <span
                        className={`shrink-0 whitespace-nowrap px-2 py-0.5 text-xs font-serif font-bold border ${getServiceBadge(
                          step.kind
                        )}`}
                      >
                        {step.kind}
                      </span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="p-4 text-center text-sm font-serif text-danger-7 bg-danger-surface-2 border border-danger-line-3">
                {route.message || "No fast-travel route found between these locations."}
              </div>
            )}
          </div>

          {route.isValid && route.totals?.goldKnown && Number.isFinite(activeSave?.save?.vitals?.gold)
            && route.totals.gold > activeSave.save.vitals.gold && (
            <p role="alert" className="text-[11px] text-warning-2 font-serif m-0">
              This route costs {route.totals.gold} gold; {activeSave.save.identity?.name || "your character"} carries {activeSave.save.vitals.gold}.
            </p>
          )}
          {route.isValid && route.hops > 0 && priced && firstSeller && (
            <p className="text-[11px] text-fg-13 font-serif m-0">
              Fares for {sheet ? "your character" : "a starting character"}: Mercantile {player.mercantile}, Personality {player.personality}, Luck {player.luck}
              {followers > 0 ? `, ${followers} follower${followers === 1 ? "" : "s"}` : ""}. A typical caravaner&apos;s estimated disposition toward you is {travelDisposition(firstSeller, player, settings)}.
            </p>
          )}

          {/* Full Path Overview */}
          {route.isValid && route.path.length > 1 && (
            <div className="p-3 bg-surface-5 border border-line-11 space-y-2">
              <div className="text-xs uppercase font-serif font-bold text-fg-7">
                Complete Waypoint Chain:
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs font-serif">
                {route.path.map((node, i) => (
                  <span key={node} className="flex items-center gap-1">
                    <span
                      className={`font-bold ${
                        i === 0 || i === route.path.length - 1
                          ? "text-accent"
                          : "text-fg-2"
                      }`}
                    >
                      {labelOf(node)}
                    </span>
                    {i < route.path.length - 1 && (
                      <span className="text-fg-13 mx-1">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mapData && (
            <TransitMap
              edges={[...mapData.edges, ...routeSpellEdges]}
              positions={routePositions}
              regions={mapData.regions}
              unplaced={mapData.unplaced}
              route={route}
              labelOf={labelOf}
              origin={origin}
              destination={destination}
              onSelectStop={(stop) => {
                setDestSearch("");
                handleDestinationChange(stop);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
