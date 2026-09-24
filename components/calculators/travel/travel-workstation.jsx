"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import { useSearchIntent } from "../../use-search-intent";
import { clearSearchIntent } from "../../../lib/search-intent.mjs";
import {
  getAvailableTransitStops,
  findFewestHopsRoute,
  adaptTravelGraph,
  RAW_GRAPH,
  VANILLA_STOPS
} from "../../../lib/travel-graph.mjs";
import { resolveStopPositions, regionLabels, mapEdges } from "../../../lib/travel-map.mjs";
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
  const { build } = useActiveCharacter();
  const { world } = useShell();
  const isTr = world === "tr";
  const gameData = useGameData('travel', { enabled: true });
  const [mageGuild,setMageGuild] = useState(true);
  const [conjurer,setConjurer] = useState(false);

  const liveNetworkGraph = useMemo(() => {
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.Travel)) {
      const records = gameData.data.catalogs.Travel;
      const nodes = gameData.data.metadata?.Travel?.nodes || {};
      return adaptTravelGraph(records, nodes, {mageGuild,conjurer:isTr && conjurer});
    }
    return {};
  }, [gameData.status, gameData.data,mageGuild,conjurer,isTr]);

  // Stop positions, network edges and region labels for the transit map (live bundle only).
  const mapData = useMemo(() => {
    if (!liveNetworkGraph) return null;
    const { positions, unplaced } = resolveStopPositions(
      gameData.data?.metadata?.Travel?.nodes || {},
      gameData.data?.metadata?.Places?.settlements || []
    );
    // Only stops that are part of the network, so the map and the stop count agree.
    const onNetwork = Object.fromEntries(Object.entries(positions).filter(([stop]) => liveNetworkGraph[stop]));
    if (!Object.keys(onNetwork).length) return null;
    return {
      positions: onNetwork,
      unplaced: unplaced.filter((stop) => liveNetworkGraph[stop]),
      edges: mapEdges(liveNetworkGraph),
      regions: regionLabels(gameData.data?.catalogs?.Places || [])
    };
  }, [liveNetworkGraph, gameData.data]);

  const availableStops = useMemo(() => {
    return getAvailableTransitStops(world, liveNetworkGraph);
  }, [world, liveNetworkGraph]);

  const [origin, setOrigin] = useState("Seyda Neen");
  const [destination, setDestination] = useState("Vivec");

  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");

  // Ensure selected stops exist in current world
  useEffect(() => {
    if (availableStops.length > 0) {
      if (!availableStops.includes(origin)) {
        setOrigin(availableStops[0]);
      }
      if (!availableStops.includes(destination)) {
        setDestination(availableStops[availableStops.length - 1] || availableStops[0]);
      }
    }
  }, [world, availableStops, origin, destination]);

  // Sync with legacy DOM elements if they exist
  useEffect(() => {
    if (typeof document === "undefined") return;
    const domFrom = document.getElementById("trv-from");
    const domTo = document.getElementById("trv-to");

    if (domFrom && domFrom.value !== origin && availableStops.includes(domFrom.value)) {
      setOrigin(domFrom.value);
    }
    if (domTo && domTo.value !== destination && availableStops.includes(domTo.value)) {
      setDestination(domTo.value);
    }
  }, [availableStops, origin, destination]);

  // Push updates to legacy DOM
  const handleOriginChange = (val) => {
    setOrigin(val);
    if (typeof document !== "undefined") {
      const domFrom = document.getElementById("trv-from");
      if (domFrom && domFrom.value !== val) {
        domFrom.value = val;
        domFrom.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  const handleDestinationChange = (val) => {
    setDestination(val);
    if (typeof document !== "undefined") {
      const domTo = document.getElementById("trv-to");
      if (domTo && domTo.value !== val) {
        domTo.value = val;
        domTo.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

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

  // Compute route
  const route = useMemo(() => {
    return findFewestHopsRoute(origin, destination, world, liveNetworkGraph);
  }, [origin, destination, world, liveNetworkGraph]);

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
      default:
        return "border-line-9 bg-surface-5 text-accent";
    }
  };

  return (
    <div className="travel-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-6">
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
              {filteredOriginStops.map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
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
              {filteredDestStops.map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            </select>
          </div>

          {/* Network Notes */}
          <div className="p-3 bg-surface-2 border border-line-11 text-xs text-fg-13 space-y-1">
            <div className="font-serif font-bold text-fg-7">Transit Rules:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Includes Silt Striders, Boats, Guild Guides, and River Striders.</li>
              <li>Propylon Chambers and Divine/Almsivi Intervention are excluded.</li>
              <li>Shortest path calculated by minimum transit connections (hops).</li>
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
                  : `${route.hops} ${route.hops === 1 ? "Hop" : "Hops"}`
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
                <span className="text-sm font-serif font-bold text-fg-2">{origin}</span>
              </div>
              <div className="text-center font-mono text-fg-13">
                {route.hops > 0 ? `--> ${route.hops} transit legs -->` : "=="}
              </div>
              <div className="text-right">
                <span className="text-fg-13 uppercase font-serif font-bold block text-[10px]">
                  Destination
                </span>
                <span className="text-sm font-serif font-bold text-fg-2">{destination}</span>
              </div>
            </div>

            {/* Turn by turn steps list */}
            {route.isValid ? (
              route.steps.length === 0 ? (
                <div className="p-4 text-center text-sm font-serif text-fg-9 bg-surface-3 border border-line-11">
                  You are already at {origin}. No transit required.
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
                          Leg {step.stepNumber}: {step.from} to {step.to}
                        </div>
                        <div className="text-[11px] text-fg-13">
                          Take the {step.kind} service from {step.from}
                        </div>
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
              edges={mapData.edges}
              regions={mapData.regions}
              unplaced={mapData.unplaced}
              route={route}
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
