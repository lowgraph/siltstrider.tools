"use client";
import { useEffect, useMemo, useState } from "react";
import { useShell } from "../shell-context";
import { useActiveCharacter } from "../character-context";
import { getGameDataLoader } from "../use-game-data";
import { adaptTravelGraph } from "../../lib/travel-graph.mjs";
import { ALL_SKILLS } from "../../lib/level-math.mjs";
import { POOL } from "../../lib/challenge-math.mjs";
import {
  WORLD_PROFILES, characterSummary, exampleRoute, healthGap, nextLevelUp, sampleRestrictions, stopCount, worldLabel
} from "../../lib/home-data.mjs";
import HomeHero from "./home-hero";
import HomeTools from "./home-tools";
import HomeWorlds from "./home-worlds";
import HomeColophon from "./home-colophon";

// The live travel network for the current world; null (the built-in network) until it loads.
function useTravelGraph(loader, profile, ready) {
  const [loaded, setLoaded] = useState({ profile: null, graph: null });
  useEffect(() => {
    if (!ready) return undefined;
    let current = true;
    Promise.all([loader.loadCatalog(profile, "Travel"), loader.loadCatalogMetadata(profile, "Travel")])
      .then(([records, metadata]) => {
        if (current) setLoaded({ profile, graph: adaptTravelGraph(records, metadata?.nodes || {}) });
      })
      .catch(() => {});
    return () => { current = false; };
  }, [loader, profile, ready]);
  return loaded.profile === profile && loaded.graph && Object.keys(loaded.graph).length ? loaded.graph : null;
}

/**
 * The home page: what the site is, the character you are working on, every
 * tool with a live preview, and the world you are playing in. `shell`,
 * `character` ({ build, sheet, catalogs }) and `loader` override the app's
 * own for tests.
 */
export default function HomeHubRoot({ loader, shell: shellOverride, character: characterOverride }) {
  let contextShell = null;
  try { contextShell = useShell(); } catch {}
  const shell = shellOverride || contextShell;
  const activeCharacter = useActiveCharacter();
  const { build, sheet, catalogs } = characterOverride || activeCharacter;
  const profile = shell?.profile || "vanilla";
  const world = shell?.world || "vanilla";
  const source = loader || getGameDataLoader();
  const graph = useTravelGraph(source, profile, Boolean(shell?.ready));

  const navigate = view => {
    if (shell?.navigate) shell.navigate(view);
    else if (typeof window !== "undefined") window.location.hash = "#" + view;
  };
  const openSearch = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new window.CustomEvent("silt-open-search"));
  };

  const options = useMemo(() => ({ bitterCup: Boolean(sheet?.bitterCup || build?.bitterCup) }), [sheet, build]);
  const character = useMemo(() => characterSummary(build, sheet), [build, sheet]);
  const levelUp = useMemo(() => (sheet ? nextLevelUp(sheet, catalogs, options) : null), [sheet, catalogs, options]);
  const health = useMemo(() => (sheet ? healthGap(sheet, catalogs, options, 30) : null), [sheet, catalogs, options]);
  const route = useMemo(() => exampleRoute(world, graph), [world, graph]);
  const stops = useMemo(() => stopCount(world, graph), [world, graph]);
  // Drawn after mount: a random pick during server rendering would not match the browser's.
  const [restrictions, setRestrictions] = useState([]);
  useEffect(() => { setRestrictions(sampleRestrictions(POOL, 3)); }, []);

  const facts = [
    { value: ALL_SKILLS.length, label: "skills modeled for every character" },
    { value: POOL.length, label: "hand-picked challenge restrictions" },
    { value: stops, label: `travel stops in ${worldLabel(profile)}` },
    { value: WORLD_PROFILES.length, label: "world profiles: Vanilla, TR and TR + ARCE" }
  ];

  return (
    <div className="home-hub-root">
      <HomeHero
        character={character}
        levelUp={levelUp}
        profileLabel={worldLabel(profile)}
        ready={Boolean(shell?.ready)}
        onNavigate={navigate}
        onOpenSearch={openSearch}
      />

      <section className="home-facts" aria-label="Silt Strider in numbers">
        {facts.map(fact => (
          <div className="home-fact" key={fact.label}>
            <span className="home-fact-value">{fact.value}</span>
            <span className="home-fact-label">{fact.label}</span>
          </div>
        ))}
      </section>

      <HomeTools character={character} health={health} route={route} restrictions={restrictions} onNavigate={navigate} />
      <HomeWorlds profile={profile} ready={Boolean(shell?.ready)} onSelect={id => shell?.setProfile?.(id)} />
      <HomeColophon onNavigate={navigate} />
    </div>
  );
}
