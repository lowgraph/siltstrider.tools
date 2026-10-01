"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { cheapestTradeoff } from "../../../lib/travel-tradeoff.mjs";
import { realTimeText, formatRealDuration } from "../../../lib/travel-real-time.mjs";
import { useActiveCharacter } from "../../character-context";
import { useShell } from "../../shell-context";
import { useAccountSettings } from '../../account-settings-context';
import { accountToolChoices, defaultAccountSettings, resolveAccountTravelOptions } from '../../../lib/account-settings.mjs';
import { useGameData } from "../../use-game-data";
import { useSearchIntent } from "../../use-search-intent";
import { clearSearchIntent } from "../../../lib/search-intent.mjs";
import {
  getAvailableTransitStops,
  planRoute,
  journeyGold,
  travelDisposition,
  saveMarks,
  interventionMarkText,
  guildFromSave,
  guildGuideNotice,
  INTERVENTION_KINDS,
  ROUTE_OBJECTIVES
} from "../../../lib/travel-graph.mjs";
import { regionLabels, mapEdges, formatRegionName } from "../../../lib/travel-map.mjs";
import {
  addStopWalks,
  addJourneyWalks,
  addPlaces,
  walkGrid,
  formatDuration,
  placePoints,
  doorChain,
  isPlace,
  placeFromSave,
  roomsThrough,
  PLACE_PREFIX,
  CELL
} from "../../../lib/travel-walk.mjs";
import { addTeleports, teleportItems, heldFromSave, usableTeleport } from "../../../lib/travel-teleports.mjs";
import { readRouteLink, writeRouteLink } from "../../../lib/travel-link.mjs";
import { movementFor, itemIndex, carriedWeight, constantEffects } from "../../../lib/travel-movement.mjs";
import TransitMap from "./transit-map";
import ActiveCharacterLink from "../../active-character-link";
import TravelLocationPicker from "./travel-location-picker";
import { buildTravelSearchOptions } from "../../../lib/travel-search.mjs";
import { travelSaveKey, readTravelOverrides, writeTravelOverrides } from "../../../lib/travel-options.mjs";
import { interventionAccess, withInterventionResources } from "../../../lib/travel-intervention-access.mjs";

import { buildTransitStops, addTransitInterventions, resolveTransitEndpoint, transitEndpointStops, transitStopId } from "../../../lib/travel-stops.mjs";

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
  const { world, profile = world } = useShell();
  const preferences = useAccountSettings();
  const accountDocument = preferences?.ready ? preferences.settings : null;
  const isTr = world === "tr";
  const gameData = useGameData('travel', { enabled: true });
  const [origin, setOrigin] = useState("Seyda Neen");
  const [destination, setDestination] = useState("Balmora");
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
  const saveKey = useMemo(() => travelSaveKey(activeSave?.save, profile), [activeSave?.save, profile]);
  const optionEdits = useRef({ key: undefined, values: {} });
  const sessionEdits = useRef({ key: undefined, values: {} });
  const sessionKey = `${preferences?.owner || 'guest'}:${profile}:${saveKey || 'manual'}`;
  const routeChoices = useRef(null);
  if (routeChoices.current === null && typeof window !== 'undefined') {
    const link = readRouteLink(window.location.search, ROUTE_OBJECTIVES);
    const shared = Boolean(link.from || link.to);
    routeChoices.current = {
      ...(shared || link.plan ? { objective: link.plan || 'hops' } : {}),
      ...(shared || link.walk !== null ? { walking: link.walk ?? true } : {}),
      ...(shared || link.quest !== null ? { questTeleports: link.quest ?? false } : {})
    };
  }
  const [rememberedCount, setRememberedCount] = useState(0);
  const [storageKept, setStorageKept] = useState(true);
  const [optionsRevision, setOptionsRevision] = useState(0);
  const spellAccess = useMemo(() => interventionAccess(activeSave?.save, {
    spellRecords: carryingData.data?.catalogs?.Spells,
    sheet: activeSave?.sheet
  }), [activeSave?.save, activeSave?.sheet, carryingData.data]);

  // The save's own standing with the Mages Guild decides which guides will serve.
  const saveGuild = useMemo(() => (activeSave?.save ? guildFromSave(activeSave.save) : null), [activeSave]);
  const guildNotice = guildGuideNotice(saveGuild, mageGuild);
  // A loaded save says which intervention the character can cast (the spell or a scroll)
  // and what it carries; options still holding those values are labelled "from your save".
  const saveSpells = useMemo(() => (activeSave?.save ? Object.fromEntries(
    Object.entries(spellAccess).map(([kind, option]) => [kind, option.defaultEnabled])
  ) : null), [activeSave?.save, spellAccess]);
  const saveSources = useMemo(() => (activeSave?.save ? Object.fromEntries(
    Object.entries(spellAccess).map(([kind, option]) => [kind, option.source])
  ) : null), [activeSave?.save, spellAccess]);
  const savedItems = useMemo(() => (activeSave?.save ? heldFromSave(activeSave.save) : null), [activeSave]);
  const marks = saveMarks(activeSave?.save ? { guild: saveGuild, spells: saveSpells } : null, { mageGuild, conjurer, spells });
  const globalChoices = accountDocument ? accountToolChoices(accountDocument, { world: profile }).travel : {};
  const values = { mageGuild, conjurer, divine: spells.divine, almsivi: spells.almsivi, waterWalking };
  const hasAccountSource = key => Object.hasOwn(globalChoices, key) && globalChoices[key] === values[key] &&
    (!activeSave?.save || accountDocument?.overrideSaveToggles) &&
    !(sessionEdits.current.key === sessionKey && Object.hasOwn(sessionEdits.current.values, key));
  const preferenceLabel = preferences?.owner ? 'account default' : 'browser default';

  const saveLoad = useMemo(() => {
    if (!activeSave?.save || carryingData.status !== 'ready') return null;
    const catalogs = carryingData.data?.catalogs || {};
    const items = itemIndex(catalogs);
    const { weight, unknown } = carriedWeight(activeSave.save, items);
    const effects = constantEffects(activeSave.save, items, { enchantments: catalogs.Enchantments, spells: catalogs.Spells });
    return { weight, unknown, ...effects };
  }, [activeSave, carryingData.status, carryingData.data]);

  // Apply fresh data as defaults, then edits. Late catalog loads must not retick
  // an option, and a different save/profile must not inherit another save's edits.
  useEffect(() => {
    if (!activeSave?.save && !preferences && optionEdits.current.key === saveKey) return;
    if (sessionEdits.current.key !== sessionKey) sessionEdits.current = { key: sessionKey, values: {} };
    if (optionEdits.current.key !== saveKey) {
      optionEdits.current = { key: saveKey, values: readTravelOverrides(saveKey) };
      setStorageKept(true);
    }
    const defaults = {
      mageGuild: saveGuild?.mageGuild ?? true, conjurer: saveGuild?.conjurer ?? false,
      divine: saveSpells?.divine ?? false, almsivi: saveSpells?.almsivi ?? false,
      held: savedItems || new Set(), carried: saveLoad?.weight ?? 0,
      levitate: saveLoad?.levitate ?? 0, waterWalking: (saveLoad?.waterWalking ?? 0) > 0
    };
    const restored = resolveAccountTravelOptions({
      settings: accountDocument || defaultAccountSettings(), selection: { world: profile },
      defaults: { ...defaults, walking: true, questTeleports: false, objective: 'hops' },
      saveDefaults: activeSave?.save ? defaults : null, saveOverrides: optionEdits.current.values,
      linkOverrides: routeChoices.current || {}, sessionOverrides: sessionEdits.current.values
    });
    setMageGuild(restored.mageGuild); setConjurer(restored.conjurer);
    setSpells({ divine: restored.divine && spellAccess.divine.available, almsivi: restored.almsivi && spellAccess.almsivi.available });
    setHeld(restored.held); setCarried(restored.carried);
    setLevitate(restored.levitate); setWaterWalking(restored.waterWalking);
    setWalking(restored.walking); setQuestTeleports(restored.questTeleports); setObjective(restored.objective);
    setFromSave(saveLoad);
    setRememberedCount(Object.keys(optionEdits.current.values).length);
  }, [saveKey, saveGuild, saveSpells, savedItems, saveLoad, activeSave?.save, optionsRevision, spellAccess, accountDocument, sessionKey]);

  const rememberChoice = (key, value) => {
    const current = sessionEdits.current.key === sessionKey ? sessionEdits.current.values : {};
    sessionEdits.current = { key: sessionKey, values: { ...current, [key]: key === 'held' ? { ...current.held, ...value } : value } };
    if (!activeSave?.save) return;
    if (['walking', 'questTeleports', 'objective'].includes(key)) return;
    const previous = optionEdits.current.key === saveKey ? optionEdits.current.values : readTravelOverrides(saveKey);
    const values = { ...previous, [key]: key === "held" ? { ...previous.held, ...value } : value };
    optionEdits.current = { key: saveKey, values };
    setStorageKept(writeTravelOverrides(saveKey, values));
    setRememberedCount(Object.keys(values).length);
  };
  const resetSaveOptions = () => {
    sessionEdits.current = { key: sessionKey, values: {} };
    optionEdits.current = { key: saveKey, values: {} };
    setStorageKept(writeTravelOverrides(saveKey, {}));
    setOptionsRevision(value => value + 1);
  };

  const transitNetwork = useMemo(() => {
    if (gameData.status === 'ready' && Array.isArray(gameData.data?.catalogs?.Travel)) {
      const records = gameData.data.catalogs.Travel;
      const nodes = gameData.data.metadata?.Travel?.nodes || {};
      const providers = gameData.data.metadata?.Travel?.providers || {};
      return buildTransitStops(records, nodes, { mageGuild, conjurer: isTr && conjurer, providers,
        access: { records: gameData.data.catalogs.Access || [] },
        teleports: (gameData.data.catalogs.Teleports || []).filter(t => usableTeleport(t, held, questTeleports)),
        intervention: { records: gameData.data.catalogs.Intervention || [], markers: gameData.data.metadata?.Intervention?.markers || {} }
      });
    }
    return buildTransitStops();
  }, [gameData.status, gameData.data,mageGuild,conjurer,isTr,held,questTeleports]);
  const liveNetworkGraph = transitNetwork.graph;

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
  const spellGraph = useMemo(() => addTransitInterventions(
    transitNetwork, intervention, spells
  ), [transitNetwork, intervention, spells]);

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
  const points = transitNetwork.points;
  const markerTarget = useCallback((kind, index) => transitNetwork.markerIds.get(`${kind}:${index}`), [transitNetwork]);
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
      nodes: transitNetwork.cellNodes, held, includeQuest: questTeleports,
      endpointFor: transitStopId,
      walk: { points, access, land: walking ? access?.land : null, speed, swim, fly, waterWalk: waterWalking, grid,
        intervention, spells, markerTarget, nodes: transitNetwork.cellNodes }
    }).graph;
  }, [walkGraph, teleports, transitNetwork, markerTarget, gameData.data, held, questTeleports, points, access, walking, speed, swim, fly, waterWalking, grid, intervention, spells]);

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
  }, [saveOrigin, activeSave, startedFrom]);

  const labelOf = useCallback((id) => {
    if (!isPlace(id)) return transitNetwork.stops.get(id)?.label || id;
    const key = id.slice(PLACE_PREFIX.length);
    const record = places.get(key);
    if (record?.name) return record.name;
    const grid = /^exterior:(-?\d+),(-?\d+)$/.exec(key);
    const region = record?.region ? formatRegionName(record.region) : "Wilderness";
    return grid ? `${region} (${grid[1]}, ${grid[2]})` : key.replace(/^interior:/, "");
  }, [places, transitNetwork]);

  // Stop positions, network edges and region labels for the transit map (live bundle only).
  const mapData = useMemo(() => {
    if (!routingGraph) return null;
    const cityOf = id => transitNetwork.stops.get(id)?.town || id;
    const groups = new Map();
    for (const [id, p] of points) {
      if (!p.length || !routingGraph[id]) continue;
      const city = cityOf(id);
      if (!groups.has(city)) groups.set(city, []);
      groups.get(city).push(p[0]);
    }
    const positions = Object.fromEntries([...groups].map(([city, ps]) => [city,
      [0, 1].map(axis => ps.reduce((sum, p) => sum + p[axis], 0) / ps.length / CELL)]));
    const cityGraph = {};
    for (const [id, edges] of Object.entries(liveNetworkGraph)) {
      const city = cityOf(id);
      cityGraph[city] ||= [];
      for (const edge of edges) if (cityOf(edge.to) !== city) cityGraph[city].push({ ...edge, to: cityOf(edge.to) });
    }
    // A chosen place sits where you walk to or from it.
    for (const id of [origin, destination]) {
      if (!isPlace(id)) continue;
      const [point] = placePoints(id.slice(PLACE_PREFIX.length), access);
      if (point) positions[id] = [point[0] / CELL, point[1] / CELL];
    }
    // Only stops that are part of the network, so the map and the stop count agree.
    const onNetwork = positions;
    if (!Object.keys(onNetwork).length) return null;
    return {
      positions: onNetwork,
      unplaced: [...new Set(Object.keys(routingGraph).map(cityOf).filter(city => !positions[city]))].sort().map(labelOf),
      // Spells reach everywhere; drawing them all would bury the network. The route draws its own.
      edges: mapEdges(cityGraph),
      regions: regionLabels(gameData.data?.catalogs?.Places || [])
    };
  }, [routingGraph, liveNetworkGraph, transitNetwork, points, gameData.data, origin, destination, access, labelOf]);

  const availableStops = useMemo(() => {
    // Places a teleport lands in are routed through, not listed as stops; search finds them.
    return getAvailableTransitStops(world, routingGraph).filter((stop) => !isPlace(stop));
  }, [world, routingGraph]);


  // Ensure selected stops exist in current world; a chosen place stays while the world has it.
  useEffect(() => {
    if (!linkRead) return;
    if (availableStops.length > 0) {
      const known = (id) => transitNetwork.cities.has(id) || availableStops.includes(id) || (isPlace(id) && places.has(id.slice(PLACE_PREFIX.length)));
      const resolvedOrigin = resolveTransitEndpoint(origin, transitNetwork);
      const resolvedDestination = resolveTransitEndpoint(destination, transitNetwork);
      if (resolvedOrigin !== origin) setOrigin(resolvedOrigin);
      else if (!known(origin)) {
        setOrigin(transitNetwork.stops.get(availableStops[0])?.town || availableStops[0]);
      }
      if (resolvedDestination !== destination) setDestination(resolvedDestination);
      else if (!known(destination)) {
        const fallback = availableStops[availableStops.length - 1] || availableStops[0];
        setDestination(transitNetwork.stops.get(fallback)?.town || fallback);
      }
    }
  }, [world, availableStops, origin, destination, places, transitNetwork, linkRead]);

  const handleOriginChange = id => setOrigin(resolveTransitEndpoint(id, transitNetwork));
  const handleDestinationChange = id => setDestination(resolveTransitEndpoint(id, transitNetwork));

  // "Plan a trip here" from site search: set the destination once the stop list has it.
  const intent = useSearchIntent("travel");
  useEffect(() => {
    if (!intent || intent.kind !== "destination") return;
    const resolved = resolveTransitEndpoint(intent.value, transitNetwork);
    if (transitNetwork.cities.has(resolved) || availableStops.includes(resolved)) {
      clearSearchIntent(intent);
      handleDestinationChange(intent.value);
    } else if (gameData.status === "ready" || gameData.status === "error") {
      clearSearchIntent(intent);
    }
  }, [intent, availableStops, gameData.status, transitNetwork]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwap = () => {
    const prevOrigin = origin;
    const prevDest = destination;
    handleOriginChange(prevDest);
    handleDestinationChange(prevOrigin);
  };

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

  // One list for both route ends. Keep canonical IDs so shared links, save origins,
  // swaps and the router keep using the same stops and cells as before.
  const locationOptions = useMemo(() => buildTravelSearchOptions({
    stops: availableStops,
    places,
    settlements: gameData.data?.metadata?.Places?.settlements || [],
    graph: routingGraph,
    transitStops: transitNetwork.stops,
    includePlaces: Boolean(access)
  }).map((option) => option.record?.interior && !placePoints(option.record.key, access).length
    ? { ...option, badge: sealedWay(option.record.key) }
    : option), [availableStops, places, gameData.data, routingGraph, transitNetwork, access, sealedWay]);
  const locationLabels = useMemo(() => new Map(locationOptions.map((option) => [option.id, option.label])), [locationOptions]);

  // Optimize the restricted network first. Long connections are only computed
  // when it cannot offer a route, so Fewest legs still prefers normal transport.
  const planGraph = useMemo(() => {
    const chosen = [origin, destination].filter(isPlace).map(id => id.slice(PLACE_PREFIX.length));
    return chosen.length ? addPlaces(routingGraph, chosen, {
      points, access, land: walking ? access?.land : null, speed, swim, fly, waterWalk: waterWalking, grid, intervention, spells,
      markerTarget, nodes: transitNetwork.cellNodes
    }) : routingGraph;
  }, [origin, destination, routingGraph, transitNetwork, markerTarget, points, access, walking, speed, swim, fly, waterWalking, grid, intervention, spells]);
  const restrictedPlan = useMemo(() => withInterventionResources(planGraph, spellAccess), [planGraph, spellAccess]);
  const routePending = gameData.status === 'idle' || gameData.status === 'loading';
  const restrictedRoute = useMemo(() => planRoute(
    transitEndpointStops(origin, transitNetwork), transitEndpointStops(destination, transitNetwork), restrictedPlan.graph, {
      objective: priced ? objective : "hops", goldOf: edge => journeyGold(edge, player, settings), resources: restrictedPlan.resources
    }), [origin, destination, transitNetwork, restrictedPlan, objective, priced, player, settings]);
  const expandedPlan = useMemo(() => {
    if (routePending || restrictedRoute.isValid || !walking || !access || !(speed > 0)) return null;
    const walk = { points, access, land: access.land, speed, swim, fly, waterWalk: waterWalking,
      longJourneys: true, grid, intervention, spells, markerTarget, nodes: transitNetwork.cellNodes };
    const walked = addStopWalks(spellGraph, points, access.land, speed, walk);
    const network = teleports ? addTeleports(walked, teleports, {
      nodes: transitNetwork.cellNodes, held, includeQuest: questTeleports, endpointFor: transitStopId, walk
    }).graph : walked;
    const chosen = [origin, destination].filter(isPlace).map(id => id.slice(PLACE_PREFIX.length));
    const placed = chosen.length ? addPlaces(network, chosen, walk) : network;
    const extended = addJourneyWalks(placed, transitEndpointStops(origin, transitNetwork),
      transitEndpointStops(destination, transitNetwork), walk);
    return withInterventionResources(extended, spellAccess);
  }, [routePending, restrictedRoute.isValid, walking, access, speed, swim, fly, waterWalking, points, grid,
    intervention, spells, markerTarget, transitNetwork, spellGraph, teleports, held, questTeleports, origin, destination, spellAccess]);
  const usablePlan = expandedPlan || restrictedPlan;
  const route = useMemo(() => {
    const planned = expandedPlan ? planRoute(
      transitEndpointStops(origin, transitNetwork), transitEndpointStops(destination, transitNetwork), usablePlan.graph, {
        objective: priced ? objective : "hops", goldOf: edge => journeyGold(edge, player, settings), resources: usablePlan.resources
      }) : restrictedRoute;
    if (planned.isValid) return planned;
    const shut = [origin, destination].find(id => isPlace(id) && !placePoints(id.slice(PLACE_PREFIX.length), access).length);
    if (shut) return { ...planned, message: `No door leads out of ${labelOf(shut)}. It is reached by a script or a spell, if at all.` };
    return planned;
  }, [expandedPlan, restrictedRoute, origin, destination, transitNetwork, usablePlan, objective, priced, player, settings, access, labelOf]);
  const tradeoff = useMemo(() => {
    if (!priced || objective !== "gold" || !route.isValid || route.hops === 0) return null;
    const fewest = planRoute(transitEndpointStops(origin, transitNetwork), transitEndpointStops(destination, transitNetwork), usablePlan.graph, {
      objective: "hops", goldOf: (edge) => journeyGold(edge, player, settings),
      resources: usablePlan.resources
    });
    return cheapestTradeoff(route, fewest);
  }, [priced, objective, route, origin, destination, transitNetwork, usablePlan, player, settings]);
  const realTime = useMemo(() => realTimeText(route), [route]);
  // Keep unspecified boundary cities merged in the itinerary. Only specific
  // selections and intermediate transfer points need the detailed stop label.
  const routeLabelOf = useCallback(id => {
    if (route.isValid && id === route.path[0] && transitNetwork.cities.has(origin)) return origin;
    if (route.isValid && id === route.path[route.path.length - 1] && transitNetwork.cities.has(destination)) return destination;
    return labelOf(id);
  }, [route, transitNetwork, origin, destination, labelOf]);
  const routeEdges = useMemo(() => (route.isValid ? route.steps : [])
    .map((step) => {
      const [a, b] = step.from < step.to ? [step.from, step.to] : [step.to, step.from];
      return { a, b, kind: step.kind };
    }), [route]);
  // Places a route passes through (a Propylon chamber) sit where you walk out of them.
  const routePositions = useMemo(() => {
    if (!mapData) return null;
    const out = { ...mapData.positions };
    for (const id of route.isValid ? route.path : []) {
      if (out[id]) continue;
      const [point] = isPlace(id) ? placePoints(id.slice(PLACE_PREFIX.length), access) : points.get(id) || [];
      if (point) out[id] = [point[0] / CELL, point[1] / CELL];
    }
    return out;
  }, [mapData, route, access, points]);
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

  const selectedItems = carriedOptions.filter((item) => held.has(item.id)).length;
  const characterSummary = [
    activeSave?.save?.identity?.name || `${build.race || "Adventurer"} ${build.className || "Custom"}`,
    mageGuild ? (isTr && conjurer ? "Mages Guild, Conjurer" : "Mages Guild") : "no Mages Guild",
    intervention && Object.entries(INTERVENTION_KINDS).filter(([kind]) => spells[kind]).map(([, label]) => label).join(" + "),
    selectedItems ? `${selectedItems} teleport item${selectedItems === 1 ? "" : "s"}` : null,
    priced && followers > 0 ? `${followers} follower${followers === 1 ? "" : "s"}` : null,
    access && walking ? "walking on" : "transport only",
    access && walking && carried > 0 ? `carrying ${carried}` : null,
    access && walking && levitate > 0 ? `Levitate ${levitate}` : null,
    access && walking && waterWalking ? "Water Walking" : null,
    teleports && questTeleports ? "quest teleports on" : null,
    rememberedCount > 0 ? "remembered choices" : null
  ].filter(Boolean).join(" · ");

  return (
    <div className="travel-workstation p-4 sm:p-5 border border-line-9 bg-surface-3 text-fg-2 space-y-4">
      {/* Workstation Header Bar */}
      <div className="bg-surface-7 p-4 border border-line-11 mw-groove-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-fg-2 tracking-wide m-0">
            Travel Planner
          </h2>
          <p className="text-xs text-fg-11 mt-0.5 m-0 font-sans">
            Choose your starting place, destination and what matters most for the journey.
          </p>
          <p className="text-xs text-fg-9 mt-1.5 m-0 font-serif">
            Planning for <ActiveCharacterLink build={build} />
          </p>
        </div>
      </div>

      <section aria-label="Plan a journey" className="space-y-3">
        <p id="travel-network-status" role={gameData.status === "error" ? "alert" : "status"} className="m-0 text-xs text-fg-9">
          Network: {isTr ? profile === "tr_arce" ? "Tamriel Rebuilt + ARCE" : "Tamriel Rebuilt" : "Vvardenfell (Vanilla)"} · {gameData.status === "ready"
            ? `${availableStops.length} ${availableStops.length === 1 ? "stop" : "stops"}`
            : gameData.status === "error"
            ? <>Travel network unavailable. <button type="button" className="mw-btn" onClick={gameData.retry}>Retry</button></>
            : "Loading travel network..."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TravelLocationPicker
            id="travel-origin"
            label="Origin location"
            value={origin}
            valueLabel={locationLabels.get(origin) || labelOf(origin)}
            options={locationOptions}
            scopeKey={profile}
            onChange={handleOriginChange}
            disabled={gameData.status !== "ready"}
          />
          <TravelLocationPicker
            id="travel-destination"
            label="Destination location"
            value={destination}
            valueLabel={locationLabels.get(destination) || labelOf(destination)}
            options={locationOptions}
            scopeKey={profile}
            onChange={handleDestinationChange}
            disabled={gameData.status !== "ready"}
          />

        </div>
        {priced && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Route objective">
            <span className="text-xs font-serif font-bold text-fg-7 uppercase tracking-wider">Plan for:</span>
            {Object.entries(ROUTE_OBJECTIVES).map(([id, o]) => (
              <button
                key={id}
                type="button"
                aria-pressed={objective === id}
                onClick={() => { setObjective(id); rememberChoice('objective', id); }}
                className={`min-h-11 px-3 py-2 text-xs font-serif font-bold border transition-colors ${
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

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="mw-btn min-h-11 px-3 py-2 text-xs font-serif font-bold" onClick={handleSwap}>
            Swap Origin and Destination
          </button>
          <button type="button" className="mw-btn min-h-11 px-3 py-2 text-xs font-serif font-bold" onClick={copyRouteLink}>
            {copied ? "Link copied" : "Copy route link"}
          </button>
        </div>
      </section>

      <section id="travel-results" aria-label="Planned route" className="space-y-4">
        {guildNotice && (
          <p role="note" className="guild-guide-notice text-[11px] text-warning-2">{guildNotice}</p>
        )}
        {access && walking && movement.overloaded && (
          <p role="alert" className="text-[11px] text-warning-2">
            Carrying more than you can ({Math.round(movement.load)} of {Math.round(movement.capacity)}): you cannot move, so no route walks.
          </p>
        )}
        <div className="flex flex-wrap gap-2 items-center justify-between border-b border-line-9 pb-1.5">
          <h3 className="text-sm font-serif font-bold text-accent uppercase tracking-wider">
            Route Dossier
          </h3>
          <span
            className={`px-2.5 py-0.5 border text-xs font-mono font-bold ${
              routePending
                ? "border-line-9 bg-surface-9 text-fg-7"
                : route.isValid
                ? route.hops === 0
                  ? "border-line-9 bg-surface-9 text-fg-7"
                  : "border-success-line-4 bg-success-surface-2 text-success-3"
                : "border-danger-line-3 bg-danger-surface-2 text-danger-7"
            }`}
          >
            {routePending ? "Loading route..." : route.isValid
              ? route.hops === 0
                ? "At Destination"
                : `${route.hops} ${route.hops === 1 ? "Leg" : "Legs"}${
                    route.totals?.goldKnown && priced ? ` · ${route.totals.gold} gold` : ""
                  }${route.totals?.hoursKnown && priced ? ` · ${formatDuration(route.totals.hours)} in-game` : ""}`
              : gameData.status === 'error' ? "Network unavailable" : "No Route"}
          </span>
        </div>

        {realTime && route.hops > 0 && (
          <div className="space-y-1 text-xs text-fg-7">
            <p className="travel-real-time m-0">{realTime}</p>
            <p className="text-[11px] text-fg-9 m-0">Movement only; excludes combat, menus, loading screens and time indoors.</p>
          </div>
        )}
        {tradeoff && <p role="note" className="travel-tradeoff text-xs text-fg-7 m-0">{tradeoff}</p>}

        {/* Route Status Card */}
        <div className="p-4 bg-surface-5 border border-line-11 space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-xs pb-2 border-b border-line-11">
            <div>
              <span className="text-fg-13 uppercase font-serif font-bold block text-[10px]">
                Origin
              </span>
              <span className="text-sm font-serif font-bold text-fg-2">{labelOf(origin)}</span>
            </div>
            <div className="text-center font-mono text-fg-13 whitespace-nowrap">
              {route.hops > 0 ? `${route.hops} ${route.hops === 1 ? "leg" : "legs"} →` : "="}
            </div>
            <div className="text-right">
              <span className="text-fg-13 uppercase font-serif font-bold block text-[10px]">
                Destination
              </span>
              <span className="text-sm font-serif font-bold text-fg-2">{labelOf(destination)}</span>
            </div>
          </div>

          {/* Turn by turn steps list */}
          {routePending ? (
            <p role="status" className="m-0 p-4 text-center text-sm font-serif text-fg-9">Loading travel network and planning your route...</p>
          ) : route.isValid ? (
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
                        Leg {step.stepNumber}: {routeLabelOf(step.from)} to {routeLabelOf(step.to)}
                      </div>
                      {step.walk && doorChain(transitNetwork.stops.get(step.from)?.cell || (isPlace(step.from) ? step.from.slice(PLACE_PREFIX.length) : null), access).length > 0 && (
                        <div className="text-[11px] text-fg-9">
                          Leave by the doors: {doorChain(transitNetwork.stops.get(step.from)?.cell || step.from.slice(PLACE_PREFIX.length), access).map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")} → outside
                        </div>
                      )}
                      <div className="text-[11px] text-fg-13">
                        {step.indoors
                          ? `Go through the doors: ${(step.doors || []).map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")}`
                          : step.walk && step.levitate
                          ? `Levitate about ${(step.distance / CELL).toFixed(1)} cells ${step.direction} to ${routeLabelOf(step.to)}, straight over whatever is below`
                          : step.walk
                          ? step.terrain
                            ? `Walk about ${(step.distance / CELL).toFixed(1)} cells, heading ${step.direction}, to ${routeLabelOf(step.to)}`
                              + (step.straight && step.distance > step.straight * 1.15
                                ? `, round high ground: ${(step.distance / step.straight).toFixed(1)}× the straight line`
                                : "")
                              + (step.water ? `, ${step.waterWalk ? "walking on the water for" : "swimming"} about ${Math.max(0.1, step.water / CELL).toFixed(1)} cells of it` : "")
                            : `Walk about ${(step.distance / CELL).toFixed(1)} cells ${step.direction} to ${routeLabelOf(step.to)}, in a straight line`
                              + (step.water ? `, ${step.waterWalk ? "walking on the water for" : "swimming"} about ${Math.max(0.1, step.water / CELL).toFixed(1)} cells of it` : "")
                          : step.teleport
                          ? `${step.label} at ${routeLabelOf(step.from)}${step.board ? `, ${step.board}` : ""}`
                          : <>
                              {step.scroll ? `Use a ${step.kind} scroll` : step.spell ? `Cast ${step.kind}` : `Take the ${step.kind}`}
                              {step.providerName ? ` (${step.providerName})` : ""} from {routeLabelOf(step.from)}
                              {step.board ? `, ${step.board}` : ""}
                              {step.alight ? ` to ${routeLabelOf(step.to)}, ${step.alight}` : ""}
                            </>}
                      </div>
                      {step.scroll && <p className="text-[11px] text-warning-2 m-0">Uses 1 scroll; {step.remaining} remaining for this journey.</p>}
                      {Number.isFinite(step.castChance) && <p className="text-[11px] text-warning-2 m-0">Estimated cast chance: {step.castChance}%. The route assumes success; a failed cast spends Magicka.</p>}
                      {step.resource === "magicka" && <p className="text-[11px] text-fg-9 m-0">Uses {step.uses} Magicka; {Math.round(step.remaining)} remaining for this journey.</p>}
                      {step.walk && doorChain(transitNetwork.stops.get(step.to)?.cell || (isPlace(step.to) ? step.to.slice(PLACE_PREFIX.length) : null), access).length > 0 && (
                        <div className="text-[11px] text-fg-9">
                          Go in by the doors: outside → {doorChain(transitNetwork.stops.get(step.to)?.cell || step.to.slice(PLACE_PREFIX.length), access).reverse().map((key) => labelOf(PLACE_PREFIX + key)).join(" → ")}
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
                          {step.walk && Number.isFinite(step.movementSeconds) ? ` · ~${formatRealDuration(step.movementSeconds)} real movement` : ""}
                          {step.swimmingSeconds > 0 ? ` (~${formatRealDuration(step.walkingSeconds)} walking + ~${formatRealDuration(step.swimmingSeconds)} swimming)` : ""}
                          {step.indoors ? " · time indoors not counted"
                            : Number.isFinite(step.hours) ? ` · ${step.hours === 0 ? "no time passes in-game" : `${formatDuration(step.hours)} in-game`}` : ""}
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
              {gameData.status === 'error' ? "Travel network unavailable. Use Retry above to load it again." : route.message || "No fast-travel route found between these locations."}
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
                    {routeLabelOf(node)}
                  </span>
                  {i < route.path.length - 1 && (
                    <span className="text-fg-13 mx-1">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

      </section>

      <details id="travel-options" className="p-3 bg-surface-5 border border-line-11">
        <summary className="min-h-11 text-sm font-serif text-fg-2 cursor-pointer">
          <span className="font-bold text-accent">Your character &amp; route options</span>
          <span className="text-xs text-fg-9"> — {characterSummary}</span>
        </summary>
        <div className="space-y-4 pt-3">
          {activeSave?.save && (
            <div className="space-y-2 text-xs text-fg-9">
              <p className="m-0">{storageKept ? "Changes to save-derived options are remembered in this browser for this save and profile." : "Browser storage is unavailable. These changes last until the page reloads."}</p>
              <button type="button" className="mw-btn min-h-11 px-3 py-2" onClick={resetSaveOptions}>Use save defaults</button>
              {accountDocument?.overrideSaveToggles && <p className="m-0">Your stored Travel defaults apply after save defaults. Turn off the override in Your account to restore the save&apos;s remembered choices.</p>}
            </div>
          )}
          <fieldset className="border-0 m-0 p-0 space-y-3">
            <legend className="text-sm font-serif font-bold text-accent mb-2">Your character</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label><input type="checkbox" checked={mageGuild} onChange={event=>{ setMageGuild(event.target.checked); rememberChoice("mageGuild", event.target.checked); }}/> Mages Guild member{hasAccountSource('mageGuild') ? <FromSave>{preferenceLabel}</FromSave> : marks.mageGuild && <FromSave />}</label>
              {isTr && <label><input type="checkbox" checked={conjurer} disabled={!mageGuild} onChange={event=>{ setConjurer(event.target.checked); rememberChoice("conjurer", event.target.checked); }}/> Conjurer rank or higher{hasAccountSource('conjurer') ? <FromSave>{preferenceLabel}</FromSave> : marks.conjurer && <FromSave />}</label>}
              {intervention && Object.entries(INTERVENTION_KINDS).map(([kind, label]) => (
                <label key={kind} className="whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={spells[kind]}
                    disabled={!spellAccess[kind].available}
                    onChange={(event) => { setSpells((prev) => ({ ...prev, [kind]: event.target.checked })); rememberChoice(kind, event.target.checked); }}
                  />{" "}
                  {label}
                  {hasAccountSource(kind) ? <FromSave>{preferenceLabel}</FromSave> : marks[kind] && <FromSave>{interventionMarkText(saveSources?.[kind], spells[kind])}</FromSave>}
                  {spellAccess[kind].note && <span className="block text-[11px] text-fg-9 whitespace-normal">{spellAccess[kind].note}</span>}
                </label>
              ))}
              {access && (
                <>
                  <label className="flex items-center gap-1.5 whitespace-nowrap" title="Weight carried; it slows every walk, and past your capacity (Strength x 5) you cannot move.">
                    Carrying
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={carried}
                      max={1000000}
                      onChange={(event) => { const next = Math.max(0, Math.min(1000000, Number(event.target.value) || 0)); setCarried(next); rememberChoice("carried", next); }}
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
                      onChange={(event) => { const next = Math.max(0, Math.min(100, Math.trunc(Number(event.target.value) || 0))); setLevitate(next); rememberChoice("levitate", next); }}
                      className="flex-none"
                      style={{ width: "4.5rem" }}
                    />
                  </label>
                  <label className="whitespace-nowrap">
                    <input type="checkbox" checked={waterWalking} onChange={(event) => { setWaterWalking(event.target.checked); rememberChoice("waterWalking", event.target.checked); }} /> Constant Water Walking{hasAccountSource('waterWalking') && <FromSave>{preferenceLabel}</FromSave>}
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
              {access && walking && fromSave && (
                <p className="basis-full text-[11px] text-fg-13">
                  From your save: carrying {fromSave.weight}{fromSave.unknown ? ` (${fromSave.unknown} item${fromSave.unknown === 1 ? "" : "s"} this world's data does not know, not weighed)` : ""}
                  {fromSave.feather ? `, Feather ${fromSave.feather}` : ""}{fromSave.burden ? `, Burden ${fromSave.burden}` : ""}
                  {fromSave.sources.length ? `; always on from ${fromSave.sources.join(", ")}` : ""}.
                </p>
              )}
              {activeSave?.save && carryingData.status === 'loading' && <p role="status" className="basis-full text-[11px]">Weighing your pack...</p>}
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
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          setHeld((prev) => {
                            const next = new Set(prev);
                            if (enabled) next.add(item.id); else next.delete(item.id);
                            return next;
                          });
                          rememberChoice("held", { [item.id]: enabled });
                        }}
                      />
                      {item.name}
                      {held.has(item.id) && savedItems?.has(item.id) && <FromSave />}
                    </label>
                  ))}
                </div>
              </details>
            )}

          </fieldset>
          <fieldset className="border-0 m-0 p-0">
            <legend className="text-sm font-serif font-bold text-accent mb-2">Route style</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {teleports && (
                <label className="whitespace-nowrap">
                  <input type="checkbox" checked={questTeleports} onChange={(event) => { setQuestTeleports(event.target.checked); rememberChoice('questTeleports', event.target.checked); }} /> Include quest teleports
                </label>
              )}
              {access && (
                <label className="whitespace-nowrap">
                  <input type="checkbox" checked={walking} onChange={(event) => { setWalking(event.target.checked); rememberChoice('walking', event.target.checked); }} /> Walk between places
                </label>
              )}
            </div>
          </fieldset>
        </div>
      </details>

      <details className="p-3 bg-surface-5 border border-line-11 space-y-2">
        <summary className="min-h-11 text-xs font-serif font-bold text-fg-7 cursor-pointer">Quick starting places</summary>
        <div className="flex flex-wrap items-center gap-2">
          {saveOrigin && (
            <button
              type="button"
              onClick={() => handleOriginChange(saveOrigin)}
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
            const isSelected = origin === resolveTransitEndpoint(hub.name, transitNetwork);
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
      </details>

      {mapData && (
        <TransitMap
          edges={[...mapData.edges, ...routeEdges]}
          positions={routePositions}
          regions={mapData.regions}
          unplaced={mapData.unplaced}
          route={route}
          labelOf={routeLabelOf}
          origin={route.isValid ? route.path[0] : origin}
          destination={route.isValid ? route.path[route.path.length - 1] : destination}
          onSelectStop={handleDestinationChange}
        />
      )}
      <details className="calculation-notes">
        <summary>How routes are worked out</summary>
        <div>
          <ul>
            <li>Your choice of fewest legs, least gold or fastest route sets the first priority. If routes tie, the other two measures decide.</li>
            <li>Fares are estimates based on distance, followers and your Mercantile, Personality and Luck. The provider&apos;s disposition is estimated from their usual value, your Personality and whether you share a race. Factions, bounties and diseases can change the price in-game.</li>
            <li>Before haggling, the fare is distance ÷ 4,000, at least 1 gold, multiplied by 1 + the number of followers. Guild Guides use a base fare of 10 gold and take no time; other transport takes distance ÷ 16,000 in-game hours. Distance uses the game&apos;s units.</li>
            <li>Routes include Silt Striders, boats, Guild Guides, gondolas, Pack Guar, Sky Lamps, carriages and River Striders. Guild Guides require Mages Guild membership; some mainland links also require Conjurer rank.</li>
            <li>Divine and Almsivi Intervention follow OpenMW&apos;s search through nearby map cells, so the landing point may not be the nearest in a straight line. Indoors, the search starts from the first door out. Scrolls start unticked and each route is limited to the number carried; replanning does not change the save. Known spells default on only at an estimated cast chance of at least 75% with enough current Magicka. This is a planner default, not a game rule: you can include a lower or unknown chance explicitly. Zero chance or insufficient Magicka excludes the spell. Estimates use Mysticism, Willpower, Luck, the spell&apos;s published cost and saved fatigue (full fatigue if unavailable); temporary effects such as Silence are not modeled. When cost and current Magicka are available, spell legs share that Magicka budget. Otherwise the budget cannot be checked. Routes assume successful casts and no recovery during the journey.</li>
            <li>Cities remain one choice unless you search for a specific place inside them. Without a specific starting or ending place, the route chooses the appropriate transport stop in that city. When a journey passes through a city, transfers include the outdoor walk between arrival points, platforms and guild halls; each walk shows its real movement estimate. Indoor movement remains uncounted. Walking and swimming use your Speed, Athletics and carried weight. The planner first tries nearby stops and short swims near land. Only when no route is found does it try long walks and open-water swims, using the same character and route options. Routes avoid slopes steeper than 46° and pass through the Ghostgate. Constant Water Walking times water at walking speed; constant Levitate allows direct flight when faster. Buildings and boulders may still block a planned path.</li>
            <li>Real Time Approximation adds outdoor movement at your estimated run, swim or Levitate speed. Least real time minimizes that movement, then transport/spell transitions when movement times tie. Menus and loading times vary and are not counted, so this is an approximation. Combat, detours, pauses and movement indoors add time. Cheapest compares the fare and movement time with Fewest legs using the same options. Fastest still minimizes in-game time.</li>
            <li>Indoor routes name the doors and rooms to pass through, including rooms reached by teleport. Time spent indoors is not counted.</li>
            <li>Propylons need their indices; the Master Index adds travel through Caldera. Tick the teleport items you carry. Quest teleports are left out unless you include them; check the quest conditions shown on those legs.</li>
            <li>Mark and Recall are not included.</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
