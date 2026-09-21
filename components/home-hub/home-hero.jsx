"use client";
import { useEffect, useState } from "react";

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
  </svg>
);

function CharacterCard({ character, levelUp, profileLabel, ready, onNavigate }) {
  return (
    <aside className="home-character" aria-labelledby="home-character-name">
      <div className="home-character-top">
        <span className="home-kicker">Current character</span>
        <span className="home-chip">{profileLabel}</span>
      </div>
      <div className="home-character-id">
        <span className="home-monogram" aria-hidden="true">{character.initial}</span>
        <div className="home-character-names">
          <h2 className="home-character-name" id="home-character-name">{character.name}</h2>
          <div className="home-character-line">Level 1 · {character.line}</div>
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

export default function HomeHero({ character, levelUp, profileLabel, ready, onNavigate, onOpenSearch }) {
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
        <h2 className="home-title" id="home-title">Plan the perfect <span>Morrowind</span> run.</h2>
        <div className="home-lead">
          A free toolbox for The Elder Scrolls III. Build a character, simulate every level-up, brew potions and plan
          your travel, with every number read straight from the game files.
        </div>
        <div className="home-ctas">
          <button type="button" className="mw-btn home-cta home-cta--primary" disabled={!ready} onClick={() => onNavigate("builder")}>
            Start a build <Arrow />
          </button>
          <button type="button" className="mw-btn home-cta" disabled={!ready} onClick={() => onNavigate("challenge")}>
            Roll a challenge run
          </button>
        </div>
        <ul className="home-sources" aria-label="Supported games">
          {["Morrowind", "Tribunal", "Bloodmoon", "Tamriel Rebuilt", "ARCE"].map(name => <li key={name}>{name}</li>)}
        </ul>
      </div>
      <CharacterCard character={character} levelUp={levelUp} profileLabel={profileLabel} ready={ready} onNavigate={onNavigate} />
    </section>
  );
}
