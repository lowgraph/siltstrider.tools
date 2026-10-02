"use client";
import { useMemo, useEffect, useState, useId, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ATTRS, ATTR_TIP, SKILL_GOV, ATTR_ABBR } from "../../lib/character-math.mjs";
import SkillAttributeSummary from "./skill-picker/skill-attribute-summary";
import { choiceHelp } from "../../lib/choice-help.mjs";

function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = `configuration-info-${id}`;

  useLayoutEffect(() => {
    if (!open || !text) return;
    const button = buttonRef.current, panel = panelRef.current;
    const viewport = window.visualViewport;
    const place = () => {
      const anchor = button.getBoundingClientRect();
      const x = viewport?.offsetLeft || 0, y = viewport?.offsetTop || 0;
      const left = x + 8, right = x + (viewport?.width || window.innerWidth) - 8;
      const header = document.querySelector('.topbar')?.getBoundingClientRect();
      const bar = document.querySelector('.phone-tabs')?.getBoundingClientRect();
      const top = Math.max(y + 8, header?.height && header.top <= y ? header.bottom + 8 : y + 8);
      const bottom = Math.min(y + (viewport?.height || window.innerHeight), bar?.height ? bar.top : Infinity) - 8;
      if (anchor.bottom <= top || anchor.top >= bottom || right <= left || bottom <= top) {
        setOpen(false);
        return;
      }
      panel.style.width = `${Math.min(256, right - left)}px`;
      panel.style.maxHeight = 'none';
      const size = panel.getBoundingClientRect();
      const below = Math.max(0, bottom - Math.max(anchor.bottom + 7, top));
      const above = Math.max(0, Math.min(anchor.top - 7, bottom) - top);
      const flip = size.height > below && above > below;
      const available = flip ? above : below;
      const height = Math.min(size.height, available);
      panel.style.left = `${Math.max(left, Math.min(anchor.left, right - size.width))}px`;
      panel.style.top = `${Math.max(top, Math.min(flip ? anchor.top - 7 - height : anchor.bottom + 7, bottom - height))}px`;
      panel.style.maxHeight = `${available}px`;
      panel.style.visibility = 'visible';
    };
    const scroll = (event) => {
      // Scrolling a long explanation must not reset its own scroll position.
      if (!(event.target instanceof window.Node) || !panel.contains(event.target)) place();
    };
    const outside = (event) => {
      if (!button.contains(event.target) && !panel.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        button.focus({preventScroll: true});
      }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', scroll, true);
    viewport?.addEventListener('resize', place);
    viewport?.addEventListener('scroll', place);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    document.fonts?.addEventListener('loadingdone', place);
    const observer = window.ResizeObserver ? new window.ResizeObserver(place) : null;
    observer?.observe(button);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', scroll, true);
      viewport?.removeEventListener('resize', place);
      viewport?.removeEventListener('scroll', place);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
      document.fonts?.removeEventListener('loadingdone', place);
      observer?.disconnect();
    };
  }, [open, text]);
  if (!text) return null;

  return (
    <span className="relative inline-block ml-1 align-middle shrink-0">
      <button
        ref={buttonRef}
        id={`configuration-info-button-${id}`}
        type="button"
        className="w-6 h-6 sm:w-5 sm:h-5 text-xs font-serif font-bold bg-surface-17 text-accent border border-line-7 hover:bg-surface-21 hover:text-fg-2 inline-flex items-center justify-center cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        title="Toggle mechanics explanation"
        aria-label="Information"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-describedby={open ? panelId : undefined}
      >
        i
      </button>
      {open && createPortal(
        <span
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label="Mechanics explanation"
          tabIndex={0}
          className="configuration-info-popover fixed z-50 w-64 p-2.5 text-xs text-fg-2 bg-surface-3 shadow-2xl font-serif font-normal leading-relaxed block mw-groove-panel"
          style={{
            left: 0,
            top: 0,
            visibility: 'hidden',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)"
          }}
        >
          {text}
        </span>, document.body
      )}
    </span>
  );
}

export default function Configurator({
  build,
  catalogs,
  sheet,
  onUpdateField,
  onSwapSkill,
  onSelectClassPreset
}) {
  const races = useMemo(() => {
    const raw =
      Object.keys(catalogs?.races || {}).length > 0
        ? Object.keys(catalogs.races)
        : ["Argonian", "Breton", "Dark Elf", "High Elf", "Imperial", "Khajiit", "Nord", "Orc", "Redguard", "Wood Elf"];
    return raw.slice().sort((a, b) => a.localeCompare(b));
  }, [catalogs]);

  const classes =
    Object.keys(catalogs?.classes || {}).length > 0
      ? Object.keys(catalogs.classes)
      : [];

  const signs =
    Object.keys(catalogs?.signs || {}).length > 0
      ? Object.keys(catalogs.signs)
      : ["The Warrior", "The Mage", "The Thief", "The Serpent", "The Lady", "The Steed", "The Lord", "The Apprentice", "The Atronach", "The Ritual", "The Lover", "The Shadow", "The Tower"];

  const specSkills =
    catalogs?.specSkills ||
    {
      Combat: ["Block", "Armorer", "Medium Armor", "Heavy Armor", "Blunt Weapon", "Long Blade", "Axe", "Spear", "Athletics"],
      Magic: ["Enchant", "Destruction", "Alteration", "Illusion", "Conjuration", "Mysticism", "Restoration", "Alchemy", "Unarmored"],
      Stealth: ["Security", "Sneak", "Acrobatics", "Light Armor", "Short Blade", "Marksman", "Mercantile", "Speechcraft", "Hand-to-hand"]
    };

  const activeRace = catalogs?.races?.[build.race];
  const activeSign = catalogs?.signs?.[build.sign];

  const handleClassChange = (className) => {
    if (className === "Custom") {
      onUpdateField("className", "Custom");
    } else {
      const preset =
        catalogs?.classes?.[className];
      if (preset) {
        onSelectClassPreset(className, preset);
      } else {
        onUpdateField("className", className);
      }
    }
  };

  return (
    <div
      className="configurator px-10 sm:px-14 py-8 space-y-7 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--color-surface-7)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-line-11 pb-3">
        <h3 className="font-serif text-xl font-bold text-fg-2 tracking-wide">
          Character Configuration
        </h3>
        <p className="text-sm text-fg-8 mt-0.5">
          Tune race, birthsign, class, and skill specialties.
        </p>
      </div>

      {/* Row 1: Race & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="builder-race" className="block text-sm font-serif font-bold text-accent mb-2">
            <span>Race</span>
            <InfoTip text={choiceHelp('race', activeRace, build.gender)} />
          </label>
          <select id="builder-race"
            className="mw-select w-full h-10 px-3 py-2 text-sm focus:outline-none"
            aria-label="Race"
              value={build.race}
            onChange={(e) => onUpdateField("race", e.target.value)}
          >
            {races.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-serif font-bold text-accent mb-2">
            Sex / Gender
          </label>
          <div className="flex gap-2 h-10">
            {["Male", "Female"].map((gender) => (
              <button
                key={gender}
                type="button"
                className={`flex-1 h-full px-3 text-sm font-serif font-bold mw-btn ${
                  build.gender === gender ? "active" : ""
                }`}
                onClick={() => onUpdateField("gender", gender)}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Class & Birthsign */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="builder-className" className="block text-sm font-serif font-bold text-accent mb-2">
            Class
          </label>
          <select id="builder-className"
            className="mw-select w-full h-10 px-3 py-2 text-sm focus:outline-none"
            aria-label="Class"
              value={build.className}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="Custom">Custom Class</option>
            <optgroup label="Preset Classes">
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label htmlFor="builder-sign" className="flex items-center justify-between text-sm font-serif font-bold text-accent mb-2">
            <span>Birthsign</span>
            <InfoTip text={choiceHelp('sign', activeSign)} />
          </label>
          <select id="builder-sign"
            className="mw-select w-full h-10 px-3 py-2 text-sm focus:outline-none"
            aria-label="Birthsign"
              value={build.sign}
            onChange={(e) => onUpdateField("sign", e.target.value)}
          >
            {signs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Specialization & Favored Attributes (Clean grid, no enclosing box) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="builder-spec" className="flex items-center justify-between text-sm font-serif font-bold text-accent mb-2">
            <span>Specialization</span>
            <InfoTip
              text={
                specSkills[build.spec]
                  ? `${build.spec} specialization adds +5 to all 9 governed skills: ${specSkills[build.spec].join(", ")}.`
                  : "Adds +5 to skills in this specialization."
              }
            />
          </label>
          <select id="builder-spec"
            className="mw-select w-full h-10 px-2.5 py-2 text-sm focus:outline-none"
            disabled={build.className !== "Custom"}
            aria-label="Specialization"
            value={build.spec}
            onChange={(e) => onUpdateField("spec", e.target.value)}
          >
            {["Combat", "Magic", "Stealth"].map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="builder-fav1" className="flex items-center justify-between text-sm font-serif font-bold text-accent mb-2">
            <span>Favored Attr 1</span>
            <InfoTip text={ATTR_TIP[build.fav1] || "Grants +10 starting attribute bonus."} />
          </label>
          <select id="builder-fav1"
            className="mw-select w-full h-10 px-2.5 py-2 text-sm focus:outline-none"
            disabled={build.className !== "Custom"}
            aria-label="Favored attribute 1"
            value={build.fav1}
            onChange={(e) => onUpdateField("fav1", e.target.value)}
          >
            {ATTRS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="builder-fav2" className="flex items-center justify-between text-sm font-serif font-bold text-accent mb-2">
            <span>Favored Attr 2</span>
            <InfoTip text={ATTR_TIP[build.fav2] || "Grants +10 starting attribute bonus."} />
          </label>
          <select id="builder-fav2"
            className="mw-select w-full h-10 px-2.5 py-2 text-sm focus:outline-none"
            disabled={build.className !== "Custom"}
            aria-label="Favored attribute 2"
            value={build.fav2}
            onChange={(e) => onUpdateField("fav2", e.target.value)}
          >
            {ATTRS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Governing Attribute Distribution Counter */}
      <div className="pt-2">
        <SkillAttributeSummary maj={build.maj} min={build.min} />
      </div>

      {/* Preset Class Customization Quick-Action Banner */}
      {build.className !== "Custom" && (
        <div className="flex items-center justify-between p-2.5 bg-surface-5 border border-line-9 text-xs">
          <span className="text-fg-7">
            Preset Class: <strong className="text-fg-2">{build.className}</strong> (Locked)
          </span>
          <button
            type="button"
            className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-accent"
            onClick={() => onUpdateField("className", "Custom")}
            title="Convert to Custom Class to customize major and minor skills"
          >
            ✎ Customize Skills
          </button>
        </div>
      )}

      {/* Major Skills (5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-line-11 pb-1">
          <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
            Major Skills (+25)
          </h4>
          <span className="text-[11px] font-mono text-fg-11">5 Slots</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {build.maj.map((skillName, idx) => {
            const rating = sheet?.skills?.[skillName]?.v;
            const gov = SKILL_GOV[skillName];
            const abbr = gov ? ATTR_ABBR[gov] : "";

            return (
              <div
                key={`maj-${idx}`}
                className={`flex items-center gap-2 p-1.5 transition-colors ${
                  idx % 2 === 0 ? "bg-surface-3" : "bg-surface-9"
                }`}
              >
                <select
                  id={`builder-maj-${idx}`}
                  className="mw-select flex-1 h-9 px-2.5 py-1 text-sm focus:outline-none"
                  disabled={build.className !== "Custom"}
                  value={skillName}
                  aria-label={"Major skill " + (idx + 1)}
                  onChange={(e) => onSwapSkill(true, idx, e.target.value)}
                >
                  {["Combat", "Magic", "Stealth"].map((spec) => (
                    <optgroup key={spec} label={spec}>
                      {(specSkills[spec] || []).map((s) => {
                        const sGov = SKILL_GOV[s];
                        const sAbbr = sGov ? ATTR_ABBR[sGov] : "";
                        return (
                          <option key={s} value={s}>
                            {s} {sAbbr ? `[${sAbbr}]` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                {rating !== undefined && (
                  <span
                    className="font-mono font-bold text-xs px-1.5 py-0.5 bg-surface-11 border border-line-10 text-accent min-w-[28px] text-center shrink-0"
                    title={`Rating: ${rating}${abbr ? ` (${gov})` : ""}`}
                  >
                    {rating}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minor Skills (5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-line-11 pb-1">
          <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
            Minor Skills (+10)
          </h4>
          <span className="text-[11px] font-mono text-fg-11">5 Slots</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {build.min.map((skillName, idx) => {
            const rating = sheet?.skills?.[skillName]?.v;
            const gov = SKILL_GOV[skillName];
            const abbr = gov ? ATTR_ABBR[gov] : "";

            return (
              <div
                key={`min-${idx}`}
                className={`flex items-center gap-2 p-1.5 transition-colors ${
                  idx % 2 === 0 ? "bg-surface-3" : "bg-surface-9"
                }`}
              >
                <select
                  id={`builder-min-${idx}`}
                  className="mw-select flex-1 h-9 px-2.5 py-1 text-sm focus:outline-none"
                  disabled={build.className !== "Custom"}
                  value={skillName}
                  aria-label={"Minor skill " + (idx + 1)}
                  onChange={(e) => onSwapSkill(false, idx, e.target.value)}
                >
                  {["Combat", "Magic", "Stealth"].map((spec) => (
                    <optgroup key={spec} label={spec}>
                      {(specSkills[spec] || []).map((s) => {
                        const sGov = SKILL_GOV[s];
                        const sAbbr = sGov ? ATTR_ABBR[sGov] : "";
                        return (
                          <option key={s} value={s}>
                            {s} {sAbbr ? `[${sAbbr}]` : ""}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                {rating !== undefined && (
                  <span
                    className="font-mono font-bold text-xs px-1.5 py-0.5 bg-surface-6 border border-line-10 text-accent min-w-[28px] text-center shrink-0"
                    title={`Rating: ${rating}${abbr ? ` (${gov})` : ""}`}
                  >
                    {rating}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <details className="calculation-notes">
        <summary>How this is calculated</summary>
        <div>
          <p>Your race, birthsign and class determine your starting attributes, skills and abilities.</p>
          <p>Starting Health is half the sum of your Strength and Endurance, rounded down, before birthsign attribute bonuses. Magicka starts from Intelligence, with any race and birthsign multipliers. Fatigue is Strength + Willpower + Agility + Endurance.</p>
          <p>Major skills add 25 to the base skill value; Minor skills add 10. Your specialization adds another 5 to its matching skills.</p>
          <p>Base Health = <span className="font-mono">⌊(Strength + Endurance) / 2⌋</span>. Base Magicka = <span className="font-mono">Intelligence × (1 + Race &amp; Sign Multiplier)</span>. Fatigue = <span className="font-mono">Strength + Willpower + Agility + Endurance</span>. The brackets ⌊ ⌋ mean round down.</p>
        </div>
      </details>
    </div>
  );
}
