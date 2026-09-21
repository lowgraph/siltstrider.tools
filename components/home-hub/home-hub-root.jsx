"use client";
import ActiveSessionBanner from "./active-session-banner";
import ToolDirectoryGrid from "./tool-directory-grid";
import WorldProfilesGuide from "./world-profiles-guide";
import ColophonBulletin from "./colophon-bulletin";

export default function HomeHubRoot() {
  return (
    <main className="home-hub-root text-fg-2">
      {/* Hero Welcome Header */}
      <header className="text-center max-w-3xl mx-auto mb-8 pt-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-accent tracking-wide mb-2">
          Silt Strider
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-fg-6 font-serif leading-relaxed mb-3">
          A comprehensive CRPG planning toolkit for The Elder Scrolls III: Morrowind, Tribunal, Bloodmoon, and Tamriel Rebuilt.
        </p>
        <p className="text-xs text-fg-14 font-serif max-w-2xl mx-auto leading-normal">
          Craft custom classes, solve 5x multiplier leveling itineraries, store character dossiers in the cloud, brew potions, and plot multi-modal transit across Vvardenfell and the Mainland.
        </p>
      </header>

      {/* Active Character Quick-Resume Banner */}
      <ActiveSessionBanner />

      {/* 8-Tool Directory Grid */}
      <ToolDirectoryGrid />

      {/* Game World Profiles Guide */}
      <WorldProfilesGuide />

      {/* Colophon, Credits & Support Bulletin */}
      <ColophonBulletin />
    </main>
  );
}
