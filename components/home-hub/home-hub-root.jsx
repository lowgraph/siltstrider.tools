"use client";
import { useEffect, useMemo, useState } from "react";
import { useShell } from "../shell-context";
import { useActiveCharacter } from "../character-context";
import { getGameDataLoader } from "../use-game-data";
import { adaptTravelGraph } from "../../lib/travel-graph.mjs";
import { ALL_SKILLS } from "../../lib/level-math.mjs";
import { POOL } from "../../lib/challenge-math.mjs";
import {
  WORLD_PROFILES, alchemyPreview, characterSummary, exampleRoute, healthGap, nextLevelUp, stopCount, worldLabel
} from "../../lib/home-data.mjs";
import HomeHero from "./home-hero";
import HomeTools from "./home-tools";
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

// How many ingredients the current world has; null until they load.
function useIngredientCount(loader, profile, ready) {
  const [loaded, setLoaded] = useState({ profile: null, count: null });
  useEffect(() => {
    if (!ready) return undefined;
    let current = true;
    loader.loadCatalog(profile, "Ingredients")
      .then(records => { if (current) setLoaded({ profile, count: Array.isArray(records) ? records.length : null }); })
      .catch(() => {});
    return () => { current = false; };
  }, [loader, profile, ready]);
  return loaded.profile === profile ? loaded.count : null;
}

/**
 * The home page: open a save or start a build, in the world you play, then
 * every tool with a live preview. `shell`, `character` ({ build, sheet,
 * catalogs, activeSave, loadSave, clearSave }) and `loader` override the
 * app's own for tests.
 */
export default function HomeHubRoot({ loader, shell: shellOverride, character: characterOverride }) {
  let contextShell = null;
  try { contextShell = useShell(); } catch {}
  const shell = shellOverride || contextShell;
  const activeCharacter = useActiveCharacter();
  const { build, sheet: buildSheet, catalogs, activeSave, loadSave, clearSave } = characterOverride || activeCharacter;
  // A loaded save shows the character as it is in the game, not the build at level 1.
  const sheet = activeSave?.sheet || buildSheet;
  const profile = shell?.profile || "vanilla";
  const world = shell?.world || "vanilla";
  const source = loader || getGameDataLoader();
  const graph = useTravelGraph(source, profile, Boolean(shell?.ready));
  const ingredients = useIngredientCount(source, profile, Boolean(shell?.ready));

  const navigate = view => {
    if (shell?.navigate) shell.navigate(view);
    else if (typeof window !== "undefined") window.location.hash = "#" + view;
  };
  const openSearch = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new window.CustomEvent("silt-open-search"));
  };

  const options = useMemo(() => ({ bitterCup: Boolean(sheet?.bitterCup || build?.bitterCup) }), [sheet, build]);
  // A custom class from a save is "Custom" to the builder; the card uses the name the player gave it.
  const savedClass = activeSave?.className;
  const character = useMemo(
    () => characterSummary(savedClass ? { ...build, className: savedClass } : build, sheet),
    [build, sheet, savedClass]
  );
  const levelUp = useMemo(() => (sheet ? nextLevelUp(sheet, catalogs, options) : null), [sheet, catalogs, options]);
  const health = useMemo(() => (sheet ? healthGap(sheet, catalogs, options, 30) : null), [sheet, catalogs, options]);
  const route = useMemo(() => exampleRoute(world, graph), [world, graph]);
  const stops = useMemo(() => stopCount(world, graph), [world, graph]);
  const alchemy = useMemo(() => (sheet ? alchemyPreview(sheet, ingredients) : null), [sheet, ingredients]);

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
        profile={profile}
        profileLabel={worldLabel(profile)}
        ready={Boolean(shell?.ready)}
        save={{ activeSave, loadSave, clearSave }}
        onNavigate={navigate}
        onOpenSearch={openSearch}
        onSelectWorld={id => shell?.setProfile?.(id)}
      />

      <section className="home-facts" aria-label="Silt Strider in numbers">
        {facts.map(fact => (
          <div className="home-fact" key={fact.label}>
            <span className="home-fact-value">{fact.value}</span>
            <span className="home-fact-label">{fact.label}</span>
          </div>
        ))}
      </section>

      <HomeTools character={character} health={health} route={route} alchemy={alchemy} onNavigate={navigate} />
      <HomeColophon onNavigate={navigate} />
    </div>
  );
}
