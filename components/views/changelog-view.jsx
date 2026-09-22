"use client";

/**
 * ChangelogView: Native modern React implementation of the Changelog panel.
 * Replaces legacy #panel-changelog markup with responsive CRPG ledger styling.
 */
export default function ChangelogView() {
  return (
    <div className="changelog-view-root w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6" id="changelog-content">
      <div className="border-b border-accent pb-4">
        <h2 className="text-2xl md:text-3xl font-serif text-accent tracking-wide">Changelog</h2>
        <p className="text-sm text-fg-11 mt-1 font-serif">What changed on Silt Strider, newest first.</p>
      </div>

      <div className="space-y-6 text-sm text-fg-2">
        {/* September 22, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-22">September 22, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Ashfall Default Theme:</strong> Made Ashfall the default color palette site-wide, with Morrowind Classic available as a toggle in the menu.
            </li>
            <li>
              <strong className="text-fg-2">Home Page Rebuild:</strong> Rebuilt the landing page around the active character — quick-access cards for every tool, live stat preview, and one-tap navigation.
            </li>
            <li>
              <strong className="text-fg-2">Site Search:</strong> Added a universal search palette (Ctrl+K / Cmd+K) indexing every view, action, and game term across the site.
            </li>
            <li>
              <strong className="text-fg-2">Phone Tab Bar:</strong> Added a bottom navigation bar on mobile with quick access to the five most-used tools.
            </li>
            <li>
              <strong className="text-fg-2">Transit Map:</strong> Added a visual transit network map to the Travel Optimizer showing all routes at a glance.
            </li>
            <li>
              <strong className="text-fg-2">Send to Build Optimizer Fix:</strong> Rewired the Challenge Runs &quot;Send to Build Optimizer&quot; bridge to write through CharacterContext, fixing the broken handoff after the Phase 13 legacy cleanup.
            </li>
            <li>
              <strong className="text-fg-2">Open an OpenMW Save:</strong> Open a <code className="text-accent">.omwsave</code> from the Cloud Vault without signing in; it is read in your browser and never uploaded. The builder takes over the character (custom classes included) and switches to the save&apos;s game profile, and anything the save&apos;s mods add that Silt Strider does not know is listed rather than guessed.
            </li>
            <li>
              <strong className="text-fg-2">Front Page Leads with Your Save:</strong> Drop an OpenMW save anywhere on the home page to load it, or pick your world (Vanilla, Tamriel Rebuilt, TR + ARCE) and start a new build. Alchemy and Travel get large cards, with your brew chance on the Alchemy card.
            </li>
            <li>
              <strong className="text-fg-2">Navigation:</strong> Alchemy and Travel join the top menu, Challenge Runs moves under More, and the Cloud Vault is the account button beside search. On phones, the tab bar now has Alchemy.
            </li>
            <li>
              <strong className="text-fg-2">Your Save Across the Tools:</strong> The Equipment Studio gets a &quot;Worn by&quot; loadout with the character&apos;s gear and real stats, the Level Simulator can plan from the save&apos;s level, and the Journal shows its factions and quests. Cloud saves now keep gender, specialization and favoured attributes.
            </li>
          </ul>
        </section>

        {/* September 21, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-21">September 21, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Theme Tokens Refactor:</strong> Routed every component color through semantic design tokens, enabling site-wide palette swaps with a single theme file.
            </li>
            <li>
              <strong className="text-fg-2">Health Growth Chart:</strong> Made the Level Simulator&apos;s Health projection chart readable at a glance with clearer labels and contrast.
            </li>
            <li>
              <strong className="text-fg-2">Page Centering Fix:</strong> Corrected the page column and header alignment for consistent centering across all viewports.
            </li>
            <li>
              <strong className="text-fg-2">Legacy Cleanup &amp; Architecture Archival (Phase 13):</strong> Archived obsolete transition harnesses (<code className="text-accent">components/legacy-workbench.jsx</code>, extraction scripts, and bridges) into <code className="text-accent">archive/legacy/</code>.
            </li>
            <li>
              <strong className="text-fg-2">Native Styling Bundling:</strong> Ingested base legacy styling into <code className="text-accent">app/legacy-compat.css</code> and removed runtime <code className="text-accent">/legacy/legacy.css</code> stylesheet links from the page root.
            </li>
            <li>
              <strong className="text-fg-2">Architecture &amp; Shell Decoupling (Phase 12):</strong> Completed full architectural transition away from the legacy extraction harness towards a native, declarative React 19 / Next.js 16 layout.
            </li>
            <li>
              <strong className="text-fg-2">Native React App Shell:</strong> Implemented <code className="text-accent">components/app-shell.jsx</code> mounting all 12 tools cleanly with zero DOM portal or legacy innerHTML dependencies.
            </li>
            <li>
              <strong className="text-fg-2">Pure ESM Permalink Codec:</strong> Built universal UTF-8 Base64URL encoder/decoder and URL hash state engine in <code className="text-accent">lib/permalink-codec.mjs</code> supporting all 12 tools and preserving 100% backward compatibility with bookmarked links.
            </li>
            <li>
              <strong className="text-fg-2">Challenge Engine Decoupling:</strong> Extracted card rolling, lock preservation, and conflict resolution into pure ESM <code className="text-accent">lib/challenge-engine.mjs</code>.
            </li>
            <li>
              <strong className="text-fg-2">Asset Ingestion &amp; Design Tokens:</strong> Ingested Pelagiad font and Morrowind 9-slice border textures as native static assets with formal CSS variables.
            </li>
            <li>
              <strong className="text-fg-2">Dynamic Best-In-Slot Resolution:</strong> Repointed late-game gear recommendations to dynamically consume <code className="text-accent">public/game-data/current.json</code> with synthetic fixture fallbacks for CI.
            </li>
          </ul>
        </section>

        {/* September 20, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-20">September 20, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Faction Journal &amp; Promotion Deficit Engine:</strong> Full workstation tracking memberships, FADT rank requirements, promotion deficits, mutual exclusions (Great Houses &amp; Vampire Clans), and inter-faction diplomacy.
            </li>
            <li>
              <strong className="text-fg-2">Live bundle data:</strong> Wired Enchanting, Spellmaking, Alchemy, and Travel to content-addressed catalogs with live badges.
            </li>
            <li>
              <strong className="text-fg-2">Gear Advisor:</strong> Added &quot;Near starting areas&quot; policy toggle alongside Steal and Endgame with dynamic filtering.
            </li>
            <li>
              <strong className="text-fg-2">Equipped Loadouts:</strong> 19-slot categorized CRPG equipment ledger with weighted AR, carry capacity, and multi-loadouts.
            </li>
            <li>
              <strong className="text-fg-2">Cloud Character Vault:</strong> Authentic save workstation (<code className="text-accent">#panel-vault</code>) and modal portal with OpenMW .omwsave import.
            </li>
            <li>
              <strong className="text-fg-2">SLT1 binary codec:</strong> ~96% compression for fast Cloudflare D1 cloud saves and offline-first local storage.
            </li>
          </ul>
        </section>

        {/* September 19, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-19">September 19, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>
              <strong className="text-fg-2">Character Level Simulator:</strong> Introduced an interactive leveling workstation framed in 6px ornate parchment with &quot;Stats Only&quot; and &quot;Stats &amp; Skills&quot; progression modes.
            </li>
            <li>
              <strong className="text-fg-2">1-Click optimization presets:</strong> Auto-Calculate Optimal Build, Rush Endurance (+5), Triple +5, and Efficient (+5/+5/+1 Luck).
            </li>
            <li>
              <strong className="text-fg-2">Training solver:</strong> Calculates exact miscellaneous training deficits required for 5x attribute multipliers each level.
            </li>
            <li>
              <strong className="text-fg-2">Health projection curve:</strong> Dynamic SVG chart contrasting optimal vs. delayed Endurance scaling.
            </li>
            <li>
              <strong className="text-fg-2">Four specialized workstations:</strong> Overhauled Enchanting, Spellmaking, Alchemy, and Travel into two-pane CRPG workstations consuming active character stats.
            </li>
            <li>
              <strong className="text-fg-2">Challenge Runs overhaul:</strong> Interactive card controls, deterministic seed engine, card locking, and conflict resolution validator.
            </li>
          </ul>
        </section>

        {/* September 18, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-18">September 18, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Next.js 16 with React 19 architecture, static export, and on-demand game data loading for Vanilla, Tamriel Rebuilt, and ARCE profiles.</li>
            <li>Rebuilt Character Planner in React: interactive Configurator, live Character Sheet, Premade Builds catalogue browser, and decoupled Gear Advisor.</li>
            <li>Art direction overhaul and 3-tier frame hierarchy with high-contrast gold focus outlines meeting WCAG AA standards.</li>
            <li>Cross-tool calculator integration: live character HUD banners reflecting Intelligence, Willpower, Luck, and fatigue.</li>
          </ul>
        </section>

        {/* September 17, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-17">September 17, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Enchanting calculator: effects, souls, Constant Effect rules, and named enchanters with barter pricing.</li>
            <li>Spellmaking calculator: magicka cost, cast chance, and spellmaker gold based on player skills.</li>
            <li>Alchemy calculator: named apparatus across 5 tiers, 4 ingredient slots, and potion preview.</li>
            <li>Travel optimizer: fewest hops transit network routing across Vvardenfell, Solstheim, and mainland Morrowind.</li>
          </ul>
        </section>

        {/* September 15, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-15">September 15, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Challenge run individual card locking and pinning with conflict resolution against overlapping restrictions.</li>
            <li>Starting spells and powers computation based on race, birthsign, and magic skills.</li>
            <li>Beast race gear filtering: Argonians and Khajiit receive open helmets and no footwear.</li>
            <li>Early-game gear rules: Steal early gear toggle and proximity ranking starting near Seyda Neen.</li>
          </ul>
        </section>

        {/* September 14, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-14">September 14, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>Place regions for gear locations and objectives read from game data.</li>
            <li>ARCE races and classes integration from ARCE 4.1 and Tamriel_Data.</li>
            <li>Shared sheet calculation between custom builder and challenge runs.</li>
          </ul>
        </section>

        {/* September 13, 2026 */}
        <section className="changelog-day bg-surface-7 p-4 border border-line-9">
          <h3 className="text-base font-serif text-accent mb-2 pb-1 border-b border-line-12">
            <time dateTime="2026-09-13">September 13, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-fg-7">
            <li>First public release of the build planner and challenge run generator.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
