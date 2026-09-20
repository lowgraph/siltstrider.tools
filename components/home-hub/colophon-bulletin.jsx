"use client";

export default function ColophonBulletin() {
  const navigateTo = (view) => {
    if (typeof window !== "undefined" && window.siltShell?.navigate) {
      window.siltShell.navigate(view);
    }
  };

  return (
    <footer
      className="home-hub-colophon p-4 sm:p-5 border border-[#382b19] bg-[#120f0a] text-[#8c7853] text-xs font-serif rounded"
      aria-label="Project Colophon & Credits"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#a09070] font-bold tracking-wide">
            Silt Strider — Open-Source Morrowind Character Planner & Calculators
          </p>
          <p className="text-[11px] mt-1 text-[#6e5833] max-w-2xl leading-relaxed">
            Unofficial fan project. Game data read straight from Morrowind.esm, Tribunal.esm, Bloodmoon.esm, Tamriel_Data, and TR_Mainland (26.08 Poison Song). Typeface: Pelagiad by Isak Larborn.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => navigateTo("about")}
            className="text-[#d4b06a] hover:underline underline-offset-2"
          >
            About & Credits
          </button>
          <span className="text-[#4a3b25]">·</span>
          <button
            type="button"
            onClick={() => navigateTo("changelog")}
            className="text-[#d4b06a] hover:underline underline-offset-2"
          >
            Changelog
          </button>
          <span className="text-[#4a3b25]">·</span>
          <a
            href="https://ko-fi.com/tmarcalferreira"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4b06a] hover:underline underline-offset-2"
          >
            Support on Ko-fi
          </a>
          <span className="text-[#4a3b25]">·</span>
          <a
            href="https://www.paypal.com/ncp/payment/CELX7C97ZJ2D6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4b06a] hover:underline underline-offset-2"
          >
            PayPal
          </a>
        </div>
      </div>
    </footer>
  );
}
