"use client";

/**
 * ChangelogView: Native modern React implementation of the Changelog panel.
 * Replaces legacy #panel-changelog markup with responsive CRPG ledger styling.
 */
export default function ChangelogView() {
  return (
    <div className="changelog-view-root w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6" id="changelog-content">
      <div className="border-b border-[#d4b06a] pb-4">
        <h2 className="text-2xl md:text-3xl font-serif text-[#d4b06a] tracking-wide">Changelog</h2>
        <p className="text-sm text-[#9e8b6b] mt-1 font-serif">What changed on Silt Strider, newest first.</p>
      </div>

      <div className="space-y-6 text-sm text-[#f3e6c8]">
        {/* September 21, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-21">September 21, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>
              <strong className="text-[#f3e6c8]">Underlying Architecture &amp; Shell Decoupling (Phase 12):</strong> Completed full architectural transition away from the legacy extraction harness towards a native, declarative React 19 / Next.js 16 layout.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Native React App Shell:</strong> Implemented <code className="text-[#d4b06a]">components/app-shell.jsx</code> mounting all 12 tools cleanly with zero DOM portal or legacy innerHTML dependencies.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Pure ESM Permalink Codec:</strong> Built universal UTF-8 Base64URL encoder/decoder and URL hash state engine in <code className="text-[#d4b06a]">lib/permalink-codec.mjs</code> supporting all 12 tools and preserving 100% backward compatibility with bookmarked links.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Challenge Engine Decoupling:</strong> Extracted card rolling, lock preservation, and conflict resolution into pure ESM <code className="text-[#d4b06a]">lib/challenge-engine.mjs</code>.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Asset Ingestion &amp; Design Tokens:</strong> Ingested Pelagiad font and Morrowind 9-slice border textures as native static assets with formal CSS variables.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Native React Views &amp; Footer:</strong> Converted remaining static panels (<code className="text-[#d4b06a]">#panel-about</code> and <code className="text-[#d4b06a]">#panel-changelog</code>) and site footer into responsive React components.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Build Pipeline Decoupling:</strong> Retired legacy prebuild extraction hooks, reducing Next.js production build compile time to under 600ms.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Dynamic Best-In-Slot Resolution:</strong> Repointed late-game gear recommendations to dynamically consume <code className="text-[#d4b06a]">public/game-data/current.json</code> with synthetic fixture fallbacks for CI.
            </li>
          </ul>
        </section>

        {/* September 20, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-20">September 20, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>
              <strong className="text-[#f3e6c8]">Faction Journal &amp; Promotion Deficit Engine:</strong> Full workstation tracking memberships, FADT rank requirements, promotion deficits, mutual exclusions (Great Houses &amp; Vampire Clans), and inter-faction diplomacy.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Live bundle data:</strong> Wired Enchanting, Spellmaking, Alchemy, and Travel to content-addressed catalogs with live badges.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Gear Advisor:</strong> Added &quot;Near starting areas&quot; policy toggle alongside Steal and Endgame with dynamic filtering.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Equipped Loadouts:</strong> 19-slot categorized CRPG equipment ledger with weighted AR, carry capacity, and multi-loadouts.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Cloud Character Vault:</strong> Authentic save workstation (<code className="text-[#d4b06a]">#panel-vault</code>) and modal portal with OpenMW .omwsave import.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">SLT1 binary codec:</strong> ~96% compression for fast Cloudflare D1 cloud saves and offline-first local storage.
            </li>
          </ul>
        </section>

        {/* September 19, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-19">September 19, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>
              <strong className="text-[#f3e6c8]">Character Level Simulator:</strong> Introduced an interactive leveling workstation framed in 6px ornate parchment with &quot;Stats Only&quot; and &quot;Stats &amp; Skills&quot; progression modes.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">1-Click optimization presets:</strong> Auto-Calculate Optimal Build, Rush Endurance (+5), Triple +5, and Efficient (+5/+5/+1 Luck).
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Training solver:</strong> Calculates exact miscellaneous training deficits required for 5x attribute multipliers each level.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Health projection curve:</strong> Dynamic SVG chart contrasting optimal vs. delayed Endurance scaling.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Four specialized workstations:</strong> Overhauled Enchanting, Spellmaking, Alchemy, and Travel into two-pane CRPG workstations consuming active character stats.
            </li>
            <li>
              <strong className="text-[#f3e6c8]">Challenge Runs overhaul:</strong> Interactive card controls, deterministic seed engine, card locking, and conflict resolution validator.
            </li>
          </ul>
        </section>

        {/* September 18, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-18">September 18, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>Next.js 16 with React 19 architecture, static export, and on-demand game data loading for Vanilla, Tamriel Rebuilt, and ARCE profiles.</li>
            <li>Rebuilt Character Planner in React: interactive Configurator, live Character Sheet, Premade Builds catalogue browser, and decoupled Gear Advisor.</li>
            <li>Art direction overhaul and 3-tier frame hierarchy with high-contrast gold focus outlines meeting WCAG AA standards.</li>
            <li>Cross-tool calculator integration: live character HUD banners reflecting Intelligence, Willpower, Luck, and fatigue.</li>
          </ul>
        </section>

        {/* September 17, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-17">September 17, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>Enchanting calculator: effects, souls, Constant Effect rules, and named enchanters with barter pricing.</li>
            <li>Spellmaking calculator: magicka cost, cast chance, and spellmaker gold based on player skills.</li>
            <li>Alchemy calculator: named apparatus across 5 tiers, 4 ingredient slots, and potion preview.</li>
            <li>Travel optimizer: fewest hops transit network routing across Vvardenfell, Solstheim, and mainland Morrowind.</li>
          </ul>
        </section>

        {/* September 15, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-15">September 15, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>Challenge run individual card locking and pinning with conflict resolution against overlapping restrictions.</li>
            <li>Starting spells and powers computation based on race, birthsign, and magic skills.</li>
            <li>Beast race gear filtering: Argonians and Khajiit receive open helmets and no footwear.</li>
            <li>Early-game gear rules: Steal early gear toggle and proximity ranking starting near Seyda Neen.</li>
          </ul>
        </section>

        {/* September 14, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-14">September 14, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>Place regions for gear locations and objectives read from game data.</li>
            <li>ARCE races and classes integration from ARCE 4.1 and Tamriel_Data.</li>
            <li>Shared sheet calculation between custom builder and challenge runs.</li>
          </ul>
        </section>

        {/* September 13, 2026 */}
        <section className="changelog-day bg-[#181510] p-4 border border-[#332717]">
          <h3 className="text-base font-serif text-[#d4b06a] mb-2 pb-1 border-b border-[#231b11]">
            <time dateTime="2026-09-13">September 13, 2026</time>
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#c9b897]">
            <li>First public release of the build planner and challenge run generator.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
