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
  INTERVENTION_KINDS,
  ROUTE_OBJECTIVES
} from "../../../lib/travel-graph.mjs";
import { resolveStopPositions, regionLabels, mapEdges, formatRegionName } from "../../../lib/travel-map.mjs";
import {
  stopPoints,
  addStopWalks,
  addPlaces,
  runSpeed,
  formatDuration,
  placePoints,
  doorChain,
  isPlace,
  PLACE_PREFIX,
  CELL
} from "../../../lib/travel-walk.mjs";
import TransitMap from "./transit-map";

const POPULAR_HUBS = [
  { name: "Seyda Neen", desc: "Arrival Port", vanillaOnly: false },
  { name: "Balmora", desc: "Central Hub", vanillaOnly: false },
  { name: "Vivec", desc: "Cantons Transit", vanillaOnly: false },
  { name: "Ald-ruhn", desc: "Redoran Gateway", vanillaOnly: false },
  { name: "Sadrith Mora", desc: "Telvanni Coast", vanillaOnly: false },
  { name: "Old Ebonheart", desc: "Imperial Mainland", trOnly: true }
];

export default function TravelWorkstation() {
  const { build, sheet: buildSheet, activeSave } = useActiveCharacter();
  const sheet = activeSave?.sheet || buildSheet;
  const { world } = useShell();
  const isTr = world === "tr";
  const gameData = useGameData('travel', { enabled: true });
  const [origin, setOrigin] = useState("Seyda Neen");
  const [destination, setDestination] = useState("Vivec");
  const [mageGuild,setMageGuild] = useState(true);
  const [conjurer,setConjurer] = useState(false);
  const [objective, setObjective] = useState("hops");
  const [followers, setFollowers] = useState(0);
  const [spells, setSpells] = useState({ divine: false, almsivi: false });
  const [walking, setWalking] = useState(true);

  // A loaded save says which intervention the character can cast: the spell or a scroll.
  useEffect(() => {
    if (activeSave?.save) setSpells(interventionsFromSave(activeSave.save));
  }, [activeSave]);

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

  // Walking: straight lines between nearby stops, and to any place in the game, kept out
  // of the sea by the Access catalog's land mask and timed by this character's run speed.
  const access = useMemo(() => {
    const records = gameData.data?.catalogs?.Access;
    const land = gameData.data?.metadata?.Access?.land;
    return Array.isArray(records) && land ? { records, land } : null;
  }, [gameData.data]);
  const speed = useMemo(() => runSpeed(player, settings), [player, settings]);
  const points = useMemo(() => stopPoints({
    records: gameData.data?.catalogs?.Travel || [],
    nodes: gameData.data?.metadata?.Travel?.nodes || {},
    access, intervention
  }), [gameData.data, access, intervention]);
  const routingGraph = useMemo(
    () => (walking && access ? addStopWalks(spellGraph, points, access.land, speed) : spellGraph),
    [walking, access, spellGraph, points, speed]
  );

  // Every place in the game, for the pickers and for naming a place on the route.
  const places = useMemo(
    () => new Map((gameData.data?.catalogs?.Places || []).map((record) => [record.key, record])),
    [gameData.data]
  );
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
    return getAvailableTransitStops(world, routingGraph);
  }, [world, routingGraph]);

  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");

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

  // Any named place matching a search: tombs, caves, houses, shops. Needs Access to route.
  const placeMatches = useCallback((query) => {
    const q = query.trim().toLowerCase();
    if (!access || q.length < 2) return [];
    const stops = new Set(availableStops.map((stop) => stop.toLowerCase()));
    const found = [];
    for (const record of places.values()) {
      if (!record.name || stops.has(record.name.toLowerCase()) || !record.name.toLowerCase().includes(q)) continue;
      found.push(record);
    }
    return found.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 30);
  }, [access, places, availableStops]);
  const originPlaces = useMemo(() => placeMatches(originSearch), [placeMatches, originSearch]);
  const destPlaces = useMemo(() => placeMatches(destSearch), [placeMatches, destSearch]);
  const sealed = useCallback((record) => record.interior && !placePoints(record.key, access).length, [access]);

  // Compute route: fewest legs, least gold for this character, or fewest in-game hours.
  const planGraph = useMemo(() => {
    const chosen = [origin, destination].filter(isPlace).map((id) => id.slice(PLACE_PREFIX.length));
    if (!chosen.length) return routingGraph;
    return addPlaces(routingGraph, chosen, {
      points, access, land: walking ? access?.land : null, speed, intervention, spells
    });
  }, [origin, destination, routingGraph, points, access, walking, speed, intervention, spells]);
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
    .filter((step) => step.spell || step.walk)
    .map((step) => {
      const [a, b] = step.from < step.to ? [step.from, step.to] : [step.to, step.from];
      return { a, b, kind: step.kind };
    }), [route]);
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
            Morrowind Travel &amp; Transport Route Planner
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
          <span className="font-bold text-fg-2 whitespace-nowrap">
            {build.race || "Adventurer"} {build.className || "Custom"}
          </span>
          <span className="text-fg-13 hidden sm:inline">·</span>
          <span className="text-fg-9 whitespace-nowrap">
            Network:{" "}
            <strong className="text-accent">
              {isTr ? "Tamriel Rebuilt" : "Vvardenfell (Vanilla)"}
            </strong>
          </span>
          <span className="text-fg-13 hidden sm:inline">·</span>
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
        </div>
      </div>

      {/* Quick Hub Jump Presets */}
      <div className="flex flex-wrap gap-4 p-3 text-sm">
        <label><input type="checkbox" checked={mageGuild} onChange={event=>setMageGuild(event.target.checked)}/> Mages Guild member</label>
        {isTr && <label><input type="checkbox" checked={conjurer} disabled={!mageGuild} onChange={event=>setConjurer(event.target.checked)}/> Conjurer rank or higher</label>}
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
          </label>
        ))}
        {access && (
          <label className="whitespace-nowrap">
            <input type="checkbox" checked={walking} onChange={(event) => setWalking(event.target.checked)} /> Walk between nearby places
          </label>
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
        {gameData.status === 'loading' && <p role="status">Loading travel network...</p>}
        {gameData.status === 'error' && <p role="alert">Travel network unavailable. <button onClick={gameData.retry}>Retry</button></p>}
      </div>
      <div className="p-3 bg-surface-5 border border-line-11 space-y-2">
        <div className="text-xs font-serif font-bold text-fg-7 uppercase tracking-wider">
          Fast Origin Selector
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
                {hub.name} <span className="text-[10px] opacity-75">({hub.desc})</span>
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
                        className="w-full text-left px-2 py-1.5 text-xs font-serif text-fg-2 hover:bg-surface-9"
                      >
                        {record.name}{" "}
                        <span className="text-[10px] text-fg-13">
                          {record.interior ? (sealed(record) ? "inside, no door out" : "inside") : formatRegionName(record.region || "") || "outdoors"}
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
                        className="w-full text-left px-2 py-1.5 text-xs font-serif text-fg-2 hover:bg-surface-9"
                      >
                        {record.name}{" "}
                        <span className="text-[10px] text-fg-13">
                          {record.interior ? (sealed(record) ? "inside, no door out" : "inside") : formatRegionName(record.region || "") || "outdoors"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Network Notes */}
          <div className="p-3 bg-surface-2 border border-line-11 text-xs text-fg-13 space-y-1 font-serif">
            <div className="font-bold text-fg-7 uppercase tracking-wider text-[10px]">Transit Engine Rules:</div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-fg-11 leading-relaxed">
              <li>Routes come from a shortest-path search over fewest legs, least gold or fewest in-game hours, each breaking ties with the other two.</li>
              <li>Fares follow OpenMW&apos;s travel window: distance ÷ fTravelMult (4000), at least 1 gold, times one plus your followers, then haggled with your Mercantile, Personality and Luck. Guild Guides charge a flat 10 gold and take no time; other journeys take distance ÷ fTravelTimeMult (16000) hours.</li>
              <li>Each provider&apos;s disposition is estimated from their base value, a shared race and your Personality. Faction standing, a bounty or a disease moves it further, so a fare can differ by a few gold.</li>
              <li>Network covers Silt Striders, Pack Guar caravans, Sky Lamps, carriages, Boats, Guild Guides, Gondoliers, and Mainland River Striders.</li>
              <li>Guild Guide teleports require active Mages Guild membership (Conjurer rank for restricted mainland conduits).</li>
              <li>Divine and Almsivi Intervention land where OpenMW&apos;s marker search puts you: the markers on the smallest square ring of cells around you, not the nearest in a straight line, and indoors the first door out. Tick the spells your character can cast; a loaded save ticks them for you.</li>
              <li>Walking joins any place to the network: a straight line at your run speed (Speed and Athletics, carrying nothing), refused where it would swim more than 2,048 units of open sea. Real paths around hills take longer. Indoors, the route names the doors on the way in and out.</li>
              <li>Propylon chambers, Mark and Recall are not included yet.</li>
            </ul>
          </div>
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
                      className="flex items-center justify-between p-2.5 bg-surface-3 border border-line-11"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-serif font-bold text-fg-2">
                          Leg {step.stepNumber}: {labelOf(step.from)} to {labelOf(step.to)}
                        </div>
                        {step.stepNumber === 1 && isPlace(step.from) && doorChain(step.from.slice(PLACE_PREFIX.length), access).length > 0 && (
                          <div className="text-[11px] text-fg-9">
                            Leave by the doors: {doorChain(step.from.slice(PLACE_PREFIX.length), access).map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")} → outside
                          </div>
                        )}
                        <div className="text-[11px] text-fg-13">
                          {step.walk
                            ? `Walk about ${(step.distance / CELL).toFixed(1)} cells ${step.direction} to ${labelOf(step.to)}, in a straight line`
                            : <>
                                {step.spell ? `Cast ${step.kind}` : `Take the ${step.kind}`}
                                {step.providerName ? ` (${step.providerName})` : ""} from {labelOf(step.from)}
                                {step.board ? `, ${step.board}` : ""}
                                {step.alight ? ` to ${labelOf(step.to)}, ${step.alight}` : ""}
                              </>}
                        </div>
                        {step.stepNumber === route.steps.length && isPlace(step.to) && doorChain(step.to.slice(PLACE_PREFIX.length), access).length > 0 && (
                          <div className="text-[11px] text-fg-9">
                            Go in by the doors: outside → {doorChain(step.to.slice(PLACE_PREFIX.length), access).reverse().map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")}
                          </div>
                        )}
                        {step.ambiguous && (
                          <div className="text-[11px] text-warning-2">
                            From some rooms here the spell may land elsewhere; the engine&apos;s door order decides.
                          </div>
                        )}
                        {(Number.isFinite(step.gold) || Number.isFinite(step.hours)) && (
                          <div className="text-[11px] font-mono text-fg-9">
                            {Number.isFinite(step.gold) ? `${step.gold} gold` : "price unknown"}
                            {Number.isFinite(step.hours) ? ` · ${step.hours === 0 ? "no time passes" : formatDuration(step.hours)}` : ""}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-serif font-bold border ${getServiceBadge(
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
                      {node}
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
              positions={mapData.positions}
              edges={[...mapData.edges, ...routeSpellEdges]}
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
