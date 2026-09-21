"use client";

export default function ColophonBulletin() {
  const navigateTo = (view) => {
    if (typeof window !== "undefined" && window.siltShell?.navigate) {
      window.siltShell.navigate(view);
    }
  };

  return (
    <footer
      className="home-hub-colophon p-4 sm:p-5 border border-line-9 bg-surface-2 text-fg-14 text-xs font-serif rounded"
      aria-label="Project Colophon & Credits"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-fg-11 font-bold tracking-wide">
            Silt Strider — Open-Source Morrowind Character Planner & Calculators
          </p>
          <p className="text-[11px] mt-1 text-fg-16 max-w-2xl leading-relaxed">
            Unofficial fan project. Game data read straight from Morrowind.esm, Tribunal.esm, Bloodmoon.esm, Tamriel_Data, and TR_Mainland (26.08 Poison Song). Typeface: Pelagiad by Isak Larborn.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => navigateTo("about")}
            className="text-accent hover:underline underline-offset-2"
          >
            About & Credits
          </button>
          <span className="text-fg-18">·</span>
          <button
            type="button"
            onClick={() => navigateTo("changelog")}
            className="text-accent hover:underline underline-offset-2"
          >
            Changelog
          </button>
          <span className="text-fg-18">·</span>
          <a
            href="https://ko-fi.com/tmarcalferreira"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline underline-offset-2"
          >
            Support on Ko-fi
          </a>
          <span className="text-fg-18">·</span>
          <a
            href="https://www.paypal.com/ncp/payment/CELX7C97ZJ2D6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline underline-offset-2"
          >
            PayPal
          </a>
        </div>
      </div>
    </footer>
  );
}
