import { useState, useCallback } from "react";
import Configurator from "./configurator";
import CharacterSheet from "./character-sheet";
import PremadeBrowser from "./premade-browser";
import GearAdvisor from "./gear-advisor";
import LocalCharactersPanel from "./local-characters-panel";
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
    <div className="character-builder-root w-full mx-auto space-y-6">
      {/* Top Mode Selectors: Aligned with the 2-Pane UI columns */}
      <div className="mode-bar-grid grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div>
          <button
            type="button"
            className={`w-full mw-btn py-3 px-5 font-serif text-base font-bold tracking-wide transition-all shadow-md ${
              activeTab === "builder" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
            onClick={() => setActiveTab("builder")}
          >
            Custom Class Builder
          </button>
        </div>
        <div>
          <button
            type="button"
            className={`w-full mw-btn py-3 px-5 font-serif text-base font-bold tracking-wide transition-all shadow-md ${
              activeTab === "premade" ? "active ring-1 ring-[#d4b06a]" : ""
            }`}
            onClick={() => setActiveTab("premade")}
          >
            Premade Builds Catalog
          </button>
        </div>
      </div>

      {/* Mobile View Toggle (Visible on screens < 1024px) */}
      {activeTab === "builder" && (
        <div className="flex lg:hidden items-center gap-2 w-full p-1 bg-[#120f0a] border border-[#2a2318] mb-6">
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
              <LocalCharactersPanel />
              {/* Copy Build Link Button below Local Characters */}
              <div className="mt-4">
                <button
                  type="button"
                  className="w-full mw-btn py-3 px-4 font-serif text-sm font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm"
                  onClick={handleCopyLink}
                  title="Copy shareable build permalink"
                >
                  <span>{copied ? "✓ Link Copied!" : "🔗 Copy Build Link"}</span>
                </button>
              </div>
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
