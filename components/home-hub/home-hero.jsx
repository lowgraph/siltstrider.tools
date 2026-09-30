"use client";
import { useEffect, useState } from "react";
import { BUILDS } from "../../lib/premade-data.mjs";
import CompatibilityNotice from "../compatibility-notice";
import HomeSaveDrop from "./home-save-drop";
import HomeWorlds from "./home-worlds";

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

// HOME-1 / MOB-2: starting a character is a first step equal to loading a save, since
// most visitors, and nearly all on phones, have no save to hand. It comes first.
function StartStep({ ready, onNavigate }) {
  return (
    <div className="home-step home-start">
      <div className="home-step-head">
        <span className="home-step-icon"><PersonIcon /></span>
        <div className="home-step-title">Start a character</div>
      </div>
      <div className="home-step-note">
        Pick one of {BUILDS.length} premade builds or make your own class. Every tool works with it, and no account is
        needed.
      </div>
      <div className="home-step-row">
        <button type="button" className="mw-btn home-cta home-cta--primary" disabled={!ready} onClick={() => onNavigate("builder")}>
          Open the Character Builder
        </button>
      </div>
    </div>
  );
}

function CharacterCard({ character, fromSave, levelUp, profileLabel, ready, onNavigate }) {
  return (
    <aside className="home-character" aria-labelledby="home-character-name">
      <div className="home-character-top">
        <span className="home-kicker">{fromSave ? "From your save" : "Current character"}</span>
        <span className="home-chip">{profileLabel}</span>
      </div>
      <div className="home-character-id">
        <span className="home-monogram" aria-hidden="true">{character.initial}</span>
        <div className="home-character-names">
          <h2 className="home-character-name" id="home-character-name">{character.name}</h2>
          <div className="home-character-line">Level {character.level} · {character.line}</div>
        </div>
      </div>

      {character.ready ? (
        <>
          <div className="home-vitals">
            {character.vitals.map(v => (
              <div className="home-vital" key={v.kind}>
                <span className="home-vital-label">{v.label}</span>
                <span className="home-vital-bar" aria-hidden="true">
                  <span className={`home-vital-fill home-vital-fill--${v.kind}`} />
                </span>
                <span className="home-vital-value">{v.value}</span>
              </div>
            ))}
          </div>

          <dl className="home-attributes" aria-label="Attributes">
            {character.attributes.map(a => (
              <div className="home-attribute" key={a.name} title={a.favoured ? `${a.name} (favoured)` : a.name}>
                <dt>{a.abbr}{a.favoured && <span className="home-star" aria-label="favoured"> ★</span>}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>

          <div className="home-majors">
            <span className="home-kicker">Major skills</span>
            <ul>
              {character.majors.map(s => (
                <li key={s.name}><span>{s.name}</span><span className="home-num">{s.value}</span></li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="home-muted">Loading the character sheet…</div>
      )}

      <div className="home-character-actions">
        <button type="button" className="mw-btn" disabled={!ready} onClick={() => onNavigate("builder")}>Resume build</button>
        <button type="button" className="mw-btn" disabled={!ready} onClick={() => onNavigate("leveler")}>Plan level-ups</button>
      </div>

      {levelUp && (
        <div className="home-levelup">
          <div className="home-levelup-head">
            <span className="home-kicker">Next level-up</span>
            <span className="home-num">Level {levelUp.level} → {levelUp.nextLevel}</span>
          </div>
          <div className="home-levelup-body">
            <span className="home-levelup-bonuses">
              {levelUp.bonuses.map(b => (
                <span className="home-chip" key={b.attribute}>{b.attribute} ×{b.multiplier}</span>
              ))}
            </span>
            <span className="home-levelup-health">Health {levelUp.healthFrom} → {levelUp.healthTo}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function HomeHero({
  character, levelUp, profile, profileLabel, ready, save, onNavigate, onOpenSearch, onSelectWorld
}) {
  const [searchKey, setSearchKey] = useState("Ctrl K");
  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")) setSearchKey("⌘K");
  }, []);

  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero-copy">
        <button type="button" className="home-news" disabled={!ready} onClick={onOpenSearch}>
          <span className="home-news-tag">New</span>
          <span>Search every item, spell and place</span>
          <kbd>{searchKey}</kbd>
        </button>
        <h1 className="home-title" id="home-title">Plan the perfect <span>Morrowind</span> run.</h1>
        <div className="home-lead">
          A free, data-driven companion for The Elder Scrolls III. Build a character, simulate every level-up for ×5 multipliers, brew potions and plan your travel across Vvardenfell and Tamriel Rebuilt, with every number read straight from the game files.
        </div>
        {/* With a save loaded, its panel is the next step and there is no other to offer. */}
        <div className="home-steps">
          {!save?.activeSave && <StartStep ready={ready} onNavigate={onNavigate} />}
          <HomeSaveDrop
            activeSave={save?.activeSave}
            onLoad={save?.loadSave}
            onClear={save?.clearSave}
            onNavigate={onNavigate}
            ready={ready}
          />
        </div>
        {!save?.activeSave && <CompatibilityNotice />}
        <HomeWorlds profile={profile} ready={ready} onSelect={onSelectWorld} />
      </div>
      <CharacterCard
        character={character}
        fromSave={Boolean(save?.activeSave?.sheet)}
        levelUp={levelUp}
        profileLabel={profileLabel}
        ready={ready}
        onNavigate={onNavigate}
      />
    </section>
  );
}
