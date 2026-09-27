"use client";

export default function LocalCharactersPanel() {
  return (
    <div className="local-characters-container mt-7 space-y-2">
      <div className="flex items-center justify-between border-b border-line-11 pb-2">
        <span className="text-xs uppercase tracking-widest text-accent font-serif font-bold">
          Saved Characters
        </span>
        <button
          type="button"
          id="btn-open-cloud-vault"
          className="mw-btn px-3 py-1 text-xs font-serif font-bold text-accent"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("silt-open-vault"));
            }
          }}
          title="Open Cloud Character Vault"
        >
          Cloud Vault
        </button>
      </div>
    </div>
  );
}
