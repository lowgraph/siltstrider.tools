"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useGameData } from "../../use-game-data";
import {
  getAvailableTransitStops,
  findFewestHopsRoute,
  adaptTravelGraph,
  RAW_GRAPH,
  VANILLA_STOPS
} from "../../../lib/travel-graph.mjs";

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

  const liveNetworkGraph = useMemo(() => {
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.Travel)) {
      const records = gameData.data.catalogs.Travel;
      const nodes = gameData.data.metadata?.Travel?.nodes || {};
      const adapted = adaptTravelGraph(records, nodes);
      if (Object.keys(adapted).length > 0) return adapted;
    }
    return null;
  }, [gameData.status, gameData.data]);

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
        return "border-[#8a5d2e] bg-[#291b0d] text-[#e0b070]";
      case "Guild Guide":
        return "border-[#4a5878] bg-[#141b26] text-[#9bb0d4]";
      case "Boat":
        return "border-[#385e54] bg-[#10211d] text-[#86bfaf]";
      case "River Strider":
        return "border-[#68582d] bg-[#211c0f] text-[#d6be78]";
      case "Gondolier":
        return "border-[#5c4a38] bg-[#1f1913] text-[#cfb699]";
      default:
        return "border-[#3d301e] bg-[#18130c] text-[#d4b06a]";
    }
  };

  return (
    <div className="travel-workstation p-4 sm:p-5 border border-[#3a2e1d] bg-[#14100a] text-[#f3e6c8] space-y-6">
      {/* Top Banner: Active Character & World Profile Strip & Live Game-Data Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#19140c] border border-[#2a2215]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-serif font-bold text-[#d4b06a] uppercase tracking-wider whitespace-nowrap">
            Active Character:
          </span>
          <span className="font-bold text-[#f3e6c8] whitespace-nowrap">
            {build.race || "Adventurer"} {build.className || "Custom"}
          </span>
          <span className="text-[#8e7e65] hidden sm:inline">·</span>
          <span className="text-[#a8997c] whitespace-nowrap">
            Network:{" "}
            <strong className="text-[#d4b06a]">
              {isTr ? "Tamriel Rebuilt" : "Vvardenfell (Vanilla)"}
            </strong>
          </span>
          <span className="text-[#8e7e65] hidden sm:inline">·</span>
          <span className="text-[#a8997c] whitespace-nowrap">
            Stops: <strong className="text-[#d4b06a]">{availableStops.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {gameData.status === 'ready' ? (
            <span className="text-xs px-2 py-0.5 rounded border border-[#3a4e28] bg-[#10190c] text-[#78d65c] font-mono flex items-center gap-1.5 shadow-inner" title={`Loaded from content-addressed bundle ${gameData.bundleId || ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#52d634] inline-block"/>
              <span>Live: {availableStops.length} Stops ({gameData.data?.profile?.toUpperCase() || activeWorld.toUpperCase()})</span>
            </span>
          ) : gameData.status === 'loading' ? (
            <span className="text-xs px-2 py-0.5 rounded border border-[#4a3e20] bg-[#1a150c] text-[#d4b06a] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4b06a] inline-block animate-pulse"/>
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
      <div className="p-3 bg-[#17120b] border border-[#2a2215] space-y-2">
        <div className="text-xs font-serif font-bold text-[#c2b291] uppercase tracking-wider">
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
                    ? "border-[#d4b06a] bg-[#2a2215] text-[#d4b06a]"
                    : "border-[#3d301e] bg-[#14100a] text-[#a8997c] hover:border-[#8e7e65] hover:text-[#f3e6c8]"
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
          <h3 className="text-sm font-serif font-bold text-[#d4b06a] uppercase tracking-wider border-b border-[#3a2e1d] pb-1.5">
            Transit Itinerary Setup
          </h3>

          {/* Origin Stop */}
          <div className="p-3 bg-[#18130c] border border-[#2a2215] space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="travel-origin-select" className="text-xs uppercase font-serif font-bold text-[#c2b291]">
                Origin Location
              </label>
              <span className="text-[10px] font-mono text-[#8e7e65]">
                {filteredOriginStops.length} stops found
              </span>
            </div>

            <input
              type="text"
              placeholder="Search origin location..."
              value={originSearch}
              onChange={(e) => setOriginSearch(e.target.value)}
              className="w-full p-2 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8] focus:border-[#d4b06a] outline-none"
            />

            <select
              id="travel-origin-select"
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full mw-select mw-scrollbar p-2 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
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
          <div className="p-3 bg-[#18130c] border border-[#2a2215] space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="travel-destination-select" className="text-xs uppercase font-serif font-bold text-[#c2b291]">
                Destination Location
              </label>
              <span className="text-[10px] font-mono text-[#8e7e65]">
                {filteredDestStops.length} stops found
              </span>
            </div>

            <input
              type="text"
              placeholder="Search destination location..."
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
              className="w-full p-2 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8] focus:border-[#d4b06a] outline-none"
            />

            <select
              id="travel-destination-select"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full mw-select mw-scrollbar p-2 text-xs font-serif bg-[#0c0906] border border-[#3a2e1d] text-[#f3e6c8]"
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
          <div className="p-3 bg-[#100d08] border border-[#261e13] text-xs text-[#8e7e65] space-y-1">
            <div className="font-serif font-bold text-[#c2b291]">Transit Rules:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Includes Silt Striders, Boats, Guild Guides, and River Striders.</li>
              <li>Propylon Chambers and Divine/Almsivi Intervention are excluded.</li>
              <li>Shortest path calculated by minimum transit connections (hops).</li>
            </ul>
          </div>
        </div>

        {/* Right Pane: Turn-by-Turn Route Itinerary Dossier */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#3a2e1d] pb-1.5">
            <h3 className="text-sm font-serif font-bold text-[#d4b06a] uppercase tracking-wider">
              Route Dossier
            </h3>
            <span
              className={`px-2.5 py-0.5 border text-xs font-mono font-bold ${
                route.isValid
                  ? route.hops === 0
                    ? "border-[#3d301e] bg-[#1f1910] text-[#c2b291]"
                    : "border-[#315723] bg-[#182613] text-[#78d46a]"
                  : "border-[#5e2727] bg-[#2b1414] text-[#d46a6a]"
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
          <div className="p-4 bg-[#18130c] border border-[#2a2215] space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2a2215]">
              <div>
                <span className="text-[#8e7e65] uppercase font-serif font-bold block text-[10px]">
                  Origin
                </span>
                <span className="text-sm font-serif font-bold text-[#f3e6c8]">{origin}</span>
              </div>
              <div className="text-center font-mono text-[#8e7e65]">
                {route.hops > 0 ? `--> ${route.hops} transit legs -->` : "=="}
              </div>
              <div className="text-right">
                <span className="text-[#8e7e65] uppercase font-serif font-bold block text-[10px]">
                  Destination
                </span>
                <span className="text-sm font-serif font-bold text-[#f3e6c8]">{destination}</span>
              </div>
            </div>

            {/* Turn by turn steps list */}
            {route.isValid ? (
              route.steps.length === 0 ? (
                <div className="p-4 text-center text-sm font-serif text-[#a8997c] bg-[#14100a] border border-[#2a2215]">
                  You are already at {origin}. No transit required.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs uppercase font-serif font-bold text-[#c2b291]">
                    Turn-By-Turn Navigation:
                  </div>
                  {route.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="flex items-center justify-between p-2.5 bg-[#14100a] border border-[#2a2215]"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-serif font-bold text-[#f3e6c8]">
                          Leg {step.stepNumber}: {step.from} to {step.to}
                        </div>
                        <div className="text-[11px] text-[#8e7e65]">
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
              <div className="p-4 text-center text-sm font-serif text-[#d46a6a] bg-[#2b1414] border border-[#5e2727]">
                {route.message || "No fast-travel route found between these locations."}
              </div>
            )}
          </div>

          {/* Full Path Overview */}
          {route.isValid && route.path.length > 1 && (
            <div className="p-3 bg-[#17120b] border border-[#2a2215] space-y-2">
              <div className="text-xs uppercase font-serif font-bold text-[#c2b291]">
                Complete Waypoint Chain:
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs font-serif">
                {route.path.map((node, i) => (
                  <span key={node} className="flex items-center gap-1">
                    <span
                      className={`font-bold ${
                        i === 0 || i === route.path.length - 1
                          ? "text-[#d4b06a]"
                          : "text-[#f3e6c8]"
                      }`}
                    >
                      {node}
                    </span>
                    {i < route.path.length - 1 && (
                      <span className="text-[#8e7e65] mx-1">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
