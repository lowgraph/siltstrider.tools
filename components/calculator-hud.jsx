"use client";
import { useEffect, useState, useCallback } from "react";
import { useActiveCharacter } from "./character-context";
import { useShell } from "./shell-context";
export { CharacterProvider, useActiveCharacter } from "./character-context";

export function EnchantingHud() {
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const [currentStats, setCurrentStats] = useState({ skill: 50, int: 40, luck: 40, soul: 400, type: "used" });

  const readDom = useCallback(() => {
    if (typeof document === "undefined") return;
    const skill = +document.getElementById("enc-skill")?.value || 50;
    const int = +document.getElementById("enc-int")?.value || 40;
    const luck = +document.getElementById("enc-luck")?.value || 40;
    const soul = +document.getElementById("enc-soul")?.value || 400;
    const type = document.getElementById("enc-type")?.value || "used";
    setCurrentStats({ skill, int, luck, soul, type });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    readDom();
    const ids = ["enc-skill", "enc-int", "enc-luck", "enc-soul", "enc-type"];
    const handler = () => readDom();
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
      }
    });
    return () => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.removeEventListener("input", handler);
          el.removeEventListener("change", handler);
        }
      });
    };
  }, [readDom]);

  const baseSkill = sheet?.skills?.["Enchant"]?.v ?? 15;
  const baseInt = sheet?.attributes?.["Intelligence"]?.v ?? 40;
  const baseLuck = sheet?.attributes?.["Luck"]?.v ?? 40;

  const isCe = currentStats.type === "const";
  const ceSoulOk = currentStats.soul >= 400;
  const ceSkillTarget = currentStats.skill >= 100;

  return (
    <div
      className="p-3 mb-4 space-y-2.5 text-sm mw-groove-panel"
      style={{
        border: "2px solid transparent",
        borderImage: "var(--mw-groove) 2 repeat",
        background: "#120f0a"
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e2417] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-[#d4b06a] uppercase tracking-wider text-xs">
            Active Character:
          </span>
          <span className="font-bold text-[#f2e6cb]">
            {build.race} {build.className}
          </span>
        </div>
        <button
          type="button"
          onClick={() => syncToCalculators()}
          className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-[#d4b06a] hover:text-[#f2e6cb] transition-colors"
          title="Reset input fields to active character's level 1 base stats"
        >
          ↺ Ingest Base Character Stats
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#b8a280]">
        <div>
          <span className="text-[#9e8b6b]">Enchant Base: </span>
          <strong className="text-[#f2e6cb]">{baseSkill}</strong>
          {currentStats.skill !== baseSkill && (
            <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentStats.skill})</span>
          )}
        </div>
        <div>
          <span className="text-[#9e8b6b]">INT Base: </span>
          <strong className="text-[#f2e6cb]">{baseInt}</strong>
          {currentStats.int !== baseInt && (
            <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentStats.int})</span>
          )}
        </div>
        <div>
          <span className="text-[#9e8b6b]">LUC Base: </span>
          <strong className="text-[#f2e6cb]">{baseLuck}</strong>
          {currentStats.luck !== baseLuck && (
            <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentStats.luck})</span>
          )}
        </div>
      </div>

      {isCe && (
        <div className="pt-1.5 border-t border-[#2e2417] flex flex-wrap items-center gap-2 text-xs">
          <span className="font-serif font-bold text-[#d4b06a]">Constant Effect Cap:</span>
          <span
            className={`px-2 py-0.5 border font-mono font-bold ${
              ceSoulOk
                ? "bg-[#182613] border-[#315723] text-[#78d46a]"
                : "bg-[#2b1414] border-[#5e2727] text-[#d46a6a]"
            }`}
          >
            Soul: {currentStats.soul}/400 {ceSoulOk ? "✓" : "✗ (Too Small)"}
          </span>
          <span
            className={`px-2 py-0.5 border font-mono font-bold ${
              ceSkillTarget
                ? "bg-[#182613] border-[#315723] text-[#78d46a]"
                : "bg-[#2b1f14] border-[#5e4327] text-[#d4a86a]"
            }`}
          >
            Enchant: {currentStats.skill}/100 {ceSkillTarget ? "✓ Mastered" : "(Self-Enchanting CE Unreliable)"}
          </span>
        </div>
      )}
    </div>
  );
}

export function SpellmakingHud() {
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const [currentData, setCurrentData] = useState({ wil: 40, luck: 40, castChance: null, school: "" });

  const readDom = useCallback(() => {
    if (typeof document === "undefined") return;
    const wil = +document.getElementById("spl-wil")?.value || 40;
    const luck = +document.getElementById("spl-luck")?.value || 40;

    // Read calculated cast chance from summary if present
    const out = document.getElementById("spl-out");
    let castChance = null;
    let school = "";
    if (out) {
      const match = out.textContent.match(/Cast chance [^0-9]*([0-9]+)%/i);
      if (match) castChance = parseInt(match[1], 10);
      const schMatch = out.textContent.match(/Effective school([A-Za-z]+)/i);
      if (schMatch) school = schMatch[1];
    }
    setCurrentData({ wil, luck, castChance, school });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    readDom();
    const ids = ["spl-alt", "spl-con", "spl-des", "spl-ill", "spl-mys", "spl-res", "spl-wil", "spl-luck"];
    const handler = () => readDom();
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
      }
    });
    const out = document.getElementById("spl-out");
    const obs = out ? new MutationObserver(handler) : null;
    if (obs && out) obs.observe(out, { childList: true, subtree: true, characterData: true });

    return () => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.removeEventListener("input", handler);
          el.removeEventListener("change", handler);
        }
      });
      if (obs) obs.disconnect();
    };
  }, [readDom]);

  const baseWil = sheet?.attributes?.["Willpower"]?.v ?? 40;
  const baseLuck = sheet?.attributes?.["Luck"]?.v ?? 40;

  const reliability =
    currentData.castChance === null
      ? null
      : currentData.castChance >= 75
      ? { label: "Highly Reliable", color: "border-[#315723] bg-[#182613] text-[#78d46a]" }
      : currentData.castChance >= 30
      ? { label: "Risky", color: "border-[#5e4327] bg-[#2b1f14] text-[#d4a86a]" }
      : { label: "Uncastable", color: "border-[#5e2727] bg-[#2b1414] text-[#d46a6a]" };

  return (
    <div
      className="p-3 mb-4 space-y-2.5 text-sm mw-groove-panel"
      style={{
        border: "2px solid transparent",
        borderImage: "var(--mw-groove) 2 repeat",
        background: "#120f0a"
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e2417] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-[#d4b06a] uppercase tracking-wider text-xs">
            Active Character:
          </span>
          <span className="font-bold text-[#f2e6cb]">
            {build.race} {build.className}
          </span>
        </div>
        <button
          type="button"
          onClick={() => syncToCalculators()}
          className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-[#d4b06a] hover:text-[#f2e6cb] transition-colors"
          title="Reset input fields to active character's level 1 base stats"
        >
          ↺ Ingest Base Character Stats
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#b8a280]">
          <div>
            <span className="text-[#9e8b6b]">WIL Base: </span>
            <strong className="text-[#f2e6cb]">{baseWil}</strong>
            {currentData.wil !== baseWil && (
              <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentData.wil})</span>
            )}
          </div>
          <div>
            <span className="text-[#9e8b6b]">LUC Base: </span>
            <strong className="text-[#f2e6cb]">{baseLuck}</strong>
            {currentData.luck !== baseLuck && (
              <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentData.luck})</span>
            )}
          </div>
        </div>

        {reliability && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-bold text-[#8a7a5e]">Spell Reliability:</span>
            <span className={`px-2.5 py-0.5 border font-mono font-bold text-xs ${reliability.color}`}>
              {reliability.label} ({currentData.castChance}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function AlchemyHud() {
  const { build, sheet, syncToCalculators } = useActiveCharacter();
  const [currentData, setCurrentData] = useState({ skill: 50, int: 40, luck: 40, chance: 58 });

  const readDom = useCallback(() => {
    if (typeof document === "undefined") return;
    const skill = +document.getElementById("alc-skill")?.value || 50;
    const int = +document.getElementById("alc-int")?.value || 40;
    const luck = +document.getElementById("alc-luck")?.value || 40;
    const chance = Math.max(0, Math.min(100, Math.round(skill + 0.1 * int + 0.1 * luck)));
    setCurrentData({ skill, int, luck, chance });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    readDom();
    const ids = ["alc-skill", "alc-int", "alc-luck"];
    const handler = () => readDom();
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
      }
    });
    return () => {
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.removeEventListener("input", handler);
          el.removeEventListener("change", handler);
        }
      });
    };
  }, [readDom]);

  const baseSkill = sheet?.skills?.["Alchemy"]?.v ?? 15;
  const baseInt = sheet?.attributes?.["Intelligence"]?.v ?? 40;
  const baseLuck = sheet?.attributes?.["Luck"]?.v ?? 40;

  return (
    <div
      className="p-3 mb-4 space-y-2.5 text-sm mw-groove-panel"
      style={{
        border: "2px solid transparent",
        borderImage: "var(--mw-groove) 2 repeat",
        background: "#120f0a"
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e2417] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-[#d4b06a] uppercase tracking-wider text-xs">
            Active Character:
          </span>
          <span className="font-bold text-[#f2e6cb]">
            {build.race} {build.className}
          </span>
        </div>
        <button
          type="button"
          onClick={() => syncToCalculators()}
          className="mw-btn px-2.5 py-1 text-xs font-serif font-bold text-[#d4b06a] hover:text-[#f2e6cb] transition-colors"
          title="Reset input fields to active character's level 1 base stats"
        >
          ↺ Ingest Base Character Stats
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#b8a280]">
          <div>
            <span className="text-[#9e8b6b]">Alchemy Base: </span>
            <strong className="text-[#f2e6cb]">{baseSkill}</strong>
            {currentData.skill !== baseSkill && (
              <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentData.skill})</span>
            )}
          </div>
          <div>
            <span className="text-[#9e8b6b]">INT Base: </span>
            <strong className="text-[#f2e6cb]">{baseInt}</strong>
            {currentData.int !== baseInt && (
              <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentData.int})</span>
            )}
          </div>
          <div>
            <span className="text-[#9e8b6b]">LUC Base: </span>
            <strong className="text-[#f2e6cb]">{baseLuck}</strong>
            {currentData.luck !== baseLuck && (
              <span className="text-[#d4b06a] ml-1 font-mono">(Testing: {currentData.luck})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-serif font-bold text-[#9e8b6b]">Brew Success:</span>
          <span
            className={`px-2.5 py-0.5 border font-mono font-bold text-xs ${
              currentData.chance >= 75
                ? "border-[#315723] bg-[#182613] text-[#78d46a]"
                : currentData.chance >= 40
                ? "border-[#5e4327] bg-[#2b1f14] text-[#d4a86a]"
                : "border-[#5e2727] bg-[#2b1414] text-[#d46a6a]"
            }`}
          >
            {currentData.chance}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TravelHud() {
  const { build } = useActiveCharacter();
  const shell = useShell();

  const setOrigin = (town) => {
    if (typeof document === "undefined") return;
    const sel = document.getElementById("trv-from");
    if (sel) {
      sel.value = town;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const isTr = shell.world === "tr";

  return (
    <div
      className="p-3 mb-4 space-y-2.5 text-sm mw-groove-panel"
      style={{
        border: "2px solid transparent",
        borderImage: "var(--mw-groove) 2 repeat",
        background: "#120f0a"
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2e2417] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-[#d4b06a] uppercase tracking-wider text-xs">
            Character Origin:
          </span>
          <span className="font-bold text-[#f2e6cb]">
            {build.race} ({isTr ? "Tamriel Rebuilt" : "Vvardenfell"})
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#9e8b6b] font-serif font-bold">Quick Start Origin:</span>
        <button
          type="button"
          onClick={() => setOrigin("Seyda Neen")}
          className="mw-btn px-2 py-0.5 text-xs text-[#d4b06a] hover:text-[#f2e6cb]"
        >
          📍 Seyda Neen (Arrival)
        </button>
        <button
          type="button"
          onClick={() => setOrigin("Balmora")}
          className="mw-btn px-2 py-0.5 text-xs text-[#d4b06a] hover:text-[#f2e6cb]"
        >
          📍 Balmora (Hub)
        </button>
        <button
          type="button"
          onClick={() => setOrigin("Vivec")}
          className="mw-btn px-2 py-0.5 text-xs text-[#d4b06a] hover:text-[#f2e6cb]"
        >
          📍 Vivec
        </button>
        {isTr && (
          <button
            type="button"
            onClick={() => setOrigin("Old Ebonheart")}
            className="mw-btn px-2 py-0.5 text-xs text-[#d4b06a] hover:text-[#f2e6cb]"
          >
            📍 Old Ebonheart (TR)
          </button>
        )}
      </div>
    </div>
  );
}
