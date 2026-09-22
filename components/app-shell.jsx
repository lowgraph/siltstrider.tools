"use client";
import Script from 'next/script';
import { useEffect, useState, useMemo, useCallback } from 'react';
import SiteHeader from './site-header';
import SiteFooter from './site-footer';
import { ShellProvider, useShell } from './shell-context';
import { ThemeProvider } from './theme-provider';
import { CharacterProvider, useActiveCharacter } from './character-context';
import CloudVaultModal from './character-vault/cloud-vault-modal';

// All 12 Native Modern React Views
import HomeHubRoot from './home-hub/home-hub-root';
import CharacterBuilderRoot from './character-builder/character-builder-root';
import ChallengeRunsRoot from './challenge-runs/challenge-runs-root';
import LevelSimulatorRoot from './level-simulator/level-simulator-root';
import JournalFactionsRoot from './journal-factions/journal-factions-root';
import EnchantingWorkstation from './calculators/enchanting/enchanting-workstation';
import SpellmakingWorkstation from './calculators/spellmaking/spellmaking-workstation';
import AlchemyWorkstation from './calculators/alchemy/alchemy-workstation';
import AlchemyDataBridge from './alchemy-data-bridge';
import TravelWorkstation from './calculators/travel/travel-workstation';
import CloudVaultWorkstation from './character-vault/cloud-vault-workstation';
import AboutView from './views/about-view';
import ChangelogView from './views/changelog-view';

const KNOWN_VIEWS = [
  'home',
  'builder',
  'challenge',
  'leveler',
  'factions',
  'enchanting',
  'spellmaking',
  'alchemy',
  'travel',
  'vault',
  'about',
  'changelog'
];

const VIEW_BODY_CLASSES = [
  'view-home',
  'view-builder',
  'view-challenge',
  'view-leveler',
  'view-factions',
  'view-enchanting',
  'view-spellmaking',
  'view-alchemy',
  'view-travel',
  'view-vault',
  'view-about',
  'view-changelog'
];

function AppShellMain() {
  const shell = useShell();
  const { build, setBuild, loadSave } = useActiveCharacter();
  const activeView = shell?.view && KNOWN_VIEWS.includes(shell.view) ? shell.view : 'home';

  // Synchronize body class with the active view for legacy CSS selectors and full compatibility
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove(...VIEW_BODY_CLASSES);
    body.classList.add(`view-${activeView}`);
  }, [activeView]);

  return (
    <div className="site-layout min-h-screen flex flex-col bg-surface-3 text-fg-2">
      {/* Persistent CRPG Top Bar & Navigation Header */}
      <SiteHeader />

      {/* Main View Router - Declarative Mounting Without Portals */}
      <main className="site-main flex-1 w-full max-w-(--page-width) mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <section
          id="panel-home"
          className={`panel ${activeView === 'home' ? 'show' : ''}`}
          hidden={activeView !== 'home'}
        >
          {activeView === 'home' && <HomeHubRoot />}
        </section>

        <section
          id="panel-build"
          className={`panel ${activeView === 'builder' ? 'show' : ''}`}
          hidden={activeView !== 'builder'}
        >
          {activeView === 'builder' && <CharacterBuilderRoot />}
        </section>

        <section
          id="panel-challenge"
          className={`panel ${activeView === 'challenge' ? 'show' : ''}`}
          hidden={activeView !== 'challenge'}
        >
          {activeView === 'challenge' && <ChallengeRunsRoot />}
        </section>

        <section
          id="panel-leveler"
          className={`panel ${activeView === 'leveler' ? 'show' : ''}`}
          hidden={activeView !== 'leveler'}
        >
          {activeView === 'leveler' && <LevelSimulatorRoot />}
        </section>

        <section
          id="panel-factions"
          className={`panel ${activeView === 'factions' ? 'show' : ''}`}
          hidden={activeView !== 'factions'}
        >
          {activeView === 'factions' && <JournalFactionsRoot />}
        </section>

        <section
          id="panel-enchant"
          className={`panel ${activeView === 'enchanting' ? 'show' : ''}`}
          hidden={activeView !== 'enchanting'}
        >
          <div id="react-enchant-hud">
            {activeView === 'enchanting' && <EnchantingWorkstation />}
          </div>
        </section>

        <section
          id="panel-spell"
          className={`panel ${activeView === 'spellmaking' ? 'show' : ''}`}
          hidden={activeView !== 'spellmaking'}
        >
          <div id="react-spell-hud">
            {activeView === 'spellmaking' && <SpellmakingWorkstation />}
          </div>
        </section>

        <section
          id="panel-alchemy"
          className={`panel ${activeView === 'alchemy' ? 'show' : ''}`}
          hidden={activeView !== 'alchemy'}
        >
          <div id="react-alchemy-hud">
            <AlchemyDataBridge />
            {activeView === 'alchemy' && <AlchemyWorkstation />}
          </div>
        </section>

        <section
          id="panel-travel"
          className={`panel ${activeView === 'travel' ? 'show' : ''}`}
          hidden={activeView !== 'travel'}
        >
          <div id="react-travel-hud">
            {activeView === 'travel' && <TravelWorkstation />}
          </div>
        </section>

        <section
          id="panel-vault"
          className={`panel ${activeView === 'vault' ? 'show' : ''}`}
          hidden={activeView !== 'vault'}
        >
          {activeView === 'vault' && <CloudVaultWorkstation />}
        </section>

        <section
          id="panel-about"
          className={`panel ${activeView === 'about' ? 'show' : ''}`}
          hidden={activeView !== 'about'}
        >
          {activeView === 'about' && <AboutView />}
        </section>

        <section
          id="panel-changelog"
          className={`panel ${activeView === 'changelog' ? 'show' : ''}`}
          hidden={activeView !== 'changelog'}
        >
          {activeView === 'changelog' && <ChangelogView />}
        </section>
      </main>

      {/* CRPG Authentic Footer */}
      <SiteFooter />

      {/* Global Cloud Character Vault Modal */}
      <CloudVaultModal activeBuild={build} onApplyBuild={setBuild} onApplySave={loadSave} />
    </div>
  );
}

/**
 * AppShell: Native modern layout for Silt Strider.
 * Replaces LegacyWorkbench and eliminates dangerouslySetInnerHTML and DOM portals.
 */
export default function AppShell({ revision = '' } = {}) {
  const isClient = typeof window !== 'undefined';
  const [dataReady, setDataReady] = useState(() => isClient && Boolean(window.POOL || window.MAJORS));

  return (
    <ThemeProvider>
    <ShellProvider>
      <CharacterProvider>
        <AppShellMain />
        {revision && (
          <>
            <Script
              id="legacy-data"
              src={`/legacy/legacy-data.js?v=${revision}`}
              strategy="afterInteractive"
              onReady={() => setDataReady(true)}
            />
            {dataReady && (
              <Script
                id="legacy-runtime"
                src={`/legacy/legacy-runtime.js?v=${revision}`}
                strategy="afterInteractive"
              />
            )}
          </>
        )}
      </CharacterProvider>
    </ShellProvider>
    </ThemeProvider>
  );
}
