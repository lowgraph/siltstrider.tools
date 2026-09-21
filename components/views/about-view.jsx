"use client";

/**
 * AboutView: Native modern React implementation of the About Silt Strider panel.
 * Replaces legacy #panel-about markup with authentic CRPG styling.
 */
export default function AboutView() {
  return (
    <div className="about-view-root w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6" id="about-content">
      <div className="border-b border-accent pb-4">
        <h2 className="text-2xl md:text-3xl font-serif text-accent tracking-wide">About Silt Strider</h2>
        <p className="text-sm text-fg-11 mt-1 font-serif">Morrowind Build Planner &amp; Challenge Run Generator</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-fg-2">
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
              , or{" "}
              <a href="https://www.paypal.com/ncp/payment/CELX7C97ZJ2D6" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:text-fg-2">
                PayPal
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
