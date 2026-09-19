"use client";
import { useEffect } from "react";

export default function LocalCharactersPanel() {
  // Mount legacy #local-characters into dedicated panel if available in DOM
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
    <div
      id="local-characters-box"
      className="local-characters-box mt-7 px-8 sm:px-10 py-5 text-sm"
      style={{
        border: "6px solid transparent",
        borderImage: "var(--mw-border) 6 repeat",
        background: "var(--surface, #181510)",
        boxShadow: "inset 0 0 12px 3px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.5)"
      }}
    >
      <div id="local-characters-slot" />
    </div>
  );
}
