"use client";
import { WORLD_PROFILES } from "../../lib/home-data.mjs";

export default function HomeWorlds({ profile, ready, onSelect }) {
  return (
    <section className="home-section" aria-labelledby="home-worlds-title">
      <div className="home-section-head">
        <span className="home-kicker">World profiles</span>
        <h2 className="home-h2" id="home-worlds-title">Choose your Morrowind.</h2>
        <div className="home-sub">Switch at any time. Every calculator, gear list and travel route follows the world you pick.</div>
      </div>
      <div className="home-worlds">
        {WORLD_PROFILES.map(world => {
          const active = world.id === profile;
          return (
            <div key={world.id} className="home-world" data-active={active ? "true" : undefined}>
              <div className="home-world-top">
                <span className="home-kicker">{world.content}</span>
                {active && <span className="home-chip">Active</span>}
              </div>
              <h3 className="home-world-title">{world.title}</h3>
              <div className="home-world-desc">{world.description}</div>
              <button
                type="button"
                className="mw-btn home-world-button"
                disabled={active || !ready}
                aria-pressed={active}
                onClick={() => onSelect(world.id)}
              >
                {active ? "In use" : `Switch to ${world.title}`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
