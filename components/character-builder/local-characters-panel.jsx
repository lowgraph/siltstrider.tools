"use client";
import { useEffect } from "react";

export default function LocalCharactersPanel() {
  // Mount legacy #local-characters into dedicated container if available in DOM
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("local-characters");
    const slot = document.getElementById("local-characters-slot");
    if (el && slot && !slot.contains(el)) {
      slot.appendChild(el);
    }
    return () => {
      const custom = document.getElementById("custom");
      if (el && custom && slot && slot.contains(el)) {
        custom.insertBefore(el, custom.firstChild);
      }
    };
  }, []);

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
      <div id="local-characters-slot" />
    </div>
  );
}
