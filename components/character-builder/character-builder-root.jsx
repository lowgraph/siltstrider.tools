import { useState, useCallback } from "react";
import Configurator from "./configurator";
import CharacterSheet from "./character-sheet";
import PremadeBrowser from "./premade-browser";
import GearAdvisor from "./gear-advisor";
import VitalsBar from "./vitals-bar";
import { useShell } from "../shell-context";
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
    selectPremade
  } = useActiveCharacter();
  const [activeTab, setActiveTab] = useState("builder"); // "builder" | "premade"
  const [mobileTab, setMobileTab] = useState("config"); // "config" | "sheet" (screens < 1024px)
  const [copied, setCopied] = useState(false);

  // Pure state updater: premade build selection
  const handleSelectPremade = useCallback(
    (premade) => {
      selectPremade(premade);
      setActiveTab("builder");
      setMobileTab("sheet");
    },
    [selectPremade]
  );

  // Copy shareable build permalink
  const handleCopyLink = useCallback(() => {
    if (typeof window === "undefined") return;
    if (typeof window.writeShareHash === "function") {
      try {
        window.writeShareHash();
      } catch (e) {}
    }
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const btn = document.getElementById("btn-copy-build-link");
      if (btn) btn.click();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleUpdateField = updateField;
  const handleSwapSkill = swapSkill;
  const handleSelectClassPreset = selectClassPreset;

  return (
    <div className="character-builder-root w-full max-w-[1280px] mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* Top Mode Bar */}
      <div
        className="mode-bar p-3.5 flex flex-wrap items-center justify-between gap-3"
        style={{
          border: "4px solid transparent",
          borderImage: "var(--mw-bevel) 4 repeat",
          background: "#181510"
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className={`mw-btn px-4 py-2 font-serif text-sm font-bold tracking-wide transition-colors ${
              activeTab === "builder" ? "active" : ""
            }`}
            onClick={() => setActiveTab("builder")}
          >
            Custom Class Builder
          </button>
          <button
            type="button"
            className={`mw-btn px-4 py-2 font-serif text-sm font-bold tracking-wide transition-colors ${
              activeTab === "premade" ? "active" : ""
            }`}
            onClick={() => setActiveTab("premade")}
          >
            Premade Builds Catalog
          </button>
          <button
            type="button"
            className="mw-btn px-3 py-2 font-serif text-xs font-bold tracking-wide flex items-center gap-1.5"
            onClick={handleCopyLink}
            title="Copy shareable build permalink"
          >
            <span>{copied ? "✓ Link Copied!" : "🔗 Copy Build Link"}</span>
          </button>
        </div>

        {/* View Toggle (Visible on screens < 1024px) */}
        {activeTab === "builder" && (
          <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto p-1 bg-[#120f0a] border border-[#2a2318] mt-1 sm:mt-0">
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
      </div>

      {/* Main Content Area */}
      {activeTab === "premade" ? (
        <PremadeBrowser
          onSelectBuild={handleSelectPremade}
          activeProfile={shell.profile}
        />
      ) : (
        <>
          {/* Quick Vitals HUD (shown on screens < 1024px when on configurator tab) */}
          {sheet && (
            <div className="character-vitals-hud block lg:hidden bg-[#100d08] p-3 border border-[#2a2318] space-y-2 mw-groove-panel">
              <div className="flex items-center justify-between text-xs font-mono text-[#d4b06a] mb-1 pb-1 border-b border-[#221c13]">
                <span className="font-serif font-bold text-sm">Character Vitals</span>
                <button
                  type="button"
                  className="mw-btn px-2.5 py-1 text-xs font-serif font-bold tracking-wide"
                  onClick={() => setMobileTab(mobileTab === "config" ? "sheet" : "config")}
                >
                  {mobileTab === "config" ? "View Full Sheet →" : "← View Config"}
                </button>
              </div>
              <div className="flex flex-col space-y-2">
                <VitalsBar label="Health" kind="health" value={sheet.health} max={sheet.health} />
                <VitalsBar label="Magicka" kind="magicka" value={sheet.magicka} max={sheet.magicka} />
                <VitalsBar label="Fatigue" kind="fatigue" value={sheet.fatigue} max={sheet.fatigue} />
              </div>
            </div>
          )}

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
            </div>

            <div className={`cb-pane ${mobileTab !== "sheet" ? "cb-pane-mobile-hidden" : ""}`}>
              <CharacterSheet build={build} sheet={sheet} catalogs={catalogs} />
            </div>
          </div>

          {/* Decoupled Gear Advisor */}
          <GearAdvisor build={{...build, world:shell.world, arce:shell.arce}} />
        </>
      )}
    </div>
  );
}
