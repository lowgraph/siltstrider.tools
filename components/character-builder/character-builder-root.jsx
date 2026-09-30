import { useState, useCallback, useEffect, useRef } from "react";
import Configurator from "./configurator";
import CharacterSheet from "./character-sheet";
import PremadeBrowser from "./premade-browser";
import GearAdvisor from "./gear-advisor";
import LocalCharactersPanel from "./local-characters-panel";
import EquipmentStudioRoot from "../equipment-studio/equipment-studio-root";
import SaveImportNotice from "../character-vault/save-import-notice";
import ChallengeHandoff from "./challenge-handoff";
import { useShell } from "../shell-context";
import { generateBuildShareUrl } from "../../lib/character-vault.mjs";
import { isNewcomer, markBuilderVisited } from "../../lib/builder-first-visit.mjs";
import { useActiveCharacter } from "../character-context";

export default function CharacterBuilderRoot() {
  const shell = useShell();
  const {
    build,
    sheet,
    catalogs,
    updateField,
    swapSkill,
    selectClassPreset,
    selectPremade,
    isStarter,
    activeSave
  } = useActiveCharacter();
  // BLD-3: a newcomer's first Builder opens on the premade catalog while the character is
  // still the random start. While the page hydrates it must match the prerender, so the
  // effects below decide then; opened from another page, it decides here.
  const [newcomer, setNewcomer] = useState(() => (shell.ready === false ? null : isNewcomer()));
  const [activeTab, setActiveTab] = useState(() => (newcomer && isStarter ? "premade" : "builder")); // "builder" | "equipment" | "premade"
  const [mobileTab, setMobileTab] = useState("config"); // "config" | "sheet" (screens < 1024px)
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  // Once the visitor picks a tab or a build, the Builder stops choosing for them.
  const chose = useRef(false);
  const chooseTab = useCallback((tab) => {
    chose.current = true;
    setActiveTab(tab);
  }, []);

  const visited = useRef(false);
  useEffect(() => {
    if (visited.current) return;
    visited.current = true;
    if (newcomer === null) setNewcomer(isNewcomer());
    markBuilderVisited();
    // Once per mount: the answer is kept in state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A shared link, a loaded save or a character kept through sign-in replaces the random
  // start after the page is up: the Builder then shows that character, not the catalog.
  useEffect(() => {
    if (!newcomer || chose.current) return;
    setActiveTab(isStarter ? "premade" : "builder");
  }, [newcomer, isStarter]);

  // Pure state updater: premade build selection
  const handleSelectPremade = useCallback(
    (premade) => {
      selectPremade(premade);
      chooseTab("builder");
      setMobileTab("sheet");
    },
    [selectPremade, chooseTab]
  );

  // Copy a link that opens this character, in this world. Where the clipboard is blocked,
  // the link is shown to copy by hand.
  const handleCopyLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = generateBuildShareUrl(
      { ...build, world: shell.world, arce: shell.arce },
      window.location.origin
    );
    try {
      await navigator.clipboard.writeText(url);
      setShareLink(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareLink(url);
    }
  }, [build, shell.world, shell.arce]);

  const handleUpdateField = updateField;
  const handleSwapSkill = swapSkill;
  const handleSelectClassPreset = selectClassPreset;

  // Listen for silt-open-equipment events from quick launch buttons
  useEffect(() => {
    const handleOpenEquipment = () => {
      chooseTab("equipment");
    };
    window.addEventListener("silt-open-equipment", handleOpenEquipment);
    window.addEventListener("silt-open-paperdoll", handleOpenEquipment);
    return () => {
      window.removeEventListener("silt-open-equipment", handleOpenEquipment);
      window.removeEventListener("silt-open-paperdoll", handleOpenEquipment);
    };
  }, [chooseTab]);

  return (
    <div className="character-builder-root w-full mx-auto space-y-6">
      {/* A loaded .omwsave, and whatever it could not carry across */}
      <SaveImportNotice />

      {/* A character sent over from a challenge run can go back to it */}
      <ChallengeHandoff build={build} sheet={sheet} onNavigate={(view) => shell.navigate?.(view)} />

      {/* Top Controls & Header Bar */}
      <div className="bg-surface-7 p-4 border border-line-11 mw-groove-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-fg-2 tracking-wide m-0">
            Character Builder
          </h2>
          <p className="text-xs text-fg-11 mt-0.5 m-0 font-sans">
            Craft custom classes, calculate initial vitals and skill ratings from race and birthsign, and discover optimal starting gear.
          </p>
        </div>
        {activeTab === "builder" && (
          <a
            href="#gear-advisor"
            id="jump-to-gear-advisor"
            className="mw-btn py-2 px-3.5 text-xs sm:text-sm font-serif font-bold text-accent flex items-center gap-1.5 shadow-sm no-underline hover:text-accent-hover transition-colors"
            title="Jump to Gear Recommendations &amp; Progression Advisor"
            onClick={(e) => {
              const el = document.getElementById("gear-advisor");
              if (el) {
                e.preventDefault();
                el.scrollIntoView?.({ behavior: "smooth" });
                window.history.replaceState?.(null, "", "#gear-advisor");
              }
            }}
          >
            <span>Early gear for this build ↓</span>
          </a>
        )}
      </div>

      {/* Top Mode Selectors: 3-Way CRPG Studio Bar */}
      <div className="mode-bar-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <button
            type="button"
            id="btn-tab-builder"
            className={`w-full mw-btn py-3 px-4 font-serif text-sm sm:text-base font-bold tracking-wide transition-all shadow-md ${
              activeTab === "builder" ? "active ring-1 ring-accent" : ""
            }`}
            onClick={() => chooseTab("builder")}
          >
            Custom Class Builder
          </button>
        </div>
        <div>
          <button
            type="button"
            id="btn-tab-equipment"
            className={`w-full mw-btn py-3 px-4 font-serif text-sm sm:text-base font-bold tracking-wide transition-all shadow-md ${
              activeTab === "equipment" ? "active ring-1 ring-accent" : ""
            }`}
            onClick={() => chooseTab("equipment")}
          >
            Equipped Loadouts
          </button>
        </div>
        <div>
          <button
            type="button"
            id="btn-tab-premade"
            className={`w-full mw-btn py-3 px-4 font-serif text-sm sm:text-base font-bold tracking-wide transition-all shadow-md ${
              activeTab === "premade" ? "active ring-1 ring-accent" : ""
            }`}
            onClick={() => chooseTab("premade")}
          >
            Premade Builds Catalog
          </button>
        </div>
      </div>

      {/* Mobile View Toggle (Visible on screens < 1024px when builder is active) */}
      {activeTab === "builder" && (
        <div className="flex lg:hidden items-center gap-2 w-full p-1 bg-surface-2 border border-line-11 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-serif font-bold transition-all mw-btn ${
              mobileTab === "config" ? "active" : ""
            }`}
            onClick={() => setMobileTab("config")}
          >
            Configurator
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 text-sm font-serif font-bold transition-all mw-btn ${
              mobileTab === "sheet" ? "active" : ""
            }`}
            onClick={() => setMobileTab("sheet")}
          >
            Character Sheet
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "premade" ? (
        <PremadeBrowser
          onSelectBuild={handleSelectPremade}
          activeProfile={shell.profile}
          onBuildOwn={newcomer ? () => chooseTab("builder") : null}
        />
      ) : activeTab === "equipment" ? (
        <EquipmentStudioRoot
          key={activeSave?.token ?? "build"}
          character={build}
          // A loaded save is the character wearing this gear: its real skills and
          // attributes decide armour rating and carrying capacity, not level-1 values.
          skills={activeSave?.sheet?.skills || sheet?.skills || {}}
          attributes={activeSave?.sheet?.attrs || sheet?.attrs || {}}
          initialLoadouts={build.loadouts}
          onLoadoutsChange={(newLoadouts) => updateField("loadouts", newLoadouts)}
        />
      ) : (
        <>
          {/* Desktop 2-Pane Dashboard: Side-by-Side on Desktop (>=1024px), Tabbed on screens < 1024px */}
          <div className="cb-dashboard">
            <div className={`cb-pane ${mobileTab !== "config" ? "cb-pane-mobile-hidden" : ""}`}>
              <Configurator
                build={build}
                catalogs={catalogs}
                sheet={sheet}
                onUpdateField={handleUpdateField}
                onSwapSkill={handleSwapSkill}
                onSelectClassPreset={handleSelectClassPreset}
              />
              <LocalCharactersPanel build={build} />
              {/* Copy Build Link Button below Local Characters */}
              <div className="mt-4">
                <button
                  type="button"
                  className="w-full mw-btn py-3 px-4 font-serif text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm"
                  onClick={handleCopyLink}
                  title="Copy shareable build permalink"
                >
                  <span>{copied ? "Link Copied!" : "Copy Build Link"}</span>
                </button>
                {shareLink && (
                  <label className="block text-[11px] font-serif mt-2 text-fg-7">
                    Copy this link to share the build:
                    <input
                      type="text"
                      readOnly
                      className="mt-1 w-full bg-surface-1 border border-line-7 px-2 py-1 text-xs font-mono text-fg-4"
                      value={shareLink}
                      onFocus={(e) => e.target.select()}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className={`cb-pane ${mobileTab !== "sheet" ? "cb-pane-mobile-hidden" : ""}`}>
              <CharacterSheet
                build={build}
                sheet={sheet}
                catalogs={catalogs}
                onOpenEquipment={() => chooseTab("equipment")}
              />
            </div>
          </div>

          {/* Decoupled Gear Advisor */}
          <GearAdvisor
            onEquip={(loadouts) => { updateField("loadouts", loadouts); chooseTab("equipment"); }}
            attrs={Object.fromEntries(Object.entries(sheet?.attrs || {}).map(([key, value]) => [key, value.v]))}
            beast={Boolean(catalogs?.races?.[build.race]?.beast)}
            build={{ ...build, world: shell.world, arce: shell.arce }}
          />
        </>
      )}
    </div>
  );
}
