"use client";
import { useMemo, useEffect, useState } from "react";
import { ATTRS, ATTR_TIP, SKILL_GOV, ATTR_ABBR } from "../../lib/character-math.mjs";
import SkillAttributeSummary from "./skill-picker/skill-attribute-summary";

function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  return (
    <span className="relative inline-block ml-1 align-middle shrink-0">
      <button
        type="button"
        className="w-6 h-6 sm:w-5 sm:h-5 text-xs font-serif font-bold bg-[#2a2114] text-[#d4b06a] border border-[#4a3a22] hover:bg-[#3a2d1d] hover:text-[#f3e6c8] inline-flex items-center justify-center cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4b06a]"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            setOpen(false);
          }
        }}
        title="Toggle mechanics explanation"
        aria-label="Information"
        aria-expanded={open}
      >
        i
      </button>
      {open && (
        <span
          className="absolute z-50 left-0 top-7 w-64 p-2.5 text-xs text-[#f3e6c8] bg-[#14100a] shadow-2xl font-serif leading-relaxed block mw-groove-panel"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)"
          }}
        >
          {text}
        </span>
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
        : typeof window !== "undefined" && window.RACES
        ? Object.keys(window.RACES)
        : ["Argonian", "Breton", "Dark Elf", "High Elf", "Imperial", "Khajiit", "Nord", "Orc", "Redguard", "Wood Elf"];
    return raw.slice().sort((a, b) => a.localeCompare(b));
  }, [catalogs]);

  const classes =
    Object.keys(catalogs?.classes || {}).length > 0
      ? Object.keys(catalogs.classes)
      : typeof window !== "undefined" && window.VANILLA_CLASS
      ? Object.keys(window.VANILLA_CLASS)
      : [];

  const signs =
    Object.keys(catalogs?.signs || {}).length > 0
      ? Object.keys(catalogs.signs)
      : typeof window !== "undefined" && window.SIGNS
      ? Object.keys(window.SIGNS)
      : ["The Warrior", "The Mage", "The Thief", "The Serpent", "The Lady", "The Steed", "The Lord", "The Apprentice", "The Atronach", "The Ritual", "The Lover", "The Shadow", "The Tower"];

  const specSkills =
    catalogs?.specSkills ||
    (typeof window !== "undefined" && window.SPEC_SKILLS) || {
      Combat: ["Block", "Armorer", "Medium Armor", "Heavy Armor", "Blunt Weapon", "Long Blade", "Axe", "Spear", "Athletics"],
      Magic: ["Enchant", "Destruction", "Alteration", "Illusion", "Conjuration", "Mysticism", "Restoration", "Alchemy", "Unarmored"],
      Stealth: ["Security", "Sneak", "Acrobatics", "Light Armor", "Short Blade", "Marksman", "Mercantile", "Speechcraft", "Hand-to-hand"]
    };

  const activeRace = catalogs?.races?.[build.race] || (typeof window !== "undefined" && window.RACES?.[build.race]);
  const activeSign = catalogs?.signs?.[build.sign] || (typeof window !== "undefined" && window.SIGNS?.[build.sign]);

  const handleClassChange = (className) => {
    if (className === "Custom") {
      onUpdateField("className", "Custom");
    } else {
      const preset =
        catalogs?.classes?.[className] ||
        (typeof window !== "undefined" && window.VANILLA_CLASS?.[className]);
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
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div className="border-b border-[#2a2318] pb-3">
        <h3 className="font-serif text-xl font-bold text-[#f3e6c8] tracking-wide">
          Character Configuration
        </h3>
        <p className="text-sm text-[#b8a078] mt-0.5">
          Tune race, birthsign, class, and skill specialties.
        </p>
      </div>

      {/* Row 1: Race & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="builder-race" className="block text-sm font-serif font-bold text-[#d4b06a] mb-2">
            <span>Race</span>
            <InfoTip text={activeRace?.tip || "Each race provides distinct attribute ratings, skill bonuses, and unique innate spells or powers."} />
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
          <label className="block text-sm font-serif font-bold text-[#d4b06a] mb-2">
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
          <label htmlFor="builder-className" className="block text-sm font-serif font-bold text-[#d4b06a] mb-2">
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
          <label htmlFor="builder-sign" className="flex items-center justify-between text-sm font-serif font-bold text-[#d4b06a] mb-2">
            <span>Birthsign</span>
            {activeSign?.tip && <InfoTip text={activeSign.tip} />}
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
          <label htmlFor="builder-spec" className="flex items-center justify-between text-sm font-serif font-bold text-[#d4b06a] mb-2">
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
          <label htmlFor="builder-fav1" className="flex items-center justify-between text-sm font-serif font-bold text-[#d4b06a] mb-2">
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
          <label htmlFor="builder-fav2" className="flex items-center justify-between text-sm font-serif font-bold text-[#d4b06a] mb-2">
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

      {/* Bitter Cup Artifact Option */}
      <div className="p-3 bg-[#17120a] border border-[#382b18] flex flex-wrap items-center justify-between gap-3 text-xs">
        <label htmlFor="c-bittercup" className="flex items-center gap-2.5 cursor-pointer font-serif text-sm font-bold text-[#d4b06a]">
          <input
            type="checkbox"
            id="c-bittercup"
            className="w-4 h-4 accent-[#d4b06a] cursor-pointer"
            checked={Boolean(build.bitterCup)}
            onChange={(e) => onUpdateField("bitterCup", e.target.checked)}
          />
          <span>Drink Bitter Cup (+20 highest, -20 lowest)</span>
        </label>
        <div className="flex items-center gap-2">
          {sheet?.bitterCup && (
            <span className="text-[11px] font-mono text-[#c2a662]">
              +{sheet.bitterCup.bonus} {sheet.bitterCup.highest} / -{sheet.bitterCup.penalty} {sheet.bitterCup.lowest}
            </span>
          )}
          <InfoTip text="The Bitter Cup (artifact from Ald Redaynia) permanently raises your highest attribute by 20 points (up to 100) and lowers your lowest attribute by 20 points. Ties follow Morrowind canonical order: STR, INT, WIL, AGI, SPD, END, PER, LUC." />
        </div>
      </div>

      {/* Preset Class Customization Quick-Action Banner */}
      {build.className !== "Custom" && (
        <div className="flex items-center justify-between p-2.5 bg-[#17120a] border border-[#382b18] text-xs">
          <span className="text-[#c2b293]">
            Preset Class: <strong className="text-[#f3e6c8]">{build.className}</strong> (Locked)
          </span>
          <button
            type="button"
            className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-[#d4b06a]"
            onClick={() => onUpdateField("className", "Custom")}
            title="Convert to Custom Class to customize major and minor skills"
          >
            ✎ Customize Skills
          </button>
        </div>
      )}

      {/* Major Skills (5) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-[#2a2318] pb-1">
          <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Major Skills (+25)
          </h4>
          <span className="text-[11px] font-mono text-[#9e8b6b]">5 Slots</span>
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
                  idx % 2 === 0 ? "bg-[#14100a]" : "bg-[#1d170f]"
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
                    className="font-mono font-bold text-xs px-1.5 py-0.5 bg-[#22180d] border border-[#3d2b16] text-[#d4b06a] min-w-[28px] text-center shrink-0"
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
        <div className="flex items-center justify-between border-b border-[#2a2318] pb-1">
          <h4 className="text-xs uppercase tracking-widest text-[#d4b06a] font-serif font-bold">
            Minor Skills (+10)
          </h4>
          <span className="text-[11px] font-mono text-[#9e8b6b]">5 Slots</span>
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
                  idx % 2 === 0 ? "bg-[#14100a]" : "bg-[#1d170f]"
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
                    className="font-mono font-bold text-xs px-1.5 py-0.5 bg-[#1a140d] border border-[#352514] text-[#c2a662] min-w-[28px] text-center shrink-0"
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
    </div>
  );
}
