"use client";
import { useShell } from "../shell-context";
import { useActiveCharacter } from "../character-context";

export default function ActiveSessionBanner({ onNavigate }) {
  let shell = null;
  try { shell = useShell(); } catch {}

  let charCtx = null;
  try { charCtx = useActiveCharacter(); } catch {}

  const build = charCtx?.build;
  const sheet = charCtx?.sheet;

  const navigateTo = (view) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (typeof window !== "undefined" && window.siltShell?.navigate) {
      window.siltShell.navigate(view);
    }
  };

  const openVaultModal = () => {
    if (typeof window !== "undefined") {
      const Evt = window.CustomEvent || CustomEvent;
      window.dispatchEvent(new Evt("silt-open-vault"));
    }
  };

  const profileLabel =
    shell?.profile === "tr_arce"
      ? "TR + ARCE"
      : shell?.profile === "tr"
      ? "Tamriel Rebuilt"
      : "Vanilla";

  const hasNamedBuild = Boolean(build?.name && build.name.trim());
  const displayName = hasNamedBuild
    ? build.name.trim()
    : `${build?.race || "Dark Elf"} ${build?.className || "Custom"}`;

  const health = sheet?.health ?? 45;
  const magicka = sheet?.magicka ?? 40;
  const fatigue = sheet?.fatigue ?? 160;

  return (
    <div
      className="mw-master-window p-4 sm:p-5 mb-6 text-fg-2"
      style={{
        background: "linear-gradient(180deg, var(--color-surface-9) 0%, var(--color-surface-3) 100%)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(0, 0, 0, 0.8)",
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Character Identity & Vitals */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] sm:text-xs font-serif font-bold uppercase tracking-widest px-2 py-0.5 bg-surface-20 border border-line-1 text-accent rounded-sm">
              Current Session
            </span>
            <span className="text-[10px] sm:text-xs font-serif px-2 py-0.5 bg-surface-14 border border-line-7 text-fg-11 rounded-sm">
              Profile: {profileLabel}
            </span>
            {build?.spec && (
              <span className="text-[10px] sm:text-xs font-serif px-2 py-0.5 bg-surface-14 border border-line-7 text-fg-6 rounded-sm">
                {build.spec} Focus
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-accent tracking-wide truncate">
            {displayName}
          </h2>

          <p className="text-xs sm:text-sm text-fg-11 font-serif mt-0.5">
            {build?.gender || "Male"} {build?.race || "Dark Elf"} · Class:{" "}
            <span className="text-fg-2">{build?.className || "Custom"}</span> · Sign:{" "}
            <span className="text-fg-2">{build?.sign || "The Lady"}</span>
          </p>

          {/* Vitals Summary Bar */}
          <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap text-xs font-serif">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-health inline-block border border-accent" />
              <span className="text-fg-11">Health:</span>
              <span className="font-mono font-bold text-fg-2">{health}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-magicka inline-block border border-accent" />
              <span className="text-fg-11">Magicka:</span>
              <span className="font-mono font-bold text-fg-2">{magicka}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-fatigue inline-block border border-accent" />
              <span className="text-fg-11">Fatigue:</span>
              <span className="font-mono font-bold text-fg-2">{fatigue}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => navigateTo("builder")}
            className="mw-btn py-2 px-3 sm:px-4 text-xs sm:text-sm font-serif font-bold text-accent hover:text-fg-1 whitespace-nowrap"
          >
            Resume Build Optimizer →
          </button>
          <button
            type="button"
            onClick={() => navigateTo("leveler")}
            className="mw-btn py-2 px-3 text-xs sm:text-sm font-serif font-bold whitespace-nowrap"
          >
            Level Simulator →
          </button>
          <button
            type="button"
            onClick={openVaultModal}
            className="mw-btn py-2 px-3 text-xs sm:text-sm font-serif font-bold text-fg-14 hover:text-accent whitespace-nowrap"
            title="Sync this character to Cloud Vault"
          >
            Cloud Vault
          </button>
        </div>
      </div>
    </div>
  );
}
