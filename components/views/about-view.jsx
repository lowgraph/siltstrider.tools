"use client";

/**
 * AboutView: Native modern React implementation of the About Silt Strider panel.
 * Replaces legacy #panel-about markup with authentic CRPG styling.
 */
export default function AboutView() {
  return (
    <div className="about-view-root w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6" id="about-content">
      <div className="border-b border-accent pb-4">
        <h2 className="text-2xl md:text-3xl font-serif text-accent tracking-wide">About Silt Strider Tools</h2>
        <p className="text-sm text-fg-11 mt-1 font-serif">Morrowind Build Planner &amp; Challenge Run Generator</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-fg-2">
        <div className="about-disambiguation space-y-2 bg-surface-7 p-4 border border-line-9 rounded-none">
          <h3 className="text-base font-serif text-accent mb-1">Disambiguation</h3>
          <p className="text-xs text-fg-7 leading-relaxed">
            <strong className="text-fg-2">Silt Strider Tools</strong> (<a href="https://siltstrider.tools" className="text-accent underline hover:text-fg-2">siltstrider.tools</a>) is an independent web companion, character builder, and game calculation toolbox for single-player <em>The Elder Scrolls III: Morrowind</em> and <em>OpenMW</em>.
          </p>
          <p className="text-xs text-fg-7 leading-relaxed">
            It is completely separate and not affiliated with the multiplayer roleplay server project <em>Tales from Nirn: Silt Strider</em> on TES3MP. If you are looking for their persistent roleplay server and modpack, visit <a href="https://siltstrider.com" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-fg-2">siltstrider.com</a>.
          </p>
        </div>

        <div className="about-legal space-y-3 bg-surface-7 p-4 border border-line-9 rounded-none">
          <p>
            Silt Strider is an unofficial fan project. It is neither directly nor indirectly affiliated with, endorsed by, or sponsored by Bethesda Softworks, Bethesda Game Studios, or ZeniMax Media.
          </p>
          <p>
            It exists as a free reference and planning aid for players of The Elder Scrolls III: Morrowind. It is not intended to infringe upon the copyrights of Bethesda Game Studios or its parent and affiliate companies, and reproduces no game assets, art, audio, or text.
          </p>
          <p>
            Races, classes, birthsigns, skills and gear are checked against data read straight from the game files: Morrowind, Tribunal and Bloodmoon, and for Tamriel Rebuilt, Tamriel_Data and TR_Mainland (26.08 Poison Song). Restrictions and objectives are human curated.
          </p>
          <p className="text-xs text-fg-11 border-t border-line-12 pt-3">
            The Elder Scrolls III: Morrowind® (Tribunal, Bloodmoon) was developed by Bethesda Game Studios LLC, a ZeniMax Media company. ZeniMax, The Elder Scrolls, Morrowind, Tribunal, Bloodmoon, Bethesda Softworks and related logos are registered trademarks or trademarks of ZeniMax Media Inc. in the US and/or other countries. All Rights Reserved.
          </p>
        </div>

        <div className="about-mechanics space-y-4 bg-surface-7 p-4 border border-line-9 rounded-none">
          <div>
            <h3 className="text-base font-serif text-accent mb-2">System Accuracy &amp; Game Mechanics</h3>
            <p className="text-xs text-fg-7 leading-relaxed">
              Calculations across Silt Strider reflect verified engine source code transcribed directly from OpenMW 0.51.0 (<span className="font-mono text-accent">apps/openmw/mwmechanics/</span>). Game math is evaluated using exact engine algorithms rather than approximations:
            </p>
            <ul className="list-disc list-inside text-xs text-fg-7 space-y-1.5 mt-2.5 leading-relaxed">
              <li>
                <strong className="text-fg-2">Alchemy:</strong> Mortar and pestle quality sets base potion strength and duration; the Retort amplifies positive effects, the Alembic suppresses negative side-effects, and the Calcinator magnifies all effect magnitudes. Brew chance scales directly with Alchemy skill, Intelligence, and Luck.
              </li>
              <li>
                <strong className="text-fg-2">Level Progression:</strong> Health gains on level-up are strictly non-retroactive, calculated as 10% of current Endurance (<span className="font-mono text-accent">⌊Endurance / 10⌋</span>). Governing skill increases generate 2× to 5× attribute multipliers (10 skill increases for a 5× multiplier) up to the 100 attribute cap.
              </li>
              <li>
                <strong className="text-fg-2">Travel Routing:</strong> A shortest-path search finds the fewest legs, the cheapest fare or the fastest trip across silt striders, boats, river striders, and Guild Guides. Fares and travel hours follow OpenMW&apos;s travel window and your character&apos;s haggling, and the search accounts for Mages Guild membership and rank requirements.
              </li>
              <li>
                <strong className="text-fg-2">Spellcraft:</strong> Magicka costs derive from effect base cost, magnitude, duration, area, and range. Casting success chance accurately evaluates governing magic skill, Willpower, Luck, and fatigue state.
              </li>
              <li>
                <strong className="text-fg-2">Enchanting:</strong> Enchantment point capacity, soul gem charges, and constant effect thresholds (strictly requiring 400+ soul capacity, such as Golden Saints or Ascended Sleepers) match engine formulas, alongside barter pricing and self-enchant success chance.
              </li>
            </ul>
          </div>

          <div className="border-t border-line-12 pt-3">
            <h4 className="text-sm font-serif text-accent mb-1">Multi-World Coverage &amp; Privacy</h4>
            <p className="text-xs text-fg-7 leading-relaxed">
              Full data pipeline support is provided for The Elder Scrolls III: Morrowind (Tribunal, Bloodmoon), Tamriel Rebuilt 26.08 (Poison Song), and ARCE.
            </p>
            <p className="text-xs text-fg-7 mt-1.5 leading-relaxed">
              OpenMW save inspection (<span className="font-mono text-accent">.omwsave</span>) and character permalink sharing are zero-tracking and strictly client-side. All binary parsing and progression planning take place in your browser—no saves or character data are ever sent to an external server.
            </p>
          </div>
        </div>

        <div className="about-credits space-y-4 bg-surface-7 p-4 border border-line-9 rounded-none">
          <div>
            <h3 className="text-base font-serif text-accent mb-1">Credits</h3>
            <p className="text-xs text-fg-7">Typeface: Pelagiad by Isak Larborn, used under the SIL Open Font License 1.1.</p>
            <p className="text-xs text-fg-7 mt-1">
              Game data: read from Morrowind.esm, Tribunal.esm, Bloodmoon.esm, Tamriel_Data.esm and TR_Mainland.esm. References: the Unofficial Elder Scrolls Pages (UESP) and tamriel-rebuilt.org.
            </p>
            <p className="text-xs text-fg-7 mt-1">
              Tamriel Rebuilt and ARCE are community projects by their respective teams; Silt Strider supports them but is not affiliated with either.
            </p>
          </div>

          <div className="border-t border-line-12 pt-3">
            <h3 className="text-base font-serif text-accent mb-1">Colophon</h3>
            <p className="text-xs text-fg-7">
              The site&apos;s code was written with AI assistance. Builds and gear recommendations are checked by script against data read from the game files. Restrictions and objectives are human curated.
            </p>
          </div>

          <div className="border-t border-line-12 pt-3">
            <h3 className="text-base font-serif text-accent mb-1">Corrections</h3>
            <p className="text-xs text-fg-7">
              Spotted a mistake? Email <a href="mailto:tmarcalferreira@gmail.com" className="text-accent underline hover:text-fg-2">tmarcalferreira@gmail.com</a>.
            </p>
          </div>

          <div className="border-t border-line-12 pt-3">
            <h3 className="text-base font-serif text-accent mb-1">Support</h3>
            <p className="text-xs text-fg-7">
              Hosting and tools cost roughly $60/year. If the site is useful to you, a donation helps cover it:{" "}
              <a href="https://ko-fi.com/tmarcalferreira" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-fg-2">
                Ko-fi
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
