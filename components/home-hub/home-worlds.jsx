"use client";
import { WORLD_PROFILES } from "../../lib/home-data.mjs";

/**
 * Which Morrowind the site is set to, where a visitor makes their first choice. Every
 * calculator, gear list and travel route follows it; a loaded save sets it by itself.
 */
export default function HomeWorlds({ profile, ready, onSelect }) {
  const active = WORLD_PROFILES.find(world => world.id === profile) || WORLD_PROFILES[0];
  return (
    <div className="home-worlds" role="group" aria-labelledby="home-worlds-label">
      <span className="home-kicker" id="home-worlds-label">Your Morrowind</span>
      <div className="home-world-options">
        {WORLD_PROFILES.map(world => (
          <button
            key={world.id}
            type="button"
            className="home-world"
            data-active={world.id === active.id ? "true" : undefined}
            aria-pressed={world.id === active.id}
            disabled={!ready}
            onClick={() => world.id !== active.id && onSelect(world.id)}
          >
            {world.title}
          </button>
        ))}
      </div>
      <div className="home-world-desc" title={active.description}>
        <span className="home-world-content">{active.content}.</span> Every tool follows this; a save sets it for you.
      </div>
    </div>
  );
}
