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
    <div className="local-characters-container mt-7">
      <div id="local-characters-slot" />
    </div>
  );
}
