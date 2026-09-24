"use client";
import VitalsBar from "./vitals-bar";
import AttributeGrid from "./attribute-grid";
import SkillDisplayGrid from "./skill-display-grid";
import RaceMagic from "./race-magic";
import { startingSpells } from "../../lib/character-math.mjs";
import { useShell } from "../shell-context";

export default function CharacterSheet({ build, sheet, catalogs, onOpenEquipment = null, onOpenPaperdoll = null }) {
  const shell = useShell();
  if (!sheet) {
    return (
      <div
        className="character-sheet p-8 text-center space-y-2 min-h-[300px] flex flex-col items-center justify-center"
        style={{
          border: "6px solid transparent",
          borderImage: "var(--mw-border) 6 repeat",
          background: "var(--color-surface-7)",
          boxShadow: "inset 0 0 10px 2px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.4)"
        }}
      >
        <h4 className="font-serif text-base font-bold text-accent">
          Live Character Sheet
        </h4>
        <p className="text-xs text-fg-14 italic">
          Calculating statistics from race, birthsign, and skill choices…
        </p>
      </div>
    );
  }

  const spells = startingSpells(build, sheet, catalogs);
  const raceAbilities = sheet.race?.abilities || "";
  const raceMagic = catalogs.raceMagic?.[build.race] || [];
  const signAbilities = sheet.sign?.abil || "";

  return (
    <div
      className="character-sheet px-10 sm:px-14 py-8 space-y-7 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--color-surface-7)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Header Summary */}
      <div className="border-b border-line-11 pb-3">
        <h3 className="font-serif text-xl font-bold text-fg-2 tracking-wide flex items-center justify-between">
          <span>{build.name || build.className || "Custom Build"}</span>
          <span className="text-sm font-mono font-medium text-accent flex items-center gap-2">
            <span>{build.gender} {build.race} · {build.sign}</span>
            {sheet.bitterCup && (
              <span className="text-xs px-1.5 py-0.5 bg-surface-11 border border-line-8 text-accent font-serif font-bold">
                Bitter Cup
              </span>
            )}
          </span>
        </h3>
      </div>

      {/* Warnings */}
      {sheet.duplicates.length > 0 && (
        <div className="mw-warning-scroll p-3 text-xs space-y-0.5">
          <div className="font-serif font-bold text-accent flex items-center gap-1.5">
            <span>Duplicate Skill Conflict</span>
          </div>
          <p className="text-fg-5">
            Skill picked more than once: <strong>{sheet.duplicates.join(", ")}</strong>. Choose 10 distinct skills.
          </p>
        </div>
      )}
      {sheet.favoredClash && (
        <div className="mw-warning-scroll p-3 text-xs space-y-0.5">
          <div className="font-serif font-bold text-accent flex items-center gap-1.5">
            <span>Favored Attribute Conflict</span>
          </div>
          <p className="text-fg-5">
            Both favored attributes are <strong>{build.fav1}</strong>. Choose two different attributes.
          </p>
        </div>
      )}

      {/* Vitals Section */}
      <div className="vitals-section space-y-2 bg-surface-2 p-5 border border-line-11 mw-groove-panel">
        <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold border-b border-line-12 pb-2 mb-3">
          Vitals
        </h4>
        <VitalsBar label="Health" kind="health" value={sheet.health} max={sheet.health} />
        <VitalsBar label="Magicka" kind="magicka" value={sheet.magicka} max={sheet.magicka} />
        <VitalsBar label="Fatigue" kind="fatigue" value={sheet.fatigue} max={sheet.fatigue} />
      </div>

      {/* Attributes Section */}
      <div className="attributes-section">
        <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold border-b border-line-11 pb-1.5 mb-2">
          Primary Attributes
        </h4>
        <AttributeGrid attrs={sheet.attrs} signName={build.sign} />
      </div>

      {/* Skills Section */}
      <div className="skills-section">
        <SkillDisplayGrid
          maj={build.maj}
          min={build.min}
          skills={sheet.skills}
          raceBonuses={sheet.race?.skills || {}}
        />
      </div>

      {/* Spells & Powers */}
      <div className="spells-section bg-surface-2 p-4 border border-line-11 space-y-2.5 text-xs sm:text-sm mw-groove-panel">
        <h4 className="text-xs uppercase tracking-widest text-accent font-serif font-bold border-b border-line-12 pb-1.5">
          Starting Magic & Abilities
        </h4>

        <RaceMagic spells={raceMagic} />
        {!raceMagic.length && spells.race.length > 0 && (
          <div>
            <span className="text-fg-8 font-serif font-bold">Race Spells: </span>
            <span className="text-fg-2">{spells.race.join(" · ")}</span>
          </div>
        )}

        {spells.sign.length > 0 && (
          <div>
            <span className="text-fg-8 font-serif font-bold">Birthsign Spells & Powers: </span>
            <span className="text-fg-2">{spells.sign.join(" · ")}</span>
          </div>
        )}

        {spells.skills.length > 0 && (
          <div>
            <span className="text-fg-8 font-serif font-bold">Bonus Starting Spells (from skills): </span>
            <span className="text-fg-2">{spells.skills.join(" · ")}</span>
          </div>
        )}

        {!raceMagic.length && raceAbilities && (
          <div>
            <span className="text-fg-14 font-serif font-semibold">Race Traits: </span>
            <span className="text-fg-5">{raceAbilities}</span>
          </div>
        )}

        {signAbilities && (
          <div>
            <span className="text-fg-14 font-serif font-semibold">Birthsign Traits: </span>
            <span className="text-fg-5">{signAbilities}</span>
          </div>
        )}

        {spells.race.length === 0 && spells.sign.length === 0 && spells.skills.length === 0 && !raceAbilities && !signAbilities && (
          <p className="text-fg-14 italic">No innate spells or active powers.</p>
        )}
      </div>

      {/* Quick Launch: Cloud Character Vault & Equipped Loadout & Level Optimizer */}
      <div className="pt-2 border-t border-line-11 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            id="btn-sheet-cloud-vault"
            className="w-full mw-btn py-3 px-3 font-serif text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-sm text-fg-2 hover:text-accent"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("silt-open-vault"));
              }
            }}
            title="Open Cloud Character Vault"
          >
            <span>Cloud Character Vault</span>
          </button>
          <button
            type="button"
            id="btn-sheet-equipment"
            className="w-full mw-btn py-3 px-3 font-serif text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-sm text-fg-2 hover:text-accent"
            onClick={() => {
              if (typeof onOpenEquipment === "function") {
                onOpenEquipment();
              } else if (typeof onOpenPaperdoll === "function") {
                onOpenPaperdoll();
              } else if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("silt-open-equipment"));
              }
            }}
            title="Inspect equipped loadout in the Equipment Inspector"
          >
            <span>Equipped Loadout →</span>
          </button>
          <button
            type="button"
            id="btn-sheet-leveler"
            className="w-full mw-btn py-3 px-3 font-serif text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-sm text-fg-2 hover:text-accent"
            onClick={() => shell.navigate?.("leveler")}
            title="Open Level Progression Optimizer with this build"
          >
            <span>Level Optimizer →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
